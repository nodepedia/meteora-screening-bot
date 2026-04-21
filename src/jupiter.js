import { config } from "./config.js";
import { fetchJsonWithRetry } from "./net.js";

function buildHeaders() {
  return config.jupiter.apiKey ? { "x-api-key": config.jupiter.apiKey } : {};
}

export async function getVerificationStatus(mint) {
  const url = `${config.jupiter.apiBase}/tokens/v2/search?query=${encodeURIComponent(mint)}`;
  const data = await fetchJsonWithRetry(url, {
    label: `Jupiter token verification ${mint.slice(0, 8)}`,
    retries: 2,
    fetchOptions: { headers: buildHeaders() },
  });

  const token = Array.isArray(data) ? data[0] : (data.tokens?.[0] || data.data?.[0] || data[0] || data);
  return {
    verification: token?.verification ?? null,
    tags: token?.tags || [],
  };
}

export async function getTokenAudit(mint) {
  const url = `${config.jupiter.datapiBase}/assets/search?query=${encodeURIComponent(mint)}`;
  const data = await fetchJsonWithRetry(url, {
    label: `Jupiter datapi ${mint.slice(0, 8)}`,
    retries: 2,
  });

  const token = (Array.isArray(data) ? data : [data]).find((item) => item?.id === mint) || (Array.isArray(data) ? data[0] : data);
  return {
    mint,
    organicScore: token?.organicScore ?? null,
    holderCount: token?.holderCount ?? null,
    launchpad: token?.launchpad ?? null,
    globalFeesSol: token?.fees != null ? Number(token.fees) : null,
    audit: {
      mintAuthorityDisabled: token?.audit?.mintAuthorityDisabled ?? null,
      freezeAuthorityDisabled: token?.audit?.freezeAuthorityDisabled ?? null,
      topHoldersPercentage: token?.audit?.topHoldersPercentage != null ? Number(token.audit.topHoldersPercentage) : null,
      botHoldersPercentage: token?.audit?.botHoldersPercentage != null ? Number(token.audit.botHoldersPercentage) : null,
      isSus: token?.audit?.isSus ?? null,
    },
  };
}
