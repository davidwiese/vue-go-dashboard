<!-- ReportDialog.vue handles the report generation interface and process
It manages timeframe selection, API interaction, and download handling -->

<script setup lang="ts">
import { ref, computed } from "vue";
import { formatISO } from "date-fns";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import axios from "axios";

// Interfaces
interface Vehicle {
	device_id: string;
	display_name: string;
}

// TimeFrame interface defines available report periods
interface TimeFrame {
	label: string;
	value: string;
	from: Date;
	to: Date;
}

interface Props {
	modelValue: boolean; // for v-model dialog visibility
	vehicle: Vehicle | null;
}

const API_BASE_URL = import.meta.env.PROD
	? "https://trackifyfleet.pro/api"
	: "http://localhost:5000";

// Component setup
const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

// State
const selectedTimeframe = ref("24h");
const isGeneratingReport = ref(false);
const errorMessage = ref("");
const showError = ref(false);

// Compute available timeframe options
const timeframes = computed<TimeFrame[]>(() => {
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

// Reset dialog state on close
const closeDialog = () => {
	emit("update:modelValue", false);
	errorMessage.value = "";
	showError.value = false;
	selectedTimeframe.value = "24h";
};

// Main report generation function
const generateReport = async () => {
	if (!props.vehicle) return;

	try {
		isGeneratingReport.value = true;
		errorMessage.value = "";
		showError.value = false;

		const timeframe = timeframes.value.find(
			(t) => t.value === selectedTimeframe.value
		);
		if (!timeframe) return;

		// Convert local dates to UTC with 'Z' suffix
		const fromUTC = new Date(timeframe.from).toISOString(); // This gives format like "2024-11-10T22:21:45.000Z"
		const toUTC = new Date(timeframe.to).toISOString();

		console.log("Report timeframe:", { fromUTC, toUTC }); // Debug log

		const response = await fetch("/api/report/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				report_spec: {
					user_report_name: `${props.vehicle.display_name} Activity Report`,
					report_type: "drives_and_stops",
					device_id_list: [props.vehicle.device_id],
					datetime_from: fromUTC,
					datetime_to: toUTC,
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
						use_xlsx_separated_format: false,
					},
				},
			}),
			responseType: "blob",
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || "Failed to generate report");
		}

		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${props.vehicle.display_name}_report.pdf`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);

		closeDialog();
	} catch (error) {
		console.error("Error generating report:", error);
		errorMessage.value =
			error instanceof Error ? error.message : "An unexpected error occurred";
		showError.value = true;
	} finally {
		isGeneratingReport.value = false;
	}
};
</script>

<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="closeDialog"
		max-width="800px"
		persistent
		class="report-dialog"
	>
		<v-card>
			<v-card-title class="report-header d-flex align-center justify-center">
				<v-icon class="mr-3" color="primary">mdi-file-chart</v-icon>
				<span class="text-h6">Generate Vehicle Report</span>
			</v-card-title>

			<v-divider></v-divider>

			<v-card-text class="report-content">
				<!-- Error Alert -->
				<v-alert
					v-if="showError"
					type="error"
					variant="tonal"
					closable
					class="mb-4"
					@click:close="showError = false"
				>
					{{ errorMessage }}
				</v-alert>

				<p class="mb-4">Generate a report for {{ vehicle?.display_name }}</p>

				<v-radio-group v-model="selectedTimeframe" class="mb-4">
					<v-radio
						v-for="timeframe in timeframes"
						:key="timeframe.value"
						:label="timeframe.label"
						:value="timeframe.value"
					></v-radio>
				</v-radio-group>

				<!-- Progress Message -->
				<v-alert
					v-if="isGeneratingReport"
					color="info"
					variant="tonal"
					class="mb-4"
				>
					<template v-slot:prepend>
						<v-progress-circular
							indeterminate
							size="20"
							width="2"
							color="info"
							class="mr-2"
						></v-progress-circular>
					</template>
					Generating report... This may take up to 1 minute.
				</v-alert>
			</v-card-text>

			<v-divider></v-divider>

			<v-card-actions class="report-actions d-flex justify-end">
				<v-btn
					variant="tonal"
					color="primary"
					size="small"
					:loading="isGeneratingReport"
					:disabled="isGeneratingReport"
					@click="generateReport"
					class="action-btn"
				>
					{{ isGeneratingReport ? "Generating..." : "Generate Report" }}
				</v-btn>
				<v-btn
					variant="tonal"
					color="grey-darken-1"
					size="small"
					@click="closeDialog"
					:disabled="isGeneratingReport"
					class="action-btn"
				>
					Cancel
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.report-dialog {
	border-radius: 12px;
}

.report-header {
	padding: 16px 20px;
}

.report-actions {
	padding: 16px 20px;
}

.button-container {
	display: flex;
	justify-content: center;
	gap: 16px;
}

.action-btn {
	text-transform: none;
	font-weight: 500;
	letter-spacing: 0.5px;
	min-width: 120px;
}

.report-content {
	padding: 16px 20px;
}

.v-alert {
	margin-bottom: 16px;
}
</style>
