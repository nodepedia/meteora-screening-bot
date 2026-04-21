import fs from "fs";
import path from "path";
import { config } from "./config.js";

const LOG_DIR = "./logs";
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[config.app.logLevel] ?? 1;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function formatTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: config.app.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${ms} ${config.app.timezone}`;
}

export function log(level, message) {
  const normalized = LEVELS[level] != null ? level : "info";
  if (LEVELS[normalized] < currentLevel) return;

  const timestamp = formatTimestamp(new Date());
  const line = `[${timestamp}] [${normalized.toUpperCase()}] ${message}`;
  console.log(line);

  const file = path.join(LOG_DIR, `screening-${timestamp.slice(0, 10)}.log`);
  fs.appendFileSync(file, line + "\n");
}
