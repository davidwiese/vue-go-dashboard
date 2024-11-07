<script setup lang="ts">
import { ref, computed, watch } from "vue";
import GoogleMapLoader from "./GoogleMapLoader.vue";

interface Vehicle {
	device_id: string;
	display_name: string;
	online: boolean;
	latest_device_point?: {
		speed: number;
		lat: number;
		lng: number;
		dt_tracker: string;
	};
}

interface Preference {
	isHidden: boolean;
	sortOrder: number;
	displayName: string;
}

interface Props {
	vehicles: Vehicle[];
	preferences: Record<string, Preference>;
}

const props = defineProps<{
	vehicles: Vehicle[];
	preferences: Record<string, Preference>;
	selectedVehicleId?: string;
}>();

// Function to handle vehicle selection
const handleVehicleSelection = (deviceId: string) => {
	if (!google.value || !map.value) return;

	const marker = markers.value[deviceId];
	if (marker) {
		// Center map on vehicle
		map.value.panTo({
			lat: marker.getPosition().lat(),
			lng: marker.getPosition().lng(),
		});
		map.value.setZoom(15); // Zoom in closer to the vehicle

		// Find all info windows and close them
		Object.values(markers.value).forEach((m) => {
			if (m.infoWindow) {
				m.infoWindow.close();
			}
		});

		// Open this vehicle's info window
		if (marker.infoWindow) {
			marker.infoWindow.open(map.value, marker);
		}
	}
};

// Watch for selectedVehicleId changes
watch(
	() => props.selectedVehicleId,
	(newId) => {
		if (newId) {
			handleVehicleSelection(newId);
		}
	}
);

const mapConfig = computed(() => ({
	center: { lat: 36.7783, lng: -119.4179 },
	zoom: 6,
}));

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Map and markers references
const map = ref<any>(null);
const google = ref<any>(null);
const markers = ref<Record<string, any>>({});

// Helper function to get marker icon
const getMarkerIcon = (vehicle) => {
	if (!google.value) return null;

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

// Function to create info window content
const createInfoWindowContent = (vehicle) => `
  <div class="info-window" style="padding: 8px;">
    <h3 style="margin: 0 0 8px 0;">${vehicle.display_name}</h3>
    <p style="margin: 4px 0;">Status: ${
			vehicle.online ? "Online" : "Offline"
		}</p>
    <p style="margin: 4px 0;">Speed: ${
			vehicle.latest_device_point?.speed || 0
		} km/h</p>
    <p style="margin: 4px 0; font-size: 0.9em;">
      Last Updated: ${new Date(
				vehicle.latest_device_point?.dt_tracker
			).toLocaleString()}
    </p>
  </div>
`;

// Function to create or update a marker
const createOrUpdateMarker = (vehicle) => {
	if (!google.value || !map.value) return;

	try {
		const isHidden = props.preferences[vehicle.device_id]?.isHidden;
		let marker = markers.value[vehicle.device_id];

		if (marker) {
			// Update existing marker
			marker.setPosition({
				lat: vehicle.latest_device_point.lat,
				lng: vehicle.latest_device_point.lng,
			});
			marker.setIcon(getMarkerIcon(vehicle));
			marker.setVisible(!isHidden);
			// Update info window content
			if (marker.infoWindow) {
				marker.infoWindow.setContent(createInfoWindowContent(vehicle));
			}
		} else {
			// Create new marker
			marker = new google.value.maps.Marker({
				position: {
					lat: vehicle.latest_device_point.lat,
					lng: vehicle.latest_device_point.lng,
				},
				icon: getMarkerIcon(vehicle),
				title: vehicle.display_name,
				map: map.value,
				visible: !isHidden,
			});

			const infoWindow = new google.value.maps.InfoWindow({
				content: createInfoWindowContent(vehicle),
			});

			// Store infoWindow with marker
			marker.infoWindow = infoWindow;

			marker.addListener("click", () => {
				// Close all other info windows
				Object.values(markers.value).forEach((m) => {
					if (m.infoWindow && m !== marker) {
						m.infoWindow.close();
					}
				});
				infoWindow.open(map.value, marker);
			});

			markers.value[vehicle.device_id] = marker;
		}
	} catch (error) {
		console.error(
			`Error handling marker for vehicle ${vehicle.device_id}:`,
			error
		);
	}
};

// Function to remove a marker with proper cleanup
const removeMarker = (deviceId) => {
	const marker = markers.value[deviceId];
	if (marker) {
		try {
			marker.setVisible(false);
			google.value?.maps.event.clearInstanceListeners(marker);
			delete markers.value[deviceId];
		} catch (error) {
			console.error(`Error removing marker ${deviceId}:`, error);
		}
	}
};

// Unified function to update markers
const updateMarkers = () => {
	if (!google.value || !map.value) return;

	try {
		const currentDeviceIds = new Set(props.vehicles.map((v) => v.device_id));

		// Remove obsolete markers
		Object.keys(markers.value).forEach((deviceId) => {
			if (!currentDeviceIds.has(deviceId)) {
				removeMarker(deviceId);
			}
		});

		// Update or create markers for current vehicles
		props.vehicles.forEach((vehicle) => {
			const isHidden = props.preferences[vehicle.device_id]?.isHidden;

			if (isHidden) {
				removeMarker(vehicle.device_id);
			} else {
				createOrUpdateMarker(vehicle);
			}
		});
	} catch (error) {
		console.error("Error updating markers:", error);
	}
};

// Consolidated watcher for vehicles and preferences
watch([() => props.vehicles, () => props.preferences], updateMarkers, {
	deep: true,
});
</script>

<template>
	<v-card class="map-container">
		<v-card-text>
			<GoogleMapLoader :map-config="mapConfig" :api-key="API_KEY">
				<template #default="{ google: g, map: m }">
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
