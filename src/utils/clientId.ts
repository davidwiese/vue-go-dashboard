export const getClientId = (): string => {
	let clientId = localStorage.getItem("clientId");
	if (!clientId) {
		clientId =
			"client_" +
			Math.random().toString(36).substring(2) +
			Date.now().toString(36);
		localStorage.setItem("clientId", clientId);
	}
	return clientId;
};
