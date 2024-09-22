<script setup lang="ts">
import { usePortfolioStore } from '@/stores/portfolio.store';
import { computed, onBeforeMount, onMounted, reactive, watch } from 'vue';
import { useAppStore } from '@/stores/app.store';

const portfolioStore = usePortfolioStore();

const isMobile = computed(() => useAppStore().isMobile);

onMounted(async () => {
	if (!portfolioStore.portfolio) {
		await portfolioStore.loadPortfolio();
	}
	computeLinkPlacement();
})

const state = reactive({
	leftLinks: [] as any[],
	rightLinks: [] as any[],
	menuLinks: [] as any[],
	showMenu: false,
	navWidth: 0,
})

const isSkinny = computed(() => state.navWidth < 600);

function computeLinkPlacement() {
	if (!portfolioStore.portfolio) return;

	const links = portfolioStore.portfolio?.sections.reduce((links, s) => {
		if (s.anchorText) links.push({
			label: s.anchorText,
			section: s,
		});
		return links;
	}, []) ?? [];

	// links.push({
	// 	label: 'Clients',
	// 	to: '/admin',
	// });

	const minWidth = links.reduce((a, b) => a + b.label.length, 0) * 3.5;
	const logoEl = document.querySelector('.logo');
	const logoWidth = logoEl?.getBoundingClientRect().width ?? 0;
	const navEl = document.querySelector('.home-nav-wrapper');
	const navWidth = navEl?.getBoundingClientRect().width ?? 0;
	state.navWidth = navWidth;
	const linkArea = navWidth - logoWidth;
	const visibleLinks = [...links];
	const maxLinks = Math.floor(linkArea / minWidth);
	let otherLinks;

	if (visibleLinks.length === 0) return;

	// If we have more links than we can fit, move the rest to the dropdown
	if (maxLinks < links.length) {
		let splitIdx = maxLinks - 1; // include the last visible to replace it with dropdown
		if (splitIdx % 2 === 0) splitIdx -= 1;
		if (splitIdx === 1) splitIdx = 0;
		splitIdx = Math.max(0, splitIdx);
		otherLinks = visibleLinks.splice(splitIdx, links.length);
	}

	// divide visible links into two groups, favoring the left
	const splitIdx = Math.ceil(visibleLinks.length / 2);
	const left = visibleLinks.slice(0, splitIdx);
	const right = visibleLinks.slice(splitIdx);

	state.leftLinks = left;
	state.rightLinks = right;
	state.menuLinks = otherLinks;
}

defineExpose({ computeLinkPlacement });

onBeforeMount(() => {
	computeLinkPlacement();
})
watch(computed(() => useAppStore().emulateWindowResize), computeLinkPlacement);
watch(computed(() => JSON.stringify(portfolioStore.portfolio)), computeLinkPlacement);

function sectionElId(section) {
	return `section-${section.id}`
}

function goToSection(section) {
	const el = document.getElementById(sectionElId(section));
	el?.scrollIntoView({ behavior: 'smooth' });
}

</script>

<template>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true">
	<link href="https://fonts.googleapis.com/css2?family=Parisienne&display=swap" rel="stylesheet">

	<div class="home-nav-wrapper">
		<div class="link-side">
			<div v-for="link in state.leftLinks" :key="link.label" class="link" @click="goToSection(link.section)">{{ link.label }}</div>
		</div>
		<div class="logo"><div class="logo-inner">
			<div>RACHEL FLORENCE</div>
			<div class="logo-cursive">Photography</div>
		</div></div>
		<div class="link-side">
			<div v-for="link in state.rightLinks" :key="link.label" class="link" @click="goToSection(link.section)">{{ link.label }}</div>
			<div v-if="state.menuLinks?.length > 0" class="menu link px-3" @click="state.showMenu = !state.showMenu">
				<i v-if="!state.showMenu" class="pi pi-bars text-lg" />
				<i v-else class="pi pi-times text-lg" />
			</div>
		</div>
		<div class="dropdown-menu" :class="{ 'show': state.showMenu, 'skinny': isMobile || isSkinny }" v-if="state.menuLinks?.length > 0" @click="state.showMenu = false">
			<div class="p-4 flex flex-column gap-4 align-items-center">
				<div v-for="link in state.menuLinks" :key="link.label" class="link" @click="goToSection(link.section)">{{ link.label }}</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';
.home-nav-wrapper {
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
	margin-top: -2.25em;
	margin-bottom: -4em;
	background: #fff;
	padding: .5em;
	z-index: 1;
	position: relative;
	user-select: none;

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

	&.skinny {
		min-width: 100%;
	}

	&.skinny.show {
		padding-top: 1em;
	}
}

</style>