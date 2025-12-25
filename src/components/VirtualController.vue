<template>
  <div
    class="relative w-full h-full flex justify-between items-center pointer-events-none select-none px-6 pb-6 landscape:grid landscape:grid-cols-[240px_1fr_240px] landscape:p-0 landscape:items-stretch"
    style="-webkit-user-select: none; user-select: none"
  >
    <!-- d-pad container left -->
    <!-- # landscape: center left -->
    <div
      class="relative w-40 h-40 small:w-36 small:h-36 ml-2 pointer-events-auto active:scale-95 transition-transform duration-100 ease-out landscape:ml-0 landscape:self-center landscape:justify-self-center touch-action-none landscape:col-start-1"
      style="-webkit-tap-highlight-color: transparent; touch-action: none"
      @touchstart.prevent="handleDpadInput"
      @touchmove.prevent="handleDpadInput"
      @touchend.prevent="handleDpadEnd"
      @mousedown.prevent="handleDpadInput"
      @mousemove.prevent="handleDpadInput"
      @mouseup.prevent="handleDpadEnd"
      @mouseleave.prevent="handleDpadEnd"
    >
      <!-- glow effect -->
      <div
        class="absolute inset-0 bg-white/5 blur-3xl rounded-full transform -translate-y-4"
      ></div>

      <!-- d-pad svg -->
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient
            id="glass-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.2)" />
            <stop offset="50%" stop-color="rgba(255, 255, 255, 0.05)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0.15)" />
          </linearGradient>
        </defs>

        <g stroke="rgba(255,255,255,0.2)" stroke-width="0.5">
          <path
            d="M36 34 V12 A4 4 0 0 1 64 12 V34 H36"
            fill="url(#glass-gradient)"
            :class="{ 'fill-white/30': currentDirection === 38 }"
            class="transition-colors duration-150"
          />
          <path
            d="M36 66 V88 A4 4 0 0 0 64 88 V66 H36"
            fill="url(#glass-gradient)"
            :class="{ 'fill-white/30': currentDirection === 40 }"
            class="transition-colors duration-150"
          />
          <path
            d="M34 36 H12 A4 4 0 0 0 12 64 H34 V36"
            fill="url(#glass-gradient)"
            :class="{ 'fill-white/30': currentDirection === 37 }"
            class="transition-colors duration-150"
          />
          <path
            d="M66 36 H88 A4 4 0 0 1 88 64 H66 V36"
            fill="url(#glass-gradient)"
            :class="{ 'fill-white/30': currentDirection === 39 }"
            class="transition-colors duration-150"
          />
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

    <!-- menu button -->
    <button
      class="hidden landscape:flex absolute top-6 left-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] active:bg-white/20 active:scale-95 transition-all duration-300 items-center justify-center z-50 pointer-events-auto"
      @click="openMenu"
      @touchstart.prevent="openMenu"
    >
      <!-- home icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="w-5 h-5 text-white/80"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    </button>

    <!-- portrait home button -->
    <button
      class="landscape:hidden absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] active:bg-white/20 active:scale-95 transition-all duration-300 flex items-center justify-center z-40 pointer-events-auto"
      @click="openMenu"
      @touchstart.prevent="openMenu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="w-5 h-5 text-white/80"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    </button>

    <!-- center controls -->
    <div
      class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-8 pointer-events-auto landscape:hidden"
    >
      <!-- portrait select -->
      <button
        class="group flex flex-col items-center gap-2 active:scale-95 transition-transform duration-300 min-w-[44px] min-h-[44px] justify-center pointer-events-auto"
        @click="openMenu"
        @touchstart.prevent="openMenu"
      >
        <div
          class="w-12 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-sm active:bg-white/40 transition-colors -rotate-[25deg]"
        ></div>
        <span
          class="text-[10px] font-bold text-white/50 tracking-widest uppercase font-sans"
          >select</span
        >
      </button>

      <!-- portrait start -->
      <button
        class="group flex flex-col items-center gap-2 active:scale-95 transition-transform duration-300 min-w-[44px] min-h-[44px] justify-center"
        @touchstart.prevent="pressKey(13)"
        @touchend.prevent="releaseKey(13)"
        @mousedown.prevent="pressKey(13)"
        @mouseup.prevent="releaseKey(13)"
      >
        <div
          class="w-12 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-sm active:bg-white/40 transition-colors -rotate-[25deg]"
        ></div>
        <span
          class="text-[10px] font-bold text-white/50 tracking-widest uppercase font-sans"
          >start</span
        >
      </button>
    </div>

    <!-- action buttons -->
    <div
      class="relative w-36 h-48 landscape:w-full landscape:h-full small:w-36 small:h-48 pointer-events-auto mr-2 flex items-end justify-end landscape:mr-0 landscape:items-center landscape:justify-center landscape:col-start-3"
    >
      <!-- button container -->
      <div
        class="relative w-full h-full select-none touch-none pointer-events-none landscape:w-40 landscape:h-40"
      >
        <!-- o button -->
        <button
          class="absolute bottom-24 right-2 landscape:bottom-auto landscape:top-0 landscape:right-0 w-20 h-20 small:w-16 small:h-16 rounded-full bg-[rgba(255,0,77,0.15)] shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-md active:translate-y-1 active:shadow-none transition-all duration-75 flex items-center justify-center group border border-[#FF004D]/80 pointer-events-auto"
          style="-webkit-tap-highlight-color: transparent"
          @touchstart.prevent="pressKey(90)"
          @touchend.prevent="releaseKey(90)"
          @mousedown.prevent="pressKey(90)"
          @mouseup.prevent="releaseKey(90)"
        >
          <span
            class="text-white font-bold text-3xl font-pico opacity-90 group-active:opacity-100 flex items-center justify-center translate-x-[2px] -translate-y-[3px] pointer-events-none"
            >o</span
          >
        </button>

        <!-- x button -->
        <button
          class="absolute bottom-4 right-14 landscape:bottom-0 landscape:left-0 w-20 h-20 small:w-16 small:h-16 rounded-full bg-[rgba(41,173,255,0.15)] shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-md active:translate-y-1 active:shadow-none transition-all duration-75 flex items-center justify-center group border border-[#29ADFF]/80 pointer-events-auto"
          style="-webkit-tap-highlight-color: transparent"
          @touchstart.prevent="pressKey(88)"
          @touchend.prevent="releaseKey(88)"
          @mousedown.prevent="pressKey(88)"
          @mouseup.prevent="releaseKey(88)"
        >
          <span
            class="text-white font-bold text-3xl font-pico opacity-90 group-active:opacity-100 flex items-center justify-center translate-x-[2px] -translate-y-[3px] pointer-events-none"
            >x</span
          >
        </button>
      </div>
    </div>

    <!-- landscape navigation -->
    <!-- positioned inward to be closer to game view corners and away from controls -->

    <!-- landscape select -->
    <button
      class="hidden landscape:flex absolute bottom-4 left-6 w-16 h-16 pointer-events-auto items-center justify-center flex-col gap-1 active:scale-95 transition-transform duration-300 z-50 pointer-events-auto"
      @click="openMenu"
      @touchstart.prevent="openMenu"
    >
      <div
        class="w-12 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-sm active:bg-white/40 transition-colors -rotate-[25deg]"
      ></div>
      <span
        class="text-[10px] font-bold text-white/50 tracking-widest uppercase font-sans mt-1"
        >select</span
      >
    </button>

    <!-- landscape start -->
    <button
      class="hidden landscape:flex absolute bottom-4 right-6 w-16 h-16 pointer-events-auto items-center justify-center flex-col gap-1 active:scale-95 transition-transform duration-300 z-50 pointer-events-auto"
      @touchstart.prevent="pressKey(13)"
      @touchend.prevent="releaseKey(13)"
      @mousedown.prevent="pressKey(13)"
      @mouseup.prevent="releaseKey(13)"
    >
      <div
        class="w-12 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-sm active:bg-white/40 transition-colors -rotate-[25deg]"
      ></div>
      <span
        class="text-[10px] font-bold text-white/50 tracking-widest uppercase font-sans mt-1"
        >start</span
      >
    </button>
  </div>
</template>

<script setup>
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { picoBridge } from "../services/PicoBridge";
import { ref } from "vue";

const currentDirection = ref(null);

// # optimization: touch tracking & layout caching
const dpadTouchId = ref(null);
const dpadCenter = { x: 0, y: 0 };
let isMouseDown = false;

const handleDpadInput = (e) => {
  let clientX, clientY;

  if (e.type.startsWith("touch")) {
    if (e.type === "touchstart") {
      // # track this specific finger
      const touch = e.changedTouches[0];
      dpadTouchId.value = touch.identifier;

      // # cache cache cache!
      const rect = e.currentTarget.getBoundingClientRect();
      dpadCenter.x = rect.left + rect.width / 2;
      dpadCenter.y = rect.top + rect.height / 2;

      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // # only follow our tracked finger
      if (dpadTouchId.value === null) return;
      const touch = Array.from(e.touches).find(
        (t) => t.identifier === dpadTouchId.value
      );
      if (!touch) return;

      clientX = touch.clientX;
      clientY = touch.clientY;
    }
  } else {
    // # mouse fallback
    if (e.type === "mousedown") {
      isMouseDown = true;
      const rect = e.currentTarget.getBoundingClientRect();
      dpadCenter.x = rect.left + rect.width / 2;
      dpadCenter.y = rect.top + rect.height / 2;
    }
    if (e.type === "mousemove" && !isMouseDown) return;
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // # calc angle from cached center
  const deltaX = clientX - dpadCenter.x;
  const deltaY = clientY - dpadCenter.y;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // # map to direction (cones)
  let newDirection = null;

  // right: -45 to 45
  if (angle > -45 && angle <= 45) newDirection = 39;
  // down: 45 to 135
  else if (angle > 45 && angle <= 135) newDirection = 40;
  // up: -135 to -45
  else if (angle > -135 && angle <= -45) newDirection = 38;
  // left: 135 to 180 or -180 to -135
  else newDirection = 37;

  if (newDirection !== currentDirection.value) {
    if (currentDirection.value) releaseKey(currentDirection.value);
    if (newDirection) pressKey(newDirection);
    currentDirection.value = newDirection;
  }
};

const handleDpadEnd = (e) => {
  // # only release if tracked finger lifts
  if (e.type.startsWith("touch")) {
    const found = Array.from(e.changedTouches).find(
      (t) => t.identifier === dpadTouchId.value
    );
    if (!found) return;
    dpadTouchId.value = null;
  } else {
    isMouseDown = false;
  }

  if (currentDirection.value) {
    releaseKey(currentDirection.value);
    currentDirection.value = null;
  }
};

// # keycodes:
// left: 37, right: 39, up: 38, down: 40
// z (o): 90, x (x): 88
// enter (pause): 13
// escape (select): 27

let audioResumed = false;

const pressKey = async (code) => {
  // # audio resume trigger
  if (!audioResumed) {
    picoBridge.resumeAudio();
    audioResumed = true;
  }

  // dispatch 'keydown' to window, document, and canvas
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
  // # legacy bitmask support
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

// # event helpers
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

// # legacy global array support
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

const openMenu = (e) => {
  if (e) {
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  emit("menu");
  try {
    Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {}
};
</script>
