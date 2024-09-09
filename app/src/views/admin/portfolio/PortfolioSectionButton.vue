<script setup lang="ts">
import RefOpener from '@/components/RefOpener.vue';
import Button from 'primevue/button';
import OverlayPanel from 'primevue/overlaypanel';

const emit = defineEmits(['create']);
</script>


<template>
	<RefOpener :component="OverlayPanel">
		<template #trigger>
			<slot><Button outlined>&plus; Add Section</Button></slot>
		</template>
		<template #ref>
			<div class="flex gap-1">
				<div class="section-option" @click="emit('create', 'photo-wall')">
					<div class="material-symbols-outlined">dashboard_2</div>
					<div>Photo Wall</div>
				</div>
				<div class="section-option" @click="emit('create', 'carousel')">
					<div class="material-symbols-outlined">overview_key</div>
					<div>Carousel</div>
				</div>
			</div>
		</template>
	</RefOpener>
</template>

<style scoped>
.section-option {
	cursor: pointer;
	user-select: none;
	border: 1px solid;
	border-color: transparent;
	border-radius: 5px;
	padding: .5em;
	text-align: center;

	&:hover {
		border-color: #eee;
	}
}
</style>