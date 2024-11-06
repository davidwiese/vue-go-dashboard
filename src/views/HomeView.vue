<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import MapView from "@/components/map/MapView.vue";
import VehicleList from "@/components/vehicles/VehicleList.vue";
import { getClientId } from "@/utils/clientId";

// Constants
const API_BASE_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws";

// WebSocket connection
let socket = null;

// State
const vehicles = ref([]);
const preferences = reactive({});

// Load preferences
const loadPreferences = async () => {
	try {
		const clientId = getClientId();
		console.log("Loading preferences for client:", clientId);

		const response = await axios.get(
			`${API_BASE_URL}/preferences?client_id=${clientId}`
		);
		console.log("Raw preference data from server:", response.data);

		// Clear existing preferences
		Object.keys(preferences).forEach((key) => delete preferences[key]);

		// Build preferences object
		response.data.forEach((pref) => {
			preferences[pref.device_id] = pref;
		});

		console.log("Updated preferences:", preferences);
	} catch (error) {
		console.error("Error loading preferences:", error);
	}
};

// Handle preference updates
const handlePreferencesUpdated = () => {
	console.log("Preferences update event received");
	loadPreferences();
};

// WebSocket setup
const initWebSocket = () => {
	socket = new WebSocket(WS_URL);

	socket.onmessage = (event) => {
		const vehicleUpdates = JSON.parse(event.data);
		vehicles.value = vehicleUpdates;
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
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

// Lifecycle hooks
onMounted(() => {
	fetchVehicles();
	initWebSocket();
	loadPreferences();
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

			<v-row>
				<v-col cols="8">
					<MapView :vehicles="vehicles" :preferences="preferences" />
				</v-col>

				<v-col cols="4">
					<VehicleList
						:vehicles="vehicles"
						:preferences="preferences"
						@preferences-updated="handlePreferencesUpdated"
					/>
				</v-col>
			</v-row>
		</v-container>
	</div>
</template>
