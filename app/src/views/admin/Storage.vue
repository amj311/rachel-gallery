<script
	setup
	lang="ts"
>
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, computed, ref } from 'vue';
import request from '@/services/request';
import { useUploaderStore } from '../../components/uploader/uploader.store';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';
import { useClientStore } from '@/stores/client.store';
import Snackbar from '@/components/Snackbar.vue';
import SelectButton from 'primevue/selectbutton';
import PhotoFrame from '@/components/PhotoFrame.vue';
import ProgressBar from 'primevue/progressbar';
import dayjs from 'dayjs';

type File = {
	googleFileId: string,
	googleFile: any,
	dbPhoto: Photo,
	selected?: boolean,
	selectionPendingDrag?: boolean,
}
type Photo = any;

const uploaderStore = useUploaderStore();
const toast = useToast();

const state = reactive({
	isLoadingPage: true,
	isSaving: false,
	lastSaved: null as Date | null,
	pageFiles: [] as File[],
	pageTokens: [''] as string[],
	currentPage: 0,
	hasAllPages: false,
	pageSize: 25,
	// showUploadToSection: null as any,
	// isProcessingFiles: false,
	// imagesToUpload: new Set<any>(),
	// showAddToPortfolio: false,
	selectedSet: new Set<Photo>(),
	viewMode: 'table' as 'list' | 'table',
	driveInfo: null as any,
	rowRefs: {} as any,
	isDragSelecting: false,
	dragSelectionStart: {} as any,
	dragSelectionBounds: {} as any,
	preventOpenDrawer: false,
});

onBeforeMount(async () => {
	loadPage(0);
	loadUsage();
})


async function loadUsage() {
	const { data } = await request.get('admin/token');
	state.driveInfo = data.driveInfo;
}

const bytesToGB = (bytes: number) => {
	return bytes / 1024 / 1024 / 1024;
}
const bytesToMB = (bytes: number) => {
	return bytes / 1024 / 1024;
}
const formatBytes = (bytes) => {
	let number = Number(bytes);
	let unit = 'MB';
	number = bytesToMB(number);
	if (number > 1999) {
		number = bytesToGB(bytes);
		unit = 'GB';
	}
	return number.toFixed(number % 1 === 0 ? 0 : 1) + unit;
};

const usedSpace = computed(() => state.driveInfo?.storageQuota.usage || 0);
const availableSpace = computed(() => (state.driveInfo?.storageQuota.limit || 0) - usedSpace.value);
const usedPercent = computed(() => usedSpace.value / (state.driveInfo?.storageQuota.limit || 1) * 100);

async function loadPage(pageIdx) {
	const pageToken = state.pageTokens[pageIdx];
	if (!pageToken && pageIdx > 0) {
		console.error("No page token for page " + pageIdx);
		return;
	}

	state.isLoadingPage = true;
	try {
		state.currentPage = pageIdx;
		const params = new URLSearchParams();
		if (pageToken) params.append('nextPageToken', pageToken);
		params.append('pageSize', state.pageSize.toString());
		const { data } = await request.get('admin/storage', { params });
		state.rowRefs = {};
		state.pageFiles = data.data.files;
		if (pageIdx + 1 === state.pageTokens.length) {
			if (!data.data.nextPageToken) {
				state.hasAllPages = true;
			}
			else {
				state.hasAllPages = false;
				state.pageTokens.push(data.data.nextPageToken);
			}
		}
	}
	catch (e) {
		console.error(e);
	}
	finally {
		state.isLoadingPage = false;
	}
}

function changePageSize() {
	console.log("changePageSize", state.pageSize);
	state.pageTokens = [''];
	state.hasAllPages = false;
	loadPage(0);
}

const isOnLastPage = computed(() => {
	return state.currentPage === state.pageTokens.length - 1;
});

const PAGES_RADIUS = 4;
const pagesBefore = computed(() => {
	if (state.currentPage === 0) return [];
	return state.pageTokens.map((_, i) => i).slice(Math.max(0, state.currentPage - PAGES_RADIUS), state.currentPage);
});
const pagesAfter = computed(() => {
	if (isOnLastPage.value) return [];
	return state.pageTokens.map((_, i) => i).slice(state.currentPage + 1, Math.min(state.pageTokens.length, state.currentPage + PAGES_RADIUS + 1));
});


// SELECTING

const listRef = ref(null);
function initSelectionDrag(e) {
	if (!listRef.value) return;
	const listEl = listRef.value as any;
	listEl.classList.add('drag-selecting');
	window.addEventListener('mousemove', updateDragSelection);
	window.addEventListener('mouseup', endDragSelection);
	state.dragSelectionStart = { x: e.clientX, y: e.clientY };
}
function updateDragSelection(e: MouseEvent) {
	state.dragSelectionBounds = {
		x: Math.min(state.dragSelectionStart.x, e.clientX),
		y: Math.min(state.dragSelectionStart.y, e.clientY),
		width: Math.abs(state.dragSelectionStart.x - e.clientX),
		height: Math.abs(state.dragSelectionStart.y - e.clientY),
	}

	// do nothing until mouse has dragged a certain distance
	if (state.dragSelectionBounds.width < 50 && state.dragSelectionBounds.height < 50) {
		state.isDragSelecting = false;
		return;
	}

	state.isDragSelecting = true;
	if (!allSelected.value.length) {
		state.preventOpenDrawer = true;
	}

	const mode = e.shiftKey ? 'add' : 'replace';

	Object.values(state.rowRefs).forEach(({ ref, file }: any) => {
		const rect = ref.getBoundingClientRect();
		const inHorizontal = !(
			(rect.x + rect.width) < state.dragSelectionBounds.x ||
			(rect.x) > state.dragSelectionBounds.x + state.dragSelectionBounds.width
		);
		const inVertical = !(
			(rect.y + rect.height) < state.dragSelectionBounds.y ||
			(rect.y) > state.dragSelectionBounds.y + state.dragSelectionBounds.height
		);
		const isInSelectionArea = (inHorizontal && inVertical);
		if (mode === 'add') {
			if (!file.selected) {
				file.selectionPendingDrag = true;
			}
			if (file.selectionPendingDrag) {
				file.selected = isInSelectionArea;
			}
			else {
				file.selected = isInSelectionArea ? true : file.selected;
			}
		} else {
			file.selected = isInSelectionArea;
		}
	});
}
function endDragSelection() {
	if (!listRef.value) return;
	const listEl = listRef.value as any;
	state.isDragSelecting = false;
	state.dragSelectionStart = {};
	state.dragSelectionBounds = {};
	listEl.classList.remove('drag-selecting');

	window.removeEventListener('mousemove', updateDragSelection);
	window.removeEventListener('mouseup', endDragSelection);
	state.preventOpenDrawer = false;

	allSelected.value.forEach(f => f.selectionPendingDrag = false);

	// remove selection incurred by dragging
	if (window.getSelection?.call(null)) {
		if (window.getSelection()!.empty as any) {  // Chrome
			window.getSelection()!.empty();
		}
		else if (window.getSelection()!.removeAllRanges as any) {  // Firefox
			window.getSelection()!.removeAllRanges();
		}
	}
	else if ((document as any).selection) {  // IE?
		(document as any).selection.empty();
	}
}

// async function updateGallery() {
// if (JSON.stringify(state.gallery) === lastSave) {
// 	state.isSaving = false;
// 	return;
// }
// lastSave = JSON.stringify(state.gallery);

// // Trusting debounce to make sure the gallery name is complete before saving
// attemptAssignSlug();

// await request.put('admin/gallery/' + state.galleryId, state.gallery);
// state.isSaving = false;
// state.lastSaved = new Date();

// state.gallery.sections.forEach((section) => {
// 	section.photosMovedIn = null;
// 	section.photosMovedOut = null;
// })
// }

// function openUploadToSection(section) {
// 	state.showUploadToSection = section;
// }

// function onImageUploadComplete(newPhoto) {
// 	state.gallery.sections.find(s => s.id === newPhoto.gallerySectionId)!.photos.push(newPhoto);

// 	// Use first uploaded image as gallery cover
// 	if (!state.gallery.coverPhoto) {
// 		assignCoverPhoto(newPhoto);
// 	}
// }

// function sendToUploader() {
// 	uploaderStore.queueImages(Array.from(state.imagesToUpload).map(f => ({
// 		...f,
// 		gallerySectionId: state.showUploadToSection!.id,
// 		onUploadComplete: onImageUploadComplete,
// 	})));
// 	state.imagesToUpload.clear();
// 	state.showUploadToSection = null;
// }

// async function deletePhoto(photo, skipConfirm = false, skipAlert = false) {
// 	if (!skipConfirm && !confirm('Are you sure you want to delete this photo?')) return;
// 	try {
// 		await request.delete('admin/photo/' + photo.id);
// 		const deleteFromSection = state.gallery.sections.find(s => s.id === photo.gallerySectionId);
// 		deleteFromSection.photos = deleteFromSection.photos.filter(p => p.id !== photo.id);
// 		if (!skipAlert) {
// 			toast.add({ severity: 'success', summary: 'Success', detail: 'Photo deleted', life: 3000 });
// 		}
// 	}
// 	catch (error) {
// 		console.error(error);
// 		console.log("Failed to delete photo.");
// 		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete photo. Try again later', life: 3000 });
// 	}
// }

// async function deletePhotos(photos) {
// 	try {
// 		await Promise.all(photos.map(p => deletePhoto(p, true, true)));
// 	}
// 	catch (error) {
// 		console.error(error);
// 		console.log("Failed to delete photos.");
// 		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete photos. Try again later', life: 3000 });
// 	}
// }

// async function deleteSelectedPhotos() {
// 	if (!confirm('Are you sure you want to delete these photos')) return;

// 	await deletePhotos([...state.selectedSet]);
// 	state.selectedSet.clear();
// }

const allSelected = computed(() => state.pageFiles.filter(f => f.selected));
const onlySelected = computed(() => allSelected.value[0]);

function toggleSelected(file: File, e: MouseEvent) {
	if (file.selected && allSelected.value.length > 1) {
		file.selected = false;
		return;
	}

	const toValue = !file.selected;
	if (!e.shiftKey) {
		allSelected.value.forEach(f => f.selected = false);
	}
	file.selected = toValue;
}

function fileOptions(file) {
	return [
		// { label: 'Make cover', command: () => assignCoverPhoto(photo) },
		// {
		// 	label: 'Move to section',
		// 	items: state.gallery.sections.filter(s => s.id !== photo.gallerySectionId).map(s => ({ label: s.name, command: () => movePhotosToSection([photo], s) })),
		// },
		// { label: 'Delete', command: () => deletePhoto(photo), class: 'danger' },
	];
}

function fileUsedBy(file: File) {
	if (!file.dbPhoto) return null;
	if (file.dbPhoto.Gallery) {
		return file.dbPhoto.Gallery.name + ': Cover';
	}
	if (file.dbPhoto.GallerySection) {
		return file.dbPhoto.GallerySection.Gallery.name + ' > ' + file.dbPhoto.GallerySection.name;
	}
	if (file.dbPhoto.PortfolioSection) {
		return 'Portfolio';
	}
	return null;
}

function rangeFromDates(dates) {
	const min = dates.sort().reverse()[0];
	const max = dates.sort()[0];
	const minFormat = dayjs(min).format('MMM D, YYYY');
	const maxFormat = dayjs(max).format('MMM D, YYYY');
	if (minFormat === maxFormat) {
		return minFormat;
	}
	return minFormat + ' - ' + maxFormat;
}

const previewPhotoStack = computed(() => [...allSelected.value].reverse().slice(0, 5));

const selectedOrphanedPhotos = computed(() => allSelected.value.filter(f => !fileUsedBy(f)));

function fileWarning(file: File) {
	if (!fileUsedBy(file)) return {
		message: 'This file is not used anywhere',
		icon: 'pi pi-exclamation-triangle text-red-500',
	};
}

</script>


<template>
	<div>
		<div class="flex align-items-center flex-wrap gap-3 mb-4 mt-3">
			<div class="flex align-items-center flex-wrap gap-3">
				<h2>Google Drive Storage</h2>
			</div>
			<div class="flex-grow-1"></div>
			<div class="flex align-items-center flex-wrap gap-2">
				<!-- <SelectButton v-model="state.viewMode" :options="['list', 'table']" style="zoom: .8">
					<template #option="slotProps">
						<i :class="`pi pi-${slotProps.option}`"></i>
					</template>
				</SelectButton> -->
				<!-- <div>
					<RouterLink :to="'/' + (state.gallery.slug || state.gallery.id)"><Button icon="pi pi-eye" text
							v-tooltip.bottom="'Preview'" /></RouterLink>
					<Button icon="pi pi-send" text v-tooltip.bottom="'Copy link'" @click="copyLink" />
					<Button icon="pi pi-user-plus" text v-tooltip.bottom="'Manage Access'"
						@click="state.showShareModal = true" />
				</div>
				<div class="flex-grow-1"></div>
				<Dropdown v-model="state.gallery.visibility" :options="Object.keys(visibilityOptions)" outline style="zoom: .9;">
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
				</Dropdown> -->
			</div>
		</div>

		<div class="panels-wrapper">
			<div class="flex flex-grow-1 overflow-hidden gap-4">
				<!-- LEFT -->
				<div class="flex flex-column flex-grow-1">
					<!-- ROWS HEADER -->
					<div
						class="row-grid header-row"
						v-if="state.viewMode === 'list'"
					>
						<div><!-- Selectable --></div>
						<div><!-- Thumbnail --></div>
						<div>Filename</div>
					</div>
					<!-- ROWS -->
					<div
						v-if="state.isLoadingPage"
						class="flex flex-grow-1 w-full justify-content-center align-items-center gap-2"
					>
						<i class="pi pi-spinner pi-spin" />
						Loading...
					</div>
					<div
						v-else
						ref="listRef"
						:class="['list-wrapper', `${state.viewMode}-view`]"
						@mousedown="initSelectionDrag"
					>
						<template
							v-for="file in state.pageFiles"
							:key="file.googleFileId"
						>
							<div
								:ref="(ref) => state.rowRefs[file.googleFileId] = { ref, file }"
								class="list-item"
								:class="{ selected: file.selected, 'row-grid file-row': state.viewMode === 'list', 'grid-tile': state.viewMode === 'table' }"
								@click="(e) => toggleSelected(file, e)"
							>
								<div class="selectable">&nbsp;</div>
								<div class="warning-icon">
									<template v-if="fileWarning(file)">
										<i :class="fileWarning(file)?.icon" :title="fileWarning(file)?.message"></i>
									</template>
								</div>
								<div class="thumbnail">
									<PhotoFrame
										:photo="{ id: file.googleFileId, googleFileId: file.googleFileId }"
										:fillMethod="'contain'"
										size="md"
									/>
								</div>
								<div class="filename">{{ file.googleFile.name }}</div>
							</div>
						</template>
					</div>
				</div>
				<!-- RIGHT -->
				<div
					class="drawer"
					:class="{ 'open': allSelected.length && !state.preventOpenDrawer }"
				>
					<div class="drawer-content">
						<h3 class="word-break">{{ allSelected.length === 1 ? onlySelected.googleFile.name : `${allSelected.length} Selected` }}</h3>
						<div
							class="w-full h-20rem"
							style="position: relative"
						> 
							<div
								v-for="file, index in previewPhotoStack"
								:key="file.googleFileId"
								class="w-15rem h-15rem"
								style="position: absolute; translate: -50% -50%"
								:style="{ top: `${50 + index}%`, left: `${50 + index}%`, opacity: 1 * ((index + 1) / previewPhotoStack.length) }"
							>
								<PhotoFrame
									:photo="{ id: file.googleFileId, googleFileId: file.googleFileId }"
									size="md"
								/>
							</div>
						</div>
						<div class="details-grid">
							<label>Used In</label>
							<div>
								<template v-for="place, index in Array.from(new Set(allSelected.map(f => fileUsedBy(f)))).sort().reverse()" :key="place">
									<span v-if="!place" class="text-red-500"><i class="pi pi-exclamation-triangle" />&nbsp;Not Used</span>
									<span v-else>{{ place }}</span>
									<span v-if="index < Array.from(new Set(allSelected.map(f => fileUsedBy(f)))).length - 1">, </span>
								</template>
							</div>

							<template v-if="allSelected.length === 1">
								<label>File</label>
								<div>
									{{ onlySelected.googleFileId }}
									<a class="text-link" :href="onlySelected.googleFile.webViewLink" target="_blank"><i class="pi pi-external-link" /></a>
								</div>

								<label>Folder</label>
								<div>
									<div v-if="onlySelected.googleFile.parents?.[0]" class="word-break">
										{{ onlySelected.googleFile.parents?.[0] }}
										<a class="text-link" :href="'https://drive.google.com/drive/folders/' + onlySelected.googleFile.parents?.[0]" target="_blank"><i class="pi pi-external-link" /></a>
									</div>
									<div v-else>None</div>
								</div>
							</template>

							<label>Size</label>
							<div>{{ formatBytes(allSelected.reduce((a, b) => a + Number(b.googleFile.quotaBytesUsed), 0)) }}</div>

							<label>Created</label>
							<div>{{ rangeFromDates(allSelected.map(f => f.googleFile.createdTime)) }}</div>

							<label>Modified</label>
							<div>{{ rangeFromDates(allSelected.map(f => f.googleFile.modifiedTime)) }}</div>

							<label>Owner</label>
							<div>{{ Array.from(new Set(allSelected.flatMap(f => [...f.googleFile.owners.map(o => o.displayName)]))).join(', ') }}
							</div>
						</div>

						<template v-if="selectedOrphanedPhotos.length">
							<h3 class="mt-3 mb-2">Handle orphaned photos:</h3>
							<Button outlined class="align-items-center gap-2" size="small">
								<i class="pi pi-images text-sm" />
								Assign to gallery
							</Button>
							&nbsp;
							<Button outlined severity="danger" class="align-items-center gap-2" size="small">
								<i class="pi pi-trash text-sm" />
								Delete
							</Button>
						</template>
					</div>
				</div>
			</div>

			<!-- FOOTER -->
			<div class="flex align-items-center p-3 flex-wrap">
				<Dropdown
					style="zoom: .8"
					v-model="state.pageSize"
					:options="[25, 50, 100]"
					@change="changePageSize"
				>
					<template #value="{ value }">{{ value }}/page</template>
					<template #option="{ option }">{{ option }}/page</template>
				</Dropdown>

				<div class="flex-grow-1"></div>

				<div class="pagination flex align-items-center gap-2">
					<Button
						v-if="state.pageTokens.length > 1"
						text
						@click="loadPage(state.currentPage - 1)"
						icon="pi pi-angle-left"
						size="small"
						:disabled="state.currentPage === 0"
					/>
					<div
						v-for="index in pagesBefore"
						:key="index"
						class="text-link"
						@click="loadPage(index)"
					>
						{{ index + 1 }}
					</div>
					<div class="text-link active">{{ state.currentPage + 1 }}</div>
					<div
						v-for="index in pagesAfter"
						:key="index"
						class="text-link"
						@click="loadPage(index)"
					>
						{{ index + 1 }}
					</div>
					<template v-if="!state.hasAllPages">
						<i class="pi pi-ellipsis-h" />
					</template>
					<Button
						v-if="state.pageTokens.length > 1"
						text
						@click="loadPage(state.currentPage + 1)"
						icon="pi pi-angle-right"
						size="small"
						:disabled="state.hasAllPages && isOnLastPage"
					/>
				</div>

				<div class="flex-grow-1"></div>

				<div class="flex align-items-center gap-2 text-sm">
					<div class="w-5rem">
						<ProgressBar
							style="height: 8px"
							:value="Number(usedPercent)"
							:showValue="true"
							:class="{ danger: bytesToGB(availableSpace) <= 2 }"
						>{{}}</ProgressBar>
					</div>
					<div v-if="state.driveInfo">{{ formatBytes(availableSpace) }} remaining</div>
					<i
						v-else
						class="pi pi-spin pi-spinner"
					/>
				</div>
			</div>
		</div>

		<!-- <div v-if="state.showUploadToSection" id="uploadModal" class="modal">
			<div class="mb-3 flex align-items-center gap-2">
				<h3>Add photos to {{ state.showUploadToSection!.name }}</h3>
				<div class="flex-grow-1"></div>
				<Button outlined @click="state.showUploadToSection = null" size="small">Cancel</Button>
				<Button severity="primary" v-if="state.imagesToUpload.size" @click="sendToUploader" size="small"
					:loading="state.isProcessingFiles">Upload ({{ state.imagesToUpload.size }})</Button>
			</div>
			<div class="body">
				<ImageSelector v-model="state.imagesToUpload" />
			</div>
		</div> -->

		<Snackbar
			v-if="state.selectedSet.size"
			closeable
			@close="state.selectedSet.clear()"
		>
			<template #content>
				<div class="flex align-items-center gap-2">
					<i :class="state.selectedSet.size === 1 ? 'pi pi-image' : 'pi pi-images'" />
					<div>{{ state.selectedSet.size }} photo{{ state.selectedSet.size === 1 ? '' : 's' }} selected</div>
				</div>
			</template>
			<template #actions>
				<!-- <Button icon="pi pi-trash" text @click="deleteSelectedPhotos" />
				<DropdownMenu :model="state.gallery.sections.map(section => ({ label: section.name, command: () => { movePhotosToSection([...state.selectedSet], section); state.selectedSet.clear() } }))">
					<Button icon="pi pi-folder" text />
				</DropdownMenu> -->
			</template>
		</Snackbar>

		<!-- <PortfolioPhotoSelector
			ref="photoSelector"
		/> -->
	</div>

	<div
		v-if="state.isDragSelecting"
		class="drag-select-overlay"
		:style="{ left: state.dragSelectionBounds.x + 'px', top: state.dragSelectionBounds.y + 'px', width: state.dragSelectionBounds.width + 'px', height: state.dragSelectionBounds.height + 'px' }"
	>
	</div>
</template>

<style
	scoped
	lang="scss"
>
@import '@/assets/colors.module.scss';

.panels-wrapper {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 12rem);
	overflow: hidden;
}

.row-grid {
	display: grid;
	grid-template-columns: 1px 3rem 1fr;
	gap: .5rem;
	padding: .25em .5em;
	align-items: center;
	width: 100%;
}

.list-wrapper {
	flex-grow: 1;
	overflow-y: auto;
	padding: 5px;
	padding-right: 10px;

	&.list-view {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	&.table-view {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		column-gap: 5px;
		row-gap: 15px;
		justify-items: center;
		align-items: center;
	}


	.list-item {
		cursor: pointer;
		outline-offset: -1px;
		position: relative;

		&:hover {
			box-shadow: 0 0 5px 1px #0003;
		}

		&.selected {
			background: #f0f9ff;
			outline: 2px solid #b9def7;
		}

		/* &.file-row {
			.thumbnail {
				width: 3rem;
				height: 3rem;

				&:hover {
					transform: scale(3) translateX(33%);
					border: 3px solid white;
					background: white;
					z-index: 1;
					box-shadow: 0 0 5px 0 #0005;
					transition: 100ms;
				}
			}
		} */


		&.grid-tile {
			border-radius: 5px;
			padding: .5rem;
			width: 7rem;

			.warning-icon {
				position: absolute;
				top: 0;
				left: 0;
				z-index: 1;
				padding: 2px;
			}

			.thumbnail {
				width: 6rem;
				height: 6rem;
				margin-bottom: .5rem;
			}

			.filename {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				font-size: .8em;
				text-align: center;
				width: 100%;
			}
		}
	}
}

.selectable {
	height: 1px;
	opacity: 0;
}

:deep(.drag-selecting) .list-item {
	:not(.selectable) {
		user-select: none;
	}
}

.drag-select-overlay {
	position: fixed;
	background: #bef5;
	outline: 1px solid #befe;
	z-index: 10;
	pointer-events: none;
}

:deep(.p-progressbar-value) {
	background: #0ad;
}

.danger :deep(.p-progressbar-value) {
	background: #da0;
}

.pagination {
	.text-link.active {
		font-weight: bold;
		text-decoration: underline;
		pointer-events: none;
	}
}

.drawer {
	transition: 100ms;
	position: relative;

	&.open {
		max-width: 20rem;
		min-width: 20rem;
	}

	&:not(.open) {
		max-width: 0;
		min-width: 0;
	}

	.drawer-content {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		overflow: hidden;
		overflow-y: auto;
		width: 20rem;
	}
}

.details-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .5em 1em;
	align-items: start;
	line-height: 1.3;

	label {
		color: #888;
	}
}

#uploadModal {
	width: 800px;
	max-width: 80vw;
	padding: 1em;
	z-index: 10;

	.body {
		max-height: min(calc(100vh - 10rem), 75vh);
		overflow: hidden;
		overflow-y: auto;
	}
}
</style>
