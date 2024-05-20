<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/user.store';
import Toast from 'primevue/toast';
import watermarkImage from '@/assets/images/watermark.png'
import { computed, onMounted } from 'vue';
import { onBeforeUnmount } from 'vue';
import { ref } from 'vue';

const userStore = useUserStore();

const loadingMessages = [
	'Loading...',
	'Almost there...',
	'Just a sec...',
];

const activeMessageIdx = ref(0);
const activeMessage = computed(() => loadingMessages[activeMessageIdx.value]);

const interval = setInterval(() => {
	activeMessageIdx.value = (activeMessageIdx.value + 1) % loadingMessages.length;
}, 10000);

onBeforeUnmount(() => {
	clearInterval(interval);
});

</script>


<template>
	<div v-if="!userStore.hasLoadedSessionData" class="splash">
		<img :src="watermarkImage" width="200" />
		<div class="flex gap-2 align-items-center my-3">
			<i class="pi pi-spin pi-spinner" font-size="3rem"></i>
			<h2>{{ activeMessage }}</h2>
		</div>
	</div>
	<RouterView v-else />
	<Toast></Toast>
</template>


<style scoped>
.splash {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: #fff5;
	backdrop-filter: blur(7px);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}
</style>