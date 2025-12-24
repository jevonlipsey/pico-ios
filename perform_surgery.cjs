const fs = require("fs");
const path = require("path");

const cartPath = path.join(__dirname, "Celeste.p8.png");
const jsPath = path.join(__dirname, "public/pico8.js");

try {
  console.log(`Reading cartridge from: ${cartPath}`);
  const cartBuffer = fs.readFileSync(cartPath);
  const cartBytes = Array.from(cartBuffer);
  console.log(`Cartridge size: ${cartBytes.length} bytes`);

  // Create the replacement string: "var _cartdat=[...]; var _cartname=['...'];"
  const cartArrayStr = `var _cartdat=[${cartBytes.join(
    ","
  )}]; var _cartname=["Celeste.p8.png"];`;

  console.log(`Reading JS from: ${jsPath}`);
  let jsContent = fs.readFileSync(jsPath, "utf8");

  // Pattern to match the current state.
  // We modified it to: var _cartdat = undefined;
  // But we should also support replacing the original array if it was there.

  // Regex that catches "var _cartdat = ... ;" non-greedy up to semicolon
  // We want to be careful not to consume more than needed.
  const regexUndefined = /var\s+_cartdat\s*=\s*undefined\s*;/;
  const regexArray = /var\s+_cartdat\s*=\s*\[.*?\];/s; // Dot matches newlines
  const regexFallback = /var\s+_cartdat\s*=.*?;/s;

  if (regexUndefined.test(jsContent)) {
    console.log('Found "undefined" _cartdat definition. Replacing...');
    jsContent = jsContent.replace(regexUndefined, cartArrayStr);
  } else if (regexArray.test(jsContent)) {
    console.log("Found existing array _cartdat definition. Replacing...");
    jsContent = jsContent.replace(regexArray, cartArrayStr);
  } else if (regexFallback.test(jsContent)) {
    console.log("Found generic _cartdat definition. Replacing...");
    jsContent = jsContent.replace(regexFallback, cartArrayStr);
  } else {
    console.error('ERROR: Could not find "var _cartdat = ..." to replace!');
    process.exit(1);
  }

  fs.writeFileSync(jsPath, jsContent);
  console.log("SUCCESS: Injected Celeste binaries into pico8.js");
} catch (err) {
  console.error("Surgery Failed:", err);
  process.exit(1);
}
