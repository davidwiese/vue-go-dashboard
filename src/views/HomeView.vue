<script setup>
import { ref, onMounted } from "vue";

// Vehicle data
const vehicles = ref([]);

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

onMounted(() => {
	fetchVehicles();
});
</script>

<template>
	<div>
		<h1 class="text-2xl mb-4">Vehicle Tracker</h1>
		<v-row>
			<v-col cols="8">
				<!-- Map will go here -->
				<div class="bg-gray-200 h-96">Map Placeholder</div>
			</v-col>
			<v-col cols="4">
				<v-card>
					<v-card-title>Vehicles</v-card-title>
					<v-card-text>
						<!-- Vehicle list will go here -->
						<p>Vehicle list placeholder</p>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
	</div>
</template>
