<script setup lang="ts">
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useAppStore } from '@/stores/app.store';
import Button from 'primevue/button';
import { defineComponent, onBeforeUnmount, watch } from 'vue';
import { ref } from 'vue';
import { computed, onMounted, reactive } from 'vue';

const speeds = {
	'Fast': 5000,
	'Slow': 10000,
}

const PaneComponent = defineComponent({
	name: 'PaneComponent',
	components: {
		// eslint-disable-next-line vue/no-unused-components
		PhotoFrame,
	},
	props: {
		pane: Object,
		backgroundImage: Object,
	},
	template: /*html*/ `
		<div class="pane" :style="{ 'background-color': pane.backgroundColor || '#fff' }">
			<div v-if="backgroundImage" class="backdrop" :style="{ 'opacity': pane.backgroundOpacity / 100 || '1' }">
				<div class="photo-frame">
					<PhotoFrame :key="backgroundImage.id" :photo="backgroundImage" :size="'xl'" :fillMethod="'cover'" :position="pane.focalPoint" />
				</div>
			</div>
			<div class="text"><div class="section-max-width"><div class="pr-8">{{ pane.text }}</div></div></div>
		</div>
	`,
})


const section = defineModel<any>();
const panes = computed(() => section.value.attributes.panes);
const props = defineProps<{
	editMode?: boolean,
}>();

const carousel = ref<HTMLDivElement>();

const state = reactive({
	activePaneIdx: 0,
	playingTimer: 0,
	animationClass: '',
	isSkinny: false,
});

const activePane = computed(() => panes.value[state.activePaneIdx]);
const isPlaying = computed(() => state.playingTimer !== 0);
const nextPane = computed(() => panes.value[(state.activePaneIdx + 1) % panes.value.length]);
const prevPane = computed(() => panes.value[(state.activePaneIdx - 1 + panes.value.length) % panes.value.length]);

const initialScroll = window.scrollY;

onMounted(async () => {
	carousel.value!.addEventListener('keydown', handleKeydown);
	carousel.value!.addEventListener('touchstart', handleTouchStart);
	carousel.value!.addEventListener('touchmove', handleTouchMove);
	carousel.value!.addEventListener('touchend', handleTouchEnd);
	carousel.value!.addEventListener('scroll', preventScroll);

	play();
	computeSkinny();
})

watch(computed(() => useAppStore().emulateWindowResize), () => {
	computeSkinny();
})


function computeSkinny() {
	state.isSkinny = carousel.value!.clientWidth < 600;
}


const animationTime = 500;
let lastUiSwapTime = 0;

function uiSwap(action) {
	const now = Date.now();
	const doAnimate = now - lastUiSwapTime > animationTime;
	lastUiSwapTime = now;
	action(doAnimate);
}

async function goToNext(animate = true) {
	if (animate && section.value.attributes.animation !== 'None') {
		state.animationClass = 'transitionNext';
		await new Promise(r => setTimeout(r, animationTime));
	}
	if (panes.value?.length) {
		state.activePaneIdx = (state.activePaneIdx + 1) % panes.value.length;
	}
	else {
		state.activePaneIdx = 0;
	}
	resetAfterSwap();
}

async function goToPrev(animate = true) {
	if (animate && section.value.attributes.animation !== 'None') {
		state.animationClass = 'transitionPrev';
		await new Promise(r => setTimeout(r, animationTime));
	}
	if (panes.value?.length) {
		state.activePaneIdx = (state.activePaneIdx - 1 + panes.value.length) % panes.value.length;
	}
	else {
		state.activePaneIdx = 0;
	}
	resetAfterSwap();
}

function resetAfterSwap() {
	state.animationClass = '';
	// start and sto to reset time
	if (isPlaying.value) {
		stop();
		play();
	}
	updateSwipeDelta(0);
	swipeStartX = 0;
}

function play() {
	// This can be a timeout instead of an interval because goToNext calls play again
	state.playingTimer = setTimeout(goToNext, speeds[section.value.attributes.speed]) as any;
}
function stop() {
	clearTimeout(state.playingTimer);
	state.playingTimer = 0;
}

function handleKeydown(e) {
	if (e.key === 'ArrowRight') {
		e.preventDefault();
		uiSwap(goToNext);
	}
	else if (e.key === 'ArrowLeft') {
		e.preventDefault();
		uiSwap(goToPrev);
	}
	else if (e.key === 'ArrowUp') {
		e.preventDefault();
		uiSwap(goToPrev);
	}
	else if (e.key === 'ArrowDown') {
		e.preventDefault();
		uiSwap(goToNext);
	}
	else if (e.key === ' ' && !isPlaying.value) {
		e.preventDefault();
		play();
	}
	else if (e.key === ' ' && isPlaying.value) {
		e.preventDefault();
		stop();
	}
}

let swipeStartX = 0;

function updateSwipeDelta(val) {
	document.documentElement.style.setProperty('--swipe-delta', val + 'px');
}

function handleTouchStart(e) {
	swipeStartX = e.touches[0].clientX;
}
function handleTouchMove(e) {
	updateSwipeDelta(e.touches[0].clientX - swipeStartX);
}
function handleTouchEnd(e) {
	const swipeEndX = e.changedTouches[0].clientX;
	if (swipeStartX - swipeEndX > 100) {
		uiSwap(goToNext);
	} else if (swipeEndX - swipeStartX > 100) {
		uiSwap(goToPrev);
	} else {
		updateSwipeDelta(0);
	}
}

function preventScroll(e) {
	window.scroll({
		top: initialScroll,
		left: 0,
		behavior: 'instant',
	});
}

onBeforeUnmount(() => {
	clearTimeout(state.playingTimer);
	window.removeEventListener('keydown', handleKeydown);
	window.removeEventListener('touchstart', handleTouchStart);
	window.removeEventListener('touchmove', handleTouchMove);
	window.removeEventListener('touchend', handleTouchEnd);
	window.removeEventListener('scroll', preventScroll);
});

</script>

<template>
	<div ref="carousel" class="carousel-wrapper" :class="{ 'skinny': state.isSkinny }" :style="{ 'background-color': section.attributes.backgroundColor || '#fff' }">
		<div class="spreader" />
		<div class="content">
			<div v-if="panes.length === 0 && props.editMode" class="flex flex-column justify-content-center align-items-center h-full">
				<i class="material-symbols-outlined text-7xl text-gray-400">overview_key</i>
				Use the editor panel to add panes
			</div>
			<div v-else class="panes-wrapper" :class="{ [state.animationClass]: true, ['animate-' + section.attributes.animation]: true }">
				<div class="prev" v-if="section.attributes.animation !== 'None'">
					<PaneComponent :key="prevPane.id" :pane="prevPane" :backgroundImage="section.photos.find(p => p.id === prevPane.backgroundPhotoId)" />
				</div>
				<div class="active">
					<PaneComponent :key="activePane.id" :pane="activePane" :backgroundImage="section.photos.find(p => p.id === activePane.backgroundPhotoId)" />
				</div>
				<div class="next" v-if="section.attributes.animation !== 'None'">
					<PaneComponent :key="nextPane.id" :pane="nextPane" :backgroundImage="section.photos.find(p => p.id === nextPane.backgroundPhotoId)" />
				</div>
			</div>

			<div class="controls-wrapper">
				<div class="controls section-max-width text-right" v-if="section.attributes.showControls && panes.length > 1 && !state.isSkinny">
					<Button text @click="() => goToPrev()" icon="pi pi-chevron-left" />
					<Button text @click="() => goToNext()" icon="pi pi-chevron-right" />
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
@import './portfolio.scss';

:root {
	--swipe-delta: 0px;
}

.carousel-wrapper {
	width: 100%;
	position: relative;

	.spreader {
		width: 100%;
		padding-top: min(max(60vh, 60%), 80vh);
		overflow: hidden;
		pointer-events: none;
	}

	.content {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}


	.panes-wrapper {
		position: relative;
		height: 100%;
		width: 100%;
		overflow: hidden;

		> div {
			position: absolute;
			width: 100%;
			height: 100%;
		}

		// SLIDE ANIMATION
		&.animate-Slide {
			.prev {
				transform: translateX(calc(-100% + var(--swipe-delta)));
			}

			.next {
				transform: translateX(calc(100% + var(--swipe-delta)));
			}

			.active {
				transform: translateX(var(--swipe-delta));
			}

			&.transitionNext {
				.next {
					transform: translateX(0);
					transition: 500ms ease;
				}

				.active {
					transform: translateX(-100%);
					transition: 500ms ease;
				}
			}

			&.transitionPrev {
				.prev {
					transform: translateX(0);
					transition: 500ms ease;
				}

				.active {
					transform: translateX(100%);
					transition: 500ms ease;
				}
			}
		}


		// FADE ANIMATION
		&.animate-Fade {
			.prev, .next {
				opacity: 0;
			}

			.active {
				opacity: 1;
			}


			&.transitionNext {
				.next {
					opacity: 1;
					transition: 800ms linear;
				}

				.active {
					opacity: 0;
					transition: 100ms linear;
				}
			}

			&.transitionPrev {
				.prev {
					opacity: 1;
					transition: 800ms linear;
				}

				.active {
					opacity: 0;
					transition: 100ms linear;
				}
			}
		}
	}
}

.panes-wrapper .pane {
	position: relative;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;

	.backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		.photo-frame {
			position: absolute;
			width: 100%;
			height: 100%;

			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
		}
	}

	.text {
		position: absolute;
		bottom: 3rem;
		left: 0;
		right: 0;
		color: #fff;
		z-index: 1;
		font-size: 2rem;
		font-family: 'serif';
		font-weight: 400;
		text-shadow: 0 0 4px #0008;
		line-height: 1.2;
	}
}

.carousel-wrapper.skinny .pane .text {
	width: 100%;
	text-align: center;
}

.controls-wrapper {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 3rem;
	z-index: 1;

	.p-button {
		color: #fff;
		text-shadow: 0 0 4px #0008;
	}
}
</style>