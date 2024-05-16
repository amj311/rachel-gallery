<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
// import AdminMenu from './AdminMenu.vue'
import { onBeforeMount, reactive } from 'vue';
import { useUserStore } from '@/stores/user.store';
import LoginForm from '@/components/LoginForm.vue';
import request from '@/services/request';
import UploaderWindow from './uploader/UploaderWindow.vue';
import GalleryCover from '@/components/GalleryCover.vue';
import Card from 'primevue/card';
import dayjs from 'dayjs';
import Button from 'primevue/button';

const router = useRouter();

const state = reactive({
	isLoading: true,
	galleries: [],
});

onBeforeMount(async () => {
	const { data } = await request.get('admin/gallery');
	state.galleries = data.data;
	state.isLoading = false;
})

async function createNewGallery() {
	const { data } = await request.post('admin/gallery');
	router.push(`/admin/galleries/${data.data.id}`);
}

</script>


<template>
	<div>
		<div class="flex align-items-center gap-3 mt-2 mb-4">
			<h1>Your Galleries</h1>
			<div class="flex-grow-1"></div>
			<Button @click="createNewGallery">&plus; New Gallery</Button>
		</div>

		<div v-if="state.isLoading"><i class="pi pi-spinner pi-spin" /> Loading...</div>

		<div class="gallery-grid">
			<template v-for="gallery in state.galleries" :key="gallery.id" >
				<Card size="small" :style="{ maxWidth: '400px', zoom: .8 }" class="overflow-hidden cursor-pointer" @click="router.push(`/admin/galleries/${gallery.id}`)">
					<template #header><div class="cover-small"><GalleryCover :gallery="gallery" /></div></template>
					<template #title>{{ gallery.name }}</template>
					<template #subtitle>{{ gallery.clientName }}</template>
					

					<template #content>
						<div class="flex align-items-center gap-1">
							<template v-if="gallery.date">
								<i class="pi pi-calendar" />
								{{ dayjs(gallery.date).format('MMM DD, YYYY') }}
							</template>

							<div class="flex-grow-1"></div>
							
							<i class="pi pi-images" />
							<span>{{ gallery.sections.reduce((t, s) => t + s._count.photos, 0) }}</span>
						</div>
					</template>
								
				</Card>
			</template>
		</div>
	</div>
</template>

<style scoped>

.gallery-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 20px;
}

.cover-small {
	/* width: 1000px;
	aspect-ratio: 1.6; */
	zoom: .2;
	height: 900px;
	pointer-events: none;
	user-select: none;
}

</style>