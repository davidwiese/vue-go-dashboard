// main.js is the app's entry point
// Initializes Vue and global plugins/middleware

import "./assets/main.css";

// Vuetify - Import all components and directives
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Initialize Vuetify - Similar to creating a MUI theme in React
// but includes both theme and component registration
const vuetify = createVuetify({
	components,
	directives,
});

// Create Vue app instance
const app = createApp(App);

// Register plugins similar to wrapping a React app with providers
// Add Vue Router and  Vuetify
app.use(router);
app.use(vuetify);

// Mount the app to the DOM
app.mount("#app");
