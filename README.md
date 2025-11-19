# Plasmon

PCMan BBS Client on Electron

A modern BBS (Bulletin Board System) client built with Electron, designed for connecting to PTT and other BBS servers.

## Requirements

- Node.js 18+

## Installation

```bash
npm install
```

## Development

### Quick Start

The project requires [pcman.js](https://github.com/pcman-bbs/pcman.js) library. If pcman.js is not available on npm, please use `npm link pcman` to develop locally.

```bash
# Install dependencies
npm install

# Build and run the application
npm start

# Run in development mode with inspector
npm run dev
```

## Building & Distribution

```bash
# Build distributable package for your current OS
npm run dist
```

## Connection Protocol

This client now uses **SSH** to connect to BBS servers (port 22) instead of the deprecated telnet protocol (port 23). PTT and most modern BBS servers have disabled telnet and now require SSH connections.

### Architecture

- Main process: `main.js` (Node.js environment)
- Preload script: `preload.js` (Bridge between main and renderer)
- Renderer process: `app.js` → `script.js` (Web environment)

## Known Issues

- Context menu functionality needs reimplementation (removed remote Menu API)
- Consider implementing custom HTML/CSS context menu or using IPC-based menu
