import { config } from "./config.js";
import { log } from "./logger.js";
import { runScreenerLoop } from "./screener.js";
import { formatTelegramMessage, formatTelegramTableMessage, sendTelegramMessage } from "./telegram.js";
import { compactNumber } from "./utils.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printRows(rows) {
  if (!rows.length) {
    console.log("No passing candidates.");
    return;
  }

  console.table(rows.map((row) => ({
    pair: row.pair,
    score: row.score,
    vol24h: row.vol24h,
    feeTvl: row.feeTvl,
    organic: row.organic,
    fees: row.fees,
  })));
}

function toRow(candidate) {
  return {
    pair: candidate.name,
    score: candidate.score,
    vol24h: compactNumber(candidate.meteora.volume24h),
    feeTvl: `${candidate.meteora.feeTvlRatio24h ?? "-"}%`,
    organic: candidate.jupiter.organicScore ?? "-",
    fees: candidate.jupiter.globalFeesSol != null ? `${candidate.jupiter.globalFeesSol.toFixed(1)} SOL` : "-",
  };
}

async function notifyStartup() {
  if (!config.telegram.notifyStartup) return;
  await sendTelegramMessage(
    formatTelegramMessage("Screening Bot Started", [
      { label: "Mode", value: config.app.runOnce ? "once" : "loop" },
      { label: "Category", value: config.meteora.category },
      { label: "Shortlist", value: String(config.app.shortlistLimit) },
      { label: "Interval", value: `${config.app.pollIntervalMinutes}m` },
    ]),
    { dedupeKey: "startup", dedupeMs: 300000 }
  );
}

async function notifyResults(result) {
  if (!config.telegram.notifyResults) return;
  if (!result.passing.length) {
    if (!config.telegram.notifyEmpty) return;
    await sendTelegramMessage(
      formatTelegramMessage("Screening Result", [
        { label: "Passing", value: "0" },
        { label: "Enriched", value: String(result.totalEnriched) },
      ], "No pool passed all filters."),
      { dedupeKey: "empty-result", dedupeMs: 900000 }
    );
    return;
  }

  const rows = result.passing.map((candidate) => [
    candidate.name,
    String(candidate.score),
    compactNumber(candidate.meteora.volume24h),
    `${candidate.meteora.feeTvlRatio24h ?? "-"}%`,
    String(candidate.jupiter.organicScore ?? "-"),
    candidate.jupiter.globalFeesSol != null ? candidate.jupiter.globalFeesSol.toFixed(1) : "-",
  ]);

  await sendTelegramMessage(
    formatTelegramTableMessage(
      "Screening Shortlist",
      [
        { header: "PAIR", width: 12 },
        { header: "SCR", width: 4 },
        { header: "VOL24H", width: 7 },
        { header: "F/TVL", width: 6 },
        { header: "ORG", width: 4 },
        { header: "FEES", width: 6 },
      ],
      rows,
      `Passing ${result.passing.length}/${result.totalEnriched}`
    ),
    { dedupeKey: `result:${rows.map((row) => row.join("|")).join("||")}`, dedupeMs: 1800000 }
  );
}

async function runCycle() {
  log("info", `Starting screening cycle | category=${config.meteora.category} | maxCandidates=${config.app.maxCandidates}`);
  const result = await runScreenerLoop();
  const rows = result.passing.map(toRow);
  printRows(rows);
  await notifyResults(result);
  log("info", `Screening finished | passing=${result.passing.length} | enriched=${result.totalEnriched}`);
}

async function main() {
  await notifyStartup();

  if (config.app.runOnce) {
    await runCycle();
    return;
  }

  while (true) {
    try {
      await runCycle();
    } catch (error) {
      log("error", `Screening loop failed: ${error.stack || error.message}`);
      if (config.telegram.notifyErrors) {
        await sendTelegramMessage(
          formatTelegramMessage("Screening Error", [
            { label: "Message", value: error.message },
          ]),
          { dedupeKey: `error:${error.message}`, dedupeMs: 600000 }
        );
      }
    }
    await sleep(config.app.pollIntervalMinutes * 60 * 1000);
  }
}

main().catch((error) => {
  log("error", `Fatal error: ${error.stack || error.message}`);
  process.exit(1);
});
