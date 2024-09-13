<script setup lang="ts">
import PhotoFrame from '@/components/PhotoFrame.vue';
import { onMounted, onUnmounted, reactive } from 'vue';

const section = defineModel<any>();

const props = defineProps<{
	editMode?: boolean,
}>();

const state = reactive({
	activePhotoIdx: 0,
	playingTimer: 0,
	animationClass: '',
});

async function goToNext() {
	state.activePhotoIdx = (state.activePhotoIdx + 1) % section.value.photos.length;
}

onMounted(() => {
	state.playingTimer = setInterval(goToNext, 10000) as any;
})
onUnmounted(() => {
	clearInterval(state.playingTimer);
})
</script>

<template>
	<div class="carousel-wrapper" :style="{ 'background-color': section.attributes.backgroundColor || '#fff' }">
		<div v-if="section.photos.length === 0 && props.editMode" class="flex flex-column justify-content-center align-items-center h-full">
			<i class="material-symbols-outlined text-7xl text-gray-400">overview_key</i>
			Use the editor panel to add photos
		</div>
		<PhotoFrame v-for="photo in section.photos" v-show="state.activePhotoIdx === section.photos.indexOf(photo)" :key="photo.id" :photo="photo" :fill-method="'cover'" :size="'xl'" />
	</div>
</template>

<style scoped>
.carousel-wrapper {
	width: 100%;
	height: calc(100vh - 80px); /* 100% of the viewport height adjusted for navbar height */
}
</style>