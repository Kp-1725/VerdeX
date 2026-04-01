const { ethers } = require("ethers");

const CONTRACT_ABI = [
  "event ProductAdded(uint256 indexed id, string name)",
  "event StageAdded(uint256 indexed id, string stage)",
];

const contractInterface = new ethers.Interface(CONTRACT_ABI);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function resolveMode() {
  const rawMode = String(process.env.CHAIN_VERIFICATION_MODE || "live")
    .trim()
    .toLowerCase();

  if (["live", "auto", "off"].includes(rawMode)) {
    return rawMode;
  }

  return "live";
}

function parseChainId() {
  const parsed = Number(
    process.env.CHAIN_ID || process.env.BLOCKCHAIN_CHAIN_ID,
  );
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function getConfig(mode) {
  const rpcUrl = String(
    process.env.CHAIN_RPC_URL ||
      process.env.BLOCKCHAIN_RPC_URL ||
      process.env.RPC_URL ||
      "",
  ).trim();
  const contractAddress = String(
    process.env.CHAIN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "",
  )
    .trim()
    .toLowerCase();
  const chainId = parseChainId();

  if (!rpcUrl || !contractAddress || !chainId) {
    if (mode === "auto") {
      return null;
    }

    throw createHttpError(
      500,
      "Blockchain verification config missing. Set CHAIN_RPC_URL, CHAIN_ID, and CHAIN_CONTRACT_ADDRESS.",
    );
  }

  if (!ethers.isAddress(contractAddress)) {
    throw createHttpError(
      500,
      "Invalid CHAIN_CONTRACT_ADDRESS configured on server.",
    );
  }

  return {
    rpcUrl,
    chainId,
    contractAddress,
  };
}

function normalized(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function findExpectedEvent(
  logs,
  expectedAction,
  expectedProductId,
  expectedText,
) {
  for (const log of logs) {
    let parsed;
    try {
      parsed = contractInterface.parseLog(log);
    } catch (error) {
      continue;
    }

    if (expectedAction === "addProduct" && parsed.name === "ProductAdded") {
      const eventId = Number(parsed.args.id);
      const eventName = normalizeText(parsed.args.name);
      if (eventId === expectedProductId && eventName === expectedText) {
        return parsed;
      }
    }

    if (expectedAction === "addStage" && parsed.name === "StageAdded") {
      const eventId = Number(parsed.args.id);
      const eventStage = normalizeText(parsed.args.stage);
      if (eventId === expectedProductId && eventStage === expectedText) {
        return parsed;
      }
    }
  }

  return null;
}

async function verifyOnChainProof({
  chainProof,
  expectedAction,
  expectedProductId,
  expectedText,
}) {
  const mode = resolveMode();
  if (mode === "off") {
    return { verified: false, reason: "disabled" };
  }

  const config = getConfig(mode);
  if (!config) {
    return { verified: false, reason: "missing-config-auto-mode" };
  }

  if (normalized(chainProof.contractAddress) !== config.contractAddress) {
    throw createHttpError(400, "Blockchain proof contract address mismatch.");
  }

  if (toSafeNumber(chainProof.chainId) !== config.chainId) {
    throw createHttpError(400, "Blockchain proof chain ID mismatch.");
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);

  let tx;
  let receipt;

  try {
    tx = await provider.getTransaction(chainProof.txHash);
    receipt = await provider.getTransactionReceipt(chainProof.txHash);
  } catch (error) {
    throw createHttpError(502, "Unable to verify blockchain proof right now.");
  }

  if (!tx || !receipt) {
    throw createHttpError(400, "Blockchain transaction proof not found.");
  }

  if (Number(receipt.status) !== 1) {
    throw createHttpError(400, "Blockchain transaction did not succeed.");
  }

  if (toSafeNumber(chainProof.blockNumber) !== Number(receipt.blockNumber)) {
    throw createHttpError(400, "Blockchain proof block number mismatch.");
  }

  if (normalized(tx.from) !== normalized(chainProof.walletAddress)) {
    throw createHttpError(400, "Blockchain proof wallet address mismatch.");
  }

  if (normalized(receipt.to) !== config.contractAddress) {
    throw createHttpError(400, "Blockchain proof contract target mismatch.");
  }

  const txChainId = Number(tx.chainId);
  if (Number.isFinite(txChainId) && txChainId !== config.chainId) {
    throw createHttpError(400, "Blockchain transaction chain mismatch.");
  }

  const contractLogs = (receipt.logs || []).filter(
    (log) => normalized(log.address) === config.contractAddress,
  );

  const matchedEvent = findExpectedEvent(
    contractLogs,
    expectedAction,
    expectedProductId,
    normalizeText(expectedText),
  );

  if (!matchedEvent) {
    throw createHttpError(
      400,
      "Blockchain proof does not match expected contract event.",
    );
  }

  return { verified: true, reason: "verified" };
}

module.exports = {
  verifyOnChainProof,
};
