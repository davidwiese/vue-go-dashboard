<template>
	<div>
		<h1 class="text-2xl mb-4">Vehicle Tracker</h1>
		<v-row>
			<v-col cols="8">
				<!-- Map will go here -->
				<div class="bg-gray-200 h-96">Map Placeholder</div>
			</v-col>
			<v-col cols="4">
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
							<v-btn type="submit" color="primary">Add Vehicle</v-btn>
						</v-form>
					</v-card-text>
				</v-card>

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
						<v-btn type="submit" color="primary">Update Vehicle</v-btn>
						<v-btn @click="editDialog = false" color="secondary">Cancel</v-btn>
					</v-form>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// Vehicle data
const vehicles = ref([]);
const newVehicle = ref({
	name: "",
	status: "Active",
});
const editedVehicle = ref({});
const editDialog = ref(false);

// Fetch vehicles from backend
const fetchVehicles = async () => {
	try {
		const response = await axios.get("http://localhost:8080/vehicles");
		vehicles.value = response.data;
	} catch (error) {
		console.error("Error fetching vehicles:", error);
	}
};

// Add new vehicle
const addVehicle = async () => {
	try {
		const response = await axios.post("http://localhost:8080/vehicles", {
			name: newVehicle.value.name,
			status: newVehicle.value.status,
			latitude: 34.052235, // placeholder
			longitude: -118.243683, // placeholder
		});
		vehicles.value.push(response.data);
		newVehicle.value = { name: "", status: "Active" };
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
			`http://localhost:8080/vehicles/${editedVehicle.value.id}`,
			{
				name: editedVehicle.value.name,
				status: editedVehicle.value.status,
				latitude: editedVehicle.value.latitude || 34.052235,
				longitude: editedVehicle.value.longitude || -118.243683,
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
		await axios.delete(`http://localhost:8080/vehicles/${id}`);
		vehicles.value = vehicles.value.filter((v) => v.id !== id);
	} catch (error) {
		console.error("Error deleting vehicle:", error);
	}
};

onMounted(() => {
	fetchVehicles();
});
</script>
