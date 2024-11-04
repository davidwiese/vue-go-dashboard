<script setup>
import { onMounted } from "vue";

onMounted(() => {
	console.log("App component mounted");
});
</script>

<template>
	<v-app>
		<v-app-bar app>
			<v-app-bar-title>Vuetify + Go Fleet Tracking Dashboard</v-app-bar-title>
		</v-app-bar>

		<v-main>
			<v-container>
				<router-view v-slot="{ Component }">
					<template v-if="Component">
						<component :is="Component" />
					</template>
					<template v-else>
						<div>No component loaded</div>
					</template>
				</router-view>
			</v-container>
		</v-main>
	</v-app>
</template>
