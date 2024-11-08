<script setup lang="ts">
interface Props {
	size?: "small" | "default" | "large";
	color?: string;
}

withDefaults(defineProps<Props>(), {
	size: "default",
	color: "primary",
});
</script>

<template>
	<v-progress-circular
		:size="size === 'small' ? 20 : size === 'large' ? 48 : 32"
		:color="color"
		indeterminate
	/>
</template>
