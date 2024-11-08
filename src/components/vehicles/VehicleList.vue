<script setup lang="ts">
import { ref, computed } from "vue";
import VehicleCard from "./VehicleCard.vue";
import VehiclePreferences from "./VehiclePreferences.vue";
import ReportDialog from "../reports/ReportDialog.vue";
import StatusChip from "../common/StatusChip.vue";

// Interfaces remain the same
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

interface Preference {
	isHidden: boolean;
	sortOrder: number;
	displayName: string;
}

interface Props {
	vehicles: Vehicle[];
	preferences: Record<string, Preference>;
}

const props = defineProps<Props>();
const emit = defineEmits(["preferences-updated", "vehicle-selected"]);
const showPreferences = ref(false);
const showReportDialog = ref(false);
const selectedVehicle = ref<Vehicle | null>(null);

// Computed properties
const displayedVehicles = computed(() => {
	return [...props.vehicles]
		.filter((vehicle) => !props.preferences?.[vehicle.device_id]?.isHidden)
		.sort((a, b) => {
			const aOrder = props.preferences?.[a.device_id]?.sortOrder || 0;
			const bOrder = props.preferences?.[b.device_id]?.sortOrder || 0;
			return aOrder - bOrder;
		});
});

const onlineCount = computed(() => {
	return displayedVehicles.value.filter((v) => v.online).length;
});

// Event handlers
const handleVehicleClick = (vehicle: Vehicle) => {
	emit("vehicle-selected", vehicle.device_id);
};

const handleGenerateReport = (vehicle: Vehicle) => {
	selectedVehicle.value = vehicle;
	showReportDialog.value = true;
};

const handlePreferencesUpdated = () => {
	emit("preferences-updated");
};

const getDisplayName = (vehicle: Vehicle) => {
	return (
		props.preferences?.[vehicle.device_id]?.displayName || vehicle.display_name
	);
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
			<StatusChip
				:label="`${onlineCount}/${displayedVehicles.length} Online`"
				:color="
					onlineCount === displayedVehicles.length ? 'success' : 'warning'
				"
				class="ml-2"
			/>
		</v-card-title>

		<v-card-text>
			<v-list>
				<VehicleCard
					v-for="vehicle in displayedVehicles"
					:key="vehicle.device_id"
					:vehicle="vehicle"
					:display-name="getDisplayName(vehicle)"
					@click="handleVehicleClick"
					@generate-report="handleGenerateReport"
				/>
			</v-list>
		</v-card-text>

		<VehiclePreferences
			v-model:show="showPreferences"
			:vehicles="props.vehicles"
			:preferences="props.preferences"
			@preferences-updated="handlePreferencesUpdated"
		/>

		<ReportDialog
			v-if="selectedVehicle"
			v-model="showReportDialog"
			:vehicle="selectedVehicle"
		/>
	</v-card>
</template>

<style scoped>
.vehicle-list {
	height: 100%;
}
</style>
