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
const API_BASE_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws";

// WebSocket connection
let socket: WebSocket | null = null;

// State
const vehicles = ref<Vehicle[]>([]);
const preferences = reactive<Record<string, Preference>>({});
const selectedVehicleId = ref<string | undefined>(undefined);

// Load preferences from server
const loadPreferences = async () => {
	try {
		const clientId = getClientId();
		console.log("Loading preferences for client:", clientId);

		const prefs = await getPreferences(clientId);
		console.log("Raw preference data from server:", prefs);

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

		console.log("Updated preferences:", preferences);
	} catch (error) {
		console.error("Error loading preferences:", error);
	}
};

// Handle preference updates
const handlePreferencesUpdated = async () => {
	console.log("Preferences update event received");
	await loadPreferences();
};

// WebSocket setup
const initWebSocket = () => {
	const clientId = getClientId();
	socket = new WebSocket(`${WS_URL}?client_id=${clientId}`);

	socket.onmessage = (event) => {
		const vehicleUpdates = JSON.parse(event.data) as Vehicle[];
		vehicles.value = vehicleUpdates;
	};

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

const handleVehicleSelected = (deviceId: string) => {
	selectedVehicleId.value = deviceId;
};

// Lifecycle hooks
onMounted(async () => {
	await fetchVehicles();
	initWebSocket();
	await loadPreferences();
});

onBeforeUnmount(() => {
	if (socket) {
		socket.close();
	}
});
</script>

<template>
	<div class="home-view">
		<v-container fluid>
			<v-row>
				<v-col cols="12">
					<h1 class="text-h4 mb-4">Vehicle Tracker</h1>
				</v-col>
			</v-row>

			<v-row class="flex-column flex-md-row">
				<!-- Map takes full width on mobile, 2/3 on larger screens -->
				<v-col cols="12" md="8" order="2" order-md="1">
					<MapView
						:vehicles="vehicles"
						:preferences="preferences"
						:selected-vehicle-id="selectedVehicleId"
						class="map-container"
					/>
				</v-col>

				<!-- Vehicle list takes full width on mobile, 1/3 on larger screens -->
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
	overflow: hidden;
}

/* Adjust map height based on screen size */
.map-container {
	height: 50vh;
}

@media (min-width: 960px) {
	.map-container {
		height: calc(100vh - 180px);
		position: sticky;
		top: 64px;
	}

	.vehicle-list-container {
		max-height: calc(100vh - 180px);
		overflow-y: auto;
	}
}

/* Add some breathing room on mobile */
@media (max-width: 959px) {
	.v-container {
		padding-bottom: 76px;
	}
}
</style>
