<script setup lang="ts">
import { computed, reactive } from 'vue';
import PhotoFrame from '../PhotoFrame.vue';
import Column from './text-elements/Column.vue';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import request from '@/services/request';
import PortfolioPhotoSelector from './PortfolioPhotoSelector.vue';
import { onMounted } from 'vue';
import { watch } from 'vue';
import { useAppStore } from '@/stores/app.store';

const toast = useToast();

const section = defineModel<any>();
const sectionRef = ref<HTMLDivElement>();

const props = defineProps<{
	editMode?: boolean,
}>();

const isSkinny = ref(false);

onMounted(() => {
	computeSkinny();
})
watch(computed(() => useAppStore().emulateWindowResize), () => {
	computeSkinny();
})

function computeSkinny() {
	const gridEl = sectionRef.value;
	isSkinny.value = gridEl!.clientWidth < 600;
}

const photoSelector: any = ref(null);

const SectionEditor = reactive({
	editMode: props.editMode,
	isSkinny,

	getPhotoById(id) {
		return section.value.photos.find(photo => photo.id === id);
	},

	async deletePhoto(photo, skipConfirm = false, skipAlert = false) {
		if (!skipConfirm && !confirm('Are you sure you want to delete this photo?')) return;
		try {
			await request.delete('admin/photo/' + photo.id);
			section.value.photos = section.value.photos.filter(p => p.id !== photo.id);
			if (!skipAlert) {
				toast.add({ severity: 'success', summary: 'Success', detail: 'Photo deleted', life: 3000 });
			}
		}
		catch (error) {
			console.error(error);
			console.log("Failed to delete photo.");
			toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete photo. Try again later', life: 3000 });
		}
	},

	async openPhotoSelector(cb: (photo: any) => void) {
		photoSelector.value!.open(null, null, section.value.id, cb);
	}
})

const backgroundImage = computed(() => SectionEditor.getPhotoById(section.value.attributes.backgroundPhotoId));


</script>

<template>
	<div ref="sectionRef" class="text-section" :style="{ 'background-color': section.attributes.backgroundColor || '#fff' }">
		<div v-if="backgroundImage" class="backdrop" :style="{ 'opacity': section.attributes.backgroundOpacity / 100 || '1' }">
			<div class="photo-frame">
				<PhotoFrame :key="backgroundImage.id" :photo="backgroundImage" :size="'xl'" :fillMethod="'cover'" :position="section.attributes.focalPoint" />
			</div>
		</div>
		<div class="content py-6 section-max-width">
			<Column :editMode="props.editMode" v-model="section.attributes" :canAddColumns="['text', 'photo-frame']" :sectionEditor="SectionEditor" />
		</div>
	</div>
	<PortfolioPhotoSelector ref="photoSelector" />
</template>

<style scoped lang="scss">
@import './portfolio.scss';

.text-section {
	width: 100%;
	position: relative;
	/* height: calc(100vh - 80px); 100% of the viewport height adjusted for navbar height */

	.content {
		position: relative;
		width: 100%;
	}

	.backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		.photo-frame {
			position: absolute;
			width: 100%;
			height: 100%;

			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
		}
	}

}
</style>