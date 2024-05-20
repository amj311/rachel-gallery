<script setup lang="ts">
import UserMenu from '@/components/UserMenu.vue';
import { useUserStore } from '@/stores/user.store';
import { computed } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const userStore = useUserStore();

</script>

<template>
	<div class="nav-bar">
		<h2>r.florence.photo</h2>
		<div class="flex-grow-1">
			<slot></slot>
		</div>
		<UserMenu />
	</div>
</template>

<style lang="scss">
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

	a {
		text-decoration: none;
		color: #000 !important;

		&.router-link-exact-active {
			border-bottom: 1px solid;
		}
	}
}
</style>