import { getColorTheme } from './color-themes'

/**
 * Apply a color theme to the document by loading its CSS variables
 * @param themeFilename - The filename of the theme to apply (e.g., 'default', 'amber-minimal')
 */
export async function applyColorTheme(themeFilename: string) {
  if (!themeFilename) return

  try {
    const theme = await getColorTheme(themeFilename)
    if (!theme || !theme.cssVars) return

    const root = document.documentElement

    // Clear all CSS variables from inline styles
    // This removes any old theme variables that might not exist in the new theme
    const allAttributes = root.getAttribute('style')
    if (allAttributes) {
      const vars = allAttributes.match(/--[a-z-]+/g) || []
      vars.forEach(varName => {
        root.style.removeProperty(varName)
      })
    }

    // Determine if dark mode is active
    const isDarkMode = root.classList.contains('dark')
    const themeVars = isDarkMode ? theme.cssVars.dark : theme.cssVars.light

    if (!themeVars) return

    // Apply CSS variables to the document root
    Object.entries(themeVars).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'string') {
        // Set border with !important to ensure it takes precedence
        if (key === 'border') {
          root.style.setProperty(`--${key}`, value, 'important')
        } else {
          root.style.setProperty(`--${key}`, value)
        }
      }
    })
  } catch (error) {
    console.error(`Failed to apply color theme "${themeFilename}":`, error)
  }
}
