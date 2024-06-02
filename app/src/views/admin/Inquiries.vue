<script setup lang="ts">
import { reactive, computed, h } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import { useAppStore } from '@/stores/app.store';
import Inquiry from './Inquiry.vue';
import dayjs from 'dayjs';
import DataView from 'primevue/dataview';
// import Button from 'primevue/button';

import { useRouter } from 'vue-router';
import {
	MailOutlined,
	DeleteOutlined,
	EnvironmentOutlined,
	UserOutlined,
	ArrowLeftOutlined,
} from '@/components/icons';
import { Button } from 'ant-design-vue';

const inquiriesStore = useInquiriesStore();
const router = useRouter();

const state = reactive({
	currentInquiry: null as any,
});


function htmlPlain(html) {
	return html.replace(/(<[/\w]+>)/gi, ' ').trim();
}

function setCurrentInquiry(inquiry) {
	// if drawer is already open change query w/o adding history
	if (!router.currentRoute.value.query.inquiry) {
		router.push({ query: { inquiry: inquiry.id } });
		state.currentInquiry = inquiry;
	}
	else {
		history.replaceState(null, '', '?inquiry=' + inquiry.id);
		state.currentInquiry = inquiry;
	}
}

function closeCurrentInquiry() {
	state.currentInquiry = null;
	router.back();
}

const showCurrent = computed(() => router.currentRoute.value.query.inquiry && state.currentInquiry);


const isMobile = computed(() => useAppStore().isMobile);
const showList = computed(() => !isMobile.value || !showCurrent.value);
const showAsList = computed(() => isMobile.value || showCurrent.value);
const asSidebar = computed(() => !isMobile.value && showCurrent.value);

const rows = computed(() => Math.floor((window.innerHeight - 125) / (showAsList.value ? 61 : 48)));

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
	<div class="flex gap-3 mt-3" style="max-height: calc(100vh - 5rem)">
		<div v-show="showList" class="flex-grow-1" :class="{ sidebar: asSidebar }" style="max-width: 100%; max-height: 100%;">
			<DataView :value="inquiriesStore.inquiries" paginator :rows="rows" data-key="id" style="height: 100%;">
				<template #list="{ items }">
					<div v-for="inquiry of items" :key="inquiry.id" class="inquiry-row white-space-nowrap" :class="{ unread: Boolean(!inquiry.readAt) }" @click="setCurrentInquiry(inquiry)">
						<div v-if="showAsList">
							<div class="flex gap-2">
								<div class="name overflow-hidden text-overflow-ellipsis">{{ inquiry.name }}</div>
								<div class="flex-grow-1" />
								<div class="date">{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
							</div>
							<div class="message flex-grow-1 opacity-80 overflow-hidden text-overflow-ellipsis"><template v-if="inquiry.occasion">{{ inquiry.occasion }} - </template>{{ htmlPlain(inquiry.message) }}</div>
						</div>
						<div v-else class="flex gap-2">
							<div class="name"><div style="width: 150px" class="overflow-hidden text-overflow-ellipsis">{{ inquiry.name }}</div></div>
							<div v-if="inquiry.occasion">{{ inquiry.occasion }}</div>
							<div class="message flex-grow-1 opacity-70 overflow-hidden text-overflow-ellipsis">{{ htmlPlain(inquiry.message) }}</div>
							<div class="hidden lg:flex gap-2">
								<div v-if="inquiry.location" class="flex align-items-center gap-1"><EnvironmentOutlined />{{ inquiry.location }}</div>
								<div v-if="inquiry.peopleQty" class="flex align-items-center gap-1"><UserOutlined />{{ inquiry.peopleQty }}</div>
							</div>
							<div class="date">{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
						</div>
					</div>
				</template>
			</DataView>
		</div>
		<div v-if="asSidebar" class="divider" />
		<div v-if="showCurrent" class="current-inquiry flex-grow-1">
			<div class="flex">
				<Button :icon="h(ArrowLeftOutlined)" type="text" @click="closeCurrentInquiry" />
				<div class="flex-grow-1" />
				<Button :icon="h(MailOutlined)" type="text" v-tooltip.bottom="'Mark as unread'" @click="markAsUnread(state.currentInquiry)"  />
				<Button :icon="h(DeleteOutlined)" type="text"  v-tooltip.left="'Delete'" @click="deleteInquiry(state.currentInquiry)" />
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

		& *:not(.message) {
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