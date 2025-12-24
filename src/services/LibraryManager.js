import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

const ROOT = "";
const CARTS_DIR = "Carts";
const IMAGES_DIR = "Images";
const SAVES_DIR = "Saves";

export class LibraryManager {
  constructor() {
    this.games = [];
    this.metadata = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Ensure Pocket8 directories exist
      // Ensure Pocket8 directories exist (Try/Catch wrapper per dir for safety)
      const ensureDir = async (path) => {
        try {
          // Check existence first to avoid "OS-PLUG-FILE-0010" logs
          await Filesystem.stat({
            path,
            directory: Directory.Documents,
          });
          // If stat succeeds, it exists. Do nothing.
        } catch (e) {
          // If stat fails, it doesn't exist (or other error). Try to create.
          try {
            await Filesystem.mkdir({
              path,
              directory: Directory.Documents,
              recursive: true,
            });
          } catch (mkdirError) {
            // Silently fail if creation fails (race condition or permission)
          }
        }
      };

      await ensureDir(CARTS_DIR);
      await ensureDir(IMAGES_DIR);
      await ensureDir(SAVES_DIR);

      // Load Metadata
      try {
        const result = await Filesystem.readFile({
          path: LIBRARY_FILE,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        this.metadata = JSON.parse(result.data);
      } catch (e) {
        this.metadata = {};
      }

      await this.cleanupLegacy();
      await this.scan();
      this.initialized = true;
    } catch (e) {
      console.error("LibraryManager Init Failed", e);
    }
  }

  async cleanupLegacy() {
    // Legacy cleanup removed to prevent loops.
    // The ROOT constant "Pocket8" ensures we are in the right place.
    // If double-nesting existed, it's ignored now.
  }

  async scan() {
    const games = [];
    const scanPath = CARTS_DIR;

    try {
      const result = await Filesystem.readdir({
        path: scanPath,
        directory: Directory.Documents,
      });

      for (const file of result.files) {
        if (file.name.endsWith(".p8.png") || file.name.endsWith(".p8")) {
          const id = file.name;
          const meta = this.metadata[id] || { playCount: 0, lastPlayed: 0 };

          // Image Path: Pocket8/Images/[filename - extension].png
          const baseName = file.name.replace(/\.p8(\.png)?$/, "");
          const imagePath = `${IMAGES_DIR}/${baseName}.png`;

          // Check if image exists
          let coverUri = null;
          try {
            const stat = await Filesystem.getUri({
              path: imagePath,
              directory: Directory.Documents,
            });
            coverUri = Capacitor.convertFileSrc(stat.uri);
          } catch (e) {}

          games.push({
            name: file.name,
            id: id,
            path: file.uri,
            lastPlayed: meta.lastPlayed,
            playCount: meta.playCount,
            cover: coverUri || null,
          });
        }
      }

      // Stripping file:// prefixes if present (User Request)
      games.forEach((g) => {
        if (g.path.startsWith("file://")) {
          g.path = g.path.replace("file://", "");
        }
      });
    } catch (e) {
      // Carts dir might not exist yet
    }

    // Sort by Last Played Descending
    games.sort((a, b) => b.lastPlayed - a.lastPlayed);

    this.games = games;
    return games;
  }

  async importFile(blob, filename) {
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Data = await base64Promise;

      // Sanitize Path Logic - Flattened via constants, but keeping simple safety if needed
      // (Legacy double-nesting check removed as we use constants now)
      let targetPath = `${CARTS_DIR}/${filename}`;

      // 1. Save Cartridge to Pocket8/Carts/
      await Filesystem.writeFile({
        path: targetPath,
        data: base64Data,
        directory: Directory.Documents,
      });

      // 2. Extract/Copy Image to Pocket8/Images/
      if (filename.endsWith(".p8.png") || filename.endsWith(".png")) {
        const baseName = filename
          .replace(/\.p8(\.png)?$/, "")
          .replace(/\.png$/, "");

        try {
          let imagePath = `${IMAGES_DIR}/${baseName}.png`;
          // (Legacy double-nesting check removed)

          await Filesystem.writeFile({
            path: imagePath,
            data: base64Data,
            directory: Directory.Documents,
          });
        } catch (e) {}
      }

      // MEMORY-STREAM HANDOFF (Payload Key Update)
      // Stash immediate payload for zero-disk launching
      localStorage.setItem("pico_handoff_payload", base64Data);
      localStorage.setItem("pico_handoff_name", filename);

      await this.scan();
      return true;
    } catch (e) {
      return false;
    }
  }

  async deleteCartridge(filename) {
    try {
      // 1. Delete Cartridge
      await Filesystem.deleteFile({
        path: `${CARTS_DIR}/${filename}`,
        directory: Directory.Documents,
      });

      // 2. Delete Cover Image (Best effort)
      const baseName = filename.replace(/\.p8(\.png)?$/, "");
      try {
        await Filesystem.deleteFile({
          path: `${IMAGES_DIR}/${baseName}.png`,
          directory: Directory.Documents,
        });
      } catch (e) {
        // Image might not exist or be used by something else (unlikely in this structure)
      }

      // 3. Remove from metadata if exists
      if (this.metadata[filename]) {
        delete this.metadata[filename];
        await this.saveMetadata();
      }

      // Rescan to update list
      await this.scan();
      return true;
    } catch (e) {
      console.error("Delete failed", e);
      return false;
    }
  }

  async saveMetadata() {
    try {
      await Filesystem.writeFile({
        path: LIBRARY_FILE,
        data: JSON.stringify(this.metadata),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    } catch (e) {
      console.error("Failed to save metadata", e);
    }
  }
}

export const libraryManager = new LibraryManager();
