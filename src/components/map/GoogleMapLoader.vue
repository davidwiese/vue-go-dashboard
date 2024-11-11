<!-- GoogleMapLoader.vue handles Google Maps API initialization and lifecycle -->
<!-- It provides a reusable wrapper for Google Maps instances -->

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";

// Props define required configuration for map initialization
const props = defineProps({
	mapConfig: {
		type: Object,
		required: true,
	},
	apiKey: {
		type: String,
		required: true,
	},
});

// Refs hold references to map-related objects
const googleMap = ref(null); // DOM element for map
const google = ref(null); // Google Maps API instance
const map = ref(null); // Map instance
const windowWidth = ref(0); // Window width for responsive map sizing

// Setup window resize listener on mount
onMounted(() => {
	windowWidth.value = window.innerWidth;
	window.addEventListener("resize", handleWindowResize);
});

// Clean up resources when component is destroyed
onBeforeUnmount(() => {
	// Remove resize listener
	window.removeEventListener("resize", handleWindowResize);

	// Clean up Google Maps instances
	if (map.value) {
		google.value.maps.event.clearInstanceListeners(map.value);
		map.value = null;
	}
	if (google.value) {
		google.value = null;
	}
});

// Update window width on resize
const handleWindowResize = () => {
	windowWidth.value = window.innerWidth;
};

// Initialize Google Maps
const initializeMap = async () => {
	try {
		// Dynamically load Google Maps script
		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=marker,maps&v=weekly&callback=initMap&loading=async`;
		document.head.appendChild(script);

		// Wait for Google Maps API to load
		// Uses global callback approach required by Google Maps
		await new Promise((resolve) => {
			window.initMap = () => {
				resolve(window.google);
			};
		});

		// Store reference to Google Maps API
		google.value = window.google;

		// Create new map instance with configuration
		map.value = new google.value.maps.Map(googleMap.value, {
			...props.mapConfig,
			mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
		});
	} catch (error) {
		console.error("Error loading Google Maps:", error);
	}
};

// Initialize map when component mounts
onMounted(initializeMap);
</script>

<template>
	<div style="height: 100%">
		<!-- Map container element -->
		<div ref="googleMap" style="height: 100%; width: 100%"></div>
		<!-- Provide map instance to child components once initialized -->
		<template v-if="google && map">
			<slot :google="google" :map="map" />
		</template>
	</div>
</template>
