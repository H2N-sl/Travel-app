<script setup lang="ts">
/**
 * ==============================================================================
 * SERENDIB / METSHU DMC - OPERATIONS SYSTEM & COMPLETE 6-STAGE LIFECYCLE
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT IS A DMC AND HOW DOES THIS PORTAL WORK?
 * ------------------------------------------------------------------------------
 * What is a "DMC"?
 * DMC stands for "Destination Management Company".
 * In tourism, overseas travel agents (in the UK, Germany, France, etc.) sell Sri Lanka
 * holidays to tourists, but they don't own vehicles or hotels in Sri Lanka.
 * Instead, they partner with a local DMC (like Serendib / Metshu Travels) on the ground
 * to handle everything:
 *   - Meet tourists at Colombo Airport (CMB)
 *   - Provide luxury vehicles & certified chauffeur guides
 *   - Book hotels & negotiate room rates
 *   - Issue vouchers and handle guest emergencies 24/7
 * 
 * ------------------------------------------------------------------------------
 * THE 6-STAGE TRAVEL RESERVATION PIPELINE:
 * 1. Inquiry Intake:
 *    - Captures website leads or incoming emails from overseas agents.
 *    - Creates an initial master Booking record with party size and travel dates.
 * 
 * 2. Itinerary & Resource Allocation:
 *    - Builds the day-by-day sequence of destinations (Kandy, Ella, Yala, Galle).
 *    - Allocates partner hotels, room categories, and meal plans (RO, BB, HB, FB, AI).
 *    - Assigns private vehicles (Toyota KDH Van) and certified chauffeur guides.
 * 
 * 3. Quotation & Costing Engine:
 *    - Calculates net supplier expenses (hotels + transport + guides + activities).
 *    - Applies DMC profit markup margin (e.g. 20% to 30%).
 *    - Generates client-facing quotations in LKR, USD, EUR, or GBP.
 * 
 * 4. Billing, Invoicing & Payment Processing:
 *    - Issues pro-forma invoices.
 *    - Records deposit transactions (30%) and balance settlements (70%).
 *    - Supports Stripe, PayHere, and international bank wire transfers.
 * 
 * 5. Confirmation & Service Vouchers:
 *    - Generates official Hotel Check-in Vouchers and Driver Duty Slips.
 *    - Includes anti-fraud verification tokens and QR code mobile verification links!
 * 
 * 6. Automated Client Documents:
 *    - Generates Guest Welcome Letters (meeting point instructions, emergency contacts).
 *    - Generates DMC Travel Agreements (terms, cancellation policies).
 *    - Generates Post-Trip Thank-You letters & feedback surveys.
 * 
 * ------------------------------------------------------------------------------
 * 🛠️ HOW TO MAKE MANUAL CHANGES:
 * - Change default markup margin: see `quoteMarkup` (defaults to 25%).
 * - Change default currency: see `quoteCurrency` (defaults to 'LKR').
 * - Connect to your local Laravel server: click the "API Connection" button in the
 *   top-right of this portal and type `http://127.0.0.1:8000/api`.
 * ==============================================================================
 */

// Step 1: Import Vue reactivity and lifecycle hooks
// - 'ref': creates reactive variables that automatically update the UI.
// - 'computed': creates auto-calculated values (like total revenue or active booking counts).
// - 'onMounted': runs automatically when this component first loads onto the screen.
import { ref, computed, onMounted } from 'vue';
import { useCompany } from '../composables/useCompany';
import ThemeToggle from './ThemeToggle.vue';

// Step 2: Import our REST API client service and TypeScript interfaces
import {
  apiClient,
  getStoredApiBaseUrl,
  setStoredApiBaseUrl,
  type Agent,
  type Booking,
  type Inquiry,
  type NewAgent,
  type NewBooking,
  type LifecycleStage,
  type ServiceVoucher
} from '../services/api';

// Step 3: Import Lucide icons used for dashboards, tabs, and documents
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
  Check,
  CreditCard,
  QrCode,
  Printer,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  FileCheck,
  Send,
  Car
} from 'lucide-vue-next';

/**
 * Event emitter:
 * Tells the parent App.vue when the staff member clicks "← View Public Website"
 * so the view switches back to the tourist website.
 */
const emit = defineEmits<{
  (e: 'back-to-website'): void;
}>();

// Whitelabel Company Branding
const { company } = useCompany();

// ==============================================================================
// REACTIVE STATE (DATA VARIABLES)
// ==============================================================================

// Main Navigation Tab: controls which screen is currently displayed in the portal:
// 'dashboard' | 'bookings' | 'lifecycle' | 'agents' | 'inquiries' | 'api-docs'
const activeTab = ref<'dashboard' | 'bookings' | 'lifecycle' | 'agents' | 'inquiries' | 'api-docs'>('dashboard');

// Lists holding data fetched from the API backend
const bookings = ref<Booking[]>([]);   // All bookings
const agents = ref<Agent[]>([]);       // All overseas wholesale partners
const inquiries = ref<Inquiry[]>([]); // All customer leads from website

// UI Status indicators
const loading = ref(false);            // Shows spinner while loading data
const apiSource = ref<'laravel' | 'mock'>('mock'); // Indicates whether data came from Laravel or fallback mock
const currentApiUrl = ref(getStoredApiBaseUrl());   // Current backend base URL

// Connection testing modal state
const isTestingConnection = ref(false);
const connectionTestResult = ref<{ isOnline: boolean; message: string; url: string } | null>(null);

// Search & Filter state for the Bookings Table
const searchQuery = ref('');
const statusFilter = ref('ALL');

// Selected Booking for the 6-Stage Lifecycle Workspace
// When a staff member clicks a booking, it becomes 'activeBooking'
const activeBooking = ref<Booking | null>(null);

// Which stage tab (1, 2, 3, 4, 5, or 6) is currently active inside the lifecycle workspace
const currentStageTab = ref<number>(1);

// Costing / Quotation Engine State (Stage 3)
const quoteMarkup = ref<number>(25); // Default profit margin (25%)
const quoteCurrency = ref<'LKR' | 'USD' | 'EUR' | 'GBP'>('LKR');
const quoteCalculation = ref<any>(null);

// Payment Recording Form (Stage 4)
const paymentForm = ref({
  amount: 855000,
  currency: 'LKR' as const,
  type: 'deposit' as const,
  method: 'stripe' as const,
  reference: '',
  notes: ''
});

// Generated Vouchers & Document State (Stages 5 & 6)
const generatedVouchers = ref<ServiceVoucher[]>([]);
const activeDocType = ref<'welcome_letter' | 'travel_agreement' | 'thank_you_survey' | 'quotation'>('welcome_letter');
const activeDocContent = ref<any>(null);

// Modal popups visibility
const showBookingModal = ref(false);   // + New Booking modal
const showAgentModal = ref(false);     // + Register Agent modal
const showApiConfigModal = ref(false); // API Settings modal

// New Booking Form Data
const bookingForm = ref<NewBooking>({
  agent_id: '',
  guest_name: '',
  nationality: 'British',
  pax_adults: 2,
  pax_children: 0,
  pax_infants: 0,
  arrival_date: '2026-10-10',
  departure_date: '2026-10-17',
  arrival_flight: 'UL504 @ 12:40 PM',
  departure_flight: 'UL503 @ 02:15 PM',
  transport_type: 'Luxury AC Van (Toyota KDH)',
  driver_guide: 'Samantha Bandara (National Guide)',
  revenue_lkr: 2850000,
  special_requests: 'Honeymoon arrangement, vegetarian meal.'
});

// New Agent Form Data
const agentForm = ref<NewAgent>({
  code: '',
  name: '',
  country: 'United Kingdom',
  contact_person: '',
  email: '',
  phone: ''
});

// Temporary URL input in the API configuration modal
const tempApiUrl = ref(currentApiUrl.value);

// ==============================================================================
// COMPUTED PROPERTIES (AUTO-CALCULATED VALUES)
// ==============================================================================

/**
 * totalRevenue:
 * Sums up the revenue of all bookings in the system.
 */
const totalRevenue = computed(() => {
  return bookings.value.reduce((acc, b) => acc + (Number(b.revenue_lkr) || 0), 0);
});

/**
 * activeBookingsCount:
 * Counts bookings that are currently in progress ('In Operation' or 'Confirmed').
 */
const activeBookingsCount = computed(() => {
  return bookings.value.filter(b => b.status === 'In Operation' || b.status === 'Confirmed').length;
});

/**
 * filteredBookings:
 * Filters the bookings list based on the search input box and status filter dropdown.
 */
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

// ==============================================================================
// METHODS & OPERATIONS LOGIC
// ==============================================================================

/**
 * loadData():
 * Fetches bookings, agents, and inquiries concurrently from the API.
 * Runs automatically on page load via `onMounted(loadData)`.
 */
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

    // Automatically select first booking if none is active
    if (!activeBooking.value && bookings.value.length) {
      activeBooking.value = bookings.value[0];
    }

    // Pre-fill agent in new booking form
    if (agents.value.length && !bookingForm.value.agent_id) {
      bookingForm.value.agent_id = agents.value[0].id;
    }
  } catch (error) {
    console.error('Failed to load operations data from API:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * openLifecycleWorkspace(booking, stageNumber):
 * Opens a booking inside the 6-Stage Lifecycle Workspace.
 * Automatically loads its quotation breakdown, vouchers, and client documents.
 */
const openLifecycleWorkspace = async (b: Booking, stageNumber = 1) => {
  activeBooking.value = b;
  currentStageTab.value = stageNumber;
  activeTab.value = 'lifecycle';
  await refreshLifecycleData(b.id);
};

/**
 * refreshLifecycleData(bookingId):
 * Calls the API to calculate quote numbers, generate vouchers, and fetch documents.
 */
const refreshLifecycleData = async (bookingId: number) => {
  const [quoteRes, vouchersRes, docRes] = await Promise.all([
    apiClient.calculateQuote(bookingId, { markup_percentage: quoteMarkup.value, target_currency: quoteCurrency.value }),
    apiClient.getVouchers(bookingId),
    apiClient.getDocument(bookingId, activeDocType.value)
  ]);
  quoteCalculation.value = quoteRes.data;
  generatedVouchers.value = vouchersRes.data;
  activeDocContent.value = docRes.data;
};

/**
 * handleRecalculateQuote():
 * Re-runs the financial calculation when staff adjust the markup margin (e.g. 20% -> 30%).
 */
const handleRecalculateQuote = async () => {
  if (!activeBooking.value) return;
  const res = await apiClient.calculateQuote(activeBooking.value.id, {
    markup_percentage: quoteMarkup.value,
    target_currency: quoteCurrency.value
  });
  quoteCalculation.value = res.data;
  await loadData();
};

/**
 * handleRecordPayment():
 * Logs a payment (deposit, balance, or full settlement) for the active booking.
 * Automatically advances the booking stage once paid!
 */
const handleRecordPayment = async () => {
  if (!activeBooking.value) return;
  await apiClient.recordPayment(activeBooking.value.id, paymentForm.value);
  paymentForm.value.reference = '';
  paymentForm.value.notes = '';
  await loadData();
  const updated = bookings.value.find(b => b.id === activeBooking.value?.id);
  if (updated) activeBooking.value = updated;
};

/**
 * loadDocumentType(type):
 * Switches between 'welcome_letter', 'travel_agreement', and 'thank_you_survey'.
 */
const loadDocumentType = async (type: 'welcome_letter' | 'travel_agreement' | 'thank_you_survey' | 'quotation') => {
  if (!activeBooking.value) return;
  activeDocType.value = type;
  const res = await apiClient.getDocument(activeBooking.value.id, type);
  activeDocContent.value = res.data;
};

/**
 * advanceStage(stage):
 * Manually advances the active booking to another stage in the 6-stage lifecycle.
 */
const advanceStage = async (stage: LifecycleStage) => {
  if (!activeBooking.value) return;
  await apiClient.updateLifecycleStage(activeBooking.value.id, stage);
  await loadData();
  const updated = bookings.value.find(b => b.id === activeBooking.value?.id);
  if (updated) activeBooking.value = updated;
};

/**
 * submitBooking():
 * Submits the "+ New Booking" form to POST /api/bookings.
 * Automatically creates unique booking code ({CODE}-{YEAR}-{0001}),
 * calculates expenses, adds Day 1 itinerary, and opens the lifecycle workspace!
 */
const submitBooking = async () => {
  try {
    const res = await apiClient.createBooking(bookingForm.value);
    showBookingModal.value = false;
    bookingForm.value = {
      agent_id: agents.value[0]?.id || '',
      guest_name: '',
      nationality: 'British',
      pax_adults: 2,
      pax_children: 0,
      pax_infants: 0,
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
    openLifecycleWorkspace(res.data, 1);
  } catch (error) {
    console.error('Error creating booking via API:', error);
  }
};

/**
 * submitAgent():
 * Submits the "+ Register Agent" form to POST /api/agents.
 */
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

/**
 * setInquiryStatus(id, status):
 * Updates inquiry status (New -> Contacted -> Closed) via PATCH /api/inquiries/{id}/status.
 */
const setInquiryStatus = async (id: number, status: Inquiry['status']) => {
  try {
    await apiClient.updateInquiryStatus(id, status);
    await loadData();
  } catch (error) {
    console.error('Error updating inquiry status via API:', error);
  }
};

/**
 * runConnectionTest():
 * Pings the Laravel REST API server to verify if it is reachable.
 */
const runConnectionTest = async () => {
  isTestingConnection.value = true;
  connectionTestResult.value = null;
  try {
    connectionTestResult.value = await apiClient.checkConnection();
  } finally {
    isTestingConnection.value = false;
  }
};

/**
 * saveApiUrl():
 * Saves the custom API URL in localStorage and reloads data.
 */
const saveApiUrl = () => {
  setStoredApiBaseUrl(tempApiUrl.value);
  currentApiUrl.value = tempApiUrl.value;
  showApiConfigModal.value = false;
  connectionTestResult.value = null;
  loadData();
};

// Lifecycle Hook: Load initial data when component mounts
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
            <h1 class="font-bold text-white text-sm tracking-wide uppercase">{{ company.shortName }} Operations</h1>
            <p class="text-[11px] text-emerald-400 font-medium">6-Stage Lifecycle Engine</p>
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
              <span>Bookings Registry</span>
            </span>
            <span class="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-mono">{{ bookings.length }}</span>
          </button>

          <!-- 6-Stage Lifecycle Workspace -->
          <button
            @click="activeTab = 'lifecycle'"
            :class="activeTab === 'lifecycle' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
            class="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between"
          >
            <span class="flex items-center gap-2.5">
              <Sparkles class="w-4 h-4 text-amber-400" />
              <span>Lifecycle Pipeline</span>
            </span>
            <span v-if="activeBooking" class="bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono">
              Stage {{ currentStageTab }}/6
            </span>
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

      <!-- Sidebar Footer: Appearance Theme & Laravel Connection Status -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-semibold text-slate-400">Appearance</span>
          <ThemeToggle compact />
        </div>
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
          <h2 class="text-sm font-bold text-white tracking-wide">DMC End-to-End Travel Reservation Engine</h2>
          <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
            Full 6-Stage Lifecycle
          </span>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex items-center gap-2.5">
          <!-- Top Header Theme Switcher -->
          <ThemeToggle />

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
        
        <!-- ================================================================== -->
        <!-- VIEW: 6-STAGE RESERVATION LIFECYCLE PIPELINE WORKSPACE -->
        <!-- ================================================================== -->
        <div v-if="activeTab === 'lifecycle' && activeBooking" class="space-y-6 max-w-7xl mx-auto">
          <!-- Active Booking Header Card -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded font-mono font-bold">
                    {{ activeBooking.booking_number }}
                  </span>
                  <span
                    class="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border"
                    :class="{
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': activeBooking.payment_status === 'fully_paid',
                      'bg-amber-500/10 text-amber-400 border-amber-500/30': activeBooking.payment_status === 'deposit_paid',
                      'bg-slate-800 text-slate-300 border-slate-700': activeBooking.payment_status === 'pending'
                    }"
                  >
                    Payment: {{ activeBooking.payment_status }}
                  </span>
                </div>
                <h3 class="text-xl font-bold text-white mt-1">{{ activeBooking.guest_name }}</h3>
                <p class="text-xs text-slate-400">
                  {{ activeBooking.nationality }} &bull; {{ activeBooking.pax_adults }} Adults, {{ activeBooking.pax_children }} Children &bull; 
                  Agent: <span class="text-emerald-400 font-semibold">{{ activeBooking.agent?.name || 'Direct Client' }}</span>
                </p>
              </div>

              <!-- Quick Booking Switcher Dropdown -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Select Booking:</span>
                <select
                  :value="activeBooking.id"
                  @change="(e) => {
                    const b = bookings.find(item => item.id === Number((e.target as HTMLSelectElement).value));
                    if (b) openLifecycleWorkspace(b, currentStageTab);
                  }"
                  class="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2 outline-none font-mono"
                >
                  <option v-for="b in bookings" :key="b.id" :value="b.id">
                    {{ b.booking_number }} - {{ b.guest_name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 6-STAGE INTERACTIVE LIFECYCLE PROGRESS BAR -->
            <div class="pt-4 border-t border-slate-800">
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <button
                  v-for="(st, idx) in [
                    { num: 1, title: '1. Lead & Intake', subtitle: 'Capture & Init' },
                    { num: 2, title: '2. Itinerary & Res', subtitle: 'Hotels & Fleet' },
                    { num: 3, title: '3. Costing & Quote', subtitle: 'Markup & Pricing' },
                    { num: 4, title: '4. Billing & Invoicing', subtitle: 'Payments' },
                    { num: 5, title: '5. Vouchers & QR', subtitle: 'Supplier Passes' },
                    { num: 6, title: '6. Docs & Wrap-up', subtitle: 'Welcome & Review' }
                  ]"
                  :key="st.num"
                  @click="currentStageTab = st.num; refreshLifecycleData(activeBooking.id);"
                  :class="currentStageTab === st.num
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'"
                  class="p-2.5 rounded-xl border text-left transition-all"
                >
                  <span class="block font-bold text-[11px] truncate">{{ st.title }}</span>
                  <span class="block text-[10px] opacity-75 truncate">{{ st.subtitle }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- STAGE 1: INQUIRY & INTAKE RECORD -->
          <!-- ================================================================ -->
          <div v-if="currentStageTab === 1" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>Stage 1: Lead Capture &amp; Reservation Initialization</span>
                </h4>
                <p class="text-xs text-slate-400 mt-1">Generates unique booking reference, logs passenger headcount, flights, and client requirements.</p>
              </div>
              <button
                @click="currentStageTab = 2"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <span>Proceed to Stage 2: Itinerary &rarr;</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div class="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h5 class="font-bold text-emerald-400 text-xs uppercase tracking-wider">Party &amp; Client Details</h5>
                <p><span class="text-slate-500">Booking Reference:</span> <strong class="text-white font-mono">{{ activeBooking.booking_number }}</strong></p>
                <p><span class="text-slate-500">Lead Guest:</span> <strong class="text-white">{{ activeBooking.guest_name }}</strong></p>
                <p><span class="text-slate-500">Nationality:</span> {{ activeBooking.nationality }}</p>
                <p><span class="text-slate-500">Party Headcount:</span> {{ activeBooking.pax_adults }} Adults, {{ activeBooking.pax_children }} Children</p>
                <p><span class="text-slate-500">Overseas Wholesale Agent:</span> {{ activeBooking.agent?.name || 'Direct Client' }} ({{ activeBooking.agent?.code || 'DIR' }})</p>
              </div>

              <div class="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h5 class="font-bold text-emerald-400 text-xs uppercase tracking-wider">Flight Schedule &amp; Requests</h5>
                <p><span class="text-slate-500">Travel Period:</span> {{ activeBooking.arrival_date }} &rarr; {{ activeBooking.departure_date }}</p>
                <p><span class="text-slate-500">Arrival Flight:</span> {{ activeBooking.arrival_flight }}</p>
                <p><span class="text-slate-500">Departure Flight:</span> {{ activeBooking.departure_flight }}</p>
                <p><span class="text-slate-500">Special Notes / Dietary:</span> <span class="italic text-slate-300">"{{ activeBooking.special_requests || 'No special requests logged' }}"</span></p>
              </div>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- STAGE 2: ITINERARY & RESOURCE ALLOCATION -->
          <!-- ================================================================ -->
          <div v-else-if="currentStageTab === 2" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>Stage 2: Itinerary Building &amp; Resource Allocation</span>
                </h4>
                <p class="text-xs text-slate-400 mt-1">Assign hotel room categories, meal plans (RO, BB, HB, FB, AI), vehicle class, and certified guide.</p>
              </div>
              <button
                @click="currentStageTab = 3; handleRecalculateQuote();"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <span>Proceed to Stage 3: Costing &rarr;</span>
              </button>
            </div>

            <!-- Resource Allocation Summary (Fleet & Guide) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Assigned Fleet Vehicle</span>
                <p class="font-bold text-white text-sm flex items-center gap-2">
                  <Car class="w-4 h-4 text-emerald-400" />
                  <span>{{ activeBooking.transport_type }}</span>
                </p>
                <p class="text-xs text-slate-400">Air-conditioned executive vehicle with dedicated luggage capacity.</p>
              </div>

              <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Allocated National Chauffeur-Guide</span>
                <p class="font-bold text-white text-sm flex items-center gap-2">
                  <Users class="w-4 h-4 text-emerald-400" />
                  <span>{{ activeBooking.driver_guide }}</span>
                </p>
                <p class="text-xs text-slate-400">Phone: {{ activeBooking.driver_phone || '+94 77 123 4567' }} &bull; Language: {{ activeBooking.driver_language || 'English' }}</p>
              </div>
            </div>

            <!-- Day-by-Day Hotel & Excursion Plan with Meal Plan Badges -->
            <div class="space-y-3">
              <h5 class="font-bold text-white text-xs uppercase tracking-wider">Day-by-Day Hotel &amp; Meal Allocations</h5>
              <div
                v-for="d in activeBooking.itinerary_days"
                :key="d.id || d.day_number"
                class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <span class="font-bold text-emerald-400 font-mono">Day {{ d.day_number }}: {{ d.destination }} &bull; {{ d.date }}</span>
                  <div class="flex items-center gap-2">
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                      Meal Plan: {{ d.meal_plan || 'HB' }}
                    </span>
                    <span class="text-slate-400 text-[11px]">{{ d.room_category || 'Deluxe Room' }}</span>
                  </div>
                </div>
                <p class="text-xs font-semibold text-white">Hotel: {{ d.hotel_name }}</p>
                <p class="text-xs text-slate-300">{{ d.activities }}</p>
              </div>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- STAGE 3: COSTING & QUOTATION ENGINE -->
          <!-- ================================================================ -->
          <div v-else-if="currentStageTab === 3" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>Stage 3: Financial Costing &amp; Quotation Engine</span>
                </h4>
                <p class="text-xs text-slate-400 mt-1">Calculates net supplier costs, applies DMC markup, and outputs gross pricing in multiple currencies.</p>
              </div>
              <button
                @click="currentStageTab = 4"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <span>Proceed to Stage 4: Billing &rarr;</span>
              </button>
            </div>

            <!-- Costing Engine Controls -->
            <div class="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">DMC Markup Margin (%): <span class="text-emerald-400 font-bold font-mono">{{ quoteMarkup }}%</span></label>
                <input
                  v-model.number="quoteMarkup"
                  type="range"
                  min="10"
                  max="45"
                  step="1"
                  @change="handleRecalculateQuote"
                  class="w-full accent-emerald-500"
                />
                <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>10% (Low Wholesale)</span>
                  <span>25% (Standard)</span>
                  <span>45% (High Luxury)</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Target Currency Display</label>
                <div class="flex gap-2">
                  <button
                    v-for="curr in ['LKR', 'USD', 'EUR', 'GBP']"
                    :key="curr"
                    @click="quoteCurrency = curr as any; handleRecalculateQuote();"
                    :class="quoteCurrency === curr ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'"
                    class="flex-1 py-2 text-xs font-bold rounded-lg transition-colors font-mono"
                  >
                    {{ curr }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Net Supplier Costs Breakdown Table -->
            <div class="border border-slate-800 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="p-3">Cost Component</th>
                    <th class="p-3">Calculation Basis</th>
                    <th class="p-3 text-right">Net Supplier Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td class="p-3 font-semibold text-white">Hotel Accommodations (Net)</td>
                    <td class="p-3 text-slate-400">Selected 4/5-star properties per night</td>
                    <td class="p-3 text-right font-mono">LKR {{ (activeBooking.expenses_hotels || 1250000).toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-white">Transport &amp; Fuel Allowance</td>
                    <td class="p-3 text-slate-400">{{ activeBooking.transport_type }} (All mileage included)</td>
                    <td class="p-3 text-right font-mono">LKR {{ (activeBooking.expenses_transport || 420000).toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-white">Licensed Guide Allowance &amp; Board</td>
                    <td class="p-3 text-slate-400">Daily national tourist guide lecturer fee</td>
                    <td class="p-3 text-right font-mono">LKR {{ (activeBooking.expenses_guide || 140000).toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-white">Excursion Tickets &amp; Safari Jeeps</td>
                    <td class="p-3 text-slate-400">Yala 4x4, Sigiriya entrance, train tickets</td>
                    <td class="p-3 text-right font-mono">LKR {{ (activeBooking.expenses_activities || 210000).toLocaleString() }}</td>
                  </tr>
                  <tr class="bg-slate-950 font-bold">
                    <td colspan="2" class="p-4 text-slate-300 uppercase text-[11px]">Total Net Supplier Costs:</td>
                    <td class="p-4 text-right font-mono text-white text-sm">
                      LKR {{ ((activeBooking.expenses_hotels || 1250000) + (activeBooking.expenses_transport || 420000) + (activeBooking.expenses_guide || 140000) + (activeBooking.expenses_activities || 210000)).toLocaleString() }}
                    </td>
                  </tr>
                  <tr class="bg-emerald-950/40 text-emerald-400 font-bold">
                    <td colspan="2" class="p-4 uppercase text-xs">Gross Tour Quotation (+ {{ quoteMarkup }}% DMC Margin):</td>
                    <td class="p-4 text-right font-mono text-base text-emerald-400">
                      LKR {{ activeBooking.revenue_lkr.toLocaleString() }}
                      <span class="block text-[11px] font-normal text-emerald-300">approx. ${{ activeBooking.revenue_usd || Math.round(activeBooking.revenue_lkr / 300) }} USD</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- STAGE 4: BILLING & PAYMENT PROCESSING -->
          <!-- ================================================================ -->
          <div v-else-if="currentStageTab === 4" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
                  <span>Stage 4: Invoicing, Receipts &amp; Payment Processing</span>
                </h4>
                <p class="text-xs text-slate-400 mt-1">Record deposits, track balance payments, and update state machine (pending &rarr; deposit_paid &rarr; fully_paid).</p>
              </div>
              <button
                @click="currentStageTab = 5"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <span>Proceed to Stage 5: Vouchers &rarr;</span>
              </button>
            </div>

            <!-- Ledger Summary -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span class="text-[10px] text-slate-500 uppercase font-semibold">Total Invoiced Amount</span>
                <p class="text-xl font-bold font-mono text-white">LKR {{ activeBooking.revenue_lkr.toLocaleString() }}</p>
              </div>

              <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span class="text-[10px] text-slate-500 uppercase font-semibold">Total Received</span>
                <p class="text-xl font-bold font-mono text-emerald-400">
                  LKR {{ (activeBooking.payments || []).reduce((acc, p) => acc + p.amount, 0).toLocaleString() }}
                </p>
              </div>

              <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span class="text-[10px] text-slate-500 uppercase font-semibold">Remaining Balance</span>
                <p class="text-xl font-bold font-mono text-amber-400">
                  LKR {{ Math.max(0, activeBooking.revenue_lkr - (activeBooking.payments || []).reduce((acc, p) => acc + p.amount, 0)).toLocaleString() }}
                </p>
              </div>
            </div>

            <!-- Payment Record Form -->
            <div class="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h5 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-emerald-400" />
                <span>Record New Transaction / Wire Transfer</span>
              </h5>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label class="block text-slate-400 mb-1">Amount (LKR)</label>
                  <input v-model.number="paymentForm.amount" type="number" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Payment Type</label>
                  <select v-model="paymentForm.type" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white">
                    <option value="deposit">Deposit Payment (30%)</option>
                    <option value="balance">Balance Settlement (70%)</option>
                    <option value="full">Full Payment (100%)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Payment Gateway / Method</label>
                  <select v-model="paymentForm.method" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white">
                    <option value="stripe">Stripe Online</option>
                    <option value="payhere">PayHere Gateway</option>
                    <option value="bank_transfer">Wire / Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Transaction Ref</label>
                  <input v-model="paymentForm.reference" placeholder="e.g. TX-90218" class="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono" />
                </div>
              </div>

              <button
                @click="handleRecordPayment"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                + Log Payment Receipt
              </button>
            </div>

            <!-- Transaction Ledger Table -->
            <div class="border border-slate-800 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-sans border-b border-slate-800">
                  <tr>
                    <th class="p-3">Transaction ID</th>
                    <th class="p-3">Date</th>
                    <th class="p-3">Type</th>
                    <th class="p-3">Method</th>
                    <th class="p-3">Reference</th>
                    <th class="p-3 text-right">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-300">
                  <tr v-for="p in activeBooking.payments" :key="p.id">
                    <td class="p-3 text-emerald-400 font-bold">{{ p.id }}</td>
                    <td class="p-3 text-slate-400">{{ p.date }}</td>
                    <td class="p-3 uppercase text-[11px]">{{ p.type }}</td>
                    <td class="p-3 uppercase text-[11px]">{{ p.method }}</td>
                    <td class="p-3 text-slate-400">{{ p.reference }}</td>
                    <td class="p-3 text-right font-bold text-white">{{ p.amount.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="!activeBooking.payments || !activeBooking.payments.length">
                    <td colspan="6" class="p-4 text-center text-slate-500 font-sans">No payments recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- STAGE 5: SERVICE VOUCHERS & QR DISPATCH -->
          <!-- ================================================================ -->
          <div v-else-if="currentStageTab === 5" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">5</span>
                  <span>Stage 5: Booking Confirmation &amp; Service Voucher Dispatch</span>
                </h4>
                <p class="text-xs text-slate-400 mt-1">Generates digital check-in vouchers, driver duty slips, and verification QR tokens for partner hotels.</p>
              </div>
              <button
                @click="currentStageTab = 6"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <span>Proceed to Stage 6: Client Docs &rarr;</span>
              </button>
            </div>

            <!-- Vouchers Cards List -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="vouch in generatedVouchers"
                :key="vouch.id"
                class="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 relative overflow-hidden"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {{ vouch.verification_token }}
                    </span>
                    <h5 class="font-bold text-white text-sm mt-1.5">{{ vouch.title }}</h5>
                    <p class="text-xs text-slate-400">{{ vouch.supplier_name }} &bull; Valid: {{ vouch.valid_date }}</p>
                  </div>

                  <!-- QR Code Icon Box -->
                  <div class="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center text-slate-950 shrink-0">
                    <QrCode class="w-10 h-10" />
                  </div>
                </div>

                <div class="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800/80">
                  <p><span class="text-slate-500">Service:</span> {{ vouch.service_details }}</p>
                  <p><span class="text-slate-500">Allocated:</span> {{ vouch.room_or_vehicle }}</p>
                </div>

                <div class="pt-2 flex justify-end">
                  <button
                    onclick="window.print()"
                    class="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <Printer class="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- STAGE 6: AUTOMATED CLIENT DOCUMENTS & POST-TRIP -->
          <!-- ================================================================ -->
          <div v-else-if="currentStageTab === 6" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 class="text-base font-bold text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">6</span>
                  <span>Stage 6: Client Documentation &amp; Post-Trip Wrap-up</span>
                </h4>
                <p class="text-xs text-slate-400 mt-1">Guest arrival Welcome Letter, Legal Terms Agreement, and post-trip feedback review survey.</p>
              </div>
              <span class="text-xs text-emerald-400 font-mono font-bold">Lifecycle Complete</span>
            </div>

            <!-- Document Selector Tabs -->
            <div class="flex gap-2 border-b border-slate-800 pb-3">
              <button
                v-for="d in [
                  { type: 'welcome_letter', label: 'Guest Welcome Letter' },
                  { type: 'travel_agreement', label: 'Legal Travel Agreement' },
                  { type: 'thank_you_survey', label: 'Post-Trip Survey & Review' }
                ]"
                :key="d.type"
                @click="loadDocumentType(d.type as any)"
                :class="activeDocType === d.type ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800'"
                class="px-4 py-2 rounded-lg text-xs transition-colors"
              >
                {{ d.label }}
              </button>
            </div>

            <!-- Document Render Preview -->
            <div class="bg-white text-slate-900 p-8 rounded-xl shadow-xl max-w-3xl mx-auto space-y-4">
              <div class="flex items-center justify-between border-b pb-3 text-xs text-slate-500">
                <span>Serendib &amp; Metshu DMC Client Documentation</span>
                <button onclick="window.print()" class="text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                  <Printer class="w-4 h-4" /> Print Document
                </button>
              </div>

              <!-- Render HTML payload dynamically -->
              <div v-if="activeDocContent" v-html="activeDocContent.content_html"></div>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- VIEW: BOOKINGS REGISTRY TABLE -->
        <!-- ================================================================== -->
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
                    <th class="p-4">Payment</th>
                    <th class="p-4 text-right">Revenue (LKR)</th>
                    <th class="p-4 text-center">Lifecycle Action</th>
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
                    <td class="p-4">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                        :class="{
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': b.payment_status === 'fully_paid',
                          'bg-amber-500/10 text-amber-400 border-amber-500/30': b.payment_status === 'deposit_paid',
                          'bg-slate-800 text-slate-300 border-slate-700': b.payment_status === 'pending'
                        }"
                      >
                        {{ b.payment_status }}
                      </span>
                    </td>
                    <td class="p-4 text-right font-mono font-bold text-white">
                      {{ Number(b.revenue_lkr).toLocaleString() }}
                    </td>
                    <td class="p-4 text-center">
                      <button
                        @click="openLifecycleWorkspace(b, 1)"
                        class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 mx-auto shadow-md"
                      >
                        <span>Manage Lifecycle</span>
                        <ChevronRight class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- VIEW: DASHBOARD VIEW -->
        <!-- ================================================================== -->
        <div v-else-if="activeTab === 'dashboard'" class="space-y-6 max-w-7xl mx-auto">
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

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 class="text-sm font-bold text-white">6-Stage Lifecycle Overview</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span class="font-bold text-emerald-400 block mb-1">1. Intake &amp; Reservation</span>
                <p class="text-slate-400 text-[11px]">Direct website inquiries and wholesale overseas agents.</p>
              </div>
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span class="font-bold text-emerald-400 block mb-1">2. Resource Allocation</span>
                <p class="text-slate-400 text-[11px]">Room plans (RO/BB/HB/FB), AC vehicles, certified guide.</p>
              </div>
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span class="font-bold text-emerald-400 block mb-1">3. Quotation Engine</span>
                <p class="text-slate-400 text-[11px]">Net costs + dynamic markup margin (LKR/USD/EUR/GBP).</p>
              </div>
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span class="font-bold text-emerald-400 block mb-1">4. Billing &amp; Invoicing</span>
                <p class="text-slate-400 text-[11px]">Deposits, balances, Stripe and bank wire logging.</p>
              </div>
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span class="font-bold text-emerald-400 block mb-1">5. Vouchers &amp; QR Tokens</span>
                <p class="text-slate-400 text-[11px]">Hotel check-in vouchers and driver duty slips.</p>
              </div>
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span class="font-bold text-emerald-400 block mb-1">6. Client Docs &amp; Survey</span>
                <p class="text-slate-400 text-[11px]">Arrival Welcome Letter and post-trip review requests.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- VIEW: AGENTS -->
        <!-- ================================================================== -->
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

        <!-- ================================================================== -->
        <!-- VIEW: INQUIRIES -->
        <!-- ================================================================== -->
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

        <!-- ================================================================== -->
        <!-- VIEW: OPENAPI SPECS -->
        <!-- ================================================================== -->
        <div v-else-if="activeTab === 'api-docs'" class="space-y-6 max-w-7xl mx-auto">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <Code2 class="w-5 h-5 text-emerald-400" />
                  <span>DMC Reservation Lifecycle OpenAPI Specification</span>
                </h3>
                <p class="text-xs text-slate-400 mt-1">
                  Full contracts for all 6 stages of the reservation life cycle.
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
                    <th class="p-3">Stage</th>
                    <th class="p-3">HTTP &amp; Endpoint</th>
                    <th class="p-3 font-sans">Action Description</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">1. Intake</td>
                    <td class="p-3 text-white"><span class="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mr-2">POST</span>/api/v1/bookings</td>
                    <td class="p-3 font-sans text-slate-400">Initialize reservation draft &amp; party records</td>
                  </tr>
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">2. Itinerary</td>
                    <td class="p-3 text-white"><span class="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded mr-2">PUT</span>/api/v1/bookings/{id}/itinerary</td>
                    <td class="p-3 font-sans text-slate-400">Bulk update hotels, room categories &amp; meal plans</td>
                  </tr>
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">2. Fleet</td>
                    <td class="p-3 text-white"><span class="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded mr-2">PUT</span>/api/v1/bookings/{id}/allocations</td>
                    <td class="p-3 font-sans text-slate-400">Assign vehicle type &amp; certified chauffeur-guide</td>
                  </tr>
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">3. Costing</td>
                    <td class="p-3 text-white"><span class="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mr-2">POST</span>/api/v1/bookings/{id}/calculate-quote</td>
                    <td class="p-3 font-sans text-slate-400">Calculate net supplier costs &amp; dynamic markup</td>
                  </tr>
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">4. Invoicing</td>
                    <td class="p-3 text-white"><span class="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mr-2">POST</span>/api/v1/bookings/{id}/payments</td>
                    <td class="p-3 font-sans text-slate-400">Record deposit &amp; balance settlement transactions</td>
                  </tr>
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">5. Vouchers</td>
                    <td class="p-3 text-white"><span class="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded mr-2">GET</span>/api/v1/bookings/{id}/vouchers</td>
                    <td class="p-3 font-sans text-slate-400">Fetch hotel check-in vouchers &amp; QR codes</td>
                  </tr>
                  <tr>
                    <td class="p-3 text-emerald-400 font-sans font-bold">6. Documents</td>
                    <td class="p-3 text-white"><span class="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded mr-2">GET</span>/api/v1/bookings/{id}/documents/{type}</td>
                    <td class="p-3 font-sans text-slate-400">Welcome Letter, Agreement, and Review email HTML</td>
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
          <h3 class="font-bold text-white text-sm">Initialize New Tour Reservation</h3>
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

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">Adults</label>
              <input v-model.number="bookingForm.pax_adults" type="number" min="1" max="50" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Children</label>
              <input v-model.number="bookingForm.pax_children" type="number" min="0" max="30" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Infants</label>
              <input v-model.number="bookingForm.pax_infants" type="number" min="0" max="10" class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" />
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
            <label class="block text-slate-400 mb-1">Initial Agreed Revenue (LKR)</label>
            <input v-model.number="bookingForm.revenue_lkr" type="number" required class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono" />
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Special Requests / Notes</label>
            <textarea v-model="bookingForm.special_requests" rows="2" placeholder="Dietary restrictions, honeymoon cakes, room preferences..." class="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white resize-none"></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button type="button" @click="showBookingModal = false" class="bg-slate-800 px-4 py-2 rounded text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-white font-semibold shadow-lg shadow-emerald-950">Initialize Reservation</button>
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

    <!-- MODAL 3: CONFIGURE API BASE URL & TEST LARAVEL -->
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
