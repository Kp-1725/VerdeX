const { ethers } = require("ethers");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:7545";
const EXPECTED_CHAIN_ID = Number(process.env.CHAIN_ID || 1337);
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const WRITER_ADDRESS = process.env.WRITER_ADDRESS;
const IS_ALLOWED =
  String(process.env.IS_ALLOWED || "true").toLowerCase() !== "false";

async function main() {
  if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Please set a valid CONTRACT_ADDRESS in blockchain/.env");
  }

  if (!WRITER_ADDRESS || !ethers.isAddress(WRITER_ADDRESS)) {
    throw new Error("Please set a valid WRITER_ADDRESS in blockchain/.env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong chain id. Expected ${EXPECTED_CHAIN_ID}, got ${chainId}.`,
    );
  }

  const signer = await provider.getSigner(0);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ["function setWriter(address account, bool isAllowed) external"],
    signer,
  );

  const tx = await contract.setWriter(WRITER_ADDRESS, IS_ALLOWED);
  await tx.wait();

  console.log(
    `Writer ${IS_ALLOWED ? "granted" : "revoked"}: ${WRITER_ADDRESS}`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
