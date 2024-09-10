<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
import { onBeforeMount, reactive } from 'vue';
import request from '@/services/request';
import GalleryCover from '@/components/GalleryCover.vue';
import Card from 'primevue/card';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import { visibilityOptions } from '@/utils/visibilityOptions';

const router = useRouter();

const state = reactive({
	isLoading: true,
	galleries: [] as any[],
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
			<Button @click="createNewGallery" severity="primary">&plus; New Gallery</Button>
		</div>

		<div v-if="state.isLoading"><i class="pi pi-spinner pi-spin" /> Loading...</div>

		<div class="gallery-grid">
			<template v-for="gallery in state.galleries" :key="gallery.id" >
				<div>
					<Card size="small" :style="{ width: '100%', zoom: .8 }" class="overflow-hidden cursor-pointer" @click="router.push(`/admin/galleries/${gallery.id}`)">
						<template #header><div class="cover-small"><GalleryCover :gallery="gallery" :preview="true" forceMode="desktop" /></div></template>
						<template #content>
							<div class="flex align-items-center gap-3">
								<div class="flex align-items-center gap-1">
									<i class="pi pi-user" />
									<span>{{ gallery.Client?.name }}</span>
								</div>

								<div class="flex-grow-1"></div>

								<div class="flex align-items-center gap-1" :style="{ color: visibilityOptions[gallery.visibility].color }">
									<i :class="visibilityOptions[gallery.visibility].icon" />
									{{ visibilityOptions[gallery.visibility].label }}
								</div>
							</div>

							<div class="flex align-items-center gap-3 text-sm">
								<div class="flex align-items-center gap-1">
									<i class="pi pi-images" />
									<span>{{ gallery.sections.reduce((t, s) => t + s._count.photos, 0) }}</span>
								</div>
								
								<div class="flex-grow-1"></div>

								<div v-if="gallery.date" class="flex align-items-center gap-1">
									<i class="pi pi-calendar" />
									{{ dayjs(gallery.date).format('MMM DD, \'YY') }}
								</div>
							</div>
						</template>
					</Card>
				</div>
			</template>
		</div>
	</div>
</template>

<style scoped>

.gallery-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
	gap: 20px;
	justify-content: center;
}

.cover-small {
	font-size: 2em;
	zoom: .22;
	width: 100%;
	aspect-ratio: 1.8;
	pointer-events: none;
	user-select: none;
}

</style>