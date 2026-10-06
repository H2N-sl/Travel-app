/**
 * ==============================================================================
 * FILE: src/composables/useCompany.ts
 * COMPOSABLE FOR WHITELABEL BRANDING & RUNTIME COLOR INJECTION
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT DOES THIS COMPOSABLE DO?
 * ------------------------------------------------------------------------------
 * This composable makes the company configuration available everywhere in Vue components:
 * 
 * ```ts
 * const { company, applyBrandColors } = useCompany();
 * console.log(company.name); // "Metshu Travels"
 * ```
 * 
 * It also includes `applyBrandColors()` which dynamically sets CSS variables on the
 * document root (`:root`). This means when you change `branding.colors.primary` in
 * `company.ts`, the entire app's buttons, icons, and highlights automatically change
 * their color without writing any extra CSS!
 */

import { reactive, readonly } from 'vue';
import { companyConfig, type CompanyConfig } from '../config/company';

// Reactive instance of the company configuration
const state = reactive<CompanyConfig>({ ...companyConfig });

/**
 * Injects brand hex colors as CSS custom properties into :root.
 * Allows Tailwind classes with `var(--brand-primary)` to update dynamically.
 */
function applyBrandColors(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const { colors } = state.branding;

  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-primary-hover', colors.primaryHover);
  root.style.setProperty('--brand-secondary', colors.secondary);
  root.style.setProperty('--brand-accent', colors.accent);
}

/**
 * Allows updating company details at runtime (e.g. from an admin settings panel)
 */
function updateCompany(newDetails: Partial<CompanyConfig>): void {
  Object.assign(state, newDetails);
  applyBrandColors();
}

export function useCompany() {
  return {
    company: readonly(state),
    applyBrandColors,
    updateCompany,
  };
}

export default useCompany;
