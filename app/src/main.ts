import 'primeflex/primeflex.css';
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './services/requestInterceptor'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
