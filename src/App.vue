<style>
@import url("https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap");
</style>

<template>
	<v-app>
		<v-app-bar app color="primary">
			<v-app-bar-title class="d-flex align-center justify-center text-h5">
				<v-icon class="mr-2">mdi-truck</v-icon>
				<span>Trackify Fleet</span>
			</v-app-bar-title>
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

<style scoped>
* {
	font-family: "Google Sans", sans-serif;
}

.v-app-bar {
	background-color: #1e88e5; /* Basic primary color */
	color: #ffffff;
}

.v-app-bar-title {
	font-size: 1.25rem;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
}

.v-container {
	padding-top: 16px;
	padding-bottom: 16px;
}

.v-icon {
	font-size: 2rem;
	transform: translateY(-2px);
}
</style>
