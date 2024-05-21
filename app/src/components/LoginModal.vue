<script setup lang="ts">
import watermarkImage from '@/assets/images/watermark.png'
import LoginForm from '@/components/LoginForm.vue';

const { message, closeable = false } = defineProps<{
	message?: string,
	closeable?: boolean,
}>();

defineEmits(['close']);

</script>


<template>
	<div class="login-modal">
		<div v-if="closeable" class="close-button" @click="() => $emit('close')"><i class="pi pi-times" /></div>
		<img :src="watermarkImage" width="100" />
		<h3>{{ message }}</h3>
		<LoginForm />
	</div>
</template>

<style scoped lang="scss">
.login-modal {
	position: fixed;
	top: 50vh;
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

	.close-button {
		position: absolute;
		right: 10px;
		top: 10px;
		cursor: pointer;
	}
}

</style>