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

// Vehicle data
const vehicles = ref([]);
const newVehicle = ref({ name: "", status: "Active" });
const editedVehicle = ref({});
const editDialog = ref(false);

// Fetch vehicles (to be implemented)
const fetchVehicles = async () => {
	// Placeholder for API call
	vehicles.value = [
		{
			id: 1,
			name: "Truck 1",
			status: "Active",
			latitude: 34.052235,
			longitude: -118.243683,
		},
		{
			id: 2,
			name: "Van 2",
			status: "Inactive",
			latitude: 34.052235,
			longitude: -118.243683,
		},
	];
};

// Add new vehicle
const addVehicle = async () => {
	// Placeholder for API call
	const newId = vehicles.value.length + 1;
	vehicles.value.push({
		id: newId,
		...newVehicle.value,
		latitude: 34.052235, // placeholder
		longitude: -118.243683, // placeholder
	});
	newVehicle.value = { name: "", status: "Active" };
};

// Edit vehicle
const editVehicle = (vehicle) => {
	editedVehicle.value = { ...vehicle };
	editDialog.value = true;
};

// Update vehicle
const updateVehicle = async () => {
	// Placeholder for API call
	const index = vehicles.value.findIndex(
		(v) => v.id === editedVehicle.value.id
	);
	if (index !== -1) {
		vehicles.value[index] = { ...editedVehicle.value };
	}
	editDialog.value = false;
};

// Delete vehicle
const deleteVehicle = async (id) => {
	// Placeholder for API call
	vehicles.value = vehicles.value.filter((v) => v.id !== id);
};

onMounted(() => {
	fetchVehicles();
});
</script>
