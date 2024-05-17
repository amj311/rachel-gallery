<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user.store';
import DropdownMenu from './DropdownMenu.vue';
import { computed, reactive } from 'vue';
import LoginModal from './LoginModal.vue';
import Button from 'primevue/button';

const userStore = useUserStore();
const router = useRouter();

const isLoggedIn = computed(() => {
	return userStore.isLoggedIn;
});
const isAdmin = computed(() => {
	return userStore.currentUser?.isAdmin;
});

const state = reactive({
	showLoginModal: false,
});

const menu = computed(() => {
	if (!isLoggedIn.value) {
		return [
			{
				label: 'Login',
				command: () => {
					state.showLoginModal = true;
				}
			}
		]
	}
	
	const items: any[] = [];
	

	if (isAdmin.value) {
		items.push({
			label: 'Admin',
			command: () => {
				router.push('/admin');
			}
		});
	}

	items.push({
		label: 'Logout',
		command: () => {
			router.push('/logout');
		}
	});
	
	return items;
});

</script>


<template>
	<DropdownMenu :model="menu" :disabled="!isLoggedIn">
		<Button icon="_" text class="gap-2" @click="() => { if (!isLoggedIn) state.showLoginModal = true }">
			<i class="pi pi-user" />
			<div v-if="isLoggedIn">{{ userStore.currentUser?.givenName }}</div>
		</Button>
		<template #start>
			<div class="flex flex-column align-items-center p-2">
				<div>{{userStore.currentUser?.givenName}} {{userStore.currentUser?.familyName}}</div>
				<small>{{userStore.currentUser?.email}}</small>
			</div>
		</template>
	</DropdownMenu>

	<LoginModal v-if="state.showLoginModal" :closeable="true" @close="() => state.showLoginModal = false" />
</template>


<style scoped>
.login {
	text-align: center;
	padding-top: 5em;
}
</style>