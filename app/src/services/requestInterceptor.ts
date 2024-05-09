import { AuthService } from "./authService";
import request from "./request";

request.interceptors.request.use(async (config) => {
	const token = await AuthService.getToken();
	if (token) {
		config.headers.Authorization = token;
	}
	return config;
});

request.interceptors.response.use(null, (error) => {
	AuthService.info.push("SERVER ERROR: " + error.message);
	if (error.isAxiosError && error.response?.status === 401) {
		console.log("Received unauthenticated response. Logging out");
		AuthService.signOut();
	}
})

export default request;