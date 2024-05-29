import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import { AuthService } from '@/services/authService';

export const useUserStore = defineStore('user', () => {
	const hasLoadedSessionData = ref(false);
	const loginError = ref<String>('');
	const isLoggedIn = ref(false);
	const currentUser = ref<any>();
	const session = ref<any>();
	const isLoading = ref(false);

	const loadSessionData = async () => {
		const authUser = AuthService.authUser;
		if (!authUser) {
			isLoggedIn.value = false;
			currentUser.value = null;
			hasLoadedSessionData.value = true;
			isLoading.value = false;
			return;
		}
		try {
			isLoading.value = true;
			isLoggedIn.value = Boolean(authUser);
			if (!isLoggedIn.value) {
				currentUser.value = null;
				return;
			}
			const { data } = await request.get('user/session');
			currentUser.value = data.data;
			session.value = data;
			loginError.value = '';
		}
		catch (e) {
			console.log('ERROR LOADING AUTH USER')
			console.log(e);
			loginError.value = 'Failed to load user';
		}
		finally {
			hasLoadedSessionData.value = true;
			isLoading.value = false;
		}
	};

	AuthService.onLogInOrOut = () => {
		loadSessionData();
	};
 
	const createUser = async (newUser) => {
		if (!isLoggedIn.value) {
			throw Error("There is no active session");
		}
		if (currentUser.value) {
			throw Error("There is already a user for this session");
		}
		const { data } = await request.post('user/create-account', {
			...newUser,
			auth_id: AuthService.authUser?.uid,
			email: AuthService.authUser?.email
		});
		currentUser.value = data.data;
	};

	return {
		hasLoadedSessionData,
		isLoggedIn,
		loginError,
		currentUser,
		session,
		createUser,
		loadSessionData,
		isLoading,
	};
});
