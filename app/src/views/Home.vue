<script setup lang="ts">
import { usePortfolioStore } from '@/stores/portfolio.store';
import { useUserStore } from '@/stores/user.store';
import { computed, onBeforeMount, onUnmounted, reactive } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import PortfolioPhotoWall from '@/components/portfolio/PortfolioPhotoWall.vue';
import PortfolioCarousel from '@/components/portfolio/PortfolioCarousel.vue';
import PortfolioText from '@/components/portfolio/PortfolioTextGrid.vue';
import { useAppStore } from '@/stores/app.store';
import HomeNav from './HomeNav.vue';

const userStore = useUserStore();
const portfolioStore = usePortfolioStore();

const isMobile = computed(() => useAppStore().isMobile);

onBeforeMount(async () => {
	if (!portfolioStore.portfolio) {
		await portfolioStore.loadPortfolio();
	}
	computeLinkPlacement();
})

const sectionComponents = {
	'photo-wall': PortfolioPhotoWall,
	'carousel': PortfolioCarousel,
	'text': PortfolioText,
}

const links = computed(() => {
	const links = portfolioStore.portfolio?.sections.reduce((links, s, i) => {
		if (s.anchorText) links.push({
			label: s.anchorText,
			section: s,
		});
		return links;
	}, []) ?? [];

	links.push({
		label: 'Client Access',
		to: '/admin',
	});

	return links;
})

const state = reactive({
	leftLinks: [] as any[],
	rightLinks: [] as any[],
	menuLinks: [] as any[],
	showMenu: false,
})

function computeLinkPlacement() {
	if (!portfolioStore.portfolio) return;
	const minWidth = 100;
	const logoEl = document.querySelector('.logo');
	const logoWidth = logoEl?.getBoundingClientRect().width ?? 0;
	const linkArea = window.innerWidth - logoWidth;
	const visibleLinks = [...links.value];
	const maxLinks = Math.floor(linkArea / minWidth);
	let otherLinks;

	if (visibleLinks.length === 0) return;

	// If we have more links than we can fit, move the rest to the dropdown
	if (maxLinks < links.value.length) {
		let splitIdx = maxLinks - 1; // include the last visible to replace it with dropdown
		if (splitIdx % 2 === 0) splitIdx -= 1;
		if (splitIdx === 1) splitIdx = 0;
		splitIdx = Math.max(0, splitIdx);
		otherLinks = visibleLinks.splice(splitIdx, links.value.length);
	}

	// divide visible links into two groups, favoring the left
	const splitIdx = Math.ceil(visibleLinks.length / 2);
	const left = visibleLinks.slice(0, splitIdx);
	const right = visibleLinks.slice(splitIdx);

	state.leftLinks = left;
	state.rightLinks = right;
	state.menuLinks = otherLinks;
}

onBeforeMount(() => {
	computeLinkPlacement();
	window.addEventListener('resize', computeLinkPlacement);
})
onUnmounted(() => {
	window.removeEventListener('resize', computeLinkPlacement);
})

function sectionElId(section) {
	return `section-${section.id}`
}

function goToSection(section) {
	const el = document.getElementById(sectionElId(section));
	console.log(el)
	el?.scrollIntoView({ behavior: 'smooth' });
}

</script>

<template>
	<div class="home">
		<HomeNav />

		<div v-for="(section, index) in portfolioStore.portfolio?.sections" :key="section.id" :id="sectionElId(section)">
			<component :is="sectionComponents[section.type]" v-model="portfolioStore.portfolio!.sections[index]" />
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

.home {
	position: relative;
}
.nav-wrapper {
	top: 0;
	left: 0;
	right: 0;
	z-index: 1;
	padding: 1.25em 0;
	background: #fff;
	/* background: linear-gradient(to bottom, #ffffff 66%, rgba(0,0,0,0) 100%); */

	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	position: relative;
}

.logo {
	text-align: center;
	font-family: serif;
	font-size: 1.2em;
	letter-spacing: .3em;
	margin-top: -2.5em;
	margin-bottom: -4em;
	background: #fff;
	padding: .5em;
	z-index: 1;
	position: relative;

	.logo-inner {
		border: 1px solid $primary;
		padding: 1em 2em;
	}

	.logo-cursive {
		color: $primary;
		font-family: 'Parisienne', cursive;
		font-size: 1.8em;
		line-height: .5;
		letter-spacing: normal;
	}
}

.link-side {
	display: flex;
	justify-content: space-evenly;
}


.link {
	// font-family: serif;
	text-transform: uppercase;
	font-size: .8em;
	text-align: center;
	user-select: none;
	cursor: pointer;
	padding: .5em 0;
	border-bottom: 1px solid transparent;

	&:hover {
		border-bottom-color: $primary;
	}
}

.dropdown-menu {
	max-height: 0px;
	height: auto;
	position: absolute;
	top: 100%;
	right: 0;
	background: #fff;
	z-index: 0;
	overflow: hidden;
	box-sizing: border-box;
	min-width: 25vw;

	&.show {
		transition: max-height 1s ease-in-out;
		max-height: 100vh;
	}

	&.mobile {
		min-width: 100vw;
	}

	&.mobile.show {
		padding-top: 1em;
	}
}

</style>