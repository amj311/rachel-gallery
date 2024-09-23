<script setup lang="ts">
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { onMounted, reactive, ref } from 'vue';
import colors from '@/assets/colors.module.scss';

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


const fonts = [
	{
		value: '',
		label: 'Default',
		family: 'sans-serif',
	},
	{
		value: 'timesNewRoman',
		label: 'Times New Roman',
		family: 'Times New Roman',
	},
	{
		value: 'arial',
		label: 'Arial',
		family: 'Arial',
	},
	{
		value: 'parisienne',
		label: 'Parisienne',
		family: 'Parisienne',
		link: 'https://fonts.googleapis.com/css2?family=Parisienne&display=swap',
	},
];

let Font: any = Quill.import('formats/font');
Font.whitelist = fonts.map(font => font.value);
Quill.register(Font, true);

const fontLinks = fonts.reduce((html, font) => {
	if (font.link) {
		html += `<link rel="stylesheet" href="${font.link}">`;
	}
	return html;
}, '');

const fontCss = fonts.reduce((html, font) => html + /*css*/`
.ql-picker.ql-font .ql-picker-label[data-value='${font.value}']::before,
.ql-picker.ql-font .ql-picker-item[data-value='${font.value}']::before
{
	content: '${font.label}';
	font-family: ${font.family};
}

.ql-font-${font.value} {
	font-family: ${font.family};
}
`, '');

onMounted(() => {
	if (state.quill) return;

	const textColors = [
		'#000000', '#444444', '#666666', '#aaaaaa', '#cccccc', '#eeeeee', '#ffffff',
		colors.primaryDark, colors.primary, colors.primaryThin,
	];

	const quill = new Quill('#'+id, {
		theme: 'snow',
		placeholder: props.placeholder,
		readOnly: props.readOnly,
		modules: {
			toolbar: !props.readOnly && [
				[{ 'header': [1, 2, 3, false] }, { 'font': fonts.map(font => font.value) }],

				['bold', 'italic', 'underline', 'strike', { 'color': textColors }],

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
	<div v-html="fontLinks" />
	<div v-html="'<style>'+fontCss+'</style>'" />
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
		min-width: 20rem;
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
		border: 0 !important;
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