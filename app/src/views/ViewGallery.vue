<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';

const router = useRouter();

const state = reactive({
	isLoading: true,
	galleryId: router.currentRoute.value.params.galleryId,
	gallery: null,
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

function computeImagePlacement() {
	const fullWidth = document.querySelector('.section')!.clientWidth;
	const numCols = 3;
	const margin = Math.min(fullWidth / 30, 15);
	const columnWidth = (fullWidth - (margin * (numCols - 1))) / numCols;
	const lineMatchRange = margin;

	for (const section of state.gallery.Sections) {
		let imagesSinceDouble = 30;

		const cols: ImageRect[] = [];
		section.photos.forEach((photo, i) => {
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
			photo.rect = rect;

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
		})
		section.height = Math.max(cols[0]?.bottom, cols[1]?.bottom, cols[2]?.bottom);
	}
}

onMounted(async () => {
	const { data } = await request.get('gallery/' + state.galleryId);
	state.gallery = data.data;
	state.isLoading = false;

	setTimeout(() => computeImagePlacement(), 500);
	window.addEventListener('resize', () => computeImagePlacement());
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', () => computeImagePlacement());
});

</script>


<template>
	<div v-if="!state.gallery">Loading...</div>
	<div v-else id="viewGallery">
		<h1>{{state.gallery.name}}</h1>

		<div v-for="section in state.gallery.Sections" :key="section.id" class="section mt-3">
			<center><h2>{{section.name}}</h2></center>
			<div class="photo-grid" :style="{height: section.height + 'px'}">
				<template v-for="photo in section.photos" :key="photo.id">
					<div v-if="photo.rect" class="photo-grid-item" :style="{width: photo.rect.width + 'px', height: photo.rect.height + 'px', top: photo.rect.top + 'px', left: photo.rect.left + 'px'}">
						<div class="photo-frame"><PhotoFrame :photo="photo" :size="photo.rect.isDouble ? 'lg' : 'md'" :watermark="true" :fillMethod="'cover'" /></div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<style scoped>
#viewGallery {
	/* make sure there is a scrollbar before the images load so they have the right width */
	min-height: 101vh;
}

.photo-grid {
	margin-top: 10px;
	position: relative;
}

.photo-grid-item {
	position: absolute;
}

.photo-frame {
	width: 100%;
	height: 100%;
}
</style>