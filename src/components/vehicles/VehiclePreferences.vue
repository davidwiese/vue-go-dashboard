<!-- VehiclePreferences.vue manages vehicle display preferences with optimistic updates
Handles sorting, visibility, and name customization with error recovery -->

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { getClientId } from "@/utils/clientId";
import {
	savePreference as apiSavePreference,
	savePreferencesBatch,
} from "@/api/apiService";

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

// Component setup
const props = defineProps<Props>();
const emit = defineEmits(["update:show", "preferences-updated"]);

// State
const loading = ref(false);
const error = ref("");

// Create a local copy of preferences for cancellation support
const localPreferences = reactive<Record<string, Preference>>({});

// Computed property for sorted vehicles display
const sortedVehicles = computed(() => {
	return [...props.vehicles].sort((a, b) => {
		const aOrder = localPreferences[a.device_id]?.sortOrder || 0;
		const bOrder = localPreferences[b.device_id]?.sortOrder || 0;
		return aOrder - bOrder;
	});
});

// Watchers for dialog state synchronization
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

// Core update functions with optimistic updates

// Save single preference with rollback on error
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
		// Rollback on error
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
		const originalName = pref.displayName; // Store for rollback
		try {
			// Optimistic update
			pref.displayName = newName;

			// Attempt to save to backend
			await savePreference(deviceId);
		} catch (err) {
			// Rollback on error
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
		persistent
	>
		<v-card class="preferences-dialog">
			<v-card-title
				class="preferences-header d-flex align-center justify-center"
			>
				<div class="d-flex align-center">
					<v-icon class="mr-3" color="grey-darken-1">mdi-cog</v-icon>
					<span class="text-h6">Vehicle Preferences</span>
				</div>
			</v-card-title>

			<v-card-subtitle class="action-buttons">
				<div class="button-container">
					<v-btn
						variant="tonal"
						color="primary"
						size="small"
						prepend-icon="mdi-sort-alphabetical-ascending"
						@click="sortAlphabetically"
						:loading="loading"
						class="action-btn"
					>
						Sort A-Z
					</v-btn>

					<v-btn
						variant="tonal"
						color="success"
						size="small"
						prepend-icon="mdi-eye"
						@click="toggleAllVisibility(true)"
						:loading="loading"
						class="action-btn"
					>
						Show All
					</v-btn>

					<v-btn
						variant="tonal"
						color="grey-darken-1"
						size="small"
						prepend-icon="mdi-eye-off"
						@click="toggleAllVisibility(false)"
						:loading="loading"
						class="action-btn"
					>
						Hide All
					</v-btn>
				</div>
			</v-card-subtitle>

			<v-divider></v-divider>

			<v-card-text class="preferences-content">
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

				<v-list v-if="!loading" class="preferences-list">
					<v-list-item
						v-for="vehicle in sortedVehicles"
						:key="vehicle.device_id"
						:draggable="true"
						@dragstart="onDragStart(vehicle.device_id)"
						@dragover="onDragOver"
						@drop="onDrop(vehicle.device_id)"
						class="preference-item"
						rounded="lg"
					>
						<template v-slot:prepend>
							<v-icon color="grey" size="small">mdi-drag</v-icon>
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
								density="comfortable"
								variant="outlined"
								class="name-field"
								bg-color="grey-lighten-4"
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
								size="small"
							></v-btn>
						</template>
					</v-list-item>
				</v-list>

				<div v-else class="skeleton-loader">
					<v-skeleton-loader
						v-for="i in 5"
						:key="i"
						type="list-item-three-line"
						class="mb-2"
					></v-skeleton-loader>
				</div>
			</v-card-text>

			<v-divider></v-divider>

			<v-card-actions class="preferences-actions">
				<v-spacer></v-spacer>
				<v-btn
					color="primary"
					variant="tonal"
					@click="$emit('update:show', false)"
					class="done-btn"
				>
					Done
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.preferences-dialog {
	border-radius: 12px;
}

.preferences-header {
	padding: 16px 20px;
}

.action-buttons {
	padding: 16px 20px;
}

.button-container {
	display: flex;
	justify-content: center;
	gap: 8px;
}

.action-btn {
	text-transform: none;
	font-weight: 500;
	letter-spacing: 0.5px;
	min-width: 100px;
}

.preferences-content {
	padding: 16px 20px;
}

.preferences-actions {
	padding: 16px 20px;
}

.preferences-list {
	margin: 0 -8px;
}

.preference-item {
	margin: 4px 0;
	border-radius: 8px;
	transition: all 0.2s ease;
}

.preference-item:hover {
	background-color: rgba(0, 0, 0, 0.03);
}

.preference-item:active {
	transform: scale(0.99);
}

.name-field {
	margin: 0 12px;
}

.name-field :deep(.v-field__outline) {
	--v-field-border-opacity: 0.1;
}

.name-field :deep(.v-field--variant-outlined) {
	--v-field-border-opacity: 0.12;
}

.done-btn {
	min-width: 100px;
	text-transform: none;
	font-weight: 500;
	letter-spacing: 0.5px;
}

.skeleton-loader {
	padding: 16px;
}
</style>
