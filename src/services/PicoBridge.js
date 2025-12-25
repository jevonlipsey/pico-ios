import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { haptics } from "../utils/haptics";

/**
 * architecture:
 * 1. prepares window.module with poison protocol.
 * 2. injects cartridge into vfs via poller.
 * 3. clears _cartdat to bypass embedded loader.
 * 4. forces offline mode.
 * 5. boots engine via callmain.
 */
// initialize global bridge namespace, prevents race conditions
window.picoBridge = {
  syncFromNative: async () => {
    console.log(
      "[PicoBridge] bridge warming up... (syncFromNative called early)"
    );
  },
  syncToNative: async () => {
    console.warn(
      "[PicoBridge] bridge warming up... (syncToNative called early)"
    );
  },
};

class Pico8Bridge {
  constructor() {
    this.isActive = false;
    this.initGlobalState();
  }

  initGlobalState() {
    // # required by game.js schema
    window.pico8_gpio = new Array(128);
    window.p8_is_running = false;

    // # persistence placeholders
    window.picoSave = () => {
      /* system not ready yet */
    };
    window.picoLoad = () => {
      /* system not ready yet */
    };
  }

  /**
   * boot a cartridge
   * @param {string} cartName - filename (e.g. "celeste.p8")
   * @param {Uint8Array} cartData - binary data
   */
  async boot(cartName, cartData) {
    if (this.isActive) {
      this.shutdown();
    }

    this.isActive = true;
    this.currentCartName = cartName;
    console.log(`[PicoBridge] booting: ${cartName}`);

    // # silence internal engine
    localStorage.setItem("pico8_debug", "0");
    this.isActive = true;

    // ## prepare global state for injection
    // # storage for poller to pick up
    window._cartdat = cartData;
    window._cartname = ["cart.png"];

    // ## configure emscripten module
    window.Module = {
      // # dynamic canvas getter
      get canvas() {
        return document.getElementById("canvas");
      },

      // # force pico-8 to use /appdata for saves/config
      arguments: ["-run", "/cart.png", "-home", "/appdata"],

      // # race condition fix
      noInitialRun: true,

      preRun: [
        function () {
          console.log("[Pico8Bridge] preRun: starting...");

          try {
            Filesystem.mkdir({
              path: "Saves",
              directory: Directory.Documents,
              recursive: true,
            }).catch(() => {});
          } catch (e) {}

          // ## immediate fs mount
          try {
            // # emscripten fs is available in prerun
            const fs = Module.FS;
            if (fs) {
              try {
                fs.mkdir("/appdata");
              } catch (e) {}
              fs.mount(Module.IDBFS, {}, "/appdata");
              console.log("[PicoBridge] /appdata mounted (preRun)");
              if (window._cartdat) {
                try {
                  console.log("[PicoBridge] pre-creating /cart.png");
                  Module.FS.createDataFile(
                    "/",
                    "cart.png",
                    new Uint8Array(window._cartdat),
                    true,
                    true,
                    true
                  );
                } catch (e) {
                  console.warn("pre-create failed", e);
                }
              }
            }
          } catch (e) {
            console.warn("preRun fs mount skipped", e);
          }

          // ## pulse-start & anti-stall
          console.log("[PicoBridge] pulse-starting engine...");
          window.pico8_buttons = [0];
          window.pico8_gpio = new Array(128);

          // # force fs release logic
          if (!Module.FS && typeof FS !== "undefined") {
            Module.FS = FS;
            console.log("[PicoBridge] Module.FS = FS (global) forced.");
          }
          // # fallback to window.fs
          if (!Module.FS && window.FS) {
            Module.FS = window.FS;
            console.log("[PicoBridge] Module.FS = window.FS forced.");
          }

          console.log("[Pico8Bridge] preRun: starting vfs poller...");
          let pollCount = 0;
          const MAX_POLLS = 300; // # 15 seconds timeout

          const poller = setInterval(async () => {
            pollCount++;

            // ## the one true fs check
            const mod = window.Module;
            const engineReady =
              mod && mod.FS && typeof mod.callMain === "function";

            let fs = null;
            if (engineReady) {
              fs = mod.FS;
              if (!window.pico8_engine_ready) {
                window.FS = fs;
                window.pico8_engine_ready = true;
                console.log("[PicoBoot] engine ready (module.fs checks out)");
              }
            }

            const canvasEl = document.getElementById("canvas");
            const hasCallMain = engineReady;
            const hasCart = !!window._cartdat;

            // # debug heartbeat (every 1s)
            if (pollCount % 20 === 0) {
              console.log(
                `[PicoBoot] poll #${pollCount}: fs=${!!fs}, canvas=${!!canvasEl}, callmain=${hasCallMain}, cart=${hasCart}`
              );
            }

            // # timeout failsafe
            if (pollCount > MAX_POLLS) {
              console.error("[Error] TIMEOUT: engine failed to initialize.");
              clearInterval(poller);
              haptics.error();
              return;
            }

            if (fs) {
              // # check sync status
              if (fs) {
                console.log("[PicoBoot] fs checking in...");
                // ## pull from native saves
                if (
                  window.picoBridge &&
                  typeof window.picoBridge.syncFromNative === "function"
                ) {
                  window.picoBridge.syncFromNative().then(() => {
                    fs.syncfs(true, (err) => {
                      if (!err)
                        console.log("[PicoBoot] initial sync configured");
                    });
                  });
                } else {
                  // # fallback class method
                  if (
                    picoBridge &&
                    typeof picoBridge.syncFromNative === "function"
                  ) {
                    picoBridge.syncFromNative().then(() => {
                      fs.syncfs(true, (err) => {
                        if (!err)
                          console.log("[PicoBoot] initial sync (fallback)");
                      });
                    });
                  } else {
                    console.warn(
                      "[Warning] skipping syncFromNative (bridge not ready)"
                    );
                  }
                }
              }

              // ## expose sync methods globally
              window.picoSave = () => {
                return new Promise((resolve) => {
                  console.log("💾 [pico8bridge] syncing to disk...");
                  if (fs) {
                    fs.syncfs(false, async (err) => {
                      if (err) {
                        console.error("[Error] save failed:", err);
                        resolve(false);
                      } else {
                        console.log(
                          "[OK] idbfs save complete. syncing to native in 500ms..."
                        );
                        // # sync gatekeeping
                        setTimeout(async () => {
                          if (
                            window.picoBridge &&
                            typeof window.picoBridge.syncToNative === "function"
                          ) {
                            await window.picoBridge.syncToNative();
                          }
                          resolve(true);
                        }, 500);
                      }
                    });
                  } else {
                    resolve(false);
                  }
                });
              };

              // ## inject cartridge
              if (window._cartdat) {
                try {
                  // # ensure clean slate
                  try {
                    fs.unlink("/cart.png");
                  } catch (e) {}

                  // # write file
                  fs.writeFile("/cart.png", window._cartdat);

                  // # the offline patch
                  window.lexaloffle_bbs_player = 0;

                  // ## launch logic
                  // ensure canvas in dom and engine ready
                  if (canvasEl && hasCallMain) {
                    console.log("[Pico8Bridge] poller: launching engine...");

                    // # the antidote (executed)
                    if (window._cartdat) {
                      delete window._cartdat;
                    }

                    window.Module.callMain(window.Module.arguments);
                    clearInterval(poller);
                    haptics.success();
                  }
                } catch (e) {
                  console.error("[Error] vfs/boot error:", e);
                }
              }
            }
          }, 50); // fast poll
        },
      ],

      print: (text) => {},
      printErr: (text) => {},
      onRuntimeInitialized: () => {
        // # force fs exposure
        if (window.Module && window.Module.FS) {
          window.FS = window.Module.FS;
          console.log("[PicoBridge] window.FS exposed");
        }

        // # expose ram pointer if available
        try {
          if (typeof window._pico8_ram_ptr === "function") {
            window.pico_ram_ptr = window._pico8_ram_ptr();
            window.pico8_ram_ptr = window.pico_ram_ptr;
          }
        } catch (e) {}

        window.p8_is_running = true;
      },
    };

    // # inject script
    this.injectScript();
  }

  injectScript() {
    const existing = document.getElementById("pico8-engine-script");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "pico8-engine-script";
    script.src = "/pico8.js";
    script.async = true;
    document.body.appendChild(script);
  }

  shutdown() {
    this.isActive = false;
    window.p8_is_running = false;

    // # kill switch for pico8.js loop
    window.Pico8Kill = true;

    // # attempt clean engine pause
    try {
      if (window.Module && window.Module.pauseMainLoop) {
        window.Module.pauseMainLoop();
      }
    } catch (e) {}

    // # audio context cleanup
    if (window.pico8_audio_context) {
      try {
        window.pico8_audio_context.close();
      } catch (e) {}
      window.pico8_audio_context = null;
    }

    // # kill script
    const existing = document.getElementById("pico8-engine-script");
    if (existing) existing.remove();

    // # nuke module
    window.Module = null;
  }

  resumeAudio() {
    // # ios safari audio unlock
    const ctx =
      window.pico8_audio_context ||
      (window.Module && window.Module.sdl_audio_context);
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        console.log("[pico8bridge] audio context resumed");
      });
    }
  }

  // ## native sync methods
  async syncFromNative() {
    console.log("[PicoBridge] syncFromNative (class method)");
    return Promise.resolve();
  }

  async syncToNative() {
    try {
      const fs = window.Module && window.Module.FS;
      const savesDir = "/appdata";

      // # critical filesystem check
      if (!fs || !fs.analyzePath || !window.pico8_engine_ready) {
        console.warn("[Warning] syncToNative skipped (fs not ready)");
        return;
      }

      try {
        fs.stat(savesDir);
      } catch (e) {
        return;
      }

      const files = fs.readdir(savesDir);
      // console.log(`[Native] scanning /appdata... found ${files.length} items`);

      // # optimization: process non-blocking
      const processFile = async (file) => {
        if (file === "." || file === "..") return;

        return new Promise((resolve) => {
          // # schedule on idle or minimal timeout
          const scheduler = window.requestIdleCallback || setTimeout;
          scheduler(async () => {
            try {
              const path = `${savesDir}/${file}`;
              const data = fs.readFile(path);
              const base64 =
                typeof data === "string"
                  ? btoa(data)
                  : btoa(String.fromCharCode.apply(null, data));

              await Filesystem.writeFile({
                path: `Saves/${file}`,
                data: base64,
                directory: Directory.Documents,
                encoding: "base64",
                recursive: true,
              });
              resolve();
            } catch (e) {
              console.warn(`failed to sync ${file}`, e);
              resolve(); // proceed anyway
            }
          });
        });
      };

      // # serial execution to prevent memory spiking
      for (const file of files) {
        await processFile(file);
      }
    } catch (e) {
      console.warn("syncToNative failed", e);
    }
  }

  /**
   * helper: find pico-8 ram base pointer
   * heuristic: scan heap for pico-8 header or use symbol
   */
  _findRAMPointer() {
    const m = window.Module;
    if (!m || !m.HEAPU8) throw new Error("Emscripten not ready");

    // 1. try standard export functions
    if (typeof m._pico8_ram_ptr === "function") return m._pico8_ram_ptr();
    if (typeof m._pico8_ram === "number") return m._pico8_ram;

    // # check for gpio function export
    if (typeof m._pico8_gpio === "function") {
      const gpioPtr = m._pico8_gpio();
      if (gpioPtr > 0x5f80) return gpioPtr - 0x5f80;
    }

    // 2. ## the memory hunter
    try {
      const heap = m.HEAPU8;
      // heuristic: look for default palette at 0x5f00

      const sigLen = 16;
      const heapLen = heap.length;

      for (let i = 0; i < heapLen - 0x8000; i += 8) {
        if (
          heap[i] === 0 &&
          heap[i + 1] === 1 &&
          heap[i + 2] === 2 &&
          heap[i + 3] === 3
        ) {
          let match = true;
          for (let j = 4; j < sigLen; j++) {
            if (heap[i + j] !== j) {
              match = false;
              break;
            }
          }
          if (match) {
            const base = i - 0x5f00;
            if (base >= 0) {
              console.log(
                `[Memory Hunter] found ram base at 0x${base.toString(16)}`
              );
              return base;
            }
          }
        }
      }
    } catch (e) {
      console.warn("[PicoBridge] RAM Scan Warning:", e);
    }

    // # last ditch: if pico8_gpio global is typedarray
    if (window.pico8_gpio && window.pico8_gpio.byteOffset) {
      return window.pico8_gpio.byteOffset - 0x5f80;
    }

    throw new Error("Could not locate PICO-8 RAM pointer");
  }

  /*
   * helper: standardize save state path
   * strips extensions and appends _manual.state
   */
  getCleanStatePath(cartName) {
    if (!cartName) return "uknown_cart_manual.state";
    // # strip common extensions
    const cleanName = cartName.replace(/(\.p8\.png|\.p8|\.png)$/i, "");
    return `Saves/${cleanName}_manual.state`;
  }

  async captureFullRAMState() {
    try {
      if (!window.Module || !window.Module.HEAPU8)
        throw new Error("Emscripten not ready");

      // ## full heap snapshot + gzip compression
      console.log("[Memory Hunter] capturing full execution heap...");

      // 1. create copy of heap
      const heapData = new Uint8Array(window.Module.HEAPU8);

      // 2. gzip compression
      const b64Promise = new Promise(async (resolve, reject) => {
        try {
          const blob = new Blob([heapData]);
          const compressedStream = blob
            .stream()
            .pipeThrough(new CompressionStream("gzip"));
          const compressedBlob = await new Response(compressedStream).blob();

          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(",")[1];
            resolve(base64);
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(compressedBlob);
        } catch (e) {
          reject(e);
        }
      });

      const b64 = await b64Promise;

      const filename = this.getCleanStatePath(this.currentCartName);
      console.log(
        `[PicoBridge] saving compressed state (${(
          b64.length /
          1024 /
          1024
        ).toFixed(2)} MB) to: ${filename}`
      );

      await Filesystem.writeFile({
        path: filename,
        data: b64,
        directory: Directory.Documents,
        recursive: true,
      });

      console.log(`[Native] full state save success`);
      haptics.success();
      return true;
    } catch (e) {
      console.error("[Error] full state capture failed:", e);
      haptics.error();
      return false;
    }
  }

  async loadRAMState(pathOverride = null) {
    try {
      if (!window.Module || !window.Module.HEAPU8)
        throw new Error("Emscripten not ready");

      const filename =
        pathOverride || this.getCleanStatePath(this.currentCartName);
      console.log(`[PicoBridge] loading state: ${filename}`);

      const result = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents,
      });

      // ## robust decompression (manual stream)
      console.log("[PicoBridge] decompressing (manual mode)...");

      // 1. manual base64 decode
      const binaryString = window.atob(result.data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let loadedHeap;

      try {
        // 2. decompress via stream
        const ds = new DecompressionStream("gzip");
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();

        // 3. read chunks
        const reader = ds.readable.getReader();
        const chunks = [];
        let totalSize = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalSize += value.length;
        }

        // 4. flatten
        const rawData = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          rawData.set(chunk, offset);
          offset += chunk.length;
        }

        loadedHeap = rawData;
        console.log("[PicoBridge] decompression success");
      } catch (e) {
        console.warn("[Warning] decompression failed, falling back to raw.", e);
        loadedHeap = bytes;
      }

      console.log(`[Memory Hunter] heap size: ${loadedHeap.length} bytes`);

      if (loadedHeap.length !== window.Module.HEAPU8.length) {
        console.warn(
          `[PicoBridge] heap size mismatch! current: ${window.Module.HEAPU8.length}, saved: ${loadedHeap.length}`
        );
      }

      // ## memory transplant
      this.pause();

      const target = window.Module.HEAPU8;
      if (loadedHeap.length <= target.length) {
        target.set(loadedHeap);
      } else {
        console.warn(
          "[PicoBridge] clamping saved heap to fit current allocator."
        );
        target.set(loadedHeap.subarray(0, target.length));
      }

      // # force draw
      if (window.Module._pico8_draw) window.Module._pico8_draw();
      else if (window.Module._draw) window.Module._draw();

      this.resume();

      console.log("[PicoBridge] state injection complete");
      haptics.success();
      return true;
    } catch (e) {
      console.error("[Error] state load failed:", e);
      haptics.error();
      return false;
    }
  }

  // ## legacy injection (compat)
  async injectFullRAMState(ramData) {
    try {
      if (!window.Module || !window.Module.HEAPU8)
        throw new Error("Emscripten not ready");

      const ramBase = this._findRAMPointer();
      console.log(`[Memory Hunter] injecting ram at 0x${ramBase.toString(16)}`);

      if (ramData.length !== 0x8000) {
        console.warn(
          `[PicoBridge] ram size mismatch! got ${ramData.length}, expected 32768`
        );
      }
      this.pause();
      window.Module.HEAPU8.set(ramData, ramBase);
      this.resume();
      console.log("[PicoBridge] ram injection complete");
      haptics.success();
    } catch (e) {
      console.error("[Error] ram injection failed:", e);
      haptics.error();
    }
  }

  pause() {
    try {
      if (window.Module && window.Module.pauseMainLoop) {
        window.Module.pauseMainLoop();
      }
      // # suspend audio
      const ctx =
        window.pico8_audio_context ||
        (window.Module && window.Module.sdl_audio_context);
      if (ctx && ctx.state === "running") ctx.suspend();
    } catch (e) {
      console.warn("wm: pause failed", e);
    }
  }

  resume() {
    try {
      if (window.Module && window.Module.resumeMainLoop) {
        window.Module.resumeMainLoop();
      }
      this.resumeAudio();
    } catch (e) {
      console.warn("wm: resume failed", e);
    }
  }
}

// singleton export
export const picoBridge = new Pico8Bridge();

// # global access (for debugging)
window.Pico8Bridge = picoBridge;
window.picoBridge = picoBridge;
