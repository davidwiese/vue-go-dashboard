const CLIENT_ID_KEY = "fleet_tracker_client_id";

export const getClientId = (): string => {
	let clientId = localStorage.getItem(CLIENT_ID_KEY);

	if (!clientId) {
		// Generate a more structured ID with prefix and timestamp
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 10);
		clientId = `ft_${timestamp}_${random}`;

		try {
			localStorage.setItem(CLIENT_ID_KEY, clientId);
		} catch (error) {
			console.warn("Failed to save client ID to localStorage:", error);
			// Fallback to in-memory ID if localStorage is unavailable
			return clientId;
		}
	}

	return clientId;
};
