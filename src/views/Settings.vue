<template>
  <div
    class="min-h-screen w-full bg-oled-dark text-white p-6 pt-16 overflow-y-auto no-scrollbar"
  >
    <!-- header -->
    <div class="flex items-center gap-4 mb-8">
      <button
        @click="$router.back()"
        class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-all"
        :class="{ 'ring-2 ring-purple-500 bg-white/20': headerFocused }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-white/80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <h1
        class="font-pico-crisp text-white drop-shadow-md text-[clamp(1.5rem,5vw,3rem)]"
      >
        Settings
      </h1>
    </div>

    <div class="space-y-8 max-w-2xl mx-auto">
      <section>
        <div class="space-y-3">
          <div
            v-for="(item, index) in settingsItems"
            :key="item.id"
            :ref="(el) => setItemRef(el, index)"
            @click="item.action"
            class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 active:bg-white/10 transition-all cursor-pointer select-none"
            :class="{
              '!bg-white/20 !border-white/40 ring-2 ring-white/50 scale-[1.02]':
                focusedIndex === index,
            }"
          >
            <div class="flex flex-col">
              <span class="text-white font-medium">{{ item.label }}</span>
              <span v-if="item.subtext" class="text-xs text-white/40 mt-1">{{
                item.subtext
              }}</span>
            </div>

            <!-- virtual joystick -->
            <div
              v-if="item.type === 'toggle'"
              class="w-12 h-7 rounded-full transition-colors relative"
              :class="item.value ? 'bg-purple-500' : 'bg-white/10'"
            >
              <div
                class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm"
                :class="item.value ? 'translate-x-5' : 'translate-x-0'"
              ></div>
            </div>

            <div
              v-else-if="item.type === 'link'"
              class="flex items-center text-white/30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Danger Zone -->
      <section>
        <h2
          class="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 ml-1"
        >
          Danger Zone
        </h2>
        <div class="space-y-3">
          <div
            v-for="(item, index) in dangerItems"
            :key="item.id"
            @click="item.action"
            class="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20 active:bg-red-500/20 transition-all cursor-pointer select-none"
          >
            <div class="flex flex-col">
              <span class="text-red-400 font-medium">{{ item.label }}</span>
              <span v-if="item.subtext" class="text-xs text-red-300/50 mt-1">{{
                item.subtext
              }}</span>
            </div>
            <div class="flex items-center text-red-500/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- app info -->
      <section class="pt-8 flex flex-col items-center opacity-30">
        <p class="text-[10px] font-mono uppercase tracking-widest">
          Pocket8 v1.6.3
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useLibraryStore } from "../stores/library";
import { storeToRefs } from "pinia";
import { haptics } from "../utils/haptics";
import { ImpactStyle } from "@capacitor/haptics";
// import { FilePicker } from "@capawesome/capacitor-file-picker";
import { ScopedStorage } from "@daniele-rolli/capacitor-scoped-storage";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useFocusable } from "../composables/useFocusable";
import { inputManager } from "../services/InputManager";

import { useToast } from "../composables/useToast";
import { Dialog } from "@capacitor/dialog";

const Permission = registerPlugin("Permission");
const Review = registerPlugin("Review");

const router = useRouter();
const { showToast } = useToast();
const libraryStore = useLibraryStore();
const { swapButtons, useJoystick, hapticsEnabled, fullscreen, rootDir } =
  storeToRefs(libraryStore);
const {
  toggleSwapButtons,
  toggleJoystick,
  toggleHaptics,
  toggleFullscreen,
  updateRootDirectory,
} = libraryStore;

const isAndroid = computed(() => Capacitor.getPlatform() === "android");

const settingsItems = computed(() => {
  const items = [
    {
      id: "swap",
      type: "toggle",
      label: "Swap Action Buttons",
      subtext: "Switch the O/X button positions",
      value: swapButtons.value,
      action: async () => {
        haptics.impact(ImpactStyle.Light);
        toggleSwapButtons();
      },
    },
    {
      id: "joystick",
      type: "toggle",
      label: "Virtual Joystick",
      subtext: "Toggle between virtual joystick and D-pad",
      value: useJoystick.value,
      action: async () => {
        haptics.impact(ImpactStyle.Light);
        toggleJoystick();
      },
    },
    {
      id: "haptics",
      type: "toggle",
      label: "Haptic Feedback",
      subtext: "Toggle vibrations on device and controllers",
      value: hapticsEnabled.value,
      action: async () => {
        haptics.impact(ImpactStyle.Light);
        toggleHaptics();
      },
    },
    {
      id: "fullscreen",
      type: "toggle",
      label: "Fullscreen",
      subtext: "Hide on-screen controls",
      value: fullscreen.value,
      action: async () => {
        haptics.impact(ImpactStyle.Light);
        toggleFullscreen();
      },
    },
  ];

  if (isAndroid.value) {
    items.push({
      id: "root-dir",
      type: "link",
      label: "Sync from Folder",
      subtext: "Index games from an external folder",
      action: pickAndroidDirectory,
    });
  }

  items.push({
    id: "rescan",
    label: "Rescan Library",
    subtext: "Refresh game list and cache",
    type: "link",
    action: handleRescan,
  });

  items.push({
    id: "input",
    label: "Input",
    subtext: "Change keyboard controls",
    type: "link",
    action: goToKeymap,
  });

  if (Capacitor.getPlatform() === "ios") {
    items.push({
      id: "review",
      label: "Review Pocket8",
      subtext: "Rate us on the App Store",
      type: "link",
      action: async () => {
        haptics.impact(ImpactStyle.Light).catch(() => {});
        try {
          await Review.requestReview();
        } catch (e) {
          console.warn("[settings] review prompt failed:", e);
        }
      },
    });
  }

  return items;
});

const dangerItems = computed(() => {
  const items = [];

  if (isAndroid.value) {
    items.push({
      id: "reset-external",
      label: "Reset External Links",
      subtext: "Remove all synced folders and external games",
      action: async () => {
        if (confirm("Cleanup external links? Internal games will remain.")) {
          await libraryStore.resetLibrary(false);
          showToast("External Links Cleared");
          haptics.success();
        }
      },
    });
  }

  items.push({
    id: "factory-reset",
    label: "Factory Reset Library",
    subtext: "Delete ALL internal games, metadata, and clears external links",
    action: async () => {
      if (
        confirm(
          "DANGER: This will delete ALL internal cartridges and reset everything. Are you sure?",
        )
      ) {
        if (confirm("Really sure? This cannot be undone.")) {
          await libraryStore.resetLibrary(true);
          showToast("Library Reset Complete");
          haptics.success();
          router.push("/");
        }
      }
    },
  });

  return items;
});

const handleRescan = async () => {
  if (confirm("Rescan library? This will refresh your game list.")) {
    showToast("Scanning...");
    await libraryStore.rescanLibrary();
    haptics.success();
    showToast("Library Updated");
  }
};

async function pickAndroidDirectory() {
  haptics.impact(ImpactStyle.Light).catch(() => {});

  // guardrail hint
  alert(
    "Note: Android ensures privacy by restricting access to 'Downloads' and 'Android' folders.\n\nPlease select a dedicated folder (e.g., 'Downloads/Roms').",
  );

  try {
    const { folder } = await ScopedStorage.pickFolder();

    if (folder) {
      if (
        confirm(
          `Index games from '${folder.name}'? This will add references without copying files.`,
        )
      ) {
        const success = await libraryStore.addExternalSource(folder);
        if (success) {
          haptics.success();
          showToast("Indexing Started - Check Library");
          // router.back() to show progress in lib
          router.back();
        } else {
          showToast("Sync Failed. Try Again.");
        }
      }
    }
  } catch (e) {
    console.warn("Pick folder failed", e);
    // silent catch for user cancel, but show for others
    if (!e.message.includes("canceled") && !e.message.includes("cancelled")) {
      showToast("Access prevented: Try a different folder.");
    }
  }
}

// focusable
const { focusedIndex, setItemRef } = useFocusable({
  items: settingsItems,
  onSelect: (item) => item.action(),
  onBack: () => router.back(),
});

// header focus
const headerFocused = ref(false);

const listenerCleanup = ref(null);

onMounted(() => {
  listenerCleanup.value = inputManager.addListener((action) => {
    if (action === "back") {
      router.back();
    } else if (action === "menu") {
      router.back();
    }
  });
});

onUnmounted(() => {
  if (listenerCleanup.value) listenerCleanup.value();
});

async function goToKeymap() {
  router.push({ name: "input" });
};
</script>
