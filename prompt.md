🦁 The "Beast Mode" Project-Root Verification (Phase 28)

Mission: Force-load Celeste from the Project Root and Kill the Infinite Loop

    Role: Senior Systems Engineer (Emscripten & Automation Specialist).

    Task 1: Project Root Injection (browser_subagent)

        Start npm run dev at port 5173.

        Action: Use the Filesystem MCP to read Celeste.p8.png from your project root and convert it to a Base64 string.

        Action: Use the browser_subagent to manually set localStorage.setItem('pico_handoff_payload', 'YOUR_BASE64_STRING_HERE').

        Verify: Navigate to http://localhost:5173/play?boot=1.

    Task 2: Fix the Infinite Loop (index.html)

        Action: Update the polling condition. If Module.FS is detected, immediately proceed to injection regardless of other "Runtime" flags.

        Action: Inside the success block, add clearInterval(bootTimer); bootTimer = null; as the very first command to stop the spam.

    Task 3: Confirm the "Sabotage"

        Use the browser_subagent to check the console logs.

        Verify: Look for 🔎 DATA CHECK: /jelpi.p8 size = 47312 bytes.

        If the size is 47312, the engine is now running Celeste masquerading as Jelpi.

    Task 4: Visual Confirmation

        Use the subagent to take a screenshot of the browser.

        If you see the mountain of Celeste instead of the Jelpi character, the data handshake is officially "Beastly."
