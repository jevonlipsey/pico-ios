const fs = require("fs");
const path = "public/pico8.js";
console.log("Reading " + path + "...");
const content = fs.readFileSync(path, "utf8");
const lines = content.split("\n");

console.log("Total lines:", lines.length);
console.log("Line 3 (Index 2):", lines[2].substring(0, 50) + "...");
console.log("Line 133 (Index 132):", lines[132].substring(0, 50) + "...");

if (
  lines[2].startsWith("var _cartdat") &&
  lines[132].startsWith("var Module")
) {
  console.log("Target confirmed. Initiating surgery...");
  // Replace lines 3-132 (Index 2-131, count 130) with the new logic
  // Correction: Line 3 to 132 inclusive is 132 - 3 + 1 = 130 lines.
  // Index 2 to 131.
  // Wait, if I want to remove up to line 132 (which is index 131), and Line 133 is index 132.
  // The splice count should be 132 - 2 = 130.
  // This removes indices 2, 3, ... 131.
  // Index 132 (var Module) becomes the new index 3.

  const replacement =
    'var _cartdat = window.RAM_CART_DATA ? Array.from(window.RAM_CART_DATA) : []; console.log("☢️ [Nuclear] Replaced _cartdat with RAM Data");';

  lines.splice(2, 130, replacement);

  fs.writeFileSync(path, lines.join("\n"));
  console.log("Surgery complete. _cartdat replaced.");
} else {
  console.error("Line mismatch! Aborting surgery.");
  process.exit(1);
}
