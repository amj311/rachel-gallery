<script setup>
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useUploaderStore } from './uploader.store';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import { computed } from 'vue';
import Message from 'primevue/message';

const uploaderStore = useUploaderStore();
uploaderStore.init();

const bytesToGB = (bytes) => {
	let gigaBytes = bytes / 1024 / 1024 / 1024;
	return gigaBytes.toFixed(gigaBytes % 1 === 0 ? 0 : 1);
}

const usedSpace = computed(() => uploaderStore.googleDriveInfo.storage.usage);
const availableSpace = computed(() => uploaderStore.googleDriveInfo.storage.limit - usedSpace.value);
const usedPercent = computed(() => usedSpace.value / uploaderStore.googleDriveInfo.storage.limit * 100);

</script>


<template>
	<div v-if="uploaderStore.isOpen" id="uploaderWindow" :classList="[uploaderStore.viewMode+'-view']">
		<div class="header">
			<h3>{{ uploaderStore.headerText }}</h3>
			<div class="flex-spacer" />
			<div>
				<Button :icon="uploaderStore.viewMode === 'modal' ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" @click="uploaderStore.toggleViewMode" text  size="small" />
				<Button v-if="uploaderStore.canClose" icon="pi pi-times" text @click="uploaderStore.close" size="small" />
			</div>
		</div>
		<div class="progress"></div>
		<div class="body">
			<div class="drive-info">
				<h3>1. Connect to Google Drive</h3>
				<div class="m-2">
					<template v-if="!uploaderStore.isGoogleReady">
						<Button outlined @click="uploaderStore.setupGoogle" class="gap-2" size="small"><i class="pi pi-google" />Log in to Google Drive</button>
					</template>
					<template v-else>
						<div>
							Drive: {{ uploaderStore.googleDriveInfo.owner.email }}
							<a @click="uploaderStore.resetGoogle">Change</a>
						</div>
						<div class="mt-2">
							<ProgressBar :value="Number(usedPercent)" :showValue="true" :class="{ danger: bytesToGB(availableSpace) <= 2 }">{{}}</ProgressBar>
							{{ bytesToGB(availableSpace) }} GB remaining
						</div>
					</template>
				</div>
				<Message v-if="!uploaderStore.folderIsPublic" :closable="false" severity="warn">&nbsp;&nbsp;Please make <a :href="'https://drive.google.com/drive/folders/' + uploaderStore.googleDriveInfo.targetFolder.id" target="_blank">this folder</a> public!</Message>
			</div>
			<div>
				<div class="flex align-items-center mb-3">
					<h3>2. Upload Photos</h3>
					<div class="flex-grow-1"></div>
					<Button v-if="uploaderStore.uploadQueue.length" @click="uploaderStore.startUploadLoop" :loading="uploaderStore.isLoading" size="small" class="gap-2" icon="pi pi-upload" :label="uploaderStore.isLoading ? 'Uploading' : 'Upload'" />
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
								<i class="pi pi-check" style="color: green" />
							</div>
							<div class="status retry" v-else-if="photo.uploadStatus === 'error'">
								<i class="pi pi-exclamation-triangle" style="color: red" />
								<i class="pi pi-replay" @click="uploaderStore.retryUploadPhoto(photo)" />
							</div>
							<i v-else-if="photo.uploadStatus === 'uploading'" class="pi pi-spinner pi-spin" />
						</div>
					</div>
				</div>
			</div>
<!-- 
			<div v-if="uploaderStore.isGoogleReady">
				<h3>3. Make Photos Public</h3>
				<p>Open the <a :href="'https://drive.google.com/drive/folders/' + uploaderStore.googleDriveInfo.targetFolder.id" target="_blank">Drive folder</a>, select all photos, and and share publicly.</p>
			</div>
			 -->
		</div>
	</div>
</template>

<style lang="scss" scoped>
#uploaderWindow {
	position: fixed;
	border: 1px solid #ddd;
	background: #fff;
	overflow: hidden;
	transition: 200ms;
	transform: translate(50%, 50%);
	padding: 1px;
	z-index: 10;
}

#uploaderWindow.modal-view {
	bottom: 50%;
	right: 50%;
	background: #fff;
	width: 720px;
	max-width: 80vw;
	max-height: 80vh;
	overflow-y: auto;
    box-shadow: 0 5px 20px 3px #0005;
    border-radius: .5em;
}

#uploaderWindow.drawer-view {
	bottom: calc(25px);
	right: calc(2em + 150px);
	width: 300px;
    box-shadow: 0 2px 6px 0 #0005;
	max-height: 50px;
}

.flex-spacer {
	flex-grow: 1;
}

.header {
	display: flex;
	gap: .5em;
	margin: .5em;
	margin-left: 1em;
	align-items: center;
}

.toggleView {
	cursor: pointer;
	font-size: 2em;
	line-height: 0em;
}

.body {
	margin: 1.5em;
	display: flex;
	flex-direction: column;
	gap: 1em;
}

.photo-grid {
	padding-top: 10px;
	padding-right: 10px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
	grid-gap: 1rem;
	justify-items: center;
	align-items: center;
	max-height: 50vh;
	overflow: hidden;
	overflow-y: auto;
}

.photo-grid-item {
	position: relative;
	max-width: 6rem;
	padding: .5rem;
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

	&.retry {
		cursor: pointer;

		.pi-replay {
			display: none;
		}
		.pi-exclamation-triangle {
			display: block;
		}

		&:hover {
			.pi-replay {
				display: block;
			}
			.pi-exclamation-triangle {
				display: none;
			}
		}
	}
}

a {
	color: blue;
	cursor: pointer;
}

:deep(.pi-window-minimize), :deep(.pi-window-maximize) {
    transform: rotate(-90deg);
}

:deep(.p-progressbar-value) {
    background: #0ad;
}

.danger :deep(.p-progressbar-value) {
    background: #da0;
}
</style>