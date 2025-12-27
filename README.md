<div align="center">

  <img src="assets/1024.png" alt="App Icon" width="120" />

  <h2>Pocket8 • A native PICO-8 emulator for iOS.</h2>

  <p>
    <a href="https://github.com/jevonlipsey/pico-ios/releases/latest">
      ⬇️ Download the latest build
    </a>
    &nbsp;•&nbsp;
    <a href="https://ko-fi.com/jevonlipsey">
      ☕ Support on Ko-fi
    </a>
  </p>

</div>

https://github.com/user-attachments/assets/ec24f92e-d29a-4319-8293-439487d60b35

## Features

- **Native Persistence**: Implements a custom "Handoff & Sync" protocol ensuring 100% save-state integrity across app restarts.
- **Quick Save & Load**: The **only** PICO-8 experience with instant save states. Freeze time and resume anywhere, across devices.

<p align="center">
  <img src="assets/quickload.gif" width="20%" alt="libscroll" />
</p>

- **Adaptive Controls**: Custom Gameboy-esque controls with beautiful haptics. Emulator works in portrait and landscape modes. Swap to virtual joystick.

  <p align="center">
  <img src="assets/xzero-joystick.gif" width="50%" alt="libscroll" />
</p>

- **Smart Library**: Automatically extracts cartridge labels and metadata, presenting your collection in a polished grid.

<p align="center">
  <img src="assets/libscroll-new.gif" width="20%" alt="libscroll" />
</p>

## Under the Hood: A Rant

The core engineering challenge was **reconciling the asynchronous nature of iOS file I/O with the synchronous requirements of the Emscripten/WASM virtual file system.**

PICO-8 demands a synchronous file system. Bridging this to iOS required completely reverse-engineering the Emscripten boot sequence.

- **Bootloader Hijacking:** The engine defaults to booting the standard "JELPI" demo cart. To bypass this, I had to intercept the `Module.preRun` lifecycle, manually injecting user code into the WASM heap and forcing the pointer to the correct entry point before the runtime could initialize.
- **True State Persistence:** I architected a system that dumps the _entire simulated RAM_ into a serialized blob. I implemented **GZIP** compression to keep these memory snapshots lightweight, allowing for atomic, instant state restoration.

It’s _not_ a browser wrapper; it’s a custom runtime environment built for native iOS, enjoy the speeds!

## Tech Stack

![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)
![Capacitor](https://img.shields.io/badge/Capacitor-1199EE?style=for-the-badge&logo=capacitor&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)

## Installation

You can sideload Pocket8 via AltStore, SideStore, or Sideloadly.

### Auto-Update Source (Recommended)
Add the official source to **SideStore** or **AltStore** to get updates automatically (no computer needed!).

1. Copy this URL: `https://raw.githubusercontent.com/jevonlipsey/pico-ios/main/altstore.json`
2. Open SideStore/AltStore -> **Sources** -> **+** -> **Add Source**.

<p align="center">
  <img src="https://i.imgur.com/IEgMrg6.gif" width="20%" alt="Auto-Update Guide" />
</p>

### Manual Install
1. Download the `Pocket8.ipa` from [Releases](https://github.com/jevonlipsey/pico-ios/releases/latest).
2. Sideload via **AltStore**, **SideStore**, or **Sideloadly**.
3. Enable **Developer Mode** in iOS Settings (Settings > General > Device Management > Your Name).

## Project Status

This is a solo dev project designed to bring the PICO-8 communnity a beautiful native app for iPhones and iPads. I'm aiming to submit this to the AppStore as soon as possible, after all the positive support! Check back soon (:
### build from source
```bash
npm install && npx cap sync && npx cap open ios
```

## How to Get Games

### v1.4+

Use the BBS Browser by clicking the globe icon at the top. This lets you search lexaloffle's games in-app!

### Manually:

Pocket8 uses standard PICO-8 cartridges (`.p8` or `.p8.png`).

1.  **Visit the BBS**: Go to [lexaloffle.com/bbs](https://www.lexaloffle.com/bbs/) or [itch.io](https://itch.io/games/tag-pico-8).
2.  **Look for the Cart**: You need the **cartridge file**, not a zip or exe. Look for the little square image that looks like the game cover.
3.  **Save It**:
    - **Desktop**: Right-click the small "Cart" icon -> "Save Image As".
    - **iOS**: Tap and hold the cart image -> "Save to Files".
4.  **Import**: In Pocket8, tap the `+` icon and select your saved `.p8.png` file.

## Acknowledgements

- **[Zep (Lexaloffle)](https://www.lexaloffle.com/pico-8.php)**: For creating the fantasy console and being awesome in general. PICO-8 is a masterpiece of design constraints, I'm so excited to bring it to iOS!

- **You**: For actually reading the documentation. thanks for the support (:
