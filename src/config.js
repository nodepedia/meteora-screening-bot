import dotenv from "dotenv";

dotenv.config();

function toBool(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

function toNum(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInt(value, fallback) {
  return Math.trunc(toNum(value, fallback));
}

export const config = {
  app: {
    name: process.env.APP_NAME || "Meteora Screening Bot",
    timezone: process.env.APP_TIMEZONE || "Asia/Jakarta",
    logLevel: process.env.APP_LOG_LEVEL || "info",
    runOnce: toBool(process.env.APP_RUN_ONCE, true),
    pollIntervalMinutes: toNum(process.env.APP_POLL_INTERVAL_MINUTES, 15),
    maxCandidates: toInt(process.env.APP_MAX_CANDIDATES, 80),
    shortlistLimit: toInt(process.env.APP_SHORTLIST_LIMIT, 10),
  },
  meteora: {
    poolDiscoveryBase: process.env.METEORA_POOL_DISCOVERY_BASE || "https://pool-discovery-api.datapi.meteora.ag",
    dlmmBase: process.env.METEORA_DLMM_BASE || "https://dlmm.datapi.meteora.ag",
    category: process.env.METEORA_CATEGORY || "top",
    discoveryTimeframe: process.env.METEORA_DISCOVERY_TIMEFRAME || "24h",
    minMarketCapUsd: toNum(process.env.METEORA_MIN_MARKET_CAP_USD, 250000),
    maxMarketCapUsd: toNum(process.env.METEORA_MAX_MARKET_CAP_USD, 50000000),
    minTokenAgeHours: toNum(process.env.METEORA_MIN_TOKEN_AGE_HOURS, 2),
    minHolders: toNum(process.env.METEORA_MIN_HOLDERS, 500),
    minVolume24hUsd: toNum(process.env.METEORA_MIN_VOLUME_24H_USD, 1000000),
    minVolume1hUsd: toNum(process.env.METEORA_MIN_VOLUME_1H_USD, 1000),
    minTvlUsd: toNum(process.env.METEORA_MIN_TVL_USD, 10000),
    minFeeTvlRatio24h: toNum(process.env.METEORA_MIN_FEE_TVL_RATIO_24H, 50),
    minBaseFeePct: toNum(process.env.METEORA_MIN_BASE_FEE_PCT, 2),
    maxBaseFeePct: toNum(process.env.METEORA_MAX_BASE_FEE_PCT, 10),
    requiredBinStep: toInt(process.env.METEORA_REQUIRED_BIN_STEP, 100),
    requireBothVerified: toBool(process.env.METEORA_REQUIRE_BOTH_VERIFIED, true),
  },
  jupiter: {
    apiBase: process.env.JUPITER_API_BASE || "https://api.jup.ag",
    datapiBase: process.env.JUPITER_DATAPI_BASE || "https://datapi.jup.ag/v1",
    apiKey: process.env.JUPITER_API_KEY || "",
    requireVerified: toBool(process.env.JUPITER_REQUIRE_VERIFIED, true),
    minOrganicScore: toNum(process.env.JUPITER_MIN_ORGANIC_SCORE, 60),
    maxTop10HoldersPct: toNum(process.env.JUPITER_MAX_TOP10_HOLDERS_PCT, 30),
    requireMintAuthorityDisabled: toBool(process.env.JUPITER_REQUIRE_MINT_AUTHORITY_DISABLED, true),
    requireFreezeAuthorityDisabled: toBool(process.env.JUPITER_REQUIRE_FREEZE_AUTHORITY_DISABLED, true),
    minGlobalFeesSol: toNum(process.env.JUPITER_MIN_GLOBAL_FEES_SOL, 30),
  },
  okx: {
    base: process.env.OKX_BASE || "https://web3.okx.com",
    maxBundlePct: toNum(process.env.OKX_MAX_BUNDLE_PCT, 30),
    maxSuspiciousPct: toNum(process.env.OKX_MAX_SUSPICIOUS_PCT, 10),
    requireNotWash: toBool(process.env.OKX_REQUIRE_NOT_WASH, true),
  },
  rugcheck: {
    apiBase: process.env.RUGCHECK_API_BASE || "https://api.rugcheck.xyz/v1",
    maxScore: toNum(process.env.RUGCHECK_MAX_SCORE, 30),
    maxWarnRisks: toInt(process.env.RUGCHECK_MAX_WARN_RISKS, 1),
    requireZeroDangerRisks: toBool(process.env.RUGCHECK_REQUIRE_ZERO_DANGER_RISKS, true),
    requireNotHoneypot: toBool(process.env.RUGCHECK_REQUIRE_NOT_HONEYPOT, true),
    requireImmutableMetadata: toBool(process.env.RUGCHECK_REQUIRE_IMMUTABLE_METADATA, true),
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    notifyStartup: toBool(process.env.TELEGRAM_NOTIFY_STARTUP, true),
    notifyResults: toBool(process.env.TELEGRAM_NOTIFY_RESULTS, true),
    notifyEmpty: toBool(process.env.TELEGRAM_NOTIFY_EMPTY, true),
    notifyErrors: toBool(process.env.TELEGRAM_NOTIFY_ERRORS, true),
    timeoutMs: toInt(process.env.TELEGRAM_TIMEOUT_MS, 15000),
    retryCount: toInt(process.env.TELEGRAM_RETRY_COUNT, 1),
  },
};
