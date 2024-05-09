<script setup lang="ts">
import { useUserStore } from '../stores/user.store';
import { AuthService } from '../services/authService';
import { reactive } from 'vue';

const userStore = useUserStore();

const state = reactive({
	email: '',
	password: '',
	showPassword: false
});

// if (userStore.currentUser) {
// 	const redirect = new URL(window.location.href).searchParams.get('redirect');
// 	useIonRouter().push(redirect || '/');
// }

</script>


<template>
	<div>
		<h1>Login</h1>

		<div v-if="userStore.loginError" class="bg-white border-round-3xl m-3">
			{{ userStore.loginError }}
		</div>

		<div>
			<input type="text" v-model="state.email" placeholder="Email" />
		</div>
		<div>
			<input v-model="state.password" placeholder="Password" :type="state.showPassword ? 'text' : 'password'"/>
		</div>
		<div>
			<button @click="AuthService.signInWithEmail(state.email, state.password)">Login</button>
		</div>

		<button @click="AuthService.signInWithGoogle()">Sign in with Google</button>
	</div>
</template>


<style scoped>
.login {
	text-align: center;
	padding-top: 5em;
}
</style>