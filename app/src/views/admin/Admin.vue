<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
// import AdminMenu from './AdminMenu.vue'
import { useUserStore } from '@/stores/user.store';
import LoginForm from '@/components/LoginForm.vue';
import UploaderWindow from './uploader/UploaderWindow.vue';
import NavBar from '@/components/NavBar.vue';

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
	<NavBar>
		<div>ghj dghj</div>
	</NavBar>

	<div class="px-4 pb-4"><RouterView /></div>
</template>

<style>
#main {
	background-color: white;
}

.about {
	color: white;
}
</style>