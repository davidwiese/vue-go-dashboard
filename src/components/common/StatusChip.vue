<script setup lang="ts">
interface Props {
	label: string;
	color?: string;
	size?: "x-small" | "small" | "default" | "large";
}

withDefaults(defineProps<Props>(), {
	color: "primary",
	size: "default",
});
</script>

<template>
	<v-chip :color="color" :size="size">
		{{ label }}
	</v-chip>
</template>
