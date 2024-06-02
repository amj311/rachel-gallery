<script setup lang="ts">
import { reactive, defineProps, computed } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import request from '@/services/request';
import dayjs from 'dayjs';
import {
  GiftOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from '@/components/icons';

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
			<div v-if="inquiry.occasion" class="flex align-items-center gap-1"><GiftOutlined />{{ inquiry.occasion }}</div>
			<div v-if="inquiry.date" class="flex align-items-center gap-1"><CalendarOutlined />{{ dayjs(inquiry.date).format('MMM D, YYYY') }}</div>
			<div v-if="inquiry.location" class="flex align-items-center gap-1"><EnvironmentOutlined />{{ inquiry.location }}</div>
			<div v-if="inquiry.peopleQty" class="flex align-items-center gap-1"><UserOutlined />{{ inquiry.peopleQty }}</div>
		</div>
		<div class="my-3">
			<div v-html="cleanHTML(inquiry.message)" />
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