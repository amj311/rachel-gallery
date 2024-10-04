<script setup lang="ts">
import Button from 'primevue/button';
import NavBar from '@/components/NavBar.vue';

</script>


<template>
	<NavBar>
		<div class="flex justify-content-end align-items-center gap-3">
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/my-galleries">Your Galleries</RouterLink>
			<Button severity="primary" size="small" @click="$router.push('/inquiry')">Schedule a session</Button>
		</div>
	</NavBar>
	<div class="px-4 mb-5">
		<slot />
	</div>
</template>

<style scoped>
</style>