<template>
  <div
    class="min-h-screen bg-[var(--color-oled-black)] relative overflow-y-auto no-scrollbar"
  >
    <!-- mesh gradient background -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div
        class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[100px] mix-blend-screen"
      ></div>
    </div>

    <!-- hidden file input -->
    <input
      type="file"
      ref="fileInput"
      multiple
      accept=".p8,.p8.png,.png"
      class="hidden"
      @change="handleFileImport"
    />

    <!-- content -->
    <div class="relative z-10 p-6 pt-16 pb-32 max-w-7xl mx-auto w-full">
      <!-- header -->
      <div class="flex flex-col gap-6 mb-8 px-2">
        <!-- title & actions -->
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
            <!-- delete mode toggle -->
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

            <!-- import button -->
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

            <!-- settings button -->
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

        <!-- search & filter -->
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

      <!-- loading state -->
      <transition name="fade">
        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-20"
        >
          <div
            class="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4"
          ></div>
          <span class="text-white/30 text-sm tracking-widest uppercase">
            {{ importProgress || "Scanning" }}
          </span>
        </div>
      </transition>

      <!-- empty state -->
      <transition name="fade">
        <div
          v-if="!loading && games.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-12 h-12 mb-4 opacity-50 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
          <p class="text-white/60 font-medium">No cartridges found</p>
          <p class="text-white/30 text-sm mt-1">
            Import a .p8 or .p8.png to get started
          </p>
        </div>
      </transition>

      <!-- grid -->
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
          <!-- delete overlay -->
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

          <!-- card container -->
          <div
            class="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg z-0"
          >
            <!-- cover art -->
            <img
              v-if="game.cover"
              :src="game.cover"
              alt="Cover"
              class="w-full h-full object-cover opacity-90 transition-transform duration-500"
              :class="!deleteMode && 'group-hover:scale-110'"
            />
            <!-- fallback -->
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 opacity-20 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <!-- title band -->
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

    <!-- versions footer -->
    <div class="mt-12 mb-6 text-center opacity-30">
      <p class="text-[10px] font-mono uppercase tracking-widest">
        Pocket8 v1.0
      </p>
    </div>

    <!-- settings drawer -->
    <transition name="slide-up">
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-end">
        <!-- backdrop -->
        <div
          @click="showSettings = false"
          class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- sheet -->
        <div
          class="relative w-full bg-[var(--color-surface)] backdrop-blur-2xl rounded-t-3xl border-t border-white/10 p-6 pb-12 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col"
        >
          <!-- handle -->
          <div class="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6"></div>

          <h2 class="text-xl font-bold text-white mb-6">Settings</h2>

          <!-- manage saves -->
          <div class="mb-8 flex-1">
            <h3
              class="text-sm font-medium text-white/50 uppercase tracking-wider mb-4"
            >
              Manage Saves
            </h3>

            <div v-if="loadingSaves" class="flex justify-center py-8">
              <div
                class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
            </div>

            <div
              v-else-if="saves.length === 0"
              class="text-white/30 text-sm italic"
            >
              No save files found via filesystem scan.
            </div>

            <transition-group
              v-else
              tag="div"
              name="list"
              class="space-y-3 relative"
            >
              <div
                v-for="save in saves"
                :key="save.name"
                class="group flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div
                    class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-5 h-5 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span
                      class="text-white text-sm font-medium truncate font-pico leading-tight"
                    >
                      {{ save.simpleName }}
                    </span>
                    <span class="text-xs text-white/40 truncate">
                      {{ save.cartName }} • {{ formatDate(save.mtime) }}
                    </span>
                  </div>
                </div>

                <!-- actions -->
                <div class="flex items-center gap-2">
                  <!-- load -->
                  <button
                    @click="loadState(save)"
                    class="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 active:scale-95 transition-all"
                    title="Load State"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  <!-- share -->
                  <button
                    @click="shareState(save)"
                    class="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all"
                    title="Share File"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>

                  <!-- delete -->
                  <button
                    @click.stop="deleteState(save)"
                    class="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                    title="Delete File"
                  >
                    <svg
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
                </div>
              </div>
            </transition-group>
          </div>

          <div class="mt-4">
            <button
              @click="showSettings = false"
              class="w-full py-4 bg-white/10 rounded-xl text-white font-medium active:bg-white/20 hover:bg-white/15 transition-colors"
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
import { Share } from "@capacitor/share";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const router = useRouter();
const libraryStore = useLibraryStore();
const { games, loading, searchQuery, sortBy } = storeToRefs(libraryStore); // access store state
const { loadLibrary, addCartridge, removeCartridge } = libraryStore; // access actions

const fileInput = ref(null);
const showSettings = ref(false);
const saves = ref([]);
const loadingSaves = ref(false);
const deleteMode = ref(false);
const importProgress = ref("");

const sortOptions = [
  { label: "Recently Played", value: "lastPlayed" },
  { label: "Name (A-Z)", value: "name" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

onMounted(async () => {
  console.log("[Library] Mounting...");
  try {
    const loadedGames = await loadLibrary();
    // # silent ship protocol
    console.log(`[Library] Loaded ${loadedGames.length} cartridges.`);
    libraryGames.value = loadedGames;
  } catch (e) {
    console.error("[Library] Load failed:", e);
  }
});

function triggerImport() {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  fileInput.value.click();
}

async function handleFileImport(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  // UI Feedback
  loading.value = true;
  const total = files.length;
  console.log(`[Library] Batch importing ${total} files...`);

  let successCount = 0;

  // process sequentially to prevent memory spikes
  for (let i = 0; i < total; i++) {
    const file = files[i];
    // Update progress text
    importProgress.value = `Importing ${i + 1}/${total}`;

    try {
      const success = await addCartridge(file);
      if (success) successCount++;
    } catch (e) {
      console.error(`Failed to import ${file.name}`, e);
    }
  }

  // Cleanup
  loading.value = false;
  importProgress.value = "";
  event.target.value = ""; // Reset input

  // Final Feedback
  if (successCount > 0) {
    Haptics.notification({ type: "success" }).catch(() => {});
    // Reload library to show new games
    await loadLibrary();
    alert(`Successfully imported ${successCount} cartridges!`);
  } else {
    Haptics.notification({ type: "error" }).catch(() => {});
    alert("No valid cartridges found in selection.");
  }
}

async function startDeleteMode() {
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  deleteMode.value = !deleteMode.value;
}

async function handleDelete(game, event) {
  event.stopPropagation();

  if (confirm(`Delete ${game.name}? This cannot be undone.`)) {
    await removeCartridge(game.name);
    Haptics.notification({ type: "success" }).catch(() => {});
  }
}

async function openSettings() {
  showSettings.value = true;
  loadingSaves.value = true;
  saves.value = [];

  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

  try {
    const result = await Filesystem.readdir({
      path: "Saves",
      directory: Directory.Documents,
    });

    const parsedFiles = result.files
      .filter((f) => f.name.endsWith(".state"))
      .map((f) => {
        // extract cart name from filename (e.g. "Celeste_manual.state" -> "Celeste")
        const nameParts = f.name.split("_");
        const cartName = nameParts[0] || "Unknown";
        const simpleName = f.name
          .replace(cartName + "_", "")
          .replace(".state", "")
          .replace(/_/g, " ");

        return {
          name: f.name,
          uri: f.uri,
          mtime: f.mtime || Date.now(),
          size: f.size,
          cartName: cartName, // for booting
          simpleName: simpleName || "Quick Save",
        };
      });

    // sort newest first
    saves.value = parsedFiles.sort((a, b) => b.mtime - a.mtime);
  } catch (e) {
    console.error("[Library] Failed to list saves:", e);
  } finally {
    loadingSaves.value = false;
  }
}

async function loadState(save) {
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  console.log("[Library] Booting from state:", save.name);

  // # find cart matching save
  const matchingGame = games.value.find((g) => g.name.includes(save.cartName));

  let targetCart = matchingGame ? matchingGame.name : save.cartName + ".p8.png";

  // attempt to prepare handoff
  try {
    const fileData = await Filesystem.readFile({
      path: `Carts/${targetCart}`,
      directory: Directory.Documents,
    });
    // stash
    localStorage.setItem("pico_handoff_payload", fileData.data);
    localStorage.setItem("pico_handoff_name", targetCart);
  } catch (e) {
    console.warn(
      "Could not find/stash cart for deep link, hoping Player finds it or fails gracefully"
    );
  }

  // navigate with query params
  router.push({
    path: "/play",
    query: {
      cart: targetCart,
      state: save.name,
      t: Date.now(),
    },
  });
}

async function shareState(save) {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  try {
    await Share.share({
      title: "PICO-8 Save State",
      text: `Share ${save.simpleName}`,
      files: [save.uri],
    });
  } catch (e) {
    console.error("Share failed", e);
    // ignore dismissals
  }
}

async function deleteState(save) {
  // no haptics before confirm to avoid ios ui glitch
  if (!confirm(`Delete ${save.simpleName}?`)) return;

  try {
    await Filesystem.deleteFile({
      path: `Saves/${save.name}`,
      directory: Directory.Documents,
    });

    // remove from list locally
    saves.value = saves.value.filter((s) => s.name !== save.name);
    Haptics.notification({ type: "success" }).catch(() => {});
  } catch (e) {
    console.error("Delete failed", e);
    alert("Could not delete file.");
  }
}

function formatName(filename) {
  return filename
    .replace(/\.p8(\.png)?$/, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ");
}

const formatDate = (ms) => new Date(ms).toLocaleDateString();

async function openGame(game) {
  if (deleteMode.value) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

  // # memory stream handoff
  // read file -> stash -> navigate -> picobridge reads stash
  try {
    const fileData = await Filesystem.readFile({
      path: `Carts/${game.name}`, // standardized path
      directory: Directory.Documents,
    });

    // stash
    localStorage.setItem("pico_handoff_payload", fileData.data);
    localStorage.setItem("pico_handoff_name", game.name);
    console.log(`[Library] Stashed ${game.name} for handoff.`);

    // navigate
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

/* transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* staggered fade transition */
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

/* list transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}

/* custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
</style>
