<script setup lang="ts">
import { useRouter, RouterView } from 'vue-router';
import { reactive, defineProps, computed } from 'vue';
import { useInquiriesStore } from '@/stores/inquiries.store';
import LoginForm from '@/components/LoginForm.vue';
import request from '@/services/request';
import Editor from 'primevue/editor';
import dayjs from 'dayjs';

const props = defineProps<{
	inquiry: any,
}>();
const inquiry = computed(() => props.inquiry );

if (!inquiry.value.read_at) {
	setTimeout(() => {
		inquiry.value.read_at = new Date();
		useInquiriesStore().updateInquiry(inquiry.value);
	}, 1000);
}

const state = reactive({
});


function cleanHTML(html){
	return html.replace(/<.*?script.*\/?>/gi, '');
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
			{{ inquiry.email }}
			<span v-if="inquiry.phone"> - {{ inquiry.phone }}</span>
		</div>
		<div class="flex flex-wrap gap-3">
			<div v-if="inquiry.location" class="flex align-items-center gap-1"><i class="pi pi-map-marker" />{{ inquiry.location }}</div>
			<div v-if="inquiry.location" class="flex align-items-center gap-1"><i class="pi pi-users" />{{ inquiry.location }}</div>
			<div v-if="inquiry.date" class="flex align-items-center gap-1"><i class="pi pi-calendar" />{{ inquiry.date }}</div>
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