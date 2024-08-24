import axios from "axios";
import { AuthService } from "./authService";
import { useUserStore } from "@/stores/user.store";

const request = axios.create();
let serverHost = '';

async function discoverHost() {
	// if (process.env.NODE_ENV === 'development') {
	// 	serverHost = 'http://localhost:5000/api';
	// }
	// else {
		const res = await axios.get('https://intimate-redbird-eager.ngrok-free.app/', {
			headers: {
				'ngrok-skip-browser-warning': 'true'
			}
		});
		serverHost = 'http://' + res.data + ':31513/api';
	// }
}

request.interceptors.request.use(async (config) => {
	// Find base url
	if (!serverHost) {
		await discoverHost();
	}

	config.baseURL = serverHost;
	if (config.method !== 'options') {
		config.headers.set('X-Target', 'gallery');
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


const loadAuth = async () => {
	try {
		const { data } = await request.get(`${serverHost}/firebase-config`);
		AuthService.setupAuth(data.data);
		useUserStore().loadSessionData();
	}
	catch (e: any) {
		console.log(e);
		console.log("failed to get config")
	}
}
loadAuth();

export default request;