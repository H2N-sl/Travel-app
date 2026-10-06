/**
 * ==============================================================================
 * FILE: src/composables/useTheme.ts
 * GLOBAL THEME COMPOSABLE (LIGHT & DARK MODE WITH PERSISTENCE)
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - HOW DOES DARK/LIGHT MODE WORK HERE?
 * ------------------------------------------------------------------------------
 * 1. STATE:
 *    - `theme.value` is either `'dark'` or `'light'`.
 * 
 * 2. TAILWIND CLASS STRATEGY:
 *    - When `theme.value === 'dark'`, we add the `class="dark"` attribute to the
 *      root `<html>` element (`document.documentElement.classList.add('dark')`).
 *    - In Tailwind CSS, any class starting with `dark:` (e.g. `dark:bg-slate-900`)
 *      only applies when that root `dark` class is present!
 *    - When switched to `'light'`, the `dark` class is removed, revealing the
 *      light mode styles (e.g. `bg-slate-50 text-slate-900`).
 * 
 * 3. PERSISTENCE & OS PREFERENCE:
 *    - On initial page boot, `initTheme()` checks:
 *      a) Did the user previously choose a theme? (saved in localStorage as `metshu_theme`)
 *      b) If not, it reads their system preference: `window.matchMedia('(prefers-color-scheme: dark)')`.
 *    - Every time the user clicks the theme toggle, their choice is saved to localStorage.
 */

import { ref, computed } from 'vue';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'metshu_travels_theme';

// Shared global reactive state
const currentTheme = ref<ThemeMode>('dark');
const isInitialized = ref(false);

/**
 * Applies the theme to the <html> document element and syncs localStorage
 */
function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }

  currentTheme.value = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage quota or private browsing guard
  }
}

/**
 * Initializes theme on app startup
 */
function initTheme(): void {
  if (isInitialized.value || typeof window === 'undefined') return;

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else {
      // Check system OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for OS preference changes if user hasn't explicitly set a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const savedOverride = localStorage.getItem(THEME_STORAGE_KEY);
      if (!savedOverride) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  } catch {
    applyTheme('dark');
  }

  isInitialized.value = true;
}

/**
 * Toggles between 'light' and 'dark'
 */
function toggleTheme(): void {
  const nextTheme: ThemeMode = currentTheme.value === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

/**
 * Sets an explicit theme mode
 */
function setTheme(mode: ThemeMode): void {
  applyTheme(mode);
}

export function useTheme() {
  // Ensure initialized
  if (!isInitialized.value && typeof window !== 'undefined') {
    initTheme();
  }

  return {
    theme: computed(() => currentTheme.value),
    isDark: computed(() => currentTheme.value === 'dark'),
    toggleTheme,
    setTheme,
    initTheme,
  };
}

export default useTheme;
