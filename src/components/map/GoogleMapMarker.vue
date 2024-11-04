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

const getStatusColor = (vehicle) => {
	if (!vehicle.online) return "#de96a2";
	if (vehicle.latest_device_point?.speed > 0) return "#4caf50";
	return "#ff9800";
};

const createMarker = async () => {
	if (!props.vehicle.latest_device_point) return;

	const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

	// Create the marker element
	const markerView = new google.maps.marker.PinElement({
		background: getStatusColor(props.vehicle),
		borderColor: "#ffffff",
		glyph: props.vehicle.online ? "mdi-car-side" : "mdi-car-off",
	});

	// Create the advanced marker
	marker = new AdvancedMarkerElement({
		position: {
			lat: props.vehicle.latest_device_point.lat,
			lng: props.vehicle.latest_device_point.lng,
		},
		map: props.map,
		content: markerView.element,
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
			marker.position = {
				lat: newPoint.lat,
				lng: newPoint.lng,
			};
		}
	},
	{ deep: true }
);

onMounted(createMarker);
</script>

<template>
	<!-- Marker is handled in script -->
</template>
