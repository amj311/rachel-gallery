<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import { useAppStore } from '@/stores/app.store';
import Inquiry from './Inquiry.vue';
import dayjs from 'dayjs';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const inquiriesStore = useInquiriesStore();
const router = useRouter();

const state = reactive({
	currentInquiry: null as any,
});


function htmlPlain(html) {
	return html.replace(/(<[/\w]+>)/gi, ' ').trim();
}

function setCurrentInquiry(inquiry) {
	state.currentInquiry = inquiry;
	router.push({ query: { inquiry: inquiry.id } });
}

function closeCurrentInquiry() {
	state.currentInquiry = null;
	router.push({ query: {} });

}

const showCurrent = computed(() => router.currentRoute.value.query.inquiry && state.currentInquiry);


const isMobile = computed(() => useAppStore().isMobile);
const showList = computed(() => !isMobile.value || !showCurrent.value);
const showAsList = computed(() => isMobile.value || showCurrent.value);
const asSidebar = computed(() => !isMobile.value && showCurrent.value);

const rows = Math.floor((window.innerHeight - 125) / (isMobile.value ? 61 : 48));

function markAsUnread(inquiry) {
	inquiry.readAt = null;
	inquiriesStore.updateInquiry(inquiry);
	closeCurrentInquiry();
}

function deleteInquiry(inquiry) {
	if (!confirm('Are you sure you want to delete this inquiry?')) return;
	inquiriesStore.deleteInquiry(inquiry.id);
	closeCurrentInquiry();
}

</script>


<template>
	<div class="flex gap-3" style="max-height: calc(100vh - 5rem)">
		<div v-show="showList" class="flex-grow-1" :class="{ sidebar: asSidebar }" style="max-width: 100%; max-height: 100%;">
			<DataView :value="inquiriesStore.inquiries" paginator :rows="rows" data-key="id" style="height: 100%;">
				<template #list="{ items }">
					<div v-for="inquiry of items" :key="inquiry.id" class="inquiry-row white-space-nowrap" :class="{ unread: Boolean(!inquiry.readAt) }" @click="setCurrentInquiry(inquiry)">
						<div v-if="showAsList">
							<div class="flex">
								<div class="name" style="width: max(20%, 100px)">{{ inquiry.name }}</div>
								<div class="flex-grow-1" />
								<div class="date">{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
							</div>
							<div class="message flex-grow-1 opacity-80 overflow-hidden text-overflow-ellipsis">{{ htmlPlain(inquiry.message) }}</div>
						</div>
						<div v-else class="flex gap-3">
							<div class="name" style="max-width: 100px; width: 100px;">{{ inquiry.name }}</div>
							<div class="message flex-grow-1 opacity-80 overflow-hidden text-overflow-ellipsis">{{ htmlPlain(inquiry.message) }}</div>
							<div class="date">{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
						</div>
					</div>
				</template>
			</DataView>
		</div>
		<div v-if="asSidebar" class="divider" />
		<div v-if="showCurrent" class="current-inquiry flex-grow-1">
			<div class="flex">
				<Button icon="pi pi-arrow-left" text size="small" @click="closeCurrentInquiry" />
				<div class="flex-grow-1" />
				<Button icon="pi pi-envelope" text size="small" v-tooltip.bottom="'Mark as unread'" @click="markAsUnread(state.currentInquiry)" />
				<Button icon="pi pi-trash" text size="small"  v-tooltip.left="'Delete'" @click="deleteInquiry(state.currentInquiry)" />
			</div>
			<Inquiry :inquiry="state.currentInquiry" :key="state.currentInquiry.id" />
		</div>
	</div>
	
</template>


<style scoped lang="scss">
:deep(.p-dataview-content) {
	max-height: calc(100vh - 9rem);
	overflow: hidden;
	overflow-y: auto;
}

.sidebar {
	max-width: 20rem !important;
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