<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
// import AdminMenu from './AdminMenu.vue'
import { reactive } from 'vue';
import { useUserStore } from '@/stores/user.store';
import LoginForm from '@/components/LoginForm.vue';
import request from '@/services/request';
import UploaderWindow from './uploader/UploaderWindow.vue';

const router = useRouter();

// const state = reactive({
// 	showSidePanel: false
// });

const userStore = useUserStore();
if (!userStore.hasLoadedSessionData) {
	userStore.loadSessionData();
}

// if (userStore.currentUser) {
// 	const redirect = new URL(window.location.href).searchParams.get('redirect');
// 	useIonRouter().push(redirect || '/');
// }

</script>


<template>
	<div v-if="!userStore.hasLoadedSessionData">Loading...</div>
	<div v-else-if="!userStore.currentUser?.isAdmin">
		<p>Please log in as an admin to proceed.</p>
		<p><LoginForm /></p>
	</div>
	<div v-else>
		<RouterView />
		<UploaderWindow />
	</div>
</template>

<style>
#main {
	background-color: white;
}

.about {
	color: white;
}
</style>