const fs = require("fs");
const path = "public/pico8.js";
console.log("Reading " + path + "...");
const content = fs.readFileSync(path, "utf8");
const lines = content.split("\n");

console.log("Total lines:", lines.length);
console.log("Line 3 (Index 2):", lines[2].substring(0, 50) + "...");
console.log("Line 133 (Index 132):", lines[132].substring(0, 50) + "...");

// Tolerance check: startsWith might fail if there's whitespace.
if (
  lines[2].trim().startsWith("var _cartdat") &&
  lines[132].trim().startsWith("var Module")
) {
  console.log("Target confirmed. Initiating surgery...");
  // Replace indices 2 to 131. (130 items)
  const replacement =
    'var _cartdat = window.RAM_CART_DATA ? Array.from(window.RAM_CART_DATA) : []; console.log("☢️ [Nuclear] Replaced _cartdat with RAM Data");';
  lines.splice(2, 130, replacement);

  fs.writeFileSync(path, lines.join("\n"));
  console.log("Surgery complete. _cartdat replaced.");
} else {
  console.error("Line mismatch! Aborting surgery.");
  console.error("Expected Line 3 to start with var _cartdat");
  console.error("Expected Line 133 to start with var Module");
  process.exit(1);
}
