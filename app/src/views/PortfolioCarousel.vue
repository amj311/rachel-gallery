<script setup lang="ts">
import PhotoFrame from '@/components/PhotoFrame.vue';
import { computed, onMounted, onUnmounted, reactive } from 'vue';

const props = defineProps<{
	section: any,
}>();

const state = reactive({
	activePhotoIdx: 0,
	playingTimer: 0,
	animationClass: '',
});

async function goToNext() {
	state.activePhotoIdx = (state.activePhotoIdx + 1) % props.section.photos.length;
}

onMounted(() => {
	state.playingTimer = setInterval(goToNext, 10000) as any;
})
onUnmounted(() => {
	clearInterval(state.playingTimer);
})
</script>

<template>
	<div class="carousel-wrapper">
		<PhotoFrame v-for="photo in section.photos" v-show="state.activePhotoIdx === section.photos.indexOf(photo)" :key="photo.id" :photo="photo" :fill-method="'cover'" :size="'xl'" />
	</div>
</template>

<style scoped>
.carousel-wrapper {
	width: 100%;
	height: calc(100vh - 80px); /* 100% of the viewport height adjusted for navbar height */
}
</style>