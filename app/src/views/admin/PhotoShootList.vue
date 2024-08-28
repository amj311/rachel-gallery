<script setup lang="ts">
import { reactive, computed, onBeforeMount } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import { useAppStore } from '@/stores/app.store';
import request from '@/services/request';
import Inquiry from './Inquiry.vue';
import dayjs from 'dayjs';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const inquiriesStore = useInquiriesStore();
const router = useRouter();

const state = reactive({
	isLoading: true,
	opportunities: null as any,
});


onBeforeMount(async () => {
	state.isLoading = true;
	const { data } = await request.get('admin/opportunities');
	state.opportunities = data.data;
	state.isLoading = false;
})

async function createNewOpportunity(clientId) {
	const { data } = await request.post('admin/opportunity');
	router.push(`/admin/galleries/${data.data.id}`);
}

function htmlPlain(html) {
	return html.replace(/(<[/\w]+>)/gi, ' ').trim();
}

const isMobile = computed(() => useAppStore().isMobile);

</script>


<template>
	<DataTable :loading="state.isLoading" :value="state.opportunities" @row-click="e => router.push(`/admin/shoots/${e.data.id}`)" :rowHover="true" responsiveLayout="scroll" :rowClass="() => 'cursor-pointer'">
		<Column field="Client" header="Client">
			<template #body="{data}">
				{{ data.Client.name }}
			</template>
		</Column>
		<Column field="occasion" header="Occasion" />
		<Column field="date" header="Date" />
	</DataTable>
</template>


<style scoped lang="scss">
</style>