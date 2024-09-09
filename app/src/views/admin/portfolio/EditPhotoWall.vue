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
import { usePortfolioStore } from '../../../stores/portfolio.store';

const toast = useToast();
const portfolioStore = usePortfolioStore();

const isMobile = computed(() => useAppStore().isMobile);

const props = defineProps<{
	section: any,
}>();

const section = computed(() => props.section );

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
	<div :class="{ expanded: section.expanded }">
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

	<PortfolioPhotoSelector ref="photoSelector" />
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.photo-grid {
	height: 9rem;
	overflow: hidden;
}

.expanded .photo-grid {
	height: auto;
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

</style>