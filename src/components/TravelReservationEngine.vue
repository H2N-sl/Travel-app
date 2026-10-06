<script setup lang="ts">
/**
 * ==============================================================================
 * COMPONENT: src/components/TravelReservationEngine.vue
 * END-TO-END DMC TRAVEL RESERVATION ENGINE (6-STAGE LIFECYCLE)
 * ==============================================================================
 * 
 * 🔰 THE 6-STAGE DMC RESERVATION PIPELINE:
 * 1. Inquiry Intake & Lead Initialization
 * 2. Itinerary Building & Resource Allocation (Fleet, Hotel, Meal Plans, Guides)
 * 3. Costing & Quotation Engine (Supplier net costs + dynamic DMC markup)
 * 4. Billing, Invoicing & Payment Processing (Deposits, Gateways, Ledger)
 * 5. Booking Confirmation & Service Vouchers (Check-In slips, QR mobile tokens)
 * 6. Automated Client Documents & Post-Trip (Welcome Letter, Agreement, Survey)
 * 
 * 🌓 COMPLETE CLASS-BASED DARK/LIGHT MODE ARCHITECTURE:
 * - Root wrapper: `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`
 * - Step Containers (Stages 1-6): `bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80`
 * - Form Inputs, Selects, Datepickers & Textareas:
 *   `bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400`
 * - Data Tables & Headers: `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300` headers and
 *   `divide-slate-200 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50` row dividers
 * - Financial Badges: `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800` (success) and
 *   `dark:bg-amber-950/50 dark:text-amber-300` (pending)
 * - Timeline Step Badges: `bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`
 * - Modals: `bg-slate-900/80 backdrop-blur-sm` overlay, `bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-900 dark:text-slate-100` body,
 *   authentic paper containers styled explicitly with `bg-white text-slate-900`
 */

import { ref, computed, watch, onMounted } from 'vue';
import {
  apiClient,
  type Booking,
  type Agent,
  type ServiceVoucher,
  type LifecycleStage,
  type MealPlan,
  type ItineraryDay
} from '../services/api';
import { useCompany } from '../composables/useCompany';
import {
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  QrCode,
  Printer,
  ChevronRight,
  Car,
  Clock,
  MapPin,
  Check,
  ShieldCheck,
  FileText,
  Send,
  Eye,
  X,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  Edit3,
  Save,
  Plane,
  AlertCircle
} from 'lucide-vue-next';

// ------------------------------------------------------------------------------
// PROPS & EMITS
// ------------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    booking: Booking;
    bookings?: Booking[];
    agents?: Agent[];
    initialStage?: number;
  }>(),
  {
    bookings: () => [],
    agents: () => [],
    initialStage: 1,
  }
);

const emit = defineEmits<{
  (e: 'update:booking', updated: Booking): void;
  (e: 'refresh'): void;
  (e: 'select-booking', bookingId: number): void;
}>();

const { company } = useCompany();

// ------------------------------------------------------------------------------
// REACTIVE STATE (DATA VARIABLES)
// ------------------------------------------------------------------------------
const currentStageTab = ref<number>(props.initialStage || 1);
const quoteMarkup = ref<number>(props.booking.markup_percentage || 25);
const quoteCurrency = ref<'LKR' | 'USD' | 'EUR' | 'GBP'>('LKR');
const quoteCalculation = ref<any>(null);
const isLoadingData = ref(false);

// Stage 1: Quick Lead Editor state
const isEditingLead = ref(false);
const leadEditForm = ref({
  guest_name: props.booking.guest_name,
  nationality: props.booking.nationality,
  pax_adults: props.booking.pax_adults,
  pax_children: props.booking.pax_children,
  arrival_date: props.booking.arrival_date,
  departure_date: props.booking.departure_date,
  arrival_flight: props.booking.arrival_flight,
  departure_flight: props.booking.departure_flight,
  special_requests: props.booking.special_requests || '',
});

// Stage 2: Resource Allocation Editor
const isEditingResources = ref(false);
const resourceForm = ref({
  transport_type: props.booking.transport_type,
  driver_guide: props.booking.driver_guide,
  driver_phone: props.booking.driver_phone || '+94 77 123 4567',
  driver_language: props.booking.driver_language || 'English',
});

// Stage 4: Payment Form state
const paymentForm = ref({
  amount: 855000,
  currency: 'LKR' as const,
  type: 'deposit' as 'deposit' | 'balance' | 'full',
  method: 'stripe' as 'stripe' | 'payhere' | 'bank_transfer',
  reference: '',
  notes: '',
});
const isSubmittingPayment = ref(false);

// Stage 5 & 6: Vouchers & Documents
const generatedVouchers = ref<ServiceVoucher[]>([]);
const activeDocType = ref<'welcome_letter' | 'travel_agreement' | 'thank_you_survey' | 'quotation'>('welcome_letter');
const activeDocContent = ref<any>(null);

// Modals
const showVoucherModal = ref(false);
const activeVoucher = ref<ServiceVoucher | null>(null);
const showQuoteModal = ref(false);
const showDocModal = ref(false);

// Sync edit forms when booking changes
const syncFormsWithBooking = () => {
  if (!props.booking) return;
  leadEditForm.value = {
    guest_name: props.booking.guest_name,
    nationality: props.booking.nationality,
    pax_adults: props.booking.pax_adults,
    pax_children: props.booking.pax_children,
    arrival_date: props.booking.arrival_date,
    departure_date: props.booking.departure_date,
    arrival_flight: props.booking.arrival_flight,
    departure_flight: props.booking.departure_flight,
    special_requests: props.booking.special_requests || '',
  };
  resourceForm.value = {
    transport_type: props.booking.transport_type,
    driver_guide: props.booking.driver_guide,
    driver_phone: props.booking.driver_phone || '+94 77 123 4567',
    driver_language: props.booking.driver_language || 'English',
  };
  quoteMarkup.value = props.booking.markup_percentage || 25;
};

// ------------------------------------------------------------------------------
// METHODS & API CALLS
// ------------------------------------------------------------------------------
const loadLifecycleData = async () => {
  if (!props.booking) return;
  isLoadingData.value = true;
  try {
    const [quoteRes, vouchersRes, docRes] = await Promise.all([
      apiClient.calculateQuote(props.booking.id, {
        markup_percentage: quoteMarkup.value,
        target_currency: quoteCurrency.value,
      }),
      apiClient.getVouchers(props.booking.id),
      apiClient.getDocument(props.booking.id, activeDocType.value),
    ]);

    quoteCalculation.value = quoteRes.data;
    generatedVouchers.value = vouchersRes.data;
    activeDocContent.value = docRes.data;
  } catch (error) {
    console.error('Error loading lifecycle data:', error);
  } finally {
    isLoadingData.value = false;
  }
};

// Re-calculate quotation with new markup
const handleRecalculateQuote = async () => {
  if (!props.booking) return;
  try {
    const res = await apiClient.calculateQuote(props.booking.id, {
      markup_percentage: quoteMarkup.value,
      target_currency: quoteCurrency.value,
    });
    quoteCalculation.value = res.data;
    emit('update:booking', res.data.booking);
  } catch (error) {
    console.error('Error recalculating quote:', error);
  }
};

// Save edited lead details (Stage 1)
const handleSaveLeadDetails = async () => {
  if (!props.booking) return;
  try {
    const updated = {
      ...props.booking,
      ...leadEditForm.value,
    };
    const res = await apiClient.updateBooking(props.booking.id, updated);
    emit('update:booking', res.data);
    isEditingLead.value = false;
  } catch (error) {
    console.error('Error saving lead details:', error);
  }
};

// Save edited resource allocation (Stage 2)
const handleSaveResources = async () => {
  if (!props.booking) return;
  try {
    const updated = {
      ...props.booking,
      ...resourceForm.value,
    };
    const res = await apiClient.updateBooking(props.booking.id, updated);
    emit('update:booking', res.data);
    isEditingResources.value = false;
  } catch (error) {
    console.error('Error saving resource allocations:', error);
  }
};

// Record payment transaction (Stage 4)
const handleRecordPayment = async () => {
  if (!props.booking || isSubmittingPayment.value) return;
  isSubmittingPayment.value = true;
  try {
    const res = await apiClient.recordPayment(props.booking.id, paymentForm.value);
    paymentForm.value.reference = '';
    paymentForm.value.notes = '';
    emit('update:booking', res.data);
    await loadLifecycleData();
  } catch (error) {
    console.error('Error recording payment:', error);
  } finally {
    isSubmittingPayment.value = false;
  }
};

// Load specific document type (Stage 6)
const loadDocumentType = async (type: 'welcome_letter' | 'travel_agreement' | 'thank_you_survey' | 'quotation') => {
  if (!props.booking) return;
  activeDocType.value = type;
  try {
    const res = await apiClient.getDocument(props.booking.id, type);
    activeDocContent.value = res.data;
  } catch (error) {
    console.error('Error fetching document:', error);
  }
};

// Open Voucher Print Preview Modal
const openVoucherPreview = (voucher: ServiceVoucher) => {
  activeVoucher.value = voucher;
  showVoucherModal.value = true;
};

// Open Document Preview Modal
const openDocPreviewModal = () => {
  showDocModal.value = true;
};

// Quick print trigger
const printCurrentDocument = () => {
  window.print();
};

// Financial helpers
const totalReceived = computed(() => {
  return (props.booking.payments || []).reduce((acc, p) => acc + p.amount, 0);
});

const remainingBalance = computed(() => {
  return Math.max(0, props.booking.revenue_lkr - totalReceived.value);
});

const totalNetSupplierCosts = computed(() => {
  const b = props.booking;
  return (b.expenses_hotels || 1250000) +
         (b.expenses_transport || 420000) +
         (b.expenses_guide || 140000) +
         (b.expenses_activities || 210000);
});

// Watch booking prop changes
watch(
  () => props.booking?.id,
  () => {
    syncFormsWithBooking();
    loadLifecycleData();
  }
);

onMounted(() => {
  syncFormsWithBooking();
  loadLifecycleData();
});
</script>

<template>
  <!-- ====================================================================== -->
  <!-- ROOT WRAPPER: FULL CLASS-BASED DARK/LIGHT MODE SWITCHING               -->
  <!-- ====================================================================== -->
  <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 transition-colors duration-200">
    
    <!-- ==================================================================== -->
    <!-- MASTER HEADER CARD: Active Booking Summary & Stage Switcher          -->
    <!-- ==================================================================== -->
    <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs space-y-5 transition-colors">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <span class="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-lg font-mono font-bold shadow-xs">
              {{ booking.booking_number }}
            </span>
            <span
              class="text-xs font-bold uppercase px-3 py-1 rounded-full border transition-colors"
              :class="{
                'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800': booking.payment_status === 'fully_paid',
                'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800': booking.payment_status === 'deposit_paid',
                'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700': booking.payment_status === 'pending'
              }"
            >
              Payment: {{ booking.payment_status.replace('_', ' ') }}
            </span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              Stage: {{ booking.lifecycle_stage.replace('_', ' ') }}
            </span>
          </div>

          <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">{{ booking.guest_name }}</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {{ booking.nationality }} &bull; {{ booking.pax_adults }} Adults, {{ booking.pax_children }} Children &bull; 
            Wholesale Agent: <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ booking.agent?.name || 'Direct Client' }}</span>
          </p>
        </div>

        <!-- Quick Booking Switcher Dropdown (Dark/Light Standard Form Control) -->
        <div v-if="bookings && bookings.length > 1" class="flex items-center gap-2">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Switch Booking:</span>
          <select
            :value="booking.id"
            @change="(e) => emit('select-booking', Number((e.target as HTMLSelectElement).value))"
            class="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 text-xs rounded-xl p-2.5 outline-none font-mono transition-colors shadow-xs"
          >
            <option v-for="b in bookings" :key="b.id" :value="b.id">
              {{ b.booking_number }} - {{ b.guest_name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 6-STAGE TIMELINE INTERACTIVE PROGRESS BAR -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-700/80">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <button
            v-for="st in [
              { num: 1, title: '1. Lead Intake', subtitle: 'Capture & Init' },
              { num: 2, title: '2. Itinerary Build', subtitle: 'Hotels & Fleet' },
              { num: 3, title: '3. Costing & Quote', subtitle: 'Markup & Pricing' },
              { num: 4, title: '4. Billing & Pay', subtitle: 'Invoices & Ledger' },
              { num: 5, title: '5. Vouchers & QR', subtitle: 'Service Passes' },
              { num: 6, title: '6. Docs & Survey', subtitle: 'Welcome & Review' }
            ]"
            :key="st.num"
            @click="currentStageTab = st.num; loadLifecycleData();"
            :class="currentStageTab === st.num
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
              : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'"
            class="p-3 rounded-xl border text-left transition-all duration-200"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="block font-bold text-xs truncate">{{ st.title }}</span>
              <span
                v-if="currentStageTab === st.num"
                class="w-2 h-2 rounded-full bg-white"
              ></span>
            </div>
            <span class="block text-[11px] opacity-80 truncate">{{ st.subtitle }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 1: INQUIRY & INTAKE RECORD                                     -->
    <!-- ==================================================================== -->
    <div
      v-if="currentStageTab === 1"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <!-- Timeline Icon / Badge: High contrast in both themes -->
            <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">1</span>
            <span>Stage 1: Lead Capture &amp; Reservation Initialization</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Logs primary guest party, flight schedule, party size, wholesale agent reference, and custom dietary requests.
          </p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button
            @click="isEditingLead = !isEditingLead"
            class="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Edit3 class="w-3.5 h-3.5 text-emerald-500" />
            <span>{{ isEditingLead ? 'Cancel Edit' : 'Edit Lead Details' }}</span>
          </button>
          <button
            @click="currentStageTab = 2"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Proceed to Stage 2: Itinerary &rarr;</span>
          </button>
        </div>
      </div>

      <!-- Quick Lead Details Editor (Form inputs matching required styles) -->
      <div v-if="isEditingLead" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4 shadow-sm transition-colors">
        <h5 class="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Edit3 class="w-4 h-4" />
          <span>Update Reservation Master Info</span>
        </h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Guest Name</label>
            <input
              v-model="leadEditForm.guest_name"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Nationality</label>
            <input
              v-model="leadEditForm.nationality"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Adults Count</label>
            <input
              v-model.number="leadEditForm.pax_adults"
              type="number"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Children Count</label>
            <input
              v-model.number="leadEditForm.pax_children"
              type="number"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Arrival Date</label>
            <input
              v-model="leadEditForm.arrival_date"
              type="date"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Departure Date</label>
            <input
              v-model="leadEditForm.departure_date"
              type="date"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Arrival Flight</label>
            <input
              v-model="leadEditForm.arrival_flight"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Departure Flight</label>
            <input
              v-model="leadEditForm.departure_flight"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div class="sm:col-span-2 md:col-span-4">
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Special Requests / Dietary / Honeymoon</label>
            <textarea
              v-model="leadEditForm.special_requests"
              rows="2"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors text-xs"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="isEditingLead = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSaveLeadDetails"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Save Updates</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <!-- Client Details Card -->
        <div class="space-y-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-xs transition-colors">
          <h5 class="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Users class="w-3.5 h-3.5" />
            <span>Party &amp; Client Details</span>
          </h5>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Booking Reference:</span>
            <strong class="font-mono text-slate-900 dark:text-white">{{ booking.booking_number }}</strong>
          </p>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Lead Traveler:</span>
            <strong class="text-slate-900 dark:text-white">{{ booking.guest_name }}</strong>
          </p>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Nationality:</span>
            <span class="text-slate-800 dark:text-slate-200">{{ booking.nationality }}</span>
          </p>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Party Headcount:</span>
            <span class="font-mono text-slate-800 dark:text-slate-200">{{ booking.pax_adults }} Adults, {{ booking.pax_children }} Children</span>
          </p>
          <p class="flex justify-between py-1">
            <span class="text-slate-500 dark:text-slate-400">Wholesale Agent:</span>
            <span class="font-semibold text-slate-900 dark:text-white">{{ booking.agent?.name || 'Direct Client' }}</span>
          </p>
        </div>

        <!-- Flight & Requests Card -->
        <div class="space-y-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-xs transition-colors">
          <h5 class="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5" />
            <span>Flight Schedule &amp; Requests</span>
          </h5>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Travel Window:</span>
            <span class="font-mono text-slate-900 dark:text-white">{{ booking.arrival_date }} &rarr; {{ booking.departure_date }}</span>
          </p>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Arrival Flight:</span>
            <span class="font-mono text-slate-900 dark:text-white">{{ booking.arrival_flight }}</span>
          </p>
          <p class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Departure Flight:</span>
            <span class="font-mono text-slate-900 dark:text-white">{{ booking.departure_flight }}</span>
          </p>
          <div class="pt-1">
            <span class="text-slate-500 dark:text-slate-400 block mb-1">Special Dietary / Honeymoon Requests:</span>
            <p class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 italic text-[11px] border border-slate-200 dark:border-slate-700">
              "{{ booking.special_requests || 'No special requests logged' }}"
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 2: ITINERARY & RESOURCE ALLOCATION                             -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 2"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">2</span>
            <span>Stage 2: Itinerary Building &amp; Resource Allocation</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Assign hotel properties, room categories, meal plans (RO, BB, HB, FB, AI), fleet class, and accredited guide.
          </p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button
            @click="isEditingResources = !isEditingResources"
            class="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Edit3 class="w-3.5 h-3.5 text-emerald-500" />
            <span>{{ isEditingResources ? 'Cancel Edit' : 'Edit Fleet & Guide' }}</span>
          </button>
          <button
            @click="currentStageTab = 3; handleRecalculateQuote();"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Proceed to Stage 3: Costing &rarr;</span>
          </button>
        </div>
      </div>

      <!-- Resource Allocation Editor -->
      <div v-if="isEditingResources" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4 shadow-sm transition-colors">
        <h5 class="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Car class="w-4 h-4" />
          <span>Update Fleet &amp; Chauffeur Assignment</span>
        </h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Fleet Class / Model</label>
            <select
              v-model="resourceForm.transport_type"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            >
              <option value="Toyota KDH Luxury High-Roof Van">Toyota KDH Luxury High-Roof Van</option>
              <option value="Executive Sedan (Toyota Premio)">Executive Sedan (Toyota Premio)</option>
              <option value="Luxury Mini Coach (29-Seater)">Luxury Mini Coach (29-Seater)</option>
              <option value="Toyota Land Cruiser 4x4 Safari">Toyota Land Cruiser 4x4 Safari</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Chauffeur Guide Name</label>
            <input
              v-model="resourceForm.driver_guide"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Driver Phone / WhatsApp</label>
            <input
              v-model="resourceForm.driver_phone"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Guide Fluent Language</label>
            <input
              v-model="resourceForm.driver_language"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="isEditingResources = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSaveResources"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Save Allocations</span>
          </button>
        </div>
      </div>

      <!-- Resource Allocation Cards (Fleet & Guide) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 shadow-xs transition-colors">
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Allocated Fleet Vehicle</span>
          <p class="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Car class="w-5 h-5 text-emerald-500" />
            <span>{{ booking.transport_type }}</span>
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">Executive air-conditioned luxury van with luggage capacity and passenger liability insurance.</p>
        </div>

        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 shadow-xs transition-colors">
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Certified National Chauffeur-Guide</span>
          <p class="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Users class="w-5 h-5 text-emerald-500" />
            <span>{{ booking.driver_guide }}</span>
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Phone / WhatsApp: <strong class="text-slate-900 dark:text-slate-200">{{ booking.driver_phone || '+94 77 123 4567' }}</strong> &bull; Language: {{ booking.driver_language || 'English' }}
          </p>
        </div>
      </div>

      <!-- Day-by-Day Hotel Allocations List -->
      <div class="space-y-3">
        <h5 class="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Day-by-Day Accommodation &amp; Meal Allocations</h5>
        <div
          v-for="d in booking.itinerary_days"
          :key="d.id || d.day_number"
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-2 shadow-xs transition-colors"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Day {{ d.day_number }}: {{ d.destination }} &bull; {{ d.date }}</span>
            <div class="flex items-center gap-2">
              <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                Meal Plan: {{ d.meal_plan || 'HB' }}
              </span>
              <span class="text-slate-500 dark:text-slate-400 text-[11px]">{{ d.room_category || 'Deluxe Room' }}</span>
            </div>
          </div>
          <p class="text-xs font-semibold text-slate-900 dark:text-white">Hotel: {{ d.hotel_name }}</p>
          <p class="text-xs text-slate-600 dark:text-slate-300">{{ d.activities }}</p>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 3: COSTING & QUOTATION ENGINE                                  -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 3"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">3</span>
            <span>Stage 3: Financial Costing &amp; Quotation Engine</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Calculates net supplier costs, applies DMC markup, and outputs gross pricing in multiple currencies.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="showQuoteModal = true"
            class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Eye class="w-3.5 h-3.5 text-emerald-500" />
            <span>PDF Proposal Preview</span>
          </button>
          <button
            @click="currentStageTab = 4"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Proceed to Stage 4: Billing &rarr;</span>
          </button>
        </div>
      </div>

      <!-- Costing Engine Controls -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center shadow-xs transition-colors">
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            DMC Profit Markup Margin (%): <span class="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">{{ quoteMarkup }}%</span>
          </label>
          <input
            v-model.number="quoteMarkup"
            type="range"
            min="10"
            max="45"
            step="1"
            @change="handleRecalculateQuote"
            class="w-full accent-emerald-600 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            <span>10% (Wholesale Partner)</span>
            <span>25% (Standard Direct)</span>
            <span>45% (High Luxury Boutique)</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Display Currency</label>
          <div class="flex gap-2">
            <button
              v-for="curr in ['LKR', 'USD', 'EUR', 'GBP']"
              :key="curr"
              @click="quoteCurrency = curr as any; handleRecalculateQuote();"
              :class="quoteCurrency === curr
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'"
              class="flex-1 py-2.5 text-xs rounded-xl transition-colors font-mono"
            >
              {{ curr }}
            </button>
          </div>
        </div>
      </div>

      <!-- Net Supplier Costs Table (Dark/Light Headers & Row Dividers) -->
      <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs transition-colors">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] border-b border-slate-200 dark:border-slate-700 font-semibold tracking-wider">
            <tr>
              <th class="p-3.5">Cost Component</th>
              <th class="p-3.5">Calculation Basis</th>
              <th class="p-3.5 text-right">Net Supplier Amount (LKR)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white">Hotel Accommodations (Net)</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">Selected 4/5-star properties per night</td>
              <td class="p-3.5 text-right font-mono">LKR {{ (booking.expenses_hotels || 1250000).toLocaleString() }}</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white">Transport &amp; Fuel Allowance</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">{{ booking.transport_type }} (All mileage included)</td>
              <td class="p-3.5 text-right font-mono">LKR {{ (booking.expenses_transport || 420000).toLocaleString() }}</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white">Licensed Guide Allowance &amp; Board</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">Daily national tourist guide lecturer fee</td>
              <td class="p-3.5 text-right font-mono">LKR {{ (booking.expenses_guide || 140000).toLocaleString() }}</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white">Excursion Tickets &amp; Safari Jeeps</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">Yala 4x4, Sigiriya entrance, scenic train tickets</td>
              <td class="p-3.5 text-right font-mono">LKR {{ (booking.expenses_activities || 210000).toLocaleString() }}</td>
            </tr>
            <!-- Total Net Supplier Costs Row -->
            <tr class="bg-slate-50 dark:bg-slate-800/60 font-bold border-t-2 border-slate-300 dark:border-slate-700">
              <td colspan="2" class="p-4 text-slate-700 dark:text-slate-300 uppercase text-[11px]">Total Net Supplier Costs:</td>
              <td class="p-4 text-right font-mono text-slate-900 dark:text-white text-sm">
                LKR {{ totalNetSupplierCosts.toLocaleString() }}
              </td>
            </tr>
            <!-- Gross Quotation Total Row -->
            <tr class="bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold border-t border-emerald-200 dark:border-emerald-800">
              <td colspan="2" class="p-4 uppercase text-xs">
                Gross Tour Quotation (+ {{ quoteMarkup }}% DMC Profit Margin):
              </td>
              <td class="p-4 text-right font-mono text-base text-emerald-700 dark:text-emerald-300">
                LKR {{ booking.revenue_lkr.toLocaleString() }}
                <span class="block text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                  approx. ${{ booking.revenue_usd || Math.round(booking.revenue_lkr / 300) }} USD
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 4: BILLING & PAYMENT PROCESSING                                -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 4"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">4</span>
            <span>Stage 4: Invoicing, Receipts &amp; Payment Processing</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Record deposits, track balance payments, and update lifecycle state machine.
          </p>
        </div>
        <button
          @click="currentStageTab = 5"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Proceed to Stage 5: Vouchers &rarr;</span>
        </button>
      </div>

      <!-- Financial Ledger Summary Cards with Dark/Light Status Badges -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 shadow-xs transition-colors">
          <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Invoiced Amount</span>
          <p class="text-2xl font-bold font-mono text-slate-900 dark:text-white">LKR {{ booking.revenue_lkr.toLocaleString() }}</p>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Pro-forma Ref: {{ booking.booking_number }}</span>
        </div>

        <div class="p-5 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1 shadow-xs transition-colors">
          <span class="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-semibold">Total Received Settlement</span>
          <p class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            LKR {{ totalReceived.toLocaleString() }}
          </p>
          <span class="text-[11px] text-emerald-700 dark:text-emerald-400 block font-semibold">Verified in Bank/Gateway</span>
        </div>

        <div class="p-5 bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 shadow-xs transition-colors">
          <span class="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-semibold">Remaining Balance Due</span>
          <p class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            LKR {{ remainingBalance.toLocaleString() }}
          </p>
          <span class="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">Due 14 days before arrival</span>
        </div>
      </div>

      <!-- Payment Record Form (With Standardized Dark/Light Inputs) -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs transition-colors">
        <h5 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard class="w-4 h-4 text-emerald-500" />
          <span>Record New Transaction / Wire Transfer</span>
        </h5>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Amount (LKR) *</label>
            <input
              v-model.number="paymentForm.amount"
              type="number"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 font-mono outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Payment Type</label>
            <select
              v-model="paymentForm.type"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            >
              <option value="deposit">Deposit Payment (30%)</option>
              <option value="balance">Balance Settlement (70%)</option>
              <option value="full">Full Settlement (100%)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Method / Gateway</label>
            <select
              v-model="paymentForm.method"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors"
            >
              <option value="stripe">Stripe Online</option>
              <option value="payhere">PayHere Gateway</option>
              <option value="bank_transfer">Wire / Bank SWIFT</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Reference Code</label>
            <input
              v-model="paymentForm.reference"
              placeholder="e.g. TX-90218"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 font-mono outline-none transition-colors"
            />
          </div>
          <div class="sm:col-span-4">
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Internal Payment Notes / Bank Advice</label>
            <textarea
              v-model="paymentForm.notes"
              rows="1"
              placeholder="e.g. HSBC London swift transfer received, exchange rate locked @ 300"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-xl p-2.5 outline-none transition-colors text-xs"
            ></textarea>
          </div>
        </div>

        <button
          @click="handleRecordPayment"
          :disabled="isSubmittingPayment"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <CreditCard class="w-3.5 h-3.5" />
          <span>{{ isSubmittingPayment ? 'Logging...' : '+ Log Payment Receipt' }}</span>
        </button>
      </div>

      <!-- Transaction Ledger Table -->
      <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs transition-colors">
        <table class="w-full text-left text-xs font-mono">
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-sans border-b border-slate-200 dark:border-slate-700 font-semibold tracking-wider">
            <tr>
              <th class="p-3.5">Transaction ID</th>
              <th class="p-3.5">Date</th>
              <th class="p-3.5">Type</th>
              <th class="p-3.5">Method</th>
              <th class="p-3.5">Reference</th>
              <th class="p-3.5 text-right">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
            <tr
              v-for="p in booking.payments"
              :key="p.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{{ p.id }}</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">{{ p.date }}</td>
              <td class="p-3.5 uppercase text-[11px]">{{ p.type }}</td>
              <td class="p-3.5 uppercase text-[11px]">{{ p.method }}</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">{{ p.reference }}</td>
              <td class="p-3.5 text-right font-bold text-slate-900 dark:text-white">{{ p.amount.toLocaleString() }}</td>
            </tr>
            <tr v-if="!booking.payments || !booking.payments.length">
              <td colspan="6" class="p-5 text-center text-slate-500 dark:text-slate-400 font-sans italic">
                No payments recorded yet. Record initial deposit above to advance booking state.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 5: SERVICE VOUCHERS & QR DISPATCH                              -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 5"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">5</span>
            <span>Stage 5: Booking Confirmation &amp; Service Voucher Dispatch</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Generates digital check-in vouchers, driver duty slips, and verification QR tokens for partner hotels.
          </p>
        </div>
        <button
          @click="currentStageTab = 6"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Proceed to Stage 6: Client Docs &rarr;</span>
        </button>
      </div>

      <!-- Vouchers Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="vouch in generatedVouchers"
          :key="vouch.id"
          class="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 relative overflow-hidden shadow-xs hover:border-emerald-500/50 transition-all"
        >
          <div class="flex items-start justify-between">
            <div>
              <span class="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                {{ vouch.verification_token }}
              </span>
              <h5 class="font-bold text-slate-900 dark:text-white text-base mt-2">{{ vouch.title }}</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ vouch.supplier_name }} &bull; Valid: {{ vouch.valid_date }}</p>
            </div>

            <!-- QR Code Icon Box -->
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white p-1.5 flex items-center justify-center text-slate-900 shrink-0 shadow-xs">
              <QrCode class="w-9 h-9" />
            </div>
          </div>

          <div class="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <p><span class="text-slate-500 dark:text-slate-400">Included:</span> {{ vouch.service_details }}</p>
            <p><span class="text-slate-500 dark:text-slate-400">Allocation:</span> {{ vouch.room_or_vehicle }}</p>
          </div>

          <div class="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
            <button
              @click="openVoucherPreview(vouch)"
              class="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>Full Voucher Preview</span>
            </button>
            <button
              onclick="window.print()"
              class="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 6: AUTOMATED CLIENT DOCUMENTS & POST-TRIP                      -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 6"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/80 pb-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold font-mono">6</span>
            <span>Stage 6: Client Documentation &amp; Post-Trip Wrap-up</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Guest arrival Welcome Letter, DMC Service Agreement, and post-trip guest review survey.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-lg font-mono font-bold flex items-center gap-1">
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Lifecycle Complete</span>
          </span>
        </div>
      </div>

      <!-- Document Selector Tabs -->
      <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
        <button
          v-for="d in [
            { type: 'welcome_letter', label: 'Guest Welcome Letter' },
            { type: 'travel_agreement', label: 'Legal Service Agreement' },
            { type: 'thank_you_survey', label: 'Post-Trip Survey & Review' }
          ]"
          :key="d.type"
          @click="loadDocumentType(d.type as any)"
          :class="activeDocType === d.type
            ? 'bg-emerald-600 text-white font-bold shadow-xs'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
          class="px-4 py-2.5 rounded-xl text-xs transition-colors"
        >
          {{ d.label }}
        </button>
      </div>

      <!-- Printable Document Render Preview: Wrapped in dark/light container with authentic paper card inside -->
      <div class="p-6 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div class="bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-xl max-w-3xl mx-auto space-y-6 border border-slate-200">
          <div class="flex items-center justify-between border-b pb-4 text-xs text-slate-500">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-emerald-600" />
              <span class="font-bold text-slate-700">{{ company.name }} &bull; Official Document</span>
            </div>
            <button
              @click="printCurrentDocument"
              class="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer class="w-4 h-4" />
              <span>Print Clean Paper Document</span>
            </button>
          </div>

          <!-- Render Dynamic HTML payload -->
          <div v-if="activeDocContent" v-html="activeDocContent.content_html" class="prose prose-sm max-w-none text-slate-900"></div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- MODAL 1: VOUCHER PRINT & VERIFICATION PREVIEW (Dark Mode Adapt)      -->
    <!-- ==================================================================== -->
    <div
      v-if="showVoucherModal && activeVoucher"
      class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transition-colors">
        <!-- Modal Controls Header (Dark Adapted) -->
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between dark:bg-slate-800/50">
          <div class="flex items-center gap-2">
            <QrCode class="w-5 h-5 text-emerald-500" />
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Official DMC Service Voucher</h4>
          </div>
          <button
            @click="showVoucherModal = false"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Paper Body Container: Explicitly white for authentic paper look -->
        <div class="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950">
          <div class="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-md space-y-5">
            <div class="flex items-start justify-between border-b pb-4">
              <div>
                <h3 class="text-xl font-black text-emerald-700 uppercase">{{ company.name }}</h3>
                <p class="text-xs text-slate-500">Destination Management Company &bull; SLTDA License {{ company.licenseNumber }}</p>
                <p class="text-xs font-mono font-bold mt-1 text-slate-900">PO Ref: {{ activeVoucher.verification_token }}</p>
              </div>
              <div class="w-16 h-16 p-1 border rounded-lg bg-white flex items-center justify-center">
                <QrCode class="w-14 h-14 text-slate-900" />
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <p><strong>Service Type:</strong> {{ activeVoucher.title }}</p>
              <p><strong>Supplier:</strong> {{ activeVoucher.supplier_name }}</p>
              <p><strong>Lead Guest:</strong> {{ activeVoucher.guest_name }} ({{ booking.pax_adults }} Adults, {{ booking.pax_children }} Children)</p>
              <p><strong>Valid Service Date:</strong> {{ activeVoucher.valid_date }}</p>
              <p><strong>Room Category / Fleet:</strong> {{ activeVoucher.room_or_vehicle }}</p>
              <p><strong>Meal Plan / Inclusions:</strong> {{ activeVoucher.meal_plan || 'HB' }}</p>
              <p class="pt-2 text-[11px] text-slate-500 italic">
                * This voucher guarantees direct payment settlement by {{ company.legalName }} under contracted seasonal DMC rates.
              </p>
            </div>
          </div>
        </div>

        <!-- Modal Action Footer -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between dark:bg-slate-800">
          <button
            @click="showVoucherModal = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onclick="window.print()"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" />
            <span>Print Physical Voucher</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- MODAL 2: QUOTATION PROPOSAL PDF PREVIEW (Dark Mode Adapt)           -->
    <!-- ==================================================================== -->
    <div
      v-if="showQuoteModal"
      class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transition-colors">
        <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between dark:bg-slate-800/50">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-emerald-500" />
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Formal Quotation Proposal Document</h4>
          </div>
          <button
            @click="showQuoteModal = false"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950">
          <div class="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-md space-y-5">
            <div class="border-b pb-4">
              <h3 class="text-xl font-black text-emerald-700 uppercase">{{ company.name }}</h3>
              <p class="text-xs text-slate-500">Official DMC Tour Quotation &bull; Ref: {{ booking.booking_number }}</p>
            </div>

            <div class="space-y-2 text-xs">
              <p><strong>Client:</strong> {{ booking.guest_name }} ({{ booking.nationality }})</p>
              <p><strong>Travel Dates:</strong> {{ booking.arrival_date }} &rarr; {{ booking.departure_date }}</p>
              <p><strong>Allocated Fleet:</strong> {{ booking.transport_type }}</p>
              <p><strong>Chauffeur Guide:</strong> {{ booking.driver_guide }}</p>
              <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4">
                <span class="text-xs text-emerald-800 font-semibold block uppercase">Total Tour Quotation</span>
                <p class="text-2xl font-bold font-mono text-emerald-700 mt-1">LKR {{ booking.revenue_lkr.toLocaleString() }}</p>
                <p class="text-xs text-emerald-600">approx. ${{ booking.revenue_usd || Math.round(booking.revenue_lkr / 300) }} USD</p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between dark:bg-slate-800">
          <button
            @click="showQuoteModal = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onclick="window.print()"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" />
            <span>Print Proposal</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
