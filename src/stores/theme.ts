import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
    const theme = ref<Theme>('system')
    const systemPrefersDark = ref(false)

    // Effective theme (resolve 'system' to actual theme)
    const effectiveTheme = computed(() => {
        if (theme.value === 'system') {
            return systemPrefersDark.value ? 'dark' : 'light'
        }
        return theme.value
    })

    // Apply theme to HTML element
    const applyTheme = (isDark: boolean) => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    // Set theme and save to localStorage
    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
        localStorage.setItem('tennismate-theme', newTheme)
        applyTheme(effectiveTheme.value === 'dark')
    }

    // Initialize theme from localStorage and system preference
    const initTheme = () => {
        // Check system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        systemPrefersDark.value = mediaQuery.matches

        // Listen for system preference changes
        mediaQuery.addEventListener('change', (e) => {
            systemPrefersDark.value = e.matches
            if (theme.value === 'system') {
                applyTheme(e.matches)
            }
        })

        // Load saved theme or default to system
        const savedTheme = localStorage.getItem('tennismate-theme') as Theme
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            theme.value = savedTheme
        }

        // Apply initial theme
        applyTheme(effectiveTheme.value === 'dark')
    }

    // Watch for theme changes
    watch(effectiveTheme, (isDark) => {
        applyTheme(isDark === 'dark')
    })

    return {
        theme,
        effectiveTheme,
        setTheme,
        initTheme
    }
})
