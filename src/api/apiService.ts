import axios from "axios";

const API_BASE_URL = import.meta.env.PROD
	? "https://gobackend-env.eba-cpaytf92.us-west-1.elasticbeanstalk.com"
	: "http://localhost:5000";

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

export const getPreferences = async (clientId: string) => {
	try {
		const response = await axios.get(`${API_BASE_URL}/preferences`, {
			params: { client_id: clientId },
		});
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw {
				message: error.response?.data || "Failed to fetch preferences",
				status: error.response?.status,
			};
		}
		throw { message: "Unknown error occurred" };
	}
};

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

export const savePreferencesBatch = async (
	preferences: PreferencePayload[]
) => {
	try {
		console.log("Sending batch update:", preferences); // Debug log
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
