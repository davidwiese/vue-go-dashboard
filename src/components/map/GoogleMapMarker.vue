<script setup>
import { onMounted, watch } from "vue";

const props = defineProps({
	google: {
		type: Object,
		required: true,
	},
	map: {
		type: Object,
		required: true,
	},
	vehicle: {
		type: Object,
		required: true,
	},
});

let marker = null;
let infoWindow = null;

const createMarker = () => {
	if (!props.vehicle.latest_device_point) return;

	// Create marker
	marker = new props.google.maps.Marker({
		position: {
			lat: props.vehicle.latest_device_point.lat,
			lng: props.vehicle.latest_device_point.lng,
		},
		map: props.map,
		icon: {
			path: props.google.maps.SymbolPath.CIRCLE,
			fillColor: props.vehicle.online
				? props.vehicle.latest_device_point.speed > 0
					? "#4caf50"
					: "#ff9800"
				: "#de96a2",
			fillOpacity: 1,
			strokeWeight: 2,
			strokeColor: "#ffffff",
			scale: 8,
		},
		title: props.vehicle.display_name,
	});

	// Create info window
	infoWindow = new props.google.maps.InfoWindow({
		content: `
      <div class="info-window">
        <h3>${props.vehicle.display_name}</h3>
        <p>Status: ${props.vehicle.online ? "Online" : "Offline"}</p>
        <p>Speed: ${
					props.vehicle.latest_device_point.device_point_detail.speed.display
				}</p>
        <p>Last Updated: ${new Date(
					props.vehicle.latest_device_point.dt_tracker
				).toLocaleString()}</p>
      </div>
    `,
	});

	// Add click listener
	marker.addListener("click", () => {
		infoWindow.open(props.map, marker);
	});
};

// Update marker position when vehicle data changes
watch(
	() => props.vehicle.latest_device_point,
	(newPoint) => {
		if (marker && newPoint) {
			marker.setPosition({
				lat: newPoint.lat,
				lng: newPoint.lng,
			});
		}
	},
	{ deep: true }
);

onMounted(createMarker);
</script>

<template>
	<!-- Marker is handled in script -->
</template>
