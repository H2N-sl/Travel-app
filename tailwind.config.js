/**
 * ==============================================================================
 * FILE: tailwind.config.js
 * ==============================================================================
 * 
 * 🔰 THEME & DARK MODE CONFIGURATION:
 * - 'darkMode: "class"': Activates Tailwind's 'dark:' classes whenever the <html>
 *   tag has the 'class="dark"' attribute (controlled by useTheme.ts & ThemeToggle.vue).
 * - 'colors.brand': Maps to CSS custom variables (--brand-primary, --brand-secondary)
 *   injected at runtime by useCompany.ts for instant whitelabel rebranding.
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #059669)',
          secondary: 'var(--brand-secondary, #0d9488)',
          accent: 'var(--brand-accent, #f59e0b)',
        }
      }
    },
  },
  plugins: [],
}
