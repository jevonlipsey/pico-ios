---
trigger: always_on
---

For VirtualController.vue, always wrap the controller container in a CSS safe-area-inset. Use padding-bottom: env(safe-area-inset-bottom); to prevent buttons from being squashed by the iPhone Home Bar. also be aware of the iphone menu bar, and notch to ensure things look good across old and new devices.
