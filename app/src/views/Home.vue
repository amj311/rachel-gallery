<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
import { usePortfolioStore } from '@/stores/portfolio.store';
import { useUserStore } from '@/stores/user.store';
import { computed, onBeforeMount } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import PortfolioPhotoWall from './PortfolioPhotoWall.vue';
import PortfolioCarousel from './PortfolioCarousel.vue';

const userStore = useUserStore();
const portfolioStore = usePortfolioStore();

onBeforeMount(async () => {
	if (!portfolioStore.portfolio) {
		await portfolioStore.loadPortfolio();
	}
})

const sectionComponents = {
	'photo-wall': PortfolioPhotoWall,
	'carousel': PortfolioCarousel,
}

</script>

<template>
	<div>
		<NavBar />

		<div v-for="section in portfolioStore.portfolio?.sections" :key="section.id">
			<component :is="sectionComponents[section.type]" :section="section" />
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