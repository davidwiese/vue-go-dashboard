// router/index.js configures the application's routing
// Similar to React Router's setup, but with Vue Router's conventions

import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

// Create router instance with HTML5 history mode
// Similar to BrowserRouter in React Router, but more configurable
const router = createRouter({
	// Use web history for clean URLs
	// Unlike React Router, Vue Router requires explicit history mode selection
	history: createWebHistory(import.meta.env.BASE_URL),

	// Define routes array
	// Similar to React Router's Routes/Route components, but declarative
	routes: [
		{
			path: "/", // URL path
			name: "home", // Route name for programmatic navigation
			component: HomeView, // Component to render
		},
	],
});

export default router;
