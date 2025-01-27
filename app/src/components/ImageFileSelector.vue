<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import PhotoGrid from '@/components/PhotoGrid.vue';
import { computed } from 'vue';

const images = defineModel<Set<any>>();
const setSizeBeforeNewFiles = ref(0);

const props = defineProps<{
	inline?: boolean,
}>();

const state = reactive({
	isProcessingFiles: false,
});

async function handleFiles(files) {
	if (!images.value) {
		throw new Error('No images set provided to file selector!');
	}
	state.isProcessingFiles = true;
	setSizeBeforeNewFiles.value = images.value?.size;
	await Promise.all(Array.from(files).map(async (file, i) => images.value?.add(await processImageFile(file, i))));
	state.isProcessingFiles = false;
}

function processImageFile(file, selectionIndex) {
	const photo = {
		blob: file,
		filename: file.name,
		size: file.size,
		type: file.type,
		uploadOrder: selectionIndex + setSizeBeforeNewFiles.value,
	} as any;

	// Create data URL for raw file
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
	images.value?.delete(file);
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

const photoArray = computed(() => Array.from(images.value?.values() || []));

</script>


<template>
	<div>
		<label v-if="props.inline" for="fileSelect" class="text-link">
			<slot>Select files</slot>
		</label>
		<div v-else class="drop-images" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
			<label for="fileSelect">
				<div class="drop-text">
					<slot><div>Drag and drop or <a>select images</a></div></slot>
				</div>
			</label>
			<PhotoGrid v-model="photoArray">
				<template #options="{ photo }"><div class="removePhoto" @click="removeFileFromUpload(photo)"><i class="pi pi-times" /></div></template>
			</PhotoGrid>
		</div>
		<input type="file" id="fileSelect" hidden multiple :onchange="(event) => handleFiles(event.target.files)" />
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

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