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
| `ecosystem.config.cjs` | PM2 config |

## Cara Pakai

| Step | Command / Action |
|---|---|
| Clone repo | `git clone https://github.com/nodepedia/meteora-screening-bot.git` |
| Masuk folder | `cd meteora-screening-bot` |
| Jalankan installer wizard | `bash install.sh` |
| Ikuti prompt | Isi semua parameter screening sesuai kebutuhan |
| Bot jalan via PM2 | Installer akan otomatis install dependency, setup `.env`, dan start bot |

## Install 1 Perintah

| Mode | Command |
|---|---|
| One-command install | `curl -fsSL https://raw.githubusercontent.com/nodepedia/meteora-screening-bot/main/install.sh | bash` |
| Manual install | `git clone https://github.com/nodepedia/meteora-screening-bot.git && cd meteora-screening-bot && bash install.sh` |

## Setup

| Step | Command |
|---|---|
| Masuk folder | `cd meteora-screening-bot` |
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
| PM2 | `pm2 start ecosystem.config.cjs` |

## PM2 Commands

| Tujuan | Command |
|---|---|
| Lihat status | `pm2 status` |
| Lihat log | `pm2 logs meteora-screening-bot` |
| Restart bot | `pm2 restart meteora-screening-bot` |
| Stop bot | `pm2 stop meteora-screening-bot` |
| Hapus dari PM2 | `pm2 delete meteora-screening-bot` |

## Output Bot

| Output | Keterangan |
|---|---|
| Terminal table | Menampilkan shortlist kandidat yang lolos screening |
| Telegram startup | Kirim status saat bot mulai jalan |
| Telegram shortlist | Kirim hasil kandidat yang lolos |
| Telegram empty result | Kirim info kalau tidak ada kandidat yang lolos |
| Log file | Disimpan di folder `logs/` |

## Kelompok Parameter `.env`

| Prefix | Fungsi |
|---|---|
| `APP_*` | behavior bot, mode loop, limit shortlist |
| `METEORA_*` | filter pool utama dari Meteora |
| `JUPITER_*` | verification, audit, global fees |
| `OKX_*` | bundler, wash trading, suspicious holders |
| `RUGCHECK_*` | anti-scam / malicious risk |
| `TELEGRAM_*` | notifikasi Telegram |

## Parameter Screening Default

| Parameter | Rule |
|---|---|
| Verified token | `Jupiter verification=verified` + Meteora both verified |
| Mint authority | disabled |
| Freeze authority | disabled |
| Organic score | `>= 60` |
| Top 10 holders | `< 30%` |
| Market cap | `$250K - $50M` |
| Token age | `>= 2 jam` |
| Holders | `>= 500` |
| 24h volume | `> $1M` |
| 1h volume | `> $1K` |
| Global fees | `>= 30 SOL` |
| Fee / TVL | `> 50%` |
| Base fee | `2% - 10%` |
| Bin step | `100` hard filter |
| TVL | `>= $10K` |
| Bundler | `<= 30%` |
| Wash trading | `false` |
| Insiders / suspicious | `<= 10%` |
| Rugcheck | score `<= 30`, no danger risks, max 1 warn, no honeypot, immutable metadata |

## Edit Config Setelah Install

| Tujuan | Action |
|---|---|
| Ubah parameter | Edit file `.env` |
| Terapkan perubahan | `pm2 restart meteora-screening-bot` |
| Test sekali tanpa loop | Ubah `APP_RUN_ONCE=true` lalu jalankan `npm run once` |

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Tidak ada kandidat lolos | Longgarkan threshold di `.env` lalu restart PM2 |
| Telegram tidak kirim pesan | Cek `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` |
| API rate limit | Kurangi `APP_MAX_CANDIDATES` |
| PM2 tidak ditemukan | Jalankan `npm install -g pm2` |
| Bot berhenti setelah sekali jalan | Pastikan `APP_RUN_ONCE=false` untuk mode PM2 |

## Notes

| Item | Note |
|---|---|
| Config | Semua parameter lewat `.env` |
| PM2 | Sudah ada `ecosystem.config.cjs` |
| Installer wizard | Sudah ada `install.sh` |
| Telegram | Opsional |
