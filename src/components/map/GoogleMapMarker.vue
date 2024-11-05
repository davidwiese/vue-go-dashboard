<script setup>
import { onMounted, watch, onBeforeUnmount } from "vue";

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

const getMarkerIcon = (vehicle) => {
	// Get the color based on vehicle status
	const backgroundColor = vehicle.online
		? vehicle.latest_device_point.speed > 0
			? "#4caf50"
			: "#ff9800"
		: "#de96a2";

	// Create an SVG marker icon
	return {
		path: google.maps.SymbolPath.CIRCLE,
		fillColor: backgroundColor,
		fillOpacity: 1,
		strokeColor: "#FFFFFF",
		strokeWeight: 2,
		scale: 12,
	};
};

const createMarker = async () => {
	if (!props.vehicle.latest_device_point) return;

	try {
		// Use standard Marker with custom icon
		const { Marker } = await google.maps.importLibrary("marker");

		marker = new Marker({
			map: props.map,
			position: {
				lat: props.vehicle.latest_device_point.lat,
				lng: props.vehicle.latest_device_point.lng,
			},
			icon: getMarkerIcon(props.vehicle),
			title: props.vehicle.display_name,
		});

		// Create info window
		infoWindow = new props.google.maps.InfoWindow({
			content: `
        <div class="info-window" style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0;">${props.vehicle.display_name}</h3>
          <p style="margin: 4px 0;">Status: ${
						props.vehicle.online ? "Online" : "Offline"
					}</p>
          <p style="margin: 4px 0;">Speed: ${
						props.vehicle.latest_device_point.device_point_detail.speed.display
					}</p>
          <p style="margin: 4px 0; font-size: 0.9em;">Last Updated: ${new Date(
						props.vehicle.latest_device_point.dt_tracker
					).toLocaleString()}</p>
        </div>
      `,
		});

		marker.addListener("click", () => {
			infoWindow.open(props.map, marker);
		});
	} catch (error) {
		console.error("Error creating marker:", error);
	}
};

// Update marker position and icon when vehicle data changes
watch(
	() => props.vehicle.latest_device_point,
	(newPoint) => {
		if (marker && newPoint) {
			marker.setPosition({
				lat: newPoint.lat,
				lng: newPoint.lng,
			});
			marker.setIcon(getMarkerIcon(props.vehicle));
		}
	},
	{ deep: true }
);

onMounted(() => {
	createMarker();
});

onBeforeUnmount(() => {
	if (marker) {
		marker.setMap(null);
	}
	if (infoWindow) {
		infoWindow.close();
	}
});
</script>

<template>
	<div style="display: none"></div>
</template>
