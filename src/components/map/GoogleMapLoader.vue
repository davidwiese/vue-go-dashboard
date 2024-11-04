<script setup>
import { ref, onMounted } from "vue";

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

const googleMap = ref(null);
const google = ref(null);
const map = ref(null);

const initializeMap = async () => {
	try {
		console.log("Initializing map with config:", props.mapConfig);
		console.log("Map ID:", import.meta.env.VITE_GOOGLE_MAPS_MAP_ID);

		// Load the Maps JavaScript API using the script loader
		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=marker&v=weekly`;
		document.head.appendChild(script);

		await new Promise((resolve) => {
			script.onload = resolve;
		});

		// Import required libraries
		const { Map } = await window.google.maps.importLibrary("maps");
		google.value = window.google;

		console.log("Google Maps loaded");

		map.value = new Map(googleMap.value, {
			...props.mapConfig,
			mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
		});

		console.log("Map created with ID:", map.value.mapId);
	} catch (error) {
		console.error("Error loading Google Maps:", error);
	}
};

onMounted(initializeMap);
</script>

<template>
	<div>
		<div ref="googleMap" style="height: 500px; width: 100%"></div>
		<template v-if="google && map">
			<slot :google="google" :map="map" />
		</template>
	</div>
</template>
