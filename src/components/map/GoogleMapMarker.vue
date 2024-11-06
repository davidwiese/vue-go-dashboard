<script setup>
import { onMounted, watch, onBeforeUnmount, ref } from "vue";

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

const marker = ref(null);
const infoWindow = ref(null);

const getMarkerIcon = (vehicle) => {
	const backgroundColor = vehicle.online
		? vehicle.latest_device_point.speed > 0
			? "#4caf50"
			: "#ff9800"
		: "#de96a2";

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
		const { Marker } = await google.maps.importLibrary("marker");

		if (marker.value) {
			marker.value.setMap(null);
		}

		marker.value = new Marker({
			map: props.map,
			position: {
				lat: props.vehicle.latest_device_point.lat,
				lng: props.vehicle.latest_device_point.lng,
			},
			icon: getMarkerIcon(props.vehicle),
			title: props.vehicle.display_name,
		});

		infoWindow.value = new props.google.maps.InfoWindow({
			content: `
                <div class="info-window" style="padding: 8px;">
                    <h3 style="margin: 0 0 8px 0;">${
											props.vehicle.display_name
										}</h3>
                    <p style="margin: 4px 0;">Status: ${
											props.vehicle.online ? "Online" : "Offline"
										}</p>
                    <p style="margin: 4px 0;">Speed: ${
											props.vehicle.latest_device_point.device_point_detail
												.speed.display
										}</p>
                    <p style="margin: 4px 0; font-size: 0.9em;">Last Updated: ${new Date(
											props.vehicle.latest_device_point.dt_tracker
										).toLocaleString()}</p>
                </div>
            `,
		});

		marker.value.addListener("click", () => {
			infoWindow.value.open(props.map, marker.value);
		});
	} catch (error) {
		console.error("Error creating marker:", error);
	}
};

onMounted(() => {
	console.log("Mounting marker for vehicle:", props.vehicle.device_id);
	createMarker();
});

onBeforeUnmount(() => {
	console.log("Unmounting marker for vehicle:", props.vehicle.device_id);
	if (marker.value) {
		console.log("Removing marker from map");
		marker.value.setMap(null);
	}
	if (infoWindow.value) {
		infoWindow.value.close();
	}
});

// Watch for position updates
watch(
	() => props.vehicle.latest_device_point,
	(newPoint) => {
		if (marker.value && newPoint) {
			marker.value.setPosition({
				lat: newPoint.lat,
				lng: newPoint.lng,
			});
			marker.value.setIcon(getMarkerIcon(props.vehicle));
		}
	},
	{ deep: true }
);
</script>

<template>
	<div style="display: none"></div>
</template>
