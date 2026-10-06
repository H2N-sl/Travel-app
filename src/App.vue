<script setup lang="ts">
/**
 * ==============================================================================
 * FILE: src/App.vue (ROOT COMPONENT)
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT DOES THIS FILE DO?
 * ------------------------------------------------------------------------------
 * In Vue 3, "App.vue" is the main parent component of your whole application.
 * Think of it as the "traffic controller" or "master switch".
 * 
 * In addition to toggling between the Public Website and DMC Operations,
 * it now also:
 * 1. Initializes the Light/Dark mode theme state via `useTheme()`
 * 2. Applies the dynamic Whitelabel brand colors to CSS variables via `useCompany()`
 * 
 * ------------------------------------------------------------------------------
 * 🛠️ HOW TO MAKE MANUAL CHANGES:
 * - If you want the app to start directly on the DMC Operations Portal instead of
 *   the public website, change:
 *       const currentView = ref<'website' | 'operations'>('website');
 *   to:
 *       const currentView = ref<'website' | 'operations'>('operations');
 * ==============================================================================
 */

import { ref, onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { useCompany } from './composables/useCompany';
import PublicWebsite from './components/PublicWebsite.vue';
import OperationsPortal from './components/OperationsPortal.vue';

// 1. Initialize Theme & Brand Colors
const { initTheme } = useTheme();
const { applyBrandColors } = useCompany();

onMounted(() => {
  initTheme();
  applyBrandColors();
});

/**
 * ------------------------------------------------------------------------------
 * REACTIVE STATE: currentView
 * ------------------------------------------------------------------------------
 * 'currentView' keeps track of the currently active screen.
 * It can have only two possible values:
 *   - 'website'   -> Shows the tourist-facing Metshu Travels website.
 *   - 'operations'-> Shows the DMC reservation & back-office system.
 */
const currentView = ref<'website' | 'operations'>('website');
</script>

<template>
  <!-- 
    The outer container div:
    - Supports both Light & Dark modes:
      * Light: 'bg-slate-50 text-slate-900'
      * Dark:  'dark:bg-slate-950 dark:text-slate-100'
    - 'transition-colors duration-300': Smooth fade between light and dark themes
  -->
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-300">
    
    <!-- 
      VIEW 1: PUBLIC TRAVELS WEBSITE
    -->
    <PublicWebsite
      v-if="currentView === 'website'"
      @open-operations="currentView = 'operations'"
    />

    <!-- 
      VIEW 2: DMC OPERATIONS & RESERVATION PORTAL
    -->
    <OperationsPortal
      v-else-if="currentView === 'operations'"
      @back-to-website="currentView = 'website'"
    />

  </div>
</template>
