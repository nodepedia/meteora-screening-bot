# Meteora Screening Bot

Standalone bot untuk **screening otomatis** pool Meteora di Solana.

Bot ini **bukan bagian dari Meridian**. Fokusnya hanya satu: **menyaring pool/token yang lolos parameter screening**.

## Structure

| File | Fungsi |
|---|---|
| `src/index.js` | entry point |
| `src/config.js` | baca semua env |
| `src/logger.js` | log harian |
| `src/net.js` | retry fetch |
| `src/telegram.js` | notifikasi Telegram |
| `src/meteora.js` | data pool Meteora |
| `src/jupiter.js` | verification + audit Jupiter |
| `src/okx.js` | bundler / wash / suspicious |
| `src/rugcheck.js` | anti-scam gate |
| `src/screener.js` | loop screening utama |
| `ecosystem.config.js` | PM2 config |

## Setup

| Step | Command |
|---|---|
| Masuk folder | `cd standalone-screening-bot` |
| Install | `npm install` |
| Copy env | `cp .env.example .env` |

## One-command install

| Mode | Command |
|---|---|
| Local repo | `bash install.sh` |
| GitHub nanti | `curl -fsSL <raw-install-url> | bash` |

## Run

| Mode | Command |
|---|---|
| Sekali jalan | `npm run once` |
| Loop biasa | `npm start` |
| PM2 | `pm2 start ecosystem.config.js` |

## Notes

| Item | Note |
|---|---|
| Config | Semua parameter lewat `.env` |
| PM2 | Sudah ada `ecosystem.config.js` |
| Installer wizard | Sudah ada `install.sh` |
| Telegram | Opsional |
