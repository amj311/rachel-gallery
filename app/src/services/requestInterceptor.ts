import { AuthService } from "./authService";
import request from "./request";
import axios from "axios";

let serverHost = '';

async function discoverHost() {
	if (process.env.NODE_ENV === 'development') {
		serverHost = 'http://localhost:5000';
	}
	else {
		console.log("LOADING IP ADDRESS")
		const res = await axios.get('http://104.37.250.80:31513');
		console.log(res.data);
		serverHost = res.data;
	}
}

request.interceptors.request.use(async (config) => {
	// Find base url
	if (!serverHost) {
		await discoverHost();
	}

	const token = await AuthService.getToken();
	if (token) {
		config.headers.Authorization = token;
	}
	return config;
});

request.interceptors.response.use(null, (error) => {
	
	if (error.isAxiosError && error.response?.status === 401) {
		console.log("Received unauthenticated response. Logging out");
		AuthService.signOut();
	}
})

export default request;