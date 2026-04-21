import { config } from "./config.js";
import { fetchJsonWithRetry } from "./net.js";

const HEADERS = { "Ok-Access-Client-type": "agent-cli" };

export async function getAdvancedInfo(mint) {
  const url = `${config.okx.base}/api/v6/dex/market/token/advanced-info?chainIndex=501&tokenContractAddress=${mint}`;
  const data = await fetchJsonWithRetry(url, {
    label: `OKX advanced ${mint.slice(0, 8)}`,
    retries: 2,
    fetchOptions: { headers: HEADERS },
  });
  const row = Array.isArray(data?.data) ? data.data[0] : (Array.isArray(data) ? data[0] : data?.data || data);

  return {
    bundlePct: row?.bundleHoldingPercent != null ? Number(row.bundleHoldingPercent) : null,
    suspiciousPct: row?.suspiciousHoldingPercent != null ? Number(row.suspiciousHoldingPercent) : null,
    riskLevel: row?.riskControlLevel != null ? Number(row.riskControlLevel) : null,
  };
}

export async function getRiskFlags(mint) {
  const url = `${config.okx.base}/priapi/v1/dx/market/v2/risk/new/check?chainId=501&tokenContractAddress=${mint}&t=${Date.now()}`;
  const data = await fetchJsonWithRetry(url, {
    label: `OKX risk ${mint.slice(0, 8)}`,
    retries: 2,
    fetchOptions: { headers: HEADERS },
  });

  const body = data?.data || data;
  const sections = [
    ...(body?.allAnalysis?.highRiskList || []),
    ...(body?.allAnalysis?.middleRiskList || []),
    ...(body?.allAnalysis?.lowRiskList || []),
    ...(body?.extraAnalysis?.highRiskList || []),
    ...(body?.extraAnalysis?.middleRiskList || []),
    ...(body?.extraAnalysis?.lowRiskList || []),
  ];

  const isWash = sections.some((item) =>
    item?.riskKey === "isWash" && String(item?.newRiskLabel || "").toLowerCase() === "yes"
  );

  return {
    isWash,
  };
}
