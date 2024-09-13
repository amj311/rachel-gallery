<script setup lang="ts">
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import { reactive, onBeforeMount, watch, computed } from 'vue';
import request from '@/services/request';
import PhotoFrame from '@/components/PhotoFrame.vue';
import { useUploaderStore } from '../../components/uploader/uploader.store';
import Calendar from 'primevue/calendar';
import FocalPointInput from '@/components/FocalPointInput.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import DropdownMenu from '@/components/DropdownMenu.vue';
import GhostInput from '@/components/InlineInput.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import { useToast } from 'primevue/usetoast';
import { useClientStore } from '@/stores/client.store';
import debounce from '@/utils/debounce';
import { useAppStore } from '@/stores/app.store';
import Editor from 'primevue/editor';

const router = useRouter();
const clientStore = useClientStore();
const toast = useToast();

const isMobile = computed(() => useAppStore().isMobile);

const state = reactive({
	isSaving: false,
	lastSaved: null as Date | null,
	skipAutoSave: false,
	opportunityId: router.currentRoute.value.params.opportunityId,
	opportunity: null as any,
});

onBeforeMount(async () => {
	const { data } = await request.get('admin/opportunity/' + state.opportunityId);

	if (!data.data) {
		router.push('/admin/galleries');
		return;
	}

	state.opportunity = data.data;

	if (state.opportunity.date) state.opportunity.date = new Date(state.opportunity.date);
})


const saveDebounceTime = 1000;
const debounceOpportunity = debounce(updateOpportunity, saveDebounceTime, () => state.isSaving = true);

// handle change detection and autosave
const opportunityState = computed(() => JSON.stringify(state.opportunity));
watch(opportunityState, (newState, oldState) => {
	if (!state.skipAutoSave && newState !== 'null' && oldState !== 'null') {
		debounceOpportunity();
	}
})

// maintain last save to abort when nothing changes
let lastSave = 'null';

async function updateOpportunity() {
	if (JSON.stringify(state.opportunity) === lastSave) {
		state.isSaving = false;
		return;
	}
	lastSave = JSON.stringify(state.opportunity);

	await request.put('admin/opportunity/' + state.opportunityId, state.opportunity);
	state.isSaving = false;
	state.lastSaved = new Date();
}

</script>


<template>
	<div v-if="!state.opportunity">Loading...</div>
	<div v-else class="mx-2">
		<div class="flex flex-wrap align-items-center">
			<h2>PhotoShoot with {{ state.opportunity.Client.name }}</h2>
			<div class="flex-grow-1" />
			<!-- <div>{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div> -->
		</div>
		<div>
			<small>{{ state.opportunity.Client.email }}</small>
			<!-- <small v-if="inquiry.phone"> - {{ inquiry.phone }}</small> -->
		</div>
		<div class="flex flex-wrap gap-3 my-2">
			<div v-if="state.opportunity.occasion" class="flex align-items-center gap-1"><i class="pi pi-camera" />{{ state.opportunity.occasion }}</div>
			<div v-if="state.opportunity.date" class="flex align-items-center gap-1"><i class="pi pi-calendar" />{{ dayjs(state.opportunity.date).format('MMM D, YYYY') }}</div>
			<div v-if="state.opportunity.location" class="flex align-items-center gap-1"><i class="pi pi-map-marker" />{{ state.opportunity.location }}</div>
			<div v-if="state.opportunity.peopleQty" class="flex align-items-center gap-1"><i class="pi pi-users" />{{ state.opportunity.peopleQty }}</div>
		</div>
		<div class="my-3">
			<h3>Notes</h3>
			<div>
				<Editor v-model="state.opportunity.notes" editorStyle="min-height: 6rem">
					<template v-slot:toolbar>
						<span class="ql-formats">
							<button class="ql-bold"></button>
							<button class="ql-italic"></button>
							<button class="ql-underline"></button>
						</span>
						<span class="ql-formats">
							<button class="ql-list" value="ordered"></button>
							<button class="ql-list" value="bullet"></button>
						</span>
						<span class="ql-formats">
							<button class="ql-link"></button>
							<button class="ql-image"></button>
						</span>
					</template>
				</Editor>
			</div>
		</div>
		<div class="my-6">
			<!-- <Button class="gap-2 py-3" icon="pi pi-camera" outlined label="Plan a Photoshoot" /> -->
		</div>
	</div>
</template>

<style>
#main {
	background-color: white;
}

.about {
	color: white;
}
</style>