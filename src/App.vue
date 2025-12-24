<template>
  <div
    class="antialiased min-h-screen bg-gradient-to-b from-gray-900 to-black text-white selection:bg-purple-500 selection:text-white"
  >
    <!-- Global background effects could go here -->
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
