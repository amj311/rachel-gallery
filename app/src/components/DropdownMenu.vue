<script setup lang="ts">
import Menu from 'primevue/menu';
import { ref } from 'vue';

const menu = ref<InstanceType<typeof Menu>>();
const props = defineProps<{
	disabled?: boolean
	style?: any
}>();

function openMenu(event) {
	if (!props.disabled) menu.value?.toggle(event);
}

</script>

<template>
	<span @click="openMenu" v-bind="{ ...$props, ...$attrs }"><slot></slot></span>
	<Menu ref="menu" id="overlay_menu" :popup="true" v-bind="$attrs">
		<template #start><slot name="start"></slot></template>
	</Menu>
</template>

<style scoped>
</style>
