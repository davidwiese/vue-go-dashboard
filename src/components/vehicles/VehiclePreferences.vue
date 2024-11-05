<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { getClientId } from "@/utils/clientId";

// Interface definitions
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

interface SavedPreference {
	device_id: string;
	display_name: string;
	is_hidden: boolean;
	sort_order: number;
}

const props = defineProps({
	vehicles: {
		type: Array as () => Vehicle[],
		required: true,
	},
	show: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits<{
	(e: "update:show", value: boolean): void;
	(e: "preferences-updated"): void;
}>();

const API_BASE_URL = "http://localhost:5000";
const preferences = ref<Map<string, Preference>>(new Map());
const loading = ref(false);
const error = ref("");

// Load preferences for all vehicles
const loadPreferences = async () => {
	try {
		loading.value = true;
		error.value = "";
		const clientId = getClientId();
		const response = await axios.get<SavedPreference[]>(
			`${API_BASE_URL}/preferences?client_id=${clientId}`
		);

		// Initialize preferences map
		const prefsMap = new Map<string, Preference>();

		// Initialize preferences for all vehicles with defaults
		props.vehicles.forEach((vehicle) => {
			prefsMap.set(vehicle.device_id, {
				isHidden: false,
				sortOrder: 0,
				displayName: vehicle.display_name,
			});
		});

		// Override with any saved preferences from the database
		response.data.forEach((pref) => {
			prefsMap.set(pref.device_id, {
				isHidden: pref.is_hidden,
				sortOrder: pref.sort_order,
				displayName:
					pref.display_name ||
					props.vehicles.find((v) => v.device_id === pref.device_id)
						?.display_name ||
					"",
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
const savePreference = async (deviceId: string) => {
	try {
		const pref = preferences.value.get(deviceId);
		if (!pref) return;

		const clientId = getClientId();
		const payload = {
			device_id: deviceId,
			client_id: clientId,
			display_name: pref.displayName,
			is_hidden: pref.isHidden,
			sort_order: pref.sortOrder,
		};

		// Try to create first (which will update if exists)
		try {
			await axios.post(`${API_BASE_URL}/preferences`, payload);
		} catch (err) {
			console.error("Error saving preference:", err);
			error.value = "Failed to save preference";
			// Revert the local change since save failed
			const currentPref = preferences.value.get(deviceId);
			if (currentPref) {
				currentPref.isHidden = !currentPref.isHidden;
			}
			return;
		}

		await loadPreferences(); // Reload preferences after successful save
		emit("preferences-updated");
	} catch (err) {
		console.error("Error in savePreference:", err);
		error.value = "Failed to save preference";
		// Revert the local change since save failed
		const pref = preferences.value.get(deviceId);
		if (pref) {
			pref.isHidden = !pref.isHidden;
		}
	}
};

// Toggle vehicle visibility
const toggleVisibility = async (deviceId: string) => {
	const pref = preferences.value.get(deviceId);
	if (pref) {
		const newIsHidden = !pref.isHidden;
		pref.isHidden = newIsHidden; // Update optimistically
		try {
			await savePreference(deviceId);
		} catch (err) {
			// savePreference already handles error case and reverts the change
			console.error("Error toggling visibility:", err);
		}
	}
};

const toggleAllVisibility = async (show: boolean) => {
	try {
		loading.value = true;
		for (const vehicle of props.vehicles) {
			const pref = preferences.value.get(vehicle.device_id);
			if (pref) {
				pref.isHidden = !show;
				await savePreference(vehicle.device_id);
			}
		}
		emit("preferences-updated");
	} catch (err) {
		console.error("Error toggling visibility:", err);
		error.value = "Failed to update visibility";
	} finally {
		loading.value = false;
	}
};

const sortAlphabetically = async () => {
	try {
		loading.value = true;
		const vehicles = [...props.vehicles].sort((a, b) => {
			const aName =
				preferences.value.get(a.device_id)?.displayName || a.display_name;
			const bName =
				preferences.value.get(b.device_id)?.displayName || b.display_name;
			return aName.localeCompare(bName);
		});

		// Update sort orders
		vehicles.forEach((vehicle, idx) => {
			const pref = preferences.value.get(vehicle.device_id);
			if (pref) {
				pref.sortOrder = idx;
				savePreference(vehicle.device_id);
			}
		});

		emit("preferences-updated");
	} catch (err) {
		console.error("Error sorting vehicles:", err);
		error.value = "Failed to sort vehicles";
	} finally {
		loading.value = false;
	}
};

const hideInactiveVehicles = async () => {
	try {
		loading.value = true;
		for (const vehicle of props.vehicles) {
			const pref = preferences.value.get(vehicle.device_id);
			if (pref && !vehicle.online) {
				pref.isHidden = true;
				await savePreference(vehicle.device_id);
			}
		}
		emit("preferences-updated");
	} catch (err) {
		console.error("Error hiding inactive vehicles:", err);
		error.value = "Failed to hide inactive vehicles";
	} finally {
		loading.value = false;
	}
};

// Update display name
const updateDisplayName = async (deviceId: string, event: string) => {
	const pref = preferences.value.get(deviceId);
	if (pref) {
		pref.displayName = event;
		await savePreference(deviceId);
	}
};

// Handle drag and drop for sorting
const draggedItem = ref<string | null>(null);

const onDragStart = (deviceId: string) => {
	draggedItem.value = deviceId;
};

const onDragOver = (e: DragEvent) => {
	e.preventDefault();
};

const onDrop = async (targetDeviceId: string) => {
	if (!draggedItem.value || draggedItem.value === targetDeviceId) return;

	const vehicles = Array.from(props.vehicles);
	const draggedIdx = vehicles.findIndex(
		(v) => v.device_id === draggedItem.value
	);
	const targetIdx = vehicles.findIndex((v) => v.device_id === targetDeviceId);

	// Move the dragged item to the target position
	const [draggedVehicle] = vehicles.splice(draggedIdx, 1);
	vehicles.splice(targetIdx, 0, draggedVehicle);

	// Update sort orders
	vehicles.forEach((vehicle, idx) => {
		const pref = preferences.value.get(vehicle.device_id);
		if (pref) {
			pref.sortOrder = idx;
			savePreference(vehicle.device_id);
		}
	});

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
		:model-value="show"
		@update:model-value="$emit('update:show', $event)"
		max-width="800px"
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

			<v-card-subtitle>
				<div class="d-flex align-center gap-2 my-2">
					<v-btn
						variant="tonal"
						size="small"
						prepend-icon="mdi-sort-alphabetical-ascending"
						@click="sortAlphabetically"
						:loading="loading"
					>
						Sort A-Z
					</v-btn>

					<v-btn
						variant="tonal"
						size="small"
						prepend-icon="mdi-eye"
						@click="toggleAllVisibility(true)"
						:loading="loading"
					>
						Show All
					</v-btn>

					<v-btn
						variant="tonal"
						size="small"
						prepend-icon="mdi-eye-off"
						@click="toggleAllVisibility(false)"
						:loading="loading"
					>
						Hide All
					</v-btn>

					<v-btn
						variant="tonal"
						size="small"
						prepend-icon="mdi-car-off"
						@click="hideInactiveVehicles"
						:loading="loading"
						color="warning"
					>
						Hide Inactive
					</v-btn>
				</div>
			</v-card-subtitle>

			<v-divider></v-divider>

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
								@update:model-value="
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
