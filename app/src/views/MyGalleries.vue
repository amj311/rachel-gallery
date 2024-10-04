<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onBeforeMount, reactive } from 'vue';
import request from '@/services/request';
import GalleryCover from '@/components/GalleryCover.vue';
import Card from 'primevue/card';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/user.store';
import { watch } from 'vue';
import InternalWrapper from './InternalWrapper.vue';

const router = useRouter();
const userStore = useUserStore();

const state = reactive({
	isLoading: true,
	galleries: [] as any[],
	sortBy: 'Date',
	sortOrder: 'desc',
	clientId: 'all' as any,
	showArchived: false,
});

watch(userStore.currentUser, () => {
	console.log("user changed")
	loadGalleries();
})

onBeforeMount(async () => {
	loadGalleries();
})

async function loadGalleries() {
	state.isLoading = true;
	state.galleries = [];

	if (userStore.currentUser) {
		const { data } = await request.get('/gallery/user/' + userStore.currentUser.id);
		state.galleries = data.data;
	}
	state.isLoading = false;
}

</script>


<template>
	<InternalWrapper>
		<div class="flex align-items-top flex-wrap gap-3 mt-2 mb-4">
			<h1>Your Galleries</h1>
		</div>

		<div v-if="state.isLoading"><i class="pi pi-spinner pi-spin" /> Loading...</div>

		<div class="gallery-grid">
			<template v-for="gallery in state.galleries" :key="gallery.id" >
				<div>
					<Card size="small" :style="{ width: '100%', zoom: .8 }" class="overflow-hidden cursor-pointer" @click="router.push(`/${gallery.slug || gallery.id}`)">
						<template #header><div class="cover-small"><GalleryCover :gallery="gallery" :preview="true" forceMode="desktop" /></div></template>
						<template #content>
							<div class="flex align-items-center gap-3">
								<div class="flex align-items-center gap-2">
									<i class="pi pi-calendar" />
									{{ dayjs(gallery.date).format('MMM DD, \'YY') }}
								</div>
								<div class="flex-grow-1"></div>
								<div v-if="gallery.date" class="flex align-items-center gap-2">
									<i class="pi pi-images" />
									<span>{{ gallery.sections.reduce((t, s) => t + s._count.photos, 0) }}</span>
								</div>
							</div>
						</template>
					</Card>
				</div>
			</template>
		</div>
	</InternalWrapper>
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