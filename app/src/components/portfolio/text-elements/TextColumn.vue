<script setup lang="ts">
import { defineModel, computed, onBeforeMount } from 'vue';
import TextEditor from '@/components/TextEditor.vue';
import ColumnWrapper from './ColumnWrapper.vue';

const col = defineModel<any>();

const props = defineProps<{
	sectionEditor?: any,
}>();

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
		if (col.value[attr] === undefined) {
			col.value[attr] = defaultAttributes[attr];
		}
	}
})
</script>

<template>
	<ColumnWrapper :editMode="props.sectionEditor.editMode" :options="[]">
		<div>
		<TextEditor v-model="col.text" :discreet="true" :readOnly="!props.sectionEditor.editMode" :placeholder="'Write your text here'" />
	</div>
	</ColumnWrapper>
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