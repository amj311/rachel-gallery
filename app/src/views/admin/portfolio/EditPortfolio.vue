<script setup lang="ts">
import { reactive, computed, watch, onMounted } from 'vue';
import request from '@/services/request';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { usePortfolioStore } from '../../../stores/portfolio.store';
import PortfolioSectionButton from './PortfolioSectionButton.vue';
import EditPhotoWall from '../../../components/portfolio/EditPhotoWall.vue';
import debounce from '@/utils/debounce';
import EditCarousel from '../../../components/portfolio/EditCarousel.vue';
import EditText from '../../../components/portfolio/EditTextGrid.vue';
import PortfolioText from '@/components/portfolio/PortfolioTextGrid.vue';
import PortfolioPhotoWall from '@/components/portfolio/PortfolioPhotoWall.vue';
import PortfolioCarousel from '@/components/portfolio/PortfolioCarousel.vue';
import InputText from 'primevue/inputtext';
import HomeNav from '@/views/HomeNav.vue';
import SelectButton from 'primevue/selectbutton';
import { useAppStore } from '@/stores/app.store';
import * as Drag from 'vuedraggable';


const sectionTypes = {
	'text': {
		name: 'Text',
		icon: 'notes',
		editor: EditText,
		component: PortfolioText,
	},
	'photo-wall': {
		name: 'Photo Wall',
		icon: 'dashboard_2',
		editor: EditPhotoWall,
		component: PortfolioPhotoWall,
	},
	'carousel': {
		name: 'Carousel',
		icon: 'overview_key',
		editor: EditCarousel,
		component: PortfolioCarousel,
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

onMounted(async () => {
	if (!portfolioStore.portfolio) {
		state.skipAutoSave = true;
		await portfolioStore.loadPortfolio();
		state.skipAutoSave = false;
	}
	useAppStore().triggerWindowResize()
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
	const idx = order ?? portfolioStore.portfolio!.sections.length;
	portfolioStore.portfolio!.sections.splice(idx, 0, data.data);
	portfolioStore.portfolio!.sections.forEach((section, idx) => {
		section.order = idx;
	})
	state.selectedSection = portfolioStore.portfolio!.sections[idx];
}

function onSectionDrop() {
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

const previewSize = computed(() => state.previewSize);
watch(previewSize, () => {
	setTimeout(() => useAppStore().triggerWindowResize(), 1);
});

</script>


<template>
	<div class="panes-wrapper">
		<div class="preview-pane">
			<div v-if="!portfolioStore.portfolio">Loading...</div>
			<div v-else class="preview-container" :class="state.previewSize">
				<div class="preview-wrapper">
					<div class="nav-section"><HomeNav ref="homeNav" /></div>
					<Drag v-model="portfolioStore.portfolio.sections" :animation="200" :group="'portfolio-sections'" itemKey="id" tag="div" class="photo-grid" handle=".handle" :scroll-sensitivity="100" :force-fallback="true" @end="onSectionDrop">
						<template #item="{ element: section, index }">
							<div>
								<div class="hidden-section-button">
									<div class="hidden-area">
										<PortfolioSectionButton @create="(type) => createNewSection(type, index)">
											<span class="text-link"><i class="pi pi-plus" />&nbsp; Add Section</span>
										</PortfolioSectionButton>
									</div>
								</div>

								<div class="section-preview-wrapper" :class="{ 'selected': state.selectedSection === section }">
									<div class="section" @click="state.selectedSection = section" :id="`section-${section.id}`">
										<component :key="section.id" :is="sectionTypes[section.type].component" v-model="portfolioStore.portfolio!.sections[index]" :editMode="true" />
									</div>

									<div class="section-toolbar-wrapper">
										<div class="section-toolbar">
											<Button text icon="pi pi-sort" class="handle cursor-move" />
											<div class="anchor-button" :class="{ 'has-link': section.anchorText }">
												<Button icon="pi pi-link" text size=small />
												<div class="anchor-input">
													<InputText v-model="section.anchorText" placeholder="Anchor text" size="small" />
												</div>
											</div>
											<Button icon="pi pi-trash" text size="small" @click="deleteSection(section)" />
										</div>
									</div>
								</div>
							</div>
						</template>
					</Drag>

					<div class="flex justify-content-center py-6"><PortfolioSectionButton @create="createNewSection" /></div>
				</div>
			</div>
		</div>

		<div class="settings-pane">
			<div class="sticky">
				<div class="preview-toolbar w-full flex align-items-center gap-3 mb-3">
					<SelectButton v-model="state.previewSize" optionValue="value" :options="[{icon: 'pi pi-desktop', value: 'desktop'}, {icon: 'pi pi-mobile', value: 'mobile'}]" style="zoom: .9">
						<template #option="slotProps">
							<i :class="slotProps.option.icon"></i>
						</template>
					</SelectButton>
					<div v-if="state.isSaving" class="flex align-items-center gap-2 text-gray-500">
						<i class="pi pi-spin pi-spinner"></i>
						Saving...
					</div>
					<div v-else-if="state.lastSaved" class="text-gray-500">All changes saved</div>
				</div>
				<div v-if="!state.selectedSection" class="text-center py-4">Click on a section to start editing</div>
				<div v-else>
					<div class="flex align-items-center gap-2 mb-3">
						<i class="material-symbols-outlined">{{ sectionTypes[state.selectedSection.type].icon }}</i>
						<h3>{{ sectionTypes[state.selectedSection.type].name }}</h3>
					</div>
					<div class="editor-wrapper">
						<component :key="state.selectedSection.id" :is="sectionTypes[state.selectedSection.type].editor" v-model="state.selectedSection" />
					</div>
				</div>

			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

.panes-wrapper {
	display: flex;
	gap: 2em;

	.preview-pane {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;

		.preview-container {
			padding: 2px;
			padding-right: 6px;
			padding-left: 3rem; // room for floating buttons
			width: 100%;

			.preview-wrapper {
				outline: 1px solid #dde;
			}
		}
	}

	.settings-pane {
		min-width: 370px;
		max-width: 370px;

		.sticky {
			position: sticky;
			top: 1rem;
		}

		.editor-wrapper {
			max-height: calc(100vh - 10rem);
			padding-right: .5em;
			overflow-y: auto;
		}
	}
}


.preview-container.mobile {
	max-width: 450px;

	.section, .nav-section {
		zoom: .85; // approximate the rem shift for mobile screens
	}
}


.hidden-section-button {
	padding: 1em 0;
    margin: -1em 0;
    z-index: 2;
    position: relative;
	overflow: hidden;

	.hidden-area {
		height: 5em;
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

.nav-section {
	position: relative;
	z-index: 3;
	margin-bottom: 3px;
}

.section-preview-wrapper {
    position: relative;

	&:hover, &.selected {
		.section {
			outline: 3px solid rgb(155, 205, 233);
		}
	}

	&:hover {
		z-index: 4;
		
		.section-toolbar, .anchor-button {
			opacity: 1;
		}
	}

	&.selected {
		z-index: 3;
	}
	
	.section-toolbar-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 5;
		transform: translateX(calc(-100%));
		padding-right: 5px;
	}

	.anchor-button {
		position: relative;
		opacity: 0;
		z-index: 1;

		&.has-link {
			opacity: 1;

			:deep(.p-button-icon) {
				color: $primary;
			}
		}

		.anchor-input {
			position: absolute;
			top: 0;
			right: 0;
			translate: 100% 0;
			display: none;
		}

		&:hover .anchor-input {
			display: block;
		}
	}

	.section-toolbar {
		display: flex;
		flex-direction: column;
		background: #fff;
		box-shadow: 0 0 .3em #0003;
		position: sticky;
		top: 1em;
		opacity: 0;
		z-index: 2;
	}
}
</style>