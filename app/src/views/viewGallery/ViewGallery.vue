<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onMounted, computed, watch } from 'vue';
import request from '@/services/request';
import Slideshow from './Slideshow.vue';
import GalleryCover from '@/components/GalleryCover.vue';
import LoginModal from '@/components/LoginModal.vue';
import NavBar from '@/components/NavBar.vue';
import Button from 'primevue/button';
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
import InputNumber from 'primevue/inputnumber';
import OverlayPanel from 'primevue/overlaypanel';
import RefOpener from '@/components/RefOpener.vue';

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const state = reactive({
	isLoading: true,
	galleryIdOrSlug: router.currentRoute.value.params.galleryId,
	viewAuth: {} as any,
	gallery: null as any,
	providedCode: null,
	slideshowPhotos: [],
	firstSlideshowPhoto: null,
	favoriteIds: new Set(),
	showFavoritesModal: false,
	showShareModal: false,
	didAdminWarn: false,
	selectedIds: new Set(),
	pendingDownload: null as {
		status: 'processing' | 'finished' | 'error',
		photosToDownload: any[],
		hiRes: boolean,
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

const showSlideshow = computed(() => router.currentRoute.value.query.slideshow === 'true' && state.slideshowPhotos.length > 0);


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

const authMode = ref('login');

onMounted(() => {
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
	}

	state.isLoading = false;
}

const allPhotos = computed(() => state.gallery?.sections?.flatMap(s => s.photos));

function openSlideshow(photos, firstPhoto) {
	state.slideshowPhotos = photos;
	state.firstSlideshowPhoto = firstPhoto;
	router.push({ query: { slideshow: 'true' } });
}

function closeSlideshow() {
	router.back();
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


function scrollDown() {
	if (canView.value) {
		const cover = document.getElementById('cover');
		window.scrollTo(0, cover!.offsetTop + cover!.offsetHeight);
	}
}

function downloadMenu(photos, cb?) {
	return [
		{
			label: 'Shareable file',
			command: () => { startDownloadPhotos(photos); cb?.call(); }
		},
		photos.length === 1 ? {
			label: `Printable file (${(photos[0].size / 1e+6).toFixed(1)} MB)`,
			command: () => { startDownloadPhotos(photos, true); cb?.call(); }
		} : null,
	].filter(Boolean);
}


// my server can't handle pulling large files from google yet, so full print res must be downloaded one at a time
async function startDownloadPhotos(photos, hiRes = false) {
	// download individual hi res through google
	if (hiRes && photos.length === 1) {
		const link = document.createElement('a');
		link.href = `https://drive.google.com/uc?id=${photos[0].googleFileId}&export=download`;
		link.download = photos[0].filename;
		link.click();
		link.remove();
		return;
	}


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
		hiRes,
	};

	try {
		// have to do these one at a time to not crash server
		for (const photo of photos) {
			let width = photo.width;

			let maxBytes = megaBytes.value * 1e+6; // X MB
			console.log(photo.size * 1e-6, maxBytes / 1e+6);
			// if (hiRes && photo.size > maxBytes) {
			// 	// compute new width to approximate desired size
			// 	// new width = sqrt(area * (width / height))
			// 	const scaleRatio = maxBytes / photo.size;
			// 	const targetArea = (width * photo.height) * scaleRatio;
			// 	const ratio = photo.width / photo.height;
			// 	width = Math.sqrt(targetArea * ratio);
			// }
			// if (!hiRes) {
				if (photo.width < photo.height) {
					width = 1600 * (photo.width / photo.height);
				}
				else {
					width = 1600;
				}
			// }

			const { data } = await request.get('/gallery/' + state.gallery.id + '/photo-google/' + photo.googleFileId + '/' + Math.round(width));

			const blob = new Blob([Buffer.from(data.data)], { type: 'image/jpeg' });
			state.pendingDownload.readyPhotos.push({ photo, blob });
			console.log(blob.size * 1e-6);
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
	startDownloadPhotos(download.photosToDownload, download.hiRes);
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
		<div id="cover" @click="scrollDown">
			<GalleryCover :gallery="state.gallery" />
			<div v-if="canView" class="down-pointer"><i class="pi pi-chevron-down" /></div>
		</div>

		<div v-if="!canView" class="login-guard">
			<LoginModal v-if="authMode === 'login'" message="Please sign in to view this gallery" />
			<div v-if="authMode === 'code'" class="code-modal modal">
				<img :src="watermarkImage" width="100" />
				<h3>Please enter the access code to view this gallery</h3>
				<CodeInput v-model="state.providedCode" />
				<Button label="Submit" @click="loadGallery" :loading="state.isLoading" class="gap-2" />
				<div>Need to <a @click="authMode = 'login'" class="underline">sign in</a>?</div>
			</div>
		</div>

		<div v-if="canView">
			<NavBar>
				<div class="flex align-items-center">
					<div>

					</div>
					<div class="flex-grow-1"></div>
					<div class="flex">
						<Button icon="pi pi-heart" text @click="state.showFavoritesModal = true"
							v-tooltip.bottom="'Favorites'" />
						<div>
							<Badge v-if="state.favoriteIds.size > 0" severity="contrast" :value="state.favoriteIds.size"
								class="small-badge" />
						</div>
						<template v-if="doClientActions">
							<RefOpener v-if="doClientActions" :component="OverlayPanel">
								<template #trigger><Button icon="pi pi-download" text v-tooltip.bottom="'Download Gallery'" /></template>
								<template #ref>
									<div class="flex flex-column gap-3 w-20rem">
										<Button class="justify-content-center" @click="startDownloadPhotos(allPhotos)">Download Gallery</Button>
										<div>
											<p>A .zip folder will be created with all {{ allPhotos.length }} photos at a web-compatible resolution.</p>
											<p>This may take several minutes.</p>
										</div>
										<p>For printable full-resolution files, download each photo individually.</p>
									</div>
								</template>
							</RefOpener>
							<Button v-if="state.gallery.clientCanShare" icon="pi pi-user-plus" text
								@click="state.showShareModal = true" v-tooltip.bottom="'Manage Access'" />
							<Button v-if="isAdmin" icon="pi pi-cog" text
								@click="router.push('/admin/galleries/' + state.gallery.id)" v-tooltip.bottom="'Manage Gallery'" />
						</template>
					</div>
				</div>
			</NavBar>

			<!-- <InputNumber v-if="isAdmin" v-model="megaBytes" /> -->

			<div class="sections-wrapper">
				<div v-for="section in state.gallery.sections" :key="section.id" class="section mt-3">
					<div class="section-header">{{ section.name }}</div>
					<PhotoWall :photos="section.photos">
						<template v-slot="{ photo }">
							<div class="photo-overlay" :class="{ 'selected': state.selectedIds.has(photo.id) }">
								<div class="photo-trigger" @click="() => !isMobile && openSlideshow(allPhotos, photo)">
								</div>
								<div class="bottom-bar">
									<div class="buttons">
										<div class="button" :class="{ 'heart-fixed': state.favoriteIds.has(photo.id) }"
											@click="toggleFavorite(photo)"><i
												:class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" />
										</div>
										<DropdownMenu v-if="doClientActions" :model="downloadMenu([photo])">
											<div class="button"><i class="pi pi-download" /></div>
										</DropdownMenu>
									</div>
								</div>
								<div v-if="doClientActions" class="selector" :class="{ 'show': showSelectors }">
									<Checkbox :modelValue="state.selectedIds.has(photo.id)"
										@click="() => toggleSelected(photo)" binary variant="outlined" />
								</div>
								<div v-if="isMobile" class="slideshow-trigger button"
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
					<DropdownMenu v-if="doClientActions" :model="downloadMenu(favoritePhotos)"><Button
							icon="pi pi-download" text />
					</DropdownMenu>
					<Button icon="pi pi-times" text @click="state.showFavoritesModal = false" />
				</div>
				<div class="body">
					<PhotoWall :photos="favoritePhotos">
						<template v-slot="{ photo }">
							<div class="photo-overlay">
								<div class="photo-trigger"
									@click="() => !isMobile && openSlideshow(favoritePhotos, photo)"></div>
								<div class="bottom-bar">
									<div class="buttons">
										<div class="button" :class="{ 'heart-fixed': state.favoriteIds.has(photo.id) }"
											@click="toggleFavorite(photo)"><i
												:class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" />
										</div>
										<DropdownMenu v-if="doClientActions" :model="downloadMenu([photo])">
											<div class="button"><i class="pi pi-download" /></div>
										</DropdownMenu>
									</div>
								</div>
								<div v-if="isMobile" class="slideshow-trigger button"
									@click="() => openSlideshow(favoritePhotos, photo)"><i class="pi pi-expand" /></div>
							</div>
						</template>
					</PhotoWall>
				</div>
			</div>

			<div class="selection-bar modal low-right-modal" v-if="state.selectedIds.size > 0">
				<div class="flex align-items-center gap-2">
					<i :class="state.selectedIds.size === 1 ? 'pi pi-image' : 'pi pi-images'" />
					<div>{{ state.selectedIds.size }} photo{{ state.selectedIds.size === 1 ? '' : 's' }} selected</div>
				</div>
				<div class="flex-grow-1"></div>
				<DropdownMenu :model="downloadMenu(selectedPhotos, () => state.selectedIds.clear())"><Button
						icon="pi pi-download" text /></DropdownMenu>
				<Button icon="pi pi-times" text @click="state.selectedIds.clear()" />
			</div>

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

			<Slideshow v-if="showSlideshow" :photos="state.slideshowPhotos" :firstPhoto="state.firstSlideshowPhoto"
				:onClose="closeSlideshow">
				<template v-slot="{ photo }">
					<Button text :icon="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
						@click="toggleFavorite(photo)" size="large" />
					<DropdownMenu v-if="doClientActions" :model="downloadMenu([photo])">
						<Button text icon="pi pi-download" size="large" />
					</DropdownMenu>
				</template>
			</Slideshow>

			<ShareModal v-model="state.gallery" v-if="state.showShareModal" @close="state.showShareModal = false" />
		</div>

	</div>
</template>

<style scoped lang="scss">
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
		margin: 7em 0 4em;
		text-align: center;
		text-transform: uppercase;
		font-family: "serif";
		letter-spacing: .1em;
	}


	.photo-overlay {
		width: 100%;
		height: 100%;
		position: absolute;

		&.selected {
			border: 8px solid #fff;
			box-shadow: 0 2px 5px #0005;
			transition: 300ms;

			.selector {
				background: #fff;
				margin: -8px 0 0 -3px;
				opacity: 1;
				transition: 300ms;
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
			opacity: 0;
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
						font-size: 1.2rem;
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

.low-right-modal.modal {
	bottom: 10px;
	top: auto;
	left: auto;
	right: 10px;
	transform: none;
	width: 300px;
	display: flex;
	align-items: center;
	padding: .5em 1em;
}

#viewGallery.isMobile {
	.sections-wrapper {
		padding: 0 5px;
	}
}
</style>