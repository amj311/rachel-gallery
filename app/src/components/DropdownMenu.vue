<script setup lang="ts">
import Menu from 'primevue/menu';
import { ref } from 'vue';

const menu = ref<InstanceType<typeof Menu>>();


function openMenu(event) {
	console.log(event);
		console.log(menu);
	menu.value?.toggle(event);
}

</script>

<template>
	<div @click="openMenu" v-bind="$attrs"><slot></slot></div>
	<Menu ref="menu" id="overlay_menu" :popup="true" v-bind="$attrs" />
</template>

<style scoped>
</style>
