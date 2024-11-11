// clientId.ts manages unique client identification
// Used for tracking preferences and WebSocket connections

const CLIENT_ID_KEY = "fleet_tracker_client_id";

// Generate or retrieve persistent client identifier
export const getClientId = (): string => {
	// Try to get existing ID from localStorage
	let clientId = localStorage.getItem(CLIENT_ID_KEY);

	if (!clientId) {
		// Generate new structured ID if none exists
		// Format: ft_[timestamp]_[random]
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 10);
		clientId = `ft_${timestamp}_${random}`;

		try {
			// Persist the ID
			localStorage.setItem(CLIENT_ID_KEY, clientId);
		} catch (error) {
			console.warn("Failed to save client ID to localStorage:", error);
			// Provide in-memory fallback for private browsing
			return clientId;
		}
	}

	return clientId;
};
