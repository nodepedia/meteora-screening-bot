import { log } from "./logger.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJsonWithRetry(url, options = {}) {
  const {
    label = "request",
    retries = 3,
    retryDelayMs = 1000,
    fetchOptions = {},
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${body}`.trim());
      }
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        log("warn", `${label} failed on attempt ${attempt}/${retries}: ${error.message}`);
        await sleep(retryDelayMs * attempt);
      }
    }
  }

  throw new Error(`${label} failed after ${retries} attempt(s): ${lastError?.message || "unknown error"}`);
}
