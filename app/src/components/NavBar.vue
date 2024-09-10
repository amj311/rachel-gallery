<script setup lang="ts">
import UserMenu from '@/components/UserMenu.vue';
</script>

<template>
	<div class="nav-bar">
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
}
</style>