<!-- HomeView.vue is the main dashboard component -->
<!-- It manages vehicle data, WebSocket connections, and user preferences -->

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import MapView from "@/components/map/MapView.vue";
import VehicleList from "@/components/vehicles/VehicleList.vue";
import { getClientId } from "@/utils/clientId";
import { getPreferences } from "@/api/apiService";

// Interfaces
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

// Constants
const getBaseUrl = () => {
	return import.meta.env.PROD
		? "https://trackifyfleet.pro/api"
		: "http://localhost:5000";
};

const getWebSocketUrl = () => {
	const baseUrl = import.meta.env.PROD
		? "wss://trackifyfleet.pro"
		: "ws://localhost:5000";
	return `${baseUrl}/ws`;
};

const API_BASE_URL = getBaseUrl();
const WS_URL = getWebSocketUrl();

// WebSocket connection
let socket: WebSocket | null = null;

// Reactive state
// ref() is similar to React's useState for primitive values
// reactive() is similar to React's useState for objects
const vehicles = ref<Vehicle[]>([]);
const preferences = reactive<Record<string, Preference>>({});
const selectedVehicleId = ref<string | undefined>(undefined);

// Load preferences from server
const loadPreferences = async () => {
	try {
		const clientId = getClientId();

		const prefs = await getPreferences(clientId);

		// Clear existing preferences
		Object.keys(preferences).forEach((key) => delete preferences[key]);

		// Initialize default preferences for all vehicles first
		vehicles.value.forEach((vehicle) => {
			preferences[vehicle.device_id] = {
				isHidden: false,
				sortOrder: 0,
				displayName: vehicle.display_name,
			};
		});

		// Override with server preferences
		prefs.forEach((pref: any) => {
			preferences[pref.device_id] = {
				isHidden: pref.is_hidden,
				sortOrder: pref.sort_order,
				displayName:
					pref.display_name || preferences[pref.device_id]?.displayName,
			};
		});
	} catch (error) {
		console.error("Error loading preferences:", error);
	}
};

// Event handlers - similar to React's callback props
const handlePreferencesUpdated = async () => {
	await loadPreferences();
};

// WebSocket setup - similar to React's useEffect cleanup pattern
const initWebSocket = () => {
	const clientId = getClientId();
	socket = new WebSocket(`${WS_URL}?client_id=${clientId}`);

	socket.onmessage = (event) => {
		// Update reactive state - similar to React's setState
		const vehicleUpdates = JSON.parse(event.data) as Vehicle[];
		vehicles.value = vehicleUpdates;
	};

	// WebSocket event handlers
	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	socket.onclose = () => {
		console.log("WebSocket connection closed");
		// Attempt to reconnect after delay
		setTimeout(() => {
			if (socket?.readyState === WebSocket.CLOSED) {
				console.log("Attempting to reconnect WebSocket...");
				initWebSocket();
			}
		}, 5000);
	};

	socket.onopen = () => {
		console.log("WebSocket connected");
	};
};

// Fetch vehicles from backend
const fetchVehicles = async () => {
	try {
		const response = await axios.get(`${API_BASE_URL}/vehicles`);
		vehicles.value = response.data;
	} catch (error) {
		console.error("Error fetching vehicles:", error);
	}
};

// Template refs - similar to React's useRef for DOM elements
const mapView = ref<InstanceType<typeof MapView> | null>(null);

// Event handlers for child components
const handleVehicleSelected = (deviceId: string) => {
	selectedVehicleId.value = deviceId;

	// Check screen width to determine if scrolling is needed
	if (window.innerWidth < 960) {
		// Adjust breakpoint as needed
		scrollToMap();
	}
};

const scrollToMap = () => {
	if (mapView.value) {
		// Access the DOM element of the map container
		const mapElement = mapView.value.$el as HTMLElement;
		mapElement.scrollIntoView({ behavior: "smooth" });
	}
};

// Lifecycle hooks similar to React's useEffect
onMounted(async () => {
	await fetchVehicles();
	initWebSocket();
	await loadPreferences();
});

// Cleanup
onBeforeUnmount(() => {
	if (socket) {
		socket.close();
	}
});
</script>

<template>
	<div class="home-view">
		<v-container fluid>
			<v-row class="flex-column flex-md-row">
				<v-col cols="12" md="8" order="2" order-md="1">
					<MapView
						ref="mapView"
						:vehicles="vehicles"
						:preferences="preferences"
						:selected-vehicle-id="selectedVehicleId"
						class="map-container"
					/>
				</v-col>

				<v-col cols="12" md="4" order="1" order-md="2">
					<VehicleList
						:vehicles="vehicles"
						:preferences="preferences"
						@preferences-updated="handlePreferencesUpdated"
						@vehicle-selected="handleVehicleSelected"
						class="vehicle-list-container"
					/>
				</v-col>
			</v-row>
		</v-container>
	</div>
</template>

<style scoped>
.home-view {
	height: 100%;
}

.map-container {
	height: 395px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	margin-bottom: 16px;
}

@media (min-width: 960px) {
	.map-container {
		height: calc(100vh - 130px);
	}

	.vehicle-list-container {
		max-height: calc(100vh - 130px);
		overflow-y: auto;
		padding-right: 8px;
	}
}
</style>
