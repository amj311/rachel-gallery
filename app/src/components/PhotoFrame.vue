<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import watermarkImage from '@/assets/images/watermark.png'

const { photo, size = 'xs', watermark, fillMethod } = defineProps<{
	photo: {
		id: string,
		googleFileId: string,
		width: number,
		height: number,
	},
	fillMethod?: 'cover' | 'contain',
	size?: 'xs' | 'sm' | 'md' | 'lg',
	watermark?: boolean,
}>()

const sizeWidths = {
	xs: 100,
	sm: 300,
	md: 600,
	lg: 1000,
	xl: 2400
}

const canvasId = 'canvas_' + Date.now() + Math.random();

const state = reactive({
	canvasW: sizeWidths[size],
	canvasH: photo.height * (sizeWidths[size] / photo.width),
})

onMounted(() => {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	const ctx = canvas!.getContext('2d')!;

	const img = new Image(); // Create new img element
	img.addEventListener("load", () => {
		ctx.drawImage(img, 0, 0, state.canvasW, state.canvasH);

		if (watermark) {
			const wtr = new Image();
			wtr.addEventListener("load", () => {
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
				ctx.drawImage(wtr, wtrOffW, wtrOffH, newWtrW, newWtrH);
			});
			wtr.src = watermarkImage;
			// wtr.src = "https://www.chestysoft.com/images/watermark.png";
		}
	});

	const imageSrc = (photo.googleFileId ?
		`https://drive.google.com/thumbnail?id=${photo.googleFileId}&sz=w${state.canvasW}` :
		photo.dataUrl
	);

	img.referrerPolicy = "no-referrer";
	img.src = imageSrc;
})

</script>

<template>
	<div class="photoframe">
		<canvas :id="canvasId" :width="state.canvasW" :height="state.canvasH" :style="{ objectFit: fillMethod || 'contain' }"></canvas>
	</div>
</template>

<style scoped>
.photoframe {
	width:100%;
	height:100%;
	position:relative;
	/* background:blue; */
}
.photoframe canvas {
	/* background:green; */
	width: 100%;
	height: 100%;
	pointer-events: none;
	user-select: none;
}
</style>
