import './assets/main.css'
import 'flag-icons/css/flag-icons.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import i18n from './i18n'

import { initializeLanguage } from './utils/language'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Initialize language (sync check for localStorage/browser)
initializeLanguage()

// Initialize theme
const themeStore = useThemeStore()
themeStore.initTheme()

// Initialize auth state
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
