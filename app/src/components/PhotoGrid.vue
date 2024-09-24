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

	// dragging options
	draggable?: boolean,
	onPhotoDrop?: (photo, fromListId, toListId) => void,
	dragGroup?: string,
	listId?: string,
}>();

const state = reactive({
	expanded: props.collapsible ? false : true,
});

function onDrop(e) {
	const fromListId = e.from.attributes['data-listid'].value;
	const toListId = e.to.attributes['data-listid'].value;
	const photo = e.item._underlying_vm_;

	props.onPhotoDrop?.call(null, photo, fromListId, toListId);
}

</script>

<template>
	<div :class="{ expanded: state.expanded }">
		<div v-if="photos && photos.length">
			<Drag v-model="photos" :animation="200" :group="dragGroup" itemKey="id" tag="div" class="photo-grid" handle=".handle" @end="onDrop" :data-listid="listId" :scroll-sensitivity="100" :force-fallback="true">
				<template #header v-if="handleAddPhotos">
					<div key="add-photos" class="add-photos photo-grid-item" @click="handleAddPhotos">
						<i class="pi pi-plus" />
					</div>
				</template>
				<template #item="{ element: photo }">
					<div
						v-if="!photo.marked_for_deletion"
						class="photo-grid-item"
						:class="photoClasses?.call(null, photo)"
						@click="onPhotoClick?.call(null, photo)"
					>
						<div class="photo-frame" :class="(draggable && !isMobile) ? 'handle' : null">
							<PhotoFrame :photo="photo" />
						</div>
						<div class="options">
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
				class="flex align-items-center justify-content-center gap-2 cursor-pointer pt-4"
				@click="state.expanded = !state.expanded"
			>
				<template v-if="!state.expanded">View all ({{ photos.length }}) <i class="pi pi-chevron-down" /></template>
				<template v-else>View less <i class="pi pi-chevron-up" /></template>
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

	.options {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        z-index: 1;
		height: 0;
        justify-content: space-between;
        display: none;
		
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