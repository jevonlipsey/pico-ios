import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

export class PicoBridge {
  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
    this.isRunning = false;
    this.saveInterval = null;
  }

  // Helper: Robust Base64 to Uint8Array conversion (Fixes "5 chars" truncation)
  base64ToUint8Array(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  init(canvasElement) {
    this.canvas = canvasElement;
    // Setup Global PICO-8 Environment Variables expected by game.js
    window.pico8_gpio = new Array(128);
    window.p8_is_running = false;

    // Phase 71: Binary Integrity Enforcement
    // We must ensure the engine receives a pure Uint8Array and treats it as a PNG.

    let handoffName = null;

    // IMMEDIATE MEMORY LOAD
    try {
      const rawPayload = localStorage.getItem("pico_handoff_payload");
      handoffName = localStorage.getItem("pico_handoff_name");

      if (rawPayload) {
        // Step 2: Robust Binary Conversion
        const cleanData = rawPayload.replace(/^data:.*;base64,/, "");

        try {
          const bytes = this.base64ToUint8Array(cleanData);

          // ACTION: Assign to window._cartdat as PURE Uint8Array
          window._cartdat = bytes;

          console.log(
            `⚡️ [PicoBridge] Injected ${bytes.length} bytes into window._cartdat`
          );
          console.log(`⚡️ [PicoBridge] Data Type: ${bytes.constructor.name}`); // Should be Uint8Array

          // ACTION: Header Check (First 8 bytes of PNG signature)
          // 89 50 4E 47 0D 0A 1A 0A
          const header = Array.from(bytes.slice(0, 8))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ");
          console.log(`⚡️ [PicoBridge] HEADER: ${header}`);
        } catch (e) {
          console.error("❌ [PicoBridge] Binary Conversion Failed:", e);
        }
      }
    } catch (e) {
      console.error("❌ Handoff Read Failed:", e);
    }

    // -----------------------------------------------------------
    // [4] EMSCRIPTEN CONFIG
    // -----------------------------------------------------------
    const canvasRef = this.canvas;

    window.Module = {
      // Use getter to ensure fresh DOM reference to prevent crash
      get canvas() {
        return canvasRef || document.getElementById("canvas");
      },
      // ERROR "5 chars" FIX: Force correct extension via _cartname, NOT arguments
      arguments: ["-run", "/cart.png"],
      noInitialRun: true, // Prevent engine from starting until we say so (fix race condition)
      preRun: [
        function () {
          console.log("🔧 [PicoBridge] preRun: Inspecting FS...");

          // Debug Canvas
          const c = window.Module.canvas;
          console.log(
            `🎨 [PicoBridge] Canvas Status: ${c ? "FOUND" : "MISSING"} (${
              c ? c.id : ""
            })`
          );

          // POLLER: Wait for Global FS (Phase 68)
          const poller = setInterval(() => {
            // Check for the Global FS exposed from pico8.js
            if (window.FS) {
              console.log("⚡️ [PicoBridge] Global FS Detected!");

              // 1. Setup Persistence
              try {
                window.FS.mkdir("/pico-8");
                window.FS.mount(window.Module.IDBFS, {}, "/pico-8");
                window.FS.syncfs(true, (err) => {
                  if (err) console.error("❌ IDBFS Mount Failed:", err);
                  else console.log("✅ [PicoBridge] Save System Mounted");
                });
              } catch (e) {
                console.warn("Mount skipped/failed", e);
              }

              // Inject into Global Scope (for pico8.js to pick up)
              // This is where the _cartname is set for the engine.
              if (window._cartdat && window._cartdat.length > 0) {
                window._cartname = ["cart.png"]; // Ensure it's 'cart.png'

                // 2. INJECT CARTRIDGE (Phase 68 Protocol)
                try {
                  const data =
                    window._cartdat instanceof Uint8Array
                      ? window._cartdat
                      : new Uint8Array(window._cartdat);

                  try {
                    window.FS.unlink("/cart.png");
                  } catch (e) {}

                  // User Request: Use FS.writeFile directly
                  window.FS.writeFile("/cart.png", data);

                  console.log(
                    `💾 [PicoBridge] Phase 72: Wrote /cart.png (${data.length} bytes)`
                  );

                  // Verify
                  const stat = window.FS.stat("/cart.png");
                  console.log(`🔍 [PicoBridge] VFS Stat: ${stat.size} bytes`);

                  // CRITICAL: Clear _cartdat to prevent engine from using the broken embedded loader.
                  // This forces it to load the file we just wrote from VFS via arguments: ["-run", "/cart.png"]
                  delete window._cartdat;
                  console.log(
                    "⚡️ [PicoBridge] Cleared window._cartdat to bypass embedded loader."
                  );

                  // START ENGINE
                  console.log("🚀 [PicoBridge] Starting PICO-8 Engine...");

                  // Phase 73: Force Offline
                  window.lexaloffle_bbs_player = 0;

                  window.Module.callMain(window.Module.arguments);

                  clearInterval(poller);
                } catch (e) {
                  console.error("❌ [PicoBridge] VFS Write Failed:", e);
                }
              } else {
                console.warn(
                  "⚠️ [PicoBridge] No _cartdat found. Skipping injection."
                );
                clearInterval(poller);
              }
            }
          }, 100);
        },
      ],

      print: (text) => {
        console.log("[PICO-8]", text);
        // HOOK: Detect Mount Complete
        if (
          text.includes("mounted filesystem") ||
          text.includes("Found config.txt")
        ) {
          window.pico8_fs_mounted = true;
          console.log("⚡️ [PicoBridge] DETECTED MOUNT SIGNAL");
        }
      },
      printErr: (text) => console.error("[PICO-8 Error]", text),
      setStatus: (text) => {
        /* Silenced per user request */
      },
      onRuntimeInitialized: () => {
        console.log("⚡️ [PicoBridge] Runtime Initialized (Ghost Active).");
        window.p8_is_running = true;
        window.HANDOFF_COMPLETE = true;
      },
    };

    // IMPLEMENT MEMORY HANDOFF INJECTOR (Zero-Disk)
    window.injectCartridge = async (base64, filename) => {
      // console.log("Memory Handoff Start"); // Silenced
      try {
        // 1. Write Source of Truth to RAM (localStorage)
        localStorage.setItem("pico_handoff_payload", base64);
        localStorage.setItem("pico_handoff_name", filename);

        // 2. Hard Reload to Boot Mode
        // Using ?cart=boot&boot=1 to satisfy Player.vue and Kickstart
        window.location.href = `index.html?cart=boot&boot=1&t=${Date.now()}`;
      } catch (e) {
        console.error("Failed to stash cart:", e);
        alert(`Launch Failed: ${e.message}`);
      }
    };

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Interceptors are largely obsolete with the VFS injection method,
    // but we allow this method to exist to prevent init() from crashing.
    console.log("⚡️ [PicoBridge] Interceptors setup (Legacy Mode - Passive)");
  }

  async injectEngine(cartridgeName) {
    // console.log(`injectEngine: ${cartridgeName}`); // Silenced

    // CASE A: BOOT MODE (cartridge is 'boot')
    if (cartridgeName === "boot" || cartridgeName === "boot.p8") {
      // Just load the engine script. preRun will handle the rest.
      if (document.getElementById("pico8-engine-script")) return;
      const script = document.createElement("script");
      script.id = "pico8-engine-script";
      script.src = "/pico8.js";
      script.async = true;
      document.body.appendChild(script);
      return;
    }

    // CASE B: HANDOFF MODE (The User Clicked a Game)
    let cartData = null;

    // MEMORY-STREAM HANDOFF CHECK
    const stashedName = localStorage.getItem("pico_filename_handoff");
    const stashedData = localStorage.getItem("pico_cart_handoff");
    if (stashedName === cartridgeName && stashedData) {
      console.log(
        `⚡️ [PicoBridge] Using Memory-Stream Handoff for ${cartridgeName}`
      );
      cartData = stashedData;
    }

    if (!cartData) {
      try {
        // Try Carts/ first
        const primaryPath = `Carts/${cartridgeName}`;

        let res = null;
        try {
          res = await Filesystem.readFile({
            path: primaryPath,
            directory: Directory.Documents,
            // NO ENCODING -> Returns Base64 by default in Capacitor
          });
        } catch (e) {
          throw e;
        }
        cartData = res.data;
      } catch (e) {
        console.error(`❌ Bridge Error: ${e.message}`);
        return;
      }
    }

    if (cartData && window.injectCartridge) {
      window.injectCartridge(cartData, cartridgeName);
    }
  }

  teardown() {
    console.log("[PicoBridge] Teardown...");
    window.p8_is_running = false;

    try {
      if (window.Module && window.Module.pauseMainLoop) {
        window.Module.pauseMainLoop();
      }
    } catch (e) {}

    if (window.pico8_audio_context) {
      try {
        window.pico8_audio_context.close();
      } catch (e) {}
      window.pico8_audio_context = null;
    }

    window.Module = null;
    const scripts = document.querySelectorAll('script[src="/pico8.js"]');
    scripts.forEach((s) => s.remove());

    if (window.injectCartridge) {
      window.injectCartridge = undefined;
    }
  }

  pause() {
    if (window.Module && window.Module.pauseMainLoop) {
      window.Module.pauseMainLoop();
      window.p8_is_running = false;
    }
  }

  resume() {
    if (window.Module && window.Module.resumeMainLoop) {
      window.Module.resumeMainLoop();
      window.p8_is_running = true;
    }
  }

  resumeAudio() {
    if (
      window.pico8_audio_context &&
      window.pico8_audio_context.state === "suspended"
    ) {
      window.pico8_audio_context.resume().then(() => {
        console.log("🔊 [PicoBridge] Audio Context Resumed");
      });
    } else if (
      Module.sdl_audio_context &&
      Module.sdl_audio_context.state === "suspended"
    ) {
      Module.sdl_audio_context.resume();
    }
  }
}

export const picoBridge = new PicoBridge();
