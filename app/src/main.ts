import './services/requestInterceptor'

import 'primeflex/primeflex.css';
import 'primevue/resources/themes/aura-light-noir/theme.css'
import 'primeicons/primeicons.css'

// import 'ant-design-vue/dist/reset.css';

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import BadgeDirective from 'primevue/badgedirective';
import ToastService from 'primevue/toastservice';

import App from './App.vue'
import router from './router/router'

const app = createApp(App);
app.use(router)
app.use(PrimeVue);
app.directive('badge', BadgeDirective);
app.directive('tooltip', Tooltip);
app.use(ToastService);
app.use(createPinia())

app.mount('#app')
