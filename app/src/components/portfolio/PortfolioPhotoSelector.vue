<script setup lang="ts">
import { computed, onBeforeMount, reactive, watch } from 'vue';
import request from '@/services/request';
import Dialog from 'primevue/dialog';
import { usePortfolioStore } from '@/stores/portfolio.store';
import Button from 'primevue/button';
import ImageSelector from '../ImageFileSelector.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import GalleryCover from '@/components/GalleryCover.vue';
import { useUploaderStore } from '../uploader/uploader.store';
import PhotoGrid from '@/components/PhotoGrid.vue';

const portfolioStore = usePortfolioStore();

const state = reactive({
	isVisible: false,
	filePhotos: new Set<any>(),
	galleryPhotos: new Set<any>(),
	openGalleryId: '',
	openGalleryData: null as any,
	portfolioSectionId: '',
	galleryList: [] as any[],
	onImageUploaded: null as any,
});

const allPhotos = computed(() => [
	...state.filePhotos,
	...state.galleryPhotos
]);

async function loadGalleries() {
	const { data } = await request.get('admin/gallery');
	state.galleryList = data.data;
}

function open(galleryPhotos?, openGalleryId?, portfolioSectionId?, onImageUploaded?: (image) => void) {

	if (!portfolioStore.portfolio?.sections.length) {
		portfolioStore.loadPortfolio();
	}
	
	// start with a clean slate
	state.filePhotos.clear();
	state.galleryPhotos.clear();
	state.openGalleryId = '';
	state.openGalleryData = null;
	state.onImageUploaded = onImageUploaded;

	state.isVisible = true;
	state.galleryPhotos = new Set(galleryPhotos || []);
	state.portfolioSectionId = portfolioSectionId || '';
	if (openGalleryId) {
		openGallery(openGalleryId);
	}

	loadGalleries();
}
defineExpose({ open });

async function openGallery(galleryId) {
	state.openGalleryId = galleryId;
	const { data } = await request.get(`admin/gallery/${galleryId}`);
	state.openGalleryData = data.data;
}

function closeGallery() {
	state.openGalleryId = '';
	state.openGalleryData = null;
}

function toggleGalleryPhoto(photo) {
	if (state.galleryPhotos.has(photo)) {
		state.galleryPhotos.delete(photo);
	} else {
		state.galleryPhotos.add(photo);
	}
}

function galleryPhotoClasses(photo) {
	return {
		'cursor-pointer': true,
		'is-selected': state.galleryPhotos.has(photo)
	}
}

const canSubmit = computed(() => {
	return state.portfolioSectionId !== '' && allPhotos.value.length > 0;
});

function sendPhotosToUploader() {
	useUploaderStore().queueImages(Array.from(allPhotos.value.map(p => ({
		...p,
		gallerySectionId: null, // Detach from any galleries
		portfolioSectionId: state.portfolioSectionId,
		onUploadComplete: (photo) => {
			usePortfolioStore().portfolio!.sections.find(s => s.id === photo.portfolioSectionId)!.photos.push(photo);
			state.onImageUploaded?.call(null, photo);
		}
	}))));
	state.isVisible = false;
}
</script>


<template>
	<Dialog v-model:visible="state.isVisible">
		<template #header>Select Photos to Add</template>

		<TabView>
			<TabPanel :header="`Selected Photos (${allPhotos.length})`">
				<PhotoGrid v-model="allPhotos" />
			</TabPanel>

			<TabPanel header="Choose from Gallery">
				<template v-if="state.openGalleryId">

					<div class="gallery-header">
						<i class="pi pi-arrow-left cursor-pointer" @click="closeGallery" />
						<span>{{ state.galleryList.find(g => g.id === state.openGalleryId)!.name }}</span>
					</div>

					<div v-if="state.openGalleryData">
						<template v-for="section in state.openGalleryData.sections" :key="section.id">
							<div>{{ section.name }}</div>
							<PhotoGrid v-model="section.photos" @photoClick="toggleGalleryPhoto" :photoClasses="galleryPhotoClasses" />
							<br/><br/>
						</template>
					</div>
					<div class="w-full p-5 flex justify-content-center" v-else><i class="pi pi-spinner pi-spin" /></div>
				</template>

				<template v-else>
					<div class="gallery-grid">
						<div class="gallery-option" v-for="gallery in state.galleryList" :key="gallery.id"  @click="openGallery(gallery.id)">
							<div class="cover-small">
								<GalleryCover :gallery="gallery" :preview="true" forceMode="desktop" />
							</div>
						</div>
					</div>
				</template>
			</TabPanel>

			<TabPanel header="Upload">
				<ImageSelector v-model="state.filePhotos" />
			</TabPanel>
		</TabView>

		<template #footer>
			<Button label="Cancel" @click="state.isVisible = false" text />
			<Button label="Add Photos" severity="primary" :disabled="!canSubmit" @click="sendPhotosToUploader" />
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

:deep(.p-tabview-panels) {
    height: calc(100vh - 22em);
    width: calc(100vw - 10rem);
    max-width: 60rem;
    max-height: 22rem;
    overflow: hidden;
    overflow-y: auto;
}


.removePhoto {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 1;
	width: 1.5rem;
	height: 1.5rem;
	line-height: 1.5rem;
	font-size: .7rem;
	transform: translate(25%, -25%);
	display: flex;
	justify-content: center;
	border-radius: 50%;
	background: #555;
	color: white;
	cursor: pointer;

	&:hover {
		background: red;
	}
}

:deep(.photo-grid-item.is-selected) {
	outline: 2px solid $primary;
}


.gallery-header {
	display: flex;
	align-items: center;
	gap: .5em;
	position: sticky;
	top: 0;
	transform: translate(0, -1rem);
	background: #fff;
	padding: 1em 0;
	z-index: 1;
}

.gallery-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
	gap: 20px;
	justify-content: center;

	.gallery-option {
		cursor: pointer;

		&:hover {
			outline: 2px solid $primary;
		}

		.cover-small {
			font-size: 2em;
			zoom: .1;
			width: 100%;
			aspect-ratio: 1.8;
			pointer-events: none;
			user-select: none;
			cursor: pointer;
		}
	}
}


</style>