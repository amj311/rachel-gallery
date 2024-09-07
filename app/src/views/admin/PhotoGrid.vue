<script setup lang="ts">
import PhotoFrame from '@/components/PhotoFrame.vue';

const props = defineProps<{
	photos: Iterable<any>,
	photoClasses?: (photo: any) => any,
	onPhotoClick?: (photo: any) => void
}>();

</script>


<template>
	<div class="grid-wrapper">
		<div class="photo-grid">
			<div
				v-for="photo in props.photos"
				:key="photo.id"
				class="photo-grid-item upload-item"
				:class="props.photoClasses?.call(null, photo)"
				@click="props.onPhotoClick?.call(null, photo)"
			>
				<div class="photo-frame">
					<PhotoFrame :photo="photo" size="xs" fillMethod="contain" />
				</div>
				<div class="options"><slot name="options" :photo="photo" /></div>
				<div class="filename">{{ photo.filename }}</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '../../assets/colors.scss';

.photo-grid {
	padding-top: 10px;
	padding-right: 20px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
	grid-gap: 15px;
	justify-items: center;
	align-items: center;
}

.handle {
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
}


.photo-grid-item {
	position: relative;
	max-width: 6rem;
	padding: .5rem;
	border: 1px solid transparent;
	background: #fff;

	&:hover {
		background-color: $primary-thin;
		border: 1px solid #eee;
	}

	&.sortable-ghost {
		opacity: .4;
		border: 1px solid lightgrey;
		cursor: grabbing;
	}

	.photo-frame {
		width: 5rem;
		height: 5rem;
		margin-bottom: .5rem;
	}

	.filename {
		font-size: .7em;
		line-break: anywhere;
		text-align: center;
		width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.options {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1;
        display: none;
	}

	&:hover .options {
		display: block;
	}
}
</style>