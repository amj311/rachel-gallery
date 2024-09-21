<script setup lang="ts">
import { computed } from 'vue';
import PhotoFrame from '../PhotoFrame.vue';
import Column from './text-elements/Column.vue';

const section = defineModel<any>();

const backgroundImage = computed(() => section.value.photos[0]);

const props = defineProps<{
	editMode?: boolean,
}>();

</script>

<template>
	<div class="text-section" :style="{ 'background-color': section.attributes.backgroundColor || '#fff' }">
		<div v-if="backgroundImage" class="backdrop" :style="{ 'opacity': section.attributes.backgroundOpacity / 100 || '1' }">
			<div class="photo-frame">
				<PhotoFrame :key="backgroundImage.id" :photo="backgroundImage" :size="'xl'" :fillMethod="'cover'" :position="section.attributes.focalPoint" />
			</div>
		</div>
		<div class="content py-7 section-max-width">
			<Column :editMode="props.editMode" v-model="section.attributes" :canAddColumns="['text']" />
		</div>
	</div>
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