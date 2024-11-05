<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";

const props = defineProps({
	vehicles: {
		type: Array,
		required: true,
	},
	show: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["update:show", "preferences-updated"]);

const API_BASE_URL = "http://localhost:5000";
const preferences = ref(new Map());
const loading = ref(false);
const error = ref("");

// Load preferences for all vehicles
const loadPreferences = async () => {
	try {
		loading.value = true;
		const response = await axios.get(`${API_BASE_URL}/preferences`);
		const prefsMap = new Map();
		response.data.forEach((pref) => {
			prefsMap.set(pref.device_id, {
				isHidden: pref.is_hidden,
				sortOrder: pref.sort_order,
				displayName:
					pref.display_name ||
					props.vehicles.find((v) => v.device_id === pref.device_id)
						?.display_name,
			});
		});
		preferences.value = prefsMap;
	} catch (err) {
		console.error("Error loading preferences:", err);
		error.value = "Failed to load preferences";
	} finally {
		loading.value = false;
	}
};

// Save preferences for a vehicle
const savePreference = async (deviceId) => {
	try {
		const pref = preferences.value.get(deviceId);
		if (!pref) return;

		const existing = await axios.get(`${API_BASE_URL}/preferences/${deviceId}`);

		if (existing.data) {
			// Update existing preference
			await axios.put(`${API_BASE_URL}/preferences/${deviceId}`, {
				display_name: pref.displayName,
				is_hidden: pref.isHidden,
				sort_order: pref.sortOrder,
			});
		} else {
			// Create new preference
			await axios.post(`${API_BASE_URL}/preferences`, {
				device_id: deviceId,
				display_name: pref.displayName,
				is_hidden: pref.isHidden,
				sort_order: pref.sortOrder,
			});
		}
		emit("preferences-updated");
	} catch (err) {
		console.error("Error saving preference:", err);
		error.value = "Failed to save preference";
	}
};

// Initialize preferences for vehicles that don't have them
const initializePreferences = () => {
	props.vehicles.forEach((vehicle) => {
		if (!preferences.value.has(vehicle.device_id)) {
			preferences.value.set(vehicle.device_id, {
				isHidden: false,
				sortOrder: 0,
				displayName: vehicle.display_name,
			});
		}
	});
};

// Toggle vehicle visibility
const toggleVisibility = async (deviceId) => {
	const pref = preferences.value.get(deviceId);
	if (pref) {
		pref.isHidden = !pref.isHidden;
		await savePreference(deviceId);
	}
};

// Update display name
const updateDisplayName = async (deviceId, event) => {
	const pref = preferences.value.get(deviceId);
	if (pref) {
		pref.displayName = event.target.value;
		await savePreference(deviceId);
	}
};

// Handle drag and drop for sorting
const draggedItem = ref(null);

const onDragStart = (deviceId) => {
	draggedItem.value = deviceId;
};

const onDragOver = (e) => {
	e.preventDefault();
};

const onDrop = async (targetDeviceId) => {
	if (!draggedItem.value || draggedItem.value === targetDeviceId) return;

	const vehicles = Array.from(props.vehicles);
	const draggedIdx = vehicles.findIndex(
		(v) => v.device_id === draggedItem.value
	);
	const targetIdx = vehicles.findIndex((v) => v.device_id === targetDeviceId);

	// Update sort orders
	for (const [idx, vehicle] of vehicles.entries()) {
		const pref = preferences.value.get(vehicle.device_id);
		if (pref) {
			pref.sortOrder = idx;
			await savePreference(vehicle.device_id);
		}
	}

	draggedItem.value = null;
	emit("preferences-updated");
};

// Watch for dialog visibility
watch(
	() => props.show,
	(newValue) => {
		if (newValue) {
			loadPreferences();
		}
	}
);

onMounted(() => {
	if (props.show) {
		loadPreferences();
	}
});
</script>

<template>
	<v-dialog
		v-model="show"
		max-width="800px"
		@update:modelValue="$emit('update:show', $event)"
	>
		<v-card>
			<v-card-title class="d-flex align-center">
				<v-icon class="mr-2">mdi-cog</v-icon>
				Vehicle Preferences
				<v-spacer></v-spacer>
				<v-btn icon @click="$emit('update:show', false)">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</v-card-title>

			<v-card-text>
				<v-alert
					v-if="error"
					type="error"
					variant="tonal"
					class="mb-4"
					closable
					@click:close="error = ''"
				>
					{{ error }}
				</v-alert>

				<v-list v-if="!loading">
					<v-list-item
						v-for="vehicle in vehicles"
						:key="vehicle.device_id"
						:draggable="true"
						@dragstart="onDragStart(vehicle.device_id)"
						@dragover="onDragOver"
						@drop="onDrop(vehicle.device_id)"
						class="mb-2"
					>
						<template v-slot:prepend>
							<v-icon color="grey">mdi-drag</v-icon>
						</template>

						<v-list-item-title>
							<v-text-field
								:model-value="
									preferences.get(vehicle.device_id)?.displayName ||
									vehicle.display_name
								"
								@update:modelValue="
									updateDisplayName(vehicle.device_id, $event)
								"
								hide-details
								density="compact"
								class="mr-4"
							></v-text-field>
						</v-list-item-title>

						<template v-slot:append>
							<v-btn
								:icon="
									preferences.get(vehicle.device_id)?.isHidden
										? 'mdi-eye-off'
										: 'mdi-eye'
								"
								:color="
									preferences.get(vehicle.device_id)?.isHidden
										? 'grey'
										: 'success'
								"
								density="comfortable"
								variant="text"
								@click="toggleVisibility(vehicle.device_id)"
							></v-btn>
						</template>
					</v-list-item>
				</v-list>

				<v-skeleton-loader
					v-else
					type="list-item-three-line"
					:loading="loading"
				></v-skeleton-loader>
			</v-card-text>

			<v-card-actions class="pa-4">
				<v-spacer></v-spacer>
				<v-btn
					color="primary"
					variant="tonal"
					@click="$emit('update:show', false)"
				>
					Done
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.v-list-item {
	cursor: move;
	transition: background-color 0.2s;
}

.v-list-item:hover {
	background-color: rgba(0, 0, 0, 0.04);
}

.v-list-item .v-text-field {
	width: 100%;
}
</style>
