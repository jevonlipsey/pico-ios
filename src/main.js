import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

// Force Router Push if boot flag is present (Fixes mounting issue)
if (window.location.search.includes("boot")) {
  console.log("🚀 MAIN: Boot flag detected. Forcing navigation to /play...");
  router.push({
    name: "player",
    query: Object.fromEntries(new URLSearchParams(window.location.search)),
  });
}
