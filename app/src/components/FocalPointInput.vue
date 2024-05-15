<script setup lang="ts">
import { ref } from 'vue';

const position = defineModel<{x: number, y: number}>();
const { style } = defineProps<{
	style?: any
}>();

const isDragging = ref(false);

function onMouseDown(e) {
	e.preventDefault();
	isDragging.value = true;
	updatePosition(e);
}
function onMouseMove(e) {
	e.preventDefault();
	if (isDragging.value) {
		updatePosition(e);
	}
}
function onMouseUp(e) {
	e.preventDefault();
	isDragging.value = false;
}

function updatePosition(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	const x = Math.max(0, Math.min(100, Math.round((e.clientX - rect.left) / rect.width * 100)));
	const y = Math.max(0, Math.min(100, Math.round((e.clientY - rect.top) / rect.height * 100)));
	position.value = { x, y };
}


</script>

<template>
	<div class="focal-point-input" :style="style" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp">
		<div class="crosshair x" />
		<div class="crosshair y" />
		<div class="grabber" :style="{ left: `${position?.x || 50}%`, top: `${position?.y || 50}%` }" />
	</div>
</template>

<style scoped>
.focal-point-input {
	display: inline-block;
	vertical-align: middle;
	width: 50px;
	height: 50px;
	position: relative;
	border: 1px solid lightgray;
	border-radius: 5px;
	cursor: pointer;
}
.crosshair.x {
	position: absolute;
	top: 50%;
	width: 100%;
	border-top: 1px solid lightgray;
}
.crosshair.y {
	position: absolute;
	left: 50%;
	height: 100%;
	border-left: 1px solid lightgray;
}
.grabber {
	position: absolute;
	transform: translate(-50%, -50%);
	background-color: #fff;
	border: 1px solid black;
	border-radius: 50%;
	width: 10px;
	height: 10px;
}
</style>
