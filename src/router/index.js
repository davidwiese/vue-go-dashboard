import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

console.log("Router initializing, HomeView component:", HomeView);

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
			beforeEnter: (to, from, next) => {
				console.log("About to enter home route");
				next();
			},
		},
	],
});

router.beforeEach((to, from, next) => {
	console.log("Route changing to:", to.path);
	next();
});

router.afterEach((to) => {
	console.log("Route changed to:", to.path);
});

export default router;
