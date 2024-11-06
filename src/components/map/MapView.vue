<script setup>
import { ref, computed, watch } from "vue";
import GoogleMapLoader from "./GoogleMapLoader.vue";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
	preferences: {
		type: Object,
		required: true,
	},
});

const mapConfig = computed(() => ({
	center: { lat: 36.7783, lng: -119.4179 },
	zoom: 6,
}));

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Map and markers references
const map = ref(null);
const google = ref(null);
const markers = ref({});

// Computed property for visible vehicles
const visibleVehicles = computed(() => {
	console.log("Computing visibleVehicles...");
	const filtered = props.vehicles.filter((vehicle) => {
		const pref = props.preferences[vehicle.device_id];
		const shouldShow = pref ? !pref.is_hidden : true;
		return shouldShow;
	});
	console.log("Filtered vehicles count:", filtered.length);
	return filtered;
});

// Helper function to get marker icon
const getMarkerIcon = (vehicle) => {
	const backgroundColor = vehicle.online
		? vehicle.latest_device_point?.speed > 0
			? "#4caf50"
			: "#ff9800"
		: "#de96a2";

	return {
		path: google.value.maps.SymbolPath.CIRCLE,
		fillColor: backgroundColor,
		fillOpacity: 1,
		strokeColor: "#FFFFFF",
		strokeWeight: 2,
		scale: 12,
	};
};

// Function to create or update a marker
const createOrUpdateMarker = (vehicle) => {
	if (!google.value || !map.value) return;

	let marker = markers.value[vehicle.device_id];

	if (marker) {
		// Update marker position and icon
		marker.setPosition({
			lat: vehicle.latest_device_point.lat,
			lng: vehicle.latest_device_point.lng,
		});
		marker.setIcon(getMarkerIcon(vehicle));
	} else {
		// Create new marker
		marker = new google.value.maps.Marker({
			map: map.value,
			position: {
				lat: vehicle.latest_device_point.lat,
				lng: vehicle.latest_device_point.lng,
			},
			icon: getMarkerIcon(vehicle),
			title: vehicle.display_name,
		});

		// Add an info window if needed
		const infoWindow = new google.value.maps.InfoWindow({
			content: `
        <div class="info-window" style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0;">${vehicle.display_name}</h3>
          <p style="margin: 4px 0;">Status: ${
						vehicle.online ? "Online" : "Offline"
					}</p>
          <p style="margin: 4px 0;">Speed: ${
						vehicle.latest_device_point?.speed || 0
					} km/h</p>
          <p style="margin: 4px 0; font-size: 0.9em;">Last Updated: ${new Date(
						vehicle.latest_device_point?.dt_tracker
					).toLocaleString()}</p>
        </div>
      `,
		});

		marker.addListener("click", () => {
			infoWindow.open(map.value, marker);
		});

		markers.value[vehicle.device_id] = marker;
	}
};

// Function to remove a marker
const removeMarker = (deviceId) => {
	const marker = markers.value[deviceId];
	if (marker) {
		marker.setMap(null);
		delete markers.value[deviceId];
	}
};

// Watch for changes in visibleVehicles
watch(
	visibleVehicles,
	(newVehicles, oldVehicles) => {
		if (!google.value || !map.value) return;

		// Get arrays of device IDs
		const newIds = newVehicles.map((v) => v.device_id);
		const oldIds = oldVehicles ? oldVehicles.map((v) => v.device_id) : [];

		// Find vehicles to add
		const addedVehicles = newVehicles.filter(
			(v) => !markers.value[v.device_id]
		);
		// Find vehicles to remove
		const removedIds = oldIds.filter((id) => !newIds.includes(id));

		// Add new markers
		addedVehicles.forEach((vehicle) => {
			createOrUpdateMarker(vehicle);
		});

		// Remove old markers
		removedIds.forEach((id) => {
			removeMarker(id);
		});
	},
	{ immediate: true, deep: true }
);

// Watch for updates in vehicle positions
watch(
	() => props.vehicles,
	(newVehicles) => {
		if (!google.value || !map.value) return;

		newVehicles.forEach((vehicle) => {
			if (markers.value[vehicle.device_id]) {
				createOrUpdateMarker(vehicle);
			}
		});
	},
	{ deep: true }
);
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<GoogleMapLoader :map-config="mapConfig" :api-key="API_KEY">
				<template #default="{ google: g, map: m }">
					<!-- Assign google and map references -->
					<div v-if="(google = g) && (map = m)"></div>
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
