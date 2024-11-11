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

const formatLocation = () => {
	const lat = props.vehicle.latest_device_point?.lat;
	const lng = props.vehicle.latest_device_point?.lng;
	if (!lat || !lng) return "Unknown";

	// At smaller widths, we'll show shorter decimals
	if (window.innerWidth < 1200) {
		return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
	}
	return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};
</script>

<template>
	<v-card :class="['vehicle-card', { offline: !vehicle.online }]" elevation="2">
		<!-- Main card content (clickable) -->
		<div class="card-content" @click="emit('click', vehicle)">
			<div class="header">
				<div class="title-section">
					<v-icon
						:color="
							vehicle.online
								? vehicle.latest_device_point?.speed > 0
									? 'success'
									: 'warning'
								: 'error'
						"
						size="small"
						class="vehicle-icon"
					>
						{{ vehicle.online ? "mdi-car-side" : "mdi-car-off" }}
					</v-icon>
					<span class="vehicle-name">{{ displayName }}</span>
					<StatusChip
						:label="vehicle.online ? 'ONLINE' : 'OFFLINE'"
						:color="vehicle.online ? 'success' : 'error'"
						size="x-small"
						class="status-chip"
					/>
				</div>
			</div>

			<div class="details">
				<div class="metrics">
					<div class="metric-item">
						<v-icon size="x-small" color="primary">mdi-speedometer</v-icon>
						<span class="detail-text">{{ formatSpeed() }} km/h</span>
					</div>
					<div class="metric-item">
						<v-icon size="x-small" color="primary">mdi-map-marker</v-icon>
						<span class="detail-text">{{ formatLocation() }}</span>
					</div>
				</div>
				<div class="timestamp">
					Updated:
					{{ formatLastUpdate(vehicle.latest_device_point?.dt_tracker) }}
				</div>
			</div>
		</div>

		<!-- Footer with report button -->
		<v-divider></v-divider>
		<div class="card-footer" @click.stop>
			<v-btn
				variant="tonal"
				color="primary"
				size="small"
				class="report-btn"
				@click="emit('generateReport', vehicle)"
				:ripple="false"
			>
				<v-icon size="small" class="mr-1">mdi-file-chart</v-icon>
				Generate Report
			</v-btn>
		</div>
	</v-card>
</template>

<style scoped>
.vehicle-card {
	margin: 8px 2px;
	transition: all 0.2s ease;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 0 2px rgba(0, 0, 0, 0.04);
}

.vehicle-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 0 4px rgba(0, 0, 0, 0.06);
}

.card-content {
	padding: 12px 16px;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.card-content:hover {
	background-color: rgba(0, 0, 0, 0.03);
}

.offline {
	opacity: 0.7;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.title-section {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
	min-width: 0;
}

.vehicle-name {
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	color: rgba(0, 0, 0, 0.87);
}

.details {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.metrics {
	display: flex;
	flex-direction: column;
	gap: 2px !important;
	margin: 0;
}

.metric-item {
	display: flex;
	align-items: center;
	gap: 4px;
	white-space: nowrap;
	line-height: 1.2;
	min-height: 20px;
}

.detail-text {
	font-size: 0.875rem;
	color: rgba(0, 0, 0, 0.6);
}

.timestamp {
	font-size: 0.7rem;
	color: rgba(0, 0, 0, 0.38);
	white-space: nowrap;
	padding-right: 16px;
	margin-top: 4px;
}

.card-footer {
	display: flex;
	justify-content: center;
	padding: 8px 16px;
}

.report-btn {
	font-weight: 500;
	letter-spacing: 0.5px;
	text-transform: none;
}

.report-btn:hover {
	background-color: rgba(var(--v-theme-primary), 0.15);
}

/* Ensure consistent spacing at all breakpoints */
@media (max-width: 1200px) {
	.metrics {
		gap: 2px !important;
	}

	.metric-item {
		min-height: 20px;
	}
}
</style>
