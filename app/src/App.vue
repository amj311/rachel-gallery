<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/user.store';

const userStore = useUserStore();

</script>


<template>
	<div v-if="!userStore.hasLoadedSessionData">Loading...</div>
	<RouterView v-else />
</template>


<style scoped>

</style>