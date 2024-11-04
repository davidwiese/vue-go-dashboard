<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import MapView from "@/components/map/MapView.vue";
import VehicleList from "@/components/vehicles/VehicleList.vue";
import EditVehicleDialog from "@/components/dialogs/EditVehicleDialog.vue";

// Constants
const API_BASE_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws";

// WebSocket connection
let socket = null;

// State
const vehicles = ref([]);
const editDialog = ref(false);
const editedVehicle = ref(null);

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
		vehicles.value = response.data;
	} catch (error) {
		console.error("Error fetching vehicles:", error);
	}
};

// Edit handlers
const handleEdit = (vehicle) => {
	editedVehicle.value = vehicle;
	editDialog.value = true;
};

const handleUpdate = async (updatedVehicle) => {
	try {
		await axios.put(
			`${API_BASE_URL}/vehicles/${updatedVehicle.device_id}`,
			updatedVehicle
		);
		// Refresh vehicles after update
		await fetchVehicles();
	} catch (error) {
		console.error("Error updating vehicle:", error);
	}
};

const handleDelete = async (id) => {
	try {
		await axios.delete(`${API_BASE_URL}/vehicles/${id}`);
		// Refresh vehicles after delete
		await fetchVehicles();
	} catch (error) {
		console.error("Error deleting vehicle:", error);
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
					<VehicleList
						:vehicles="vehicles"
						@edit="handleEdit"
						@delete="handleDelete"
					/>
				</v-col>
			</v-row>

			<EditVehicleDialog
				:show="editDialog"
				:vehicle="editedVehicle || {}"
				@update:show="editDialog = $event"
				@save="handleUpdate"
			/>
		</v-container>
	</div>
</template>
