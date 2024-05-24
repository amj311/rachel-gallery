import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import { AuthService } from '@/services/authService';
import { useRouter } from 'vue-router';

const mobileBreakpoint = 600;
const _isMobile = () => window.innerWidth < mobileBreakpoint;
document.documentElement.style.setProperty('--mobile-breakpoint', mobileBreakpoint + 'px');

export const useAppStore = defineStore('app', () => {
	const isMobile = ref(_isMobile());
	window.addEventListener('resize', () => {
		isMobile.value = _isMobile();
	});

	const router = useRouter();
	function setTitle(title: string) {
		document.title = title;
	}

	watch(router.currentRoute, () => {
		setTitle("Rachel Florence Photo");
	});

	return {
		mobileBreakpoint,
		isMobile,
		setTitle,
	};
});
