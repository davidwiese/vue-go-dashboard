import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), vuetify({ autoImport: true })],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	optimizeDeps: {
		include: [],
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
				configure: (proxy, options) => {
					// Log proxy events for debugging
					proxy.on("error", (err, req, res) => {
						console.log("proxy error", err);
					});
					proxy.on("proxyReq", (proxyReq, req, res) => {
						console.log("Sending Request to:", proxyReq.path);
					});
					proxy.on("proxyRes", (proxyRes, req, res) => {
						console.log("Received Response from:", proxyRes.req.path);
					});
				},
			},
		},
	},
});
