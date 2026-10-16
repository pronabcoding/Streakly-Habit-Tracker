# Streakly – Habit Tracker

Desktop habit tracker built with **Electron**, **HTML**, **CSS**, **JavaScript**, and **Node.js**.

## Features

- Add, edit, and delete habits
- Daily check-in (mark complete)
- Current streak + best streak tracking
- Last 7 days visual progress
- Stats dashboard
- Dark / Light theme
- Data saved to a real JSON file using Node.js `fs` module

## Project Structure

```
streakly/
├── package.json          # Project config + Electron dependency
├── main.js               # Main process (window + file storage)
├── preload.js            # Secure bridge (contextBridge)
└── renderer/
    ├── index.html        # UI structure
    ├── styles.css        # Styling
    └── renderer.js       # Frontend logic
```

## Architecture

| Layer            | File          | Responsibility                          |
|------------------|---------------|-----------------------------------------|
| Main Process     | `main.js`     | Creates window, handles file I/O (Node.js) |
| Preload Script   | `preload.js`  | Exposes safe APIs via `contextBridge`   |
| Renderer         | `renderer/`   | HTML/CSS/JS – the UI users see          |

## How to Run

```bash
cd streakly
npm install
npm start
```

## Requirements Covered

- ✅ HTML, CSS, Renderer JS
- ✅ Preload script
- ✅ Main process
- ✅ Node.js (`fs` module for saving habits)
- ✅ Electron Main / Preload / Renderer architecture
