<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onMounted, onBeforeUnmount, computed } from 'vue';
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

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const state = reactive({
	isLoading: true,
	galleryIdOrSlug: router.currentRoute.value.params.galleryId,
	viewAuth: {},
	gallery: null,
	providedCode: null,
	showSlideshow: false,
	slideshowPhotos: [],
	firstSlideshowPhoto: null,
	favoriteIds: new Set(),
	showFavoritesModal: false,
	showShareModal: false,
	didAdminWarn: false
});

const isLoggedIn = computed(() => userStore.isLoggedIn);
const isAdmin = computed(() => userStore.currentUser?.isAdmin);
const isClient = computed(() => userStore.currentUser?.email === state.gallery.clientEmail);
const favoritePhotos = computed(() => state.gallery.sections.flatMap(s => s.photos).filter(p => state.favoriteIds.has(p.id)));
const favoritesKey = computed(() => `gallery/${state.gallery.id}/favorites`);

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
const authMode = computed(() => {
	if (state.gallery?.shareMode === 'code') {
		return 'code';
	}
	else {
		return 'login';
	}
});

onMounted(() => {
	loadGallery();
});

async function loadGallery () {
	state.isLoading = true;
	const code = state.providedCode || localStorage.getItem('gallery/' + state.galleryIdOrSlug + '/code');
	const { data } = await request.get('gallery/' + state.galleryIdOrSlug, { params: { code } });
	state.gallery = data.data;
	state.viewAuth = data.viewAuth;
	
	if (data.success) {
		state.favoriteIds = new Set(JSON.parse(localStorage.getItem(favoritesKey.value) || '[]'));

		if (code) localStorage.setItem('gallery/' + state.galleryIdOrSlug + '/code', code);

		if (!state.didAdminWarn && isAdmin.value && ['draft', 'hidden'].includes(state.gallery.visibility)) {
			toast.add({
				severity: 'warn',
				summary: 'This gallery is ' + state.gallery.visibility + '. Only admins can view it.',
				life: 3000,
			})
			state.didAdminWarn = true;
		}
	}

	state.isLoading = false;
}

function downloadHighRes(photo) {
	const link = document.createElement('a');
	link.href = `https://drive.google.com/uc?export=download&id=${photo.googleFileId}`;
	link.download = photo.filename;
	link.click();
}

function openSlideshow(photo?) {
	state.slideshowPhotos = state.gallery.sections.flatMap(s => s.photos);
	state.firstSlideshowPhoto = photo;
	state.showSlideshow = true;
}
function openFavoritesSlideshow(photo?) {
	state.slideshowPhotos = favoritePhotos.value;
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


function scrollDown() {
	if (canView.value) {
		const cover = document.getElementById('cover');
		window.scrollTo(0, cover!.offsetTop + cover!.offsetHeight);
	}
}

</script>


<template>
	<div v-if="!state.gallery">Loading...</div>
	<div v-else id="viewGallery">
		<div id="cover" @click="scrollDown">
			<GalleryCover :gallery="state.gallery" />
			<div class="down-pointer"><i class="pi pi-chevron-down" /></div>
		</div>

		<div v-if="!canView" class="login-guard">
			<LoginModal v-if="authMode === 'login'" message="Please sign in to view this gallery" />
			<div v-if="authMode === 'code'" class="code-modal modal">
				<img :src="watermarkImage" width="100" />
				<h3>Please enter the access code to view this gallery</h3>
				<CodeInput v-model="state.providedCode" />
				<Button label="Submit" @click="loadGallery" :loading="state.isLoading" class="gap-2" />
			</div>
		</div>

		<div v-else>
			<NavBar>
				<div class="flex align-items-center">
					<div>

					</div>
					<div class="flex-grow-1"></div>
					<div>
						<Button icon="pi pi-heart" text @click="state.showFavoritesModal = true" v-tooltip.bottom="'Favorites'" />
						<Badge v-if="state.favoriteIds.size > 0" severity="contrast" :value="state.favoriteIds.size"
							class="small-badge" />
						<template v-if="isClient">
							<Button icon="pi pi-download" text v-tooltip.bottom="'Download'" />
							<Button v-if="state.gallery.clientCanShare" icon="pi pi-user-plus" text @click="state.showShareModal = true" v-tooltip.bottom="'Manage Access'" />
						</template>
					</div>
				</div>
			</NavBar>

			<div class="m-4">
				<div v-for="section in state.gallery.sections" :key="section.id" class="section mt-3">
					<div class="section-header">{{ section.name }}</div>
					<PhotoWall :photos="section.photos">
						<template v-slot="{ photo }">
							<div class="photo-overlay">
								<div class="photo-trigger" @click="() => openSlideshow(photo)"></div>
								<div class="bottom-bar">
									<div class="buttons">
										<div class="button" :class="{ 'heart-fixed': state.favoriteIds.has(photo.id) }"
											@click="toggleFavorite(photo)"><i
												:class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" />
										</div>
										<div class="button" @click="downloadHighRes(photo)"><i class="pi pi-download" />
										</div>
									</div>
								</div>
							</div>
						</template>
					</PhotoWall>
				</div>
			</div>

			<div class="favorites-modal modal" v-if="state.showFavoritesModal">
				<div class="flex align-items-center ml-2">
					<h3>Favorites</h3>
					<div class="flex-grow-1"></div>
					<Button icon="pi pi-download" text />
					<Button icon="pi pi-times" text @click="state.showFavoritesModal = false" />
				</div>
				<div class="body">
					<PhotoWall :photos="favoritePhotos">
						<template v-slot="{ photo }">
							<div class="photo-overlay">
								<div class="photo-trigger" @click="() => openFavoritesSlideshow(photo)"></div>
								<div class="bottom-bar">
									<div class="buttons">
										<div class="button" :class="{ 'heart-fixed': state.favoriteIds.has(photo.id) }"
											@click="toggleFavorite(photo)"><i
												:class="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" />
										</div>
										<div class="button" @click="downloadHighRes(photo)"><i class="pi pi-download" />
										</div>
									</div>
								</div>
							</div>
						</template>
					</PhotoWall>
				</div>
			</div>

			<Slideshow v-if="state.showSlideshow" :photos="state.slideshowPhotos"
				:firstPhoto="state.firstSlideshowPhoto" :onClose="() => state.showSlideshow = false">
				<template v-slot="{ photo }">
					<Button text :icon="state.favoriteIds.has(photo.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" @click="toggleFavorite(photo)" />
					<Button text @click="downloadHighRes(photo)" icon="pi pi-download" />
				</template>
			</Slideshow>

			<ShareModal v-model="state.gallery" v-if="state.showShareModal" @close="state.showShareModal = false" />
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

.small-badge {
	position: absolute;
	transform: translate(-25px, 0px);
	zoom: .6;
	font-size: 1em;
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
			line-height: 3.4em;
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

	.section-header {
		font-size: 2em;
		margin: 3em 0 2em;
		text-align: center;
	}


	.photo-overlay {
		width: 100%;
		height: 100%;
		position: absolute;

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
					width: 40px;
					height: 40px;
					font-size: 20px;
					display: inline-flex;
					justify-content: center;
					align-items: center;
					cursor: pointer;

					i {
						font-size: 20px;
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

		&:hover .bottom-bar {
			box-shadow: inset 0 -2em 1em rgba(0, 0, 0, 0.3);
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
</style>