<script setup>
import { ref, onMounted, watch } from "vue";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
});

// Map state
const zoom = ref(13);
const center = ref([34.052235, -118.243683]);

// Watch for changes in vehicles to update map center if needed
watch(
	() => props.vehicles,
	(newVehicles) => {
		if (newVehicles.length > 0 && newVehicles[0].latest_device_point) {
			// Center on first vehicle's location
			center.value = [
				newVehicles[0].latest_device_point.lat,
				newVehicles[0].latest_device_point.lng,
			];
		}
	},
	{ immediate: true }
);
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<div style="height: 500px; width: 100%">
				<l-map ref="map" v-model:zoom="zoom" :center="center">
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
								<strong>{{ vehicle.display_name }}</strong
								><br />
								Status: {{ vehicle.active_state }}<br />
								Speed:
								{{
									vehicle.latest_device_point?.device_point_detail?.speed
										?.display || "N/A"
								}}<br />
								Last Updated:
								{{
									new Date(
										vehicle.latest_device_point?.dt_tracker
									).toLocaleString()
								}}
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
</style>
