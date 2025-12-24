<template>
  <div class="min-h-screen bg-[#0a0a12] relative overflow-hidden">
    <!-- Mesh Gradient Background -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div
        class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[100px] mix-blend-screen"
      ></div>
    </div>

    <!-- Hidden File Input for Import -->
    <input
      type="file"
      ref="fileInput"
      accept=".p8,.p8.png,.png"
      class="hidden"
      @change="handleFileImport"
    />

    <!-- Content -->
    <div class="relative z-10 p-6 pt-16 pb-32 max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col gap-6 mb-8 px-2">
        <!-- Top Row: Title + Action Buttons -->
        <div class="flex justify-between items-center">
          <div class="flex flex-col">
            <h1
              class="text-3xl font-bold tracking-tight text-white/90 drop-shadow-sm"
            >
              Library
            </h1>
            <span
              class="text-xs font-medium text-white/40 tracking-wider uppercase mt-1"
            >
              {{ games.length }} Cartridges
            </span>
          </div>

          <div class="flex gap-3">
            <!-- Delete Mode Toggle -->
            <button
              @click="startDeleteMode"
              :class="[
                'w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md transition-all hover:scale-105',
                deleteMode
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-white/10 border-white/20 text-white/80',
              ]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            <!-- Import Button -->
            <button
              @click="triggerImport"
              class="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md active:bg-white/20 transition-all hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            <!-- Settings Button -->
            <button
              @click="openSettings"
              class="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md active:bg-white/20 transition-all hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Search and Filter Bar -->
        <div class="flex gap-3">
          <div class="relative flex-1 group">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <svg
                class="h-4 w-4 text-white/40 group-focus-within:text-purple-400 transition-colors"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              class="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 sm:text-sm transition-all"
              placeholder="Search cartridges..."
            />
          </div>

          <div class="relative">
            <select
              v-model="sortBy"
              class="appearance-none bg-white/5 border border-white/10 text-white py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm transition-all h-full"
            >
              <option
                v-for="opt in sortOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <transition name="fade">
        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-20"
        >
          <div
            class="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4"
          ></div>
          <span class="text-white/30 text-sm tracking-widest uppercase"
            >Scanning</span
          >
        </div>
      </transition>

      <!-- Empty State -->
      <transition name="fade">
        <div
          v-if="!loading && games.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <span class="text-4xl mb-4 opacity-50">📂</span>
          <p class="text-white/60 font-medium">No cartridges found</p>
          <p class="text-white/30 text-sm mt-1">
            Import a .p8 or .p8.png to get started
          </p>
        </div>
      </transition>

      <!-- Grid -->
      <transition-group
        name="staggered-fade"
        tag="div"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
        :style="{ '--total': games.length }"
      >
        <div
          v-for="(game, index) in games"
          :key="game.path"
          @click="openGame(game)"
          class="group relative aspect-[4/5] rounded-2xl cursor-pointer transition-all duration-300"
          :class="
            deleteMode
              ? 'animate-wiggle'
              : 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20'
          "
          :style="{ '--index': index }"
        >
          <!-- Delete Overlay -->
          <div v-if="deleteMode" class="absolute -top-2 -right-2 z-20">
            <button
              @click="(e) => handleDelete(game, e)"
              class="bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Card Container -->
          <div
            class="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg z-0"
          >
            <!-- Cover Art -->
            <img
              v-if="game.cover"
              :src="game.cover"
              alt="Cover"
              class="w-full h-full object-cover opacity-90 transition-transform duration-500"
              :class="!deleteMode && 'group-hover:scale-110'"
            />
            <!-- Fallback -->
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent"
            >
              <span class="text-4xl opacity-20">👾</span>
            </div>

            <!-- Title Band -->
            <div
              class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 backdrop-blur-[2px]"
            >
              <h3
                class="text-white font-medium text-sm truncate drop-shadow-md transform transition-transform"
                :class="
                  !deleteMode && 'translate-y-1 group-hover:translate-y-0'
                "
              >
                {{ formatName(game.name) }}
              </h3>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Settings Drawer (Bottom Sheet) -->
    <transition name="slide-up">
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-end">
        <!-- Backdrop -->
        <div
          @click="showSettings = false"
          class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Sheet -->
        <div
          class="relative w-full bg-[#1c1c1e]/90 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-6 pb-12 shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          <!-- Handle -->
          <div class="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6"></div>

          <h2 class="text-xl font-bold text-white mb-6">Settings</h2>

          <!-- Manage Saves Section -->
          <div class="mb-8">
            <h3
              class="text-sm font-medium text-white/50 uppercase tracking-wider mb-4"
            >
              Manage Saves
            </h3>
            <div v-if="saves.length === 0" class="text-white/30 text-sm italic">
              No save files found via filesystem scan.
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="save in saves"
                :key="save"
                class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"
                  >
                    <svg
                      class="w-4 h-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 1m0-1l1-3m-4 0l4 4m8 0H5"
                      />
                    </svg>
                  </div>
                  <span class="text-white text-sm truncate max-w-[200px]">{{
                    save
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <button
              @click="showSettings = false"
              class="w-full py-4 bg-white/10 rounded-xl text-white font-medium active:bg-white/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useLibraryStore } from "../stores/library";
import { storeToRefs } from "pinia";
import { Filesystem, Directory } from "@capacitor/filesystem";

const router = useRouter();
const libraryStore = useLibraryStore();
const { games, loading, searchQuery, sortBy } = storeToRefs(libraryStore); // Access store state
const { loadLibrary, addCartridge, removeCartridge } = libraryStore; // Access actions

const fileInput = ref(null);
const showSettings = ref(false);
const saves = ref([]);
const deleteMode = ref(false);

const sortOptions = [
  { label: "Recently Played", value: "lastPlayed" },
  { label: "Name (A-Z)", value: "name" },
  { label: "Newest", value: "newest" },
];

onMounted(async () => {
  console.log("[Library] Mounting...");
  try {
    await loadLibrary();
    console.log("[Library] Loaded.");
  } catch (e) {
    console.error("[Library] Load failed:", e);
  }
});

function triggerImport() {
  fileInput.value.click();
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const success = await addCartridge(file);
  if (!success) {
    alert("Import Failed");
  }
}

async function startDeleteMode() {
  deleteMode.value = !deleteMode.value;
}

async function handleDelete(game, event) {
  event.stopPropagation();
  if (confirm(`Delete ${game.name}? This cannot be undone.`)) {
    await removeCartridge(game.name);
  }
}

async function openSettings() {
  showSettings.value = true;
  saves.value = []; // Reset
  try {
    const result = await Filesystem.readdir({
      path: "Saves", // Updated to match architecture
      directory: Directory.Documents,
    });
    // ...
    saves.value = result.files
      .filter((f) => !f.name.startsWith("."))
      .map((f) => f.name);
  } catch (e) {
    // No saves folder likely
  }
}

function formatName(filename) {
  return filename
    .replace(/\.p8(\.png)?$/, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ");
}

async function openGame(game) {
  if (deleteMode.value) return;

  // MEMORY-STREAM HANDOFF (Tap-to-Stash)
  // Read file -> Stash -> Navigate -> PicoBridge reads Stash
  try {
    const fileData = await Filesystem.readFile({
      path: `Carts/${game.name}`, // Standardized path
      directory: Directory.Documents,
    });

    // Stash
    localStorage.setItem("pico_handoff_payload", fileData.data);
    localStorage.setItem("pico_handoff_name", game.name);
    console.log(
      `[Library] Stashed ${game.name} (${fileData.data.length} chars)`
    );

    // Navigate (Direct Boot Handover)
    // We go straight to 'boot' mode, since we stashed the data.
    // This avoids the 'injectEngine(name) -> injectCartridge -> reload' double step.
    window.location.href = `index.html?cart=boot&boot=1&t=${Date.now()}`;
  } catch (e) {
    console.error(`[Library] Pre-load read failed: ${e.message}`);
    alert(`Failed to load ${game.name}: ${e.message}`);
  }
}
</script>

<style scoped>
.block {
  display: block;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Staggered Fade Transition */
.staggered-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  transition-delay: calc(var(--index) * 50ms);
}
.staggered-fade-leave-active {
  transition: all 0.3s ease;
}

.staggered-fade-enter-from,
.staggered-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.animate-pulse-slow {
  animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

/* Custom Scrollbar for Settings */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
</style>
