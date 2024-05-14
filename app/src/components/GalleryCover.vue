<script setup lang="ts">
import { computed } from 'vue';
import PhotoFrame from './PhotoFrame.vue';
import dayjs from 'dayjs';

const { gallery, style: styleOverride, pretendMobile } = defineProps<{
	gallery: any,
	style?: string,
	pretendMobile?: boolean
}>()

const style = computed(() => styleOverride || gallery.coverStyle || 'full');
const settings = computed(() => gallery.coverSettings || {});
const isMobile = computed(() => pretendMobile || window.innerWidth < 768);
const date = computed(() => gallery.date ? dayjs(gallery.date).format('MMM DD, YYYY') : null);

</script>

<template>
	<div :classList="['gallery-cover', style, isMobile ? 'mobile' : ''].join(' ')">
		<template v-if="style === 'full'">
			<div class="bg">
				<PhotoFrame :photo="gallery.coverPhoto" :size="'xl'" :fillMethod="'cover'" />
			</div>
			<div class="filter"></div>
			<div v-if="settings.border" class="border"></div>
			<div class="text" :class="{ [settings.textPlacement]: true }">
				<div class="title">{{ gallery.name }}</div>
				<div v-if="date" class="subtext">{{ date }}</div>
			</div>
		</template>
		<template v-if="style === 'half'">
			<div class="bg">
				<PhotoFrame :photo="gallery.coverPhoto" :size="'xl'" :fillMethod="'cover'" />
			</div>
			<div class="text-side">
				<div class="title">{{ gallery.name }}</div>
				<div v-if="date" class="subtext">{{ date }}</div>
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
			bottom: 30px;
			left: 30px;
			padding: 30px;
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
</style>
