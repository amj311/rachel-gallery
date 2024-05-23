<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const trigger = ref<HTMLDivElement>();
const isInScrollRange = ref(false);

function determineScrollRange() {
	const triggerTop = trigger.value!.getBoundingClientRect().top;
	const triggerBottom = trigger.value!.getBoundingClientRect().bottom;
	const windowBuffer = window.innerHeight * 0.5;
	isInScrollRange.value = (triggerTop < window.innerHeight + windowBuffer) && (triggerBottom > -windowBuffer);
}

onMounted(() => {
	window.addEventListener('scroll', determineScrollRange);
	window.addEventListener('resize', determineScrollRange);
});

onBeforeUnmount(() => {
	window.removeEventListener('scroll', determineScrollRange);
	window.removeEventListener('resize', determineScrollRange);
});

</script>

<template>
	<div ref="trigger" class="display-none position-absolute"></div>
	<slot v-if="isInScrollRange"></slot>
</template>

<style scoped>
</style>
