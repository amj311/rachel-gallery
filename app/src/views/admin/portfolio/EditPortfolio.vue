<script setup lang="ts">
import { reactive, onBeforeMount, computed, ref } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';
import Button from 'primevue/button';
import DropdownMenu from '@/components/DropdownMenu.vue';
import GhostInput from '@/components/InlineInput.vue';
import { useToast } from 'primevue/usetoast';
import draggable from 'vuedraggable';
import { useAppStore } from '@/stores/app.store';
import PortfolioPhotoSelector from './PortfolioPhotoSelector.vue';
import { usePortfolioStore } from './portfolio.store';
import PortfolioSectionButton from './PortfolioSectionButton.vue';

const toast = useToast();
const portfolioStore = usePortfolioStore();

const isMobile = computed(() => useAppStore().isMobile);

const state = reactive({
	// isSaving: false,
	// lastSaved: null as Date | null,
	// skipAutoSave: false,
	showUploadToSection: null as any,
	// isProcessingFiles: false,
	// imagesToUpload: new Set<any>(),
});

onBeforeMount(async () => {
	if (!portfolioStore.portfolio) {
		await portfolioStore.loadPortfolio();
	}
})


// const saveDebounceTime = 1000;
// const debouncePortfolio = debounce(updatePortfolio, saveDebounceTime, () => state.isSaving = true);

// // handle change detection and autosave
// const portfolioState = computed(() => JSON.stringify(portfolioStore.portfolio));
// watch(portfolioState, (newState, oldState) => {
// 	if (!state.skipAutoSave && newState !== 'null' && oldState !== 'null') {
// 		debouncePortfolio();
// 	}
// })

// maintain last save to abort when nothing changes
// let lastSave = 'null';

// async function updatePortfolio() {
// 	if (JSON.stringify(portfolioStore.portfolio) === lastSave) {
// 		state.isSaving = false;
// 		return;
// 	}
// 	lastSave = JSON.stringify(portfolioStore.portfolio);

// 	// Trusting debounce to make sure the portfolio name is complete before saving
// 	attemptAssignSlug();

// 	await request.put('admin/portfolio/' + portfolioStore.portfolioId, portfolioStore.portfolio);
// 	state.isSaving = false;
// 	state.lastSaved = new Date();

// 	portfolioStore.portfolio!.sections.forEach((section) => {
// 		section.photosMovedIn = null;
// 		section.photosMovedOut = null;
// 	})
// }


// function onImageUploadComplete(newPhoto) {
// 	portfolioStore.portfolio!.sections.find(s => s.id === newPhoto.portfolioSectionId)!.photos.push(newPhoto);

// 	// Use first uploaded image as portfolio cover
// 	if (!portfolioStore.portfolio!.coverPhoto) {
// 		assignCoverPhoto(newPhoto);
// 	}
// }

// function sendToUploader() {
// 	uploaderStore.queueImages(Array.from(state.imagesToUpload as any));
// 	state.imagesToUpload.clear();
// 	state.showUploadToSection = null;
// }

// function onDragOver(event) {
// 	event.stopPropagation();
// 	event.preventDefault();
// 	event.dataTransfer.dropEffect = 'copy';
// 	event.target.classList.add('drag-over');
// }
// function onDragLeave(event) {
// 	event.stopPropagation();
// 	event.preventDefault();
// 	event.dataTransfer.dropEffect = 'none';
// 	event.target.classList.remove('drag-over');
// }
// function onDrop(event) {
// 	event.stopPropagation();
// 	event.preventDefault();
// 	handleFiles(event.dataTransfer.files);
// 	event.target.classList.remove('drag-over');
// }

async function deletePhoto(photo, skipConfirm = false, skipAlert = false) {
	if (!skipConfirm && !confirm('Are you sure you want to delete this photo?')) return;
	try {
		await request.delete('admin/photo/' + photo.id);
		const deleteFromSection = portfolioStore.portfolio!.sections.find(s => s.id === photo.portfolioSectionId);
		deleteFromSection.photos = deleteFromSection.photos.filter(p => p.id !== photo.id);
		if (!skipAlert) {
			toast.add({ severity: 'success', summary: 'Success', detail: 'Photo deleted', life: 3000 });
		}
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete photo.");
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete photo. Try again later', life: 3000 });
	}
}

async function createNewSection(type: string, order?: number) {
	const { data } = await request.post('admin/portfolio/section', { type });
	// todo insert in correct order and update all
	portfolioStore.portfolio!.sections.push(data.data);
}

function swapSections(aIdx, bIdx) {
	const temp = portfolioStore.portfolio!.sections[aIdx];
	portfolioStore.portfolio!.sections[aIdx] = portfolioStore.portfolio!.sections[bIdx];
	portfolioStore.portfolio!.sections[bIdx] = temp;
	portfolioStore.portfolio!.sections.forEach((section, idx) => {
		section.order = idx
	});
}

async function deleteSection(section) {
	if (!confirm('Are you sure you want to delete this section?')) {
		return;
	}
	try {
		await request.delete('admin/portfolio/section/' + section.id);
		portfolioStore.portfolio!.sections = portfolioStore.portfolio!.sections.filter(s => s.id !== section.id);
		toast.add({ severity: 'success', summary: 'Success', detail: 'Section deleted', life: 3000 });
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete section.");
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete section. Try again later', life: 3000 });
	}
}

function onPhotoDrop(e) {
	const fromSection = portfolioStore.portfolio!.sections.find(s => s.id === e.from.attributes['data-sectionid'].value);
	const toSection = portfolioStore.portfolio!.sections.find(s => s.id === e.to.attributes['data-sectionid'].value);
	const photo = e.item._underlying_vm_;

	// mark photo for reassignment
	if (fromSection.photosMovedIn?.some(p => p === photo.id)) {
		fromSection.photosMovedIn = fromSection.photosMovedIn.filter(p => p !== photo.id);
	}
	if (!fromSection.photosMovedOut) fromSection.photosMovedOut = [photo.id];
	else fromSection.photosMovedOut.push(photo.id);
	
	if (toSection.photosMovedOut?.some(p => p === photo.id)) {
		toSection.photosMovedOut = toSection.photosMovedOut.filter(p => p !== photo.id);
	}
	if (!toSection.photosMovedIn) toSection.photosMovedIn = [photo.id];
	else toSection.photosMovedIn.push(photo.id);
	
	// update all photos with current order
	for (const section of [fromSection, toSection]) {
		for (const i in section.photos) {
			section.photos[i].order = parseInt(i);
		}
	}
}

const photoSelector: any = ref(null);
function openUploadToSection(sectionId) {
	photoSelector.value!.open(null, null, sectionId);
}

</script>


<template>
	<div v-if="!portfolioStore.portfolio">Loading...</div>
	<div v-else>
		<template v-for="(section, index) in portfolioStore.portfolio!.sections" :key="section.id">
			<div v-if="!section.marked_for_deletion" class="my-6 section" :class="{ expanded: section.expanded }">
				<div class="flex align-items-center py-2">
					<h3>
						<GhostInput v-model="section.name" placeholder="Section name..." />
					</h3>
					<div class="flex-grow-1"></div>
					<Button v-if="index > 0" @click="swapSections(index, index - 1)" icon="pi pi-chevron-up" text />
					<Button v-if="index < portfolioStore.portfolio!.sections.length - 1" @click="swapSections(index, index + 1)"
						icon="pi pi-chevron-down" text />
					<Button icon="pi pi-trash" text @click="deleteSection(section)" />
				</div>

				<div v-if="section.photos.length">
					<draggable v-model="section.photos" :animation="200" group="photos" itemKey="id" tag="div" class="photo-grid" handle=".handle" @end="onPhotoDrop" :data-sectionid="section.id">
						<template #header>
							<div key="add-photos" class="add-photos photo-grid-item" @click="openUploadToSection(section.id)">
								<i class="pi pi-plus" />
							</div>
						</template>
						<template #item="{ element: photo }">
							<div v-if="!photo.marked_for_deletion" class="photo-grid-item" :data-photoid="photo.id">
								<div class="photo-frame" :class="isMobile ? null : 'handle'">
									<PhotoFrame :photo="photo" />
								</div>
								<div class="options">
									<i v-show="isMobile" class="button pi pi-arrows-alt handle" />
									<div class="flex-grow-1"></div>
									<DropdownMenu
										:model="[{ label: 'Delete', command: () => deletePhoto(photo), class: 'danger' }]">
										<i class="button pi pi-ellipsis-v" />
									</DropdownMenu>
								</div>
								<div class="filename">{{ photo.filename }}</div>
							</div>
						</template>
					</draggable>

					<div v-if="section.photos.length > 0"
						class="flex align-items-center justify-content-center gap-2 cursor-pointer pt-4"
						@click="section.expanded = !section.expanded"
					>
						<template v-if="!section.expanded">View all ({{ section.photos.length }}) <i class="pi pi-chevron-down" /></template>
						<template v-else>View less <i class="pi pi-chevron-up" /></template>
					</div>
				</div>

				<div v-else class="flex align-items-center gap-2 cursor-pointer add-photos"
					@click="openUploadToSection(section.id)">
					<i class="pi pi-plus" />
					Add Photos
				</div>
			</div>
		</template>

		<div class="flex justify-content-center my-5"><PortfolioSectionButton @create="createNewSection" /></div>

		<PortfolioPhotoSelector
			ref="photoSelector"
		/>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.portfolio-settings {
	width: calc(100% - 700px);
	min-width: 360px;
}

.settings-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .5em 1em;
	align-items: center;

	.portfolioDate input {
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
		outline: 2px solid $primary;
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

.handle {
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
}


.photo-grid-item {
	position: relative;
	max-width: 6rem;
	padding: .5rem;
	border: 1px solid transparent;
	background: #fff;

	&:hover {
		background-color: $primary-thin;
		border: 1px solid #eee;
	}

	&.sortable-ghost {
		opacity: .4;
		border: 1px solid lightgrey;
		cursor: grabbing;
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
        left: 0;
        z-index: 1;
		height: 0;
        justify-content: space-between;
        display: none;
		
		.button {
			display: inline-block;
			background: #fffe;
			width: 2em;
			height: 2em;
			line-height: 2em;
			text-align: center;
			cursor: pointer;
		}
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