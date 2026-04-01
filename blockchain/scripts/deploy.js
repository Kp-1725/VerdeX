const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:7545";
const EXPECTED_CHAIN_ID = Number(process.env.CHAIN_ID || 1337);

function compileContract(contractPath, contractName) {
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "AgriTraceability.sol": { content: source },
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

  const compiled = output.contracts["AgriTraceability.sol"][contractName];
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
    "AgriTraceability.sol",
  );
  const { abi, bytecode } = compileContract(contractPath, "AgriTraceability");

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

  const artifact = {
    contractName: "AgriTraceability",
    address,
    chainId,
    deployer,
    abi,
  };

  const artifactPath = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "AgriTraceability.json",
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
