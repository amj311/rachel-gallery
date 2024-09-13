<script setup lang="ts">
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { onMounted, reactive, ref } from 'vue';

const text = defineModel<string>();
const initialText = text.value;

const id = 'editor_' + Math.random().toString(36).substring(2, 9);

const props = defineProps<{
	classes?: any,
	onTextChange?: (event) => void,
	discreet?: boolean,
	readOnly?: boolean,
	placeholder?: string,
}>();

const state = reactive({
	quill: null,
})

onMounted(() => {
	if (state.quill) return;

	const quill = new Quill('#'+id, {
		theme: 'snow',
		placeholder: props.placeholder,
		readOnly: props.readOnly,
		modules: {
			toolbar: !props.readOnly && [
				[{ 'header': [1, 2, 3, false] }, { 'font': [] }],

				['bold', 'italic', 'underline', 'strike', { 'color': [ '#fac', 'green', 'blue' ] }],        // toggled buttons

				[{ 'align': [] }, { 'list': 'ordered'}, { 'list': 'bullet' }],
				// [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent

				['link', 'image', 'video'],

				['clean'],
			],
		},
	});
	quill.on('text-change', (delta, oldDelta, source) => {
		if (source === 'user') {
			text.value = quill.root.innerHTML;
		}

		if (props.onTextChange) {
			props.onTextChange(quill.root.innerHTML);
		}
	})
})

</script>

<template>
	<div class="text-editor" :class="{ 'discreet': props.discreet, 'read-only': props.readOnly, ...props.classes }">
		<div :id="id" v-html="initialText"></div>
	</div>
</template>

<style scoped lang="scss">

:deep(strong) {
	font-weight: bold;
}

.invalid :deep(.p-editor-content) {
    border: 1px solid #f87171 !important;
}

:deep(.ql-container) {
	font-size: inherit;
}

.discreet {
	position: relative;

	:deep(.ql-toolbar) {
		position: absolute;
		top: 0;
		left: 0;
		// right: 0;
		transform: translateY(calc(-100%));	
		z-index: 10;
		background: #fff;
		border: 0;
		box-shadow: 0 0 .3em #0003;
		display: none;
	}

	&:hover {
		:deep(.ql-toolbar) {
			display: block;
		}
	}

	:deep(.ql-container) {
		border: 0;
	}

	&:hover:not(.read-only) {
		:deep(.ql-container) {
			outline: 1px solid #aaa4;
		}
	}

	:deep(.ql-editor) {
		padding: 0;
	}
}
</style>