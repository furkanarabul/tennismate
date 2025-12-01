import i18n from '@/i18n'

const SUPPORTED_LANGUAGES = ['en', 'tr', 'de']
const DEFAULT_LANGUAGE = 'en'
const STORAGE_KEY = 'user-language'

export async function detectAndSetLanguage() {
    // 1. Check LocalStorage
    const storedLang = localStorage.getItem(STORAGE_KEY)
    if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
        setLanguage(storedLang)
        return
    }

    // 2. Check IP (if no stored preference)
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

            // Only set if it's different from default, or just set it to be explicit
            setLanguage(detectedLang)
            return
        }
    } catch (error) {
        console.warn('IP language detection failed:', error)
    }

    // 3. Fallback to Browser Language
    const browserLang = (navigator.language || DEFAULT_LANGUAGE).split('-')[0] || DEFAULT_LANGUAGE
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        setLanguage(browserLang)
    } else {
        setLanguage(DEFAULT_LANGUAGE)
    }
}

export function setLanguage(lang: string) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return

    // Update i18n instance
    // @ts-ignore
    i18n.global.locale.value = lang

    // Update HTML lang attribute
    document.documentElement.lang = lang

    // Persist
    localStorage.setItem(STORAGE_KEY, lang)
}

export function getCurrentLanguage() {
    // @ts-ignore
    return i18n.global.locale.value
}
