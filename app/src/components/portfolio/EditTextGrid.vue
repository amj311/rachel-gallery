<script setup lang="ts">
import { defineModel, computed, onBeforeMount } from 'vue';
import EditBackground from './EditBackground.vue';

const section = defineModel<any>();
const backgroundImage = computed(() => section.value.photos.find(() => section.value.attributes.backgroundPhotoId));

onBeforeMount(() => {
	const defaultAttributes = {
		backgroundColor: '#ffffff',
		backgroundOpacity: 100,
		rows: [{
			columns: [{
				type: 'text',
			}]
		}],
	};

	for (const attr in defaultAttributes) {
		if (section.value.attributes[attr] === undefined) {
			section.value.attributes[attr] = defaultAttributes[attr];
		}
	}
})

function onImageChange(image) {
	section.value.attributes.backgroundPhotoId = image.id;
}

</script>

<template>
	<div>
		<div class="settings-grid">
			<EditBackground v-model="section.attributes" :section="section" :backgroundImage="backgroundImage" @imageChange="onImageChange" />
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

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