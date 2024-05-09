<script setup lang="ts">
import { useUserStore } from './stores/user.store';
import { RouterView } from 'vue-router';

const userStore = useUserStore();

</script>


<template>
	<RouterView />
</template>


<style scoped>

</style>