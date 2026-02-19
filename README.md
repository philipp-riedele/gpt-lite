# GPT Lite

Lightweight desktop client for ChatGPT. Loads the phone UI for faster responses, smaller bundles, and lower memory usage compared to the regular desktop interface.

## What it does

ChatGPT serves a separate, lighter frontend to mobile browsers. GPT Lite sets a phone User-Agent so you get that fast version in a native desktop window. No device emulation, no hacks — just the mobile token in the UA string.

Concrete differences vs the desktop web version:
- Smaller JavaScript bundle (the mobile build skips heavy desktop-only components)
- Less DOM overhead (simpler layout, fewer animations)
- Lower baseline memory (~150 MB vs ~300+ MB in a full browser tab)
- Faster initial load

## Features

- Phone User-Agent (Pixel 8 / Android 14 / Chrome 121) for the lightweight ChatGPT bundle
- Floating refresh button (top right corner)
- Context menu with copy, paste, cut, select all, URL copy, link copy, image copy
- Session persistence (stays logged in between launches)
- External links open in default browser, ChatGPT/auth links stay in-app
- Cross-platform: Linux, Windows, macOS

## Install

### From source

```bash
git clone https://github.com/philipp-riedele/gpt-lite.git
cd gpt-lite
npm install
```

**Run in dev mode:**

```bash
npm run dev
```

**Build for your platform:**

```bash
npm run build:linux   # AppImage + .deb
npm run build:win     # .exe (NSIS + portable)
npm run build:mac     # .dmg + .zip
```

Output lands in `release/`.

### Requirements

- Node.js 18+
- npm

## How it works

The entire app is a single TypeScript file (`src/main.ts`, ~170 lines). It creates an Electron BrowserWindow, sets the User-Agent to a Pixel 8 phone string, and loads `chatgpt.com`. That's it.

The "Mobile" token in the UA is what triggers ChatGPT's server to send the phone-optimized JavaScript bundle. No viewport tricks, no device emulation API — the UA alone is sufficient.

## Not affiliated with OpenAI

This is an unofficial wrapper. It loads the official ChatGPT website. No data collection, no telemetry. You use your own ChatGPT account (free or paid). The app does not modify, intercept, or store any ChatGPT data.

## License

MIT
