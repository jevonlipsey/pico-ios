<template>
  <div
    class="fixed inset-x-0 bottom-0 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 px-6 z-50 flex justify-between items-center pointer-events-none select-none h-1/2 landscape:h-full landscape:items-end landscape:pb-8 landscape:px-12"
  >
    <!-- D-PAD (Bottom Left) -->
    <div
      class="relative w-40 h-40 small:w-32 small:h-32 ml-4 pointer-events-auto active:scale-95 transition-transform duration-100 ease-out landscape:ml-8"
    >
      <!-- Glow effect -->
      <div
        class="absolute inset-0 bg-white/5 blur-3xl rounded-full transform -translate-y-4"
      ></div>

      <!-- D-Pad SVG -->
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient
            id="glass-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
            <stop offset="50%" stop-color="rgba(255, 255, 255, 0.05)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0.1)" />
          </linearGradient>
        </defs>

        <g stroke="rgba(255,255,255,0.15)" stroke-width="0.5">
          <!-- UP (ArrowUp: 38) -->
          <path
            d="M36 34 V12 A4 4 0 0 1 64 12 V34 H36"
            fill="url(#glass-gradient)"
            class="active:fill-white/30"
            @touchstart.prevent="pressKey(38)"
            @touchend.prevent="releaseKey(38)"
            @mousedown.prevent="pressKey(38)"
            @mouseup.prevent="releaseKey(38)"
          />

          <!-- DOWN (ArrowDown: 40) -->
          <path
            d="M36 66 V88 A4 4 0 0 0 64 88 V66 H36"
            fill="url(#glass-gradient)"
            class="active:fill-white/30"
            @touchstart.prevent="pressKey(40)"
            @touchend.prevent="releaseKey(40)"
            @mousedown.prevent="pressKey(40)"
            @mouseup.prevent="releaseKey(40)"
          />

          <!-- LEFT (ArrowLeft: 37) -->
          <path
            d="M34 36 H12 A4 4 0 0 0 12 64 H34 V36"
            fill="url(#glass-gradient)"
            class="active:fill-white/30"
            @touchstart.prevent="pressKey(37)"
            @touchend.prevent="releaseKey(37)"
            @mousedown.prevent="pressKey(37)"
            @mouseup.prevent="releaseKey(37)"
          />

          <!-- RIGHT (ArrowRight: 39) -->
          <path
            d="M66 36 H88 A4 4 0 0 1 88 64 H66 V36"
            fill="url(#glass-gradient)"
            class="active:fill-white/30"
            @touchstart.prevent="pressKey(39)"
            @touchend.prevent="releaseKey(39)"
            @mousedown.prevent="pressKey(39)"
            @mouseup.prevent="releaseKey(39)"
          />

          <!-- Center (Static) -->
          <rect
            x="36"
            y="36"
            width="28"
            height="28"
            fill="url(#glass-gradient)"
          />
        </g>
      </svg>
    </div>

    <!-- CENTER CONTROLS GROUP -->
    <div
      class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto pb-4 landscape:hidden"
    >
      <!-- HOME BUTTON (Gameboy Center) -->
      <!-- Mapped to Escape/Pause? Or just a visual anchor that does 'Pause' too -->
      <button
        class="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[inner_0_0_10px_rgba(255,255,255,0.05)] active:bg-white/20 active:scale-90 transition-all flex items-center justify-center mb-2"
        @click="openMenu"
      >
        <div class="w-4 h-4 bg-white/20 rounded-sm"></div>
      </button>

      <!-- START / SELECT PILLS -->
      <div class="flex gap-4">
        <!-- SELECT -->
        <button
          class="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
          @touchstart.prevent="pressKey(13)"
          @touchend.prevent="releaseKey(13)"
          @mousedown.prevent="pressKey(13)"
          @mouseup.prevent="releaseKey(13)"
        >
          <div
            class="w-12 h-4 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm active:bg-white/30 transition-colors rotate-12"
          ></div>
          <span
            class="text-[8px] font-bold text-white/30 tracking-widest uppercase mt-1"
            >Select</span
          >
        </button>

        <!-- START -->
        <button
          class="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
          @touchstart.prevent="pressKey(27)"
          @touchend.prevent="releaseKey(27)"
          @mousedown.prevent="pressKey(27)"
          @mouseup.prevent="releaseKey(27)"
        >
          <div
            class="w-12 h-4 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm active:bg-white/30 transition-colors rotate-12"
          ></div>
          <span
            class="text-[8px] font-bold text-white/30 tracking-widest uppercase mt-1"
            >Start</span
          >
        </button>
      </div>
    </div>

    <!-- ACTION BUTTONS (Bottom Right) -->
    <div
      class="relative w-36 h-48 small:w-28 small:h-40 pointer-events-auto mr-4 flex items-end justify-end landscape:mr-8"
    >
      <!-- Button Container for grouping -->
      <div class="relative w-full h-full">
        <button
          class="absolute bottom-24 right-2 w-20 h-20 small:w-16 small:h-16 rounded-full bg-red-500/20 backdrop-blur-md border-2 border-red-400/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] active:bg-red-500/40 active:scale-95 transition-all flex items-center justify-center group"
          @touchstart.prevent="pressKey(90)"
          @touchend.prevent="releaseKey(90)"
          @mousedown.prevent="pressKey(90)"
          @mouseup.prevent="releaseKey(90)"
        >
          <span
            class="text-red-200/50 font-bold text-3xl group-active:text-red-100"
            >Z</span
          >
        </button>

        <button
          class="absolute bottom-4 right-14 w-20 h-20 small:w-16 small:h-16 rounded-full bg-blue-500/20 backdrop-blur-md border-2 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] active:bg-blue-500/40 active:scale-95 transition-all flex items-center justify-center group"
          @touchstart.prevent="pressKey(88)"
          @touchend.prevent="releaseKey(88)"
          @mousedown.prevent="pressKey(88)"
          @mouseup.prevent="releaseKey(88)"
        >
          <span
            class="text-blue-200/50 font-bold text-3xl group-active:text-blue-100"
            >X</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { picoBridge } from "../services/PicoBridge";

// KeyCodes:
// Left: 37, Right: 39, Up: 38, Down: 40
// Z (O): 90, X (X): 88
// Enter (Pause): 13
// Escape (Select): 27

let audioResumed = false;

const pressKey = async (code) => {
  // 1. Audio Resume (One-time trigger)
  if (!audioResumed) {
    picoBridge.resumeAudio();
    audioResumed = true;
  }

  // Dispatch 'keydown' to window, document, and canvas
  const event = new KeyboardEvent("keydown", {
    key: getKeyName(code),
    code: getCodeName(code),
    keyCode: code,
    which: code,
    bubbles: true,
    cancelable: true,
    view: window,
  });

  window.dispatchEvent(event);
  document.dispatchEvent(event); // Fallback

  // Also try specific PICO-8 global input array if available (as backup)
  updateBitmask(code, true);

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {}
};

const releaseKey = (code) => {
  const event = new KeyboardEvent("keyup", {
    key: getKeyName(code),
    code: getCodeName(code),
    keyCode: code,
    which: code,
    bubbles: true,
    cancelable: true,
    view: window,
  });

  window.dispatchEvent(event);
  document.dispatchEvent(event);

  updateBitmask(code, false);
};

const emit = defineEmits(["menu"]);

// Helpers for robust event generation
function getKeyName(code) {
  if (code === 37) return "ArrowLeft";
  if (code === 39) return "ArrowRight";
  if (code === 38) return "ArrowUp";
  if (code === 40) return "ArrowDown";
  if (code === 90) return "z";
  if (code === 88) return "x";
  if (code === 13) return "Enter";
  if (code === 27) return "Escape";
  return "";
}

function getCodeName(code) {
  if (code === 37) return "ArrowLeft";
  if (code === 39) return "ArrowRight";
  if (code === 38) return "ArrowUp";
  if (code === 40) return "ArrowDown";
  if (code === 90) return "KeyZ";
  if (code === 88) return "KeyX";
  if (code === 13) return "Enter";
  if (code === 27) return "Escape";
  return "";
}

// Legacy global array support (just in case)
function updateBitmask(code, isDown) {
  if (!window.pico8_buttons) return;
  let bit = 0;
  if (code === 37) bit = 1; // Left
  if (code === 39) bit = 2; // Right
  if (code === 38) bit = 4; // Up
  if (code === 40) bit = 8; // Down
  if (code === 90) bit = 16; // Z (O)
  if (code === 88) bit = 32; // X (X)
  if (code === 13) bit = 64; // Pause (Menu)

  if (bit) {
    if (isDown) window.pico8_buttons[0] |= bit;
    else window.pico8_buttons[0] &= ~bit;
  }
}

const openMenu = () => {
  emit("menu");
  try {
    Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {}
};
</script>
