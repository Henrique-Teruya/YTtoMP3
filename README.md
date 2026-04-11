# 🎧 YouTube to Audio Converter

A minimalist and powerful web app that allows users to extract and download audio from YouTube videos in multiple formats such as MP3, WAV, and FLAC.

## 🚀 Features

- 🔗 Paste a YouTube video URL and convert it instantly  
- 🎵 Download audio in multiple formats:
  - MP3 (universal compatibility)
  - WAV (uncompressed audio)
  - FLAC (lossless compression)
- 🖼️ Preview video title and thumbnail before downloading
- 📦 Fast and lightweight processing
- 🌙 Modern dark UI

## 🧠 Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Tools:**
  - `yt-dlp` (for media extraction)
  - `ffmpeg` (for audio processing and conversion)

## 📁 Project Structure

```
youtube-to-mp3/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   └── downloader.js
├── downloads/      # Temporary storage for processing
├── package.json
└── README.md
```

## 🛠️ Installation & Setup

1. **Install System Dependencies:**
   Make sure you have `yt-dlp` and `ffmpeg` installed on your system.
   ```bash
   # Using pip for yt-dlp
   pip install yt-dlp

   # Using apt for ffmpeg (Ubuntu/Debian)
   sudo apt update && sudo apt install ffmpeg
   ```

2. **Install Node.js Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Server:**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

## ⚠️ Disclaimer

This project is intended for **educational purposes only**.
Downloading copyrighted content without permission may violate YouTube's Terms of Service and local laws. Use this tool responsibly.

---
Built with ❤️ for the Vibe Coding community.
