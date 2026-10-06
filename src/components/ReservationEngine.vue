<script setup lang="ts">
/**
 * ==============================================================================
 * FILE: src/components/ReservationEngine.vue
 * END-TO-END DMC TRAVEL RESERVATION ENGINE (6-STAGE LIFECYCLE WORKSPACE)
 * ==============================================================================
 * 
 * 🔰 COMPLETE CLASS-BASED DUAL-THEME SUPPORT (LIGHT & DARK MODE):
 * This component and all its child dialogs adapt seamlessly between Light & Dark modes:
 * 
 * 1. COMPONENT CONTAINER & STEP WRAPPERS:
 *    - Root wrapper: `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`
 *    - Step Containers (1. Inquiry, 2. Itinerary Builder, 3. Costing & Quote,
 *      4. Invoicing, 5. Vouchers, 6. Communications):
 *      `bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80`
 * 
 * 2. FORM INPUTS & SELECT DROPDOWNS:
 *    - All text inputs, selects, datepickers, and textareas across all 6 reservation steps:
 *      `bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400`
 * 
 * 3. DATA TABLES & FINANCIAL SUMMARY CARDS:
 *    - Quotation/Costing table headers: `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`
 *    - Table rows & dividers: `divide-slate-200 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50`
 *    - Financial totals / Profit Margin / Pro-forma badges:
 *      * Success states: `bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800`
 *      * Pending states: `bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800`
 * 
 * 4. GENERATED DOCUMENTS & PREVIEW MODALS:
 *    - Quotation PDF preview, Vouchers preview (Hotel Check-In, Safari 4x4, Driver Duty Slips),
 *      and Welcome Letter modals:
 *      - Modal overlay: `bg-slate-900/80 backdrop-blur-sm`
 *      - Modal body: `bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-900 dark:text-slate-100`
 *      - Action toolbar: `bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700`
 *      - Printable document cards (stay white like actual physical paper):
 *        explicitly wrapped in `bg-white text-slate-900 shadow-xl border border-slate-200`
 */

import { ref, watch, onMounted, computed } from 'vue';
import {
  apiClient,
  type Booking,
  type LifecycleStage,
  type ServiceVoucher
} from '../services/api';
import { useCompany } from '../composables/useCompany';
import {
  Car,
  Users,
  CreditCard,
  QrCode,
  Printer,
  ChevronRight,
  Sparkles,
  FileText,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Calendar,
  AlertCircle,
  Eye,
  Download,
  X,
  Send,
  Building,
  CheckCircle2,
  FileCheck,
  Percent
} from 'lucide-vue-next';

const props = defineProps<{
  activeBooking: Booking;
  bookings: Booking[];
}>();

const emit = defineEmits<{
  (e: 'booking-changed', booking: Booking): void;
  (e: 'refresh-data'): void;
}>();

const { company } = useCompany();

// Active lifecycle stage tab (1 to 6)
const currentStageTab = ref<number>(1);

// Stage 1: Editable Lead Details
const leadEditForm = ref({
  guest_name: props.activeBooking.guest_name,
  nationality: props.activeBooking.nationality,
  pax_adults: props.activeBooking.pax_adults,
  pax_children: props.activeBooking.pax_children,
  pax_infants: props.activeBooking.pax_infants || 0,
  arrival_date: props.activeBooking.arrival_date,
  departure_date: props.activeBooking.departure_date,
  arrival_flight: props.activeBooking.arrival_flight || '',
  departure_flight: props.activeBooking.departure_flight || '',
  special_requests: props.activeBooking.special_requests || '',
  assigned_consultant: 'Senior Consultant - Colombo HQ'
});

// Stage 2: Editable Resource Allocations
const resourceForm = ref({
  transport_type: props.activeBooking.transport_type || 'Toyota KDH Luxury Van (7-Seater AC)',
  driver_guide: props.activeBooking.driver_guide || 'Sunil Gamage (National Tour Guide Lecturer #N-842)',
  driver_phone: props.activeBooking.driver_phone || '+94 77 345 6789',
  driver_language: props.activeBooking.driver_language || 'English & French',
  days: JSON.parse(JSON.stringify(props.activeBooking.itinerary_days || []))
});

// Stage 3: Costing & Quotation Engine State
const quoteMarkup = ref<number>(props.activeBooking.markup_percentage || 25);
const quoteCurrency = ref<'LKR' | 'USD' | 'EUR' | 'GBP'>('LKR');
const quoteCalculation = ref<any>(null);
const discountPercent = ref<number>(0);

// Stage 4: Payment Recording Form
const paymentForm = ref({
  amount: 855000,
  currency: 'LKR' as const,
  type: 'deposit' as const,
  method: 'stripe' as const,
  reference: '',
  notes: ''
});

// Stage 5: Generated Vouchers
const generatedVouchers = ref<ServiceVoucher[]>([]);
const selectedVoucherForModal = ref<ServiceVoucher | null>(null);

// Stage 6: Client Documents State
const activeDocType = ref<'welcome_letter' | 'travel_agreement' | 'thank_you_survey' | 'quotation'>('welcome_letter');
const activeDocContent = ref<any>(null);
const docRecipientEmail = ref(props.activeBooking.agent?.email || 'traveler@destination.com');
const docPersonalNote = ref('We are delighted to welcome you to the paradise island of Sri Lanka!');
const docSendSuccess = ref(false);

// Modals visibility state
const showQuotationModal = ref(false);
const showVoucherModal = ref(false);
const showDocModal = ref(false);

// Load data for the active booking
const refreshLifecycleData = async (bookingId: number) => {
  try {
    const [quoteRes, vouchersRes, docRes] = await Promise.all([
      apiClient.calculateQuote(bookingId, { markup_percentage: quoteMarkup.value, target_currency: quoteCurrency.value }),
      apiClient.getVouchers(bookingId),
      apiClient.getDocument(bookingId, activeDocType.value)
    ]);
    quoteCalculation.value = quoteRes.data;
    generatedVouchers.value = vouchersRes.data;
    activeDocContent.value = docRes.data;
  } catch (err) {
    console.error('Failed to load lifecycle data:', err);
  }
};

const syncFormsWithActiveBooking = () => {
  leadEditForm.value = {
    guest_name: props.activeBooking.guest_name,
    nationality: props.activeBooking.nationality,
    pax_adults: props.activeBooking.pax_adults,
    pax_children: props.activeBooking.pax_children,
    pax_infants: props.activeBooking.pax_infants || 0,
    arrival_date: props.activeBooking.arrival_date,
    departure_date: props.activeBooking.departure_date,
    arrival_flight: props.activeBooking.arrival_flight || 'UL-504 CMB 08:30 AM',
    departure_flight: props.activeBooking.departure_flight || 'UL-505 CMB 18:45 PM',
    special_requests: props.activeBooking.special_requests || '',
    assigned_consultant: 'Senior Consultant - Colombo HQ'
  };

  resourceForm.value = {
    transport_type: props.activeBooking.transport_type || 'Toyota KDH Luxury Van (7-Seater AC)',
    driver_guide: props.activeBooking.driver_guide || 'Sunil Gamage (National Tour Guide Lecturer #N-842)',
    driver_phone: props.activeBooking.driver_phone || '+94 77 345 6789',
    driver_language: props.activeBooking.driver_language || 'English & French',
    days: JSON.parse(JSON.stringify(props.activeBooking.itinerary_days || []))
  };

  quoteMarkup.value = props.activeBooking.markup_percentage || 25;
};

watch(() => props.activeBooking.id, (newId) => {
  if (newId) {
    syncFormsWithActiveBooking();
    refreshLifecycleData(newId);
  }
});

onMounted(() => {
  if (props.activeBooking?.id) {
    syncFormsWithActiveBooking();
    refreshLifecycleData(props.activeBooking.id);
  }
});

// Re-calculate quotation with new markup
const handleRecalculateQuote = async () => {
  if (!props.activeBooking) return;
  const res = await apiClient.calculateQuote(props.activeBooking.id, {
    markup_percentage: quoteMarkup.value,
    target_currency: quoteCurrency.value
  });
  quoteCalculation.value = res.data;
  emit('refresh-data');
};

// Record payment transaction
const handleRecordPayment = async () => {
  if (!props.activeBooking) return;
  await apiClient.recordPayment(props.activeBooking.id, paymentForm.value);
  paymentForm.value.reference = '';
  paymentForm.value.notes = '';
  emit('refresh-data');
};

// Load specific document type
const loadDocumentType = async (type: 'welcome_letter' | 'travel_agreement' | 'thank_you_survey' | 'quotation') => {
  if (!props.activeBooking) return;
  activeDocType.value = type;
  const res = await apiClient.getDocument(props.activeBooking.id, type);
  activeDocContent.value = res.data;
};

// Switch booking
const onSelectBooking = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const found = props.bookings.find(b => b.id === Number(target.value));
  if (found) {
    emit('booking-changed', found);
  }
};

// Open Voucher Modal
const openVoucherModal = (voucher: ServiceVoucher) => {
  selectedVoucherForModal.value = voucher;
  showVoucherModal.value = true;
};

// Trigger document dispatch simulation
const handleSendDocumentEmail = () => {
  docSendSuccess.value = true;
  setTimeout(() => {
    docSendSuccess.value = false;
  }, 4000);
};

// Computed Financial Totals
const totalPaid = computed(() => {
  return (props.activeBooking.payments || []).reduce((acc, p) => acc + p.amount, 0);
});

const remainingBalance = computed(() => {
  return Math.max(0, props.activeBooking.revenue_lkr - totalPaid.value);
});
</script>

<template>
  <!-- ==================================================================== -->
  <!-- 1. ROOT WORKSPACE CONTAINER (Dark & Light Mode Responsive) -->
  <!-- ==================================================================== -->
  <div class="space-y-6 max-w-7xl mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
    
    <!-- ==================================================================== -->
    <!-- ACTIVE BOOKING HEADER CARD (Dark & Light Mode Responsive) -->
    <!-- ==================================================================== -->
    <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded font-mono font-bold">
              {{ activeBooking.booking_number }}
            </span>

            <!-- Payment Status Badge (Dark & Light) -->
            <span
              class="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border transition-colors"
              :class="{
                'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800': activeBooking.payment_status === 'fully_paid',
                'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800': activeBooking.payment_status === 'deposit_paid',
                'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700': activeBooking.payment_status === 'pending'
              }"
            >
              Payment: {{ activeBooking.payment_status.replace('_', ' ') }}
            </span>

            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
              Stage: {{ currentStageTab }} of 6
            </span>
          </div>

          <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{{ activeBooking.guest_name }}</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {{ activeBooking.nationality }} &bull; {{ activeBooking.pax_adults }} Adults, {{ activeBooking.pax_children }} Children &bull; 
            Partner Agent: <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ activeBooking.agent?.name || 'Direct Traveler' }} ({{ activeBooking.agent?.code || 'DIR' }})</span>
          </p>
        </div>

        <!-- Quick Booking Switcher Dropdown (Dark & Light) -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">Switch Booking:</span>
          <select
            :value="activeBooking.id"
            @change="onSelectBooking"
            class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 text-xs rounded-lg p-2.5 outline-none font-mono focus:ring-2"
          >
            <option v-for="b in bookings" :key="b.id" :value="b.id">
              {{ b.booking_number }} - {{ b.guest_name }} ({{ b.nationality }})
            </option>
          </select>
        </div>
      </div>

      <!-- 6-STAGE INTERACTIVE LIFECYCLE PROGRESS TABS -->
      <div class="pt-4 border-t border-slate-200 dark:border-slate-700/80">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <button
            v-for="st in [
              { num: 1, title: '1. Lead & Intake', subtitle: 'Capture & Init' },
              { num: 2, title: '2. Itinerary & Res', subtitle: 'Hotels & Fleet' },
              { num: 3, title: '3. Costing & Quote', subtitle: 'Markup & Pricing' },
              { num: 4, title: '4. Billing & Ledger', subtitle: 'Payments & Receipts' },
              { num: 5, title: '5. Vouchers & QR', subtitle: 'Supplier Passes' },
              { num: 6, title: '6. Docs & Wrap-up', subtitle: 'Welcome & Review' }
            ]"
            :key="st.num"
            @click="currentStageTab = st.num; refreshLifecycleData(activeBooking.id);"
            :class="currentStageTab === st.num
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
              : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'"
            class="p-2.5 rounded-xl border text-left transition-all"
          >
            <span class="block text-[11px] truncate font-semibold">{{ st.title }}</span>
            <span class="block text-[10px] opacity-75 truncate">{{ st.subtitle }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 1: INQUIRY & INTAKE RECORD -->
    <!-- ==================================================================== -->
    <div
      v-if="currentStageTab === 1"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-6 transition-colors shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 gap-3">
        <div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
            <span>Stage 1: Lead Capture &amp; Reservation Initialization</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Logs primary contact details, passenger headcount, flight arrival schedules, and assigned consultant.
          </p>
        </div>
        <button
          @click="currentStageTab = 2"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <span>Proceed to Stage 2: Itinerary &rarr;</span>
        </button>
      </div>

      <!-- Stage 1 Form (Form Inputs dark/light styled) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <!-- Card 1: Party & Client Details -->
        <div class="space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-5 rounded-xl">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <h5 class="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">Party &amp; Client Details</h5>
            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">REF: {{ activeBooking.booking_number }}</span>
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Lead Guest Full Name</label>
            <input
              v-model="leadEditForm.guest_name"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Nationality</label>
              <input
                v-model="leadEditForm.nationality"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Wholesale Agent</label>
              <input
                :value="activeBooking.agent?.name || 'Direct Traveler'"
                readonly
                class="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg p-2.5 outline-none cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Adults</label>
              <input
                v-model.number="leadEditForm.pax_adults"
                type="number"
                min="1"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Children</label>
              <input
                v-model.number="leadEditForm.pax_children"
                type="number"
                min="0"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Infants</label>
              <input
                v-model.number="leadEditForm.pax_infants"
                type="number"
                min="0"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 font-mono"
              />
            </div>
          </div>
        </div>

        <!-- Card 2: Flight Schedule & Requirements -->
        <div class="space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-5 rounded-xl">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <h5 class="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">Flight Schedule &amp; Requests</h5>
            <span class="text-[10px] text-slate-500 dark:text-slate-400">CMB Bandaranaike Airport</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Arrival Date</label>
              <input
                v-model="leadEditForm.arrival_date"
                type="date"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Departure Date</label>
              <input
                v-model="leadEditForm.departure_date"
                type="date"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Arrival Flight</label>
              <input
                v-model="leadEditForm.arrival_flight"
                placeholder="e.g. UL-504 08:30"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Departure Flight</label>
              <input
                v-model="leadEditForm.departure_flight"
                placeholder="e.g. EK-653 19:40"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Special Requests &amp; Dietary Notes</label>
            <textarea
              v-model="leadEditForm.special_requests"
              rows="2"
              placeholder="e.g. Vegetarian meals, honeymoon bed decoration, baby car seat..."
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 resize-none"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 2: ITINERARY & RESOURCE ALLOCATION -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 2"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-6 transition-colors shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 gap-3">
        <div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">2</span>
            <span>Stage 2: Itinerary Building &amp; Resource Allocation</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Assign partner hotel room categories, meal plans (RO, BB, HB, FB, AI), luxury fleet vehicle, and national guide.
          </p>
        </div>
        <button
          @click="currentStageTab = 3; handleRecalculateQuote();"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <span>Proceed to Stage 3: Costing &rarr;</span>
        </button>
      </div>

      <!-- Resource Allocation Summary (Fleet & Chauffeur Guide) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Vehicle Assignment -->
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Car class="w-3.5 h-3.5" /> Assigned Fleet Class
            </span>
            <span class="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">Tourist Board Approved</span>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 text-xs font-medium">Vehicle Specification</label>
            <select
              v-model="resourceForm.transport_type"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 text-xs"
            >
              <option value="Toyota KDH Luxury High-Roof Van (7-Seater AC)">Toyota KDH Luxury High-Roof Van (7-Seater AC)</option>
              <option value="Toyota Axio / Premio Executive Sedan (3-Seater AC)">Toyota Axio / Premio Executive Sedan (3-Seater AC)</option>
              <option value="Toyota Coaster Luxury Mini Coach (15-Seater AC)">Toyota Coaster Luxury Mini Coach (15-Seater AC)</option>
              <option value="Mercedes-Benz E-Class VIP Chauffeur">Mercedes-Benz E-Class VIP Chauffeur</option>
            </select>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Includes unlimited mileage, expressway tolls, passenger insurance &amp; chauffeur fuel allowance.</p>
        </div>

        <!-- Chauffeur Guide Assignment -->
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Users class="w-3.5 h-3.5" /> Allocated Chauffeur-Guide
            </span>
            <span class="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">SLTDA Certified</span>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 text-xs font-medium">Chauffeur Guide Name</label>
            <input
              v-model="resourceForm.driver_guide"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 text-xs"
            />
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-0.5 text-[11px]">Direct Mobile</label>
              <input
                v-model="resourceForm.driver_phone"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2 outline-none text-xs font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 mb-0.5 text-[11px]">Languages</label>
              <input
                v-model="resourceForm.driver_language"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2 outline-none text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Day-by-Day Hotel & Excursion Allocation Cards -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h5 class="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Day-by-Day Hotel &amp; Meal Allocations</h5>
          <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ resourceForm.days.length }} Days Circuit</span>
        </div>

        <div
          v-for="d in resourceForm.days"
          :key="d.id || d.day_number"
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-4 rounded-xl space-y-3 text-xs"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              Day {{ d.day_number }}: {{ d.destination }} &bull; {{ d.date }}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-slate-500 dark:text-slate-400 text-[11px]">Meal Plan:</span>
              <select
                v-model="d.meal_plan"
                class="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded p-1 text-[11px] font-bold"
              >
                <option value="RO">RO (Room Only)</option>
                <option value="BB">BB (Bed & Breakfast)</option>
                <option value="HB">HB (Half Board - Dinner & Breakfast)</option>
                <option value="FB">FB (Full Board - 3 Meals)</option>
                <option value="AI">AI (All Inclusive)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 dark:text-slate-400 text-[11px] mb-1 font-medium">Assigned Hotel Property</label>
              <input
                v-model="d.hotel_name"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded p-2 text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-600 dark:text-slate-400 text-[11px] mb-1 font-medium">Room Category</label>
              <input
                v-model="d.room_category"
                class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-600 dark:text-slate-400 text-[11px] mb-1 font-medium">Scheduled Excursion / Activities</label>
            <input
              v-model="d.activities"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded p-2 text-xs"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 3: COSTING & QUOTATION ENGINE -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 3"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-6 transition-colors shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 gap-3">
        <div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">3</span>
            <span>Stage 3: Financial Costing &amp; Quotation Engine</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Calculates net supplier costs, applies DMC markup, and outputs gross pricing in multiple currencies.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="showQuotationModal = true"
            class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Eye class="w-3.5 h-3.5 text-emerald-500" />
            <span>Preview Quotation PDF</span>
          </button>
          <button
            @click="currentStageTab = 4"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <span>Proceed to Stage 4: Billing &rarr;</span>
          </button>
        </div>
      </div>

      <!-- Costing Engine Controls (Form inputs & Range Slider) -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>DMC Markup Profit Margin:</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">{{ quoteMarkup }}%</span>
            </label>
            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">Target Range: 10% - 45%</span>
          </div>
          <input
            v-model.number="quoteMarkup"
            type="range"
            min="10"
            max="45"
            step="1"
            @change="handleRecalculateQuote"
            class="w-full accent-amber-500 dark:accent-amber-400 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            <span>10% (Wholesale Partner)</span>
            <span>25% (Standard DMC Margin)</span>
            <span>45% (Ultra-Luxury Bespoke)</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Display Currency</label>
          <div class="flex gap-2">
            <button
              v-for="curr in ['LKR', 'USD', 'EUR', 'GBP']"
              :key="curr"
              @click="quoteCurrency = curr as any; handleRecalculateQuote();"
              :class="quoteCurrency === curr
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
              class="flex-1 py-2 text-xs rounded-lg transition-colors font-mono"
            >
              {{ curr }}
            </button>
          </div>
        </div>
      </div>

      <!-- Net Supplier Costs Breakdown Table (Exact requested classes applied) -->
      <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs">
          <!-- Quotation/Costing table headers -->
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] border-b border-slate-200 dark:border-slate-700 font-semibold tracking-wider">
            <tr>
              <th class="p-3.5">Cost Component</th>
              <th class="p-3.5">Calculation Basis / Supplier Contract</th>
              <th class="p-3.5 text-right">Net Supplier Amount (LKR)</th>
            </tr>
          </thead>
          <!-- Table rows & dividers -->
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Hotel Accommodations (Net)</span>
              </td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">Selected 4/5-star boutique &amp; heritage properties per night</td>
              <td class="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">LKR {{ (activeBooking.expenses_hotels || 1250000).toLocaleString() }}</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Car class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Transport &amp; Fuel Allowance</span>
              </td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">{{ activeBooking.transport_type || 'Toyota KDH Luxury High-Roof Van' }}</td>
              <td class="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">LKR {{ (activeBooking.expenses_transport || 420000).toLocaleString() }}</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Licensed Guide Daily Board</span>
              </td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">SLTDA National tourist guide lecturer allowance</td>
              <td class="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">LKR {{ (activeBooking.expenses_guide || 140000).toLocaleString() }}</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excursions &amp; Safari 4x4 Jeeps</span>
              </td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400">Yala National Park Safari 4x4, Sigiriya Fortress entrance, Scenic Hill Train</td>
              <td class="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">LKR {{ (activeBooking.expenses_activities || 210000).toLocaleString() }}</td>
            </tr>

            <!-- Net Total Row -->
            <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
              <td colspan="2" class="p-4 text-slate-800 dark:text-slate-200 uppercase text-[11px] tracking-wider">
                Total Net Supplier Direct Cost:
              </td>
              <td class="p-4 text-right font-mono text-slate-900 dark:text-white text-sm">
                LKR {{ ((activeBooking.expenses_hotels || 1250000) + (activeBooking.expenses_transport || 420000) + (activeBooking.expenses_guide || 140000) + (activeBooking.expenses_activities || 210000)).toLocaleString() }}
              </td>
            </tr>

            <!-- Gross Quotation Total (Profit Margin / Badges requested) -->
            <tr class="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-t border-emerald-300 dark:border-emerald-800 font-bold">
              <td colspan="2" class="p-4">
                <div class="flex items-center gap-2">
                  <span class="uppercase text-xs tracking-wider">Gross Client Quotation (+{{ quoteMarkup }}% DMC Margin):</span>
                  <span class="text-[10px] bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded font-mono">
                    PROFIT: LKR {{ Math.round(activeBooking.revenue_lkr * (quoteMarkup / 100)).toLocaleString() }}
                  </span>
                </div>
              </td>
              <td class="p-4 text-right font-mono text-base text-emerald-700 dark:text-emerald-300">
                LKR {{ activeBooking.revenue_lkr.toLocaleString() }}
                <span class="block text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                  approx. ${{ activeBooking.revenue_usd || Math.round(activeBooking.revenue_lkr / 300) }} USD / €{{ Math.round(activeBooking.revenue_lkr / 330) }} EUR
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 4: BILLING & PAYMENT PROCESSING -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 4"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-6 transition-colors shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 gap-3">
        <div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">4</span>
            <span>Stage 4: Invoicing, Receipts &amp; Payment Processing</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Track deposit schedules (30%), balance settlements (70%), and update ledger status.
          </p>
        </div>
        <button
          @click="currentStageTab = 5"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <span>Proceed to Stage 5: Vouchers &rarr;</span>
        </button>
      </div>

      <!-- Financial Summary Cards (Dark & Light Mode Badges) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Card 1: Total Invoiced -->
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1">
          <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Invoiced Amount</span>
          <p class="text-2xl font-bold font-mono text-slate-900 dark:text-white">LKR {{ activeBooking.revenue_lkr.toLocaleString() }}</p>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Pro-forma invoice #PI-{{ activeBooking.booking_number }}</span>
        </div>

        <!-- Card 2: Total Received (Success Badge) -->
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Received</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
              Verified
            </span>
          </div>
          <p class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            LKR {{ totalPaid.toLocaleString() }}
          </p>
          <span class="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
            {{ Math.round((totalPaid / activeBooking.revenue_lkr) * 100) }}% Settled
          </span>
        </div>

        <!-- Card 3: Remaining Balance (Pending Badge) -->
        <div class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Outstanding Balance</span>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              :class="remainingBalance === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'"
            >
              {{ remainingBalance === 0 ? 'Nil Balance' : 'Pending Due' }}
            </span>
          </div>
          <p class="text-2xl font-bold font-mono" :class="remainingBalance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
            LKR {{ remainingBalance.toLocaleString() }}
          </p>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Due 14 days prior to arrival</span>
        </div>
      </div>

      <!-- Payment Record Form (Form input fixes applied) -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
        <h5 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Record New Transaction / Wire Transfer</span>
        </h5>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Amount (LKR)</label>
            <input
              v-model.number="paymentForm.amount"
              type="number"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 font-mono outline-none focus:ring-2"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Payment Type</label>
            <select
              v-model="paymentForm.type"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2"
            >
              <option value="deposit">Deposit Payment (30%)</option>
              <option value="balance">Balance Settlement (70%)</option>
              <option value="full">Full Settlement (100%)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Payment Method</label>
            <select
              v-model="paymentForm.method"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2"
            >
              <option value="stripe">Stripe Online Checkout</option>
              <option value="payhere">PayHere Sri Lanka Gateway</option>
              <option value="bank_transfer">International Bank Wire (SWIFT)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Transaction Reference</label>
            <input
              v-model="paymentForm.reference"
              placeholder="e.g. TX-90218"
              class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 font-mono outline-none focus:ring-2"
            />
          </div>
        </div>

        <button
          @click="handleRecordPayment"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Log Payment Receipt &amp; Update Ledger</span>
        </button>
      </div>

      <!-- Transaction Ledger Table -->
      <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs font-mono">
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-sans border-b border-slate-200 dark:border-slate-700 font-semibold tracking-wider">
            <tr>
              <th class="p-3.5">Transaction ID</th>
              <th class="p-3.5">Date</th>
              <th class="p-3.5">Type</th>
              <th class="p-3.5">Method</th>
              <th class="p-3.5">Reference</th>
              <th class="p-3.5 text-right font-sans">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            <tr
              v-for="p in activeBooking.payments"
              :key="p.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{{ p.id }}</td>
              <td class="p-3.5 text-slate-600 dark:text-slate-400 font-sans">{{ p.date }}</td>
              <td class="p-3.5 uppercase text-[11px] font-sans">
                <span class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded text-[10px]">
                  {{ p.type }}
                </span>
              </td>
              <td class="p-3.5 uppercase text-[11px] font-sans">{{ p.method }}</td>
              <td class="p-3.5 text-slate-600 dark:text-slate-400">{{ p.reference || 'N/A' }}</td>
              <td class="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                {{ p.amount.toLocaleString() }}
              </td>
            </tr>
            <tr v-if="!activeBooking.payments || !activeBooking.payments.length">
              <td colspan="6" class="p-5 text-center text-slate-500 font-sans">No payment transactions recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 5: SERVICE VOUCHERS & QR DISPATCH -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 5"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-6 transition-colors shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 gap-3">
        <div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">5</span>
            <span>Stage 5: Booking Confirmation &amp; Service Voucher Dispatch</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Generates digital hotel check-in vouchers, driver duty slips, and verification QR tokens for suppliers.
          </p>
        </div>
        <button
          @click="currentStageTab = 6"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <span>Proceed to Stage 6: Client Docs &rarr;</span>
        </button>
      </div>

      <!-- Vouchers Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="vouch in generatedVouchers"
          :key="vouch.id"
          class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3 relative overflow-hidden shadow-sm hover:border-emerald-500/50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div>
              <span class="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                TOKEN: {{ vouch.verification_token }}
              </span>
              <h5 class="font-bold text-slate-900 dark:text-white text-sm mt-2">{{ vouch.title }}</h5>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Supplier: <strong>{{ vouch.supplier_name }}</strong> &bull; Valid: {{ vouch.valid_date }}</p>
            </div>

            <!-- QR Code Icon Box (Dark & Light) -->
            <button
              @click="openVoucherModal(vouch)"
              class="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 p-1 flex items-center justify-center text-slate-900 dark:text-white shrink-0 hover:border-emerald-500 transition-colors"
              title="Click to preview printable voucher with QR code"
            >
              <QrCode class="w-8 h-8" />
            </button>
          </div>

          <div class="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p><span class="text-slate-500 dark:text-slate-400">Service:</span> {{ vouch.service_details }}</p>
            <p><span class="text-slate-500 dark:text-slate-400">Allocated:</span> {{ vouch.room_or_vehicle }}</p>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">DMC Direct Authorization</span>
            <button
              @click="openVoucherModal(vouch)"
              class="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold flex items-center gap-1.5"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>Preview Voucher Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- STAGE 6: AUTOMATED CLIENT DOCUMENTS & POST-TRIP -->
    <!-- ==================================================================== -->
    <div
      v-else-if="currentStageTab === 6"
      class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-6 transition-colors shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-4 gap-3">
        <div>
          <h4 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">6</span>
            <span>Stage 6: Client Documentation &amp; Post-Trip Wrap-up</span>
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Guest arrival Welcome Letter, Legal Terms Agreement, and post-trip feedback review survey.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="showDocModal = true"
            class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Eye class="w-3.5 h-3.5 text-emerald-500" />
            <span>Fullscreen Modal Preview</span>
          </button>
          <span class="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800">
            Lifecycle Complete &bull; Ready for Tour
          </span>
        </div>
      </div>

      <!-- Document Selector Tabs -->
      <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
        <button
          v-for="d in [
            { type: 'welcome_letter', label: 'Guest Arrival Welcome Letter' },
            { type: 'travel_agreement', label: 'Legal Terms & Booking Conditions' },
            { type: 'thank_you_survey', label: 'Post-Trip Feedback & Review Survey' }
          ]"
          :key="d.type"
          @click="loadDocumentType(d.type as any)"
          :class="activeDocType === d.type
            ? 'bg-emerald-600 text-white font-bold shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
          class="px-4 py-2 rounded-lg text-xs transition-colors"
        >
          {{ d.label }}
        </button>
      </div>

      <!-- Email Dispatch Config -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-end">
        <div>
          <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Recipient Email</label>
          <input
            v-model="docRecipientEmail"
            class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 font-mono text-xs"
          />
        </div>
        <div>
          <label class="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Personalized Consultant Greeting</label>
          <input
            v-model="docPersonalNote"
            class="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-amber-500 dark:focus:ring-amber-400 border rounded-lg p-2.5 outline-none focus:ring-2 text-xs"
          />
        </div>
        <div>
          <button
            @click="handleSendDocumentEmail"
            class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Email Document to Guest</span>
          </button>
        </div>
      </div>

      <div v-if="docSendSuccess" class="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        <span>Document successfully dispatched via email to {{ docRecipientEmail }}!</span>
      </div>

      <!-- Document Render Container: Modal/Paper Presentation Strategy -->
      <div class="bg-slate-100 dark:bg-slate-800/80 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <!-- Action bar in Dark/Light styling -->
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          <span>{{ company.name }} Official Documentation Preview</span>
          <div class="flex items-center gap-3">
            <button onclick="window.print()" class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 hover:underline">
              <Printer class="w-4 h-4" /> Print Document
            </button>
          </div>
        </div>

        <!-- The actual printable paper sheet: explicitly white with dark text so letters resemble physical paper -->
        <div class="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 max-w-3xl mx-auto space-y-4">
          <div v-if="activeDocContent" v-html="activeDocContent.content_html"></div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- 4. GENERATED DOCUMENTS & PREVIEW MODALS (EXACT SPECIFICATION) -->
    <!-- ==================================================================== -->

    <!-- MODAL A: QUOTATION PDF PREVIEW MODAL -->
    <div
      v-if="showQuotationModal"
      class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Action Toolbar (Dark mode compliant) -->
        <div class="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Official Quotation Proposal Document &bull; {{ activeBooking.booking_number }}
            </h4>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="window.print()"
              class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print Quotation</span>
            </button>
            <button
              @click="showQuotationModal = false"
              class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Printable Document Body (Explicitly white paper container) -->
        <div class="p-6 overflow-y-auto bg-slate-200/50 dark:bg-slate-950/60 flex-1">
          <div class="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 max-w-3xl mx-auto space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <h2 class="text-2xl font-bold tracking-tight text-emerald-800">{{ company.name }}</h2>
                <p class="text-xs text-slate-500 mt-1">{{ company.address }}</p>
                <p class="text-xs text-slate-500">Tel: {{ company.phone }} &bull; Web: {{ company.websiteUrl }}</p>
              </div>
              <div class="text-right">
                <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                  PROPOSAL #QT-{{ activeBooking.booking_number }}
                </span>
                <p class="text-xs text-slate-500 mt-2 font-mono">Date: {{ new Date().toISOString().split('T')[0] }}</p>
                <p class="text-xs text-slate-500 font-mono">Validity: 14 Days</p>
              </div>
            </div>

            <!-- Client & Itinerary details -->
            <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span class="text-slate-500 uppercase text-[10px] font-bold">Prepared For:</span>
                <p class="font-bold text-slate-900 text-sm mt-0.5">{{ activeBooking.guest_name }}</p>
                <p class="text-slate-600">{{ activeBooking.nationality }} &bull; {{ activeBooking.pax_adults }} Adults, {{ activeBooking.pax_children }} Children</p>
                <p class="text-slate-600">Partner Agent: {{ activeBooking.agent?.name || 'Direct Client' }}</p>
              </div>
              <div>
                <span class="text-slate-500 uppercase text-[10px] font-bold">Tour Details:</span>
                <p class="font-bold text-slate-900 text-sm mt-0.5">{{ activeBooking.arrival_date }} &rarr; {{ activeBooking.departure_date }}</p>
                <p class="text-slate-600">Fleet: {{ activeBooking.transport_type || 'Executive Luxury Van' }}</p>
                <p class="text-slate-600">Guide: {{ activeBooking.driver_guide || 'Certified Chauffeur Guide' }}</p>
              </div>
            </div>

            <!-- Pricing Breakdown Table -->
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                  <tr>
                    <th class="p-3">Tour Service Description</th>
                    <th class="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr>
                    <td class="p-3">Comprehensive Sri Lanka Private Tour Package (Accommodation, Transport, Guide &amp; Activities)</td>
                    <td class="p-3 text-right font-mono font-bold">LKR {{ activeBooking.revenue_lkr.toLocaleString() }}</td>
                  </tr>
                  <tr class="bg-emerald-50 text-emerald-900 font-bold text-sm">
                    <td class="p-3">TOTAL QUOTED AMOUNT (Inclusive of all Tourism Taxes):</td>
                    <td class="p-3 text-right font-mono">
                      LKR {{ activeBooking.revenue_lkr.toLocaleString() }}
                      <span class="block text-xs font-normal text-emerald-700">approx. ${{ activeBooking.revenue_usd || Math.round(activeBooking.revenue_lkr / 300) }} USD</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Terms -->
            <div class="text-[11px] text-slate-500 space-y-1 border-t border-slate-200 pt-4">
              <p><strong>Payment Terms:</strong> 30% deposit upon confirmation, 70% balance 14 days prior to arrival.</p>
              <p><strong>Cancellation:</strong> 100% refund up to 30 days prior, 50% refund between 15-29 days prior.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL B: SERVICE VOUCHERS PREVIEW MODAL -->
    <div
      v-if="showVoucherModal && selectedVoucherForModal"
      class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Action Toolbar -->
        <div class="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <QrCode class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Official Service Voucher &bull; {{ selectedVoucherForModal.verification_token }}
            </h4>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="window.print()"
              class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              @click="showVoucherModal = false"
              class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Printable Document Body (Paper Sheet) -->
        <div class="p-6 overflow-y-auto bg-slate-200/50 dark:bg-slate-950/60 flex-1">
          <div class="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 max-w-2xl mx-auto space-y-6">
            <div class="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
              <div>
                <h3 class="text-xl font-bold text-slate-900">{{ company.name }}</h3>
                <span class="text-xs uppercase font-bold text-emerald-700 tracking-wider">OFFICIAL SERVICE VOUCHER</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                  TOKEN: {{ selectedVoucherForModal.verification_token }}
                </span>
                <p class="text-[11px] text-slate-500 mt-1 font-mono">Issued: {{ new Date().toISOString().split('T')[0] }}</p>
              </div>
            </div>

            <!-- Voucher Info Grid -->
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div class="space-y-1">
                <span class="text-slate-500 uppercase text-[10px] font-bold">To Service Supplier:</span>
                <p class="font-bold text-slate-900 text-sm">{{ selectedVoucherForModal.supplier_name }}</p>
                <p class="text-slate-600">Please provide the services outlined below as agreed with {{ company.name }}.</p>
              </div>
              <div class="space-y-1">
                <span class="text-slate-500 uppercase text-[10px] font-bold">Booking Details:</span>
                <p class="font-bold text-slate-900 text-sm">Guest: {{ activeBooking.guest_name }}</p>
                <p class="text-slate-600">Headcount: {{ activeBooking.pax_adults }} Adults, {{ activeBooking.pax_children }} Children</p>
                <p class="text-slate-600">Valid Date: <strong>{{ selectedVoucherForModal.valid_date }}</strong></p>
              </div>
            </div>

            <!-- Service Box -->
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div class="flex justify-between font-bold text-slate-900">
                <span>Voucher Type: {{ selectedVoucherForModal.title }}</span>
                <span class="text-emerald-700">CONFIRMED &amp; BILLABLE TO DMC</span>
              </div>
              <p class="text-slate-700"><strong>Service Details:</strong> {{ selectedVoucherForModal.service_details }}</p>
              <p class="text-slate-700"><strong>Allocation / Room Category:</strong> {{ selectedVoucherForModal.room_or_vehicle }}</p>
            </div>

            <!-- Verification QR Box -->
            <div class="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div class="w-16 h-16 bg-white p-1 rounded-lg border border-emerald-300 flex items-center justify-center shrink-0">
                <QrCode class="w-14 h-14 text-slate-900" />
              </div>
              <div class="text-xs text-slate-700 space-y-0.5">
                <p class="font-bold text-emerald-900">Anti-Fraud Digital Verification QR Code</p>
                <p class="text-[11px] text-slate-600">Hotel check-in desks and chauffeur drivers can scan this token to authenticate this voucher directly on the DMC ledger.</p>
                <p class="text-[11px] font-mono text-emerald-800">Token hash: {{ selectedVoucherForModal.verification_token }}</p>
              </div>
            </div>

            <div class="flex justify-between items-end pt-4 border-t border-slate-200 text-[11px] text-slate-500">
              <div>
                <p>Authorized Signature: _________________________</p>
                <p class="text-[10px] mt-0.5">{{ company.name }} Tour Operations Desk</p>
              </div>
              <div class="text-right">
                <p>Supplier Invoice Due: 30 Days Net</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL C: WELCOME LETTER & CLIENT DOCS PREVIEW MODAL -->
    <div
      v-if="showDocModal"
      class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <!-- Action Toolbar -->
        <div class="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <FileCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Client Documentation Preview &bull; {{ activeDocType.replace('_', ' ').toUpperCase() }}
            </h4>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="window.print()"
              class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              @click="showDocModal = false"
              class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Printable Document Body -->
        <div class="p-6 overflow-y-auto bg-slate-200/50 dark:bg-slate-950/60 flex-1">
          <div class="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200 max-w-3xl mx-auto space-y-4">
            <div v-if="activeDocContent" v-html="activeDocContent.content_html"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
