import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

interface PreferencePayload {
	device_id: string;
	client_id: string;
	display_name: string;
	is_hidden: boolean;
	sort_order: number;
	speed_unit: "mph" | "km/h";
	distance_unit: "miles" | "kilometers";
	temperature_unit: "F" | "C";
}

export const getPreferences = async (clientId: string) => {
	try {
		const response = await axios.get(`${API_BASE_URL}/preferences`, {
			params: { client_id: clientId },
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching preferences:", error);
		throw error;
	}
};

export const savePreference = async (preference: PreferencePayload) => {
	try {
		const response = await axios.post(`${API_BASE_URL}/preferences`, payload);
		return response.data;
	} catch (error) {
		console.error("Error saving preference:", error);
		throw error;
	}
};

export const savePreferencesBatch = async (payloadArray) => {
	try {
		const response = await axios.post(`${API_BASE_URL}/preferences/batch`, {
			preferences: payloadArray,
		});
		return response.data;
	} catch (error) {
		console.error("Error saving preferences batch:", error);
		throw error;
	}
};
