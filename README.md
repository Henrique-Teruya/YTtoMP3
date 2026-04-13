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

## 📖 How to Use

1. **Paste the Link:** Copy the URL of the YouTube video you want to convert and paste it into the input field.
2. **Select Format:** Choose your preferred audio format (MP3, WAV, or FLAC) from the dropdown menu.
3. **Download:** Click the "Download" button. The app will process the video and your download will start automatically once it's ready.

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

## 🛠️ Self-Hosting & Local Development

If you wish to run your own instance of this application locally or host it yourself, follow these steps:

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
