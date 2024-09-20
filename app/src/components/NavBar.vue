<script setup lang="ts">
import UserMenu from '@/components/UserMenu.vue';

defineProps<{
	sticky?: boolean
}>();

</script>

<template>
	<div class="nav-bar" :class="{ 'sticky': sticky }">
		<div class="nav-row">
			<div class="logo"><slot name="logo"><div @click="$router.push('/')">RACHEL FLORENCE<br/>PHOTO</div></slot></div>
			<div class="flex-grow-1">
				<slot></slot>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
.nav-bar {
	z-index: 10;
	background-color: #fffd;
	backdrop-filter: blur(10px);

	&.sticky {
		position: sticky;
		top: 0;
	}

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
			text-transform: uppercase;
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
}
</style>