<script setup>
import { ref, onMounted, watch } from "vue";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
});

// California centered, zoom level to show the whole state
const zoom = ref(6);
const center = ref([36.7783, -119.4179]);

const getMarkerColor = (vehicle) => {
	if (!vehicle.online) return "#9e9e9e"; // gray
	if (vehicle.latest_device_point?.speed > 0) return "#4caf50"; // green
	return "#ff9800"; // orange
};

const formatSpeed = (vehicle) => {
	return (
		vehicle.latest_device_point?.device_point_detail?.speed?.display || "N/A"
	);
};

// Create custom icon options based on vehicle status
const getMarkerOptions = (vehicle) => {
	return {
		icon: L.divIcon({
			className: "custom-div-icon",
			html: `
        <div style="
          background-color: ${getMarkerColor(vehicle)};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <i class="mdi ${
						vehicle.latest_device_point?.speed > 0 ? "mdi-car-side" : "mdi-car"
					}" 
            style="color: white; font-size: 16px;">
          </i>
        </div>
      `,
			iconSize: [30, 30],
			iconAnchor: [15, 15],
		}),
	};
};
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<div style="height: 500px; width: 100%">
				<l-map v-model:zoom="zoom" :center="center" :zoomAnimation="true">
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
						:options="getMarkerOptions(vehicle)"
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
