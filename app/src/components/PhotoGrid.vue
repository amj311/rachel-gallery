<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import PhotoFrame from '@/components/PhotoFrame.vue';
import * as Drag from 'vuedraggable';
import { useAppStore } from '@/stores/app.store';
import DropdownMenu from './DropdownMenu.vue';

const isMobile = computed(() => useAppStore().isMobile);

const photos = defineModel<any[]>()!;

const props = defineProps<{
	photoOptions?: (photo) => any[],
	onPhotoClick?: (photo) => void,
	photoClasses?: (photo) => any,
	handleAddPhotos?: () => void,
	collapsible?: boolean,
	size?: 'sm' | 'md' | 'lg',

	// dragging options
	draggable?: boolean,
	onPhotoDrop?: (photo, fromListId, toListId) => void,
	dragGroup?: string,
	listId?: string,

	// selecting options
	selectable?: boolean,
}>();

const state = reactive({
	expanded: props.collapsible ? false : true,

	// Selection Dragging
	rowRefs: {} as any,
	isDragSelecting: false,
	dragSelectionStart: {} as any,
	dragSelectionBounds: {} as any,
});

const visiblePhotos = computed(() => {
	return state.expanded ? photos.value : photos.value!.slice(0, 10);
});


// PHOTO DRAGGING
function onMove(e) {
	document.body.classList.add('dragging');
}
function onDrop(e) {
	document.body.classList.remove('dragging');

	if (!e.from || !e.to) return;
	const fromListId = e.from.attributes['data-listid'].value;
	const toListId = e.to.attributes['data-listid'].value;
	const photo = e.item._underlying_vm_;

	props.onPhotoDrop?.call(null, photo, fromListId, toListId);
}



// SELECTION DRAGGING
const allSelected = computed(() => photos.value?.filter(f => f.selected) || []);


const dragSelectionAreaRef = ref(null);
function initSelectionDrag(e) {
	if (!dragSelectionAreaRef.value) return;
	const listEl = dragSelectionAreaRef.value as any;
	listEl.classList.add('drag-selecting');
	document.body.classList.add('dragging');
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

	const mode = e.shiftKey ? 'add' : 'replace';

	Object.values(state.rowRefs).forEach(({ ref, photo }: any) => {
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
			if (!photo.selected) {
				photo.selectionPendingDrag = true;
			}
			if (photo.selectionPendingDrag) {
				photo.selected = isInSelectionArea;
			}
			else {
				photo.selected = isInSelectionArea ? true : photo.selected;
			}
		} else {
			photo.selected = isInSelectionArea;
		}
	});
}
function endDragSelection() {
	if (!dragSelectionAreaRef.value) return;
	const listEl = dragSelectionAreaRef.value as any;
	state.isDragSelecting = false;
	state.dragSelectionStart = {};
	state.dragSelectionBounds = {};
	listEl.classList.remove('drag-selecting');
	document.body.classList.remove('dragging');

	window.removeEventListener('mousemove', updateDragSelection);
	window.removeEventListener('mouseup', endDragSelection);

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


function handlePhotoClick(photo) {
	if (props.onPhotoClick) {
		props.onPhotoClick(photo);
	}
	if (props.selectable) {
		photo.selected = !photo.selected;
	}
}

defineExpose({
	selected: allSelected,
	clearSelected: () => {
		photos.value?.forEach(f => f.selected = false);
	},
})

</script>

<template>
	<div :class="{ expanded: state.expanded, [props.size || 'sm']: true }">
		<div
			ref="dragSelectionAreaRef"
			v-if="photos && photos.length"
			@mousedown="initSelectionDrag"
		>
			<Drag v-model="photos" :animation="200" :group="dragGroup" itemKey="id" tag="div" class="photo-grid" handle=".handle" @end="onDrop" @move="onMove" :data-listid="listId" :scroll-sensitivity="200" :force-fallback="true">
				<template #header v-if="handleAddPhotos">
					<div key="add-photos" class="add-photos photo-grid-item" @click="handleAddPhotos">
						<i class="pi pi-plus" />
					</div>
				</template>
				<template #item="{ element: photo }">
					<div
						v-if="!photo.marked_for_deletion && visiblePhotos?.includes(photo)"
						:ref="(ref) => state.rowRefs[photo.googleFileId] = { ref, photo }"
						class="photo-grid-item"
						:class="{ 'selected': photo.selected, ...photoClasses?.call(null, photo)}"
						@click="() => handlePhotoClick(photo)"
						@mousedown.stop="onMove"
						@mouseup="onDrop"
					>
						<div class="photo-frame" :class="(draggable && !isMobile) ? 'handle' : null">
							<PhotoFrame :key="photo.id + size" :photo="photo" :size="size as any || 'sm'" />
						</div>
						<div class="options" @click.stop>
							<i v-show="draggable && isMobile" class="button pi pi-arrows-alt handle" />
							<div class="flex-grow-1"></div>
							<slot name="options" :photo="photo">
								<DropdownMenu v-if="photoOptions" :model="photoOptions(photo)">
									<i class="button pi pi-ellipsis-v" />
								</DropdownMenu>
							</slot>
						</div>
						<div class="filename">{{ photo.filename }}</div>
					</div>
				</template>
			</Drag>

			<div v-if="collapsible && photos.length > 0"
				class="flex align-items-center justify-content-center gap-2 pt-4"
			>
				<div class="cursor-pointer" @click="state.expanded = !state.expanded">
					<template v-if="!state.expanded">View all ({{ photos.length }}) <i class="pi pi-chevron-down" /></template>
					<template v-else>View less <i class="pi pi-chevron-up" /></template>
				</div>
			</div>
		</div>

		<div v-else-if="handleAddPhotos" class="flex align-items-center gap-2 cursor-pointer add-photos"
			@click="handleAddPhotos">
			<i class="pi pi-plus" />
			Add Photos
		</div>
	</div>

	<div
		v-if="state.isDragSelecting"
		class="drag-select-overlay"
		:style="{ left: state.dragSelectionBounds.x + 'px', top: state.dragSelectionBounds.y + 'px', width: state.dragSelectionBounds.width + 'px', height: state.dragSelectionBounds.height + 'px' }"
	>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

.photo-grid {
	height: 9rem;
	overflow: hidden;
}

.photo-grid {
	padding-top: 10px;
	padding-bottom: 5px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
	column-gap: 5px;
	row-gap: 15px;
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
	border-radius: 3px;

	&:hover {
		outline: 1px solid #dde;
		box-shadow: 0 0 5px 0 #0005;
	}

	&.selected {
		background: #f0f9ff;
		outline: 2px solid #b9def7;
	}

	&.sortable-ghost {
		opacity: .4;
		border: 1px solid lightgrey;
		cursor: grabbing;
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

	.options {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        z-index: 1;
		height: 0;
		display: flex;
        justify-content: space-between;

		> *:not(.force-visible) {
			visibility: hidden;
		}
		
		:deep(.button) {
			display: inline-block;
			background: #fffe;
			width: 2em;
			height: 2em;
			line-height: 2em;
			text-align: center;
			cursor: pointer;
		}
	}

	&:hover .options > * {
		visibility: visible;
	}
}

.add-photos {
	cursor: pointer;
	color: lightgrey;
	border: 1px solid;
	display: flex;
	justify-content: center;
	align-items: center;
	min-width: 5rem;
	height: 5rem;

	&:hover {
		color: gray;
	}

	i {
		font-size: 1.5rem;
	}
}


.md {
	.photo-grid {
		height: 10.5rem;
	}

	.photo-grid {
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
	}

	.photo-grid-item {
		max-width: 8rem;

		.photo-frame {
			width: 7rem;
			height: 7rem;
		}
	}
}

.lg {
	.photo-grid {
		height: 12.5rem;
	}

	.photo-grid {
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
	}

	.photo-grid-item {
		max-width: 10rem;

		.photo-frame {
			width: 9rem;
			height: 9rem;
		}
	}
}


.expanded .photo-grid {
	height: auto;
}


.drag-select-overlay {
	position: fixed;
	background: #bef5;
	outline: 1px solid #befe;
	z-index: 10;
	pointer-events: none;
}

</style>