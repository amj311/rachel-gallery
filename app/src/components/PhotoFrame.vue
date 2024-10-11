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
		width?: number,
		height?: number,
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
	canvasW: 0,
	canvasH: 0,
	isLoadingHiRes: false,
	isLoading: false,
	loadingError: null as any | null,
})

function setCanvasSize(width, height) {
	state.canvasW = usingSize;
	state.canvasH = height * (usingSize / width);
}

setCanvasSize(photo.width || 100, photo.height || 100);

async function loadImage(src) {
	let returningImage;
	const isWeb = typeof src === 'string' && src.startsWith('http');
	if (isWeb && windowWithCache.photoCache.has(src)) {
		returningImage = windowWithCache.photoCache.get(src)!
	}
	else {
		const img = new Image();
		await new Promise((res, rej) => {
			img.referrerPolicy = "no-referrer";
			img.addEventListener("load", res);
			img.addEventListener("error", rej);
			img.src = src;
		});
		if (isWeb) {
			windowWithCache.photoCache.set(src, img);
			setTimeout(() => windowWithCache.photoCache.delete(src), 1000 * 60 * 5);
		}
		returningImage = img;
	}
	// get dimensions from if not already known
	if (!photo.width || !photo.height) {
		setCanvasSize(returningImage.width, returningImage.height);
	}
	return returningImage;
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
	try {
		state.isLoading = true;
		const isGooglePhoto = Boolean(photo.googleFileId);
		const needsInitialLoad = isGooglePhoto && usingSize > sizeWidths['sm'];

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

		if (watermark) {
			drawWatermark();
		}

		state.loadingError = null;
	}
	catch (e) {
		console.log("Failed to load photo", e);
		state.loadingError = e;
	}
	finally {
		state.isLoading = false;
		state.isLoadingHiRes = false;
	}
	
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
	<div class="photoframe" :style="{ 'aspect-ratio': fixedRatio ? `${photo.width}/${photo.height}` : undefined, backgroundColor: state.loadingError ? '#f5f5fa' : undefined }">
		<div class="state-icons">
			<i v-if="state.isLoading" class="pi pi-spinner pi-spin" />
			<i v-if="state.loadingError" class="pi pi-exclamation-triangle" />
		</div>
		<canvas ref="canvas" :width="state.canvasW" :height="state.canvasH" :style="{ objectFit: fillMethod || 'contain', objectPosition }"></canvas>
		<canvas ref="waterCanvas" :width="state.canvasW" :height="state.canvasH" :style="{ objectFit: fillMethod || 'contain', objectPosition }"></canvas>
		<!-- <i v-if="showLoading && state.isLoadingHiRes" class="loader top pi pi-spinner pi-spin" /> -->
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
.state-icons {
	position: absolute;
    top: calc(50% - .5rem);
    left: calc(50% - .5rem);
	font-size: 1rem;
	color: #555;
}
</style>
