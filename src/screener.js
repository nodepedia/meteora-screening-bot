import { config } from "./config.js";
import { getTokenAudit, getVerificationStatus } from "./jupiter.js";
import { log } from "./logger.js";
import { discoverPools, getPoolDetail } from "./meteora.js";
import { getAdvancedInfo, getRiskFlags } from "./okx.js";
import { getRugcheckSummary } from "./rugcheck.js";

function addReason(reasons, label, detail) {
  reasons.push(detail ? `${label}: ${detail}` : label);
}

function scoreCandidate(candidate) {
  let score = 0;
  score += Math.min(25, (candidate.meteora.volume24h || 0) / 200000);
  score += Math.min(20, (candidate.meteora.feeTvlRatio24h || 0) / 5);
  score += Math.min(20, (candidate.jupiter.organicScore || 0) / 5);
  score += Math.max(0, 15 - (candidate.okx.bundlePct || 0) / 2);
  score += Math.max(0, 10 - (candidate.okx.suspiciousPct || 0));
  score += Math.max(0, 10 - (candidate.rugcheck.score || 0) / 3);
  return Math.round(score);
}

function passes(candidate) {
  const reasons = [];

  if (config.meteora.requireBothVerified) {
    if (candidate.meteora.tokenX.isVerified !== true || candidate.meteora.tokenY.isVerified !== true) {
      addReason(reasons, "meteora_verified", "both tokens must be verified");
    }
  }

  if (candidate.meteora.binStep !== config.meteora.requiredBinStep) {
    addReason(reasons, "bin_step", `${candidate.meteora.binStep} != ${config.meteora.requiredBinStep}`);
  }

  if ((candidate.meteora.baseFeePct ?? -1) < config.meteora.minBaseFeePct || (candidate.meteora.baseFeePct ?? Infinity) > config.meteora.maxBaseFeePct) {
    addReason(reasons, "base_fee", `${candidate.meteora.baseFeePct}%`);
  }

  if ((candidate.meteora.tvl ?? 0) < config.meteora.minTvlUsd) {
    addReason(reasons, "tvl", `${candidate.meteora.tvl}`);
  }

  if ((candidate.meteora.volume24h ?? 0) <= config.meteora.minVolume24hUsd) {
    addReason(reasons, "volume_24h", `${candidate.meteora.volume24h}`);
  }

  if ((candidate.meteora.volume1h ?? 0) <= config.meteora.minVolume1hUsd) {
    addReason(reasons, "volume_1h", `${candidate.meteora.volume1h}`);
  }

  if ((candidate.meteora.feeTvlRatio24h ?? 0) <= config.meteora.minFeeTvlRatio24h) {
    addReason(reasons, "fee_tvl_ratio_24h", `${candidate.meteora.feeTvlRatio24h}`);
  }

  if ((candidate.discovery.marketCap ?? 0) < config.meteora.minMarketCapUsd || (candidate.discovery.marketCap ?? Infinity) > config.meteora.maxMarketCapUsd) {
    addReason(reasons, "market_cap", `${candidate.discovery.marketCap}`);
  }

  if ((candidate.discovery.tokenAgeHours ?? 0) < config.meteora.minTokenAgeHours) {
    addReason(reasons, "token_age_hours", `${candidate.discovery.tokenAgeHours}`);
  }

  if ((candidate.discovery.holders ?? 0) < config.meteora.minHolders) {
    addReason(reasons, "holders", `${candidate.discovery.holders}`);
  }

  if (config.jupiter.requireVerified && candidate.jupiter.verification !== "verified") {
    addReason(reasons, "jupiter_verification", String(candidate.jupiter.verification || "missing"));
  }

  if ((candidate.jupiter.organicScore ?? 0) < config.jupiter.minOrganicScore) {
    addReason(reasons, "organic_score", `${candidate.jupiter.organicScore}`);
  }

  if ((candidate.jupiter.audit.topHoldersPercentage ?? Infinity) >= config.jupiter.maxTop10HoldersPct) {
    addReason(reasons, "top10_pct", `${candidate.jupiter.audit.topHoldersPercentage}`);
  }

  if (config.jupiter.requireMintAuthorityDisabled && candidate.jupiter.audit.mintAuthorityDisabled !== true) {
    addReason(reasons, "mint_authority", "not disabled");
  }

  if (config.jupiter.requireFreezeAuthorityDisabled && candidate.jupiter.audit.freezeAuthorityDisabled !== true) {
    addReason(reasons, "freeze_authority", "not disabled");
  }

  if ((candidate.jupiter.globalFeesSol ?? 0) < config.jupiter.minGlobalFeesSol) {
    addReason(reasons, "global_fees_sol", `${candidate.jupiter.globalFeesSol}`);
  }

  if ((candidate.okx.bundlePct ?? Infinity) > config.okx.maxBundlePct) {
    addReason(reasons, "bundle_pct", `${candidate.okx.bundlePct}`);
  }

  if ((candidate.okx.suspiciousPct ?? Infinity) > config.okx.maxSuspiciousPct) {
    addReason(reasons, "suspicious_pct", `${candidate.okx.suspiciousPct}`);
  }

  if (config.okx.requireNotWash && candidate.okx.isWash === true) {
    addReason(reasons, "wash_trading", "flagged");
  }

  if ((candidate.rugcheck.score ?? Infinity) > config.rugcheck.maxScore) {
    addReason(reasons, "rugcheck_score", `${candidate.rugcheck.score}`);
  }

  if (config.rugcheck.requireZeroDangerRisks && (candidate.rugcheck.dangerRisksCount ?? 0) > 0) {
    addReason(reasons, "rugcheck_danger", `${candidate.rugcheck.dangerRisksCount}`);
  }

  if ((candidate.rugcheck.warnRisksCount ?? 0) > config.rugcheck.maxWarnRisks) {
    addReason(reasons, "rugcheck_warn", `${candidate.rugcheck.warnRisksCount}`);
  }

  if (config.rugcheck.requireNotHoneypot && candidate.rugcheck.honeypot === true) {
    addReason(reasons, "honeypot", "true");
  }

  if (config.rugcheck.requireImmutableMetadata && candidate.rugcheck.mutableMetadata === true) {
    addReason(reasons, "mutable_metadata", "true");
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

export async function runScreenerLoop() {
  const discovered = await discoverPools({ pageSize: config.app.maxCandidates });
  const enriched = [];

  for (const candidate of discovered) {
    const mint = candidate.tokenX.address;
    if (!candidate.poolAddress || !mint) continue;

    try {
      const [meteora, verification, audit, okxAdvanced, okxRisk, rugcheck] = await Promise.all([
        getPoolDetail(candidate.poolAddress),
        getVerificationStatus(mint).catch(() => ({ verification: null, tags: [] })),
        getTokenAudit(mint).catch(() => ({ audit: {}, globalFeesSol: null, organicScore: null })),
        getAdvancedInfo(mint).catch(() => ({})),
        getRiskFlags(mint).catch(() => ({})),
        getRugcheckSummary(mint).catch(() => ({})),
      ]);

      const merged = {
        poolAddress: candidate.poolAddress,
        name: candidate.name,
        symbol: candidate.tokenX.symbol,
        discovery: candidate,
        meteora,
        jupiter: {
          verification: verification.verification,
          tags: verification.tags,
          organicScore: audit.organicScore,
          globalFeesSol: audit.globalFeesSol,
          audit: audit.audit || {},
        },
        okx: {
          bundlePct: okxAdvanced.bundlePct ?? null,
          suspiciousPct: okxAdvanced.suspiciousPct ?? null,
          isWash: okxRisk.isWash ?? null,
        },
        rugcheck: {
          score: rugcheck.score ?? null,
          warnRisksCount: rugcheck.warnRisksCount ?? 0,
          dangerRisksCount: rugcheck.dangerRisksCount ?? 0,
          honeypot: rugcheck.honeypot ?? null,
          mutableMetadata: rugcheck.mutableMetadata ?? null,
        },
      };

      const decision = passes(merged);
      merged.passed = decision.passed;
      merged.reasons = decision.reasons;
      merged.score = scoreCandidate(merged);
      enriched.push(merged);
    } catch (error) {
      log("warn", `Candidate ${candidate.poolAddress.slice(0, 8)} failed to enrich: ${error.message}`);
    }
  }

  const passing = enriched
    .filter((item) => item.passed)
    .sort((a, b) => b.score - a.score || (b.meteora.volume24h || 0) - (a.meteora.volume24h || 0))
    .slice(0, config.app.shortlistLimit);

  return {
    totalDiscovered: discovered.length,
    totalEnriched: enriched.length,
    passing,
    rejected: enriched.filter((item) => !item.passed),
  };
}
