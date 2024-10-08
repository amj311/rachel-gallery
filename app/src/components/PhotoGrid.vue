<script setup lang="ts">
import { reactive, computed } from 'vue';
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
	isSelected?: (photo) => boolean,
	onToggleSelected?: (photo) => void,
}>();

const state = reactive({
	expanded: props.collapsible ? false : true,
});

const visiblePhotos = computed(() => {
	return state.expanded ? photos.value : photos.value!.slice(0, 10);
});

function onMove(e) {
	document.body.classList.add('dragging');
}
function onDrop(e) {
	document.body.classList.remove('dragging');

	const fromListId = e.from.attributes['data-listid'].value;
	const toListId = e.to.attributes['data-listid'].value;
	const photo = e.item._underlying_vm_;

	props.onPhotoDrop?.call(null, photo, fromListId, toListId);
}

</script>

<template>
	<div :class="{ expanded: state.expanded, [props.size || 'sm']: true }">
		<div v-if="photos && photos.length" >
			<Drag v-model="photos" :animation="200" :group="dragGroup" itemKey="id" tag="div" class="photo-grid" handle=".handle" @end="onDrop" @move="onMove" :data-listid="listId" :scroll-sensitivity="100" :force-fallback="true">
				<template #header v-if="handleAddPhotos">
					<div key="add-photos" class="add-photos photo-grid-item" @click="handleAddPhotos">
						<i class="pi pi-plus" />
					</div>
				</template>
				<template #item="{ element: photo }">
					<div
						v-if="!photo.marked_for_deletion && visiblePhotos?.includes(photo)"
						class="photo-grid-item"
						:class="{ 'selected': isSelected?.call(null, photo), ...photoClasses?.call(null, photo)}"
						@click="onPhotoClick?.call(null, photo)"
					>
						<div class="photo-frame" :class="(draggable && !isMobile) ? 'handle' : null">
							<PhotoFrame :key="photo.id + size" :photo="photo" :size="size as any || 'sm'" />
						</div>
						<div class="options">
							<div v-show="selectable" class="button" :class="{ 'force-visible': isSelected?.call(null, photo) }">
								<input type="checkbox" :checked="isSelected?.call(null, photo)" @click="() => onToggleSelected?.call(null, photo)" />
							</div>
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
		outline: 2px solid #dde;
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

</style>