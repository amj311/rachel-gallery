<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, watch } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useUploaderStore } from './uploader/uploader.store';
import { GoogleDriveService } from '@/services/googleDrive';
import GalleryCover from '@/components/GalleryCover.vue';
import Calendar from 'primevue/calendar';
import FocalPointInput from '@/components/FocalPointInput.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import DropdownMenu from '@/components/DropdownMenu.vue';
import GhostInput from '@/components/InlineInput.vue';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';

const router = useRouter();
const uploaderStore = useUploaderStore();

const coverStyles = [
	'full',
	'half',
	'overlay',
];

const visibilityOptions = [
	'draft',
	'public',
	'client',
	'archived',
];

const state = reactive({
	isSaving: false,
	skipAutoSave: false,
	galleryId: router.currentRoute.value.params.galleryId,
	gallery: null,
	showUploadToSection: null,
	imagesToUpload: new Set(),
});

onBeforeMount(async () => {
	const { data } = await request.get('gallery/' + state.galleryId);

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

const saveDebounceTime = 1500;
let nextDebounce = 0;

function updateGallery() {
	if (nextDebounce > 0) {
		clearTimeout(nextDebounce);
	}
	state.isSaving = true;
	nextDebounce = setTimeout(async () => {
		const { data } = await request.put('admin/gallery/' + state.galleryId, state.gallery);
		state.isSaving = false;
	}, saveDebounceTime);
}

function assignCoverPhoto(photo) {
	state.gallery.coverPhoto = photo;
	state.gallery.coverPhotoId = photo.id;
}

function openUploadToSection(section) {
	state.showUploadToSection = section;
}

async function handleFiles(files) {
	for (const file of files) {
		state.imagesToUpload.add(await processImageFile(file));
	}
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
	};

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
	uploaderStore.uploadImages(state.imagesToUpload);
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

async function deletePhoto(photo, skipConfirm = false) {
	if (!skipConfirm) {
		if (!confirm('Are you sure you want to delete this photo?')) return;
	}
	if (!GoogleDriveService.hasValidToken) {
		await GoogleDriveService.getToken();
	}
	try {
		await GoogleDriveService.deleteFile(photo.googleFileId);
		await request.delete('admin/photo/' + photo.id);
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete photo. Will try to restore it in Google Drive.");
		await GoogleDriveService.restoreFile(photo.googleFileId);
		return;
	}
	const deleteFromSection = state.gallery.sections.find(s => s.id === photo.gallerySectionId);
	deleteFromSection.photos = deleteFromSection.photos.filter(p => p.id !== photo.id);
}

async function deleteSection(section) {
	if (!confirm('Are you sure you want to delete this section?')) {
		return;
	}
	await Promise.all(section.photos.map(deletePhoto, true));
	section.marked_for_deletion = true;
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
</script>


<template>
	<div v-if="!state.gallery">Loading...</div>
	<div v-else>
		<div class="flex align-items-center gap-3 mt-2 mb-4">
			<RouterLink to="/admin/galleries" ><Button icon="pi pi-arrow-left" text /></RouterLink>
			<h1><GhostInput v-model="state.gallery.name" placeholder="Gallery name..." /></h1>
			<span v-if="state.isSaving"><i class="pi pi-spinner pi-spin" /> Saving...</span>
			<div class="flex-grow-1"></div>
			<Dropdown v-model="state.gallery.visibility" :options="visibilityOptions" outline />
		</div>

		<div class="flex gap-5 my-3">
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
								<InputText v-model="state.gallery.slug" placeholder="link" />
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
								<div v-for="style in coverStyles" :key="style" @click="() => state.gallery.coverStyle = style"
									:classList="['cover-style-option', state.gallery.coverStyle === style ? 'selected' : ''].join(' ')">
									<div class="cover-small">
										<GalleryCover :gallery="state.gallery" :style="style" />
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
						<GalleryCover :gallery="state.gallery" />
					</div>
				</div>
				<div class="cover-preview-wrapper mobile">
					<div class="cover-preview">
						<GalleryCover :gallery="state.gallery" :pretendMobile="true" />
					</div>
					<div class="faux-button" />
				</div>
			</div>
		</div>


		<div v-for="(section, index) in state.gallery.sections" :key="section.id" class="my-6 section"
			:class="{ expanded: section.expanded }">
			<hr />
			<div class="flex align-items-center py-2">
				<h2>
					<GhostInput v-model="section.name" placeholder="Section name..." />
				</h2>
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

					<div v-for="photo in section.photos" :key="photo.id" class="photo-grid-item">
						<div class="photo-frame">
							<PhotoFrame :photo="photo" />
						</div>
						<div class="options">
							<DropdownMenu
								:model="[{ label: 'Make Cover', command: () => assignCoverPhoto(photo) }, { label: 'Delete', command: () => deletePhoto(photo), class: 'danger' }]">
								<i class="pi pi-ellipsis-v" style="font-size: 10px;" />
							</DropdownMenu>
						</div>
						<div class="filename">{{ photo.filename }}</div>
					</div>
				</div>
				<div v-if="!section.expanded && section.photos.length > 0" class="flex align-items-center justify-content-center gap-2 cursor-pointer pt-4" @click="section.expanded = true">
					View all ({{ section.photos.length }}) <i class="pi pi-chevron-down" />
				</div>
			</div>

			<div v-else class="flex align-items-center gap-2 cursor-pointer add-photos" @click="openUploadToSection(section)">
					<i class="pi pi-plus" />
					Add Photos
			</div>
		</div>

		<br />
		<div class="flex justify-content-center"><Button @click="addSection" outlined>&plus; Add Section</Button></div>





		<div v-if="state.showUploadToSection" id="uploadModal" class="modal">
			<div class="drop-images" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
				<div class="drop-text">
					<div>Drag and drop or <label for="fileSelect">select images</label></div>
					<button @click="state.showUploadToSection = null">Cancel</button>
					<button v-if="state.imagesToUpload.size" @click="sendToUploader">Upload</button>
				</div>
				<div class="photo-grid">
					<div v-for="photo in state.imagesToUpload" :key="photo.id" class="photo-grid-item upload-item">
						<div class="photo-frame">
							<PhotoFrame :photo="photo" size="xs" fillMethod="contain" />
						</div>
						<div class="removePhoto" @click="removeFileFromUpload(photo)">&times;</div>
						<div class="filename">{{ photo.filename }}</div>
					</div>
				</div>
			</div>
			<label for="fileSelect">
			</label>
			<input type="file" id="fileSelect" hidden multiple :onchange="(event) => handleFiles(event.target.files)">
		</div>
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
}

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
		width: 1200px;
		aspect-ratio: 1.6;
		zoom: .5;
		pointer-events: none;
		user-select: none;
		border: 1px solid grey;
	}

	&.mobile .cover-preview {
		width: 375px;
		aspect-ratio: .56;
		zoom: .4;
	}
}

.section {
	.photo-grid {
		height: 145px;
		overflow: hidden;
	}

	&.expanded .photo-grid {
		height: auto;
	}
}

.photo-grid {
	padding-top: 10px;
	padding-right: 10px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
	grid-gap: 1rem;
	justify-items: center;
	align-items: center;
}

.photo-grid-item {
	position: relative;
	max-width: 100px;

	&:hover {
		background-color: #f5f5f5;
	}

	.removePhoto {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;
		width: 1.5em;
		height: 1.5em;
		line-height: 1.3em;
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
		width: 1.5em;
		height: 1.5em;
		line-height: 1.3em;
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
	padding: 30px;

	&:hover {
		color: gray;
	}

	i {
		font-size: 30px;
	}
}


#uploadModal {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	border: 1px solid;
	background: #fff;
	width: 800px;
	max-width: 80vw;
	max-height: 80vh;
	overflow: hidden;
	overflow-y: auto;
	padding: 1em;
	z-index: 2;
}

.drop-images {
	width: 100%;
	border: 2px dashed;
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
	padding: 50px;
}

.drop-images .drop-text label {
	color: blue;
	font-weight: bold;
	cursor: pointer;
}


.photo-frame {
	width: 100px;
	height: 100px;
	padding: 10px;
}

.filename {
	font-size: 10px;
	line-break: anywhere;
	text-align: center;
}
</style>