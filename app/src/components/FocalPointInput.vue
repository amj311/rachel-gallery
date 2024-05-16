<script setup lang="ts">
import { ref } from 'vue';
import PhotoFrame from './PhotoFrame.vue';

const position = defineModel<{x: number, y: number}>();
const { style = {}, photo } = defineProps<{
	style?: any,
	photo?: any
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
	<div class="focal-point-input" :style="{ width: photo ? ((photo.width * 60 / photo.height) + 'px') : '60px', ...style }" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp">
		<div class="photo-frame"><PhotoFrame :key="photo.id" :photo="photo" :size="'sm'" :fillMethod="'cover'" /></div>
		<div class="crosshair x" />
		<div class="crosshair y" />
		<div class="grabber" :style="{ left: `${position?.x || 50}%`, top: `${position?.y || 50}%` }" />
	</div>
</template>

<style scoped>
.focal-point-input {
	display: inline-block;
	vertical-align: middle;
	height: 60px;
	position: relative;
	border: 1px solid lightgray;
	border-radius: 5px;
	cursor: pointer;

	&:hover {
		border: 1px solid darkgray;

		.crosshair {
			display: block;
		}
	}
}
.photo-frame {
	position: absolute;
	width: 100%;
	height: 100%;
	opacity: 0.8;
	border-radius: 4px;
	overflow: hidden;
}
.crosshair.x {
	position: absolute;
	top: 50%;
	width: 100%;
	border-top: 1px solid darkgray;
	display: none;
}
.crosshair.y {
	position: absolute;
	left: 50%;
	height: 100%;
	border-left: 1px solid darkgray;
	display: none;
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
