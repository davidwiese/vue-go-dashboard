<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import MapView from "@/components/map/MapView.vue";
import VehicleList from "@/components/vehicles/VehicleList.vue";

// Constants
const API_BASE_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws";

// WebSocket connection
let socket = null;

// State
const vehicles = ref([]);

// WebSocket setup
const initWebSocket = () => {
	console.log("Initializing WebSocket connection");
	socket = new WebSocket(WS_URL);

	socket.onopen = () => {
		console.log("WebSocket connection established");
	};

	socket.onmessage = (event) => {
		console.log("WebSocket message received");
		const vehicleUpdates = JSON.parse(event.data);
		vehicles.value = vehicleUpdates;
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	socket.onclose = () => {
		console.log("WebSocket connection closed");
	};
};

// Fetch vehicles from backend
const fetchVehicles = async () => {
	try {
		const response = await axios.get(`${API_BASE_URL}/vehicles`);
		console.log("Fetched vehicles:", response.data);
		vehicles.value = response.data;
	} catch (error) {
		console.error("Error fetching vehicles:", error);
	}
};

// Lifecycle hooks
onMounted(() => {
	fetchVehicles();
	initWebSocket();
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
					<MapView :vehicles="vehicles" />
				</v-col>

				<v-col cols="4">
					<VehicleList :vehicles="vehicles" />
				</v-col>
			</v-row>
		</v-container>
	</div>
</template>
