<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
import { computed, onBeforeMount, reactive } from 'vue';
import request from '@/services/request';
import GalleryCover from '@/components/GalleryCover.vue';
import Card from 'primevue/card';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import { visibilityOptions } from '@/utils/visibilityOptions';
import DropdownMenu from '@/components/DropdownMenu.vue';

const router = useRouter();

const state = reactive({
	isLoading: true,
	galleries: [] as any[],
	sortBy: 'Date',
	sortOrder: 'desc',
	clientId: 'all' as any,
	showArchived: false,
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

const sortOptions = [
	{ label: 'Date', command() { state.sortBy = 'Date'; } },
	{ label: 'Name', command() { state.sortBy = 'Name'; } },
];

function toggleSortOrder() {
	if (state.sortOrder === 'desc') {
		state.sortOrder = 'asc';
	} else {
		state.sortOrder = 'desc';
	}
}

const clientOptions = computed(() => ([
	{ label: 'All Clients', value: 'all', command() { state.clientId = 'all'; } },
	...(new Map(state.galleries.map(g => [g.clientId, { label: g.Client?.name || 'No Client', value: g.clientId, command() { state.clientId = g.clientId; } }]))).values(),
]));
const clientLabel = computed(() => clientOptions.value.find(o => o.value === state.clientId)?.label || 'All Clients');

const sorters = {
	'Name': (a: any, b: any) => a.name.localeCompare(b.name),
	'Date': (a: any, b: any) => dayjs(a.date).diff(dayjs(b.date), 'day'),
}

const sortedGalleries = computed(() => {
	const sorted = [...state.galleries];
	sorted.sort(sorters[state.sortBy]);
	if (state.sortOrder === 'desc') {
		sorted.reverse();
	}
	const filtered = sorted.filter(g => (g.visibility === 'archived') === state.showArchived);
	return state.clientId === 'all' ? filtered : filtered.filter(g => g.clientId === state.clientId);
})

const numArchived = computed(() => state.galleries.filter(g => g.visibility === 'archived').length);
</script>


<template>
	<div>
		<div class="flex align-items-top flex-wrap gap-3 mt-2 mb-4">
			<h1>Your Galleries</h1>
			<div class="flex-grow-1"></div>
			<div class="flex flex-wrap-reverse justify-content-end flex-grow-1 align-items-center gap-2">
				<div style="zoom: .9">
					<Button v-if="numArchived" :text="!state.showArchived" :outlined="state.showArchived" @click="state.showArchived = !state.showArchived" :severity="state.showArchived ? 'danger' : 'secondary'">
						{{ numArchived }} Archived<template v-if="state.showArchived">&nbsp;&nbsp;<i class="pi pi-times" /></template>
					</Button>
					<DropdownMenu :model="clientOptions">
						<Button text class="gap-2" icon="pi pi-user" :label="clientLabel" />
					</DropdownMenu>
					<Button text class="gap-2">
						<i @click="toggleSortOrder" :class="`pi pi-sort-amount-${ state.sortOrder === 'desc' ? 'up' : 'down'}`" />
						<DropdownMenu :model="sortOptions">
							<div>{{ state.sortBy }}</div>
						</DropdownMenu>
					</Button>
				</div>
				<Button @click="createNewGallery" severity="primary">&plus; New Gallery</Button>
			</div>
		</div>

		<div v-if="state.isLoading"><i class="pi pi-spinner pi-spin" /> Loading...</div>

		<div class="gallery-grid">
			<template v-for="gallery in sortedGalleries" :key="gallery.id" >
				<div>
					<Card size="small" :style="{ width: '100%', zoom: .8 }" class="overflow-hidden cursor-pointer" @click="router.push(`/admin/galleries/${gallery.id}`)">
						<template #header><div class="cover-small"><GalleryCover :gallery="gallery" :preview="true" forceMode="desktop" /></div></template>
						<template #content>
							<div class="flex align-items-center gap-3">
								<div class="flex align-items-center gap-2">
									<i class="pi pi-user" />
									<span>{{ gallery.Client?.name || 'No Client' }}</span>
								</div>

								<div class="flex-grow-1"></div>

								<div class="flex align-items-center gap-2" :style="{ color: visibilityOptions[gallery.visibility].color }">
									<i :class="visibilityOptions[gallery.visibility].icon" />
									{{ visibilityOptions[gallery.visibility].label }}
								</div>
							</div>

							<div class="flex align-items-center gap-3 text-sm">
								<div class="flex align-items-center gap-2">
									<i class="pi pi-images" />
									<span>{{ gallery.sections.reduce((t, s) => t + s._count.photos, 0) }}</span>
								</div>
								
								<div class="flex-grow-1"></div>

								<div v-if="gallery.date" class="flex align-items-center gap-2">
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