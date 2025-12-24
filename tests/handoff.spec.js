import { test, expect } from "@playwright/test";

test("Should boot from Zero-File Handoff (Memory Only)", async ({ page }) => {
  // 0. Go to the page FIRST to establish origin for localStorage
  await page.goto("http://localhost:4173/play");

  // 1. Trigger Memory Handoff (Native Side Simulation)
  console.log("Stashing cart to localStorage...");
  await page.evaluate(() => {
    // Simulate what injectCartridge does natively
    // "Hello PICO-8" base64 is "SGVsbG8gUElDTy00"
    // We add a Data URI prefix to test the cleaning logic
    const fakeBase64 = "data:application/octet-stream;base64,SGVsbG8gUElDTy04";
    // NEW KEYS per Phase 13
    localStorage.setItem("pico_handoff_payload", fakeBase64);
    localStorage.setItem("pico_handoff_name", "test_cart.p8");

    // Hard Reload Trigger matches ?boot=true
    window.location.href = "http://localhost:4173/play?boot=true";
  });

  // 4. Verify Boot
  await page.waitForURL("**/play?boot=true");

  // 3. Verify Module.callMain was called with VFS path
  // We need to spy on Module.callMain or check its effects.
  // Since we can't easily spy across reloads without init scripts,
  // we'll check if the VFS file verifies.

  await page.waitForFunction(() => window.Module && window.Module.FS);

  const vfsExists = await page.evaluate(() => {
    try {
      const stat = window.Module.FS.stat("/boot.p8");
      return stat && stat.size > 0;
    } catch (e) {
      return false;
    }
  });

  expect(vfsExists).toBe(true);
});

test("Should warn on invalid data and boot default", async ({ page }) => {
  // 0. Go to page
  await page.goto("http://localhost:4173/play");

  // 1. Trigger Memory Handoff with INVALID DATA (too short)
  console.log("Stashing INVALID cart...");
  await page.evaluate(() => {
    const fakeBase64 = "TooShort";
    localStorage.setItem("pico_cart_handoff", fakeBase64); // New Key
    localStorage.setItem("pico_filename_handoff", "fail_cart.p8");

    // Reload
    window.location.href = "http://localhost:4173/play?boot=true";
  });

  // 2. Wait for Console Warning
  const warningMsg = await page.waitForEvent(
    "console",
    (msg) =>
      msg.type() === "warning" && msg.text().includes("Invalid cart data")
  );
  expect(warningMsg).toBeTruthy();
});
