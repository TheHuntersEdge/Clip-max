# ClipMax — Claude Code Build Brief

Paste this into Claude Code (in an empty project folder) to kick off the real build. Work through it phase by phase — don't try to build it all at once.

---

## What we're building

**ClipMax** is an auto-clipping platform for streamers and long-form creators. The core loop:

> A creator connects their stream once. Every time they end a stream, ClipMax automatically pulls the VOD, finds the best moments with AI, cuts them into vertical short-form clips with captions and branding, and auto-posts them across every connected account (TikTok, Instagram Reels, YouTube Shorts) — on full autopilot.

Plus an **account marketplace** where creators buy aged/warmed posting accounts that auto-connect into their pipeline.

The play is **mass distribution**: clip everything, post everywhere, zero manual work.

## Brand

- Name: **ClipMax** (display as Clip**Max**, "Max" in cyan)
- Primary accent: cyan `#06DBFD`
- Backgrounds: near-black `#05080B`, deep `#0A1218`, card `#0E1A20`
- Lines: `#16242C` / `#1D2F39`
- Text: `#E6F0F3`, muted `#7C8B93`
- Status: good `#22D39A`, warn `#F3B13A`, bad `#E85D52`
- Fonts: Inter (UI), JetBrains Mono (numbers/data)
- Logo: angular cyan spear/arrowhead on black (SVG asset provided separately — `clipmax-logo.svg`)
- Voice: direct, throughput-focused, no corporate fluff. "Clip everything. Post everywhere."

## Reference

A complete clickable frontend prototype exists (`ClipMax.html`) showing every page, layout, and the brand. **Build the real app to match that prototype's look and structure.** It's the visual spec.

---

## Tech stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS, dark theme, the brand tokens above as CSS variables
- **DB:** Postgres via Prisma (Supabase or Neon to start)
- **Auth:** NextAuth or Clerk
- **Queue:** Redis + BullMQ (background video jobs)
- **Workers:** separate Node/Python services for VOD fetch, transcription, scoring, render
- **Storage:** Cloudflare R2 or S3 (VODs + finished clips)
- **Video:** FFmpeg for cutting/captioning/reframing
- **Transcription:** Deepgram API to start (swap to self-hosted Whisper later)
- **AI scoring:** Anthropic Claude API (rank clip moments from transcript)
- **Live detection:** Twitch EventSub webhooks (platform #1)
- **Payments:** Stripe (subscriptions + marketplace checkout)
- **Publishing:** abstract a per-platform adapter layer (TikTok/IG/YT/FB)

Keep the web app and the background workers as separate concerns from day one — video jobs are slow and must not block the app.

---

## Build phases (do these in order)

### Phase 0 — Scaffold
- Next.js + TypeScript + Tailwind + Prisma + auth
- Dark theme with brand tokens; sidebar nav matching the prototype
- Pages as empty shells: Dashboard, Sources, Clips, Operator, Campaigns, Calendar, Accounts, Marketplace, Analytics, Inbox, Integrations, Team, White Label
- Deploy a hello-world to Vercel so the pipeline works

### Phase 1 — The core loop (Twitch only) ← the real product
This is the smallest slice that delivers the whole promise. Get ONE stream → clips → posted.
1. **Connect Twitch** — OAuth, store channel, subscribe to EventSub `stream.online` / `stream.offline`
2. **Webhook receiver** — on `stream.offline`, queue a VOD-fetch job
3. **VOD fetch worker** — download the VOD (yt-dlp) to R2/S3, stream it, never load to memory
4. **Transcribe worker** — Deepgram, word-level timestamps
5. **Moment-score worker** — send transcript to Claude, get back ranked clip windows (start, end, title, reason)
6. **Render worker** — FFmpeg: cut each window, reframe 16:9→9:16, burn word-level captions
7. **Clips page** — review grid showing rendered clips with score, title, status
8. **Sources page** — connect button, live status, stream history with clip counts

Ship Phase 1 before touching anything below. Prove the loop on a real stream.

### Phase 2 — Autopilot + polish
- Auto-post finished clips via the publishing layer (start with one platform)
- Apply brand (logo bug, caption style, colors) to clips
- Speaker-tracking reframe (keep the face centered)
- Per-source settings: clips per stream, auto-post on/off, target accounts, schedule
- Clip-level analytics (views/likes/reach back into Dashboard + Analytics)

### Phase 3 — More sources + smarter clipping
- Add Kick and YouTube Live as sources
- Add **chat-velocity** signal to moment scoring (message-rate spikes = best moments — big edge)
- Optional AI voiceover / AI-clone clip types

### Phase 4 — Account marketplace
- Inventory model (platform, niche, age, followers, warmup status, region, price)
- Storefront with filters + cart + Stripe checkout
- On purchase: provision account, auto-connect into the publishing pipeline
- ⚠️ Get legal review first — account resale violates platform ToS; consider "managed provisioning" framing

### Phase 5 — Scale + white-label
- Expose ClipMax through a white-label reseller layer (branding, domains, client workspaces, plan tiers)
- Meter plans by stream-minutes / clips / accounts (that's what costs you money)
- Cost optimization: self-host Whisper, GPU autoscaling, delete source VODs after clipping

---

## Data model (starting point)

```
User, Workspace, Membership
Source        (platform, channelId, oauthTokens, status)
Stream        (sourceId, vodUrl, startedAt, endedAt, status)
Clip          (streamId, start, end, title, score, caption, status, renderUrl)
Account       (workspaceId, platform, handle, source: connected|purchased, health)
Post          (clipId, accountId, scheduledAt, postedAt, status, metrics)
Campaign      (workspaceId, name, targetAccounts, schedule, status)
MarketListing (platform, niche, age, followers, warmStatus, region, price, status)
```

---

## The two things that make or break this

1. **Moment scoring quality.** Picking the right 30 seconds out of a 4-hour stream IS the product. Invest here. Score on: transcript hook strength, emotional peak, audio energy, chat velocity, self-containment. Let Claude read the timestamped transcript and rank. Launch with a review toggle so bad clips don't auto-post while you tune it.

2. **Render cost control.** Video is expensive (storage + transcription + render compute). Delete source VODs after clipping. Meter usage. Don't let a heavy user run you negative.

---

## First message to send Claude Code

> "Let's build Phase 0: scaffold a Next.js + TypeScript + Tailwind + Prisma app with NextAuth, a dark theme using these brand tokens [paste tokens], and a sidebar layout matching the ClipMax prototype with empty page shells for Dashboard, Sources, Clips, Operator, Campaigns, Calendar, Accounts, Marketplace, Analytics, Inbox, Integrations, Team, and White Label. Then deploy to Vercel."

Then go phase by phase. Build the loop. Prove it on one stream. Then scale it everywhere.
