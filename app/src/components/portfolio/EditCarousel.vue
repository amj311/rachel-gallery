<script setup lang="ts">
import { defineModel, onBeforeMount, ref } from 'vue';
import PortfolioPhotoSelector from './PortfolioPhotoSelector.vue';
import Button from 'primevue/button';
import EditBackground from './EditBackground.vue';
import * as Drag from 'vuedraggable';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import request from '@/services/request';
import ToggleButton from 'primevue/togglebutton';
import Dropdown from 'primevue/dropdown';

const toast = useToast();

const section = defineModel<any>();

function onImageChange(image, pane) {
	pane.backgroundPhotoId = image?.id;
}

onBeforeMount(() => {
	const defaultAttributes = {
		panes: [],
		showControls: true,
		speed: 'Slow',
		animation: 'Fade',
	};

	for (const attr in defaultAttributes) {
		if (section.value.attributes[attr] === undefined) {
			section.value.attributes[attr] = defaultAttributes[attr];
		}
	}
})

function onPaneDrop() {
	section.value.attributes.panes.forEach((p, i) => p.order = i);
}

function addPane() {
	section.value.attributes.panes.push({
		id: Math.random().toString(36).substring(7),
		text: null,
		backgroundPhotoId: null
	});
}

async function deletePane(pane) {
	if (!confirm('Are you sure you want to delete this pane?')) return;
	try {
		if (pane.backgroundPhotoId) {
			await request.delete('admin/photo/' + pane.backgroundPhotoId);
			section.value.photos = section.value.photos.filter(p => p.id !== pane.backgroundPhotoId);
		}
		section.value.attributes.panes = section.value.attributes.panes.filter(p => p.id !== pane.id);
	}
	catch (error) {
		console.error(error);
		console.log("Failed to delete photo.");
		toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete photo. Try again later', life: 3000 });
	}
}
</script>


<template>
	<div class="settings-grid">
		<label>Controls</label>
		<div><ToggleButton v-model="section.attributes.showControls" onLabel="On" offLabel="Off" style="zoom: .9" /></div>

		<label>Speed</label>
		<div><Dropdown v-model="section.attributes.speed" :options="['Slow', 'Fast']" style="zoom: .9" /></div>

		<label>Animation</label>
		<div><Dropdown v-model="section.attributes.animation" :options="['Fade', 'Slide', 'None']" style="zoom: .9" /></div>
	</div>
	

	<div class="my-3 text-gray-500">Panes</div>
	<Drag v-model="section.attributes.panes" :animation="200" :group="'carousel_' + section.id" itemKey="id" tag="div" class="photo-grid" handle=".handle" @end="onPaneDrop">
		<template #item="{ element: pane, index }">
			<div class="pane-wrapper flex gap-2 pb-4 mb-4">
				<div class="w-3rem pt-2">
					<Button text class="cursor-move handle h-2rem" icon="pi pi-sort" size="small" />
					<Button text icon="pi pi-trash" size="small" @click="() => deletePane(pane)" />
				</div>
				<div>
					<div class="settings-grid">
						<label>Text</label>
						<div><Textarea v-model="pane.text" size="small" autoResize rows="1" /></div>
						<EditBackground
							v-model="section.attributes.panes[index]"
							:section="section"
							:backgroundImage="section.photos.find(p => p.id === pane.backgroundPhotoId)"
							@imageChange="(image) => onImageChange(image, pane)"
						/>
					</div>
				</div>
			</div>
		</template>
	</Drag>

	<Button text @click="addPane">&plus;&nbsp;Add Pane</Button>
	
	<PortfolioPhotoSelector ref="photoSelector" />
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.pane-wrapper {
	&:not(:last-child) {
		border-bottom: 1px solid #eed;
	}
}

.settings-grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .5em 1em;
	align-items: center;
}

</style>