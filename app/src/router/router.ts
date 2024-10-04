import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { AuthService } from '@/services/authService';
import Home from '@/views/Home.vue';


const routes: Array<RouteRecordRaw> = [
	{
		path: '/logout',
		component: () => import('@/views/Home.vue'),
		async beforeEnter(to, from, next) {
			await AuthService.signOut();
			return next({
				name: "Home",
			});
		}
	},
	{
		path: '',
		name: "Home",
		component: Home,
	},

	{
		path: '/inquiry',
		name: "Inquiry",
		component: () => import('@/views/NewInquiry.vue'),
	},


	{
		path: '/my-galleries',
		name: "MyGalleries",
		component: () => import('@/views/MyGalleries.vue'),
	},

	{
		path: '/admin',
		name: "Admin",
		component: () => import('@/views/admin/Admin.vue'),
		async beforeEnter(to, from, next) {
			if (!useUserStore().currentUser?.isAdmin) {
				return next('');
			}
			next();
		},
		children: [
			{
				path: '',
				name: 'Galleries',
				component: () => import('@/views/admin/Galleries.vue'),

				children: [
					{
						path: '',
						name: 'GalleriesList',
						component: () => import('@/views/admin/GalleryList.vue'),
					},
					{
						path: '/admin/galleries/:galleryId',
						component: () => import('@/views/admin/EditGallery.vue'),
					},
				],
			},


			{
				path: '/admin/shoots',
				name: 'PhotoShoots',
				component: () => import('@/views/admin/Photoshoots.vue'),

				children: [
					{
						path: '',
						name: 'PhotoShootList',
						component: () => import('@/views/admin/PhotoShootList.vue'),
					},
					{
						path: '/admin/shoots/:opportunityId',
						component: () => import('@/views/admin/PhotoShoot.vue'),
					},
				],
			},


			{
				path: '/admin/inquiries',
				name: 'Inquiries',
				component: () => import('@/views/admin/Inquiries.vue'),
			},

			{
				path: '/admin/portfolio',
				name: 'EditPortfolio',
				component: () => import('@/views/admin/portfolio/EditPortfolio.vue'),
			},
		]
	},
	
	{
		path: '/:galleryId',
		component: () => import('@/views/viewGallery/ViewGallery.vue'),
	},
	{
		path: '/:pathMatch(.*)*',
		redirect: ''
	},
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
	scrollBehavior: (to, from) => {
		if (to.path === from.path) {
			return { top: window.scrollY };
		}
		return { top: 0 };
	},
});

router.beforeEach(async (to, from, next) => {
	if (!useUserStore().hasLoadedSessionData) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await useUserStore().loadSessionData();
	}
	while (!useUserStore().hasLoadedSessionData || useUserStore().isLoading) {
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	next();
})

// const authRedirectGuard = async (checkAuth, to, from, next) => {
// 	console.log("doing auth guard");
// 	// make sure auth has a chance to load
// 	if (!useUserStore().hasLoadedSessionData) {
// 		await useUserStore().loadSessionData();
// 	}
// 	while (!useUserStore().hasLoadedSessionData) {
// 		await new Promise((resolve) => setTimeout(resolve, 500));
// 	}

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
