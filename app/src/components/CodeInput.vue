<script setup lang="ts">
import InputText from 'primevue/inputtext';
import { computed, onMounted, ref } from 'vue';

const code = defineModel<string | null>();
const input = ref<HTMLInputElement>();

const CODE_LENGTH = 6;
const activeInputIdx = ref(0);

const inputs = computed(() => Array.from(input.value?.querySelectorAll('input') || []));

onMounted(() => {
	inputs.value[0]?.focus();
})

function handleFocus(e) {
	activeInputIdx.value = inputs.value.indexOf(e.target);
	e.target.select();
}

function handleKeydown(e) {
	if (e.key === 'Backspace') {
		if (activeInputIdx.value > 0) {
			activeInputIdx.value--;
			inputs.value[activeInputIdx.value]?.focus();
		}
		updateCode();
	}
}

function handleInput(e) {
	const value = e.target.value;
	if (value) {
		activeInputIdx.value++;
		inputs.value[activeInputIdx.value]?.focus();
	}
	updateCode();
}

function updateCode() {
	code.value = inputs.value.reduce((acc, input) => acc + input.value, '');
}

</script>

<template>
	<div class="code-input" ref="input">
		<InputText v-for="i in CODE_LENGTH" :key="i" :value="code?.[i - 1]" @focus="handleFocus" @keydown="handleKeydown" @input="handleInput" size="small" :maxlength="i < CODE_LENGTH ? undefined : 1" />
	</div>
</template>

<style scoped>
.code-input {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	cursor: pointer;

	input {
		width: 2.5em;
		height: 3em;
		text-align: center;
	}
}

</style>
