<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { useInquiriesStore } from '@/stores/inquiries.store';
import UploaderWindow from './uploader/UploaderWindow.vue';
import NavBar from '@/components/NavBar.vue';
import Badge from 'primevue/badge';

const userStore = useUserStore();
if (!userStore.hasLoadedSessionData) {
	userStore.loadSessionData();
}

const inquiriesStore = useInquiriesStore();
inquiriesStore.loadInquiries()

</script>


<template>
	<NavBar>
		<div class="flex justify-content-end gap-3">
			<RouterLink to="/admin">Galleries</RouterLink>
			<div class="flex align-items-center">
				<RouterLink to="/admin/inquiries">Inquiries</RouterLink>
				<Badge v-show="inquiriesStore.unread.length > 0" :value="inquiriesStore.unread.length" style="transform: scale(.8)" severity="danger"/>
			</div>
			<RouterLink to="/admin/shoots">Photoshoots</RouterLink>
		</div>
	</NavBar>

	<div class="p-3 pt-0"><RouterView /></div>

	<UploaderWindow />
</template>

<style>

</style>