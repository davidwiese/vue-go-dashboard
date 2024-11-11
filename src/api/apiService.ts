// apiService.ts handles all HTTP communication with the backend
// It provides a centralized interface for data fetching and error handling

import axios from "axios";

// Environment-aware API URL configuration
const API_BASE_URL = import.meta.env.PROD
	? "https://trackifyfleet.pro/api"
	: "http://localhost:5000";

// Interfaces
interface APIError {
	message: string;
	status?: number;
}

interface PreferencePayload {
	device_id: string;
	client_id: string;
	display_name: string;
	is_hidden: boolean;
	sort_order: number;
}

// Fetch user preferences for vehicles
// Used by HomeView to initialize vehicle display settings
export const getPreferences = async (clientId: string) => {
	try {
		const response = await axios.get(`${API_BASE_URL}/preferences`, {
			params: { client_id: clientId },
		});
		return response.data;
	} catch (error) {
		// Type guard to handle Axios-specific errors
		if (axios.isAxiosError(error)) {
			throw {
				message: error.response?.data || "Failed to fetch preferences",
				status: error.response?.status,
			};
		}
		throw { message: "Unknown error occurred" };
	}
};

// Save or update a single vehicle preference
// Called when user modifies individual vehicle settings
export const savePreference = async (preference: PreferencePayload) => {
	try {
		const response = await axios.post(
			`${API_BASE_URL}/preferences`,
			preference
		);
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw {
				message: error.response?.data || "Failed to save preference",
				status: error.response?.status,
			};
		}
		throw { message: "Unknown error occurred" };
	}
};

// Batch update multiple vehicle preferences
// Used for bulk operations like "Show All" or "Hide All"
export const savePreferencesBatch = async (
	preferences: PreferencePayload[]
) => {
	try {
		const response = await axios.post(
			`${API_BASE_URL}/preferences/batch`,
			preferences // Send the array directly
		);
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw {
				message: error.response?.data || "Failed to save preferences",
				status: error.response?.status,
			};
		}
		throw { message: "Unknown error occurred" };
	}
};
