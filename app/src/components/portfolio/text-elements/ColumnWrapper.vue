<script setup lang="ts">
import { computed } from 'vue';
import DropdownMenu from '@/components/DropdownMenu.vue';

const props = defineProps<{
	editMode?: boolean,
	options: Array<any>;
}>();

const emit = defineEmits(['remove']);

const options = computed(() => ([
	...props.options,
	{
		label: 'Delete',
		class: 'danger',
		command() {
			emit('remove');
		}
	}
]));

</script>

<template>
	<div class="col-content-wrapper">
		<slot></slot>
		<div v-if="props.editMode" class="options-button"><DropdownMenu :model="options"><i class="pi pi-ellipsis-v" /></DropdownMenu></div>
	</div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.module.scss';

.col-content-wrapper {
	position: relative;
	height: 100%;
	width: 100%;

	.options-button {
		position: absolute;
		top: 0;
		right: 0;
		display: none;
		background: #fff;
		border: 1px solid #dddefd;

		i {
			display: block;
			padding: 4px;
			text-align: center;
			cursor: pointer;
		}
	}

	&:hover .options-button {
		display: block;
	}
}

</style>