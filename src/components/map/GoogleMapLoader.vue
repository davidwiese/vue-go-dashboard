<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";

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
const windowWidth = ref(0);

onMounted(() => {
	windowWidth.value = window.innerWidth;
	window.addEventListener("resize", handleWindowResize);
});

onBeforeUnmount(() => {
	window.removeEventListener("resize", handleWindowResize);
	if (map.value) {
		google.value.maps.event.clearInstanceListeners(map.value);
		map.value = null;
	}
	if (google.value) {
		google.value = null;
	}
});

const handleWindowResize = () => {
	windowWidth.value = window.innerWidth;
};

const initializeMap = async () => {
	try {
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

		map.value = new google.value.maps.Map(googleMap.value, {
			...props.mapConfig,
			mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
		});
	} catch (error) {
		console.error("Error loading Google Maps:", error);
	}
};

onMounted(initializeMap);
</script>

<template>
	<div style="height: 100%">
		<div ref="googleMap" style="height: 100%; width: 100%"></div>
		<template v-if="google && map">
			<slot :google="google" :map="map" />
		</template>
	</div>
</template>
