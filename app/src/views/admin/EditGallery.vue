<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, watch } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useUploaderStore } from './uploader/uploader.store';
import { GoogleUploadService } from '@/services/googleUploadService';
import GalleryCover from '@/components/GalleryCover.vue';
import Calendar from 'primevue/calendar';
import FocalPointInput from '@/components/FocalPointInput.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import DropdownMenu from '@/components/DropdownMenu.vue';
import GhostInput from '@/components/InlineInput.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import { visibilityOptions } from '@/utils/visibilityOptions';
import ShareModal from '@/components/GalleryAccessModal.vue';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const uploaderStore = useUploaderStore();
const toast = useToast();

const coverStyles = [
	'full',
	'half',
	'overlay',
];

const state = reactive({
	isSaving: false,
	lastSaved: null as Date | null,
	skipAutoSave: false,
	galleryId: router.currentRoute.value.params.galleryId,
	gallery: null as any,
	showUploadToSection: null as any,
	isProcessingFiles: false,
	imagesToUpload: new Set<any>(),
	showShareModal: false,
});

onBeforeMount(async () => {
	const { data } = await request.get('admin/gallery/' + state.galleryId);

	if (!data.data) {
		router.push('/admin/galleries');
		return;
	}

	state.gallery = data.data;

	if (state.gallery.date) state.gallery.date = new Date(state.gallery.date);

	// set some defaults....
	if (!state.gallery.coverStyle) {
		state.gallery.coverStyle = 'full';
	}
	if (!state.gallery.coverSettings) {
		state.gallery.coverSettings = {
			textPlacement: 'center',
			border: false,
		};
	}
})

let oldGallery = 'null';
watch(state, (newState) => {
	if (!state.skipAutoSave && oldGallery !== 'null' && JSON.stringify(newState.gallery) !== oldGallery) {
		updateGallery();
	}
	oldGallery = JSON.stringify(newState.gallery);
})

const saveDebounceTime = 1000;
let nextDebounce = 0;

function updateGallery() {
	if (nextDebounce > 0) {
		clearTimeout(nextDebounce);
	}

	state.isSaving = true;
	nextDebounce = setTimeout(async () => {
		// Trusting debounce to make sure the gallery name is complete before saving
		attemptAssignSlug();
		
		await request.put('admin/gallery/' + state.galleryId, state.gallery);
		state.isSaving = false;
		state.lastSaved = new Date();
	}, saveDebounceTime) as any;
}

function attemptAssignSlug() {
	if (!state.gallery.slug && state.gallery.name && state.gallery.name !== 'New Gallery') {
		state.gallery.slug = state.gallery.name.toLowerCase().replace(/([^a-z0-9]+)/gi, '-');
	}
}

function assignCoverPhoto(photo) {
	state.gallery.coverPhoto = photo;
	state.gallery.coverPhotoId = photo.id;
}

function openUploadToSection(section) {
	state.showUploadToSection = section;
}

async function handleFiles(files) {
	state.isProcessingFiles = true;
	for (const file of files) {
		state.imagesToUpload.add(await processImageFile(file));
	}
	state.isProcessingFiles = false;
}

function onImageUploadComplete(newPhoto) {
	state.gallery.sections.find(s => s.id === newPhoto.gallerySectionId)!.photos.push(newPhoto);

	// Use first uploaded image as gallery cover
	if (!state.gallery.coverPhoto) {
		assignCoverPhoto(newPhoto);
	}
}

function processImageFile(file) {
	const photo = {
		blob: file,
		filename: file.name,
		size: file.size,
		type: file.type,
		gallerySectionId: state.showUploadToSection!.id,
		onUploadComplete: onImageUploadComplete,
	} as any;

	var url = URL.createObjectURL(photo.blob);
	photo.dataUrl = url;
	var img = new Image;
	return new Promise((resolve, reject) => {
		img.onload = function () {
			photo.width = img.width;
			photo.height = img.height;
			resolve(photo);
		};
		img.src = url;
	});
}

function removeFileFromUpload(file) {
	state.imagesToUpload.delete(file);
}

function sendToUploader() {
	uploaderStore.queueImages(Array.from(state.imagesToUpload as any));
	state.imagesToUpload.clear();
	state.showUploadToSection = null;
}

function onDragOver(event) {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';
	event.target.classList.add('drag-over');
}
function onDragLeave(event) {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'none';
	event.target.classList.remove('drag-over');
}
function onDrop(event) {
	event.stopPropagation();
	event.preventDefault();
	handleFiles(event.dataTransfer.files);
	event.target.classList.remove('drag-over');
}

async function deletePhoto(photo) {
	if (!confirm('Are you sure you want to delete this photo?')) return;
	if (!GoogleUploadService.hasValidToken) {
		await GoogleUploadService.getToken();
	}
	// TODO check that photo is in activated drive
	try {
		await GoogleUploadService.deleteFile(photo.googleFileId);
		await request.delete('admin/photo/' + photo.id);
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete photo. Will try to restore it in Google Drive.");
		await GoogleUploadService.restoreFile(photo.googleFileId);
		return;
	}
	const deleteFromSection = state.gallery.sections.find(s => s.id === photo.gallerySectionId);
	deleteFromSection.photos = deleteFromSection.photos.filter(p => p.id !== photo.id);
}

async function deleteSection(section) {
	if (!confirm('Are you sure you want to delete this section?')) {
		return;
	}
	const res = await Promise.all(section.photos.map(async (p) => {
		let success = true;
		try {
			await GoogleUploadService.deleteFile(p.googleFileId);
			p.marked_for_deletion = true; // just to hide it from view
		}
		catch (error) {
			console.error(error);
			success = false;
		}
		return {
			photo: p,
			success,
		}
	}));
	const failed = res.filter(r => !r.success);
	if (!failed.length) {
		section.marked_for_deletion = true; // will trigger delete on backend, which should cascade to photos
	}
	else {
		// warn about failed deletion
	}
}

async function addSection() {
	const { data } = await request.post('admin/gallery/' + state.galleryId + '/section');
	state.gallery.sections.push(data.data);
}

function swapSections(aIdx, bIdx) {
	const temp = state.gallery.sections[aIdx];
	state.gallery.sections[aIdx] = state.gallery.sections[bIdx];
	state.gallery.sections[bIdx] = temp;
	state.gallery.sections.forEach((section, idx) => {
		section.order = idx
	});
}

async function copyLink() {
	await navigator.clipboard.writeText(window.location.origin + '/' + (state.gallery.slug || state.gallery.id));
	toast.add({ severity: 'success', summary: 'Copied link', life: 3000 });
}

</script>


<template>
	<div v-if="!state.gallery">Loading...</div>
	<div v-else>
		<div class="flex align-items-center flex-wrap gap-3 mb-4 mt-3">
			<div class="flex align-items-center flex-wrap gap-2">
				<RouterLink to="/admin/"><Button icon="pi pi-arrow-left" text /></RouterLink>
				<h2>
					<GhostInput v-model="state.gallery.name" placeholder="Gallery name..." />
				</h2>
				<div v-if="state.isSaving" class="flex align-items-center gap-2"><i class="pi pi-spinner pi-spin" /> Saving...</div>
				<small v-else-if="state.lastSaved"> All changes saved</small>
			</div>
			<div class="flex-grow-1"></div>
			<div class="flex align-items-center flex-wrap gap-2">
				<div>
					<RouterLink :to="'/' + (state.gallery.slug || state.gallery.id)"><Button icon="pi pi-eye" text
							v-tooltip.bottom="'Preview'" /></RouterLink>
					<Button icon="pi pi-send" text v-tooltip.bottom="'Copy link'" @click="copyLink" />
					<Button icon="pi pi-user-plus" text v-tooltip.bottom="'Manage Access'"
						@click="state.showShareModal = true" />
				</div>
				<div class="flex-grow-1"></div>
				<Dropdown v-model="state.gallery.visibility" :options="Object.keys(visibilityOptions)" outline>
					<template #value="{ value }">
						<div class="flex align-items-center gap-2" :style="{ color: visibilityOptions[value].color }">
							<i :class="visibilityOptions[value].icon" />
							{{ visibilityOptions[value].label }}
						</div>
					</template>
					<template #option="{ option }">
						<div class="flex align-items-center gap-2" :style="{ color: visibilityOptions[option].color }">
							<i :class="visibilityOptions[option].icon" />
							{{ visibilityOptions[option].label }}
						</div>
					</template>
				</Dropdown>
			</div>
		</div>

		<div class="flex flex-wrap gap-5 my-3">
			<div class="gallery-settings">
				<TabView>
					<TabPanel header="Details">
						<div class="settings-grid">
							<label>Gallery date</label>
							<div>
								<Calendar v-model="state.gallery.date" class="galleryDate" />
							</div>
							<label>Direct link</label>
							<div>
								<InputGroup>
									<InputGroupAddon>/</InputGroupAddon>
									<InputText v-model="state.gallery.slug" placeholder="link" />
								</InputGroup>
							</div>
							<label>Client name</label>
							<div>
								<InputText v-model="state.gallery.clientName" placeholder="Name" />
							</div>
							<label>Client email</label>
							<div>
								<InputText v-model="state.gallery.clientEmail" placeholder="Email" />
							</div>
						</div>

					</TabPanel>

					<TabPanel header="Cover">
						<div v-if="!state.gallery.coverPhoto?.id">Upload your photos to choose a cover</div>
						<div v-else>
							<div>Style</div>
							<div class="cover-style-options">
								<div v-for="style in coverStyles" :key="style"
									@click="() => state.gallery.coverStyle = style"
									:classList="['cover-style-option', state.gallery.coverStyle === style ? 'selected' : ''].join(' ')">
									<div class="cover-small">
										<GalleryCover :gallery="state.gallery" :style="style" :preview="true" />
									</div>
								</div>
							</div>
							<br />

							<div class="settings-grid">
								<label>Focal point: </label>
								<div>
									<FocalPointInput v-model="state.gallery.coverSettings.focalPoint"
										:photo="state.gallery.coverPhoto" />
								</div>

								<template v-if="state.gallery.coverStyle === 'full'">
									<label>Border: </label>
									<div>
										<Checkbox v-model="state.gallery.coverSettings.border" binary />
									</div>
									<label>Text placement: </label>
									<div>
										<Dropdown v-model="state.gallery.coverSettings.textPlacement"
											:options="['center', 'bottom']" size="small" />
									</div>
								</template>
							</div>
						</div>

					</TabPanel>
				</TabView>
			</div>
			<div class="cover-previews">
				<div class="cover-preview-wrapper desktop">
					<div class="cover-preview">
						<GalleryCover :gallery="state.gallery" :preview="true" />
					</div>
				</div>
				<div class="cover-preview-wrapper mobile">
					<div class="cover-preview">
						<GalleryCover :gallery="state.gallery" :pretendMobile="true" :preview="true" />
					</div>
					<div class="faux-button" />
				</div>
			</div>
		</div>

		<template v-for="(section, index) in state.gallery.sections" :key="section.id">
			<div v-if="!section.marked_for_deletion" class="my-6 section" :class="{ expanded: section.expanded }">
				<div class="flex align-items-center py-2">
					<h3>
						<GhostInput v-model="section.name" placeholder="Section name..." />
					</h3>
					<div class="flex-grow-1"></div>
					<Button v-if="index > 0" @click="swapSections(index, index - 1)" icon="pi pi-chevron-up" text />
					<Button v-if="index < state.gallery.sections.length - 1" @click="swapSections(index, index + 1)"
						icon="pi pi-chevron-down" text />
					<Button icon="pi pi-trash" text @click="deleteSection(section)" />
				</div>

				<div v-if="section.photos.length">
					<div class="photo-grid">
						<div key="add-photos" class="add-photos photo-grid-item" @click="openUploadToSection(section)">
							<i class="pi pi-plus" />
						</div>

						<template v-for="photo in section.photos" :key="photo.id">
							<div v-if="!photo.marked_for_deletion" class="photo-grid-item">
								<div class="photo-frame">
									<PhotoFrame :photo="photo" />
								</div>
								<div class="options">
									<DropdownMenu
										:model="[{ label: 'Make Cover', command: () => assignCoverPhoto(photo) }, { label: 'Delete', command: () => deletePhoto(photo), class: 'danger' }]">
										<i class="pi pi-ellipsis-v" />
									</DropdownMenu>
								</div>
								<div class="filename">{{ photo.filename }}</div>
							</div>
						</template>
					</div>
					<div v-if="!section.expanded && section.photos.length > 0"
						class="flex align-items-center justify-content-center gap-2 cursor-pointer pt-4"
						@click="section.expanded = true">
						View all ({{ section.photos.length }}) <i class="pi pi-chevron-down" />
					</div>
				</div>

				<div v-else class="flex align-items-center gap-2 cursor-pointer add-photos"
					@click="openUploadToSection(section)">
					<i class="pi pi-plus" />
					Add Photos
				</div>
			</div>
		</template>

		<br />
		<div class="flex justify-content-center"><Button @click="addSection" outlined>&plus; Add Section</Button></div>



		<div v-if="state.showUploadToSection" id="uploadModal" class="modal">
			<div class="mb-3 flex align-items-center gap-2">
				<h3>Add photos to {{ state.showUploadToSection!.name }}</h3>
				<div class="flex-grow-1"></div>
				<Button outlined @click="state.showUploadToSection = null" size="small">Cancel</Button>
				<Button v-if="state.imagesToUpload.size" @click="sendToUploader" size="small" :loading="state.isProcessingFiles">Next</Button>
			</div>
			<div class="drop-images" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
				<label for="fileSelect"><div class="drop-text">
					<div>Drag and drop or <a>select images</a></div>
				</div></label>
				<div class="grid-wrapper">
					<div class="photo-grid">
						<div v-for="photo in state.imagesToUpload" :key="photo.id" class="photo-grid-item upload-item">
							<div class="photo-frame">
								<PhotoFrame :photo="photo as any" size="xs" fillMethod="contain" />
							</div>
							<div class="removePhoto" @click="removeFileFromUpload(photo)"><i class="pi pi-times" /></div>
							<div class="filename">{{ photo.filename }}</div>
						</div>
					</div>
				</div>
			</div>
			<label for="fileSelect">
			</label>
			<input type="file" id="fileSelect" hidden multiple :onchange="(event) => handleFiles(event.target.files)">
		</div>

		<ShareModal v-model="state.gallery" v-if="state.showShareModal" @close="state.showShareModal = false" />
	</div>
</template>

<style scoped>
.gallery-settings {
	width: calc(100% - 700px);
	min-width: 360px;
}

.settings-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .5em 1em;
	align-items: center;

	.galleryDate input {
		font-size: 0.875rem;
		padding: 0.4375rem 0.65625rem;
	}
}

.cover-style-options {
	display: flex;
	gap: 1rem;
	overflow-x: auto;
	padding: 2px;
}

.cover-style-option {
	cursor: pointer;
	outline: 1px solid grey;

	&.selected {
		outline: 2px solid blue;
	}

	.cover-small {
		width: 1000px;
		aspect-ratio: 1.6;
		zoom: .1;
		pointer-events: none;
		user-select: none;
	}
}

.cover-previews {
	position: relative;
	padding: 0 30px 17px 0;

	.cover-preview-wrapper {
		border-radius: 10px;
		padding: 15px;
		position: relative;
		display: inline-block;
		border: 1px solid #8a8a8a;
		background: #fff;
		box-shadow: 0px 3px 10px #0005;

		&.mobile {
			padding: 10px;
			padding-top: 16px;
			padding-bottom: 16px;
			position: absolute;
			top: 117px;
			left: 490px;

			@media screen and (max-width: 1150px) {
				position: static;
			}

			.faux-button {
				position: absolute;
				top: 6px;
				left: 50%;
				transform: translateX(-50%);
				border: 2px solid grey;
				border-radius: 2px;
				width: 15px;
			}
		}

		.cover-preview {
			position: relative;
			pointer-events: none;
			user-select: none;
			border: 1px solid grey;
		}

		&.desktop .cover-preview {
			width: 1200px;
			aspect-ratio: 1.6;
			zoom: .5;

			@media screen and (max-width: 1150px) {
				zoom: .35;
			}
		}

		&.mobile .cover-preview {
			width: 375px;
			aspect-ratio: .56;
			zoom: .4;
		}
	}

	@media screen and (max-width: 1150px) {
		padding: 0;
		position: static;
		display: flex;
		align-items: start;
		flex-wrap: wrap;
		gap: 1em;
		overflow: hidden;
		overflow-x: auto;
		padding: 1em;
		margin: -1em;
	}
}


.section {
	border-top: 1px solid lightgrey;

	.photo-grid {
		height: 9rem;
		overflow: hidden;
	}

	&.expanded .photo-grid {
		height: auto;
	}
}

.photo-grid {
	padding-top: 10px;
	padding-right: 20px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
	grid-gap: 15px;
	justify-items: center;
	align-items: center;
}

.photo-grid-item {
	position: relative;
	max-width: 6rem;
	padding: .5rem;

	&:hover {
		background-color: #f5f5f5;
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
		justify-content: center;
		border-radius: 50%;
		background: #555;
		color: white;
		cursor: pointer;
		display: none;

		&:hover {
			background: red;
		}
	}

	&:hover .removePhoto {
		display: flex;
	}


	.options {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;
        width: 1.5rem;
        height: 1.5rem;
        line-height: 1.5rem;
        font-size: .7rem;
		transform: translate(25%, -25%);
		justify-content: center;
		border-radius: 50%;
		background: #555;
		color: white;
		cursor: pointer;
		display: none;
	}

	&:hover .options {
		display: flex;
	}
}

.add-photos {
	cursor: pointer;
	color: lightgrey;
	border: 1px solid;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 5rem;
	min-width: 5rem;

	&:hover {
		color: gray;
	}

	i {
		font-size: 1.5rem;
	}
}

.photo-frame {
	width: 5rem;
	height: 5rem;
	margin-bottom: .5rem;
}

.filename {
	font-size: .7em;
	line-break: anywhere;
	text-align: center;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

#uploadModal {
	width: 800px;
	max-width: 80vw;
	padding: 1em;
	z-index: 2;

	.grid-wrapper {
		max-height: 50vh;
		overflow: hidden;
		overflow-y: auto;
	}
}

.drop-images {
	width: 100%;
	border: 2px dashed #aaa;
	padding: 1em;
}

.drop-images.drag-over {
	background-color: #f5f5f5;
	border-color: blue;
}


.drop-images.drag-over * {
	pointer-events: none;
}

.drop-images .drop-text {
	text-align: center;
	padding: 30px 50px;
	cursor: pointer;
}

.drop-images .drop-text a {
	color: blue;
	font-weight: bold;
}


</style>