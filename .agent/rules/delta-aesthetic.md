---
trigger: always_on
---

UI Design Standards:

    Touch Targets: All interactive elements must have a hit-box of at least 44x44pt.

    Safe Areas: The bottom controller container must have padding-bottom: calc(env(safe-area-inset-bottom) + 20px) to clear the Home Bar visually.

    Haptics: Every button press must trigger Haptics.impact({ style: ImpactStyle.Light }).

    Visuals: No grey borders. The game container must be pure black (#000000). Use image-rendering: pixelated on the canvas.
