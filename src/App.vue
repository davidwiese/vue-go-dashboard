<script setup></script>

<template>
	<v-app>
		<v-app-bar app>
			<v-app-bar-title>Vuetify + Go Fleet Tracking Dashboard</v-app-bar-title>
		</v-app-bar>

		<v-main>
			<v-container>
				<router-view
					><!-- Components rendered here similar to React Router <Switch> and <Route> --></router-view
				>
			</v-container>
		</v-main>
	</v-app>
</template>
