<script setup>
import { computed, watch } from "vue";
import GoogleMapLoader from "./GoogleMapLoader.vue";
import GoogleMapMarker from "./GoogleMapMarker.vue";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
	preferences: {
		type: Map,
		required: true,
	},
});

const mapConfig = computed(() => ({
	center: { lat: 36.7783, lng: -119.4179 }, // California center
	zoom: 6,
}));

// Computed property for visible vehicles
const visibleVehicles = computed(() => {
	console.log("Computing visibleVehicles...");
	console.log("Current preferences Map:", props.preferences);
	const prefsArray = Array.from(props.preferences.entries());
	console.log("All preferences entries:", prefsArray);
	prefsArray.forEach(([key, value]) => {
		console.log("Preference detail:", {
			key,
			value,
			isHidden: value.is_hidden,
			rawValue: JSON.stringify(value),
		});
	});

	const filtered = props.vehicles.filter((vehicle) => {
		const pref = props.preferences.get(vehicle.device_id);
		const shouldShow = pref ? !pref.is_hidden : true;
		console.log("Checking vehicle:", {
			deviceId: vehicle.device_id,
			preference: pref ? JSON.stringify(pref) : "none",
			hasPreference: !!pref,
			isHidden: pref?.is_hidden,
			shouldShow,
		});
		return shouldShow;
	});

	console.log("Filtered vehicles count:", filtered.length);
	return filtered;
});

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Watch for changes in the preferences Map
watch(
	() => props.preferences,
	(newPrefs) => {
		console.log("Preferences changed:");
		Array.from(newPrefs.entries()).forEach(([key, value]) => {
			console.log(`Preference for ${key}:`, {
				raw: JSON.stringify(value),
				isHidden: value.is_hidden,
			});
		});
	},
	{ deep: true }
);
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<GoogleMapLoader :map-config="mapConfig" :api-key="API_KEY">
				<template #default="{ google, map }">
					<GoogleMapMarker
						v-for="vehicle in visibleVehicles"
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
