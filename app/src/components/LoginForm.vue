<script setup lang="ts">
import { useUserStore } from '../stores/user.store';
import { AuthService } from '../services/authService';
import { reactive } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const userStore = useUserStore();

const state = reactive({
	givenName: '',
	familyName: '',
	email: '',
	password: '',
	showPassword: false,
	isLoading: false,
});

// if (userStore.currentUser) {
// 	const redirect = new URL(window.location.href).searchParams.get('redirect');
// 	useIonRouter().push(redirect || '/');
// }

async function loginWithEmail() {
	try {
		await AuthService.signInWithEmail(state.email, state.password);
	}
	catch (error: any) {
		userStore.loginError = error.message;
	}
}
async function loginWithGoogle() {
	try {
		await AuthService.signInWithGoogle();
	}
	catch (error: any) {
		userStore.loginError = error.message;
	}
}

</script>


<template>
	<div class="flex flex-column gap-2 align-items-center" style="width: 15em">
		<div v-if="userStore.loginError" class="bg-white border-round-3xl m-3">
			{{ userStore.loginError }}
		</div>

		<div class="flex flex-column gap-1 w-full align-items-center">
			<InputText type="text" v-model="state.email" placeholder="Email" size="small" class="w-full" />
			<InputText v-model="state.password" placeholder="Password" :type="state.showPassword ? 'text' : 'password'"  size="small" class="w-full" />
			<Button @click="loginWithEmail" class="w-full justify-content-around">Sign in</button>
			<small>New here? <a href="/signup">Sign up</a></small>
		</div>

		<div>or</div>

		<Button @click="loginWithGoogle" outlined class="w-full justify-content-between gap-2"><i class="pi pi-google" /><div class="flex-grow-1 text-align-center">Sign in with Google</div></button>
	</div>
</template>


<style scoped>
.login {
	text-align: center;
	padding-top: 5em;
}
</style>