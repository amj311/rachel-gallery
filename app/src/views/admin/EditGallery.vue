<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, watch } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useUploaderStore } from './uploader/uploader.store';
import { GoogleDriveService } from '@/services/googleDrive';
import GalleryCover from '@/components/GalleryCover.vue';
import dayjs from 'dayjs';

const router = useRouter();
const uploaderStore = useUploaderStore();

const coverStyles = [
	'full',
	'half',
];

const state = reactive({
	isSaving: false,
	galleryId: router.currentRoute.value.params.galleryId,
	gallery: null,
	showUploadToSection: null,
	imagesToUpload: new Set(),
});

onBeforeMount(async () => {
	const { data } = await request.get('gallery/' + state.galleryId);
	state.gallery = data.data;

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
	if (oldGallery !== 'null' && JSON.stringify(newState.gallery) !== oldGallery) {
		updateGallery();
	}
	oldGallery = JSON.stringify(newState.gallery);
})

const saveDebounceTime = 1500;
let nextDebounce = 0;

function updateGallery() {
	console.log("updating gallery");
	if (nextDebounce > 0) {
		clearTimeout(nextDebounce);
	}
	state.isSaving = true;
	nextDebounce = setTimeout(async () => {
		request.put('admin/gallery/' + state.galleryId, state.gallery);
		state.isSaving = false;
	}, saveDebounceTime);
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
	state.gallery.Sections.find(s => s.id === newPhoto.gallerySectionId)!.photos.push(newPhoto);

	// Use first uploaded image as gallery cover
	if (!state.gallery.coverPhoto) {
		state.gallery.coverPhoto = newPhoto;
		state.gallery.coverPhotoId = newPhoto.id;
		updateGallery();
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
		if(!confirm('Are you sure you want to delete this photo?')) return;
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
	const deleteFromSection = state.gallery.Sections.find(s => s.id === photo.gallerySectionId);
	deleteFromSection.photos = deleteFromSection.photos.filter(p => p.id !== photo.id);
}

async function deleteSection(section) {
	if (!confirm('Are you sure you want to delete this section?')) {
		return;
	}
	await Promise.all(section.photos.map(deletePhoto, true));
	// state.gallery.Sections = state.gallery.Sections.filter(s => s.id !== section.id);
}

</script>


<template>
	<div v-if="!state.gallery">Loading...</div>
	<div v-else>
		<hr />
		<div class="flex align-items-center gap-4"><h1>Manage Gallery</h1> <span v-if="state.isSaving"><i class="fa fa-spinner fa-spin"/> Saving...</span></div>
		<input v-model="state.gallery.name" placeholder="Gallery Name" /> <br />
		Gallery date: {{state.gallery.date ? dayjs(state.gallery.date).format('MMM DD, YYYY') : ''}}<input v-model="state.gallery.date" type="date" /> <br />
		/ <input v-model="state.gallery.slug" placeholder="link" /> <br />
		<input v-model="state.gallery.clientName" placeholder="Client Name" /> <br />
		<input v-model="state.gallery.clientEmail" placeholder="Client Email" /> <br />


		<h2>Cover</h2>

		<div v-if="!state.gallery.coverPhoto">Upload some photos to choose a cover</div>
		<div v-else class="flex">
			<div class="cover-settings flex-grow-1">
				<div>Style</div>
				<div class="cover-style-options">
					<div v-for="style in coverStyles" :key="style" @click="() => state.gallery.coverStyle = style" :classList="['cover-style-option', state.gallery.coverStyle === style ? 'selected' : ''].join(' ')">
						<div class="cover-small"><GalleryCover :gallery="state.gallery" :style="style" /></div>
					</div>
				</div>
				<div>Settings</div>
				<div v-if="state.gallery.coverStyle === 'full'">
					<div>
						<span>Text placement: </span>
						<select v-model="state.gallery.coverSettings.textPlacement">
							<option value="center">Center</option>
							<option value="bottom">Bottom</option>
						</select>
					</div>
					<div>
						<span>Border: </span>
						<input type="checkbox" v-model="state.gallery.coverSettings.border" />
					</div>
				</div>
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


		<div v-for="section in state.gallery.Sections" :key="section.id" class="mt-3">
			<hr />
			<h2><input v-model="section.name" /></h2>
			<button @click="deleteSection(section)">Delete</button>
			<div class="photo-grid">
				<div key="add-photos" class="photo-grid-item add-photos" @click="openUploadToSection(section)" />

				<div v-for="photo in section.photos" :key="photo.id" class="photo-grid-item">
					<div class="photo-frame">
						<PhotoFrame :photo="photo" />
					</div>
					<div class="removePhoto" @click="deletePhoto(photo)">&times;</div>
					<div class="filename">{{ photo.filename }}</div>
				</div>
			</div>
		</div>

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

.cover-style-options {
	display: flex;
	gap: 1rem;		
}

.cover-style-option {
	cursor: pointer;
	outline: 1px solid grey;

	&:hover {
	}
	&.selected {
		outline: 2px solid blue;
	}

	.cover-small {
		width: 1000px;
		aspect-ratio: 1.75;
		zoom: .1;
		pointer-events: none;
		user-select: none;
	}
}

.cover-preview-wrapper {
    border-radius: 10px;
    padding: 15px;
    position: relative;
    display: inline-block;
    border: 2px solid grey;
    background: #fff;

	&.mobile {
		padding: 10px;
        padding-top: 16px;
        padding-bottom: 16px;
		margin-left: -90px;
		
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


.photo-grid {
	margin-top: 10px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
	grid-gap: 1rem;
	justify-items: center;
	align-items: center;
}

.photo-grid-item {
	position: relative;
    max-width: 100px;
}

.photo-grid-item:hover {
	background-color: #f5f5f5;
}

.add-photos {
	cursor: pointer;
	color: lightgrey;
	border: 1px solid;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 80px;
	height: 80px;
}

.add-photos::after {
	content: '+';
	font-size: 50px;
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
}

.photo-grid-item:hover .removePhoto {
	display: flex;
}

.removePhoto:hover {
	background: red;
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