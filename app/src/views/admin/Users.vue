<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import UserForm from './UserForm.vue';
import { onMounted, reactive } from 'vue';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import AudioChip from '@/components/AudioChip.vue';
import { useAdminStore } from './admin.store';
import Checkbox from 'primevue/checkbox';

const toast = useToast();

const adminStore = useAdminStore();

const state = reactive({
	userToEdit: <any>null,
	showUserModal: false
});

onMounted(() => {
	loadUsers();
});

const loadUsers = async () => {
	try {
		await adminStore.loadUsers();
	}
	catch (e) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: "Could not load users",
			life: 3000,
		})
	}
};

const openUserModal = (user) => {
	state.userToEdit = user;
	state.showUserModal = true;
}

const doNewUser = () => {
	openUserModal({});
}

const closeAndReload = () => {
	state.userToEdit = null;
	state.showUserModal = false;
	loadUsers();
}

</script>


<template>
	<div class="text-right">
		<Button @click="doNewUser"><i class="pi pi-plus" />&nbsp;&nbsp;New User</Button>
	</div>
	<Dialog v-model:visible="state.showUserModal" modal :header="state.userToEdit?.name ? 'Edit User' : 'New User'" @change="state.userToEdit = null" :style="{ width: '90vw', maxWidth: '600px' }">
		<UserForm :user="state.userToEdit" @saved="closeAndReload" @deleted="closeAndReload" />
	</Dialog>
	<DataTable :value="adminStore.users" scrollable :loading="adminStore.loadingUsers">
		<Column header="Name">
			<template #body="{data}">
				{{ data.given_name }} {{ data.family_name }}
			</template>
		</Column>
		<Column field="email" header="Email"></Column>
		<Column field="isAdmin" header="Admin">
			<template #body="{data}">
				{{ data.isAdmin ? '✓' : '' }}
			</template>
		</Column>
		<Column :field="'actions'" :frozen="true" alignFrozen='right'>
			<template #body="slotProps">
				<Button @click="openUserModal(slotProps.data)" plain text>
					<i class="pi pi-pencil"></i>
				</Button>
			</template>
		</Column>
	</DataTable>
</template>

<style>
.about {
	color: white;
}
.p-chip {
	font-size: inherit;
}
</style>