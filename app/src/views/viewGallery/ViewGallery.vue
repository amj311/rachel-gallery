<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, computed, watch, Directive } from 'vue';
import request from '@/services/request';
import Slideshow from '../../components/Slideshow.vue';
import GalleryCover from '@/components/GalleryCover.vue';
import LoginModal from '@/components/LoginModal.vue';
import NavBar from '@/components/NavBar.vue';
import Button from 'primevue/button';
import Sidebar from 'primevue/sidebar';
import { useUserStore } from '@/stores/user.store';
import Badge from 'primevue/badge';
import PhotoWall from '@/components/PhotoWall.vue';
import ShareModal from '@/components/GalleryAccessModal.vue';
import CodeInput from '@/components/CodeInput.vue';
import watermarkImage from '@/assets/images/watermark.png'
import { useToast } from 'primevue/usetoast';
import DropdownMenu from '@/components/DropdownMenu.vue';
import Checkbox from 'primevue/checkbox';
import LoadSplash from '@/components/LoadSplash.vue';
import ProgressBar from 'primevue/progressbar';
import { Buffer } from 'buffer';
import JSZip from 'jszip';
import { ref } from 'vue';
import { useAppStore } from '@/stores/app.store';
import OverlayPanel from 'primevue/overlaypanel';
import RefOpener from '@/components/RefOpener.vue';
import Snackbar from '@/components/Snackbar.vue';
import { RESOLUTION, Resolutions } from '@/utils/resolutions.js';
import PhotoFrame from '@/components/PhotoFrame.vue';
import RadioButton from 'primevue/radiobutton';
import Dropdown from 'primevue/dropdown';

type Photo = {
	id: string,
	filename: string,
	googleFileId: string,
	width: number,
	height: number,
};

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const state = reactive({
	isLoading: true,
	galleryIdOrSlug: router.currentRoute.value.params.galleryId,
	viewAuth: {} as any,
	gallery: null as any,
	providedCode: null,
	favoriteIds: new Set(),
	showFavoritesModal: false,
	showShareModal: false,
	didAdminWarn: false,
	selectedIds: new Set(),
	pendingDownload: null as {
		status: 'processing' | 'finished' | 'error',
		photosToDownload: any[],
		res: RESOLUTION,
		// hiRes: boolean,
		readyPhotos: { photo, blob }[],
		finalBlob?: Blob,
		downloadName?: string,
		error?: string,
	} | null,
});

const megaBytes = ref(2); // for testing

const isMobile = computed(() => useAppStore().isMobile);
const isLoggedIn = computed(() => userStore.isLoggedIn);
const isAdmin = computed(() => userStore.currentUser?.isAdmin);
const isClient = computed(() => userStore.currentUser?.email === state.gallery.Client.email);
const doClientActions = computed(() => isAdmin.value || isClient.value);

const favoritePhotos = computed(() => state.gallery.sections.flatMap(s => s.photos).filter(p => state.favoriteIds.has(p.id)));
const favoritesKey = computed(() => `gallery/${state.gallery.id}/favorites`);
const showSelectors = computed(() => state.selectedIds.size > 0);

const canView = computed(() => {
	if (isAdmin.value) {
		return true;
	}
	if (state.gallery?.visibility === 'public') {
		return true;
	}
	if (state.gallery?.visibility === 'published') {
		if (state.gallery?.shareMode === 'public') {
			return true;
		}
		if (state.gallery?.shareMode === 'code' && state.viewAuth.hasCorrectCode) {
			return true;
		}
		if (isLoggedIn.value) {
			if (isClient.value) {
				return true;
			}
			if (state.viewAuth.isAllowedEmail) {
				return true;
			}
		}
	}
	return false;
});

const showLoginModal = ref(false);

const authMode = ref('login');

onBeforeMount(() => {
	loadGallery();
});

watch(canView, () => {
	if (canView.value && !state.gallery?.sections) {
		loadGallery();
	}
})

async function loadGallery() {
	state.isLoading = true;
	const code = state.providedCode || localStorage.getItem('gallery/' + state.galleryIdOrSlug + '/code');
	const { data } = await request.get('gallery/' + state.galleryIdOrSlug, { params: { code } });
	state.gallery = data.data;
	state.viewAuth = data.viewAuth;

	if (data.success) {
		state.favoriteIds = new Set(JSON.parse(localStorage.getItem(favoritesKey.value) || '[]'));

		if (code) localStorage.setItem('gallery/' + state.galleryIdOrSlug + '/code', code);

		if (!state.didAdminWarn && isAdmin.value && ['draft', 'hidden', 'archived'].includes(state.gallery.visibility)) {
			toast.add({
				severity: 'warn',
				summary: 'This gallery is ' + state.gallery.visibility + '. Only admins can view it.',
				life: 3000,
			})
			state.didAdminWarn = true;
		}

		if (state.gallery?.shareMode === 'code') {
			authMode.value = 'code';
		}

		// Remove deleted photos from favorites
		for (const id of state.favoriteIds.values()) {
			if (!allPhotos.value.find(p => p.id === id)) {
				state.favoriteIds.delete(id);
			}
			localStorage.setItem(favoritesKey.value, JSON.stringify(Array.from(state.favoriteIds)));
		}

		useAppStore().setTitle(state.gallery.name);
		state.selectedIds = new Set(JSON.parse(localStorage.getItem('selected_'+state.gallery.id) || '[]'))
	}

	state.isLoading = false;
}

const allPhotos = computed(() => state.gallery?.sections?.flatMap(s => s.photos));

const slideshow = ref<InstanceType<typeof Slideshow>>()
function openSlideshow(photos, firstPhoto) {
	slideshow.value?.open(photos, firstPhoto);
}

function toggleFavorite(photo) {
	if (state.favoriteIds.has(photo.id)) {
		state.favoriteIds.delete(photo.id);
	} else {
		state.favoriteIds.add(photo.id);
	}
	localStorage.setItem(favoritesKey.value, JSON.stringify(Array.from(state.favoriteIds)));
}

function toggleSelected(photo) {
	if (state.selectedIds.has(photo.id)) {
		state.selectedIds.delete(photo.id);
	} else {
		state.selectedIds.add(photo.id);
	}
}

const selectedPhotos = computed(() => Array.from(state.selectedIds).map(id => allPhotos.value.find(p => p.id === id)));

watch(() => state.selectedIds.size, () => {
	localStorage.setItem('selected_'+state.gallery.id, JSON.stringify(Array.from(state.selectedIds)));
})


function scrollToTop() {
	if (canView.value) {
		const cover = document.getElementById('cover');
		window.scrollTo(0, cover!.offsetTop + cover!.offsetHeight);
	}
}

function scrollToSection(section) {
	document.getElementById('section_'+section.id)?.scrollIntoView();
}

function smallestEdgePx(photo: Photo) {
	return Math.min(photo.width, photo.height);
}

function resolvedResolution(photo: Photo, targetSmallest: RESOLUTION) {
	if (photo.width < photo.height) {
		return {
			width: targetSmallest,
			height: Math.floor(photo.height * (targetSmallest / photo.width)),
		}
	}
	else {
		return {
			height: targetSmallest,
			width: Math.floor(photo.width * (targetSmallest / photo.height)),
		}
	}
}

function resolutionString(res: { width: number, height: number }) {
	return `${res.width}x${res.height}`;
}

function downloadMenu(photos, cb?) {
	return [
		// {
		// 	label: 'Shareable file',
		// 	command: () => { startDownloadPhotos2(photos, RESOLUTION.x800); cb?.call(); }
		// },
		// photos.length === 1 && photos[0].size > 4000000 ? {
		// 	label: `Printable file (${(photos[0].size / 1e+6).toFixed(1)} MB)`,
		// 	command: () => { startDownloadPhotos(photos, true); cb?.call(); }
		// } : null,

		...Array.from(Object.values(Resolutions)).map(r => {
			return {
				label: photos.length === 1 ? resolutionString(resolvedResolution(photos[0], r.size)) : r.size,
				command: () => startDownloadPhotos2(photos, r.size),
			}
		})
	].filter(Boolean);
}

const showDownloadDialog = ref(false);
const downloadDialogPhotos = ref<Array<Photo>>([]);
const downloadDialogMode = ref<'selectRes' | 'review'>();
function openDownloadDialog(photos: Array<Photo>) {
	downloadDialogPhotos.value = [...photos];
	showDownloadDialog.value = true;
}
function closeDownloadDialog() {
	downloadDialogPhotos.value = [];
	showDownloadDialog.value = false;
}
const previewPhotoStack = computed(() => [...downloadDialogPhotos.value].reverse().slice(0, 5));
const selectedRes = ref<typeof Resolutions[keyof typeof Resolutions]>(Resolutions[1024]);

function removePhotoFromDownload(photo) {
	if (downloadDialogPhotos.value.length === 1) {
		showDownloadDialog.value = false;
	}
	downloadDialogPhotos.value = downloadDialogPhotos.value.filter(ph => ph.id !== photo.id);
}

const minShortSideOfDownload = computed(() => Math.min(...downloadDialogPhotos.value.map(photo => smallestEdgePx(photo))));
const tooSmallPhotos = computed(() => downloadDialogPhotos.value.filter(ph => smallestEdgePx(ph) < selectedRes.value.size));

const downloadDialogProcessing = ref(false);

function handleDownloadDialogButton() {
	if (!selectedRes.value.size) return;
	if (selectedRes.value.size > minShortSideOfDownload.value) {
		void requestResolution();
	}
	else {
		void startDownloadPhotos2(downloadDialogPhotos.value, selectedRes.value.size);
		closeDownloadDialog();
	}
}

async function requestResolution() {
	try {
		downloadDialogProcessing.value = true;
		await request.post(`/gallery/${state.gallery.id}/requestRes`, {
			res: selectedRes.value.size,
			photoIds: tooSmallPhotos.value.map(ph => ph.id),
		});
		closeDownloadDialog();
		toast.add({
			severity: 'success',
			summary: 'Requested higher resolution',
			life: 5000,
		});
	}
	catch (e) {
		toast.add({
			severity: 'error',
			summary: 'Failed to request higher resolution',
			life: 5000,
		});
	}
	finally {
		downloadDialogProcessing.value = false;
	}
}

// my server can't handle pulling large files from google yet, so full print res must be downloaded one at a time
// async function startDownloadPhotos(photos, hiRes = false) {
// 	// download individual hi res through google
// 	if (hiRes && photos.length === 1) {
// 		const link = document.createElement('a');
// 		link.href = `https://drive.google.com/uc?id=${photos[0].googleFileId}&export=download`;
// 		link.download = photos[0].filename;
// 		link.click();
// 		link.remove();
// 		return;
// 	}


// 	if (state.pendingDownload) {
// 		toast.add({
// 			severity: 'warn',
// 			summary: 'Wait for previous download to finish',
// 			life: 3000,
// 		})
// 		return;
// 	}
// 	if (!photos.length) return;

// 	state.pendingDownload = {
// 		status: 'processing',
// 		photosToDownload: photos,
// 		readyPhotos: [],
// 		hiRes,
// 	};

// 	try {
// 		// have to do these one at a time to not crash server
// 		for (const photo of photos) {
// 			let width = photo.width;

// 			let maxBytes = megaBytes.value * 1e+6; // X MB
// 			console.log(photo.size * 1e-6, maxBytes / 1e+6);
// 			// if (hiRes && photo.size > maxBytes) {
// 			// 	// compute new width to approximate desired size
// 			// 	// new width = sqrt(area * (width / height))
// 			// 	const scaleRatio = maxBytes / photo.size;
// 			// 	const targetArea = (width * photo.height) * scaleRatio;
// 			// 	const ratio = photo.width / photo.height;
// 			// 	width = Math.sqrt(targetArea * ratio);
// 			// }
// 			// if (!hiRes) {
// 				if (photo.width < photo.height) {
// 					width = 1600 * (photo.width / photo.height);
// 				}
// 				else {
// 					width = 1600;
// 				}
// 			// }

// 			const { data } = await request.get('/gallery/' + state.gallery.id + '/photo-google/' + photo.googleFileId + '/' + Math.round(width));

// 			const blob = new Blob([Buffer.from(data.data)], { type: 'image/jpeg' });
// 			state.pendingDownload.readyPhotos.push({ photo, blob });
// 			console.log(blob.size * 1e-6);
// 		}

// 		const isMultiple = state.pendingDownload?.readyPhotos.length > 1;
// 		let finalBlob;

// 		if (isMultiple) {
// 			const zip = new JSZip();
// 			state.pendingDownload.readyPhotos.forEach(({ photo, blob }) => {
// 				zip.file(`${photo.filename}`, blob, { compression: 'DEFLATE' });
// 			})
// 			const zipBuffer = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
// 			finalBlob = new Blob([zipBuffer], { 'type': 'application/zip' });
// 		} else {
// 			finalBlob = state.pendingDownload?.readyPhotos[0].blob;
// 		}

// 		state.pendingDownload.downloadName = isMultiple ? state.gallery.name + '.zip' : state.pendingDownload?.readyPhotos[0].photo.filename;
// 		state.pendingDownload.finalBlob = finalBlob;
// 		state.pendingDownload.status = 'finished';

// 		if (state.pendingDownload.readyPhotos.length === 1) {
// 			loadDownloadLink();
// 		}
// 	}
// 	catch (e: any) {
// 		console.error(e);
// 		state.pendingDownload.error = e.message;
// 		state.pendingDownload.status = 'error';
// 	}
// }

async function startDownloadPhotos2(photos: Array<Photo>, shortestEdge: RESOLUTION) {
	if (state.pendingDownload) {
		toast.add({
			severity: 'warn',
			summary: 'Wait for previous download to finish',
			life: 3000,
		})
		return;
	}
	if (!photos.length) return;

	state.pendingDownload = {
		status: 'processing',
		photosToDownload: photos,
		readyPhotos: [],
		res: shortestEdge,
	};

	try {
		// have to do these one at a time to not crash server
		for (const photo of photos) {
			let targetSz = `w${Number(shortestEdge)}`; // if width is shortest edge

			// if height is shortest edge
			if (photo.height < photo.width) {
				targetSz = `h${Number(shortestEdge)}`;
			}

			const { data } = await request.get('/gallery/' + state.gallery.id + '/photo-google/' + photo.googleFileId + '/' + targetSz);

			const blob = new Blob([Buffer.from(data.data) as unknown as ArrayBuffer], { type: 'image/jpeg' });
			state.pendingDownload.readyPhotos.push({ photo, blob });
		}

		const isMultiple = state.pendingDownload?.readyPhotos.length > 1;
		let finalBlob;

		if (isMultiple) {
			const zip = new JSZip();
			state.pendingDownload.readyPhotos.forEach(({ photo, blob }) => {
				zip.file(`${photo.filename}`, blob, { compression: 'DEFLATE' });
			})
			const zipBuffer = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
			finalBlob = new Blob([zipBuffer], { 'type': 'application/zip' });
		} else {
			finalBlob = state.pendingDownload?.readyPhotos[0].blob;
		}

		state.pendingDownload.downloadName = isMultiple ? state.gallery.name + '.zip' : state.pendingDownload?.readyPhotos[0].photo.filename;
		state.pendingDownload.finalBlob = finalBlob;
		state.pendingDownload.status = 'finished';

		if (state.pendingDownload.readyPhotos.length === 1) {
			loadDownloadLink();
		}
	}
	catch (e: any) {
		console.error(e);
		state.pendingDownload.error = e.message;
		state.pendingDownload.status = 'error';
	}
}

function restartDownload() {
	if (!state.pendingDownload) return;
	const download = state.pendingDownload;
	state.pendingDownload = null;
	startDownloadPhotos2(download.photosToDownload, download.res);
}


async function loadDownloadLink() {
	if (state.pendingDownload?.status !== 'finished' || !state.pendingDownload?.finalBlob) return;

	var url = URL.createObjectURL(state.pendingDownload?.finalBlob);
	const link = document.createElement('a');
	link.href = url;
	link.download = state.pendingDownload.downloadName!;
	link.click();
	link.remove();
	URL.revokeObjectURL(url);

	state.pendingDownload = null;
}

</script>


<template>
	<LoadSplash v-if="!state.gallery" />
	<div v-else id="viewGallery" :class="{ isMobile }">
		<div id="cover" @click="scrollToTop">
			<GalleryCover :gallery="state.gallery" />
			<div v-if="canView" class="down-pointer"><i class="pi pi-chevron-down" /></div>
		</div>

		<div v-if="showLoginModal || !canView" class="login-guard">
			<LoginModal v-if="authMode === 'login'" message="Please sign in to view this gallery"  :closeable="showLoginModal" @close="showLoginModal = false" />
			<div v-if="authMode === 'code'" class="code-modal modal">
				<img :src="watermarkImage" width="100" />
				<h3>Please enter the access code to view this gallery</h3>
				<CodeInput v-model="state.providedCode" />
				<Button label="Submit" @click="loadGallery" :loading="state.isLoading" class="gap-2" />
				<div>Need to <a @click="authMode = 'login'" class="underline">sign in</a>?</div>
			</div>
		</div>

		<div v-if="canView">
			<NavBar sticky>
				<template #logo>
					<DropdownMenu :model="state.gallery?.sections.map(s => ({ label: s.name, command() { scrollToSection(s) } }))">
						<div class="flex align-items-center">
							{{ state.gallery.name }}
							<i class="pi pi-angle-down ml-1 text-black-alpha-40" />
						</div>
					</DropdownMenu>
				</template>

				<div class="flex align-items-center">
					<div class="flex-grow-1"></div>
					<div class="flex">
						<Button icon="pi pi-heart" text @click="state.showFavoritesModal = true"
							v-tooltip.bottom="'Favorites'" />
						<div>
							<Badge v-if="state.favoriteIds.size > 0" severity="contrast" :value="state.favoriteIds.size"
								class="small-badge" />
						</div>
						<RefOpener :component="OverlayPanel">
							<template #trigger><Button icon="pi pi-download" text v-tooltip.bottom="'Download Gallery'" /></template>
							<template #ref>
								<div v-if="doClientActions" class="flex flex-column gap-3 w-20rem">
									<Button class="justify-content-center" @click="startDownloadPhotos2(allPhotos, RESOLUTION.x1024)">Download Gallery</Button>
									<div>
										<p>A .zip folder will be created with all {{ allPhotos.length }} photos at a web-compatible resolution.</p>
										<p>This may take several minutes.</p>
									</div>
									<p>For printable full-resolution files, download each photo individually.</p>
								</div>

								<div v-else class="flex flex-column gap-3 w-20rem">
									<p>Photos may be downloaded by the gallery owner. Please <a class="text-link primary" @click="showLoginModal = true">login</a> or contact Rachel for assistance.</p>
								</div>
							</template>
						</RefOpener>
						<Button v-if="state.gallery.clientCanShare" icon="pi pi-user-plus" text
							@click="state.showShareModal = true" v-tooltip.bottom="'Manage Access'" />
						<Button v-if="isAdmin" icon="pi pi-cog" text
							@click="router.push('/admin/galleries/' + state.gallery.id)" v-tooltip.bottom="'Manage Gallery'" />
					</div>
				</div>
			</NavBar>

			<div class="sections-wrapper">
				<div v-for="section in state.gallery.sections" :id="'section_'+section.id" :key="section.id" class="section mt-3">
					<div class="section-header font-serif">{{ section.name }}</div>
					<PhotoWall :photos="section.photos" :lazyLoad="true" :animate="true" >
						<template v-slot="{ photo }">
							<div class="photo-overlay" :class="{ 'selected': state.selectedIds.has(photo.id) }" :id="'slideshow-scroll-target__'+photo.id">
								<div class="photo-trigger" @click="() => showSelectors ? toggleSelected(photo) : openSlideshow(allPhotos, photo)" @contextmenu.prevent="toggleSelected(photo)">
								</div>
								<div class="bottom-bar">
									<div class="buttons">
										<div class="button" :class="{ 'heart-fixed': useAppStore().isMobile || state.favoriteIds.has(photo.id) }"
											@click="toggleFavorite(photo)"><i
												:class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" />
										</div>
										<div class="button" v-if="!isMobile && doClientActions" @click="openDownloadDialog([photo])"><i class="pi pi-download" /></div>
									</div>
								</div>
								<div v-if="doClientActions && (showSelectors || !useAppStore().isMobile)" class="selector" :class="{ 'show': showSelectors }" @click="() => toggleSelected(photo)">
									<Checkbox :modelValue="state.selectedIds.has(photo.id)"
										binary variant="outlined" />
								</div>
								<div v-if="showSelectors" class="slideshow-trigger button"
									@click="() => openSlideshow(allPhotos, photo)"><i class="pi pi-expand" /></div>
							</div>
						</template>
					</PhotoWall>
				</div>
			</div>

			<div class="favorites-modal modal" v-if="state.showFavoritesModal">
				<div class="flex align-items-center ml-2">
					<h3>Favorites ({{ state.favoriteIds.size }})</h3>
					<div class="flex-grow-1"></div>
					<Button icon="pi pi-download" text v-if="doClientActions" @click="openDownloadDialog(favoritePhotos)" />
					<Button icon="pi pi-times" text @click="state.showFavoritesModal = false" />
				</div>
				<div class="body">
					<PhotoWall :photos="favoritePhotos">
						<template v-slot="{ photo }">
							<div class="photo-overlay">
								<div class="photo-trigger"
									@click="() => openSlideshow(favoritePhotos, photo)"></div>
								<div class="bottom-bar">
									<div class="buttons">
										<div class="button" :class="{ 'heart-fixed': useAppStore().isMobile || state.favoriteIds.has(photo.id) }"
											@click="toggleFavorite(photo)"
										>
											<i :class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" />
										</div>
										<div class="button" v-if="!useAppStore().isMobile && doClientActions" @click="openDownloadDialog([photo])"><i class="pi pi-download" /></div>
									</div>
								</div>
							</div>
						</template>
					</PhotoWall>
				</div>
			</div>

			<Snackbar v-if="state.selectedIds.size > 0" closeable @close="state.selectedIds.clear()">
				<template #content>
					<div class="flex align-items-center gap-2">
						<i :class="state.selectedIds.size === 1 ? 'pi pi-image' : 'pi pi-images'" />
						<div>{{ state.selectedIds.size }} photo{{ state.selectedIds.size === 1 ? '' : 's' }} selected</div>
					</div>
				</template>
				<template #actions>
					<div class="flex-grow-1"></div>
						<Button icon="pi pi-download" text v-if="doClientActions" @click="openDownloadDialog(selectedPhotos)" />
				</template>
			</Snackbar>

			<div class="pending-download modal low-right-modal flex align-items-center gap-3"
				v-if="state.pendingDownload">
				<template v-if="state.pendingDownload.status === 'finished'">
					<i class="pi pi-check" />
					<div>Download ready!</div>
					<div class="flex-grow-1" />
					<div>
						<Button icon="pi pi-download" text @click="loadDownloadLink" />
						<Button icon="pi pi-times" text @click="state.pendingDownload = null" />
					</div>
				</template>

				<template v-else-if="state.pendingDownload.status === 'error'">
					<i class="pi pi-exclamation-triangle" />
					<div>Download failed</div>
					<div class="flex-grow-1"></div>
					<div>
						<Button icon="pi pi-replay" text @click="restartDownload" />
						<Button icon="pi pi-times" text @click="state.pendingDownload = null" />
					</div>
				</template>

				<template v-else>
					<div>Preparing download...</div>
					<div class="flex-grow-1">
						<ProgressBar
							:mode="state.pendingDownload.readyPhotos.length ? 'determinate' : 'indeterminate'"
							:value="Math.max(state.pendingDownload.readyPhotos.length / state.pendingDownload.photosToDownload.length * 100, 5)"
						>
							{{}}
						</ProgressBar>
					</div>
				</template>
			</div>

			<Slideshow ref="slideshow">
				<template v-slot="{ photo }">
					<div v-if="doClientActions" class="selector pb-1 mr-2" :class="{ 'show': showSelectors }" @click="() => toggleSelected(photo)">
						<Checkbox :modelValue="state.selectedIds.has(photo.id)"
							binary variant="outlined" />
					</div>
					<Button text :icon="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
						@click="toggleFavorite(photo)" size="large" />
					<Button text icon="pi pi-download" size="large" v-if="doClientActions" @click="openDownloadDialog([photo])" />
				</template>
			</Slideshow>

			<ShareModal v-model="state.gallery" v-if="state.showShareModal" @close="state.showShareModal = false" />
		</div>

		<Sidebar
			v-model:visible="showDownloadDialog"
			:position="useAppStore().isMobile ? 'bottom' : 'right'"
			:header="`Download ${downloadDialogPhotos.length} photo${downloadDialogPhotos.length === 1 ? '' : 's'}`"
			class="w-full sm:w-25rem h-full"
			blockScroll
		>
			<div class="flex flex-column h-full overflow-hidden gap-3">
				<!-- <div
					class="relative h-13rem flex-shrink-0"
				>
					<div
						v-for="file, index in previewPhotoStack"
						:key="file.googleFileId"
						class="w-12rem h-12rem"
						style="position: absolute; translate: -50% -50%; filter: drop-shadow(0 0 0.25rem #0003)"
						:style="{ top: `${50 + index}%`, left: `${50 + index}%`, opacity: 1 * ((index + 1) / previewPhotoStack.length), transform: `rotate(${(20 * (index / (previewPhotoStack.length))) - 10}deg)` }"
					>
						<PhotoFrame
							:photo="{ id: file.googleFileId, googleFileId: file.googleFileId }"
							size="md"
						/>
					</div>
				</div> -->

				<p>Review the target resolution for each photo:</p>

				<div class="flex flex-column flex-grow-1 overflow-y-auto gap-2">
					<div v-for="photo in downloadDialogPhotos" class="flex align-items-center gap-2">
						<div class="h-5rem w-5rem flex-shrink-0">
							<PhotoFrame
								:photo="photo"
							/>
						</div>
						<div class="flex-grow-1 flex flex-column justify-content-center align-items-start overflow-hidden">
							<div class="font-medium w-full text-ellipsis">{{ photo.filename }}</div>
							<div class="flex flex-wrap gap-2">
								<span>{{ resolutionString(resolvedResolution(photo, selectedRes.size)) }}</span>
								<span v-if="smallestEdgePx(photo) < selectedRes.size" class="bg-orange-300 px-2 border-round white-space-nowrap">Too small</span>
							</div>
						</div>
						<div>
							<Button icon="pi pi-times" text @click="removePhotoFromDownload(photo)" />
						</div>
					</div>
				</div>

				<p>Select the resolution for your download:</p>
				<Dropdown v-model="selectedRes" :options="Object.values(Resolutions)">
					<template #value="{ value: res }">
						<div class="font-semibold">
							For {{ res.bestFor }}
						</div>
						<div>
							<template v-if="downloadDialogPhotos.length === 1">{{ resolutionString(resolvedResolution(downloadDialogPhotos[0], res.size)) }}</template>
							<template v-else>{{res.size}} on the shorter side</template>
						</div>
						<div class="text-sm" v-if="res.size > minShortSideOfDownload">Available upon request</div>
					</template>
					<template #option="{ option: res }">
						<div>
							<div class="font-semibold">
								For {{ res.bestFor }}
							</div>
							<div>
								<template v-if="downloadDialogPhotos.length === 1">{{ resolutionString(resolvedResolution(downloadDialogPhotos[0], res.size)) }}</template>
								<template v-else>{{res.size}} on the shorter side</template>
							</div>
							<div class="text-sm" v-if="res.size > minShortSideOfDownload">Available upon request</div>
						</div>
					</template>
				</Dropdown>


				<div>
					<div v-if="tooSmallPhotos.length" class="mb-2 text-center">
						{{ tooSmallPhotos.length }} selected images are not stored at that resolution, but can be updated upon request.
					</div>
					<Button
						severity="primary"
						size="large"
						class="w-full flex align-items-center justify-content-center gap-2" 
						:disabled="!selectedRes"
						@click="handleDownloadDialogButton"
					>
						<template v-if="tooSmallPhotos.length">
							Request resolution
						</template>
						<template v-else-if="downloadDialogMode === 'selectRes' && downloadDialogPhotos.length > 1">
							<i class="pi pi-download" />
							Start download
						</template>
						<template v-else>
							<i class="pi pi-download" />
							Start download
						</template>
					</Button>
				</div>
			</div>

		</Sidebar>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

.small-badge {
	position: absolute;
	transform: translate(-25px, 0px);
	zoom: .6;
	font-size: 1em;
	aspect-ratio: 1;
	border-radius: 2em;
	height: auto;
	display: flex;
	align-items: center;
	justify-content: center;
}


.login-guard {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: #fff5;
	backdrop-filter: blur(7px);
	z-index: 1000;
	cursor: auto;

	.code-modal {
		background: #fff;
		border: 1px solid lightgrey;
		outline: 10px solid #fff;
		box-shadow: 0px 0px 9px 11px #0005;
		border-radius: 0;
		padding: 2em;
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;
	}
}

#viewGallery {
	#cover {
		width: 100%;
		height: 100vh;
		position: relative;
		overflow: hidden;
		cursor: pointer;

		.down-pointer {
			position: absolute;
			left: 50%;
			color: #fff;
			background: #0005;
			border-radius: 50%;
			height: 3em;
			width: 3em;
			transform: translateX(-50%);
			line-height: 3.1em;
			text-align: center;
			animation: rise 1s ease 2s forwards;

			@keyframes rise {
				0% {
					bottom: -100px;
				}

				100% {
					bottom: 20px;
				}
			}
		}
	}

	&.isMobile #cover {
		height: calc(100vh - 60px);
	}

	.sections-wrapper {
		padding: 0 5%;
		margin-bottom: 3em;
	}

	.section-header {
		font-size: 1.2rem;
		padding: 7em 0 4em;
		text-align: center;
		text-transform: uppercase;
		font-family: "serif";
		letter-spacing: .1em;
	}

	.selector {
		zoom: 1.3;
	}

	.photo-overlay {
		width: 100%;
		height: 100%;
		position: absolute;

		&.selected {
			border: 8px solid #fff;
			box-shadow: 0 2px 5px #0005;
			transition: 300ms linear;

			.selector {
				background: #fff;
				margin: -5px 0 0 -2px;
				opacity: 1;
				transition: 300ms linear;
			}
		}


		.selector {
			position: absolute;
			top: 0;
			left: 0;
			padding: 5px;
			margin: 0 0 0 5px;
			opacity: 0;

			&.show {
				opacity: 1;
			}
		}


		.button {
			width: 2.5rem;
			height: 2.5rem;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
		}

		.slideshow-trigger {
			position: absolute;
			top: 0;
			right: 0;
			background: #0005;
			color: #fff;
		}

		&:hover .slideshow-trigger {
			opacity: 1;
			transition: 300ms;
		}

		.photo-trigger {
			width: 100%;
			height: 100%;
			cursor: pointer;
		}

		.bottom-bar {
			position: absolute;
			bottom: 0;
			width: 100%;
			color: white !important;
			padding-top: 1em;
			pointer-events: none;
			box-shadow: none;

			.buttons {
				pointer-events: all;
				width: auto;
				display: inline-flex;

				.button {
					opacity: 0;

					i {
						font-size: 1.5rem;
					}

					&.heart-fixed {
						opacity: 1;
						filter: drop-shadow(0px 0px 2px #0008);
					}
				}

				&:hover .button {
					opacity: .7;

					&:hover {
						opacity: 1;
					}
				}
			}
		}

		&:hover .selector {
			opacity: 1;
		}

		&:hover .bottom-bar {
			box-shadow: inset 0 -3em 1em -1em #0000004d;
			transition: 500ms;
		}

		&:hover .bottom-bar .buttons:not(:hover) .button {
			opacity: 1;
			transition: opacity 300ms;
		}

	}

	.favorites-modal {
		padding: .5em;
		width: 800px;
		max-width: 80vw;

		.body {
			margin: .5em;
			max-height: 70vh;
			overflow-y: auto;
			overflow-x: hidden;
		}
	}
}

#viewGallery.isMobile {
	.sections-wrapper {
		padding: 0 5px;
	}
}

.res-option {
	padding: 0.4rem 0.6rem;
	color: var(--bluegray-600);
	border: 1px solid;
	border-radius: 0.5rem;

	&.selected {
		color: $primary-dark;
	}
}
</style>