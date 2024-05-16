<script setup lang="ts">
import Button from 'primevue/button';
import { computed, ref, useAttrs } from 'vue';


const text = defineModel<string>();
const firstText = text.value;

const isEditing = ref(false);

const input = ref<HTMLInputElement>();
const startEditing = () => {
	isEditing.value = true;
	input.value?.focus();
};
const stopEditing = () => {
	isEditing.value = false;
	input.value?.blur();
};

</script>

<template>
	<div class="ghost-input" :class="{ editing: isEditing }">
		<span class="input" contenteditable @focus="startEditing" @blur="stopEditing" @input="text = $event.target.innerText" ref="input" @keydown.enter="stopEditing" :placeholder="text.length === 0 ? $attrs.placeholder || 'Enter text...' : ''">{{ firstText }}</span>
		<Button class="icon" icon="pi pi-pencil" text @click="startEditing" />
	</div>
</template>

<style scoped>
.ghost-input {
	display: inline-flex;
	align-items: center;
	cursor: pointer;

	&.editing {
		cursor: auto;

		.input {
			padding-left: .2em;
			margin-left: -.2em;
			padding-right: .2em;
			margin-right: -.2em;
		}

		.icon {
			opacity: 0;
			pointer-events: none;
		}
	}

	.input::after {
		content: attr(placeholder);
		color: gray;
	}
}

</style>
