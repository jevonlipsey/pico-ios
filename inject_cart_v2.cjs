const fs = require("fs");
const path = require("path");

const cartPath = path.join(__dirname, "Celeste.p8.png");
const jsPath = path.join(__dirname, "public/pico8.js");

try {
  console.log(`Reading cartridge from: ${cartPath}`);
  const cartBuffer = fs.readFileSync(cartPath);
  const cartBytes = Array.from(cartBuffer);
  console.log(`Cartridge size: ${cartBytes.length} bytes`);

  console.log(`Reading JS from: ${jsPath}`);
  let jsContent = fs.readFileSync(jsPath, "utf8");

  // 1. Fix _cartname
  // We want: var _cartname = "Celeste.p8.png";
  // It might be commented out: // var _cartname = "Celeste.p8.png";
  // or: var _cartname = ["Celeste.p8.png"]; (old)

  // Regex for _cartname line (commented or not)
  const cartnameRegex = /(\/\/ )?var _cartname = .*;$/m;
  if (cartnameRegex.test(jsContent)) {
    jsContent = jsContent.replace(
      cartnameRegex,
      'var _cartname = "Celeste.p8.png";'
    );
    console.log("Updated _cartname.");
  } else {
    console.warn("Could not find _cartname to update, prepending it.");
    jsContent = 'var _cartname = "Celeste.p8.png";\n' + jsContent;
  }

  // 2. Inject _cartdat
  // Current state might be: var _cartdat = []; // Removed by repair script
  // We want: var _cartdat = [1, 2, 3...];

  const cartDatRegex = /var _cartdat = \[.*\];.*$/m;
  const newCartDat = `var _cartdat = [${cartBytes.join(",")}];`;

  if (cartDatRegex.test(jsContent)) {
    console.log("Found _cartdat placeholder. Injecting bytes...");
    // Using a function replacement to avoid issues if the string is too long for some regex engines (though usually fine in Node)
    jsContent = jsContent.replace(cartDatRegex, () => newCartDat);
  } else {
    // Checking for commented out version just in case
    const commentedRegex = /\/\/ var _cartdat = \[.*$/m;
    if (commentedRegex.test(jsContent)) {
      console.log("Found commented _cartdat. Injecting bytes...");
      jsContent = jsContent.replace(commentedRegex, () => newCartDat);
    } else {
      console.warn("Could not find _cartdat placeholder. Appending it.");
      // Ideally it should be near the top, but let's see.
      // If we prepend, we might shadow or be shadowed.
      // We'll insert it after _cartname.
      jsContent = jsContent.replace(
        'var _cartname = "Celeste.p8.png";',
        'var _cartname = "Celeste.p8.png";\n' + newCartDat
      );
    }
  }

  fs.writeFileSync(jsPath, jsContent);
  console.log("SUCCESS: Injected Celeste binaries into pico8.js");
} catch (err) {
  console.error("Injection Failed:", err);
  process.exit(1);
}
