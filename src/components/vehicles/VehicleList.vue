<script setup lang="ts">
import { ref, computed } from "vue";
import VehiclePreferences from "./VehiclePreferences.vue";

// Interfaces
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
	drive_state: DriveState;
}

interface DriveState {
	status: string; // "off", "idle", "driving"
	status_id: string;
	drive_status_distance: {
		value: number;
		unit: string; // e.g., "m", "km", "miles"
		display: string;
	};
	begin_time: string; // ISO date string
}

interface Preference {
	isHidden: boolean;
	sortOrder: number;
	displayName: string;
	speed_unit: "mph" | "km/h";
	distance_unit: "miles" | "kilometers";
}

// Props
interface Props {
	vehicles: Vehicle[];
	preferences: Record<string, Preference>;
}

const props = defineProps<Props>();
const emit = defineEmits(["preferences-updated"]);
const showPreferences = ref(false);

// Apply preferences to vehicles
const displayedVehicles = computed(() => {
	const filtered = [...props.vehicles]
		.filter((vehicle) => {
			const pref = props.preferences[vehicle.device_id];
			return pref ? !pref.isHidden : true; // Default to visible
		})
		.sort((a, b) => {
			const aOrder = props.preferences?.[a.device_id]?.sortOrder || 0;
			const bOrder = props.preferences?.[b.device_id]?.sortOrder || 0;
			return aOrder - bOrder;
		});
	console.log("Displayed Vehicles:", filtered);
	return filtered;
});

const getDisplayName = (vehicle: Vehicle) => {
	return (
		props.preferences?.[vehicle.device_id]?.displayName || vehicle.display_name
	);
};

const getStatusColor = (vehicle: Vehicle) => {
	if (!vehicle.online) return "error";
	if (vehicle.latest_device_point?.speed > 0) return "success";
	return "warning";
};

const getStatusIcon = (vehicle: Vehicle) => {
	if (!vehicle.online) return "mdi-car-off";
	return "mdi-car-side";
};

// Updated formatSpeed to apply unit conversion with defensive checks
const formatSpeed = (vehicle: Vehicle) => {
	const pref = props.preferences[vehicle.device_id];
	if (!pref || !vehicle.latest_device_point) return "N/A";
	let speed = vehicle.latest_device_point.speed;
	let unit = pref.speed_unit;

	if (unit === "km/h") {
		speed = speed * 1.60934;
	}

	return `${speed.toFixed(1)} ${unit}`;
};

// Implement formatDistance with defensive checks
const formatDistance = (vehicle: Vehicle) => {
	const driveState = vehicle.drive_state;

	if (!driveState || !driveState.drive_status_distance) return "N/A";

	const pref = props.preferences[vehicle.device_id];
	if (!pref) return "N/A";

	let distance = driveState.drive_status_distance.value;
	let unit = driveState.drive_status_distance.unit; // "m", "km", "miles"

	const prefDistanceUnit = pref.distance_unit; // "miles" or "kilometers"

	// Handle unit conversion
	if (unit === "m") {
		if (prefDistanceUnit === "kilometers") {
			distance = distance / 1000; // Convert meters to kilometers
			unit = "kilometers";
		} else if (prefDistanceUnit === "miles") {
			distance = distance / 1609.34; // Convert meters to miles
			unit = "miles";
		}
	} else if (unit === "km" || unit === "kilometers") {
		if (prefDistanceUnit === "miles") {
			distance = distance / 1.60934; // Convert kilometers to miles
			unit = "miles";
		} else {
			unit = "kilometers"; // Ensure consistency
		}
	} else if (unit === "miles") {
		if (prefDistanceUnit === "kilometers") {
			distance = distance * 1.60934; // Convert miles to kilometers
			unit = "kilometers";
		} else {
			unit = "miles"; // Ensure consistency
		}
	}

	// Handle zero distance
	if (distance === 0) {
		return `0 ${prefDistanceUnit}`;
	}

	return `${distance.toFixed(1)} ${prefDistanceUnit}`;
};

const formatLastUpdate = (timestamp: string | undefined) => {
	if (!timestamp) return "N/A";
	return new Date(timestamp).toLocaleString();
};

const getVehicleLocation = (vehicle: Vehicle) => {
	const lat = vehicle.latest_device_point?.lat;
	const lng = vehicle.latest_device_point?.lng;
	if (lat == null || lng == null) return "Unknown";
	return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Handle preference updates from VehiclePreferences
const handlePreferencesUpdated = () => {
	emit("preferences-updated");
};
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
								<v-icon size="small" class="mr-1">mdi-road</v-icon>
								{{ formatDistance(vehicle) }}
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
			:vehicles="props.vehicles"
			:preferences="props.preferences"
			@preferences-updated="handlePreferencesUpdated"
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
