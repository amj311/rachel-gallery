<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
// import AdminMenu from './AdminMenu.vue'
import { reactive } from 'vue';
import { useUserStore } from '@/stores/user.store';
import LoginForm from '@/components/LoginForm.vue';
import request from '@/services/request';
import UploaderWindow from './uploader/UploaderWindow.vue';

const router = useRouter();

const userStore = useUserStore();
if (!userStore.hasLoadedSessionData) {
	userStore.loadSessionData();
}

</script>


<template>
	<div>
		<RouterView />
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