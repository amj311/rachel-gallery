<script setup lang="ts">
import { reactive, onBeforeMount, onBeforeUnmount, computed, ref, watch } from 'vue';
import PhotoFrame from '@/components/PhotoFrame.vue';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<{
	onClose?: () => void
}>()

const state = reactive({
	photos: [] as any[],
	activePhotoIdx: 0,
	playingTimer: 0,
	animationClass: '',
});

const showSlideshow = computed(() => router.currentRoute.value.query.slideshow === 'true' && state.photos.length > 0);
watch(showSlideshow, () => {
	if (showSlideshow.value) {
		setupListeners();
	} else {
		clearTimeout(state.playingTimer);
		removeListeners();
	}
})


function open(photos: [], firstPhoto?: any) {
	state.photos = photos;
	if (firstPhoto) {
		state.activePhotoIdx = state.photos.findIndex(p => p.id === firstPhoto.id);
	}
	setupListeners();
	router.push({ query: { slideshow: 'true' } });
}

function close() {
	clearTimeout(state.playingTimer);
	removeListeners();
	router.back();
	props.onClose?.call(null)
}

defineExpose({open, close});

const activePhoto = computed(() => state.photos[state.activePhotoIdx]);
const isPlaying = computed(() => state.playingTimer !== 0);
const nextPhoto = computed(() => state.photos[(state.activePhotoIdx + 1) % state.photos.length]);
const prevPhoto = computed(() => state.photos[(state.activePhotoIdx - 1 + state.photos.length) % state.photos.length]);

const initialScroll = window.scrollY;

function setupListeners() {
	window.addEventListener('keydown', handleKeydown);
	window.addEventListener('touchstart', handleTouchStart);
	window.addEventListener('touchmove', handleTouchMove);
	window.addEventListener('touchend', handleTouchEnd);
	window.addEventListener('scroll', preventScroll);
}
function removeListeners() {
	window.removeEventListener('keydown', handleKeydown);
	window.removeEventListener('touchstart', handleTouchStart);
	window.removeEventListener('touchmove', handleTouchMove);
	window.removeEventListener('touchend', handleTouchEnd);
	window.removeEventListener('scroll', preventScroll);
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
	if (animate) {
		state.animationClass = 'slideNext';
		await new Promise(r => setTimeout(r, animationTime));
	}
	state.activePhotoIdx = (state.activePhotoIdx + 1) % state.photos.length;
	resetAfterSwap();
}

async function goToPrev(animate = true) {
	if (animate) {
		state.animationClass = 'slidePrev';
		await new Promise(r => setTimeout(r, animationTime));
	}
	state.activePhotoIdx = (state.activePhotoIdx - 1 + state.photos.length) % state.photos.length;
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
	state.playingTimer = setTimeout(goToNext, 5000) as any;
}
function stop() {
	clearTimeout(state.playingTimer);
	state.playingTimer = 0;
}

function handleKeydown(e) {
	if (e.key === 'ArrowRight') {
		e.preventDefault();
		uiSwap(goToNext);
	} else if (e.key === 'ArrowLeft') {
		e.preventDefault();
		uiSwap(goToPrev);
	} else if (e.key === 'ArrowUp') {
		e.preventDefault();
		uiSwap(goToPrev);
	} else if (e.key === 'ArrowDown') {
		e.preventDefault();
		uiSwap(goToNext);
	} else if (e.key === 'Escape') {
		e.preventDefault();
		close();
	} else if (e.key === ' ' && !isPlaying.value) {
		e.preventDefault();
		play();
	} else if (e.key === ' ' && isPlaying.value) {
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


</script>


<template>
	<div id="Slideshow" v-if="showSlideshow">
		<div id="topBar">
			<div class="flex justify-content-start"></div>
			<div class="flex justify-content-center"></div>
			<div class="flex align-items-center justify-content-end" style="zoom: .9">
				<Button text v-if="!isPlaying" @click="play" icon="pi pi-play" size="large" />
				<Button text v-if="isPlaying" @click="stop" icon="pi pi-pause" size="large" />
				<Button text @click="close" icon="pi pi-times" size="large" />
			</div>
		</div>
		<div :class="{ 'photo-frame': true, [state.animationClass]: true }">
			<div class="prev">
				<PhotoFrame :key="prevPhoto.id" :photo="prevPhoto" :watermark="true" :size="'xl'" />
			</div>
			<div class="active">
				<PhotoFrame :key="activePhoto.id" :photo="activePhoto" :watermark="true" :size="'xl'" />
			</div>
			<div class="next">
				<PhotoFrame :key="nextPhoto.id" :photo="nextPhoto" :watermark="true" :size="'xl'" />
			</div>
		</div>
		<div id="bottomBar" style="zoom: .9">
			<Button text @click="() => uiSwap(goToPrev)" icon="pi pi-chevron-left" size="large" />
			<div class="flex align-items-center"><slot :photo="activePhoto"></slot></div>
			<Button text @click="() => uiSwap(goToNext)" icon="pi pi-chevron-right" size="large" />
		</div>

		<div style="display: none">

		</div>
	</div>
</template>

<style lang="scss">
:root {
	--swipe-delta: 0px;
}

#Slideshow {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #fffe;
	backdrop-filter: blur(5px);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	z-index: 20;


	#topBar {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		justify-content: flex-end;
		align-items: center;
		padding: .5em;
	}

	#bottomBar {
		display: flex;
		justify-content: center;
		padding: .5em;
		gap: 1em;
	}

	.photo-frame {
		position: relative;
		height: calc(100% - 110px);
		width: calc(100% - max(5%, 10px));

		> div {
			position: absolute;
			width: 100%;
			height: 100%;
		}

		.prev {
			transform: translateX(calc(-100vw + var(--swipe-delta)));
		}

		.next {
			transform: translateX(calc(100vw + var(--swipe-delta)));
		}

		.active {
			transform: translateX(var(--swipe-delta));
		}

		&.slideNext {
			.next {
				transform: translateX(0);
				transition: 500ms ease;
			}

			.active {
				transform: translateX(-100vw);
				opacity: 0;
				transition: 500ms ease;
			}
		}

		&.slidePrev {
			.prev {
				transform: translateX(0);
				transition: 500ms ease;
			}

			.active {
				transform: translateX(100vw);
				opacity: 0;
				transition: 500ms ease;
			}
		}
	}

}
</style>