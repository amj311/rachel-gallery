<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useAppStore } from '@/stores/app.store';
import debounce from '@/utils/debounce';

const wall = ref<HTMLDivElement>();
const props = defineProps<{
	photos: any[],
	lazyLoad?: boolean,
	animate?: boolean,
}>();

const doScrollEffects = computed(() => props.animate || props.lazyLoad);

const photos = computed(() => props.photos);

const state = reactive({
	tiles: [] as {
		photo: any,
		rect: ImageRect,
		// isAnimating?: boolean,
		shouldLoad?: boolean,
	}[],
	height: 0,
});

const aspect_ratios = {
	// wide
	'3:2': 3 / 2,
	'5:4': 5 / 4,
	'16:9': 16 / 9,
	// square
	'1:1': 1,
	// tall
	'2:3': 2 / 3,
	'4:5': 4 / 5,
	'9:16': 9 / 16,
}

type ImageRect = {
	width: number,
	height: number
	top: number,
	bottom: number,
	left: number,
	trueRatio: number,
	closestRatio: keyof typeof aspect_ratios,
	isDouble: boolean
}

const computeTiles = (() => {
	if (!wall.value) {
		state.tiles = [];
		state.height = 0;
		return;
	}

	state.tiles = [];

	const fullWidth = wall.value!.clientWidth;
	const isSkinny = fullWidth < 600;
	const numCols = isSkinny ? 2 : 3;
	const margin = isSkinny ? 5 : fullWidth * .015;
	const columnWidth = (fullWidth - (margin * (numCols - 1))) / numCols;
	const lineMatchRange = fullWidth * .03;

	let imagesSinceDouble = 30;
	const cols: ImageRect[] = [];

	photos.value.forEach((photo) => {
		let targetCol;
		// fill the first columns immediately
		if (cols.length < numCols) {
			for (const idx in Array(numCols).fill(0)) {
				if (!cols[idx]) {
					targetCol = idx;
					break;
				}
			}
		}
		// choose the shortest column
		if (targetCol === undefined) {
			// in the case of equal heights, this should choose the first column
			targetCol = cols.reduce((minIdx, colRect, i) => (colRect.bottom < cols[minIdx].bottom) ? i : minIdx, 0);
		}

		const rect = {
			width: columnWidth,
			trueRatio: photo.width / photo.height,
			top: cols[targetCol] ? cols[targetCol].bottom + margin : 0,
			left: (targetCol * columnWidth) + (margin * targetCol), // eg, third column is offset by 2 columns and 2 margins
		} as ImageRect;
		rect.closestRatio = (Object.keys(aspect_ratios).reduce((min, ratio) => Math.abs(aspect_ratios[ratio] - rect.trueRatio) < Math.abs(aspect_ratios[min] - rect.trueRatio) ? ratio : min)) as keyof typeof aspect_ratios;

		// determine double-wide images
		imagesSinceDouble += 1;

		if (rect.trueRatio >= aspect_ratios['5:4'] && imagesSinceDouble > 4) {
			if (targetCol === 0) {
				rect.isDouble = cols[0]?.bottom === cols[1]?.bottom;
			}
			else if (targetCol === 1) {
				rect.isDouble = cols[1]?.bottom === cols[2]?.bottom;
			}
		}

		// At this point, assign the rect to its target column(s)
		cols[targetCol] = rect;
		if (rect.isDouble) {
			imagesSinceDouble = 0;
			cols[targetCol + 1] = rect;
			rect.width = rect.width + columnWidth + margin;
		}

		// compute height after adjusting width for double
		rect.height = rect.width / aspect_ratios[rect.closestRatio];
		rect.bottom = rect.top + rect.height;

		// if within certain range of neighbor, match bottom for more pretty lines
		for (const colRect of cols) {
			if (colRect !== rect && Math.abs(colRect.bottom - rect.bottom) < lineMatchRange) {
				rect.height = colRect.bottom - rect.top;
				rect.bottom = rect.top + rect.height; // update bottom
			}
		}

		state.tiles.push({
			photo,
			rect,
		});
	})
	state.height = Math.max(...(cols.map(col => col?.bottom || 0)));

	// Recompute visible photos
	if (doScrollEffects.value) {
		scrollEffect();
	}
});

watch(computed(() => JSON.stringify(photos.value)), () => {
	computeTiles();
});
watch(computed(() => useAppStore().emulateWindowResize), computeTiles)
onMounted(() => {
	computeTiles();
});

const ScrollDebounceTime = 750;
const scrollDebounce = debounce(scrollEffect, ScrollDebounceTime, { allowInterval: true });
if (doScrollEffects.value) {
	window.addEventListener('scroll', scrollDebounce);
	onUnmounted(() => {
		window.removeEventListener('scroll', scrollDebounce);
	})
}

function scrollEffect() {
	const wallRect = wall.value!.getBoundingClientRect();
	const viewTop = window.scrollY;
	const viewBottom = window.scrollY + window.innerHeight;
	const wallTop = wallRect.top + window.scrollY;
	const wallBottom = wallTop + state.height;

	const loadBuffer = window.innerHeight * 3;
	const loadTop = viewTop - loadBuffer;
	const loadBottom = viewBottom + loadBuffer;

	const unloadBuffer = window.innerHeight * 3;
	const unloadTop = viewTop - unloadBuffer;
	const unloadBottom = viewBottom + unloadBuffer;

	const animateBuffer = 0;
	const animateTop = viewBottom - animateBuffer;
	const animateBottom = viewBottom + animateBuffer;

	// Abort early if entire wall is not in view
	if (wallTop > loadBottom || wallBottom < loadTop) {
		return;
	}
	
	for (const tile of state.tiles) {
		const tileTop = tile.rect.top + wallTop;
		const tileBottom = tile.rect.bottom + wallTop;
		if (tileTop < loadBottom && tileBottom > loadTop) {
			tile.shouldLoad = true;
		}
		if (!(tileTop < unloadBottom && tileBottom > unloadTop)) {
			tile.shouldLoad = false;
		}
		// tile.isAnimating = (tileTop < animateBottom && tileTop > animateTop);
	}
}

</script>


<template>
	<div class="photo-wall" ref="wall" :style="{ height: state.height + 'px' }" :class="{ 'lazyload': lazyLoad, 'animate': animate }">
		<template v-for="tile in state.tiles" :key="tile.photo.id">
			<div v-if="tile.rect" class="photo-wall-item">
				:style="{ width: tile.rect.width + 'px', height: tile.rect.height + 'px', top: tile.rect.top + 'px', left: tile.rect.left + 'px' }">
				<div class="photo-frame">
					<PhotoFrame v-if="!lazyLoad || tile.shouldLoad" :photo="tile.photo" :size="tile.rect.isDouble ? 'lg' : 'md'"
						:watermark="true" :fillMethod="'cover'" />
				</div>
				<div class="overlay"><slot :photo="tile.photo"></slot></div>
			</div>
		</template>
	</div>
</template>



<style scoped lang="scss">
.photo-wall {
	position: relative;

	.photo-wall-item {
		position: absolute;

		.photo-frame {
			width: 100%;
			height: 100%;
			cursor: pointer;
		}

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;

			> * {
				pointer-events: all;
			}
		}
	}

	// &.animate {
	// 	.photo-wall-item {
	// 		opacity: 1;
	// 	}
	// 	.photo-wall-item.animating {
	// 		transition: 500ms ease;
	// 	}
	// 	.photo-wall-item:not(.in-view) {
	// 		opacity: 0;
	// 		transform: translateY(30px);
	// 	}
	}
}
</style>