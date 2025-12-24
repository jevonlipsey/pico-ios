import { test, expect } from "@playwright/test";

test("Lazy Loading Injection", async ({ page }) => {
  // 1. Load the player page (simulating app open)
  // We point to the local dev server (User must ensure it's running)
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  await page.goto("http://localhost:5173/play?cart=test_cart");

  // 2. Wait for engine to initialize (Jelpi boot or shell)
  // The canvas should be present
  await expect(page.locator("#canvas")).toBeVisible();

  // Wait for specific VFS mount log from Emscripten
  // The engine prints "mounted filesystem" or "codo: mounted filesystem" when FS is ready
  console.log("Waiting for filesystem mount...");
  const fsMountLog = await page.waitForEvent("console", (msg) =>
    msg.text().includes("mounted filesystem")
  );
  console.log("Filesystem mounted log detected:", fsMountLog.text());

  // Wait for Module.FS to be strictly defined (or global FS)
  await page.waitForFunction(
    () => (window.Module && window.Module.FS) || window.FS
  );
  console.log("FS object check passed.");

  // PROBE: Double check FS keys
  const fsProbe = await page.evaluate(() => {
    return {
      hasModule: !!window.Module,
      hasFS: !!(window.Module && window.Module.FS),
      globalFS: !!window.FS,
    };
  });
  console.log("FS Probe:", fsProbe);
  expect(fsProbe.hasFS || fsProbe.globalFS).toBe(true);

  // Mock valid cartridge header (PICO-8 header)
  const mockContent = "pico-8 cartridge // test";
  const mockBase64 = Buffer.from(mockContent).toString("base64");

  await page.evaluate((data) => {
    console.log("TEST: Calling injectCartridge...");
    window.injectCartridge(data, "test.p8");
  }, mockBase64);

  // Allow time for async FS ops (if any) or engine cycles
  await page.waitForTimeout(1000);

  // 4. Verify VFS File Creation
  // Check if file exists in Emscripten VFS
  const fileContent = await page.evaluate(() => {
    try {
      console.log("Checking Module after reboot...");
      const fs = (window.Module && window.Module.FS) || window.FS;

      if (!fs) return "NO_FS_FOUND";

      console.log("VFS Root:", fs.readdir("/"));
      return fs.readFile("/current_cart.p8", { encoding: "utf8" });
    } catch (e) {
      return "ERROR: " + e.message;
    }
  });

  expect(fileContent).toBe(mockContent);
  console.log("Cartridge injection verified in VFS.");
});
