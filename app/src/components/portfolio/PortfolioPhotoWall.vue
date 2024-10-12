<script
	setup
	lang="ts"
>
import PhotoWall from '@/components/PhotoWall.vue';
import Slideshow from '@/components/Slideshow.vue';
import { ref } from 'vue';

const section = defineModel<any>();

const props = defineProps<{
	editMode?: boolean,
}>();

const slideshow = ref<InstanceType<typeof Slideshow>>();
function openSlideshow(photo?) {
	slideshow.value?.open(section.value.photos, photo);
}
</script>

<template>
	<div
		class="py-6"
		:style="{ 'background-color': section.attributes.backgroundColor || '#fff' }"
	>
		<div
			v-if="section.photos.length === 0 && props.editMode"
			class="flex flex-column justify-content-center align-items-center py-8"
		>
			<i class="material-symbols-outlined text-7xl text-gray-400">dashboard_2</i>
			Use the editor panel to add photos
		</div>
		<div
			v-else
			class="section-max-width"
		>
			<PhotoWall :photos="section.photos">
				<template v-slot="{ photo }">
					<div
						class="w-full h-full cursor-pointer"
						:class="{ 'pointer-events-none': props.editMode }"
						@click="openSlideshow(photo)"
					/>
				</template>
			</PhotoWall>
		</div>
	</div>

	<Slideshow ref="slideshow"/>
</template>

<style
	scoped
	lang="scss"
>
@import './portfolio.scss';
</style>