<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
import UserMenu from '@/components/UserMenu.vue';
import { useUserStore } from '@/stores/user.store';
import { computed } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const userStore = useUserStore();

const isAdmin = computed(() => {
	return userStore.currentUser?.isAdmin;
});

</script>

<template>
	<div>
		<NavBar />

		<div class="px-4 pb-4"><RouterView /></div>
	</div>
</template>

<style scoped>
.nav-bar {
	position: sticky;
	top: 0;
	display: flex;
	gap: 1em;
	align-items: center;
	z-index: 10;
	background-color: #fffd;
	backdrop-filter: blur(10px);
	padding: 1em;
}
</style>