<script setup lang="ts">
import { defineModel, computed, onBeforeMount } from 'vue';
import TextEditor from '@/components/TextEditor.vue';
import PhotoFrame from '@/components/PhotoFrame.vue';
import DropdownMenu from '@/components/DropdownMenu.vue';
import ColumnWrapper from './ColumnWrapper.vue';

const col = defineModel<any>();

const props = defineProps<{
	editMode?: boolean,
	photoManager: any;
}>();

const photo = computed(() => props.photoManager.getPhotoById(col.value.backgroundPhotoId));

onBeforeMount(() => {
	const defaultAttributes = {
		fillMethod: 'cover',
		position: 'center',
	};

	for (const attr in defaultAttributes) {
		if (col.value[attr] === undefined) {
			col.value[attr] = defaultAttributes[attr];
		}
	}
})

function selectPhoto() {
	props.photoManager.openPhotoSelector((photo) => {
		col.value.backgroundPhotoId = photo.id;
	});
}

const options = computed(() => ([
	{
		label: col.value.fillMethod === 'cover' ? 'Cover' : 'Contain',
		command: () => {
			col.value.fillMethod = col.value.fillMethod === 'cover' ? 'contain' : 'cover';
		},
	},
	{
		label: 'Position',
		items: [
			{
				label: 'Center',
				command: () => {
					col.value.position = 'center';
				},
			},
			{
				label: 'Top',
				command: () => {
					col.value.position = 'top';
				},
			},
			{
				label: 'Bottom',
				command: () => {
					col.value.position = 'bottom';
				},
			},
			{
				label: 'Left',
				command: () => {
					col.value.position = 'left';
				},
			},
			{
				label: 'Right',
				command: () => {
					col.value.position = 'right';
				},
			},
		]
	},
	{
		label: 'Remove photo',
		async command() {
			await props.photoManager.deletePhoto(photo.value);
			col.value.backgroundPhotoId = null;
		}
	},
]));

</script>

<template>
	<ColumnWrapper :editMode="props.editMode" :options="options">
		<div class="photo-col">
			<div v-if="!photo && props.editMode" class="add-photo" @click="selectPhoto"><i class="pi pi-image text-2xl" />Add Image</div>
			<PhotoFrame v-else-if="photo" :key="photo.id" :photo="photo" :fillMethod="col.fillMethod" :position="col.position" size="lg" fixedRatio />
		</div>
	</ColumnWrapper>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

.photo-col {
	position: relative;
	height: 100%;
	width: 100%;
}

.add-photo {
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	border: 1px solid #dddefd;
	border-radius: 5px;
	padding: 1em;
	cursor: pointer;
	
	&:hover {
		background: #f5f5f5;
	}
}

</style>