import 'primeflex/primeflex.css';
import './assets/main.css'
import './services/requestInterceptor'

import 'primevue/resources/themes/aura-light-noir/theme.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import BadgeDirective from 'primevue/badgedirective';

import App from './App.vue'
import router from './router/router'

const app = createApp(App);
app.use(PrimeVue);
app.directive('badge', BadgeDirective);
app.directive('tooltip', Tooltip);
app.use(createPinia())
app.use(router)

app.mount('#app')
