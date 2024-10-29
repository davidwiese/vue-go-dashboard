<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";

console.log("HomeView script executing");

// Constants
const API_BASE_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws";

// WebSocket connection
let socket = null;

// Map data
const zoom = ref(13);
const center = ref([34.052235, -118.243683]);

// Vehicle data
const vehicles = ref([]);
const newVehicle = ref({
	name: "",
	status: "Active",
	latitude: 34.052235,
	longitude: -118.243683,
});

// Edit dialog state
const editDialog = ref(false);
const editedVehicle = ref({
	id: null,
	name: "",
	status: "",
	latitude: 0,
	longitude: 0,
});

// Functions
// WebSocket setup
const initWebSocket = () => {
	console.log("Initializing WebSocket connection");
	socket = new WebSocket(WS_URL);

	socket.onopen = () => {
		console.log("WebSocket connection established");
	};

	socket.onmessage = (event) => {
		console.log("WebSocket message received:", event.data);
		const vehicleUpdate = JSON.parse(event.data);

		if (vehicleUpdate.action === "delete") {
			console.log("Handling delete action for vehicle:", vehicleUpdate.id);
			vehicles.value = vehicles.value.filter((v) => v.id !== vehicleUpdate.id);
		} else {
			const index = vehicles.value.findIndex((v) => v.id === vehicleUpdate.id);
			if (index !== -1) {
				console.log("Updating existing vehicle:", vehicleUpdate);
				vehicles.value[index] = vehicleUpdate;
			} else {
				console.log("Adding new vehicle:", vehicleUpdate);
				vehicles.value.push(vehicleUpdate);
			}
		}
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
	console.log("Fetching vehicles from:", `${API_BASE_URL}/vehicles`);
	try {
		const response = await axios.get(`${API_BASE_URL}/vehicles`);
		console.log("Vehicles received:", response.data);
		vehicles.value = response.data;
	} catch (error) {
		console.error("Error fetching vehicles:", error.message);
	}
};

// Add new vehicle
const addVehicle = async () => {
	console.log("Adding vehicle:", newVehicle.value);
	try {
		await axios.post(`${API_BASE_URL}/vehicles`, newVehicle.value);
		newVehicle.value = {
			name: "",
			status: "Active",
			latitude: 37.7749,
			longitude: -122.4194,
		};
	} catch (error) {
		console.error("Error adding vehicle:", error);
	}
};

// Edit vehicle dialogue
const editVehicle = (vehicle) => {
	editedVehicle.value = { ...vehicle };
	editDialog.value = true;
};

// Edit vehicle
const updateVehicle = async () => {
	console.log("Updating vehicle:", editedVehicle.value);
	try {
		await axios.put(
			`${API_BASE_URL}/vehicles/${editedVehicle.value.id}`,
			editedVehicle.value
		);
		editDialog.value = false;
	} catch (error) {
		console.error("Error updating vehicle:", error);
	}
};

// Delete vehicle from backend
const deleteVehicle = async (id) => {
	console.log("Deleting vehicle:", id);
	try {
		await axios.delete(`${API_BASE_URL}/vehicles/${id}`);
	} catch (error) {
		console.error("Error deleting vehicle:", error);
	}
};

// Lifecycle hooks
onMounted(() => {
	console.log("HomeView mounted");
	fetchVehicles();
	initWebSocket();
});

onBeforeUnmount(() => {
	console.log("Cleaning up WebSocket connection");
	if (socket) {
		socket.close();
	}
});
</script>

<template>
	<div class="home-view">
		<h1 class="text-2xl mb-4">Vehicle Tracker</h1>

		<!-- Debug info -->
		<div
			class="debug-info"
			style="background: #f0f0f0; padding: 10px; margin-bottom: 10px"
		>
			Vehicles loaded: {{ vehicles.length }}
		</div>

		<v-row>
			<v-col cols="8">
				<!-- Map -->
				<div style="height: 500px; width: 100%">
					<l-map ref="map" v-model:zoom="zoom" :center="center">
						<l-tile-layer
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							layer-type="base"
							name="OpenStreetMap"
						></l-tile-layer>
						<l-marker
							v-for="vehicle in vehicles"
							:key="`${vehicle.id}-${vehicle.latitude}-${vehicle.longitude}`"
							:lat-lng="[vehicle.latitude, vehicle.longitude]"
						>
							<l-popup>
								<div>
									<strong>{{ vehicle.name }}</strong
									><br />
									Status: {{ vehicle.status }}
								</div>
							</l-popup>
						</l-marker>
					</l-map>
				</div>
			</v-col>

			<v-col cols="4">
				<!-- Add Vehicle Form -->
				<v-card class="mb-4">
					<v-card-title>Add New Vehicle</v-card-title>
					<v-card-text>
						<v-form @submit.prevent="addVehicle">
							<v-text-field
								v-model="newVehicle.name"
								label="Vehicle Name"
								required
							></v-text-field>

							<v-select
								v-model="newVehicle.status"
								:items="['Active', 'Inactive']"
								label="Status"
								required
							></v-select>

							<v-text-field
								v-model.number="newVehicle.latitude"
								label="Latitude"
								required
							></v-text-field>

							<v-text-field
								v-model.number="newVehicle.longitude"
								label="Longitude"
								required
							></v-text-field>

							<v-btn type="submit" color="primary" block class="mt-4">
								Add Vehicle
							</v-btn>
						</v-form>
					</v-card-text>
				</v-card>

				<!-- Vehicle List -->
				<v-card>
					<v-card-title>Vehicles</v-card-title>
					<v-card-text>
						<v-list>
							<v-list-item v-for="vehicle in vehicles" :key="vehicle.id">
								<template v-slot:prepend>
									<v-icon
										:color="vehicle.status === 'Active' ? 'green' : 'red'"
									>
										{{
											vehicle.status === "Active" ? "mdi-car" : "mdi-car-off"
										}}
									</v-icon>
								</template>

								<v-list-item-title>{{ vehicle.name }}</v-list-item-title>
								<v-list-item-subtitle
									>Status: {{ vehicle.status }}</v-list-item-subtitle
								>
								<template v-slot:append>
									<v-btn
										icon="mdi-pencil"
										size="small"
										class="mr-2"
										@click="editVehicle(vehicle)"
									></v-btn>
									<v-btn
										icon="mdi-delete"
										size="small"
										color="error"
										@click="deleteVehicle(vehicle.id)"
									></v-btn>
								</template>
							</v-list-item>
							<v-dialog v-model="editDialog" max-width="500px">
								<v-card>
									<v-card-title>Edit Vehicle</v-card-title>
									<v-card-text>
										<v-form @submit.prevent="updateVehicle">
											<v-text-field
												v-model="editedVehicle.name"
												label="Vehicle Name"
												required
											></v-text-field>

											<v-select
												v-model="editedVehicle.status"
												:items="['Active', 'Inactive']"
												label="Status"
												required
											></v-select>

											<v-text-field
												v-model.number="editedVehicle.latitude"
												label="Latitude"
												required
											></v-text-field>

											<v-text-field
												v-model.number="editedVehicle.longitude"
												label="Longitude"
												required
											></v-text-field>

											<v-card-actions>
												<v-spacer></v-spacer>
												<v-btn color="primary" type="submit">Update</v-btn>
												<v-btn color="error" @click="editDialog = false"
													>Cancel</v-btn
												>
											</v-card-actions>
										</v-form>
									</v-card-text>
								</v-card>
							</v-dialog>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
	</div>
</template>
