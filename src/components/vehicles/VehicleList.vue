<script setup>
import { ref, computed } from "vue";
import VehiclePreferences from "./VehiclePreferences.vue";
import axios from "axios";
import { getClientId } from "@/utils/clientId";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
});

const showPreferences = ref(false);
const preferences = ref(new Map());

// Load preferences
const loadPreferences = async () => {
	try {
		const clientId = getClientId();
		const response = await axios.get(
			`http://localhost:5000/preferences?client_id=${clientId}`
		);
		const prefsMap = new Map();
		response.data.forEach((pref) => {
			prefsMap.set(pref.device_id, {
				isHidden: pref.is_hidden,
				sortOrder: pref.sort_order,
				displayName: pref.display_name,
			});
		});
		preferences.value = prefsMap;
	} catch (err) {
		console.error("Error loading preferences:", err);
	}
};

// Apply preferences to vehicles
const displayedVehicles = computed(() => {
	return [...props.vehicles]
		.filter((vehicle) => !preferences.value.get(vehicle.device_id)?.isHidden)
		.sort((a, b) => {
			const aOrder = preferences.value.get(a.device_id)?.sortOrder || 0;
			const bOrder = preferences.value.get(b.device_id)?.sortOrder || 0;
			return aOrder - bOrder;
		});
});

const getDisplayName = (vehicle) => {
	return (
		preferences.value.get(vehicle.device_id)?.displayName ||
		vehicle.display_name
	);
};

const getStatusColor = (vehicle) => {
	if (!vehicle.online) return "error";
	if (vehicle.latest_device_point?.speed > 0) return "success";
	return "warning";
};

const getStatusIcon = (vehicle) => {
	if (!vehicle.online) return "mdi-car-off";
	return "mdi-car-side";
};

const formatSpeed = (vehicle) => {
	return (
		vehicle.latest_device_point?.device_point_detail?.speed?.display || "N/A"
	);
};

const formatLastUpdate = (timestamp) => {
	if (!timestamp) return "N/A";
	return new Date(timestamp).toLocaleString();
};

const getVehicleLocation = (vehicle) => {
	const lat = vehicle.latest_device_point?.lat;
	const lng = vehicle.latest_device_point?.lng;
	if (!lat || !lng) return "Unknown";
	return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Load preferences when component mounts
loadPreferences();
</script>

<template>
	<v-card class="vehicle-list">
		<v-card-title class="d-flex align-center">
			<v-icon class="mr-2">mdi-car-multiple</v-icon>
			Vehicles
			<v-spacer></v-spacer>
			<v-btn
				icon
				variant="text"
				@click="showPreferences = true"
				class="mr-2"
				title="Vehicle Preferences"
			>
				<v-icon>mdi-cog</v-icon>
			</v-btn>
			<v-chip
				:color="
					displayedVehicles.filter((v) => v.online).length ===
					displayedVehicles.length
						? 'success'
						: 'warning'
				"
				class="ml-2"
			>
				{{ displayedVehicles.filter((v) => v.online).length }}/{{
					displayedVehicles.length
				}}
				Online
			</v-chip>
		</v-card-title>

		<v-card-text>
			<v-list>
				<v-list-item
					v-for="vehicle in displayedVehicles"
					:key="vehicle.device_id"
					:class="{ offline: !vehicle.online }"
				>
					<template v-slot:prepend>
						<v-icon :color="getStatusColor(vehicle)">
							{{ getStatusIcon(vehicle) }}
						</v-icon>
					</template>

					<v-list-item-title class="d-flex align-center">
						<span class="font-weight-medium">{{
							getDisplayName(vehicle)
						}}</span>
						<v-chip
							size="x-small"
							:color="vehicle.online ? 'success' : 'error'"
							class="ml-2"
						>
							{{ vehicle.online ? "ONLINE" : "OFFLINE" }}
						</v-chip>
					</v-list-item-title>

					<v-list-item-subtitle>
						<div class="vehicle-details">
							<div class="d-flex align-center">
								<v-icon size="small" class="mr-1">mdi-speedometer</v-icon>
								{{ formatSpeed(vehicle) }}
							</div>
							<div class="d-flex align-center">
								<v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
								{{ getVehicleLocation(vehicle) }}
							</div>
							<div class="text-caption mt-1">
								Last Updated:
								{{ formatLastUpdate(vehicle.latest_device_point?.dt_tracker) }}
							</div>
						</div>
					</v-list-item-subtitle>
				</v-list-item>
			</v-list>
		</v-card-text>

		<VehiclePreferences
			v-model:show="showPreferences"
			:vehicles="vehicles"
			@preferences-updated="loadPreferences"
		/>
	</v-card>
</template>

<style scoped>
.vehicle-list {
	height: 100%;
}

.vehicle-details {
	font-size: 0.875rem;
	line-height: 1.4;
}

.offline {
	opacity: 0.7;
}

.vehicle-details > div {
	margin-bottom: 2px;
}
</style>
