# 🎵 YTMP3 PRO

**Professional YouTube to Audio Converter** — A production-grade platform for extracting high-quality audio from YouTube videos.

> Convert any YouTube video to MP3, WAV, FLAC, or M4A with a premium SaaS-grade interface.

---

## ✨ Features

- 🔗 **Smart URL Input** — Paste any YouTube URL (videos, shorts, playlists)
- 🎵 **Multi-Format** — MP3 (universal), WAV (lossless), FLAC (hi-fi), M4A (Apple)
- 🖼️ **Video Preview** — Automatic thumbnail, title, channel, and duration
- 📊 **Real-Time Progress** — Live progress bar via Server-Sent Events (SSE)
- ⚡ **Status Tracking** — Queued → Downloading → Converting → Completed
- 📥 **Auto-Download** — File downloads automatically when ready
- 🕐 **History** — Recent conversions saved in browser
- 🎨 **Premium UI** — Dark audio-studio aesthetic, glassmorphism, waveform animations
- 🔒 **Secure** — Input validation, rate limiting, anti-injection
- 📱 **Responsive** — Works on mobile, tablet, and desktop

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Download Engine** | yt-dlp (official) |
| **Audio Conversion** | FFmpeg |

---

## 📁 Project Structure

```
ytmp3-pro/
├── frontend/
│   ├── index.html          # Semantic HTML with SEO
│   ├── style.css           # Complete design system
│   ├── script.js           # SPA application logic
│   └── assets/             # Static assets
├── backend/
│   ├── server.js           # Express app entry point
│   ├── config/
│   │   └── index.js        # Centralized configuration
│   ├── routes/
│   │   ├── convert.routes.js
│   │   └── info.routes.js
│   ├── controllers/
│   │   ├── convert.controller.js
│   │   └── info.controller.js
│   ├── services/
│   │   ├── ytdlp.service.js   # yt-dlp spawn wrapper
│   │   ├── queue.service.js   # Job queue + concurrency
│   │   └── file.service.js    # File management
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── utils/
│   │   ├── errors.js       # Custom error hierarchy
│   │   ├── logger.js       # Structured logging
│   │   └── sanitizer.js    # Input validation
│   └── downloads/          # Temporary audio files
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── CONTEXT.md
└── DESIGN.md
```

---

## 🚀 Getting Started

### Prerequisites

You need three tools installed:

#### 1. Node.js (v18+)

```bash
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows — download from https://nodejs.org
```

#### 2. yt-dlp

```bash
# macOS
brew install yt-dlp

# pip (all platforms)
pip install yt-dlp

# Ubuntu
sudo apt install yt-dlp
```

#### 3. FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows — download from https://ffmpeg.org/download.html
```

### Installation

```bash
# Clone the project
git clone <repository-url>
cd ytmp3-pro

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Verify dependencies
npm run check:deps
```

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Reference

### `POST /api/info`

Fetch video metadata without downloading.

**Body:** `{ "url": "https://youtube.com/watch?v=..." }`

**Response:**
```json
{
  "status": "ok",
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "thumbnail": "https://i.ytimg.com/...",
    "duration": 212,
    "channel": "Channel Name"
  }
}
```

### `POST /api/convert`

Start a conversion job.

**Body:** `{ "url": "...", "format": "mp3" }`

**Response:** `{ "status": "queued", "jobId": "uuid" }`

### `GET /api/convert/:jobId/status`

SSE endpoint streaming real-time progress.

### `GET /api/convert/:jobId/download`

Download the completed audio file.

### `DELETE /api/convert/:jobId`

Cancel a running job.

### `GET /api/health`

Server health check with queue stats.

---

## ⚙️ Configuration

All settings are configured via `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `YT_DLP_PATH` | `yt-dlp` | Path to yt-dlp binary |
| `FFMPEG_PATH` | `ffmpeg` | Path to FFmpeg binary |
| `MAX_CONCURRENT_DOWNLOADS` | `3` | Max parallel downloads |
| `DOWNLOAD_TIMEOUT_MS` | `300000` | Download timeout (5 min) |
| `FILE_RETENTION_MINUTES` | `30` | Auto-cleanup after N min |
| `RATE_LIMIT_MAX_CONVERT` | `10` | Max conversions per 15 min |

---

## 🔒 Security

- **Input Validation** — YouTube URL regex + format whitelist
- **Sanitization** — Shell metacharacter rejection (prevents command injection)
- **Rate Limiting** — Tiered per-endpoint limits
- **Helmet** — Security headers (CSP, HSTS, etc.)
- **Path Traversal Prevention** — Safe path resolution
- **Timeout Control** — Kills stuck processes
- **No `exec()`** — Uses `spawn()` exclusively (no shell interpolation)

---

## 🛣️ Roadmap

- [ ] Docker / Docker Compose
- [ ] User authentication
- [ ] Playlist batch download with ZIP
- [ ] Audio quality selector (bitrate)
- [ ] Drag-and-drop URL
- [ ] PWA support
- [ ] Database-backed history
- [ ] Admin dashboard
- [ ] Usage analytics
- [ ] Payment integration (SaaS tier)

---

## ⚠️ Disclaimer

This project is for **personal and educational use only**. Downloading copyrighted content without permission may violate YouTube's Terms of Service and applicable laws. Use responsibly.

---

## 📝 License

MIT

---

Built with precision by **YTMP3 PRO**.
