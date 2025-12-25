<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[80] flex justify-end pointer-events-none"
  >
    <!-- drawer container -->
    <div
      class="pointer-events-auto w-screen h-screen md:w-full md:max-w-sm md:h-full bg-[#111]/90 backdrop-blur-3xl saturate-150 border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 transform slide-in-right"
    >
      <!-- header -->
      <div
        class="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-white/5"
      >
        <h2 class="text-white font-bold tracking-wider font-pico text-lg">
          SAVES
        </h2>
        <button
          @click="closeDrawer"
          class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- content -->
      <div class="flex-1 overflow-y-auto overscroll-contain p-4 safe-pb">
        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-12 gap-3"
        >
          <div
            class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
          <span class="text-xs text-white/40 tracking-widest">SCANNING...</span>
        </div>

        <div
          v-else-if="saves.length === 0"
          class="flex flex-col items-center justify-center py-12 gap-3 text-white/30"
        >
          <span class="text-4xl">💾</span>
          <span class="text-xs font-mono">NO SAVE FILES</span>
        </div>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="save in saves"
            :key="save.name"
            @click="loadSave(save.name)"
            class="group relative bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all rounded-xl p-3 border border-white/5 hover:border-white/20 cursor-pointer overflow-hidden"
          >
            <!-- save icon & info -->
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shrink-0"
              >
                <span class="text-xl">💾</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3
                  class="text-white font-medium text-sm truncate font-pico leading-tight mb-1"
                >
                  {{ save.name.replace(".state", "").replace(/_/g, " ") }}
                </h3>
                <div
                  class="flex items-center gap-2 text-[10px] text-white/40 font-mono"
                >
                  <span>{{ formatSize(save.size) }}</span>
                  <span>•</span>
                  <span>{{ formatDate(save.mtime) }}</span>
                </div>
              </div>
            </div>

            <!-- chevron -->
            <div
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all"
            >
              ›
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- overlay backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      @click="closeDrawer"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
    ></div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const props = defineProps(["isOpen", "cartName"]);
const emit = defineEmits(["close", "load"]);
const saves = ref([]);
const loading = ref(false);

const closeDrawer = () => {
  emit("close");
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

const refreshSaves = async () => {
  if (!props.isOpen) return;
  loading.value = true;
  saves.value = [];

  try {
    console.log("📂 [Drawer] Scanning 'Saves' folder...");
    const ret = await Filesystem.readdir({
      path: "Saves",
      directory: Directory.Documents,
    });

    // # normalize name for filtering
    const targetName = (props.cartName || "")
      .toLowerCase()
      .replace(".p8.png", "")
      .replace(".p8", "");

    // # filter relevant saves
    saves.value = ret.files
      .filter(
        (f) =>
          f.name.endsWith(".state") && f.name.toLowerCase().includes(targetName)
      )
      .sort((a, b) => (b.mtime || 0) - (a.mtime || 0)); // newest first
  } catch (e) {
    console.error("📂 [Drawer] Read Failed:", e);
  } finally {
    loading.value = false;
  }
};

// # refresh on open
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) refreshSaves();
  }
);

// # initial check
onMounted(() => {
  if (props.isOpen) refreshSaves();
});

const loadSave = (filename) => {
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  console.log("⚡️ [Drawer] Selected:", filename);
  emit("load", filename);
  emit("close");
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};
const formatDate = (ms) => new Date(ms).toLocaleString();
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide in animation */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in-right {
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
