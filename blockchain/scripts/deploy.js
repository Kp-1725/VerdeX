const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:7545";
const EXPECTED_CHAIN_ID = Number(process.env.CHAIN_ID || 1337);
const WRITER_ADDRESSES = String(process.env.WRITER_ADDRESSES || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const CONTRACT_SOURCE_FILE = "VerdeX.sol";
const CONTRACT_NAME = "VerdeX";
const ARTIFACT_FILE = "VerdeX.json";

function compileContract(contractPath, sourceFile, contractName) {
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      [sourceFile]: { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors && output.errors.length > 0) {
    const fatalErrors = output.errors.filter((err) => err.severity === "error");
    if (fatalErrors.length > 0) {
      const details = fatalErrors.map((err) => err.formattedMessage).join("\n");
      throw new Error(`Solidity compilation failed:\n${details}`);
    }
  }

  const compiled = output.contracts[sourceFile][contractName];
  return {
    abi: compiled.abi,
    bytecode: compiled.evm.bytecode.object,
  };
}

function updateFrontendEnv(contractAddress) {
  const envPath = path.resolve(__dirname, "..", "..", "frontend", ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);
  let found = false;

  const updated = lines.map((line) => {
    if (line.startsWith("VITE_CONTRACT_ADDRESS=")) {
      found = true;
      return `VITE_CONTRACT_ADDRESS=${contractAddress}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  }

  fs.writeFileSync(envPath, `${updated.join("\n")}\n`, "utf8");
}

async function main() {
  const contractPath = path.resolve(
    __dirname,
    "..",
    "contracts",
    CONTRACT_SOURCE_FILE,
  );
  const { abi, bytecode } = compileContract(
    contractPath,
    CONTRACT_SOURCE_FILE,
    CONTRACT_NAME,
  );

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong chain id. Expected ${EXPECTED_CHAIN_ID}, got ${chainId}.`,
    );
  }

  const signer = await provider.getSigner(0);
  const deployer = await signer.getAddress();

  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  for (const writer of WRITER_ADDRESSES) {
    if (
      !ethers.isAddress(writer) ||
      writer.toLowerCase() === deployer.toLowerCase()
    ) {
      continue;
    }

    const writerTx = await contract.setWriter(writer, true);
    await writerTx.wait();
    console.log(`Writer authorized: ${writer}`);
  }

  const artifact = {
    contractName: CONTRACT_NAME,
    address,
    chainId,
    deployer,
    abi,
  };

  const artifactPath = path.resolve(
    __dirname,
    "..",
    "artifacts",
    ARTIFACT_FILE,
  );
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");

  updateFrontendEnv(address);

  console.log(`Deployer: ${deployer}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Contract deployed at: ${address}`);
  console.log(`Artifact saved to: ${artifactPath}`);
  console.log("frontend/.env updated with VITE_CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
