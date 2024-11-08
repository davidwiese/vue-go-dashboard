<script setup lang="ts">
import StatusChip from "@/components/common/StatusChip.vue";

interface Vehicle {
	device_id: string;
	display_name: string;
	online: boolean;
	latest_device_point?: {
		speed: number;
		lat: number;
		lng: number;
		dt_tracker: string;
	};
}

interface Props {
	vehicle: Vehicle;
	displayName: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["click", "generateReport"]);

const formatSpeed = () => {
	return (
		props.vehicle.latest_device_point?.speed?.toFixed(1).toString() || "N/A"
	);
};

const getVehicleLocation = () => {
	const lat = props.vehicle.latest_device_point?.lat;
	const lng = props.vehicle.latest_device_point?.lng;
	if (!lat || !lng) return "Unknown";
	return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

const formatLastUpdate = (timestamp?: string) => {
	if (!timestamp) return "N/A";
	return new Date(timestamp).toLocaleString();
};
</script>

<template>
	<v-list-item :class="{ offline: !vehicle.online }">
		<template v-slot:prepend>
			<v-icon
				:color="
					vehicle.online
						? vehicle.latest_device_point?.speed > 0
							? 'success'
							: 'warning'
						: 'error'
				"
				@click="emit('click', vehicle)"
				style="cursor: pointer"
			>
				{{ vehicle.online ? "mdi-car-side" : "mdi-car-off" }}
			</v-icon>
		</template>

		<v-list-item-title
			class="d-flex align-center"
			@click="emit('click', vehicle)"
			style="cursor: pointer"
		>
			<span class="font-weight-medium">{{ displayName }}</span>
			<StatusChip
				:label="vehicle.online ? 'ONLINE' : 'OFFLINE'"
				:color="vehicle.online ? 'success' : 'error'"
				size="x-small"
				class="ml-2"
			/>
		</v-list-item-title>

		<v-list-item-subtitle>
			<div class="vehicle-details">
				<div class="d-flex align-center">
					<v-icon size="small" class="mr-1">mdi-speedometer</v-icon>
					{{ formatSpeed() }} km/h
				</div>
				<div class="d-flex align-center">
					<v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
					{{ getVehicleLocation() }}
				</div>
				<div class="text-caption mt-1">
					Last Updated:
					{{ formatLastUpdate(vehicle.latest_device_point?.dt_tracker) }}
				</div>
			</div>
		</v-list-item-subtitle>

		<template v-slot:append>
			<v-btn
				icon
				color="primary"
				variant="text"
				@click="emit('generateReport', vehicle)"
				title="Generate Report"
			>
				<v-icon>mdi-file-chart</v-icon>
			</v-btn>
		</template>
	</v-list-item>
</template>

<style scoped>
.offline {
	opacity: 0.7;
}

.vehicle-details {
	font-size: 0.875rem;
	line-height: 1.4;
}

.vehicle-details > div {
	margin-bottom: 2px;
}
</style>
