# YTMP3 PRO — Technical Context

## Overview

YTMP3 PRO is a professional YouTube-to-audio conversion platform. It wraps `yt-dlp` (the industry-standard CLI downloader) and `FFmpeg` (the universal media processor) behind a clean Express.js API and a premium SaaS-grade frontend.

## Architecture

```
Browser (HTML/CSS/JS)
    │
    │  HTTP POST + SSE (Server-Sent Events)
    ▼
Express.js Server
    │
    ├── Routes → Controllers → Services
    │
    ├── ytdlp.service.js
    │   └── spawn('yt-dlp', [...args])
    │       └── yt-dlp invokes FFmpeg internally
    │
    ├── queue.service.js
    │   └── In-memory job queue with concurrency control
    │
    └── file.service.js
        └── Manages downloads/<jobId>/ directories
```

### Data Flow

1. **User pastes URL** → Frontend validates with regex → `POST /api/info` fetches metadata via `yt-dlp --dump-json`
2. **User clicks Convert** → `POST /api/convert` creates a job in the queue → returns job ID immediately (HTTP 202)
3. **Frontend opens SSE** → `GET /api/convert/:jobId/status` streams progress events
4. **Backend spawns yt-dlp** → Parses stdout for `[download] XX%` lines → Pushes updates to SSE listeners
5. **yt-dlp calls FFmpeg** → Converts raw audio to target format (MP3/WAV/FLAC/M4A)
6. **Conversion completes** → SSE sends `status: completed` → Frontend auto-triggers download
7. **File served** → `GET /api/convert/:jobId/download` streams the file with proper Content-Type
8. **Cleanup** → Files auto-deleted after 30 minutes (configurable)

## Key Decisions

### Why `spawn()` over `exec()`?

- `spawn()` provides a streaming interface to stdout/stderr — essential for real-time progress parsing
- `exec()` buffers the entire output, preventing live updates
- `spawn()` avoids shell interpolation, eliminating command injection vectors
- `spawn()` handles large outputs without buffer overflow risks

### Why SSE over WebSockets?

- SSE is simpler — one-directional (server → client) which is all we need for progress
- Native browser support via `EventSource` — no library needed
- Automatic reconnection built into the protocol
- HTTP-compatible — works through proxies and load balancers without upgrade negotiation

### Why In-Memory Queue (No Redis/Database)?

- Zero external dependencies — the app runs with just Node.js + yt-dlp + FFmpeg
- Perfectly adequate for local/small-scale use (the primary use case)
- Easy upgrade path: swap `queue.service.js` for a Redis-backed implementation when scaling
- Job data is ephemeral by nature — audio files are temporary

### Why No TypeScript?

- Per project requirements: vanilla JavaScript
- JSDoc comments provide type documentation where needed
- Reduces build step complexity — `node server.js` just works

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Command Injection | `spawn()` with argument array (no shell); regex URL validation; shell metacharacter rejection |
| Path Traversal | `safePath()` resolves and validates against downloads directory |
| DoS via Excessive Downloads | Rate limiting (10 conversions/15min per IP); concurrent download cap (3) |
| Resource Exhaustion | Download timeout (5 min); auto-cleanup (30 min); file size implicit limits via yt-dlp |
| XSS | Helmet CSP headers; `escapeHtml()` on all user-generated content in frontend |
| SSRF | URL whitelist — only YouTube domains accepted |

## Error Handling

Custom error hierarchy (`AppError` → `ValidationError`, `DownloadError`, `TimeoutError`, etc.) maps cleanly to HTTP status codes. The global error handler catches all thrown errors and returns structured JSON responses. Unexpected errors are logged with stack traces but sanitized before sending to clients in production.

## Performance

- **Compression**: gzip via `compression` middleware
- **Static Files**: Express serves frontend directly — production deployments should put Nginx/Cloudflare in front
- **Concurrency**: Configurable max parallel downloads (default 3) prevents CPU/bandwidth saturation
- **Streaming Downloads**: Files served via `fs.createReadStream()` — no full-file buffering

## Future SaaS Roadmap

1. **Auth**: Add user accounts (JWT/session) with usage quotas
2. **Database**: PostgreSQL for persistent job history, user data
3. **Queue**: Redis + BullMQ for distributed job processing
4. **Storage**: S3/R2 for converted files instead of local disk
5. **Payments**: Stripe integration for premium tiers (higher quality, faster processing, batch)
6. **CDN**: Cloudflare for frontend + signed download URLs
7. **Monitoring**: Prometheus metrics, Grafana dashboards
8. **Docker**: Multi-stage Dockerfile with yt-dlp + FFmpeg pre-installed
