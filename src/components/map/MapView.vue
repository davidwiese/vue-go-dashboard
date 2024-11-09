<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
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
const createInfoWindowContent = (vehicle: Vehicle) => `
  <div class="info-window" style="
    padding: 8px 12px; /* Reduced overall padding */
    font-family: 'Roboto', sans-serif;
    min-width: 250px;
    border-radius: 8px;
    background: white;
  ">
    <div style="
      display: flex;
      align-items: center;
      gap: 6px; /* Slightly reduced gap */
      margin-bottom: 8px; /* Reduced margin */
    ">
      <span class="mdi mdi-${vehicle.online ? "car" : "car-off"}" style="
        color: ${
					vehicle.online
						? vehicle.latest_device_point?.speed! > 0
							? "#4CAF50"
							: "#FB8C00"
						: "#EF5350"
				};
        font-size: 18px; /* Slightly smaller icon */
      "></span>
      <span style="
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
        font-size: 15px; /* Slightly smaller text */
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">${vehicle.display_name}</span>
      <div class="status-chip ${vehicle.online ? "online" : "offline"}" style="
        background-color: ${
					vehicle.online ? "rgba(76, 175, 80, 0.12)" : "rgba(239, 83, 80, 0.12)"
				};
        color: ${vehicle.online ? "#2e7d32" : "#d32f2f"};
        padding: 4px 8px; /* Increased padding top/bottom and left/right */
        border-radius: 16px; /* Rounded borders like v-chip */
        font-size: 11px; /* Slightly smaller font */
        font-weight: 300; /* Thinner text */
        height: 20px; /* Slightly increased height */
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.1px;
      ">${vehicle.online ? "ONLINE" : "OFFLINE"}</div>
    </div>

    <div style="
      display: flex;
      flex-direction: column;
      gap: 3px; /* Reduced gap */
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 3px; /* Reduced gap */
      ">
        <span class="mdi mdi-speedometer" style="
          color: #1E88E5;
          font-size: 14px; /* Slightly smaller icon */
        "></span>
        <span style="
          color: rgba(0, 0, 0, 0.6);
          font-size: 13px; /* Slightly smaller text */
        ">${vehicle.latest_device_point?.speed?.toFixed(1) || 0} km/h</span>
      </div>

      <div style="
        display: flex;
        align-items: center;
        gap: 3px; /* Reduced gap */
      ">
        <span class="mdi mdi-map-marker" style="
          color: #1E88E5;
          font-size: 14px; /* Slightly smaller icon */
        "></span>
        <span style="
          color: rgba(0, 0, 0, 0.6);
          font-size: 13px; /* Slightly smaller text */
        ">${vehicle.latest_device_point?.lat?.toFixed(
					4
				)}, ${vehicle.latest_device_point?.lng?.toFixed(4)}</span>
      </div>
      
      <div style="
        margin-top: 2px; /* Reduced margin */
        color: rgba(0, 0, 0, 0.38);
        font-size: 11px; /* Slightly smaller font */
      ">
        Updated: ${new Date(
					vehicle.latest_device_point?.dt_tracker!
				).toLocaleString()}
      </div>
    </div>
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

onBeforeUnmount(() => {
	// Clean up markers
	Object.values(markers.value).forEach((marker) => {
		if (marker) {
			marker.setMap(null);
			if (marker.infoWindow) {
				marker.infoWindow.close();
			}
		}
	});
	markers.value = {};
});
</script>

<template>
	<v-card class="map-container">
		<v-card-text class="fill-height pa-0">
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
	height: 100%;
}

:deep(.v-card-text) {
	height: 100%;
	display: flex;
	flex-direction: column;
}

.info-window {
	padding: 8px 12px; /* Reduced padding */
	font-family: "Roboto", sans-serif;
	min-width: 250px;
	border-radius: 8px;
	background: white;
}

.info-header {
	display: flex;
	align-items: center;
	gap: 6px; /* Slightly reduced gap */
	margin-bottom: 8px; /* Reduced margin */
}

.info-icon {
	color: var(--icon-color);
	font-size: 18px; /* Slightly smaller icon */
	font-family: "Material Symbols Outlined", sans-serif;
}

.info-name {
	font-weight: 500;
	color: rgba(0, 0, 0, 0.87);
	font-size: 15px; /* Slightly smaller text */
	flex: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.status-chip {
	background-color: var(--chip-bg-color);
	color: var(--chip-text-color);
	padding: 0px 6px; /* Reduced padding */
	border-radius: 4px;
	font-size: 11px; /* Slightly smaller font */
	font-weight: 600;
	height: 18px; /* Reduced height */
	display: flex;
	align-items: center;
	letter-spacing: 0.1px;
}

.info-details {
	display: flex;
	flex-direction: column;
	gap: 3px; /* Reduced gap */
}

.metric-item {
	display: flex;
	align-items: center;
	gap: 3px; /* Reduced gap */
}

.metric-icon {
	color: #1e88e5;
	font-size: 14px; /* Slightly smaller icon */
	font-family: "Material Symbols Outlined", sans-serif;
}

.metric-text {
	color: rgba(0, 0, 0, 0.6);
	font-size: 13px; /* Slightly smaller text */
}

.timestamp {
	margin-top: 2px; /* Reduced margin */
	color: rgba(0, 0, 0, 0.38);
	font-size: 11px; /* Slightly smaller font */
}
</style>
