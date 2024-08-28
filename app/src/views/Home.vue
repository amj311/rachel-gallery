<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
import UserMenu from '@/components/UserMenu.vue';
import { useUserStore } from '@/stores/user.store';
import { computed } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const userStore = useUserStore();

</script>

<template>
	<div>
		<NavBar />

		<div class="px-4 pb-4"><RouterView /></div>
	</div>
</template>

<style scoped>
</style>