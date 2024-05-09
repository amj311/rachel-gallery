<script lang="ts">
import { useUserStore } from '@/stores/user.store';
import { RouterLink } from 'vue-router';

const userStore = useUserStore();

export default {
	components: {  },

	data() {
		return {
			// loading: false,
			// // tracks: new Map<any, any>(),
			// // categories: new Map<any, any>(),

			// activeCategory: <any>null,
			// mode: 'browse',
			// // activeTrack: null,
		}
	},

	async beforeMount() {
	},

	methods: {
	},

	computed: {
		isAdmin() {
			return userStore.currentUser?.isAdmin;
		},
	},
}
</script>

<template>
	<div class="flex align-center justify-content-between">
		<h1>Rachel Florence Photo</h1>
		<RouterLink to="/admin" v-if="isAdmin">Admin</RouterLink>
	</div>
	<hr />
</template>

<style scoped>

</style>