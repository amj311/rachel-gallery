import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { AuthService } from '@/services/authService';
import request from '@/services/request';

const loadAuth = async () => {
	AuthService.info.push('loading firebase config');
	try {
		const { data } = await request.get('firebase-config');
		AuthService.info.push("got config")
		AuthService.setupAuth(data.data);

		console.log("loaded auth")
		useUserStore().loadSessionData();
	}
	catch (e: any) {
		AuthService.info.push("failed to get config")
		AuthService.info.push(e.message);
	}
}
loadAuth();

const routes: Array<RouteRecordRaw> = [
	{
		path: '/logout',
		component: () => import('@/views/Home.vue'),
		async beforeEnter(to, from, next) {
			await AuthService.signOut();
			return next('/home');
		}
	},
	{
		path: '/home',
		component: () => import('@/views/Home.vue'),
		// beforeEnter(to, from, next) {
		// 	const redirect = sessionStorage.getItem('redirectPath');
		// 	if (useUserStore().currentUser && redirect) {
		// 		sessionStorage.removeItem('redirectPath');
		// 		return next(redirect as string);
		// 	}
		// 	next();
		// }
	},
	{
		path: '/admin',
		component: () => import('@/views/admin/Admin.vue'),
		// beforeEnter(to, from, next) {
		// 	if (!useUserStore().currentUser?.is_admin) {
		// 		return next('/login');
		// 	}
		// 	next();
		// },
		children: [
			{
				path: '/admin/gallery/:galleryId',
				component: () => import('@/views/admin/EditGallery.vue'),
			},
			
			// {
			// 	path: '/admin/users',
			// 	name: "Users",
			// 	component: () => import('@/views/admin/Users.vue'),
			// },
		]
	},
	{
		path: '/:galleryId',
		component: () => import('@/views/viewGallery/ViewGallery.vue'),
	},
	{
		path: '/:pathMatch(.*)*',
		redirect: '/home'
	},
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
});

// const authRedirectGuard = async (checkAuth, to, from, next) => {
// 	console.log("doing auth guard");
// 	// make sure auth has a chance to load
// 	// if (!useUserStore().hasLoadedSessionData) {
// 	// 	await useUserStore().loadSessionData();
// 	// }
// 	// while (!useUserStore().hasLoadedSessionData) {
// 	// 	await new Promise((resolve) => setTimeout(resolve, 500));
// 	// }

// 	const proceed = await checkAuth();

// 	// Use home right by default, but 
// 	if (!useUserStore().isLoggedIn && to.path !== '/home') {
// 		sessionStorage.setItem('redirectPath', to.fullPath);
// 		next('/home');
// 		return;
// 	}

// 	next();
// };

export default router
