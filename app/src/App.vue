<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { useUserStore } from './stores/user.store';
import Toast from 'primevue/toast';
import watermarkImage from '@/assets/images/watermark.png'
import { onBeforeUnmount } from 'vue';
import { ref } from 'vue';
import LoadSplash from './components/LoadSplash.vue';
import { computed } from 'vue';
import LoginModal from './components/LoginModal.vue';
import { useAppStore } from './stores/app.store';

const userStore = useUserStore();
const sessionInterval = setInterval(userStore.loadSessionData, 60000);

const waitingForAuth = ref(true);
setTimeout(() => {
	waitingForAuth.value = false;
}, 1000); // wait for 1 second before showing the app

onBeforeUnmount(() => {
	clearInterval(sessionInterval);
});

const isDev = computed(() => {
	return process.env.NODE_ENV === 'development';
})

const showLogin = ref(false);

</script>


<template>
	<LoadSplash v-if="waitingForAuth || !userStore.hasLoadedSessionData" />
	<div v-else :class="{ mobile: useAppStore().isMobile }">
		<section><RouterView /></section>
		<Toast></Toast>
		<footer>
			<div class="text-center flex-inline flex-column align-items-center gap-3">
				<template v-if="!userStore.isLoggedIn">
					<div>Returning client?</div>
					<a class="text-link font-bold" @click="showLogin = true">Sign In</a>
				</template>
				<template v-else>
					<div class="font-bold">Hello, {{ userStore.currentUser?.givenName }}!</div>
					<div class="flex flex-wrap column-gap-3 justify-content-center">
						<RouterLink v-if="userStore.currentUser?.isClient" class="text-link" to="/my-galleries">Your Galleries</RouterLink>
						<RouterLink v-if="userStore.currentUser?.isAdmin" class="text-link" to="/admin">Admin</RouterLink>
					</div>
					<RouterLink class="text-link" to="/logout">Sign Out</RouterLink>
				</template>
			</div>
			<div class="justify-content-center"><RouterLink to="/"><img :src="watermarkImage" width="150" height="150" /></RouterLink></div>
			<div class="text-center flex-inline flex-column align-items-center gap-3">
				<div>Photos by Rachel Florence Photo</div>
				<div class="flex align-items-center justify-content-center gap-2"><i class="pi pi-instagram"></i> <a class="text-link font-bold" href="https://www.instagram.com/r.florencephoto/" target="_blank">@r.florencephoto</a></div>
				<div><i class="fa fa-copyright"></i> {{ new Date().getFullYear() }} All Rights Reserved</div>
			</div>
		</footer>

		<LoginModal v-if="showLogin" :closeable="true" @close="showLogin = false" />
	</div>

	<div class="dev-banner" v-if="isDev">
		You are in DEV MODE. Have fun!
	</div>
</template>


<style scoped lang="scss">
section {
	min-height: calc(100vh - 17rem);
}

footer {
	background: #ece6de;
	padding: 5rem 2rem;

	> div {
		width: 33%;
		box-sizing: border-box;
		display: inline-flex;
		vertical-align: middle;
	}

	.text-link {
		color: inherit !important;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}
}


.mobile {
	footer > div {
		display: flex;
		width: 100%;
		padding: 2rem;
	}
}

.dev-banner {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #0a0;
	text-align: center;
	color: #fff;
	padding: 5px;
	font-size: .8em;
	z-index: 1000;

	&:hover {
		opacity: 0;
	}
}

</style>