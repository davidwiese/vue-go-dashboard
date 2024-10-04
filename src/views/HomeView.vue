<template>
	<div>
		<h1 class="text-2xl mb-4">Vehicle Tracker</h1>
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
						<!-- v-for is equivalent to .map() in React -->
						<!-- :key is used for list rendering optimization in Vue -->
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
				<v-card class="mb-4">
					<!-- Add Vehicle -->
					<v-card-title>Add New Vehicle</v-card-title>
					<v-card-text>
						<v-form @submit.prevent="addVehicle">
							<!-- v-model is used for two-way data binding (combines value and onChange in React) -->
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
							<v-btn type="submit" color="primary">Add Vehicle</v-btn>
						</v-form>
					</v-card-text>
				</v-card>

				<!-- Vehicles section -->
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
									<!-- @click is equivalent to onClick in React -->
									<v-btn
										icon="mdi-pencil"
										size="small"
										@click="editVehicle(vehicle)"
									></v-btn>
									<v-btn
										icon="mdi-delete"
										size="small"
										@click="deleteVehicle(vehicle.id)"
									></v-btn>
								</template>
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<!-- Edit Vehicle Dialog -->
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
						<v-btn type="submit" color="primary">Update Vehicle</v-btn>
						<v-btn @click="editDialog = false" color="secondary">Cancel</v-btn>
					</v-form>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
// ref creates reactive variables = similar useState in React
// onMounted is equivalent to useEffect with empty dependency array in React
// onBeforeUnmount is similar to useEffect cleanup in React
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";

const API_BASE_URL =
	"http://gobackend-env.eba-cpaytf92.us-west-1.elasticbeanstalk.com";

// Map data
const zoom = ref(13);
const center = ref([34.052235, -118.243683]);

// Vehicle data
const vehicles = ref([]);
const newVehicle = ref({
	name: "",
	status: "Active",
	latitude: 34.052235, // Default latitude
	longitude: -118.243683, // Default longitude
});
const editedVehicle = ref({});
const editDialog = ref(false);

// WebSocket setup
let socket;

const initWebSocket = () => {
	const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
	socket = new WebSocket(`${wsProtocol}://${window.location.hostname}/ws`);

	socket.onopen = () => {
		console.log("WebSocket connection established");
	};

	socket.onmessage = (event) => {
		const vehicleUpdate = JSON.parse(event.data);

		if (vehicleUpdate.action === "delete") {
			// Handle vehicle deletion
			vehicles.value = vehicles.value.filter((v) => v.id !== vehicleUpdate.id);
		} else {
			// Handle vehicle addition or update
			const index = vehicles.value.findIndex((v) => v.id === vehicleUpdate.id);
			if (index !== -1) {
				// Update existing vehicle
				vehicles.value[index] = vehicleUpdate;
			} else {
				// Add new vehicle
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

onMounted(() => {
	fetchVehicles();
	initWebSocket();
});

onBeforeUnmount(() => {
	if (socket) {
		socket.close();
	}
});

// Fetch vehicles from backend
const fetchVehicles = async () => {
	try {
		const response = await axios.get(`${API_BASE_URL}/vehicles`);
		vehicles.value = response.data;
	} catch (error) {
		console.error("Error fetching vehicles:", error);
	}
};

// Add new vehicle
const addVehicle = async () => {
	try {
		const response = await axios.post(`${API_BASE_URL}/vehicles`, {
			name: newVehicle.value.name,
			status: newVehicle.value.status,
			latitude: newVehicle.value.latitude,
			longitude: newVehicle.value.longitude,
		});
		newVehicle.value = {
			name: "",
			status: "Active",
			latitude: 34.052235,
			longitude: -118.243683,
		};
	} catch (error) {
		console.error("Error adding vehicle:", error);
	}
};

// Edit vehicle -- opens dialogue to edit vehicle
const editVehicle = (vehicle) => {
	editedVehicle.value = { ...vehicle };
	editDialog.value = true;
};

// Update vehicle
const updateVehicle = async () => {
	try {
		const response = await axios.put(
			`${API_BASE_URL}/vehicles/${editedVehicle.value.id}`,
			{
				name: editedVehicle.value.name,
				status: editedVehicle.value.status,
				latitude: editedVehicle.value.latitude,
				longitude: editedVehicle.value.longitude,
			}
		);
		const index = vehicles.value.findIndex(
			(v) => v.id === editedVehicle.value.id
		);
		if (index !== -1) {
			vehicles.value[index] = response.data;
		}
		editDialog.value = false;
	} catch (error) {
		console.error("Error updating vehicle:", error);
	}
};

// Delete vehicle
const deleteVehicle = async (id) => {
	try {
		await axios.delete(`${API_BASE_URL}/vehicles/${id}`);
		vehicles.value = vehicles.value.filter((v) => v.id !== id);
	} catch (error) {
		console.error("Error deleting vehicle:", error);
	}
};

onMounted(() => {
	fetchVehicles();
});
</script>
