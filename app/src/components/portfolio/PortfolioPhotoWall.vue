<script setup lang="ts">
import PhotoWall from '@/components/PhotoWall.vue';

const section = defineModel<any>();

const props = defineProps<{
	editMode?: boolean,
}>();

</script>

<template>
	<div class="p-5" :style="{ 'background-color': section.attributes.backgroundColor || '#fff' }">
	<div v-if="section.photos.length === 0 && props.editMode" class="flex flex-column justify-content-center align-items-center py-8">
		<i class="material-symbols-outlined text-7xl text-gray-400">dashboard_2</i>
		Use the editor panel to add photos
	</div>
	<PhotoWall :photos="section.photos" />
	</div>
</template>

<style scoped>
</style>