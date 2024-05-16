<script setup lang="ts">
import request from '@/services/request';
import Button from 'primevue/button';
import DataView from 'primevue/dataview';
import { onMounted, reactive } from 'vue';
import dayjs from 'dayjs';
import Skeleton from 'primevue/skeleton';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import MultiSelect from 'primevue/multiselect';
import AudioChip from '@/components/AudioChip.vue';
import PopConfirm from '@/components/PopConfirm.vue';
import { useAdminStore } from './admin.store';
import Dropdown from 'primevue/dropdown';
import TimeUtils from '@/utils/timeUtils';
import Checkbox from 'primevue/checkbox';

const toast = useToast();

const { user = {} } = defineProps(['user'])

const emit = defineEmits(['saved', 'deleted']);

const adminStore = useAdminStore();

const state = reactive({
	isSaving: false,
	isDeleting: false,
	editData: JSON.parse(JSON.stringify(user)),
});

onMounted(() => {
});

const save = async () => {
	try {
		state.isSaving = true;
		let data = await request.put('/admin/users/' + state.editData.user_id, state.editData);
		toast.add({
			severity: 'success',
			summary: `Saved user`,
			life: 3000,
		})
		emit('saved', data);
	}
	catch (e) {
		toast.add({
			severity: 'error',
			summary: `Failed to save user`,
			life: 3000,
		})
	}
	finally {
		state.isSaving = false;
	}
}

</script>


<template>
	<div>
		<div>
			<div class="mb-3 flex gap-2">
				<div class="flex-grow-1">
					<label for="given_name" class="block mb-1">Given Name</label>
					<InputText id="given_name" v-model="state.editData.given_name" class="w-full" />
				</div>
				<div class="flex-grow-1">
					<label for="family_name" class="block mb-1">Family Name</label>
					<InputText id="family_name" v-model="state.editData.family_name" class="w-full" />
				</div>
			</div>

			<div class="mb-3">
				<label for="email" class="block mb-1">Email</label>
				<InputText disabled id="email" v-model="state.editData.email" class="w-full" />
			</div>

			<div class="mb-3 flex gap-2">
				<label class="block mb-1">Admin</label>
				<Checkbox v-model="state.editData.isAdmin" :binary="true" />
			</div>
		</div>

		<!-- FOOTER -->
		<div class="flex justify-content-end mt-3 gap-2">
			<Button @click="save" :disabled="state.isSaving || !state.editData.given_name || !state.editData.family_name">
				<i v-if="state.isSaving" class="pi pi-spin pi-spinner mr-2" />
				Save
			</Button>
		</div>

	</div>
</template>

<style>
.cat-row .edit {
	display: none;
}

.cat-row:hover .edit {
	display: block;
}
</style>
