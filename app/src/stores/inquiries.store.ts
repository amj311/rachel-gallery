import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';

export const useInquiriesStore = defineStore('inquiries', () => {
	const isLoadingList = ref(false);
	const inquiries = ref<any[]>([]);

	return {
		isLoadingList,
		inquiries,

		async loadInquiries() {
			isLoadingList.value = true;
			const { data } = await request.get('/admin/inquiries');
			inquiries.value = data.data;
			isLoadingList.value = false;
		},

		unread: computed(() => {
			return inquiries.value.filter(i => !i.read_at);
		}),

		async updateInquiry(inquiry) {
			await request.put('admin/inquiry/' + inquiry.id, inquiry);
			const idx = inquiries.value.indexOf(inquiry);
			inquiries.value[idx] = inquiry;
		}
	};
});
