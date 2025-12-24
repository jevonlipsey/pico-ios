---
trigger: always_on
---

Before attempting to boot a cartridge, use the filesystem tool to verify the file exists in Documents/Carts/. If the file is missing, the app must show a user-friendly error toast, not a black screen. Never hardcode 'Celeste.p8' as a fallback.
