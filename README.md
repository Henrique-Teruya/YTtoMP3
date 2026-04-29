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

## 📥 Como baixar e instalar (Para o Usuário Final)

**Nota para o desenvolvedor:** Você deve gerar o instalador primeiro (veja a seção abaixo) e enviar apenas o arquivo `.exe` para seu amigo. Ele não precisa baixar o código do projeto.

1.  **Receba o arquivo**: Peça o arquivo `YTMP3 PRO Setup.exe` (encontrado na pasta `dist/` após o build).
2.  **Execute**: Dê um clique duplo no instalador.
3.  **Use**: Abra o app pelo atalho na Área de Trabalho e cole um link do YouTube.

---

## 🛠️ Como gerar o Instalador (Para o Desenvolvedor)

Siga estes passos para criar o arquivo que você vai enviar para seus amigos:

### 1. Preparar os Binários
Coloque os executáveis do Windows na pasta `bin/` (isso é essencial para o app funcionar sem Python/Node):
- `yt-dlp.exe`
- `ffmpeg.exe`
- `ffprobe.exe`

### 2. Gerar o Build
No terminal, dentro da pasta do projeto, rode:
```bash
npm install
npm run build
```

### 3. Localizar o Setup
Após o comando terminar, uma pasta chamada **`dist/`** será criada. O instalador profissional estará lá dentro:
👉 `dist/YTMP3 PRO Setup 1.1.0.exe`

---

## 🏗️ Arquitetura Desktop

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
