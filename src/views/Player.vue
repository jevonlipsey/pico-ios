<template>
  <div
    class="relative w-full h-full bg-[#1c1c1e] flex flex-col items-center overflow-hidden"
  >
    <!-- Game Screen Container (Pure Black, No Borders) -->
    <div
      class="w-full bg-black z-10 relative flex justify-center pt-[max(5rem,env(safe-area-inset-top))]"
    >
      <!-- PICO-8 Canvas -->
      <div
        class="aspect-square w-full max-w-[400px] bg-black relative overflow-hidden"
      >
        <canvas
          id="canvas"
          ref="canvasRef"
          oncontextmenu="event.preventDefault()"
          class="w-full h-full image-pixelated"
          tabindex="-1"
        ></canvas>
      </div>
    </div>

    <!-- Controls Overlay -->
    <!-- We'll let the VirtualController handle the bottom area -->
    <VirtualController @menu="toggleMenu" />

    <!-- Loading State -->
    <div
      v-if="loading"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div
        class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"
      ></div>
      <p class="text-white/60 font-mono tracking-widest text-sm">
        LOADING CARTRIDGE
      </p>
    </div>

    <!-- Pause Menu Overlay -->
    <transition name="fade">
      <div
        v-if="isMenuOpen"
        class="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center gap-6"
      >
        <h2 class="text-white text-2xl font-bold tracking-widest mb-4">
          PAUSED
        </h2>

        <button
          @click="resumeGame"
          class="px-8 py-3 rounded-xl bg-white text-black font-bold tracking-wider hover:scale-105 transition-transform w-48"
        >
          RESUME
        </button>

        <button
          @click="resetGame"
          class="px-8 py-3 rounded-xl bg-white/10 text-white font-medium tracking-wider hover:bg-white/20 transition-colors w-48"
        >
          RESET
        </button>

        <button
          @click="exit"
          class="px-8 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium tracking-wider hover:bg-red-500/30 transition-colors w-48 border border-red-500/50"
        >
          EXIT
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { picoBridge } from "../services/PicoBridge";
import VirtualController from "../components/VirtualController.vue";

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
const canvasRef = ref(null);

onMounted(async () => {
  // HARD RELOAD STRATEGY:
  // If the query param is missing (should reflect in props), reload.
  // Ensure we are strictly on ?cart=...
  const targetQuery = route.query.cart;

  // If props.cartId is empty or undefined, something is wrong
  if (!props.cartId || !targetQuery) {
    console.warn("[Player] Missing cart ID, returning to library");
    router.push("/");
    return;
  }

  // Force reload if we are 'hot' navigating from another game state without a reload
  // We can detect this if window.p8_is_running is true?
  // Actually, simple check: if we didn't JUST reload, reload.
  // But how to track that?
  // Simpler: The architecture NOW forces ?cart=...
  // If we want to force reload on EVERY entry, we can check a session flag?
  // OR just rely on the router pushing distinct URLs.

  // Check if we need to force reload to clear memory
  if (window.Module && window.Module.ccall && window.p8_is_running) {
    console.log("[Player] Engine running, forcing reload for new cart");
    window.location.reload();
    return;
  }

  // Note: PicoBridge setup follows...

  try {
    picoBridge.init(canvasRef.value);

    // Inject and start (using the cart from query, which matches prop now)
    await picoBridge.injectEngine(props.cartId);

    // Give it a moment to boot visuals
    setTimeout(() => {
      loading.value = false;
    }, 1500);
  } catch (e) {
    console.error("Failed to load cart:", e);
    // Show error state?
  }
});

onUnmounted(() => {
  picoBridge.teardown();
});

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value; // Simple toggle
  if (isMenuOpen.value) {
    picoBridge.pause();
  } else {
    picoBridge.resume();
  }
}

function resumeGame() {
  isMenuOpen.value = false;
  picoBridge.resume();
}

function resetGame() {
  // HARD RESET: specific logic to force reload
  console.log("[Player] Hard Resetting...");
  window.location.reload();
}

function exit() {
  picoBridge.teardown();
  router.push("/");
}
</script>

<style>
.image-pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
