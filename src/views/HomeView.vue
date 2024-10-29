<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";

console.log("HomeView script executing");

// Constants
const API_BASE_URL = "http://localhost:5000";

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

// Basic fetch vehicles function
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

// Add vehicle
const addVehicle = async () => {
	console.log("Adding vehicle:", newVehicle.value);
	try {
		const response = await axios.post(
			`${API_BASE_URL}/vehicles`,
			newVehicle.value
		);
		console.log("Vehicle added:", response.data);
		// Reset form
		newVehicle.value = {
			name: "",
			status: "Active",
			latitude: 34.052235,
			longitude: -118.243683,
		};
		// Refresh vehicle list
		await fetchVehicles();
	} catch (error) {
		console.error("Error adding vehicle:", error);
	}
};

onMounted(() => {
	console.log("HomeView mounted");
	fetchVehicles();
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
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
	</div>
</template>
