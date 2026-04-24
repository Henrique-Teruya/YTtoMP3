# ═══════════════════════════════════════════════════════
# YTMP3 PRO — Production Dockerfile
# Optimized for Railway / Render / Production environments
# ═══════════════════════════════════════════════════════

FROM node:20-bookworm-slim

# 1. Install System Dependencies (Python for yt-dlp, FFmpeg for audio processing)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python-is-python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Install yt-dlp via pip (standard approach for production)
RUN pip3 install --no-cache-dir yt-dlp

# 3. Verify Installations
RUN yt-dlp --version && ffmpeg -version

# 4. Set Working Directory
WORKDIR /app

# 5. Copy Package Files
COPY package*.json ./

# 6. Install Node.js Dependencies (Production only)
RUN npm install --production

# 7. Copy Application Source
COPY . .

# 8. Setup Environment & Permissions
# Ensure the downloads directory exists and has correct permissions
RUN mkdir -p backend/downloads && chmod 777 backend/downloads

# 9. Environment Variables Defaults
ENV NODE_ENV=production
ENV PORT=3000

# 10. Expose the port
EXPOSE 3000

# 11. Start the server
CMD ["npm", "start"]
