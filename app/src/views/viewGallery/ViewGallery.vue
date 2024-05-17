<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, onMounted, onBeforeUnmount, computed } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';
import Slideshow from './Slideshow.vue';
import GalleryCover from '@/components/GalleryCover.vue';
import DeferredContent from 'primevue/deferredcontent';
import LoginModal from '@/components/LoginModal.vue';
import NavBar from '@/components/NavBar.vue';
import Button from 'primevue/button';
import { useUserStore } from '@/stores/user.store';
import Badge from 'primevue/badge';

const router = useRouter();
const userStore = useUserStore();

const state = reactive({
	isLoading: true,
	galleryIdOrSlug: router.currentRoute.value.params.galleryId,
	canView: false,
	gallery: null,
	showSlideshow: false,
	firstSlideshowPhoto: null,
	favoriteIds: new Set(),
});

const isClient = computed(() => userStore.currentUser?.email === state.gallery.clientEmail);
const favoritePhotos = computed(() => state.gallery.sections.flatMap(s => s.photos).filter(p => state.favoriteIds.has(p.id)));
const favoritesKey = computed(() => `gallery/${state.gallery.id}/favorites`);

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

	for (const section of state.gallery.sections) {
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
	const { data } = await request.get('gallery/' + state.galleryIdOrSlug);
	state.gallery = data.data;
	state.canView = data.canView;
	state.isLoading = false;

	if (state.canView) {
		setTimeout(() => computeImagePlacement(), 500);
		window.addEventListener('resize', () => computeImagePlacement());

		state.favoriteIds = new Set(JSON.parse(localStorage.getItem(favoritesKey.value) || '[]'));
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', () => computeImagePlacement());
});

function downloadHighRes(photo) {
	const link = document.createElement('a');
	link.href = `https://drive.google.com/uc?export=download&id=${photo.googleFileId}`;
	link.download = photo.filename;
	link.click();
}

function openSlideshow(photo?) {
	state.firstSlideshowPhoto = photo;
	state.showSlideshow = true;
}

function toggleFavorite(photo) {
	if (state.favoriteIds.has(photo.id)) {
		state.favoriteIds.delete(photo.id);
	} else {
		state.favoriteIds.add(photo.id);
	}
	localStorage.setItem(favoritesKey.value, JSON.stringify(Array.from(state.favoriteIds)));
}

</script>


<template>
	<div v-if="!state.gallery">Loading...</div>
	<div v-else id="viewGallery">
		<div class="cover">
			<GalleryCover :gallery="state.gallery" />
		</div>

		<div v-if="!state.canView" class="login-guard">
			<LoginModal message="Please sign in to view this gallery" />
		</div>

		<div v-else>
			<NavBar>
				<div class="flex align-items-center">
					<div>

					</div>
					<div class="flex-grow-1"></div>
					<div>
						<Button icon="pi pi-heart" text />
						<Badge v-if="state.favoriteIds.size > 0" severity="contrast" :value="state.favoriteIds.size" class="small-badge" />
						<Button icon="pi pi-download" text />
						<Button icon="pi pi-share-alt" text />
					</div>
				</div>
			</NavBar>

			<div class="m-4">
				<div v-for="section in state.gallery.sections" :key="section.id" class="section mt-3">
					<div class="section-header">{{ section.name }}</div>
					<div class="photo-grid" :style="{ height: section.height + 'px' }">
						<DeferredContent>
							<template v-for="photo in section.photos" :key="photo.id">
								<div v-if="photo.rect" class="photo-grid-item"
									:style="{ width: photo.rect.width + 'px', height: photo.rect.height + 'px', top: photo.rect.top + 'px', left: photo.rect.left + 'px' }">
									<div class="photo-frame" @click="openSlideshow(photo)">
										<PhotoFrame :photo="photo" :size="photo.rect.isDouble ? 'lg' : 'md'"
											:watermark="true" :fillMethod="'cover'" />
									</div>
									<div class="bottom-bar">
										<div class="buttons">
											<div class="button" @click="toggleFavorite(photo)"><i :class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" /></div>
											<div class="button" @click="downloadHighRes(photo)"><i class="pi pi-download" />
											</div>
										</div>
									</div>
								</div>
							</template>
						</DeferredContent>
					</div>
				</div>
			</div>
			
			<Slideshow v-if="state.showSlideshow" :photos="state.gallery.sections.flatMap(s => s.photos)"
				:firstPhoto="state.firstSlideshowPhoto" :onClose="() => state.showSlideshow = false" />
		</div>

	</div>
</template>

<style scoped lang="scss">
.login-guard {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff5;
    backdrop-filter: blur(7px);

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #fff;
		border: 1px solid lightgrey;
		outline: 10px solid #fff;
		box-shadow: 0px 0px 9px 11px #0005;
		padding: 2em;
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;
	}
}

.small-badge {
    position: absolute;
    transform: translate(-25px, 0px);
    zoom: .6;
    font-size: 1em;
}

#viewGallery {
	/* make sure there is a scrollbar before the images load so they have the right width */
	min-height: 101vh;


	.cover {
		width: 100%;
		height: 100vh;
		position: relative;
	}

	.section-header {
		font-size: 2em;
		margin: 3em 0 2em;
		text-align: center;
	}

	.photo-grid {
		margin-top: 10px;
		position: relative;

		.photo-grid-item {
			position: absolute;

			.photo-frame {
				width: 100%;
				height: 100%;
				cursor: pointer;
			}

			.bottom-bar {
				position: absolute;
				bottom: 0;
				width: 100%;
				background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.3) 2em);
				color: white !important;
				opacity: 0;
				padding-top: 1em;
				pointer-events: none;

				.buttons {
					pointer-events: all;
					width: auto;
					display: inline-flex;

					.button {
						width: 40px;
						height: 40px;
						font-size: 20px;
						display: inline-flex;
						justify-content: center;
						align-items: center;
						cursor: pointer;
					}

					&:hover .button {
						opacity: .5;

						&:hover {
							opacity: 1;
						}
					}
				}
			}

			&:hover .bottom-bar {
				opacity: 1;
				transition: 500ms;
			}
		}
	}

}
</style>