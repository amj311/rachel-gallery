<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
import PhotoWall from '@/components/PhotoWall.vue';
import UserMenu from '@/components/UserMenu.vue';
import { usePortfolioStore } from '@/stores/portfolio.store';
import { useUserStore } from '@/stores/user.store';
import { computed, onBeforeMount } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const userStore = useUserStore();
const portfolioStore = usePortfolioStore();

onBeforeMount(async () => {
	if (!portfolioStore.portfolio) {
		await portfolioStore.loadPortfolio();
	}
})

</script>

<template>
	<div>
		<NavBar />

		<div class="px-5">
			<div v-for="section in portfolioStore.portfolio?.sections" :key="section.id">
			<div class="section-header">{{ section.name }}</div>
			<PhotoWall :photos="section.photos" />
		</div>
			
		</div>

		<!-- <div class="px-4 pb-4"><RouterView /></div> -->
	</div>
</template>

<style scoped>


.section-header {
	font-size: 1.2rem;
	margin: 7em 0 4em;
	text-align: center;
	text-transform: uppercase;
	font-family: "serif";
	letter-spacing: .1em;
}
</style>