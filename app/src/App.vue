<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/user.store';
import Toast from 'primevue/toast';
import watermarkImage from '@/assets/images/watermark.png'
import { computed, onMounted } from 'vue';
import { onBeforeUnmount } from 'vue';
import { ref } from 'vue';
import LoadSplash from './components/LoadSplash.vue';
import { useAppStore } from './stores/app.store';

const appStore = useAppStore();
const userStore = useUserStore();
const sessionInterval = setInterval(userStore.loadSessionData, 60000);

const waitingForAuth = ref(true);
setTimeout(() => {
	waitingForAuth.value = false;
}, 1000); // wait for 1 second before showing the app

onBeforeUnmount(() => {
	clearInterval(sessionInterval);
});


</script>


<template>
	<LoadSplash v-if="waitingForAuth || !userStore.hasLoadedSessionData" />
	<div v-else>
		<RouterView />
		<Toast></Toast>
		<footer class="flex align-items-top flex-wrap justify-content-center gap-8 p-8">
			<img :src="watermarkImage" width="100" />
			<div class="flex-grow-1 flex flex-column gap-3 text-center">
				<div>Photos by Rachel Florence Photo</div>
				<div class="flex align-items-center justify-content-center gap-2"><i class="pi pi-instagram"></i> <a href="https://www.instagram.com/r.florencephoto/" target="_blank">@r.florencephoto</a></div>
				<div><i class="fa fa-copyright"></i> {{ new Date().getFullYear() }} All Rights Reserved</div>
			</div>
		</footer>
	</div>
</template>


<style scoped>
footer {
	background: #ece6de;

	a {
		color: inherit !important;
		text-decoration: none;
		font-weight: bold;
	}
}
</style>