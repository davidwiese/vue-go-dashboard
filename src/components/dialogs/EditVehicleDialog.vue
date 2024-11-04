<script setup>
import { ref, watch } from "vue";

const props = defineProps({
	show: {
		type: Boolean,
		required: true,
	},
	vehicle: {
		type: Object,
		required: true,
	},
});

const emit = defineEmits(["update:show", "save"]);

const editedVehicle = ref({ ...props.vehicle });

// Reset form when dialog is opened with new vehicle
watch(
	() => props.vehicle,
	(newVal) => {
		editedVehicle.value = { ...newVal };
	},
	{ deep: true }
);

// Form validation
const valid = ref(true);
const nameRules = [
	(v) => !!v || "Name is required",
	(v) => (v && v.length <= 50) || "Name must be less than 50 characters",
];

const save = () => {
	emit("save", editedVehicle.value);
	emit("update:show", false);
};
</script>

<template>
	<v-dialog
		:model-value="show"
		@update:model-value="$emit('update:show', $event)"
		max-width="500px"
		persistent
	>
		<v-card>
			<v-card-title>
				<span class="text-h5">Edit Vehicle</span>
			</v-card-title>

			<v-card-text>
				<v-container>
					<v-form v-model="valid" @submit.prevent="save">
						<v-row>
							<v-col cols="12">
								<v-text-field
									v-model="editedVehicle.display_name"
									label="Vehicle Name"
									:rules="nameRules"
									required
								></v-text-field>
							</v-col>

							<v-col cols="12">
								<v-text-field
									v-model="editedVehicle.device_id"
									label="Device ID"
									disabled
								></v-text-field>
							</v-col>

							<!-- Add more fields as needed -->
						</v-row>
					</v-form>
				</v-container>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="save" :disabled="!valid"> Save </v-btn>
				<v-btn color="error" @click="$emit('update:show', false)">
					Cancel
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
