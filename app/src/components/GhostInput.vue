<script setup lang="ts">
import { ref, useAttrs } from 'vue';


const text = defineModel<string>();

const isEditing = ref(false);

const input = ref<HTMLInputElement>();
const toggleEditing = () => {
	isEditing.value = !isEditing.value;
	if (isEditing.value) {
		input.value?.focus();
	} else {
		input.value?.blur();
	}
};

const attrs = useAttrs();
const emptyLength = attrs.placeholder?.length || 10;

</script>

<template>
	<div class="ghost-input" :class="{ editing: isEditing }" @click="toggleEditing">
		<input ref="input" v-model="text" :size="isEditing ? Math.max(text?.length || 0, emptyLength) : text ? text.length : emptyLength" @keyup.enter="toggleEditing" @blur="toggleEditing" v-bind="$attrs" />
		<i v-if="!isEditing" :class="'pi pi-pencil'"></i>
	</div>
</template>

<style scoped>
.ghost-input {
	display: inline-flex;
	align-items: center;
	gap: .5em;

	input {
		--webkit-appearance: none;
		padding: 0 0 0 0;
		padding-block: 0;
		padding-inline: 0;
		border: none;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		line-height: inherit;
		margin: 0;
		padding-left: 0.2em;
		margin-left: -0.2em;
	}

	&.editing {
		input {
		}
	}
}

</style>
