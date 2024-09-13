<script setup lang="ts">
import NavBar from '@/components/NavBar.vue';
import { usePortfolioStore } from '@/stores/portfolio.store';
import { useUserStore } from '@/stores/user.store';
import { computed, onBeforeMount } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import PortfolioPhotoWall from '@/components/portfolio/PortfolioPhotoWall.vue';
import PortfolioCarousel from '@/components/portfolio/PortfolioCarousel.vue';
import PortfolioText from '@/components/portfolio/PortfolioText.vue';

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
	'text': PortfolioText,
}

</script>

<template>
	<div>
		<NavBar />

		<div v-for="(section, index) in portfolioStore.portfolio?.sections" :key="section.id">
			<component :is="sectionComponents[section.type]" v-model="portfolioStore.portfolio!.sections[index]" />
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