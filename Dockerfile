# ClipMax render worker — runs on Railway/Render/Fly (NOT Vercel).
# Provides the yt-dlp + ffmpeg binaries the video pipeline needs.
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      fonts-dejavu-core \
      python3 \
      curl \
      ca-certificates \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# The worker is a long-running poller; no HTTP port needed.
CMD ["npx", "tsx", "worker/index.ts"]
