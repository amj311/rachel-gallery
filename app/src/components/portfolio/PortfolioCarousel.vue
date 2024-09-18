<script setup lang="ts">
import PhotoFrame from '@/components/PhotoFrame.vue';
import Button from 'primevue/button';
import { defineComponent, onBeforeUnmount } from 'vue';
import { ref } from 'vue';
import { computed, onMounted, reactive } from 'vue';


const PaneComponent = defineComponent({
	name: 'PaneComponent',
	components: {
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
			<div class="text">{{ pane.text }}</div>
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
})

const animationTime = 500;
let lastUiSwapTime = 0;

function uiSwap(action) {
	const now = Date.now();
	const doAnimate = now - lastUiSwapTime > animationTime;
	lastUiSwapTime = now;
	action(doAnimate);
}

async function goToNext(animate = true) {
	if (animate) {
		state.animationClass = 'slideNext';
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
	if (animate) {
		state.animationClass = 'slidePrev';
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
	state.playingTimer = setTimeout(goToNext, 10000) as any;
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
	<div ref="carousel" class="carousel-wrapper" :style="{ 'background-color': section.attributes.backgroundColor || '#fff' }">
		<div class="spreader" />
		<div class="content">
			<div v-if="panes.length === 0 && props.editMode" class="flex flex-column justify-content-center align-items-center h-full">
				<i class="material-symbols-outlined text-7xl text-gray-400">overview_key</i>
				Use the editor panel to add panes
			</div>
			<div v-else class="panes-wrapper" :class="{ [state.animationClass]: true }">
				<div class="prev">
					<PaneComponent :key="prevPane.id" :pane="prevPane" :backgroundImage="section.photos.find(p => p.id === prevPane.backgroundPhotoId)" />
				</div>
				<div class="active">
					<PaneComponent :key="activePane.id" :pane="activePane" :backgroundImage="section.photos.find(p => p.id === activePane.backgroundPhotoId)" />
				</div>
				<div class="next">
					<PaneComponent :key="nextPane.id" :pane="nextPane" :backgroundImage="section.photos.find(p => p.id === nextPane.backgroundPhotoId)" />
				</div>
			</div>

			<div class="controls">
				<Button text @click="() => goToPrev()" icon="pi pi-chevron-left" />
				<Button text @click="() => goToNext()" icon="pi pi-chevron-right" />
			</div>
		</div>
	</div>
</template>

<style lang="scss">
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

		.prev {
			// transform: translateX(calc(-100% + var(--swipe-delta)));
			opacity: 0;
		}

		.next {
			// transform: translateX(calc(100% + var(--swipe-delta)));
			opacity: 0;
		}

		.active {
			// transform: translateX(var(--swipe-delta));
		}

		&.slideNext {
			.next {
				// transform: translateX(0);
				opacity: 1;
				transition: 800ms linear;
			}

			.active {
				// transform: translateX(-100%);
				opacity: 0;
				transition: 100ms linear;
			}
		}

		&.slidePrev {
			.prev {
				// transform: translateX(0);
				opacity: 1;
				transition: 800ms linear;
			}

			.active {
				// transform: translateX(100%);
				opacity: 0;
				transition: 100ms linear;
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
		bottom: 0;
		left: 0;
		width: calc(100% - 4rem);
		padding: 3rem;
		color: #fff;
		z-index: 1;
		font-size: 2rem;
		font-family: 'serif';
		font-weight: 400;
		text-shadow: 0 0 4px #0008;
		line-height: 1.2;
	}
}

.controls {
	position: absolute;
	bottom: 1rem;
	right: 1rem;
	transform: translate(-50%, -50%);
	z-index: 1;
	

	.p-button {
		color: #fff;
		text-shadow: 0 0 4px #0008;
	}
}
</style>