<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import { useAppStore } from '@/stores/app.store';
import Inquiry from './Inquiry.vue';
import dayjs from 'dayjs';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';

const inquiriesStore = useInquiriesStore();

const state = reactive({
	currentInquiry: null as any,
});


function htmlPlain(html) {
	return html.replace(/(<[/\w]+>)/gi, ' ').trim();
}

function setCurrentInquiry(inquiry) {
	state.currentInquiry = inquiry;
}

function closeCurrentInquiry() {
	state.currentInquiry = null;
}

const showList = computed(() => !useAppStore().isMobile || !state.currentInquiry);
const showAsList = computed(() => useAppStore().isMobile || state.currentInquiry);
const asSidebar = computed(() => !useAppStore().isMobile && state.currentInquiry);

</script>


<template>
	<div class="flex gap-3">
		<div v-show="showList" class="flex-grow-1" :class="{ sidebar: asSidebar }">
			<DataView :value="inquiriesStore.inquiries" paginator :rows="5" data-key="id">
				<template #list="{ items }">
					<div v-for="inquiry of items" :key="inquiry.id" class="inquiry-row white-space-nowrap" :class="{ unread: Boolean(!inquiry.read_at) }" @click="setCurrentInquiry(inquiry)">
						<div v-if="showAsList">
							<div class="flex">
								<div class="name" style="width: max(20%, 100px)">{{ inquiry.name }}</div>
								<div class="flex-grow-1" />
								<div class="date">{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
							</div>
							<div class="message flex-grow-1 opacity-80 overflow-hidden text-overflow-ellipsis">{{ htmlPlain(inquiry.message) }}</div>
						</div>
						<div v-else class="flex">
							<div class="name" style="width: max(20%, 100px)">{{ inquiry.name }}</div>
							<div class="message flex-grow-1 opacity-80 overflow-hidden text-overflow-ellipsis">{{ htmlPlain(inquiry.message) }}</div>
							<div class="date">{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
						</div>
					</div>
				</template>
			</DataView>
		</div>
		<div v-if="asSidebar" class="divider" />
		<div v-if="state.currentInquiry" class="current-inquiry flex-grow-1">
			<div class="flex">
				<Button icon="pi pi-arrow-left" text size="small" @click="closeCurrentInquiry" />
			</div>
			<Inquiry :inquiry="state.currentInquiry" />
		</div>
	</div>
	
</template>


<style scoped lang="scss">

.sidebar {
	max-width: 20rem;
}

.inquiry-row {
	font-size: .8rem;
	background: #f8f8fa;
	padding: .8rem .8rem;
	border-bottom: 1px solid #eee;
	cursor: pointer;

	&:first-child {
		border-top: 1px solid #eee;
	}

	&.unread {
		background: #fff;

		& * {
			font-weight: 600;
		}
	}

	&:hover {
		background: #faf9f7;
	}
}

.divider {
	border-left: 1px solid #eee;
}
</style>