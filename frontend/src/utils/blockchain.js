import { ethers } from "ethers";

const CONTRACT_ABI = [
  "function addProduct(uint256 id, string name)",
  "function addStage(uint256 id, string stage)",
  "function getHistory(uint256 id) view returns (string[] memory)",
];

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 1337);
const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || "Ganache Local";
const RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  import.meta.env.VITE_MUMBAI_RPC_URL ||
  "http://127.0.0.1:7545";

const PLACEHOLDER_ADDRESSES = new Set([
  "0xYourPolygonMumbaiContractAddress",
  "0xYourGanacheContractAddress",
]);

function ensureContractConfig() {
  if (
    !CONTRACT_ADDRESS ||
    PLACEHOLDER_ADDRESSES.has(CONTRACT_ADDRESS) ||
    !ethers.isAddress(CONTRACT_ADDRESS)
  ) {
    throw new Error("Please add the product contract address in app settings.");
  }

  if (!Number.isInteger(CHAIN_ID) || CHAIN_ID <= 0) {
    throw new Error("Please set a valid chain ID in app settings.");
  }
}

async function getWritableContext() {
  ensureContractConfig();

  if (!window.ethereum) {
    throw new Error("Please install MetaMask to continue.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error(`Please switch your wallet to ${NETWORK_NAME}.`);
  }

  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();

  return {
    contract: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer),
    chainId: Number(network.chainId),
    walletAddress,
  };
}

function buildChainProof(tx, receipt, chainId, walletAddress) {
  const txHash = String(tx?.hash || "");
  if (!txHash) {
    throw new Error("Missing transaction hash from wallet confirmation.");
  }

  return {
    txHash,
    blockNumber: Number(receipt?.blockNumber ?? 0),
    chainId,
    contractAddress: CONTRACT_ADDRESS,
    walletAddress,
  };
}

function getReadableContract() {
  ensureContractConfig();

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function addProductOnChain(productId, name) {
  const { contract, chainId, walletAddress } = await getWritableContext();
  const tx = await contract.addProduct(Number(productId), name);
  const receipt = await tx.wait();
  return buildChainProof(tx, receipt, chainId, walletAddress);
}

export async function addStageOnChain(productId, stage) {
  const { contract, chainId, walletAddress } = await getWritableContext();
  const tx = await contract.addStage(Number(productId), stage);
  const receipt = await tx.wait();
  return buildChainProof(tx, receipt, chainId, walletAddress);
}

export async function getHistoryFromChain(productId) {
  const contract = getReadableContract();
  const history = await contract.getHistory(Number(productId));
  return Array.isArray(history) ? history : [];
}

export function toFriendlyError(error, fallbackMessage) {
  if (error?.code === 4001) {
    return "Action canceled.";
  }

  const message = String(error?.message || "");
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("product contract address")) {
    return "Please set contract address in frontend settings.";
  }

  if (lowerMessage.includes("switch your wallet")) {
    return `Please switch wallet to ${NETWORK_NAME}.`;
  }

  if (lowerMessage.includes("valid chain id")) {
    return "Please set a valid chain ID in frontend settings.";
  }

  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("action rejected")
  ) {
    return "Action canceled.";
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (lowerMessage.includes("metamask")) {
    return "Please install MetaMask to continue.";
  }

  if (lowerMessage.includes("insufficient funds")) {
    return "Wallet balance is low. Please add test funds and try again.";
  }

  if (lowerMessage.includes("not authorized to write")) {
    return "This wallet is not allowed to update the contract yet.";
  }

  return fallbackMessage;
}
