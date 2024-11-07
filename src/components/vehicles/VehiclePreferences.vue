<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { getClientId } from "@/utils/clientId";
import {
	savePreference as apiSavePreference,
	savePreferencesBatch,
} from "@/api/apiService";

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

interface PreferencePayload {
	device_id: string;
	client_id: string;
	display_name: string;
	is_hidden: boolean;
	sort_order: number;
}

interface Props {
	vehicles: Vehicle[];
	preferences: Record<string, Preference>;
	show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:show", "preferences-updated"]);
const loading = ref(false);
const error = ref("");

// Create a local copy of preferences for cancellation support
const localPreferences = reactive<Record<string, Preference>>({});

// Computed property for sorted vehicles
const sortedVehicles = computed(() => {
	return [...props.vehicles].sort((a, b) => {
		const aOrder = localPreferences[a.device_id]?.sortOrder || 0;
		const bOrder = localPreferences[b.device_id]?.sortOrder || 0;
		return aOrder - bOrder;
	});
});

// Watch for changes in props.show
watch(
	() => props.show,
	(isShown) => {
		if (isShown) {
			// Deep copy preferences when dialog opens
			Object.keys(localPreferences).forEach(
				(key) => delete localPreferences[key]
			);
			Object.assign(
				localPreferences,
				JSON.parse(JSON.stringify(props.preferences))
			);
		}
	},
	{ immediate: true }
);

// Watch for changes in props.preferences
watch(
	() => props.preferences,
	(newPrefs) => {
		if (props.show) {
			// Update local preferences when global preferences change
			Object.keys(localPreferences).forEach(
				(key) => delete localPreferences[key]
			);
			Object.assign(localPreferences, JSON.parse(JSON.stringify(newPrefs)));
		}
	},
	{ deep: true }
);

// Function to apply local changes to global preferences
const applyChanges = () => {
	Object.assign(
		props.preferences,
		JSON.parse(JSON.stringify(localPreferences))
	);
};

// Save preferences for a vehicle with optimistic update and error handling
const savePreference = async (deviceId: string) => {
	const pref = localPreferences[deviceId];
	if (!pref) return;

	const originalPref = { ...props.preferences[deviceId] };
	try {
		// Optimistically update global preferences
		props.preferences[deviceId] = { ...pref };

		const clientId = getClientId();
		const payload: PreferencePayload = {
			device_id: deviceId,
			client_id: clientId,
			display_name: pref.displayName,
			is_hidden: pref.isHidden,
			sort_order: pref.sortOrder,
		};

		await apiSavePreference(payload);
		emit("preferences-updated");
	} catch (err) {
		console.error("Error saving preference:", err);
		error.value = "Failed to save preference";
		// Revert to original preference
		props.preferences[deviceId] = originalPref;
	}
};

// Toggle vehicle visibility with optimistic update
const toggleVisibility = async (deviceId: string) => {
	const pref = localPreferences[deviceId];
	if (!pref) return;

	const originalState = pref.isHidden;
	try {
		pref.isHidden = !pref.isHidden; // Optimistic update
		await savePreference(deviceId);
	} catch (err) {
		pref.isHidden = originalState; // Revert on error
	}
};

// Batch operation for toggling all visibility
const toggleAllVisibility = async (show: boolean) => {
	const originalStates = new Map<string, boolean>();
	try {
		loading.value = true;

		// Store original states and apply optimistic updates
		props.vehicles.forEach((vehicle) => {
			const pref = localPreferences[vehicle.device_id];
			if (pref) {
				originalStates.set(vehicle.device_id, pref.isHidden);
				pref.isHidden = !show;
			}
		});

		// Prepare batch update
		const updates: PreferencePayload[] = props.vehicles.map((vehicle) => {
			const pref = localPreferences[vehicle.device_id];
			return {
				device_id: vehicle.device_id,
				client_id: getClientId(),
				display_name: pref?.displayName || vehicle.display_name,
				is_hidden: pref?.isHidden || false,
				sort_order: pref?.sortOrder || 0,
			};
		});

		// Optimistically apply changes to global preferences
		applyChanges();

		await savePreferencesBatch(updates);
		emit("preferences-updated");
	} catch (err) {
		console.error("Error toggling visibility:", err);
		error.value = "Failed to update visibility";

		// Revert changes
		originalStates.forEach((state, deviceId) => {
			const pref = localPreferences[deviceId];
			if (pref) {
				pref.isHidden = state;
			}
		});

		// Revert global preferences
		Object.assign(
			props.preferences,
			JSON.parse(JSON.stringify(localPreferences))
		);
	} finally {
		loading.value = false;
	}
};

// Batch operation for sorting alphabetically
const sortAlphabetically = async () => {
	const originalOrder = new Map<string, number>();
	try {
		loading.value = true;

		// Store original sort orders
		props.vehicles.forEach((vehicle) => {
			const pref = localPreferences[vehicle.device_id];
			if (pref) {
				originalOrder.set(vehicle.device_id, pref.sortOrder);
			}
		});

		// Sort vehicles
		const sortedVehicles = [...props.vehicles].sort((a, b) => {
			const aName =
				localPreferences[a.device_id]?.displayName || a.display_name;
			const bName =
				localPreferences[b.device_id]?.displayName || b.display_name;
			return aName.localeCompare(bName);
		});

		// Update sort orders
		sortedVehicles.forEach((vehicle, index) => {
			const pref = localPreferences[vehicle.device_id];
			if (pref) {
				pref.sortOrder = index;
			}
		});

		// Prepare batch update
		const updates: PreferencePayload[] = sortedVehicles.map((vehicle) => {
			const pref = localPreferences[vehicle.device_id];
			return {
				device_id: vehicle.device_id,
				client_id: getClientId(),
				display_name: pref?.displayName || vehicle.display_name,
				is_hidden: pref?.isHidden || false,
				sort_order: pref?.sortOrder || 0,
			};
		});

		// Optimistically apply changes to global preferences
		applyChanges();

		await savePreferencesBatch(updates);
		emit("preferences-updated");
	} catch (err) {
		console.error("Error sorting vehicles:", err);
		error.value = "Failed to sort vehicles";

		// Revert changes
		originalOrder.forEach((order, deviceId) => {
			const pref = localPreferences[deviceId];
			if (pref) {
				pref.sortOrder = order;
			}
		});

		// Revert global preferences
		Object.assign(
			props.preferences,
			JSON.parse(JSON.stringify(localPreferences))
		);
	} finally {
		loading.value = false;
	}
};

// Update display name
const updateDisplayName = async (deviceId: string, newName: string) => {
	const pref = localPreferences[deviceId];
	if (pref) {
		const originalName = pref.displayName;
		try {
			pref.displayName = newName;
			await savePreference(deviceId);
		} catch (err) {
			pref.displayName = originalName;
		}
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

	const vehicles = sortedVehicles.value; // Use sorted vehicles instead of props.vehicles
	const draggedIdx = vehicles.findIndex(
		(v) => v.device_id === draggedItem.value
	);
	const targetIdx = vehicles.findIndex((v) => v.device_id === targetDeviceId);

	const originalOrder = new Map<string, number>();

	try {
		// Create a new array with the updated order
		const reorderedVehicles = [...vehicles];
		const [draggedVehicle] = reorderedVehicles.splice(draggedIdx, 1);
		reorderedVehicles.splice(targetIdx, 0, draggedVehicle);

		// Update sort orders
		reorderedVehicles.forEach((vehicle, idx) => {
			const pref = localPreferences[vehicle.device_id];
			if (pref) {
				originalOrder.set(vehicle.device_id, pref.sortOrder);
				pref.sortOrder = idx;
			}
		});

		// Prepare batch update
		const updates: PreferencePayload[] = reorderedVehicles.map((vehicle) => ({
			device_id: vehicle.device_id,
			client_id: getClientId(),
			display_name:
				localPreferences[vehicle.device_id]?.displayName ||
				vehicle.display_name,
			is_hidden: localPreferences[vehicle.device_id]?.isHidden || false,
			sort_order: localPreferences[vehicle.device_id]?.sortOrder || 0,
		}));

		// Apply changes to global preferences
		await savePreferencesBatch(updates);
		emit("preferences-updated");
	} catch (err) {
		console.error("Error updating sort order:", err);
		error.value = "Failed to update sort order";

		// Revert changes
		originalOrder.forEach((order, deviceId) => {
			const pref = localPreferences[deviceId];
			if (pref) {
				pref.sortOrder = order;
			}
		});
	} finally {
		draggedItem.value = null;
	}
};
</script>

<template>
	<v-dialog
		:model-value="props.show"
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
						v-for="vehicle in sortedVehicles"
						:key="vehicle.device_id"
						:draggable="true"
						@dragstart="onDragStart(vehicle.device_id)"
						@dragover="onDragOver"
						@drop="onDrop(vehicle.device_id)"
						class="mb-2 preference-item"
					>
						<template v-slot:prepend>
							<v-icon color="grey">mdi-drag</v-icon>
						</template>

						<v-list-item-title>
							<v-text-field
								:model-value="
									localPreferences[vehicle.device_id]?.displayName ||
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
									localPreferences[vehicle.device_id]?.isHidden
										? 'mdi-eye-off'
										: 'mdi-eye'
								"
								:color="
									localPreferences[vehicle.device_id]?.isHidden
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
.preference-item {
	cursor: move;
	transition: background-color 0.2s, transform 0.2s;
}

.preference-item:hover {
	background-color: rgba(0, 0, 0, 0.04);
}

.preference-item:active {
	transform: scale(0.98);
}

.preference-item .v-text-field {
	width: 100%;
}

.preference-item:global(.dragging) {
	opacity: 0.5;
	background-color: rgba(0, 0, 0, 0.08);
}

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
