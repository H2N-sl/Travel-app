<script setup lang="ts">
/**
 * ==============================================================================
 * SERENDIB / METSHU DMC - OPERATIONS SYSTEM & BACK-OFFICE PORTAL
 * ==============================================================================
 * 
 * Features:
 * - Operations Dashboard (revenue metrics, active tours, agent statistics, inquiries)
 * - Bookings Management Data Table (with filtering, search, status, and itinerary inspector)
 * - Overseas Agents Directory & Registration
 * - Customer Trip Inquiries Pipeline (New, Contacted, Closed)
 * - OpenAPI 3.0 Endpoints & Laravel API Config modal
 * - Top button to return to the public website
 * ==============================================================================
 */

import { ref, computed, onMounted } from 'vue';
import {
  apiClient,
  getStoredApiBaseUrl,
  setStoredApiBaseUrl,
  type Agent,
  type Booking,
  type Inquiry,
  type NewAgent,
  type NewBooking,
} from '../services/api';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Plus,
  Compass,
  DollarSign,
  TrendingUp,
  MapPin,
  RefreshCw,
  Search,
  Code2,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Globe
} from 'lucide-vue-next';

// Emit event to return to public website
const emit = defineEmits<{
  (e: 'back-to-website'): void;
}>();

// State
const activeTab = ref<'dashboard' | 'bookings' | 'agents' | 'inquiries' | 'api-docs'>('dashboard');
const bookings = ref<Booking[]>([]);
const agents = ref<Agent[]>([]);
const inquiries = ref<Inquiry[]>([]);
const loading = ref(false);
const apiSource = ref<'laravel' | 'mock'>('mock');
const currentApiUrl = ref(getStoredApiBaseUrl());

// Connection testing
const isTestingConnection = ref(false);
const connectionTestResult = ref<{ isOnline: boolean; message: string; url: string } | null>(null);

// Search & Filter
const searchQuery = ref('');
const statusFilter = ref('ALL');

// Modals
const showBookingModal = ref(false);
const showAgentModal = ref(false);
const showItineraryModal = ref(false);
const showApiConfigModal = ref(false);
const selectedBooking = ref<Booking | null>(null);

// Forms
const bookingForm = ref<NewBooking>({
  agent_id: '',
  guest_name: '',
  nationality: 'British',
  pax_adults: 2,
  pax_children: 0,
  arrival_date: '2026-10-10',
  departure_date: '2026-10-17',
  arrival_flight: 'UL504 @ 12:40 PM',
  departure_flight: 'UL503 @ 02:15 PM',
  transport_type: 'Luxury AC Van (Toyota KDH)',
  driver_guide: 'Samantha Bandara (National Guide)',
  revenue_lkr: 2850000,
  special_requests: 'Honeymoon arrangement, vegetarian meal.'
});

const agentForm = ref<NewAgent>({
  code: '',
  name: '',
  country: 'United Kingdom',
  contact_person: '',
  email: '',
  phone: ''
});

const tempApiUrl = ref(currentApiUrl.value);

// Computed stats
const totalRevenue = computed(() => {
  return bookings.value.reduce((acc, b) => acc + (Number(b.revenue_lkr) || 0), 0);
});

const activeBookingsCount = computed(() => {
  return bookings.value.filter(b => b.status === 'In Operation' || b.status === 'Confirmed').length;
});

const filteredBookings = computed(() => {
  return bookings.value.filter(b => {
    const query = searchQuery.value.toLowerCase().trim();
    const matchesSearch =
      !query ||
      b.booking_number.toLowerCase().includes(query) ||
      b.guest_name.toLowerCase().includes(query) ||
      (b.agent?.name || '').toLowerCase().includes(query) ||
      b.nationality.toLowerCase().includes(query);

    const matchesStatus = statusFilter.value === 'ALL' || b.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Load all data
const loadData = async () => {
  loading.value = true;
  try {
    const [bookingsRes, agentsRes, inquiriesRes] = await Promise.all([
      apiClient.getBookings(),
      apiClient.getAgents(),
      apiClient.getInquiries()
    ]);
    bookings.value = bookingsRes.data;
    agents.value = agentsRes.data;
    inquiries.value = inquiriesRes.data;
    apiSource.value = bookingsRes.source;

    if (agents.value.length && !bookingForm.value.agent_id) {
      bookingForm.value.agent_id = agents.value[0].id;
    }
  } catch (error) {
    console.error('Failed to load operations data from API:', error);
  } finally {
    loading.value = false;
  }
};

// Create Booking
const submitBooking = async () => {
  try {
    await apiClient.createBooking(bookingForm.value);
    showBookingModal.value = false;
    bookingForm.value = {
      agent_id: agents.value[0]?.id || '',
      guest_name: '',
      nationality: 'British',
      pax_adults: 2,
      pax_children: 0,
      arrival_date: '2026-10-10',
      departure_date: '2026-10-17',
      arrival_flight: 'UL504 @ 12:40 PM',
      departure_flight: 'UL503 @ 02:15 PM',
      transport_type: 'Luxury AC Van (Toyota KDH)',
      driver_guide: 'Samantha Bandara (National Guide)',
      revenue_lkr: 2850000,
      special_requests: ''
    };
    await loadData();
  } catch (error) {
    console.error('Error creating booking via API:', error);
  }
};

// Create Agent
const submitAgent = async () => {
  try {
    await apiClient.createAgent(agentForm.value);
    showAgentModal.value = false;
    agentForm.value = {
      code: '',
      name: '',
      country: 'United Kingdom',
      contact_person: '',
      email: '',
      phone: ''
    };
    await loadData();
  } catch (error) {
    console.error('Error creating agent via API:', error);
  }
};

// Update Inquiry Status
const setInquiryStatus = async (id: number, status: Inquiry['status']) => {
  try {
    await apiClient.updateInquiryStatus(id, status);
    await loadData();
  } catch (error) {
    console.error('Error updating inquiry status via API:', error);
  }
};

// Open Itinerary
const openItinerary = (booking: Booking) => {
  selectedBooking.value = booking;
  showItineraryModal.value = true;
};

// Connection Test
const runConnectionTest = async () => {
  isTestingConnection.value = true;
  connectionTestResult.value = null;
  try {
    connectionTestResult.value = await apiClient.checkConnection();
  } finally {
    isTestingConnection.value = false;
  }
};

// Save API Base URL
const saveApiUrl = () => {
  setStoredApiBaseUrl(tempApiUrl.value);
  currentApiUrl.value = tempApiUrl.value;
  showApiConfigModal.value = false;
  connectionTestResult.value = null;
  loadData();
};

onMounted(loadData);
</script>

<template>
  <div class="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div class="p-5">
        <!-- Return to website button -->
        <button
          @click="emit('back-to-website')"
          class="w-full mb-4 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold py-2 px-3 rounded-lg border border-slate-700 transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>&larr; View Public Website</span>
        </button>

        <!-- Brand / Identity -->
        <div class="flex items-center space-x-3 pb-5 border-b border-slate-800">
          <div class="bg-emerald-600 p-2.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-950 flex items-center justify-center">
            <Compass class="w-5 h-5" />
          </div>
          <div>
            <h1 class="font-bold text-white text-sm tracking-wide">DMC Operations</h1>
            <p class="text-[11px] text-emerald-400 font-medium">Vue 3 + Laravel REST</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="mt-6 space-y-1 text-xs font-semibold">
          <button
            @click="activeTab = 'dashboard'"
            :class="activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            class="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2.5"
          >
            <LayoutDashboard class="w-4 h-4" />
            <span>Operations Dashboard</span>
          </button>

          <button
            @click="activeTab = 'bookings'"
            :class="activeTab === 'bookings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            class="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between"
          >
            <span class="flex items-center gap-2.5">
              <Calendar class="w-4 h-4" />
              <span>Bookings</span>
            </span>
            <span class="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-mono">{{ bookings.length }}</span>
          </button>

          <button
            @click="activeTab = 'agents'"
            :class="activeTab === 'agents' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            class="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between"
          >
            <span class="flex items-center gap-2.5">
              <Users class="w-4 h-4" />
              <span>Overseas Agents</span>
            </span>
            <span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-mono">{{ agents.length }}</span>
          </button>

          <button
            @click="activeTab = 'inquiries'"
            :class="activeTab === 'inquiries' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            class="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between"
          >
            <span class="flex items-center gap-2.5">
              <FileText class="w-4 h-4" />
              <span>Trip Inquiries</span>
            </span>
            <span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{{ inquiries.filter(i => i.status === 'New').length }}</span>
          </button>

          <button
            @click="activeTab = 'api-docs'"
            :class="activeTab === 'api-docs' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            class="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2.5"
          >
            <Code2 class="w-4 h-4" />
            <span>OpenAPI Endpoints</span>
          </button>
        </nav>
      </div>

      <!-- Sidebar Footer: Laravel Connection Status -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/60">
        <button
          @click="showApiConfigModal = true"
          class="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left"
          title="Click to configure or change the Laravel API URL"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="apiSource === 'laravel' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'"
            ></span>
            <div class="truncate">
              <p class="text-[11px] font-semibold text-white truncate">
                {{ apiSource === 'laravel' ? 'Laravel Connected' : 'Local Mock Active' }}
              </p>
              <p class="text-[10px] text-slate-400 truncate">{{ currentApiUrl }}</p>
            </div>
          </div>
          <Server class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Action Header -->
      <header class="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <button
            @click="emit('back-to-website')"
            class="lg:hidden text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1.5 rounded flex items-center gap-1"
          >
            <ArrowLeft class="w-3 h-3" />
            <span>Site</span>
          </button>
          <h2 class="text-sm font-bold text-white tracking-wide">DMC Tour Operations Workspace</h2>
          <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
            Laravel Ready
          </span>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex items-center gap-2.5">
          <button
            @click="loadData"
            :disabled="loading"
            class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Sync latest data from Laravel backend"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            <span>Sync</span>
          </button>

          <button
            @click="showAgentModal = true"
            class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5 text-slate-400" />
            <span>Register Agent</span>
          </button>

          <button
            @click="showBookingModal = true"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </header>

      <!-- Scrollable Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- TAB 1: OPERATIONS DASHBOARD -->
        <div v-if="activeTab === 'dashboard'" class="space-y-6 max-w-7xl mx-auto">
          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
              <div class="flex items-center justify-between text-slate-400">
                <span class="text-xs font-medium uppercase tracking-wider">Gross Bookings Revenue</span>
                <DollarSign class="w-4 h-4 text-emerald-400" />
              </div>
              <p class="text-2xl font-bold font-mono text-white mt-2">LKR {{ totalRevenue.toLocaleString() }}</p>
              <p class="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp class="w-3 h-3" /> Average margin: ~25%
              </p>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
              <div class="flex items-center justify-between text-slate-400">
                <span class="text-xs font-medium uppercase tracking-wider">Active Tours</span>
                <Calendar class="w-4 h-4 text-sky-400" />
              </div>
              <p class="text-2xl font-bold font-mono text-white mt-2">{{ activeBookingsCount }}</p>
              <p class="text-[11px] text-slate-400 mt-1">Confirmed &amp; in-operation circuits</p>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
              <div class="flex items-center justify-between text-slate-400">
                <span class="text-xs font-medium uppercase tracking-wider">Partner Tour Agents</span>
                <Users class="w-4 h-4 text-amber-400" />
              </div>
              <p class="text-2xl font-bold font-mono text-white mt-2">{{ agents.length }}</p>
              <p class="text-[11px] text-slate-400 mt-1">Overseas tour operators</p>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
              <div class="flex items-center justify-between text-slate-400">
                <span class="text-xs font-medium uppercase tracking-wider">Pending Inquiries</span>
                <FileText class="w-4 h-4 text-rose-400" />
              </div>
              <p class="text-2xl font-bold font-mono text-white mt-2">{{ inquiries.filter(i => i.status === 'New').length }}</p>
              <p class="text-[11px] text-amber-400 mt-1">From metshutravels.com website</p>
            </div>
          </div>

          <!-- Preview Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-white">Recent Operations</h3>
                <button @click="activeTab = 'bookings'" class="text-xs text-emerald-400 hover:underline">
                  View Full Table &rarr;
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th class="pb-2">Booking Ref</th>
                      <th class="pb-2">Guest</th>
                      <th class="pb-2">Arrival</th>
                      <th class="pb-2">Status</th>
                      <th class="pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-300">
                    <tr v-for="b in bookings.slice(0, 5)" :key="b.id" class="hover:bg-slate-800/40">
                      <td class="py-3 font-mono font-bold text-emerald-400">{{ b.booking_number }}</td>
                      <td class="py-3 font-medium text-white">{{ b.guest_name }}</td>
                      <td class="py-3 font-mono text-slate-400">{{ b.arrival_date }}</td>
                      <td class="py-3">
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {{ b.status }}
                        </span>
                      </td>
                      <td class="py-3 text-right font-mono font-bold text-white">
                        LKR {{ Number(b.revenue_lkr).toLocaleString() }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Backend Connection Status Card -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Laravel REST API</h3>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded font-mono font-semibold"
                    :class="apiSource === 'laravel' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'"
                  >
                    {{ apiSource === 'laravel' ? 'CONNECTED' : 'LOCAL MOCK' }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                  Target endpoint: <code class="text-emerald-400 font-mono text-[11px]">{{ currentApiUrl }}</code>. When Laravel is running on port 8000, click test connection to verify.
                </p>

                <div class="mt-4 pt-3 border-t border-slate-800">
                  <button
                    @click="runConnectionTest"
                    :disabled="isTestingConnection"
                    class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Activity class="w-3.5 h-3.5 text-emerald-400" :class="{ 'animate-pulse': isTestingConnection }" />
                    <span>{{ isTestingConnection ? 'Testing Connection...' : 'Test Backend Connection' }}</span>
                  </button>

                  <div
                    v-if="connectionTestResult"
                    class="mt-2 p-2 rounded text-[11px] flex items-start gap-2"
                    :class="connectionTestResult.isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
                  >
                    <component :is="connectionTestResult.isOnline ? CheckCircle2 : AlertTriangle" class="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{{ connectionTestResult.message }}</span>
                  </div>
                </div>
              </div>

              <button
                @click="showApiConfigModal = true"
                class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Server class="w-3.5 h-3.5 text-emerald-400" />
                <span>Change API Base URL</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: BOOKINGS TABLE -->
        <div v-else-if="activeTab === 'bookings'" class="space-y-4 max-w-7xl mx-auto">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div class="flex items-center gap-2 flex-1 max-w-md bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <Search class="w-4 h-4 text-slate-500" />
              <input
                v-model="searchQuery"
                placeholder="Search booking ref, guest name, agent code..."
                class="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
              />
            </div>

            <div class="flex items-center gap-2">
              <select
                v-model="statusFilter"
                class="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Operation">In Operation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                @click="showBookingModal = true"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>New Booking</span>
              </button>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-semibold tracking-wider">
                  <tr>
                    <th class="p-4">Booking Ref</th>
                    <th class="p-4">Agent</th>
                    <th class="p-4">Guest Name</th>
                    <th class="p-4">Pax</th>
                    <th class="p-4">Dates</th>
                    <th class="p-4">Transport &amp; Guide</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-right">Revenue (LKR)</th>
                    <th class="p-4 text-center">Itinerary</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-300">
                  <tr v-for="b in filteredBookings" :key="b.id" class="hover:bg-slate-800/40 transition-colors">
                    <td class="p-4 font-mono font-bold text-emerald-400">{{ b.booking_number }}</td>
                    <td class="p-4 font-medium text-slate-200">
                      {{ b.agent ? b.agent.name : 'Direct Booking' }}
                      <span v-if="b.agent" class="text-[10px] text-slate-500 block font-mono">({{ b.agent.code }})</span>
                    </td>
                    <td class="p-4">
                      <span class="font-semibold text-white block">{{ b.guest_name }}</span>
                      <span class="text-[10px] text-slate-400">{{ b.nationality }}</span>
                    </td>
                    <td class="p-4 font-mono text-[11px]">{{ b.pax_adults }}A / {{ b.pax_children }}C</td>
                    <td class="p-4 font-mono text-[11px] text-slate-400">
                      {{ b.arrival_date }} &rarr; {{ b.departure_date }}
                    </td>
                    <td class="p-4 text-[11px] text-slate-300">
                      <p class="truncate max-w-[140px]">{{ b.transport_type }}</p>
                      <p class="text-[10px] text-slate-500 truncate max-w-[140px]">{{ b.driver_guide }}</p>
                    </td>
                    <td class="p-4">
                      <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {{ b.status }}
                      </span>
                    </td>
                    <td class="p-4 text-right font-mono font-bold text-white">
                      {{ Number(b.revenue_lkr).toLocaleString() }}
                    </td>
                    <td class="p-4 text-center">
                      <button
                        @click="openItinerary(b)"
                        class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                      >
                        {{ b.itinerary_days?.length || 0 }} Days
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: AGENTS -->
        <div v-else-if="activeTab === 'agents'" class="space-y-4 max-w-7xl mx-auto">
          <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 class="text-sm font-bold text-white">Overseas Travel Agents</h3>
              <p class="text-xs text-slate-400">Registered wholesalers and tour operators</p>
            </div>
            <button
              @click="showAgentModal = true"
              class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Register New Agent</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="a in agents"
              :key="a.id"
              class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div>
                  <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    CODE: {{ a.code }}
                  </span>
                  <h4 class="font-bold text-white text-sm mt-2">{{ a.name }}</h4>
                  <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin class="w-3 h-3 text-emerald-400" /> {{ a.country }}
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-500 uppercase font-semibold">Sequence</span>
                  <p class="text-xs font-mono font-bold text-white">#{{ a.current_seq }}</p>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                <p><span class="text-slate-500">Contact:</span> {{ a.contact_person }}</p>
                <p><span class="text-slate-500">Email:</span> <a :href="'mailto:' + a.email" class="text-emerald-400 hover:underline">{{ a.email }}</a></p>
                <p><span class="text-slate-500">Phone:</span> {{ a.phone }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: INQUIRIES -->
        <div v-else-if="activeTab === 'inquiries'" class="space-y-4 max-w-7xl mx-auto">
          <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-white">Customer Trip Inquiries</h3>
              <p class="text-xs text-slate-400">Direct inquiries from website journey planner</p>
            </div>
            <span class="text-xs font-mono text-slate-400">Total: {{ inquiries.length }}</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="inq in inquiries"
              :key="inq.id"
              class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 class="font-bold text-white text-sm">{{ inq.full_name }}</h4>
                  <p class="text-xs text-slate-400">{{ inq.nationality }} &bull; {{ inq.travelers }} Travellers &bull; <a :href="'mailto:' + inq.email" class="text-emerald-400 hover:underline">{{ inq.email }}</a></p>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border"
                    :class="{
                      'bg-rose-500/10 text-rose-400 border-rose-500/30': inq.status === 'New',
                      'bg-amber-500/10 text-amber-400 border-amber-500/30': inq.status === 'Contacted',
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': inq.status === 'Closed'
                    }"
                  >
                    {{ inq.status }}
                  </span>

                  <div class="flex items-center gap-1">
                    <button
                      v-if="inq.status !== 'Contacted'"
                      @click="setInquiryStatus(inq.id, 'Contacted')"
                      class="bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-semibold px-2 py-1 rounded"
                    >
                      Mark Contacted
                    </button>
                    <button
                      v-if="inq.status !== 'Closed'"
                      @click="setInquiryStatus(inq.id, 'Closed')"
                      class="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded"
                    >
                      Mark Closed
                    </button>
                  </div>
                </div>
              </div>

              <div class="text-xs text-slate-300 space-y-1">
                <p><span class="text-slate-500">Dates:</span> {{ inq.arrival_date }} &rarr; {{ inq.departure_date }}</p>
                <p><span class="text-slate-500">Package Interest:</span> <span class="text-emerald-400 font-semibold">{{ inq.package_interest }}</span></p>
                <p><span class="text-slate-500">Interests:</span> {{ inq.interests }}</p>
                <p class="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mt-2 text-slate-300 italic">
                  "{{ inq.message }}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 5: OPENAPI SPECS -->
        <div v-else-if="activeTab === 'api-docs'" class="space-y-6 max-w-7xl mx-auto">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <Code2 class="w-5 h-5 text-emerald-400" />
                  <span>OpenAPI 3.0 Endpoints Specification</span>
                </h3>
                <p class="text-xs text-slate-400 mt-1">
                  Ready-to-use contracts for the separate Laravel backend developer.
                </p>
              </div>

              <button
                @click="showApiConfigModal = true"
                class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Server class="w-3.5 h-3.5 text-emerald-400" />
                <span>Configure API URL</span>
              </button>
            </div>

            <div class="border border-slate-800 rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-sans font-semibold">
                  <tr>
                    <th class="p-3">Method</th>
                    <th class="p-3">URI Endpoint</th>
                    <th class="p-3 font-sans">Laravel Controller Action</th>
                    <th class="p-3 font-sans">Payload / Response</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-300">
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span></td>
                    <td class="p-3 text-white">/api/agents</td>
                    <td class="p-3 font-sans text-slate-400">AgentController@index — Return all agents</td>
                    <td class="p-3 text-slate-400">response()->json(Agent::all(), 200)</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">POST</span></td>
                    <td class="p-3 text-white">/api/agents</td>
                    <td class="p-3 font-sans text-slate-400">AgentController@store — Register new agent</td>
                    <td class="p-3 text-slate-400">Validates request, returns 201 Created</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span></td>
                    <td class="p-3 text-white">/api/bookings</td>
                    <td class="p-3 font-sans text-slate-400">BookingController@index — With eager relations</td>
                    <td class="p-3 text-slate-400">Booking::with(['agent', 'itineraryDays'])->latest()->get()</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">POST</span></td>
                    <td class="p-3 text-white">/api/bookings</td>
                    <td class="p-3 font-sans text-slate-400">BookingController@store — Generate seq &amp; Day 1 plan</td>
                    <td class="p-3 text-slate-400">Auto-generates {CODE}-{YEAR}-{0001} reference &rarr; 201</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">PUT</span></td>
                    <td class="p-3 text-white">/api/bookings/{id}/itinerary</td>
                    <td class="p-3 font-sans text-slate-400">BookingController@updateItinerary — Replace days</td>
                    <td class="p-3 text-slate-400">Body: { days: [...] } &rarr; 200 JSON</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span></td>
                    <td class="p-3 text-white">/api/inquiries</td>
                    <td class="p-3 font-sans text-slate-400">InquiryController@index — Client journey inquiries</td>
                    <td class="p-3 text-slate-400">response()->json(Inquiry::latest()->get(), 200)</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">POST</span></td>
                    <td class="p-3 text-white">/api/inquiries</td>
                    <td class="p-3 font-sans text-slate-400">InquiryController@store — Customer submissions</td>
                    <td class="p-3 text-slate-400">Body: { full_name, email, ... } &rarr; 201 JSON</td>
                  </tr>
                  <tr class="hover:bg-slate-800/30">
                    <td class="p-3"><span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold">PATCH</span></td>
                    <td class="p-3 text-white">/api/inquiries/{id}/status</td>
                    <td class="p-3 font-sans text-slate-400">InquiryController@updateStatus — Set status</td>
                    <td class="p-3 text-slate-400">Body: { status: 'New' | 'Contacted' | 'Closed' }</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL 1: CREATE BOOKING -->
    <div v-if="showBookingModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl p-6 space-y-4 text-xs">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-bold text-white text-sm">Create New Tour Reservation</h3>
          <button @click="showBookingModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <form @submit.prevent="submitBooking" class="space-y-3">
          <div>
            <label class="block text-slate-400 mb-1">Select Overseas Agent</label>
            <select v-model="bookingForm.agent_id" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
              <option v-for="a in agents" :key="a.id" :value="a.id">
                {{ a.name }} ({{ a.code }}) - {{ a.country }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Guest Full Name</label>
              <input v-model="bookingForm.guest_name" required placeholder="e.g. Mr. David Smith & Family" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Nationality</label>
              <input v-model="bookingForm.nationality" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Adults</label>
              <input v-model.number="bookingForm.pax_adults" type="number" min="1" max="50" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Children</label>
              <input v-model.number="bookingForm.pax_children" type="number" min="0" max="30" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Arrival Date</label>
              <input v-model="bookingForm.arrival_date" type="date" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Departure Date</label>
              <input v-model="bookingForm.departure_date" type="date" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Transport Vehicle</label>
              <input v-model="bookingForm.transport_type" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Driver / Chauffeur-Guide</label>
              <input v-model="bookingForm.driver_guide" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Total Agreed Revenue (LKR)</label>
            <input v-model.number="bookingForm.revenue_lkr" type="number" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Special Requests / Notes</label>
            <textarea v-model="bookingForm.special_requests" rows="2" placeholder="Dietary restrictions, honeymoon cakes, room preferences..." class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white resize-none"></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button type="button" @click="showBookingModal = false" class="bg-slate-800 px-4 py-2 rounded text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-white font-semibold shadow-lg shadow-emerald-950">Save Reservation</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: REGISTER AGENT -->
    <div v-if="showAgentModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 text-xs">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-bold text-white text-sm">Register Overseas Travel Agent</h3>
          <button @click="showAgentModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <form @submit.prevent="submitAgent" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Agent Code (e.g. LON, ABC)</label>
              <input v-model="agentForm.code" required maxlength="6" uppercase placeholder="LON" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono uppercase" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Country</label>
              <input v-model="agentForm.country" required placeholder="United Kingdom" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Company / Agency Name</label>
            <input v-model="agentForm.name" required placeholder="e.g. London Bespoke Escapes Ltd" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Contact Person</label>
            <input v-model="agentForm.contact_person" required placeholder="e.g. Sarah Jenkins" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Email</label>
            <input v-model="agentForm.email" type="email" required placeholder="agent@agency.co.uk" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Phone</label>
            <input v-model="agentForm.phone" required placeholder="+44 20 7946 0912" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button type="button" @click="showAgentModal = false" class="bg-slate-800 px-4 py-2 rounded text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-white font-semibold shadow-lg shadow-emerald-950">Register Agent</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: ITINERARY DETAILS -->
    <div v-if="showItineraryModal && selectedBooking" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 space-y-4 text-xs max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 class="font-bold text-white text-sm">
              Itinerary Schedule: <span class="font-mono text-emerald-400">{{ selectedBooking.booking_number }}</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ selectedBooking.guest_name }} &bull; {{ selectedBooking.pax_adults }} Adults, {{ selectedBooking.pax_children }} Children</p>
          </div>
          <button @click="showItineraryModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div
            v-for="(day, idx) in selectedBooking.itinerary_days"
            :key="day.id || idx"
            class="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-1.5"
          >
            <div class="flex items-center justify-between text-slate-400 font-mono text-[11px]">
              <span class="text-emerald-400 font-bold uppercase">Day {{ day.day_number || idx + 1 }} &bull; {{ day.destination }}</span>
              <span>{{ day.date }}</span>
            </div>
            <p class="font-semibold text-white text-xs">Hotel: {{ day.hotel_name }} ({{ day.meals }})</p>
            <p class="text-slate-300 text-xs">{{ day.activities }}</p>
            <p class="text-[10px] text-slate-500 font-mono">Transport: {{ day.transport }}</p>
          </div>
        </div>

        <div class="flex justify-end pt-3 border-t border-slate-800">
          <button @click="showItineraryModal = false" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-semibold">
            Close Itinerary
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: CONFIGURE API BASE URL & TEST LARAVEL -->
    <div v-if="showApiConfigModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 text-xs">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-bold text-white text-sm flex items-center gap-2">
            <Server class="w-4 h-4 text-emerald-400" />
            <span>Configure Backend Target URL</span>
          </h3>
          <button @click="showApiConfigModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <p class="text-xs text-slate-400 leading-relaxed">
          Point the Vue 3 frontend to your running Laravel REST API server or use the built-in mock database.
        </p>

        <div class="space-y-3">
          <div>
            <label class="block text-slate-400 mb-1">API Base URL</label>
            <input
              v-model="tempApiUrl"
              placeholder="http://127.0.0.1:8000/api"
              class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              @click="tempApiUrl = 'http://127.0.0.1:8000/api'"
              class="flex-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-2 rounded text-slate-300 text-[11px] font-mono text-center transition-colors"
            >
              Laravel (127.0.0.1:8000)
            </button>
            <button
              type="button"
              @click="tempApiUrl = '/api'"
              class="flex-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-2 rounded text-slate-300 text-[11px] font-mono text-center transition-colors"
            >
              Local Mock (/api)
            </button>
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
          <button @click="showApiConfigModal = false" class="bg-slate-800 px-4 py-2 rounded text-slate-300 hover:bg-slate-700">Cancel</button>
          <button @click="saveApiUrl" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-white font-semibold shadow-lg shadow-emerald-950">
            Apply &amp; Reconnect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
