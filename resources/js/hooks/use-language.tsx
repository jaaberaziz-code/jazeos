import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { en, type Translations } from '../lang/en'
import { ar } from '../lang/ar'

type Locale = 'en' | 'ar'

interface LanguageContextType {
    locale: Locale
    t: Translations
    dir: 'ltr' | 'rtl'
    setLocale: (locale: Locale) => void
    toggleLocale: () => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const translations: Record<Locale, Translations> = { en, ar }
const dirs: Record<Locale, 'ltr' | 'rtl'> = { en: 'ltr', ar: 'rtl' }

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('jazeos-locale') as Locale | null
            if (saved === 'en' || saved === 'ar') return saved
        }
        return 'en'
    })

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l)
        localStorage.setItem('jazeos-locale', l)
        document.documentElement.dir = dirs[l]
        document.documentElement.lang = l === 'ar' ? 'ar' : 'en'
    }, [])

    const toggleLocale = useCallback(() => {
        setLocale(locale === 'en' ? 'ar' : 'en')
    }, [locale, setLocale])

    return (
        <LanguageContext.Provider
            value={{
                locale,
                t: translations[locale],
                dir: dirs[locale],
                setLocale,
                toggleLocale,
            }}
        >
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage(): LanguageContextType {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
}
