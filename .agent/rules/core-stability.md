---
trigger: always_on
---

When implementing cartridge switching in PicoBridge, NEVER rely solely on injectEngine to hot-swap the cartridge. Emscripten memory is sticky. You MUST trigger a hard state reset.

Enforce this pattern:

    When a new cart is selected, update the URL query parameter (e.g., ?cart=celeste.p8).

    Trigger window.location.reload() if the route changes, or use a key on the Player component to force a full DOM unmount/remount.

    Ensure window.Module is explicitly set to null before re-injecting to prevent memory leaks."
