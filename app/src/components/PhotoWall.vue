<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import PhotoFrame from '@/components/PhotoFrame.vue';
import DeferredContent from 'primevue/deferredcontent';

const wall = ref<HTMLDivElement>();
const props = defineProps<{
	photos: any[],
}>();

const photos = computed(() => props.photos);

const state = reactive({
	tiles: [] as {
		photo: any,
		rect: ImageRect,
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
	const numCols = 3;
	const margin = Math.min(fullWidth / 30, 15);
	const columnWidth = (fullWidth - (margin * (numCols - 1))) / numCols;
	const lineMatchRange = margin;

	let imagesSinceDouble = 30;
	const cols: ImageRect[] = [];

	photos.value.forEach((photo) => {
		let targetCol;
		// fill the first columns immediately
		if (cols.length < 3) {
			for (const idx of [0, 1, 2]) {
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
	state.height = Math.max(cols[0]?.bottom || 0, cols[1]?.bottom || 0, cols[2]?.bottom || 0);
});

onMounted(() => {
	window.addEventListener('resize', computeTiles);
	computeTiles();
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', computeTiles);
});

</script>


<template>
	<div class="photo-wall" ref="wall" :style="{ height: state.height + 'px' }">
		<DeferredContent>
			<template v-for="tile in state.tiles" :key="tile.photo.id">
				<div v-if="tile.rect" class="photo-wall-item"
					:style="{ width: tile.rect.width + 'px', height: tile.rect.height + 'px', top: tile.rect.top + 'px', left: tile.rect.left + 'px' }">
					<div class="photo-frame">
						<PhotoFrame :photo="tile.photo" :size="tile.rect.isDouble ? 'lg' : 'md'"
							:watermark="true" :fillMethod="'cover'" />
					</div>
					<div class="overlay"><slot :photo="tile.photo"></slot></div>
				</div>
			</template>
		</DeferredContent>
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
}
</style>