/**
 * Detects the user's preferred language from browser settings
 * @returns The detected language code (e.g., 'ja', 'en')
 */
export function detectUserLanguage(): string {
  if (typeof window === 'undefined') {
    return 'ja' // Default to Japanese on server
  }

  const browserLanguages = navigator.languages || [navigator.language]

  // Check if any of the browser's preferred languages start with 'ja' or 'en'
  for (const lang of browserLanguages) {
    if (lang.startsWith('ja')) {
      return 'ja'
    }
    if (lang.startsWith('en')) {
      return 'en'
    }
  }

  return 'ja' // Default to Japanese if no match
}
