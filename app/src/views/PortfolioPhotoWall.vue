<script setup lang="ts">
import PhotoWall from '@/components/PhotoWall.vue';

const props = defineProps<{
	section: any,
}>();

</script>

<template>
	<div class="px-5">
		<PhotoWall :photos="props.section.photos" />
	</div>
</template>

<style scoped>
</style>