<script setup>
import { ref, onMounted, watch } from "vue";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
});

const zoom = ref(13);
const center = ref([34.052235, -118.243683]);
const mapRef = ref(null);

// Calculate bounds to fit all vehicles
const fitVehicleBounds = () => {
	if (!props.vehicles.length || !mapRef.value) return;

	const validCoords = props.vehicles
		.filter((v) => v.latest_device_point?.lat && v.latest_device_point?.lng)
		.map((v) => [v.latest_device_point.lat, v.latest_device_point.lng]);

	if (validCoords.length > 0) {
		const bounds = L.latLngBounds(validCoords);
		mapRef.value.leafletObject.fitBounds(bounds, {
			padding: [50, 50], // Add padding around the bounds
			maxZoom: 15, // Prevent excessive zoom when vehicles are close together
		});
	}
};

// Watch for vehicles data changes and fit bounds
watch(
	() => props.vehicles,
	(newVehicles) => {
		if (newVehicles.length > 0) {
			fitVehicleBounds();
		}
	},
	{ immediate: true }
);

// Also fit bounds when map is mounted
onMounted(() => {
	fitVehicleBounds();
});

const getMarkerColor = (vehicle) => {
	if (!vehicle.online) return "gray";
	if (vehicle.latest_device_point?.speed > 0) return "green";
	return "orange";
};

const formatSpeed = (vehicle) => {
	return (
		vehicle.latest_device_point?.device_point_detail?.speed?.display || "N/A"
	);
};
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<div style="height: 500px; width: 100%">
				<l-map ref="mapRef" v-model:zoom="zoom" :center="center">
					<l-tile-layer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						layer-type="base"
						name="OpenStreetMap"
					/>
					<l-marker
						v-for="vehicle in vehicles"
						:key="`${vehicle.device_id}-${vehicle.latest_device_point?.lat}-${vehicle.latest_device_point?.lng}`"
						:lat-lng="[
							vehicle.latest_device_point?.lat || 0,
							vehicle.latest_device_point?.lng || 0,
						]"
					>
						<l-popup>
							<div class="vehicle-popup">
								<div class="popup-header">
									<strong>{{ vehicle.display_name }}</strong>
									<v-chip
										size="x-small"
										:color="vehicle.online ? 'success' : 'error'"
									>
										{{ vehicle.online ? "ONLINE" : "OFFLINE" }}
									</v-chip>
								</div>
								<div class="popup-details">
									<div>Speed: {{ formatSpeed(vehicle) }}</div>
									<div>Status: {{ vehicle.active_state }}</div>
									<div class="text-caption">
										Last Updated:
										{{
											new Date(
												vehicle.latest_device_point?.dt_tracker
											).toLocaleString()
										}}
									</div>
								</div>
							</div>
						</l-popup>
					</l-marker>
				</l-map>
			</div>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.map-container {
	margin-bottom: 1rem;
}

.vehicle-popup {
	padding: 8px;
	min-width: 200px;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.popup-details > div {
	margin-bottom: 4px;
}
</style>
