import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize theme
const themeStore = useThemeStore()
themeStore.initTheme()

// Initialize auth state
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
