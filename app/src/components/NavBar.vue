<script setup lang="ts">
import UserMenu from '@/components/UserMenu.vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const isDev = computed(() => {
	return process.env.NODE_ENV === 'development';
})
</script>

<template>
	<div class="nav-bar">
		<div class="dev-banner" v-if="isDev">
			You are in DEV MODE. Have fun!
		</div>
		<div class="nav-row">
			<div class="logo" @click="$router.push('/')">RACHEL FLORENCE<br/>PHOTO</div>
			<div class="flex-grow-1">
				<slot></slot>
			</div>
			<UserMenu />
		</div>
	</div>
</template>

<style lang="scss">
.nav-bar {
	position: sticky;
	top: 0;
	z-index: 10;
	background-color: #fffd;
	backdrop-filter: blur(10px);

	.nav-row {
		display: flex;
		gap: 1em;
		align-items: center;
		padding: 1em;


		.logo {
			font-family: serif;
			line-height: 1.2;
			font-size: .8rem;
			letter-spacing: 2px;
			user-select: none;
			cursor: pointer;
		}

		a {
			text-decoration: none;
			color: #000 !important;

			&.router-link-exact-active {
				border-bottom: 1px solid;
			}
		}
	}

	.dev-banner {
		background: #0a0;
		text-align: center;
		color: #fff;
		padding: 5px;
		font-size: .8em;
	}
}
</style>