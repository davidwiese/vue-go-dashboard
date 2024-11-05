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

		// Load the Maps JavaScript API using the script loader
		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=marker,maps&v=weekly&callback=initMap&loading=async`;
		document.head.appendChild(script);

		await new Promise((resolve) => {
			window.initMap = () => {
				resolve(window.google);
			};
		});

		google.value = window.google;
		console.log("Google Maps loaded, creating map...");

		map.value = new google.value.maps.Map(googleMap.value, {
			...props.mapConfig,
			mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
		});

		console.log("Map instance created:", {
			mapExists: !!map.value,
			mapCenter: map.value.getCenter()?.toJSON(),
			mapZoom: map.value.getZoom(),
		});
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
