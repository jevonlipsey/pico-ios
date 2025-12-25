import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

const ROOT = "";
const CARTS_DIR = "Carts";
const IMAGES_DIR = "Images";
const SAVES_DIR = "Saves";
const LIBRARY_FILE = "library.json";

export class LibraryManager {
  constructor() {
    this.games = [];
    this.metadata = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // # ensure pocket8 directories exist
      // using try/catch wrapper for safety
      const ensureDir = async (path) => {
        try {
          // check existence first
          await Filesystem.stat({
            path,
            directory: Directory.Documents,
          });
        } catch (e) {
          // # try to create if missing
          try {
            await Filesystem.mkdir({
              path,
              directory: Directory.Documents,
              recursive: true,
            });
          } catch (mkdirError) {
            // silently fail
          }
        }
      };

      await ensureDir(CARTS_DIR);
      await ensureDir(IMAGES_DIR);
      await ensureDir(SAVES_DIR);

      // # load metadata
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
      // silent failure
    }
  }

  async cleanupLegacy() {
    // # legacy cleanup logic removed
  }

  async scan() {
    const games = [];
    const scanPath = CARTS_DIR;

    try {
      const result = await Filesystem.readdir({
        path: scanPath,
        directory: Directory.Documents,
      });

      const scanPromises = result.files
        .filter(
          (file) => file.name.endsWith(".p8.png") || file.name.endsWith(".p8")
        )
        .map(async (file) => {
          const id = file.name;
          const meta = this.metadata[id] || { playCount: 0, lastPlayed: 0 };
          const baseName = file.name.replace(/\.p8(\.png)?$/, "");
          const imagePath = `${IMAGES_DIR}/${baseName}.png`;
          let coverUri = null;

          try {
            const stat = await Filesystem.getUri({
              path: imagePath,
              directory: Directory.Documents,
            });
            coverUri = Capacitor.convertFileSrc(stat.uri);
          } catch (e) {}

          let path = file.uri;
          if (path.startsWith("file://")) {
            path = path.replace("file://", "");
          }

          return {
            name: file.name,
            id: id,
            path: path,
            lastPlayed: meta.lastPlayed,
            playCount: meta.playCount,
            cover: coverUri || null,
          };
        });

      const loadedGames = await Promise.all(scanPromises);
      games.push(...loadedGames);
      console.log(`📦 [Shelf] ${games.length} games ready.`);
    } catch (e) {
      // silent catch
    }

    // # sort by last played descending
    games.sort((a, b) => b.lastPlayed - a.lastPlayed);

    this.games = games;
    return games;
  }

  async importFile(blob, filename) {
    try {
      // # convert blob to base64
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

      // # sanitize path logic
      let targetPath = `${CARTS_DIR}/${filename}`;

      // 1. save cartridge to pocket8/carts/
      await Filesystem.writeFile({
        path: targetPath,
        data: base64Data,
        directory: Directory.Documents,
      });

      // 2. extract/copy image to pocket8/images/
      if (filename.endsWith(".p8.png") || filename.endsWith(".png")) {
        const baseName = filename
          .replace(/\.p8(\.png)?$/, "")
          .replace(/\.png$/, "");

        try {
          let imagePath = `${IMAGES_DIR}/${baseName}.png`;

          await Filesystem.writeFile({
            path: imagePath,
            data: base64Data,
            directory: Directory.Documents,
          });
        } catch (e) {}
      }

      // # memory handoff payload update
      localStorage.setItem("pico_handoff_payload", base64Data);
      localStorage.setItem("pico_handoff_name", filename);

      await this.scan();
      return true;
    } catch (e) {
      return false;
    }
  }

  async updateLastPlayed(cartName) {
    if (!this.metadata[cartName]) {
      this.metadata[cartName] = { playCount: 0, lastPlayed: 0 };
    }
    this.metadata[cartName].lastPlayed = Date.now();
    this.metadata[cartName].playCount =
      (this.metadata[cartName].playCount || 0) + 1;
    await this.saveMetadata();
  }

  async deleteCartridge(filename) {
    try {
      // 1. delete cartridge
      await Filesystem.deleteFile({
        path: `${CARTS_DIR}/${filename}`,
        directory: Directory.Documents,
      });

      // 2. delete cover image
      const baseName = filename.replace(/\.p8(\.png)?$/, "");
      try {
        await Filesystem.deleteFile({
          path: `${IMAGES_DIR}/${baseName}.png`,
          directory: Directory.Documents,
        });
      } catch (e) {
        // image might not exist
      }

      // 3. remove from metadata
      if (this.metadata[filename]) {
        delete this.metadata[filename];
        await this.saveMetadata();
      }

      // # rescan to update list
      await this.scan();
      return true;
    } catch (e) {
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
      // failed to save metadata
    }
  }
}

export const libraryManager = new LibraryManager();
