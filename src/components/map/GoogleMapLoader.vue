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

const loadGoogleMaps = () => {
	return new Promise((resolve) => {
		if (window.google?.maps) {
			resolve(window.google);
			return;
		}

		// Only add the script if it's not already present
		if (
			!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
		) {
			const script = document.createElement("script");
			script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=marker&v=weekly&callback=initMap&loading=async`;
			script.async = true;
			document.head.appendChild(script);
		}

		window.initMap = () => {
			resolve(window.google);
		};
	});
};

const initializeMap = async () => {
	try {
		console.log("Initializing map with config:", props.mapConfig);
		console.log("Map ID:", import.meta.env.VITE_GOOGLE_MAPS_MAP_ID);

		google.value = await loadGoogleMaps();

		console.log("Google Maps loaded");

		map.value = new google.value.maps.Map(googleMap.value, {
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
