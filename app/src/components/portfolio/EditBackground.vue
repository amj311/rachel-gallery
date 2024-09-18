<script setup lang="ts">
import { ref, defineModel, computed, onBeforeMount } from 'vue';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';
import PortfolioPhotoSelector from './PortfolioPhotoSelector.vue';
import { usePortfolioStore } from '../../stores/portfolio.store';
import FocalPointInput from '../FocalPointInput.vue';
import Button from 'primevue/button';

const toast = useToast();
const portfolioStore = usePortfolioStore();

const attributes = defineModel<any>();
const props = defineProps<{
	section: any,
	backgroundImage?: any,
	onImageChange?: (image: any) => void
}>();

async function deletePhoto(photo, skipConfirm = false, skipAlert = false) {
	if (!skipConfirm && !confirm('Are you sure you want to delete this photo?')) return;
	try {
		await request.delete('admin/photo/' + photo.id);
		const deleteFromSection = portfolioStore.portfolio!.sections.find(s => s.id === photo.portfolioSectionId);
		deleteFromSection.photos = deleteFromSection.photos.filter(p => p.id !== photo.id);
		if (!skipAlert) {
			toast.add({ severity: 'success', summary: 'Success', detail: 'Photo deleted', life: 3000 });
		}
		props.onImageChange?.call(null, null);
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete photo.");
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete photo. Try again later', life: 3000 });
	}
}

onBeforeMount(() => {
	const defaultAttributes = {
		backgroundColor: '#ffffff',
		backgroundOpacity: 100,
	};

	for (const attr in defaultAttributes) {
		if (attributes.value[attr] === undefined) {
			attributes.value[attr] = defaultAttributes[attr];
		}
	}
})

const photoSelector: any = ref(null);
function openUploadToSection(sectionId) {
	photoSelector.value!.open(null, null, sectionId, props.onImageChange);
}
</script>

<template>
	<label>Background color</label>
	<div>
		<input type="color" value="#ffffff" v-model="attributes.backgroundColor" />
	</div>


	<label>Background image</label>
	<div>
		<template v-if="!backgroundImage">
			<button @click="openUploadToSection(section.id)">Upload</button>
		</template>
		<template v-else>
			<div class="bg-image flex align-items-center gap-2">
				<FocalPointInput v-model="attributes.focalPoint" :photo="backgroundImage" />
				<Button text @click="deletePhoto(backgroundImage, false, true)" icon="pi pi-times" size="small" />
			</div>
		</template>
	</div>

	<template v-if="backgroundImage">
		<label>Background opacity</label>
		<div>
			<input type="range" min="0" max="100" value="100" v-model="attributes.backgroundOpacity" />
		</div>
	</template>

	<PortfolioPhotoSelector ref="photoSelector" />
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.settings-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .5em 1em;
	align-items: center;
}

.photo-frame {
	height: 3rem;
	aspect-ratio: 1;
	margin-bottom: .5rem;
}

.bg-image:not(:hover) {
	:deep(.p-button) {
		display: none;
	}
}

</style>