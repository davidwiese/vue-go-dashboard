<script setup>
const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
});

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
</script>

<template>
	<v-card class="vehicle-list">
		<v-card-title class="d-flex align-center">
			<v-icon class="mr-2">mdi-car-multiple</v-icon>
			Vehicles
			<v-spacer></v-spacer>
			<v-chip
				:color="
					vehicles.filter((v) => v.online).length === vehicles.length
						? 'success'
						: 'warning'
				"
				class="ml-2"
			>
				{{ vehicles.filter((v) => v.online).length }}/{{ vehicles.length }}
				Online
			</v-chip>
		</v-card-title>

		<v-card-text>
			<v-list>
				<v-list-item
					v-for="vehicle in vehicles"
					:key="vehicle.device_id"
					:class="{ offline: !vehicle.online }"
				>
					<template v-slot:prepend>
						<v-icon :color="getStatusColor(vehicle)">
							{{ getStatusIcon(vehicle) }}
						</v-icon>
					</template>

					<v-list-item-title class="d-flex align-center">
						<span class="font-weight-medium">{{ vehicle.display_name }}</span>
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
