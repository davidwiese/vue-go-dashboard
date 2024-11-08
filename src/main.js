import "./assets/main.css";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Create vuetify instance (similar to Material-UI in React)
const vuetify = createVuetify({
	components,
	directives,
});

// Create Vue app
const app = createApp(App);

// Add Vuetify and Vue Router and mount to #app
app.use(router);
app.use(vuetify);
app.mount("#app");
