<script setup lang="ts">
import Button from 'primevue/button';


defineProps<{
	closeable?: boolean
	onClose?: () => void
}>();

</script>


<template>
	<div class="snackbar modal">
		<div class="flex-grow-1 flex align-items-center gap-2"><slot name="content"></slot></div>
		<div v-if="$slots.actions" class="mr-2"></div>
		<div class="flex align-items-center"><slot name="actions"></slot></div>
		<div v-if="closeable" class="close-button" @click="onClose">
			<slot name="closer"><Button icon="pi pi-times" text @click="onClose" /></slot>
		</div>
	</div>
</template>

<style scoped lang="scss">
.snackbar {
	bottom: 10px;
	top: auto;
	left: auto;
	right: 10px;
	transform: none;
	min-width: 300px;
	width: auto;
	display: flex;
	align-items: center;
	padding: .5em 1em;
}
</style>