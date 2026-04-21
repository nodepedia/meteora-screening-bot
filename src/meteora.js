import { config } from "./config.js";
import { fetchJsonWithRetry } from "./net.js";
import { pct } from "./utils.js";

function buildDiscoveryFilters() {
  const s = config.meteora;
  return [
    "pool_type=dlmm",
    `base_token_market_cap>=${s.minMarketCapUsd}`,
    `base_token_market_cap<=${s.maxMarketCapUsd}`,
    `base_token_holders>=${s.minHolders}`,
    `tvl>=${s.minTvlUsd}`,
    `dlmm_bin_step=${s.requiredBinStep}`,
    `base_fee_pct>=${s.minBaseFeePct}`,
    `base_fee_pct<=${s.maxBaseFeePct}`,
    `base_token_organic_score>=${config.jupiter.minOrganicScore}`,
    `base_token_created_at<=${Date.now() - s.minTokenAgeHours * 3_600_000}`,
  ].join("&&");
}

export async function discoverPools({ pageSize = config.app.maxCandidates } = {}) {
  const url =
    `${config.meteora.poolDiscoveryBase}/pools?page_size=${pageSize}` +
    `&filter_by=${encodeURIComponent(buildDiscoveryFilters())}` +
    `&timeframe=${encodeURIComponent(config.meteora.discoveryTimeframe)}` +
    `&category=${encodeURIComponent(config.meteora.category)}`;

  const data = await fetchJsonWithRetry(url, {
    label: "Meteora pool discovery",
    retries: 3,
  });

  return (data.data || []).map((pool) => ({
    poolAddress: pool.pool_address,
    name: pool.name,
    tokenX: {
      address: pool.token_x?.address,
      symbol: pool.token_x?.symbol,
      organicScore: pool.token_x?.organic_score ?? null,
      marketCap: pool.token_x?.market_cap ?? null,
      createdAt: pool.token_x?.created_at ?? null,
    },
    tokenY: {
      address: pool.token_y?.address,
      symbol: pool.token_y?.symbol,
      organicScore: pool.token_y?.organic_score ?? null,
    },
    holders: pool.base_token_holders ?? null,
    marketCap: pool.token_x?.market_cap ?? null,
    tokenAgeHours: pool.token_x?.created_at
      ? Math.floor((Date.now() - pool.token_x.created_at) / 3_600_000)
      : null,
    volumeWindow: pool.volume ?? null,
    feeTvlRatioWindow: pool.fee_active_tvl_ratio ?? null,
    activeTvl: pool.active_tvl ?? null,
    binStep: pool.dlmm_params?.bin_step ?? null,
    baseFeePct: pool.fee_pct ?? null,
  }));
}

export async function getPoolDetail(poolAddress) {
  const url = `${config.meteora.dlmmBase}/pools/${poolAddress}`;
  const pool = await fetchJsonWithRetry(url, {
    label: `Meteora pool detail ${poolAddress.slice(0, 8)}`,
    retries: 3,
  });

  return {
    poolAddress: pool.address || poolAddress,
    name: pool.name,
    tokenX: {
      address: pool.token_x?.address,
      symbol: pool.token_x?.symbol,
      isVerified: pool.token_x?.is_verified ?? null,
      freezeAuthorityDisabled: pool.token_x?.freeze_authority_disabled ?? null,
      holders: pool.token_x?.holders ?? null,
      marketCap: pool.token_x?.market_cap ?? null,
    },
    tokenY: {
      address: pool.token_y?.address,
      symbol: pool.token_y?.symbol,
      isVerified: pool.token_y?.is_verified ?? null,
    },
    launchpad: pool.launchpad ?? null,
    tvl: pool.tvl ?? null,
    volume1h: pool.volume?.["1h"] ?? null,
    volume24h: pool.volume?.["24h"] ?? null,
    feeTvlRatio24h: pct(pool.fee_tvl_ratio?.["24h"], 2),
    baseFeePct: pct(pool.pool_config?.base_fee_pct, 2),
    binStep: pool.pool_config?.bin_step ?? null,
    createdAt: pool.created_at ?? null,
  };
}
