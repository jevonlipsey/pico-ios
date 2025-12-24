---
trigger: always_on
---

Never hardcode cartridge filenames (e.g., Celeste.p8.png) in Player.vue. Always use dynamic route parameters or props to resolve the full path from the Documents directory to ensure new uploads load correctly and the user can actually load their OWN games from their phone or whatever device theyre using.
