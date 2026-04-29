# 🎵 YTMP3 PRO (Desktop Edition)

**Professional YouTube to Audio Desktop App** — A powerful, standalone tool for Windows that extracts high-quality audio from YouTube videos with zero setup for the end-user.

> Convert any YouTube video to MP3, WAV, FLAC, or M4A with a premium studio-grade interface. No Node.js, Python, or command line required for the end-user.

---

## ✨ Features

- 🖥️ **Standalone App** — Runs as a native Windows application.
- 🔗 **Smart URL Input** — Paste any YouTube URL (videos, shorts, playlists).
- 🎵 **Multi-Format** — MP3 (universal), WAV (lossless), FLAC (hi-fi), M4A (Apple).
- 🖼️ **Video Preview** — Automatic thumbnail, title, and channel detection.
- 📊 **Real-Time Progress** — Live progress bar and status updates.
- 📥 **Direct to Downloads** — Automatically saves files to your Windows **Downloads** folder.
- 🎨 **Premium UI** — Dark studio aesthetic with glassmorphism and waveform animations.
- 🚀 **Zero Setup** — All dependencies (yt-dlp, FFmpeg) are bundled inside.

---

## 📥 How to Install (For Users)

If you have the installer (`YTMP3 PRO Setup.exe`):

1.  **Download** the `YTMP3 PRO Setup.exe`.
2.  **Run** the installer.
3.  **Open** the app from your desktop or Start menu.
4.  **Paste** a YouTube link and click **Converter Agora**.

The converted file will appear automatically in your **Downloads** folder.

---

## 🛠️ How to Build (For Developers)

To generate the `.exe` installer yourself:

### 1. Prerequisites
- **Node.js** (v18+) installed on your machine.
- **Binaries**: You must place the following Windows executables in the `bin/` folder:
  - `yt-dlp.exe`
  - `ffmpeg.exe`
  - `ffprobe.exe`

### 2. Setup
```bash
# Install project dependencies
npm install
```

### 3. Build the Installer
```bash
# Generate the .exe in the /dist folder
npm run build
```

---

## 🏗️ Architecture

- **Shell**: Electron
- **Backend**: Express.js (embedded)
- **Engine**: yt-dlp + FFmpeg (bundled binaries)

---

## 📁 Project Structure

```
ytmp3-pro/
├── bin/                # Bundled .exe binaries (yt-dlp, ffmpeg)
├── src/                # Electron main & preload scripts
├── frontend/           # UI (HTML/CSS/JS)
├── backend/            # Logic (Express Services)
├── dist/               # Generated installers (after build)
└── package.json        # Build configuration
```

---

## ⚠️ Disclaimer

This project is for **personal use only**. Downloading copyrighted content without permission may violate YouTube's Terms of Service and applicable laws. Use responsibly.

---

## 📝 License

MIT — Built with precision by **YTMP3 PRO**.
