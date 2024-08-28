<script setup lang="ts">
import { reactive, defineProps, computed } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import request from '@/services/request';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps<{
	inquiry: any,
}>();
const inquiry = computed(() => props.inquiry );

if (!inquiry.value.readAt) {
	inquiry.value.readAt = new Date();
	useInquiriesStore().updateInquiry(inquiry.value);
}

function cleanHTML(html){
	return html.replace(/(<\s*?script[^>]*)>([^<]*)?(<\s*\/[^>]*>)?/gi, '');
}

const isCreatingOpportunity = ref(false);

async function createOpportunity() {
	try {
		isCreatingOpportunity.value = true;
		await useInquiriesStore().acceptInquiry(inquiry.value);
	}
	catch (e) {
		console.error(e);
		toast.add({ severity: 'error', summary: 'Could not create photo shoot', life: 3000 });
	}
	finally {
		isCreatingOpportunity.value = false;
	}
}

</script>


<template>
	<div class="mx-2">
		<div class="flex flex-wrap align-items-center">
			<h2>Inquiry from {{ inquiry.name }}</h2>
			<div class="flex-grow-1" />
			<div>{{ dayjs(inquiry.createdAt).format('MMM D, YYYY') }}</div>
		</div>
		<div>
			<small>{{ inquiry.email }}</small>
			<small v-if="inquiry.phone"> - {{ inquiry.phone }}</small>
		</div>
		<div class="flex flex-wrap gap-3 my-2">
			<div v-if="inquiry.occasion" class="flex align-items-center gap-1"><i class="pi pi-camera" />{{ inquiry.occasion }}</div>
			<div v-if="inquiry.date" class="flex align-items-center gap-1"><i class="pi pi-calendar" />{{ dayjs(inquiry.date).format('MMM D, YYYY') }}</div>
			<div v-if="inquiry.location" class="flex align-items-center gap-1"><i class="pi pi-map-marker" />{{ inquiry.location }}</div>
			<div v-if="inquiry.peopleQty" class="flex align-items-center gap-1"><i class="pi pi-users" />{{ inquiry.peopleQty }}</div>
		</div>
		<div class="my-3">
			<div v-html="cleanHTML(inquiry.message)" />
		</div>
		<div class="my-6">
			<Button v-if="!inquiry.Opportunity" class="gap-2 py-3" icon="pi pi-camera" outlined label="Plan a Photoshoot" @click="createOpportunity" :loading="isCreatingOpportunity" />
			<Button v-else class="gap-2 py-3" icon="pi pi-camera" outlined label="View Photoshoot" @click="$router.push(`/admin/shoots/${inquiry.Opportunity.id}`)"/>
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