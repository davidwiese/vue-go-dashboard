<!-- App.vue is the root component, similar to App.jsx in React -->
<!-- Vue combines template, script, and style in a single file -->
<!-- Unlike React's JSX, Vue uses a template syntax with v- prefixed directives -->

<style>
@import url("https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap");
</style>

<template>
	<!-- v-app is Vuetify's root component -->
	<v-app>
		<v-app-bar app color="primary">
			<v-app-bar-title class="d-flex align-center justify-center text-h5">
				<v-icon class="mr-2">mdi-truck</v-icon>
				<span>Trackify Fleet</span>
			</v-app-bar-title>
		</v-app-bar>

		<!-- Main content area -->
		<v-main>
			<v-container>
				<!-- Router view - similar to React Router's <Routes> and <Route> -->
				<!-- Vue's slot system is similar to React's children prop -->
				<router-view v-slot="{ Component }">
					<!-- Conditional rendering uses v-if instead of React's ternary operators -->
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
/* Scoped styles are component-specific - similar to CSS Modules in React */
/* Handled at build time */
* {
	font-family: "Google Sans", sans-serif;
}

.v-app-bar {
	background-color: #1e88e5;
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
