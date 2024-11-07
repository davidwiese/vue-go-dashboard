<script setup lang="ts">
import { ref, computed } from "vue";
import VehiclePreferences from "./VehiclePreferences.vue";
import { format } from "date-fns";

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
}

interface Preference {
	isHidden: boolean;
	sortOrder: number;
	displayName: string;
}

interface ReportTimeframe {
	label: string;
	value: string;
	from: Date;
	to: Date;
}

// Props
interface Props {
	vehicles: Vehicle[];
	preferences: Record<string, Preference>;
}

const props = defineProps<Props>();
const emit = defineEmits(["preferences-updated", "vehicle-selected"]);
const showPreferences = ref(false);
const showReportDialog = ref(false);
const selectedVehicle = ref<Vehicle | null>(null);
const selectedTimeframe = ref<string>("24h");
const isGeneratingReport = ref(false);

const timeframes = computed<ReportTimeframe[]>(() => {
	const now = new Date();
	return [
		{
			label: "Last 24 Hours",
			value: "24h",
			from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
			to: now,
		},
		{
			label: "Last 7 Days",
			value: "7d",
			from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
			to: now,
		},
		{
			label: "Last 30 Days",
			value: "30d",
			from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
			to: now,
		},
	];
});

const openReportDialog = (vehicle: Vehicle) => {
	selectedVehicle.value = vehicle;
	showReportDialog.value = true;
};

const pollReportStatus = async (reportId: string) => {
	try {
		const response = await fetch(`/api/report/status/${reportId}`);
		if (!response.ok) {
			throw new Error("Failed to get report status");
		}

		const status = await response.json();
		return status;
	} catch (error) {
		console.error("Error polling report status:", error);
		throw error;
	}
};

const downloadReport = async (reportId: string) => {
	try {
		const response = await fetch(`/api/report/download/${reportId}`);
		if (!response.ok) {
			throw new Error("Failed to download report");
		}

		// Get the blob from the response
		const blob = await response.blob();

		// Create a URL for the blob
		const url = window.URL.createObjectURL(blob);

		// Create a temporary link and click it to download
		const a = document.createElement("a");
		a.href = url;
		a.download = `report_${reportId}.pdf`;
		document.body.appendChild(a);
		a.click();

		// Clean up
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	} catch (error) {
		console.error("Error downloading report:", error);
		throw error;
	}
};

const generateReport = async () => {
	if (!selectedVehicle.value) return;

	try {
		isGeneratingReport.value = true;

		const timeframe = timeframes.value.find(
			(t) => t.value === selectedTimeframe.value
		);
		if (!timeframe) return;

		// Update URL to match backend route
		const response = await fetch("/api/report/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				report_spec: {
					user_report_name: `${selectedVehicle.value.display_name} Activity Report`,
					report_type: "drives_and_stops",
					device_id_list: [selectedVehicle.value.device_id],
					datetime_from: format(timeframe.from, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
					datetime_to: format(timeframe.to, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
					report_output_field_list: [
						"device_name",
						"drive_start_time",
						"drive_end_time",
						"drive_duration",
						"drive_distance",
						"max_speed",
						"avg_speed",
						"start_location",
						"end_location",
					],
					report_options: {
						date_time_format: "standard",
						display_decimal_places: 1,
						duration_format: "standard",
						use_pdf_landscape: true,
					},
				},
			}),
		});

		console.log("Report generation response:", response); // Add this for debugging

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Error response:", errorText); // Add this for debugging
			throw new Error(`Failed to generate report: ${errorText}`);
		}

		const data = await response.json();
		console.log("Report data:", data); // Add this for debugging

		const reportId = data.report_generated_id;

		showReportDialog.value = false;
	} catch (error) {
		console.error("Error generating report:", error);
	} finally {
		isGeneratingReport.value = false;
	}
};

// Apply preferences to vehicles
const displayedVehicles = computed(() => {
	return [...props.vehicles]
		.filter((vehicle) => !props.preferences?.[vehicle.device_id]?.isHidden)
		.sort((a, b) => {
			const aOrder = props.preferences?.[a.device_id]?.sortOrder || 0;
			const bOrder = props.preferences?.[b.device_id]?.sortOrder || 0;
			return aOrder - bOrder;
		});
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

const formatSpeed = (vehicle: Vehicle) => {
	return vehicle.latest_device_point?.speed?.toFixed(1).toString() || "N/A";
};

const formatLastUpdate = (timestamp: string | undefined) => {
	if (!timestamp) return "N/A";
	return new Date(timestamp).toLocaleString();
};

const getVehicleLocation = (vehicle: Vehicle) => {
	const lat = vehicle.latest_device_point?.lat;
	const lng = vehicle.latest_device_point?.lng;
	if (!lat || !lng) return "Unknown";
	return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Handle preference updates from VehiclePreferences
const handlePreferencesUpdated = () => {
	emit("preferences-updated");
};

const handleVehicleClick = (vehicle: Vehicle) => {
	emit("vehicle-selected", vehicle.device_id);
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
						<v-icon
							:color="getStatusColor(vehicle)"
							@click="handleVehicleClick(vehicle)"
							style="cursor: pointer"
						>
							{{ getStatusIcon(vehicle) }}
						</v-icon>
					</template>

					<v-list-item-title
						class="d-flex align-center"
						@click="handleVehicleClick(vehicle)"
						style="cursor: pointer"
					>
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
								{{ formatSpeed(vehicle) }} km/h
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
					<template v-slot:append>
						<v-btn
							icon
							color="primary"
							variant="text"
							@click="openReportDialog(vehicle)"
							title="Generate Report"
						>
							<v-icon>mdi-file-chart</v-icon>
						</v-btn>
					</template>
				</v-list-item>
			</v-list>
		</v-card-text>

		<!-- Report Dialog -->
		<v-dialog v-model="showReportDialog" max-width="500px">
			<v-card>
				<v-card-title class="d-flex align-center">
					<v-icon class="mr-2">mdi-file-chart</v-icon>
					Generate Vehicle Report
				</v-card-title>

				<v-card-text>
					<p class="mb-4">
						Generate a report for {{ selectedVehicle?.display_name }}
					</p>

					<v-radio-group v-model="selectedTimeframe" class="mb-4">
						<v-radio
							v-for="timeframe in timeframes"
							:key="timeframe.value"
							:label="timeframe.label"
							:value="timeframe.value"
						></v-radio>
					</v-radio-group>
				</v-card-text>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn
						color="primary"
						:loading="isGeneratingReport"
						@click="generateReport"
					>
						Generate Report
					</v-btn>
					<v-btn text @click="showReportDialog = false">Cancel</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

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
