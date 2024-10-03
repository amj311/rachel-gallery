<script setup lang="ts">
import Button from 'primevue/button';


defineProps<{
	closeable?: boolean
	onClose?: () => void
}>();

</script>


<template>
	<div class="snackbar modal">
		<slot name="content"></slot>
		&nbsp;&nbsp;
		&nbsp;&nbsp;
		<div class="flex-grow-1"></div>
		<slot name="actions"></slot>
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