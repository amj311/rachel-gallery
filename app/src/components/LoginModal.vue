<script setup lang="ts">
import { useRouter } from 'vue-router';
import { reactive, defineProps } from 'vue';
import watermarkImage from '@/assets/images/watermark.png'
import LoginForm from '@/components/LoginForm.vue';

const router = useRouter();

const { message } = defineProps<{
	message?: string
}>();

const state = reactive({
	isLoading: true,
	galleryId: router.currentRoute.value.params.galleryId,
	canView: false,
	gallery: null,
	showSlideshow: false,
	firstSlideshowPhoto: null,
});

</script>


<template>
	<div class="login-modal">
		<img :src="watermarkImage" width="100" />
		<h3>{{ message }}</h3>
		<LoginForm />
	</div>
</template>

<style lang="scss">
	.login-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #fff;
		border: 1px solid lightgrey;
		outline: 10px solid #fff;
		box-shadow: 0px 0px 9px 11px #0005;
		padding: 2em;
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;
	}

</style>