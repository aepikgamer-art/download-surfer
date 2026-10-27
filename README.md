# Download Surfer

A Firefox extension that opens an **original Subway-Surfers-style endless runner** whenever you have a download in progress - so waiting for files actually becomes fun.

> 100% original game code and art. Not affiliated with, and contains no assets from, SYBO's Subway Surfers.

## Made with AI

This project was made **100% with AI** - the entire extension (game code, background script, popup, docs, and this repository itself) was built and published entirely by an AI agent using [Composio](https://composio.dev), with no human-written code.

## Features

- Detects active downloads via the WebExtension `downloads` API
- Auto-opens a 3-lane endless runner (jump, duck, swap lanes, collect coins)
- Live download progress bar on the game HUD
- Settings popup: auto-open on/off, close when done on/off, manual play
- High score saved locally

## Install (temporary, for testing)

1. Clone this repo
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select `manifest.json`

To install permanently: zip the folder and submit to [addons.mozilla.org](https://addons.mozilla.org/developers/).

## Controls

| Action | Keys | Touch |
|---|---|---|
| Swap lanes | arrows left/right or A/D | swipe left/right |
| Jump | arrow up or W | swipe up |
| Duck | arrow down or S | swipe down |

## How it works

- `background.js` watches `downloads.onCreated/onChanged`, opens the game window, and streams progress to it
- `game.js` is a self-contained canvas game: perspective track, obstacles (jump/duck), coins, increasing speed
- The game ends when your download finishes (or you crash - whichever hurts more)

## Files

```
manifest.json    WebExtension manifest (MV2, Firefox)
background.js    download watcher + window manager
game.html/js     the endless runner
popup.html/js    toolbar settings popup
icon.png         extension icon
```

## License

MIT
