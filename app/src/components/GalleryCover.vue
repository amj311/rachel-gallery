<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import PhotoFrame from './PhotoFrame.vue';
import dayjs from 'dayjs';

const { gallery, style: styleOverride, forceMode, preview = false } = defineProps<{
	gallery: any,
	style?: string,
	forceMode?: string,
	preview?: boolean
}>()

const style = computed(() => styleOverride || gallery.coverStyle || 'full');
const settings = computed(() => gallery.coverSettings || {});
const isMobile = computed(() => forceMode === 'mobile' || (window.innerWidth < 768 && forceMode !== 'desktop'));
const date = computed(() => gallery.date ? dayjs(gallery.date).format('MMM DD, YYYY') : null);
const hasCover = computed(() => !!gallery.coverPhoto);

// const windowState = ref(window);
const parallaxShift = ref(0);

const updateWindow = () => {
	parallaxShift.value = Math.max(0, window.scrollY * 0.7);
}

onMounted(() => {
	if (!preview) {
		window.addEventListener('scroll', updateWindow);
		updateWindow();
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('scroll', updateWindow);
});

</script>

<template>
	<div :classList="['gallery-cover', style || 'full', isMobile ? 'mobile' : ''].join(' ')">
		<template v-if="style === 'full'">
			<div class="bg" :style="{ top: `${parallaxShift}px` }">
				<PhotoFrame v-if="hasCover" :key="gallery.coverPhoto.id" :photo="gallery.coverPhoto" :size="'xl'" :fillMethod="'cover'" :position="settings.focalPoint" />
			</div>
			<div class="filter"></div>
			<div v-if="settings.border" class="border"></div>
			<div class="text" :class="{ [settings.textPlacement || 'center']: true }">
				<div class="title">{{ gallery.name }}</div>
				<div v-if="date" class="subtext">{{ date }}</div>
			</div>
		</template>
		<template v-if="style === 'half'">
			<div class="bg">
				<PhotoFrame v-if="hasCover" :key="gallery.coverPhoto.id" :photo="gallery.coverPhoto" :size="'xl'" :fillMethod="'cover'" :position="settings.focalPoint" />
			</div>
			<div class="text-side">
				<div class="title">{{ gallery.name }}</div>
				<div v-if="date" class="subtext">{{ date }}</div>
			</div>
		</template>
		<template v-if="style === 'overlay'">
			<div class="bg">
				<PhotoFrame v-if="hasCover" :key="gallery.coverPhoto.id" :photo="gallery.coverPhoto" :size="'xl'" :fillMethod="'cover'" :position="settings.focalPoint" />
			</div>
			<div class="text">
				<div class="text-area">
					<div class="title">{{ gallery.name }}</div>
					<div v-if="date" class="subtext">{{ date }}</div>
				</div>
			</div>
		</template>
	</div>
</template>

<style scoped lang="scss">
.gallery-cover {
	width: 100%;
	height: 100%;
	position: relative;
	overflow: hidden;
}


.bg {
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}


.title {
	font-size: 3em;
	line-height: 1.2em;
}

.subtext {
	font-size: 1.5em;
}

.gallery-cover.full {
	.bg {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.filter {
		width: 100%;
		height: 100%;
		position: absolute;
		background-color: rgba(0, 0, 0, 0.3);
	}

	.text {
		position: absolute;
		color: white;

		&.center {
			top: 50%;
			width: 100%;
			transform: translateY(-50%);
			text-align: center;
		}

		&.bottom {
			top: auto;
			bottom: 1.5em;
			left: 1.5em;
			padding: 2.5em;
		}
	}

	.border {
		border: 1px solid white;
		position: absolute;
		top: 10px;
		left: 10px;
		right: 10px;
		bottom: 10px;
	}
}



.gallery-cover.half {
	.bg {
		position: absolute;
		width: 50%;
		height: 100%;
	}
	
	.text-side {
		position: absolute;
		width: 50%;
		height: 100%;
		left: 50%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 2em;
	}

	&.mobile {
		.bg {
			width: 100%;
			height: 50%;
		}
		.text-side {
			width: 100%;
			height: 50%;
			left: 0;
			top: 50%;
		}
	}
}






.gallery-cover.overlay {
	.bg {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.filter {
		width: 100%;
		height: 100%;
		position: absolute;
	}

	.text {
		position: absolute;
		color: white;
		background-color: rgba(0, 0, 0, 0.5);
		height: 100%;
		width: 38%;
		padding: 30px;
		display: flex;
		align-items: top;

		.text-area {
			height: 50%;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
		}
	}

	&.mobile {
		.text {
			width: 100%;
			bottom: 0;
			height: auto;
		}
	}
}

</style>
