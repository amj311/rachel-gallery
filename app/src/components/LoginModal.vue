<script setup lang="ts">
import watermarkImage from '@/assets/images/watermark.png'
import LoginForm from '@/components/LoginForm.vue';
import { useAppStore } from '@/stores/app.store';
import Sidebar from 'primevue/sidebar';

const { message, closeable = false } = defineProps<{
	message?: string,
	closeable?: boolean,
}>();

defineEmits(['close']);

</script>


<template>
	<Sidebar class="login-modal" :class="{isMobile: useAppStore().isMobile}" :showCloseIcon="false" visible position="bottom" blockScroll>
		<div class="flex flex-column align-items-center justify-content-center h-full gap-3">
			<div v-if="closeable" class="close-button" @click="() => $emit('close')"><i class="pi pi-times" /></div>
			<img :src="watermarkImage" width="180" />
			<h3>{{ message }}</h3>
			<LoginForm @authenticated="() => $emit('close')" />
		</div>
	</Sidebar>
</template>

<style lang="scss">
.login-modal.p-sidebar {
	width: fit-content;
	height: fit-content;
	padding: 1rem;
	bottom: 50%;
	translate: 0 50%;

	&.isMobile {
		bottom: 0;
		translate: none;
		height: 75%;
		width: 100%;
	}
	

	.close-button {
		position: absolute;
		right: 10px;
		top: 10px;
		cursor: pointer;
	}
}

</style>