<script setup lang="ts">
/**
 * ==============================================================================
 * FILE: src/components/ThemeToggle.vue
 * REUSABLE ACCESSIBLE THEME SWITCH (LIGHT / DARK MODE)
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE:
 * - This component provides an accessible Sun/Moon toggle button.
 * - Clicking it triggers `toggleTheme()` from `useTheme.ts`, which adds or removes
 *   the `.dark` class on `<html>` and updates `localStorage`.
 * - It can be placed anywhere: in the top announcement bar, navbar, footer, or sidebar!
 */

import { useTheme } from '../composables/useTheme';
import { Sun, Moon } from 'lucide-vue-next';

// Component props for visual flexibility
withDefaults(
  defineProps<{
    showLabel?: boolean;
    compact?: boolean;
  }>(),
  {
    showLabel: false,
    compact: false,
  }
);

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    @click="toggleTheme"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    class="relative inline-flex items-center gap-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
    :class="[
      compact
        ? 'p-1.5 text-xs'
        : 'p-2 text-sm',
      isDark
        ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/80 shadow-md shadow-slate-950/40'
        : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm'
    ]"
  >
    <!-- Sun Icon (Visible in Light Mode) -->
    <div
      v-if="!isDark"
      class="flex items-center gap-1.5 transition-transform duration-300 transform rotate-0"
    >
      <Sun class="w-4 h-4 text-amber-500 fill-amber-500/20" />
      <span v-if="showLabel" class="text-xs font-semibold text-slate-700">Light</span>
    </div>

    <!-- Moon Icon (Visible in Dark Mode) -->
    <div
      v-else
      class="flex items-center gap-1.5 transition-transform duration-300 transform rotate-0"
    >
      <Moon class="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
      <span v-if="showLabel" class="text-xs font-semibold text-slate-200">Dark</span>
    </div>
  </button>
</template>
