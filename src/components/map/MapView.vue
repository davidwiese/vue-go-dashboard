<script setup>
import { computed } from "vue";
import GoogleMapLoader from "./GoogleMapLoader.vue";
import GoogleMapMarker from "./GoogleMapMarker.vue";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
});

const mapConfig = computed(() => ({
	center: { lat: 36.7783, lng: -119.4179 }, // California center
	zoom: 6,
}));

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<GoogleMapLoader :map-config="mapConfig" :api-key="API_KEY">
				<template #default="{ google, map }">
					<GoogleMapMarker
						v-for="vehicle in vehicles"
						:key="vehicle.device_id"
						:google="google"
						:map="map"
						:vehicle="vehicle"
					/>
				</template>
			</GoogleMapLoader>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.map-container {
	margin-bottom: 1rem;
}
</style>
