<script setup lang="ts">
import { reactive, onBeforeMount, computed, ref, watch } from 'vue';
import request from '@/services/request';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { usePortfolioStore } from '../../../stores/portfolio.store';
import PortfolioSectionButton from './PortfolioSectionButton.vue';
import EditPhotoWall from './EditPhotoWall.vue';
import debounce from '@/utils/debounce';
import EditCarousel from './EditCarousel.vue';

const toast = useToast();
const portfolioStore = usePortfolioStore();

const sectionTypes = {
	'photo-wall': {
		name: 'Photo Wall',
		icon: 'dashboard_2',
		editor: EditPhotoWall
	},
	'carousel': {
		name: 'Carousel',
		icon: 'overview_key',
		editor: EditCarousel
	}
}

const state = reactive({
	isSaving: false,
	lastSaved: null as Date | null,
	skipAutoSave: false,
});

onBeforeMount(async () => {
	if (!portfolioStore.portfolio) {
		state.skipAutoSave = true;
		await portfolioStore.loadPortfolio();
		state.skipAutoSave = false;
	}
})


const saveDebounceTime = 1000;
const debouncePortfolio = debounce(updatePortfolio, saveDebounceTime, () => state.isSaving = true);

// handle change detection and autosave
const portfolioState = computed(() => JSON.stringify(portfolioStore.portfolio));
watch(portfolioState, (newState, oldState) => {
	if (!state.skipAutoSave && newState !== 'null' && oldState !== 'null') {
		debouncePortfolio();
	}
})

// maintain last save to abort when nothing changes
let lastSave = 'null';

async function updatePortfolio() {
	if (JSON.stringify(portfolioStore.portfolio) === lastSave) {
		state.isSaving = false;
		return;
	}
	lastSave = JSON.stringify(portfolioStore.portfolio);

	await request.put('admin/portfolio', portfolioStore.portfolio);
	state.isSaving = false;
	state.lastSaved = new Date();
}


async function createNewSection(type: string, order?: number) {
	const { data } = await request.post('admin/portfolio/section', { type });
	// todo insert in correct order and update all
	portfolioStore.portfolio!.sections.splice(order || portfolioStore.portfolio!.sections.length, 0, data.data);
	portfolioStore.portfolio!.sections.forEach((section, idx) => {
		section.order = idx;
	})
}

function swapSections(aIdx, bIdx) {
	const temp = portfolioStore.portfolio!.sections[aIdx];
	portfolioStore.portfolio!.sections[aIdx] = portfolioStore.portfolio!.sections[bIdx];
	portfolioStore.portfolio!.sections[bIdx] = temp;
	portfolioStore.portfolio!.sections.forEach((section, idx) => {
		section.order = idx
	});
}

async function deleteSection(section) {
	if (!confirm('Are you sure you want to delete this section?')) {
		return;
	}
	try {
		await request.delete('admin/portfolio/section/' + section.id);
		portfolioStore.portfolio!.sections = portfolioStore.portfolio!.sections.filter(s => s.id !== section.id);
		toast.add({ severity: 'success', summary: 'Success', detail: 'Section deleted', life: 3000 });
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete section.");
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete section. Try again later', life: 3000 });
	}
}

</script>


<template>
	<div v-if="!portfolioStore.portfolio">Loading...</div>
	<div v-else>
		<template v-for="(section, index) in portfolioStore.portfolio!.sections" :key="section.id">
			<div class="section">
				<div class="flex align-items-center py-2">
					<i class="material-symbols-outlined">{{ sectionTypes[section.type].icon }}</i>
					&nbsp;
					<h3>{{ sectionTypes[section.type].name }}</h3>
					<div class="flex-grow-1"></div>
					<Button v-if="index > 0" @click="swapSections(index, index - 1)" icon="pi pi-chevron-up" text />
					<Button v-if="index < portfolioStore.portfolio!.sections.length - 1" @click="swapSections(index, index + 1)"
						icon="pi pi-chevron-down" text />
					<Button icon="pi pi-trash" text @click="deleteSection(section)" />
				</div>

				<component v-if="!section.marked_for_deletion" :is="sectionTypes[section.type].editor" v-model="portfolioStore.portfolio!.sections[index]" />
			</div>

			<div v-if="index < portfolioStore.portfolio!.sections.length - 1" class="hidden-section-button">
				<PortfolioSectionButton @create="(type) => createNewSection(type, index + 1)">
					<span class="text-link"><i class="pi pi-plus" />&nbsp; Add Section</span>
				</PortfolioSectionButton>
			</div>

		</template>

		<div class="flex justify-content-center my-5"><PortfolioSectionButton @create="createNewSection" /></div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.section:not(:first-child) {
	border-top: 1px solid lightgrey;
}

.hidden-section-button {
	opacity: 0;
	margin: 1.5em 0;
	text-align: center;

	&:hover {
		opacity: 1;
	}
}
</style>