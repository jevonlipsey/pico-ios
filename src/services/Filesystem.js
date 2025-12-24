import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

const IS_NATIVE = Capacitor.isNativePlatform();

export async function scanLibrary() {
  // Remove mock data trap. trusted to work via Capacitor Filesystem (IndexedDB on web)
  // if (!IS_NATIVE) { ... } logic removed to enable actual storage usage.

  try {
    // Read from Documents directory by default
    const result = await Filesystem.readdir({
      path: "",
      directory: Directory.Documents,
    });

    const games = [];

    for (const file of result.files) {
      if (file.name.endsWith(".p8") || file.name.endsWith(".p8")) {
        // Check for cover image
        const baseName = file.name.replace(/\.p8(\.png)?$/, "");
        const coverPath = `Imgs/${baseName}`;

        let hasCover = false;
        try {
          const coverStat = await Filesystem.stat({
            path: coverPath,
            directory: Directory.Documents,
          });
          hasCover = !!coverStat;
        } catch (e) {
          // Cover not found
        }

        games.push({
          name: file.name,
          path: file.uri, // Use full URI for native player
          cover: hasCover ? coverPath : null,
          directory: Directory.Documents, // Keep track of source
        });
      }
    }

    return games;
  } catch (error) {
    console.error("Failed to scan library:", error);
    return [];
  }
}

export async function readFileAsBase64(path) {
  const result = await Filesystem.readFile({
    path: path,
    directory: Directory.Documents,
    encoding: Encoding.Base64,
  });
  return result.data;
}
