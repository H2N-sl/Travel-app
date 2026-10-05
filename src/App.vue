<script setup lang="ts">
/**
 * ==============================================================================
 * METSHU TRAVELS - ROOT APPLICATION CONTROLLER
 * ==============================================================================
 * 
 * Orchestrates two seamlessly connected views:
 * 1. Public Front Website ('website'):
 *    - Modeled directly on https://metshutravels.com/
 *    - Features: 5N/6D, 9N/10D, 14N/15D tour circuits, Day Excursions,
 *      Private Chauffeur Fleet, Why Choose Us, Guest Reviews,
 *      Interactive Custom Journey Planner (connected to /api/inquiries REST API),
 *      and direct WhatsApp quick chat (+94 74 394 2844).
 * 
 * 2. Working DMC Operations System ('operations'):
 *    - Back-office workspace for reservations, booking refs, agent directory,
 *      itinerary day schedule viewer, inquiries pipeline, and OpenAPI 3.0 specs.
 *    - Connects to Laravel 12 backend (http://127.0.0.1:8000/api) with automatic
 *      local storage mock fallback when offline.
 * ==============================================================================
 */

import { ref } from 'vue';
import PublicWebsite from './components/PublicWebsite.vue';
import OperationsPortal from './components/OperationsPortal.vue';

// Current active view state: starts on the public Metshu Travels website
const currentView = ref<'website' | 'operations'>('website');
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-600 selection:text-white">
    <!-- Public Metshu Travels Frontend Website -->
    <PublicWebsite
      v-if="currentView === 'website'"
      @open-operations="currentView = 'operations'"
    />

    <!-- DMC Operations & Working Systems Portal -->
    <OperationsPortal
      v-else-if="currentView === 'operations'"
      @back-to-website="currentView = 'website'"
    />
  </div>
</template>
