import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';

export const useClientStore = defineStore('client', () => {
	const isLoadingList = ref(false);
	const clients = ref<any[]>([]);

	async function loadClients() {
		isLoadingList.value = true;
		const { data } = await request.get('/admin/clients');
		clients.value = data.data;
		isLoadingList.value = false;
	}

	loadClients();

	return {
		isLoadingList,
		clients,

		loadClients,

		unread: computed(() => {
			return clients.value.filter(i => !i.readAt);
		}),

		async createClient(client) {
			const { data } = await request.post('admin/client', client);
			clients.value.push(data.data);
			return data.data;
		},

		async updateClient(client) {
			await request.put('admin/client/' + client.id, client);
			const idx = clients.value.indexOf(client);
			clients.value[idx] = client;
		},

		async deleteClient(id: string) {
			await request.delete('admin/client/' + id);
			clients.value = clients.value.filter(i => i.id !== id);
		}
	};
});
