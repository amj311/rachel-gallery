<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/user.store';
import Toast from 'primevue/toast';

const userStore = useUserStore();

</script>


<template>
	<div v-if="!userStore.hasLoadedSessionData">Loading...</div>
	<RouterView v-else />
	<Toast></Toast>
</template>


<style scoped>

</style>