<script setup lang="ts">
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
		<div class="nav-bar">
			<h2>r.florence.photo</h2>
			<RouterLink to="/admin" v-if="isAdmin">Admin</RouterLink>
			<div class="flex-grow-1"></div>
			<UserMenu />
		</div>

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