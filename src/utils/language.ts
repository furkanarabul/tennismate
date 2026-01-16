import i18n from '@/i18n'

const SUPPORTED_LANGUAGES = ['en', 'tr', 'de']
const DEFAULT_LANGUAGE = 'en'
const STORAGE_KEY = 'user-language'

export function initializeLanguage() {
    // 1. Check LocalStorage
    const storedLang = localStorage.getItem(STORAGE_KEY)
    if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
        setLanguage(storedLang)
        return
    }

    // 2. Fallback to Browser Language (Instant, but don't persist yet)
    const browserLang = (navigator.language || DEFAULT_LANGUAGE).split('-')[0] || DEFAULT_LANGUAGE
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        setLanguage(browserLang, false)
    } else {
        setLanguage(DEFAULT_LANGUAGE, false)
    }
}

export async function detectIpLanguage() {
    // If we already have a stored preference, don't overwrite it with IP guess
    if (localStorage.getItem(STORAGE_KEY)) return

    try {
        const response = await fetch('https://ipapi.co/json/')
        if (response.ok) {
            const data = await response.json()
            const countryCode = data.country_code // e.g., 'TR', 'DE', 'US'

            let detectedLang = DEFAULT_LANGUAGE

            if (countryCode === 'TR') {
                detectedLang = 'tr'
            } else if (['DE', 'AT', 'CH'].includes(countryCode)) {
                detectedLang = 'de'
            }

            // If detected language is different from what we initialized with (Browser), update and persist
            // Or if it's the same, we should probably persist it now so we don't check IP every time?
            // Let's persist it regardless to save the "auto-detected" preference
            setLanguage(detectedLang)
        }
    } catch (error) {
    }
}

export function setLanguage(lang: string, persist = true) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return

    // Update i18n instance
    // @ts-ignore
    i18n.global.locale.value = lang

    // Update HTML lang attribute
    document.documentElement.lang = lang

    // Persist
    if (persist) {
        localStorage.setItem(STORAGE_KEY, lang)
    }
}

export function getCurrentLanguage() {
    // @ts-ignore
    return i18n.global.locale.value
}
