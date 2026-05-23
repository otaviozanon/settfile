# SETTFILE

Multi-provider file upload aggregator with automatic failover. Upload a file once, and it will be hosted on the first available service among 8 supported providers.

## Supported Providers

| Provider | Max Size | Retention |
|----------|----------|-----------|
| [Freeimage.host](https://freeimage.host) | 64 MB | Indefinite |
| [tmpfiles.org](https://tmpfiles.org) | 100 MB | 60 minutes |
| [Filebin.net](https://filebin.net) | 100 MB | 7 days |
| [SafeNote.co](https://safenote.co) | 100 MB | 24 hours |
| [catbox.moe](https://catbox.moe) | 200 MB | Indefinite |
| [Litterbox](https://litterbox.catbox.moe) | 1 GB | 24 hours |
| [Ufile.io](https://ufile.io) | 5 GB | Indefinite |
| [gofile.io](https://gofile.io) | 10 GB | 7 days |

## Features

- **Automatic failover** — tries next provider if current one fails
- **Smart filtering** — only attempts providers that can handle the file size
- **Manual selection** — pick a specific host instead of auto mode
- **Drag & drop** — click or drag files to upload
- **Real-time progress** — XHR-based progress tracking per upload
- **Log panel** — timestamped, color-coded log of all upload attempts

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 7, Tailwind CSS 3
- **Backend:** Node.js HTTP server (raw `http` module), TypeScript via `tsx`
- **Proxy architecture** — browser uploads to local server, server forwards to third-party hosts (no direct CORS exposure)

## How It Works

1. User selects a file and optional host
2. Frontend sends file via XHR to the local Node server
3. Server forwards the file to the chosen third-party host
4. Host URL is returned to the frontend
5. User can swap to another host with one click
