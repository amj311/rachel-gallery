<script setup lang="ts">
import { defineComponent, reactive, onBeforeMount, computed, ref, watch } from 'vue';
import request from '@/services/request';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { usePortfolioStore } from '../../../stores/portfolio.store';
import PortfolioSectionButton from './PortfolioSectionButton.vue';
import EditPhotoWall from '../../../components/portfolio/EditPhotoWall.vue';
import debounce from '@/utils/debounce';
import EditCarousel from '../../../components/portfolio/EditCarousel.vue';
import EditText from '../../../components/portfolio/EditText.vue';
import PortfolioText from '@/components/portfolio/PortfolioText.vue';
import PortfolioPhotoWall from '@/components/portfolio/PortfolioPhotoWall.vue';
import PortfolioCarousel from '@/components/portfolio/PortfolioCarousel.vue';
import SelectButton from 'primevue/selectbutton';


const sectionTypes = {
	'text': {
		name: 'Text',
		icon: 'notes',
		editor: EditText,
		preview: PortfolioText,
	},
	'photo-wall': {
		name: 'Photo Wall',
		icon: 'dashboard_2',
		editor: EditPhotoWall,
		preview: PortfolioPhotoWall,
	},
	'carousel': {
		name: 'Carousel',
		icon: 'overview_key',
		editor: EditCarousel,
		preview: PortfolioCarousel,
	}
}

const toast = useToast();
const portfolioStore = usePortfolioStore();


const state = reactive({
	isSaving: false,
	lastSaved: null as Date | null,
	skipAutoSave: false,
	selectedSection: null as any,
	previewSize: 'desktop',
});

// const unsavedChanges = computed(() => state.lastSaveState !== JSON.stringify(portfolioStore.portfolio));

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
	const idx = order || portfolioStore.portfolio!.sections.length;
	portfolioStore.portfolio!.sections.splice(idx, 0, data.data);
	portfolioStore.portfolio!.sections.forEach((section, idx) => {
		section.order = idx;
	})
	state.selectedSection = portfolioStore.portfolio!.sections[idx];
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
		if (state.selectedSection && state.selectedSection.id === section.id) {
			state.selectedSection = null;
		}
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete section.");
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete section. Try again later', life: 3000 });
	}
}


// const NewSectionButton = defineComponent({
// 	name: 'NewSectionButton',
// 	components: {
// 		PortfolioSectionButton,
// 	},
// 	template: /*html*/ `
// 		<div class="hidden-section-button"><PortfolioSectionButton @create="(type) => createNewSection(type)" /></div>
// 	`,
// });


</script>


<template>
	<div class="panes-wrapper">

		<div class="preview-pane">
			<!-- <div class="preview-toolbar">
				<SelectButton v-model="state.previewSize" optionValue="value" :options="[{icon: 'pi pi-mobile', value: 'mobile'}, {icon: 'pi pi-desktop', value: 'desktop'}]" style="zoom: .9">
					<template #option="slotProps">
						<i :class="slotProps.option.icon"></i>
					</template>
				</SelectButton>
			</div> -->

			<div class="preview-container">
				<div class="preview-wrapper" :class="state.previewSize">
					<div v-if="!portfolioStore.portfolio">Loading...</div>
					<div v-else>
						<template v-for="(section, index) in portfolioStore.portfolio!.sections" :key="section.id">
							<div class="hidden-section-button">
								<div class="hidden-area">
									<PortfolioSectionButton @create="(type) => createNewSection(type, index)">
										<span class="text-link"><i class="pi pi-plus" />&nbsp; Add Section</span>
									</PortfolioSectionButton>
								</div>
							</div>

							<div class="section-preview-wrapper" :class="{ 'selected': state.selectedSection === section }">
								<div class="section" @click="state.selectedSection = section">
									<component :key="section.id" :is="sectionTypes[section.type].preview" v-model="portfolioStore.portfolio!.sections[index]" :editMode="true" />
								</div>

								<div class="section-toolbar-wrapper">
									<div class="section-toolbar">
										<Button v-if="index > 0" @click="swapSections(index, index - 1)" icon="pi pi-chevron-up" text size="small" />
										<Button v-if="index < portfolioStore.portfolio!.sections.length - 1" @click="swapSections(index, index + 1)"
											icon="pi pi-chevron-down" text size="small" />
										<Button icon="pi pi-trash" text size="small" @click="deleteSection(section)" />
									</div>
								</div>
							</div>
						</template>

						<div class="flex justify-content-center my-8"><PortfolioSectionButton @create="createNewSection" /></div>
					</div>
				</div>
			</div>
		</div>

		<div class="settings-pane">
			<div v-if="!state.selectedSection" class="text-center py-4">Click on a section to start editing</div>
			<div v-else>
				<div class="flex align-items-center gap-2 mb-3">
					<i class="material-symbols-outlined">{{ sectionTypes[state.selectedSection.type].icon }}</i>
					<h3>{{ sectionTypes[state.selectedSection.type].name }}</h3>
				</div>
				<component :key="state.selectedSection.id" :is="sectionTypes[state.selectedSection.type].editor" v-model="state.selectedSection" />
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.panes-wrapper {
	height: calc(100vh - 3em);
	overflow: hidden;
	display: flex;

	.preview-pane {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;

		.preview-container {
			padding: 2px;
			padding-right: 6px;
			overflow: auto;
			width: 100%;
		}
	}

	.settings-pane {
		min-width: 370px;
		max-width: 400px;
		padding: 0 1em;
	}
}


.hidden-section-button {
	padding: 1em 0;
    margin: -1em 0;
    z-index: 2;
    position: relative;
	overflow: hidden;

	.hidden-area {
		height: 4em;
		max-height: 0px;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: 2s linear;
		box-shadow: inset 0 -0.5em 0.5em -0.6em #0005, inset 0 0.5em 0.5em -0.6em #0005;
	}

	&:hover {
		.hidden-area {
			max-height: 100vh;
			transition-delay: 10ms;
			transition: 4s linear;
		}
	}
}


.section-preview-wrapper {
    position: relative;

	&:hover, &.selected {
		.section {
			outline: 2px solid grey;
		}
	}

	&:hover {
		z-index: 4;
		
		.section-toolbar-wrapper {
			display: block;
		}
	}

	&.selected {
		z-index: 3;
	}
	
	.section-toolbar-wrapper {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		display: none;
	}

	.section-toolbar {
		display: flex;
		flex-direction: column;
		background: #fff;
		box-shadow: 0 0 .3em #0003;
		position: sticky;
		top: 1em;
	}

}
</style>