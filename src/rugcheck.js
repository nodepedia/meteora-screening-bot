import { config } from "./config.js";
import { fetchJsonWithRetry } from "./net.js";

export async function getRugcheckSummary(mint) {
  const url = `${config.rugcheck.apiBase}/tokens/${mint}/report/summary`;
  const data = await fetchJsonWithRetry(url, {
    label: `Rugcheck ${mint.slice(0, 8)}`,
    retries: 2,
  });

  const risks = Array.isArray(data?.risks) ? data.risks : [];
  const warnRisks = risks.filter((risk) => String(risk?.level || "").toLowerCase() === "warn");
  const dangerRisks = risks.filter((risk) => String(risk?.level || "").toLowerCase() === "danger");

  return {
    score: data?.score_normalised != null ? Number(data.score_normalised) : null,
    warnRisksCount: warnRisks.length,
    dangerRisksCount: dangerRisks.length,
    risks,
    honeypot: data?.honeypot ?? null,
    mutableMetadata: data?.tokenMeta?.mutable ?? data?.mutable ?? null,
  };
}
