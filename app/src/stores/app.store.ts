import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import { AuthService } from '@/services/authService';

const mobileBreakpoint = 600;
const _isMobile = () => window.innerWidth < mobileBreakpoint;
document.documentElement.style.setProperty('--mobile-breakpoint', mobileBreakpoint + 'px');

export const useAppStore = defineStore('app', () => {
	const isMobile = ref(_isMobile());

	window.addEventListener('resize', () => {
		isMobile.value = _isMobile();
	});

	return {
		mobileBreakpoint,
		isMobile,
	};
});
