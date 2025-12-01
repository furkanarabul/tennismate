import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import tr from './locales/tr.json'
import de from './locales/de.json'

// Type-safe schema definition
type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'tr' | 'de'>({
    legacy: false, // Use Composition API mode
    locale: 'en', // Default locale
    fallbackLocale: 'en',
    messages: {
        en,
        tr,
        de
    }
})

export default i18n
