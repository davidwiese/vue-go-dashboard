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
		const loader = new Loader({
			apiKey: props.apiKey,
			version: "weekly",
		});

		google.value = await loader.load();
		map.value = new google.value.maps.Map(googleMap.value, props.mapConfig);
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
