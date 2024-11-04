<script setup>
import { ref, onMounted } from "vue";
import { Loader } from "@googlemaps/js-api-loader";

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

		const loader = new Loader({
			apiKey: props.apiKey,
			version: "weekly",
			libraries: ["marker"],
		});

		google.value = await loader.load();
		console.log("Google Maps loaded");

		map.value = new google.value.maps.Map(googleMap.value, {
			...props.mapConfig,
			mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
		});
		console.log("Map created");
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
