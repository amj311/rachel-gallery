<script setup lang="ts">
import { ref, defineModel } from 'vue';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';
import PortfolioPhotoSelector from './PortfolioPhotoSelector.vue';
import { usePortfolioStore } from '../../../stores/portfolio.store';
import PhotoGridDrag from '@/components/PhotoGridDrag.vue';

const toast = useToast();
const portfolioStore = usePortfolioStore();

const section = defineModel<any>();

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

function onPhotoDrop() {
	section.value.photos.forEach((p, i) => p.order = i);
}

const photoSelector: any = ref(null);
function openUploadToSection(sectionId) {
	photoSelector.value!.open(null, null, sectionId);
}
</script>

<template>
	<div>
		<PhotoGridDrag
			v-model="section.photos"
			:draggable="true"
			:dragGroup="section.id"
			:listId="section.id"
			:onPhotoDrop="onPhotoDrop"
			:handleAddPhotos="() => openUploadToSection(section.id)"
			:photoOptions="(photo) => [{ label: 'Delete', command: () => deletePhoto(photo), class: 'danger' }]"
		/>
	</div>

	<PortfolioPhotoSelector ref="photoSelector" />
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

</style>