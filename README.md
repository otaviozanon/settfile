# SETTFILE

Multi-provider file upload aggregator with automatic failover.

## Features

- **7 providers** with automatic failover
- **Smart filtering** by file size
- **Drag & drop** upload
- **Real-time progress** tracking
- **Manual provider selection** option

## Supported Providers

| Provider                                 | Max Size | Retention        | Notes                               |
| ---------------------------------------- | -------- | ---------------- | ----------------------------------- |
| [Freeimage.host](https://freeimage.host) | 64 MB    | Indefinite       | ✅ Permanent storage                |
| [tmpfiles.org](https://tmpfiles.org)     | 100 MB   | 1-48 hours       | ⚙️ Configurable (default: 60min)    |
| [Filebin.net](https://filebin.net)       | 100 MB   | 7 days           | ✅ Auto-delete after 7 days         |
| [SafeNote.co](https://safenote.co)       | 100 MB   | Up to 30 days    | ⚙️ Configurable (1h to 30 days)     |
| [Ufile.io](https://ufile.io)             | 5 GB     | 30 days          | ⚠️ Free tier only (Pro: indefinite) |
| [gofile.io](https://gofile.io)           | 10 GB    | Inactive cleanup | ⚠️ Removed after inactivity period  |
| [Uguu.se](https://uguu.se)               | 128 MB   | 3 hours          | ✅ Fast temporary uploads           |

## How It Works

1. User selects a file and optional host
2. Frontend sends file via XHR to the local Node server
3. Server forwards the file to the chosen third-party host
4. Host URL is returned to the frontend
5. User can swap to another host with one click

## Structure

```
settfile-main/
├── api/          # Server-side upload handlers (7 providers)
├── src/
│   ├── components/    # React components
│   ├── hooks/         # useFileUpload, useLogger
│   ├── providers/     # Frontend upload logic
│   ├── types/         # TypeScript definitions
│   └── utils/         # Validation helpers
├── server.ts     # Node HTTP server
└── vite.config.ts
```

## Tech Stack

**Frontend:** React 18, TypeScript, Vite 7, Tailwind CSS
**Backend:** Node.js, TypeScript (tsx)
