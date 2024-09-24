<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import watermarkImage from '@/assets/images/watermark.png'


const canvas = ref<HTMLCanvasElement>();
const waterCanvas = ref<HTMLCanvasElement>();

const windowWithCache = window as unknown as Window & {
	photoCache: Map<string, HTMLImageElement>
};

if (!windowWithCache.photoCache) {
	windowWithCache.photoCache = new Map();
}

const props = defineProps<{
	photo: {
		id: string,
		googleFileId?: string,
		width: number,
		height: number,
		dataUrl?: string
	},
	fixedRatio?: boolean,
	fillMethod?: 'cover' | 'contain',
	position?: string | { x: number, y: number },
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
	watermark?: boolean,
	showLoading?: boolean
}>();

const { photo, size = 'xs', watermark, showLoading } = props;

const sizeWidths = {
	xs: 100,
	sm: 300,
	md: 600,
	lg: 1000,
	xl: 2400
}

// Cap resolution with screen size to reduce strain on small devices
const usingSize = Math.min(sizeWidths[size], Math.max(window.innerWidth, window.innerHeight) * 2);

const state = reactive({
	canvasW: usingSize,
	canvasH: photo.height * (usingSize / photo.width),
	isLoadingHiRes: false,
})

async function loadImage(src) {
	const isWeb = typeof src === 'string' && src.startsWith('http');
	if (isWeb && windowWithCache.photoCache.has(src)) {
		return windowWithCache.photoCache.get(src)!
	}
	const img = new Image();
	await new Promise((res) => {
		img.referrerPolicy = "no-referrer";
		img.addEventListener("load", res);
		img.src = src;
	});
	if (isWeb) {
		windowWithCache.photoCache.set(src, img);
		setTimeout(() => windowWithCache.photoCache.delete(src), 1000 * 60 * 5);
	}
	return img;
}

async function drawImage(source) {
	const ctx = canvas.value!.getContext('2d')!;
	const img = await loadImage(source);
	ctx.clearRect(0, 0, state.canvasW, state.canvasH);
	ctx.drawImage(img, 0, 0, state.canvasW, state.canvasH);
}

async function drawWatermark() {
	const ctx = waterCanvas.value!.getContext('2d')!;
	const wtr = new Image();
	await new Promise((res) => {
		wtr.addEventListener("load", res);
		wtr.src = watermarkImage;
	});

	const wtrW = wtr.width;
	const wtrH = wtr.height;
	let newWtrW;
	let newWtrH;
	const scaleFactor = 5;

	// choose smallest side to base watermark on
	if (state.canvasW < state.canvasH) {
		newWtrW = state.canvasW / scaleFactor;
		newWtrH = wtrH * (newWtrW / wtrW);
	} else {
		newWtrH = state.canvasH / scaleFactor;
		newWtrW = wtrW * (newWtrH / wtrH);
	}

	const edgeMargin = state.canvasW * 0.02;
	const wtrOffW = state.canvasW - newWtrW - edgeMargin;
	const wtrOffH = state.canvasH - newWtrH - edgeMargin;

	ctx.globalAlpha = 0.3;
	ctx.clearRect(0, 0, state.canvasW, state.canvasH);
	ctx.drawImage(wtr, wtrOffW, wtrOffH, newWtrW, newWtrH);
}

async function initPhoto() {
	const isGooglePhoto = Boolean(photo.googleFileId);
	const needsInitialLoad = isGooglePhoto && usingSize > sizeWidths['sm'];

	if (watermark) {
		drawWatermark();
	}

	if (needsInitialLoad) {
		state.isLoadingHiRes = true;
		await drawImage(`https://drive.google.com/thumbnail?id=${photo.googleFileId}&sz=w${sizeWidths['xs']}`);
		await drawImage(`https://drive.google.com/thumbnail?id=${photo.googleFileId}&sz=w${sizeWidths['sm']}`);
	}
	
	await drawImage(isGooglePhoto ?
		`https://drive.google.com/thumbnail?id=${photo.googleFileId}&sz=w${usingSize}`
		:
		photo.dataUrl
	);
	state.isLoadingHiRes = false;
}

onMounted(initPhoto);

const objectPosition = computed(() => {
	if (!props.position) {
		return 'center';
	}
	if (typeof props.position === 'string') {
		return props.position;
	}
	else {
		return `${props.position.x}% ${props.position.y}%`;
	}
});
</script>

<template>
	<div class="photoframe" :style="{ 'aspect-ratio': fixedRatio ? `${photo.width}/${photo.height}` : undefined }">
		<i class="loader pi pi-spinner pi-spin" />
		<canvas ref="canvas" :width="state.canvasW" :height="state.canvasH" :style="{ objectFit: fillMethod || 'contain', objectPosition }"></canvas>
		<canvas ref="waterCanvas" :width="state.canvasW" :height="state.canvasH" :style="{ objectFit: fillMethod || 'contain', objectPosition }"></canvas>
		<i v-if="showLoading && state.isLoadingHiRes" class="loader top pi pi-spinner pi-spin" />
	</div>
</template>

<style scoped>
.photoframe {
	width: 100%;
	height: 100%;
	position: relative;
}
.photoframe canvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	user-select: none;
}
.loader {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 1rem;
	color: #555;

	&.top {
		color: white;
	}
}
</style>
