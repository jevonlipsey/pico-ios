<template>
  <!-- main layout: flex column for portrait, overlay for landscape -->
  <div
    class="relative h-screen w-screen overflow-hidden bg-black select-none flex flex-col landscape:flex-row landscape:items-stretch portrait:pt-[max(env(safe-area-inset-top),30px)] touch-none overscroll-none"
  >
    <!-- game zone -->
    <div
      class="game-zone flex-none w-full aspect-square relative flex items-center justify-center overflow-hidden landscape:flex-1 landscape:aspect-[4/3] landscape:h-full landscape:w-auto landscape:max-w-full pointer-events-none z-10"
      :class="{ '!h-full !w-full !aspect-auto': fullscreen }"
    >
      <div
        id="canvas-container"
        ref="canvasContainer"
        class="relative flex items-center justify-center p-1 w-full h-full aspect-square pointer-events-auto"
        :class="{ '!p-0': fullscreen }"
      >
        <canvas
          class="aspect-square w-full h-full object-contain image-pixelated rounded-sm shadow-2xl bg-black"
          :class="{ 'shadow-black/50': isMenuOpen }"
          style="will-change: transform"
          id="canvas"
          oncontextmenu="event.preventDefault()"
          tabindex="-1"
          width="128"
          height="128"
        ></canvas>

        <!-- pause menu overlay -->
        <div
          v-if="isMenuOpen"
          class="absolute inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-center justify-center"
        >
          <!-- menu content -->
          <div
            class="flex flex-col gap-4 text-center p-8 landscape:p-4 landscape:gap-2 w-full max-w-xs max-h-screen overflow-y-auto"
          >
            <h2
              class="text-[clamp(1.5rem,5vw,2.5rem)] font-bold text-white mb-4 landscape:mb-2 tracking-widest drop-shadow-md font-pico"
            >
              PAUSE
            </h2>

            <!-- dynamic menu buttons -->
            <button
              v-for="(btn, idx) in menuButtons"
              :key="btn.label"
              :id="'btn-' + idx"
              @click="triggerMenuAction(btn.action)"
              @touchend.prevent="triggerMenuAction(btn.action)"
              class="px-8 py-3 landscape:py-1 landscape:px-4 landscape:text-sm rounded-xl font-medium tracking-wider transition-colors w-full backdrop-blur-md focus:ring-4 focus:ring-white/50 outline-none font-pico uppercase text-[clamp(0.8rem,4vw,1rem)]"
              :class="[
                focusIndex === idx
                  ? 'bg-white text-black scale-105 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20',
                btn.action === 'exit' ? 'border border-red-500/30' : '',
              ]"
            >
              {{ btn.label }}
            </button>

            <!-- hidden file picker -->
            <input
              type="file"
              ref="filePicker"
              class="hidden"
              accept=".p8d,.txt,.p8"
              @change="handleFileImport"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- exit overlay -->
    <div
      v-if="isExiting"
      class="absolute inset-0 bg-black z-[100] transition-opacity duration-100 ease-out"
    ></div>

    <!-- controller zone -->
    <div
      v-if="!fullscreen"
      class="controller-zone flex-1 relative w-full bg-black/90 backdrop-blur-xl landscape:absolute landscape:inset-0 landscape:bg-transparent landscape:backdrop-blur-none landscape:pointer-events-none z-20"
    >
      <VirtualController @menu="toggleMenu" />
    </div>

    <!-- global toast usage -->
    <!-- saves drawer -->
    <SavesDrawer
      :isOpen="isSavesDrawerOpen"
      :cartName="activeCartName"
      @close="isSavesDrawerOpen = false"
      @load="handleStateLoad"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { haptics } from "../utils/haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { useRouter, useRoute } from "vue-router";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { picoBridge } from "../services/PicoBridge";
import VirtualController from "../components/VirtualController.vue";
import SavesDrawer from "../components/SavesDrawer.vue";
import { inputManager } from "../services/InputManager";

const props = defineProps({
  cartId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const isMenuOpen = ref(false);
const isExiting = ref(false);
const canvasRef = ref(null);
const filePicker = ref(null);
const focusIndex = ref(0);
const isSavesDrawerOpen = ref(false);
import { libraryManager } from "../services/LibraryManager";
import { useToast } from "../composables/useToast";
import { useLibraryStore } from "../stores/library";

import { App } from "@capacitor/app";

const { showToast } = useToast();
const { fullscreen } = storeToRefs(useLibraryStore());

const activeCartName = ref(
  props.cartId === "boot" ? "boot" : props.cartId.replace(".p8.png", ""),
);

onMounted(async () => {
  // helper: verify binary injection
  const base64ToUint8Array = (base64) => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      console.log(
        `[player] atob decoded len: ${len}. first byte charcode: ${binaryString.charCodeAt(
          0,
        )}`,
      );

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log(
        `[player] converted uint8array [0]: ${bytes[0]}, [1]: ${bytes[1]}`,
      );
      return bytes;
    } catch (e) {
      console.error("[player] base64toUint8array crash", e);
      throw e;
    }
  };

  // hard reload strategy
  // if query param is missing, reload.
  const targetQuery = route.query.cart;

  if (!props.cartId || !targetQuery) {
    console.warn("[player] missing cart id, returning to library");
    router.push("/");
    return;
  }

  if (window.Module && window.Module.ccall && window.p8_is_running) {
    console.log("[player] engine running, forcing reload for new cart");
    window.location.reload();
    return;
  }

  try {
    // ensure library service is ready
    await libraryManager.init();

    // fetch data (player responsibility)
    let cartData = null;
    let payload = {};
    let effectiveCartName = props.cartId;
    let stashedName = localStorage.getItem("pico_handoff_name");
    const stashedData = localStorage.getItem("pico_handoff_payload");

    console.log(
      `[player] handoff check - id: ${
        props.cartId
      }, stashedname: ${stashedName}, stasheddatalen: ${
        stashedData ? stashedData.length : "N/A"
      }`,
    );

    if (stashedData) {
      console.log(
        `[player] raw stashed data (first 50): ${stashedData.substring(0, 50)}`,
      );
    }

    // resolve main cart data & name
    // case a: bbs cart (memory)
    if (props.cartId === "bbs_cart" && window._bbs_cartdat) {
      console.log("[player] bbs stash found!");
      cartData = window._bbs_cartdat;
      effectiveCartName = "bbs_cart.p8.png";
    }
    // case b: stashed fast-load (memory)
    else if (
      (props.cartId === "boot" || stashedName === props.cartId) &&
      stashedData
    ) {
      console.log(`[player] memory handoff found for ${stashedName}`);
      effectiveCartName = stashedName;
      activeCartName.value = stashedName.replace(".p8.png", "");

      // raw pipe
      // just convert base64 -> uint8array directly
      console.log(`[player] handoff load: ${stashedName}`);
      cartData = base64ToUint8Array(stashedData);
    }

    // case c: disk load (filesystem / hybrid)
    else {
      // case d: check if this looks like a bbs cart id
      // bbs carts have format: [a-z]+-\d+ (e.g., abc-0, xyz-123)
      const cartNameWithoutExt = props.cartId.replace(".p8.png", "");
      const isBBSCartId = /^[a-z]+-\d+$/i.test(cartNameWithoutExt);

      if (isBBSCartId) {
        console.log(
          `[player] detected BBS cart id: ${cartNameWithoutExt}, fetching from lexaloffle...`,
        );
        try {
          const result = await libraryManager.handleDeepLink(
            cartNameWithoutExt,
          );
          effectiveCartName = result.filename;
          activeCartName.value = result.filename.replace(".p8.png", "");
          // re-read from disk after download
          const rawData = await libraryManager.loadCartData(result.filename);
          if (rawData) {
            console.log(
              `[player] bbs cart downloaded and loaded: ${result.filename}`,
            );
            cartData = base64ToUint8Array(rawData);
          }
        } catch (err) {
          console.error(`[player] failed to fetch BBS cart: ${err.message}`);
          throw new Error(`Failed to download BBS cartridge: ${err.message}`);
        }
      } else {
        console.log(`[player] hybrid fetching ${props.cartId}...`);

        // look up metadata to get source info
        // if exists, reconstruct GameEntry obj
        const meta = libraryManager.getMetadata(props.cartId);
        let gameObj = props.cartId;

        if (meta) {
          // reconstruct enough for loadCartData to work
          gameObj = {
            filename: props.cartId,
            sourceType: meta.sourceType || "internal",
            sourceId: meta.sourceId,
            relativePath: meta.relativePath,
          };
          // if missing in metadata (legacy), fallback is internal
        } else {
          // redundant check
          const found = libraryManager.games.find(
            (g) => g.filename === props.cartId,
          );
          if (found) gameObj = found;
        }

        let rawData = await libraryManager.loadCartData(gameObj);
        if (rawData) {
          console.log(`[player] hybrid load success: ${props.cartId}`);
          cartData = base64ToUint8Array(rawData);
        }
      }
    }

    if (!cartData) {
      throw new Error("No cart data found.");
    }

    // initialize payload
    payload[effectiveCartName] = cartData;

    // universal metadata check (run this for stashed carts too!)
    // if props.cartid is 'boot', we rely on stashedname for metadata lookup
    const metaKey = props.cartId === "boot" ? stashedName : props.cartId;
    console.log(
      `[player] inspecting metadata for: ${metaKey} (universal check)`,
    );

    const meta = libraryManager.metadata[metaKey];

    if (meta && meta.subCarts && meta.subCarts.length > 0) {
      console.log(
        `[player] bundle detected for ${metaKey}! loading ${meta.subCarts.length} sub-carts...`,
      );

      for (const subFile of meta.subCarts) {
        console.log(`   -> loading sub-cart: ${subFile}`);
        const subBase64 = await libraryManager.loadCartData(subFile);

        if (subBase64) {
          payload[subFile] = base64ToUint8Array(subBase64);
        } else {
          console.warn(`   [warning] failed to load data for ${subFile}`);
        }
      }
    } else {
      console.log(
        `[player] no sub-carts found for ${metaKey}. single cart boot.`,
      );
    }

    // boot engine
    console.log(
      `[player] sending payload with ${Object.keys(payload).length} files.`,
    );

    console.log("[player] booting via slot insertion...");

    // stagger boot
    setTimeout(async () => {
      const finalPayload = payload;

      console.log("[player] booting via universal bundle mode.");

      await picoBridge.boot(effectiveCartName, finalPayload);

      hookPicoQuit();

      setTimeout(() => {
        loading.value = false;
        if (route.query.state) {
          console.log(
            "[player] deep link: auto-loading state:",
            route.query.state,
          );
          setTimeout(async () => {
            await picoBridge.loadRAMState("Saves/" + route.query.state);
            showToast("AUTO-LOADED");
          }, 500); // grace period
        }
      }, 1500);
    }, 50);
  } catch (e) {
    console.error("Failed to load cart:", e);
    alert("Failed to load cartridge: " + e.message);
    router.push("/");
  }

  startAutoSaveTimer();
});

onUnmounted(async () => {
  window.removeEventListener("keydown", handleGlobalKeydown);
  stopAutoSaveTimer();
  picoBridge.shutdown();

  if (inputCleanup.value) inputCleanup.value();
  inputManager.setMode("UI");

  App.removeAllListeners("backButton");
});

const isMuted = ref(false);

const menuButtons = computed(() => [
  { label: "resume", action: "resume" },
  { label: "save state", action: "manualsave" },
  { label: "load state", action: "managesaves" },
  { label: "reset", action: "reset" },
  { label: "exit", action: "exit" },
]);

let menuDebounce = false;
const toggleMenu = async () => {
  if (menuDebounce) return;
  menuDebounce = true;
  setTimeout(() => {
    menuDebounce = false;
  }, 100);

  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    picoBridge.pause();
    inputManager.setMode("UI");
  } else {
    picoBridge.resume();
    inputManager.setMode("GAME");
  }
};

const triggerMenuAction = (action) => {
  console.log("[player] menu action triggered:", action);
  haptics.impact(ImpactStyle.Light).catch(() => {});
  if (action === "resume") toggleMenu();
  if (action === "manualsave") triggerManualSave();
  if (action === "managesaves") isSavesDrawerOpen.value = true;
  if (action === "reset") resetGame();
  if (action === "exit") exitGame();
};

let autoSaveInterval = null;

const startAutoSaveTimer = () => {
  autoSaveInterval = setInterval(() => {
    if (!isMenuOpen.value) {
      triggerAutoSave();
    }
  }, 600000);
  console.log("[player] auto-save timer started (10m)");
};

const stopAutoSaveTimer = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
};

const triggerAutoSave = async (silent = false) => {
  if (!window.picoBridge || !window.pico8_engine_ready) return;

  const autoName = `Saves/${activeCartName.value}_auto.state`;
  console.log(`[player] triggering auto-save to: ${autoName}`);

  const success = await window.picoBridge.captureFullRAMState(autoName);
  if (success && !silent) {
    showToast("Auto-Saved");
  }
};

const handleStateLoad = async (filename) => {
  if (filename) {
    console.log("[player] loading state:", filename);
    await picoBridge.loadRAMState("Saves/" + filename);
    showToast("State Loaded");
    isMenuOpen.value = false;
    isSavesDrawerOpen.value = false;
    picoBridge.resume();
    inputManager.setMode("GAME");
  }
};

const triggerManualSave = async () => {
  // close menu immediately for better ux
  isMenuOpen.value = false;
  picoBridge.resume();

  try {
    const base = activeCartName.value;
    const key = `pico_save_idx_${base}`;

    // index from localStorage to avoid readdir
    let nextIndex = parseInt(localStorage.getItem(key) || "0") + 1;

    // save new index
    localStorage.setItem(key, nextIndex.toString());

    // pattern: cartname_manual_N.state
    const saveName = `Saves/${base}_manual_${nextIndex}.state`;

    showToast("Saving...");

    const success = await window.picoBridge.captureFullRAMState(saveName);

    if (success) {
      showToast(`Saved Slot #${nextIndex}`);
    } else {
      showToast("Save Failed");
    }
  } catch (e) {
    console.error("Manual save failed", e);
    showToast("Save Error");
  }
};

// # keyboard navigation
const handleFileImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // feedback
  showToast("Importing...");

  const reader = new FileReader();
  reader.onload = async (e) => {
    const arrayBuffer = e.target.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileName = file.name;

    if (fileName.endsWith(".state")) {
      // # ram injection path
      console.log("[player] detect .state file, triggering ram injection");
      window.picoBridge.injectFullRAMState(uint8Array);
      showToast("State Loaded");
      // close menu to return to game
      isMenuOpen.value = false;
      picoBridge.resume();
      inputManager.setMode("GAME");
    } else {
      // # standard cart import
      await window.picoBridge.importSaveFile(fileName, uint8Array);
    }
  };
  reader.readAsArrayBuffer(file);
};

function resetGame() {
  console.log("[player] hard resetting...");
  window.location.reload();
}

async function exitGame() {
  // auto-save ram state
  if (window.picoBridge && window.pico8_engine_ready) {
    await triggerAutoSave(true); // silent
  }

  // save data (async wait)
  if (window.picoSave) {
    console.log("[player] auto-saving before exit...");
    const savePromise = window.picoSave();
    const timeout = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.race([savePromise, timeout]);
  }
  await picoBridge.syncToNative();

  // kill switch
  window.Pico8Kill = true;
  isExiting.value = true;
  picoBridge.shutdown();

  // track completed game session for App Store review prompt
  const playCount = parseInt(localStorage.getItem('pico_play_count') || '0') + 1;
  localStorage.setItem('pico_play_count', playCount.toString());
  localStorage.setItem('pico_returned_from_game', 'true');

  // hard navigation to root (clears wasm memory)
  setTimeout(() => {
    // force a reload by stripping all query params and hash
    const baseUrl = window.location.origin + window.location.pathname;
    window.location.replace(baseUrl);
  }, 100);
}

// enhanced shutdown hook
function hookPicoQuit() {
  if (window.Module) {
    const originalQuit = window.Module.quit;
    window.Module.quit = (status, toThrow) => {
      console.log("[player] pico-8 quit detected (internal)");
      try {
        if (originalQuit) originalQuit(status, toThrow);
      } catch (e) {}

      picoBridge.shutdown();

      // preserve query parameters so we reload the cart, not the lib
      const targetUrl = window.location.href;
      window.location.replace(targetUrl);
    };
  }
}

// keyboard navigation
function handleGlobalKeydown(e) {
  if (e.key === "Escape") {
    console.log("[player] input: escape");
    toggleMenu();
    return;
  }

  if (!isMenuOpen.value) return;
  if (isSavesDrawerOpen.value) return;

  console.log("[player] menu input:", e.key);

  if (e.key === "ArrowUp") {
    focusIndex.value =
      (focusIndex.value - 1 + menuButtons.value.length) %
      menuButtons.value.length;
  } else if (e.key === "ArrowDown") {
    focusIndex.value = (focusIndex.value + 1) % menuButtons.value.length;
  } else if (
    e.key === "Enter" ||
    e.key === " " ||
    e.key === "z" ||
    e.key === "x" ||
    e.key === "Z" ||
    e.key === "X"
  ) {
    console.log("[player] triggering action from key:", e.key);
    triggerMenuAction(menuButtons.value[focusIndex.value].action);
  }
}

// attach listener
const inputCleanup = ref(null);

onMounted(() => {
  // Switch to GAME mode initially
  inputManager.setMode("GAME");

  inputCleanup.value = inputManager.addListener((event, data) => {
    if (event === "menu") {
      toggleMenu();
      return;
    }

    // Only handle UI events if menu is open (UI Mode)
    if (isMenuOpen.value && !isSavesDrawerOpen.value) {
      if (event === "nav-up") {
        focusIndex.value =
          (focusIndex.value - 1 + menuButtons.value.length) %
          menuButtons.value.length;
      } else if (event === "nav-down") {
        focusIndex.value = (focusIndex.value + 1) % menuButtons.value.length;
      } else if (event === "confirm") {
        triggerMenuAction(menuButtons.value[focusIndex.value].action);
      } else if (event === "back") {
        toggleMenu();
      }
    }
  });

  // android back button
  App.addListener("backButton", (data) => {
    console.log("[player] back button pressed. canGoBack:", data.canGoBack);
    if (isMenuOpen.value) {
      // close menu if open
      toggleMenu();
    } else {
      // ehh
      toggleMenu();
    }
  });
});
</script>

<style>
.image-pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* fix for cube aspect ratios to remove portrait padding */
@media (min-aspect-ratio: 0.95) and (max-aspect-ratio: 1.05) {
  .portrait\:pt-\[max\(env\(safe-area-inset-top\)\,30px\)\] {
    padding-top: 0 !important;
  }
}
</style>
