<script setup lang="ts">
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useUploaderStore } from './uploader.store';

const uploaderStore = useUploaderStore();
uploaderStore.init();

const bytesToGB = (bytes: number) => {
	let gigaBytes = bytes / 1024 / 1024 / 1024;
	return gigaBytes.toFixed(gigaBytes % 1 === 0 ? 0 : 1);
}

</script>


<template>
	<div v-if="uploaderStore.isOpen" id="uploaderWindow" :classList="[uploaderStore.viewMode]">
		<div class="header">
			<h3>{{ uploaderStore.headerText }}</h3>
			<div class="flex-spacer" />
			<div class="toggleView" @click="uploaderStore.toggleViewMode">
				{{ uploaderStore.viewMode === 'modal' ? '⇲' : '⇱' }}
			</div>
			<div v-if="uploaderStore.canClose" @click="uploaderStore.close">&times;</div>
		</div>
		<div class="progress"></div>
		<div class="body">
			<div class="drive-info">
				<div v-if="!uploaderStore.isGoogleReady">
					<button @click="uploaderStore.setupGoogle">Log in to Google Drive</button>
				</div>
				<div v-else>
					<div>
						Uploading to: {{ uploaderStore.googleDriveInfo.owner.email }}
					</div>
					<div>
						Available space: {{ bytesToGB(uploaderStore.googleDriveInfo.storage.limit -
							uploaderStore.googleDriveInfo.storage.usage) }} GB / {{
							bytesToGB(uploaderStore.googleDriveInfo.storage.limit) }} GB
					</div>
				</div>
			</div>
			<div class="photo-grid">
				<div v-for="photo in uploaderStore.photosToUpload" :key="photo.id"
					class="photo-grid-item">
					<div class="photo-frame">
						<PhotoFrame :photo="photo" />
					</div>
					<div v-if="photo.uploadStatus !== 'uploading'" class="removePhoto" @click="uploaderStore.removePhoto(photo)">&times;</div>
					<div class="filename">{{ photo.filename }}</div>
					<div class="status" v-if="photo.uploadStatus">
						<div class="status" v-if="photo.uploadStatus === 'complete'">
							<i class="fa fa-check" style="color: green" />
						</div>
						<div class="status retry" v-else-if="photo.uploadStatus === 'error'">
							<i class="fa fa-exclamation" style="color: red" />
							<i class="fa fa-repeat" @click="uploaderStore.retryUploadPhoto(photo)" />
						</div>
						<i v-else-if="photo.uploadStatus === 'uploading'" class="fa fa-spinner fa-spin" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
#uploaderWindow {
	position: fixed;
	border: 1px solid;
	background: #fff;
}

#uploaderWindow.modal {
	bottom: 50%;
	right: 50%;
	transform: translate(50%, 50%);
	border: 1px solid;
	background: #fff;
	width: 800px;
	max-width: 80vw;
	max-height: 80vh;
	overflow: hidden;
	overflow-y: auto;
}

#uploaderWindow.drawer {
	bottom: 0;
	right: 2em;
	border: 1px solid;
	background: #fff;
	width: 300px;
}

.flex-spacer {
	flex-grow: 1;
}

.header {
	display: flex;
	gap: .5em;
	padding: .5em;
	align-items: center;
}

.toggleView {
	cursor: pointer;
	font-size: 2em;
	line-height: 0em;
}

.drawer .body {
	display: none;
}

.body {
	padding: .5em;
}

.photo-grid {
	margin-top: 10px;
	/* display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 10px; */
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
	grid-gap: 1rem;
	justify-items: center;
	align-items: center;
}

.photo-grid-item {
	/* width: 100px;
	height: 100px; */
	position: relative;
	max-width: 100px;
}

.photo-grid-item:hover {
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

.status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 50%;
    width: 2em;
    height: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status.retry {
	cursor: pointer;
}

.status.retry .fa-repeat {
	display: none;
}
.status.retry:hover .fa-repeat {
	display: block;
}
.status.retry .fa-exclamation {
	display: block;
}
.status.retry:hover .fa-exclamation {
	display: none;
}
</style>