/**
 * ==============================================================================
 * SERENDIB & METSHU DMC - COMPLETE 6-STAGE RESERVATION LIFECYCLE API SERVICE
 * ==============================================================================
 * 
 * Implements the End-to-End DMC Travel Reservation Lifecycle:
 * 1. Inquiry & Booking Intake (Lead Capture & Initial Record Creation)
 * 2. Itinerary Building & Resource Allocation (Destinations, Hotels with Meal Plans, Fleet & Guide)
 * 3. Financial Costing & Quotation Generation (Net Supplier Costs + Markup + Currencies)
 * 4. Billing, Invoicing & Payment Processing (Pro-forma Invoices, Deposit & Balance Recording)
 * 5. Booking Confirmation & Voucher Generation (Hotel Vouchers, Driver Duty Slips, QR verification)
 * 6. Automated Client Communication & Documents (Guest Welcome Letter, Legal Agreement, Post-trip Survey)
 * ==============================================================================
 */

import axios, { type AxiosInstance, type AxiosError } from "axios";

// ------------------------------------------------------------------------------
// DATA MODELS & ENUMS
// ------------------------------------------------------------------------------

export type LifecycleStage =
  | "inquiry_intake"
  | "itinerary_customization"
  | "quotation_billing"
  | "confirmation_vouchers"
  | "operations_dispatch"
  | "post_trip";

export type PaymentStatus = "pending" | "deposit_paid" | "fully_paid" | "cancelled";

export type MealPlan = "RO" | "BB" | "HB" | "FB" | "AI"; // Room Only, Bed & Breakfast, Half Board, Full Board, All Inclusive

export interface Agent {
  id: number;
  code: string;
  name: string;
  country: string;
  contact_person: string;
  email: string;
  phone: string;
  current_seq: number;
  created_at?: string;
  updated_at?: string;
}

export interface NewAgent {
  code: string;
  name: string;
  country: string;
  contact_person: string;
  email: string;
  phone: string;
}

export interface ItineraryDay {
  id?: number;
  booking_id?: number;
  day_number: number;
  date: string;
  destination: string;
  hotel_name: string;
  room_category?: string;
  meal_plan?: MealPlan;
  meals: string;
  activities: string;
  transport: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  booking_id: number;
  amount: number;
  currency: "LKR" | "USD" | "EUR" | "GBP";
  type: "deposit" | "balance" | "full";
  method: "stripe" | "payhere" | "bank_transfer";
  reference: string;
  date: string;
  notes?: string;
}

export interface ServiceVoucher {
  id: string;
  type: "hotel_checkin" | "transport_duty_slip" | "safari_pass";
  title: string;
  supplier_name: string;
  booking_number: string;
  guest_name: string;
  valid_date: string;
  service_details: string;
  room_or_vehicle: string;
  meal_plan?: string;
  verification_token: string;
  qr_data: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  agent_id: number;
  guest_name: string;
  nationality: string;
  pax_adults: number;
  pax_children: number;
  pax_infants?: number;
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight: string;
  transport_type: string;
  driver_guide: string;
  driver_phone?: string;
  driver_language?: string;
  status: string; // "In Operation", "Confirmed", "Completed", "Cancelled"
  lifecycle_stage: LifecycleStage;
  payment_status: PaymentStatus;
  special_requests?: string | null;
  revenue_lkr: number;
  revenue_usd?: number;
  markup_percentage?: number;
  expenses_hotels?: number;
  expenses_transport?: number;
  expenses_guide?: number;
  expenses_activities?: number;
  expenses_other?: number;
  payments: PaymentRecord[];
  agent?: Agent;
  itinerary_days?: ItineraryDay[];
}

export interface NewBooking {
  agent_id: number | string;
  guest_name: string;
  nationality: string;
  pax_adults: number;
  pax_children: number;
  pax_infants?: number;
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight: string;
  transport_type: string;
  driver_guide: string;
  revenue_lkr: number;
  special_requests?: string;
}

export interface Inquiry {
  id: number;
  full_name: string;
  email: string;
  nationality: string;
  arrival_date: string;
  departure_date: string;
  travelers: number;
  package_interest: string;
  interests: string;
  message: string;
  status: "New" | "Contacted" | "Closed";
  created_at?: string;
}

export interface NewInquiry {
  full_name: string;
  email: string;
  nationality: string;
  arrival_date: string;
  departure_date: string;
  travelers: number;
  package_interest: string;
  interests: string;
  message: string;
}

// ------------------------------------------------------------------------------
// BASE URL RESOLUTION
// ------------------------------------------------------------------------------

const STORAGE_API_KEY = "serendib_api_base_url";

export function getStoredApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_API_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_API_BASE_URL || "/api";
}

export function setStoredApiBaseUrl(url: string): void {
  const cleanUrl = url.trim();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_API_KEY, cleanUrl);
  }
  api.defaults.baseURL = cleanUrl;
}

export const api: AxiosInstance = axios.create({
  baseURL: getStoredApiBaseUrl(),
  timeout: 6000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ------------------------------------------------------------------------------
// IN-BROWSER PERSISTENT MOCK STORE FOR ALL 6 LIFECYCLE STAGES
// ------------------------------------------------------------------------------

const MOCK_STORAGE_KEY = "serendib_metshu_lifecycle_store_v2";

interface MockStore {
  agents: Agent[];
  bookings: Booking[];
  inquiries: Inquiry[];
}

function getInitialMockStore(): MockStore {
  const defaultAgent: Agent = {
    id: 1,
    code: "ABC",
    name: "ABC Travel UK Ltd",
    country: "United Kingdom",
    contact_person: "Sarah Jenkins",
    email: "sarah@abctravel.co.uk",
    phone: "+44 20 7946 0912",
    current_seq: 1,
    created_at: "2026-10-01T08:00:00.000Z",
  };

  const defaultBooking: Booking = {
    id: 1,
    booking_number: "ABC-2026-0001",
    agent_id: 1,
    guest_name: "Mr. David Smith & Family",
    nationality: "British",
    pax_adults: 2,
    pax_children: 1,
    pax_infants: 0,
    arrival_date: "2026-10-10",
    departure_date: "2026-10-17",
    arrival_flight: "UL504 @ 12:40 PM",
    departure_flight: "UL503 @ 02:15 PM",
    transport_type: "Luxury AC Van (Toyota KDH)",
    driver_guide: "Samantha Bandara (National Guide)",
    driver_phone: "+94 77 123 4567",
    driver_language: "English, German",
    status: "In Operation",
    lifecycle_stage: "operations_dispatch",
    payment_status: "fully_paid",
    special_requests: "Honeymoon arrangement, vegetarian meal.",
    revenue_lkr: 2850000,
    revenue_usd: 9500,
    markup_percentage: 25,
    expenses_hotels: 1250000,
    expenses_transport: 420000,
    expenses_guide: 140000,
    expenses_activities: 210000,
    expenses_other: 65000,
    payments: [
      {
        id: "PAY-101",
        booking_id: 1,
        amount: 855000,
        currency: "LKR",
        type: "deposit",
        method: "stripe",
        reference: "ch_3N8912831",
        date: "2026-09-15",
        notes: "30% Initial Deposit Paid",
      },
      {
        id: "PAY-102",
        booking_id: 1,
        amount: 1995000,
        currency: "LKR",
        type: "balance",
        method: "bank_transfer",
        reference: "SWIFT-UK-90218",
        date: "2026-10-01",
        notes: "70% Balance settlement confirmed",
      },
    ],
    agent: defaultAgent,
    itinerary_days: [
      {
        id: 1,
        booking_id: 1,
        day_number: 1,
        date: "2026-10-10",
        destination: "Colombo",
        hotel_name: "Cinnamon Grand Colombo",
        room_category: "Premium Deluxe Sea View",
        meal_plan: "HB",
        meals: "Dinner included",
        activities: "Airport VIP greeting, Colombo City Tour & Welcome Pack presentation",
        transport: "Luxury AC Van (Toyota KDH)",
        notes: "Welcome garland and cold towels",
      },
      {
        id: 2,
        booking_id: 1,
        day_number: 2,
        date: "2026-10-11",
        destination: "Sigiriya / Dambulla",
        hotel_name: "Heritance Kandalama",
        room_category: "Superior Forest View",
        meal_plan: "HB",
        meals: "Breakfast & Dinner",
        activities: "Dambulla Rock Cave Temple guided tour",
        transport: "Luxury AC Van",
        notes: "Check in by 4:00 PM",
      },
      {
        id: 3,
        booking_id: 1,
        day_number: 3,
        date: "2026-10-12",
        destination: "Sigiriya",
        hotel_name: "Heritance Kandalama",
        room_category: "Superior Forest View",
        meal_plan: "HB",
        meals: "Breakfast & Dinner",
        activities: "Early morning Sigiriya Lion Rock Fortress climb & authentic Habarana village tour",
        transport: "Luxury AC Van",
        notes: "Climb Lion Rock before noon heat",
      },
      {
        id: 4,
        booking_id: 1,
        day_number: 4,
        date: "2026-10-13",
        destination: "Kandy",
        hotel_name: "Earl's Regency Kandy",
        room_category: "Deluxe Mountain View",
        meal_plan: "HB",
        meals: "Breakfast & Dinner",
        activities: "Matale Spice Garden & Evening Temple of the Tooth Relic ceremony",
        transport: "Luxury AC Van",
        notes: "Kandyan cultural drum and dance show at 5:00 PM",
      },
      {
        id: 5,
        booking_id: 1,
        day_number: 5,
        date: "2026-10-14",
        destination: "Nuwara Eliya",
        hotel_name: "Grand Hotel Nuwara Eliya",
        room_category: "Governor’s Suite",
        meal_plan: "HB",
        meals: "Breakfast & Dinner",
        activities: "Scenic hill country train ride to Nanu Oya & Pedro Tea Estate factory tour",
        transport: "Train + Luxury AC Van",
        notes: "Observation car tickets confirmed",
      },
      {
        id: 6,
        booking_id: 1,
        day_number: 6,
        date: "2026-10-15",
        destination: "Bentota",
        hotel_name: "Taj Bentota Resort & Spa",
        room_category: "Deluxe Ocean Facing",
        meal_plan: "BB",
        meals: "Breakfast",
        activities: "Drive to southwest coast, sunset walk on golden beach",
        transport: "Luxury AC Van",
        notes: "Honeymoon flower setup in room",
      },
      {
        id: 7,
        booking_id: 1,
        day_number: 7,
        date: "2026-10-16",
        destination: "Colombo Airport",
        hotel_name: "Departure",
        room_category: "N/A",
        meal_plan: "BB",
        meals: "Breakfast",
        activities: "Madu River mangrove safari, Turtle Conservation & Colombo Airport transfer",
        transport: "Luxury AC Van",
        notes: "Departure flight UL503 @ 02:15 PM",
      },
    ],
  };

  const defaultInquiry: Inquiry = {
    id: 1,
    full_name: "Eleanor Vance",
    email: "eleanor.vance@example.co.uk",
    nationality: "British",
    arrival_date: "2026-11-15",
    departure_date: "2026-11-25",
    travelers: 2,
    package_interest: "9n-10d-heritage",
    interests: "Culture, scenic train journey, wildlife safari",
    message: "Interested in a customized 10-day itinerary with private guide and luxury boutique heritage hotels.",
    status: "New",
    created_at: new Date().toISOString(),
  };

  return {
    agents: [defaultAgent],
    bookings: [defaultBooking],
    inquiries: [defaultInquiry],
  };
}

function loadMockStore(): MockStore {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(MOCK_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  const init = getInitialMockStore();
  saveMockStore(init);
  return init;
}

function saveMockStore(store: MockStore): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  }
}

// ------------------------------------------------------------------------------
// COMPLETE LIFECYCLE SERVICE & REST API CLIENT
// ------------------------------------------------------------------------------

export const apiClient = {
  // Connection tester
  async checkConnection(): Promise<{ isOnline: boolean; message: string; url: string }> {
    const targetUrl = getStoredApiBaseUrl();
    try {
      await api.get("/agents", { timeout: 3000 });
      return {
        isOnline: true,
        message: "Successfully connected to Laravel REST API!",
        url: targetUrl,
      };
    } catch (err: unknown) {
      const error = err as AxiosError;
      return {
        isOnline: false,
        message: error.message || "Could not reach server at " + targetUrl,
        url: targetUrl,
      };
    }
  },

  // STAGE 1: INQUIRIES & LEAD CAPTURE
  async getInquiries(): Promise<{ data: Inquiry[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Inquiry[]>("/inquiries");
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      return { data: store.inquiries, source: "mock" };
    }
  },

  async createInquiry(payload: NewInquiry): Promise<{ data: Inquiry; source: "laravel" | "mock" }> {
    try {
      const res = await api.post<Inquiry>("/inquiries", payload);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const newInquiry: Inquiry = {
        id: Date.now(),
        ...payload,
        status: "New",
        created_at: new Date().toISOString(),
      };
      store.inquiries.unshift(newInquiry);
      saveMockStore(store);
      return { data: newInquiry, source: "mock" };
    }
  },

  async updateInquiryStatus(
    id: number,
    status: Inquiry["status"],
  ): Promise<{ data: Inquiry; source: "laravel" | "mock" }> {
    try {
      const res = await api.patch<Inquiry>(`/inquiries/${id}/status`, { status });
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const inq = store.inquiries.find((i) => i.id === id);
      if (!inq) throw new Error("Inquiry not found");
      inq.status = status;
      saveMockStore(store);
      return { data: inq, source: "mock" };
    }
  },

  // STAGE 1 & OVERSEAS AGENTS
  async getAgents(): Promise<{ data: Agent[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Agent[]>("/agents");
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      return { data: store.agents, source: "mock" };
    }
  },

  async createAgent(payload: NewAgent): Promise<{ data: Agent; source: "laravel" | "mock" }> {
    try {
      const res = await api.post<Agent>("/agents", payload);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const newAgent: Agent = {
        id: Date.now(),
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        country: payload.country.trim(),
        contact_person: payload.contact_person.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        current_seq: 0,
        created_at: new Date().toISOString(),
      };
      store.agents.unshift(newAgent);
      saveMockStore(store);
      return { data: newAgent, source: "mock" };
    }
  },

  // STAGE 1: BOOKING CREATION
  async getBookings(): Promise<{ data: Booking[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Booking[]>("/bookings");
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      return { data: store.bookings, source: "mock" };
    }
  },

  async createBooking(payload: NewBooking): Promise<{ data: Booking; source: "laravel" | "mock" }> {
    try {
      const res = await api.post<Booking>("/bookings", payload);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const agentIdNum = Number(payload.agent_id);
      const agent = store.agents.find((a) => a.id === agentIdNum);
      const nextSeq = (agent?.current_seq ?? 0) + 1;
      if (agent) {
        agent.current_seq = nextSeq;
      }
      const agentCode = agent?.code || "SRN";
      const bookingNumber = `${agentCode}-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`;
      const rev = Number(payload.revenue_lkr) || 0;

      const newBooking: Booking = {
        id: Date.now(),
        booking_number: bookingNumber,
        agent_id: agentIdNum,
        agent,
        guest_name: payload.guest_name.trim(),
        nationality: payload.nationality.trim(),
        pax_adults: Number(payload.pax_adults) || 2,
        pax_children: Number(payload.pax_children) || 0,
        pax_infants: Number(payload.pax_infants) || 0,
        arrival_date: payload.arrival_date,
        departure_date: payload.departure_date,
        arrival_flight: payload.arrival_flight || "UL504 @ 12:40 PM",
        departure_flight: payload.departure_flight || "UL503 @ 02:15 PM",
        transport_type: payload.transport_type || "Luxury AC Van (Toyota KDH)",
        driver_guide: payload.driver_guide || "Samantha Bandara (National Guide)",
        driver_phone: "+94 77 123 4567",
        driver_language: "English",
        status: "In Operation",
        lifecycle_stage: "itinerary_customization",
        payment_status: "pending",
        special_requests: payload.special_requests || null,
        revenue_lkr: rev,
        revenue_usd: Math.round(rev / 300),
        markup_percentage: 25,
        expenses_hotels: Math.round(rev * 0.45),
        expenses_transport: Math.round(rev * 0.15),
        expenses_guide: Math.round(rev * 0.05),
        expenses_activities: Math.round(rev * 0.08),
        expenses_other: Math.round(rev * 0.02),
        payments: [],
        itinerary_days: [
          {
            id: 1,
            day_number: 1,
            date: payload.arrival_date,
            destination: "Colombo",
            hotel_name: "Cinnamon Grand Colombo",
            room_category: "Deluxe City View",
            meal_plan: "HB",
            meals: "Dinner included",
            activities: "Airport greeting, Colombo City Tour & Welcome Pack",
            transport: payload.transport_type,
          },
        ],
      };
      store.bookings.unshift(newBooking);
      saveMockStore(store);
      return { data: newBooking, source: "mock" };
    }
  },

  // STAGE 2: ITINERARY BUILDING & RESOURCE ALLOCATION
  async updateItinerary(
    bookingId: number,
    days: ItineraryDay[],
  ): Promise<{ data: Booking; source: "laravel" | "mock" }> {
    try {
      const res = await api.put<Booking>(`/bookings/${bookingId}/itinerary`, { days });
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const booking = store.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");
      booking.itinerary_days = days.map((d, i) => ({
        ...d,
        day_number: i + 1,
      }));
      booking.lifecycle_stage = "quotation_billing";
      saveMockStore(store);
      return { data: booking, source: "mock" };
    }
  },

  // STAGE 2: FLEET & CHAUFFEUR GUIDE ALLOCATION
  async updateAllocations(
    bookingId: number,
    allocations: {
      transport_type: string;
      driver_guide: string;
      driver_phone: string;
      driver_language: string;
    },
  ): Promise<{ data: Booking; source: "laravel" | "mock" }> {
    try {
      const res = await api.put<Booking>(`/bookings/${bookingId}/allocations`, allocations);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const booking = store.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");
      booking.transport_type = allocations.transport_type;
      booking.driver_guide = allocations.driver_guide;
      booking.driver_phone = allocations.driver_phone;
      booking.driver_language = allocations.driver_language;
      saveMockStore(store);
      return { data: booking, source: "mock" };
    }
  },

  // STAGE 3: FINANCIAL COSTING & QUOTATION ENGINE
  async calculateQuote(
    bookingId: number,
    params: {
      markup_percentage: number;
      target_currency?: "LKR" | "USD" | "EUR" | "GBP";
    },
  ): Promise<{
    data: {
      booking: Booking;
      net_hotels: number;
      net_transport: number;
      net_guide: number;
      net_activities: number;
      net_total: number;
      markup_amount: number;
      gross_total_lkr: number;
      gross_total_usd: number;
      deposit_required: number;
    };
    source: "laravel" | "mock";
  }> {
    try {
      const res = await api.post(`/bookings/${bookingId}/calculate-quote`, params);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const booking = store.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const daysCount = booking.itinerary_days?.length || 7;
      const net_hotels = daysCount * 140000;
      const net_transport = daysCount * 45000;
      const net_guide = daysCount * 18000;
      const net_activities = daysCount * 25000;
      const net_total = net_hotels + net_transport + net_guide + net_activities;

      const markup = params.markup_percentage || 25;
      const markup_amount = Math.round(net_total * (markup / 100));
      const gross_total_lkr = net_total + markup_amount;
      const gross_total_usd = Math.round(gross_total_lkr / 300);

      booking.revenue_lkr = gross_total_lkr;
      booking.revenue_usd = gross_total_usd;
      booking.markup_percentage = markup;
      booking.expenses_hotels = net_hotels;
      booking.expenses_transport = net_transport;
      booking.expenses_guide = net_guide;
      booking.expenses_activities = net_activities;
      booking.lifecycle_stage = "quotation_billing";

      saveMockStore(store);

      return {
        data: {
          booking,
          net_hotels,
          net_transport,
          net_guide,
          net_activities,
          net_total,
          markup_amount,
          gross_total_lkr,
          gross_total_usd,
          deposit_required: Math.round(gross_total_lkr * 0.3),
        },
        source: "mock",
      };
    }
  },

  // STAGE 4: INVOICING & PAYMENT PROCESSING
  async recordPayment(
    bookingId: number,
    payment: {
      amount: number;
      currency: "LKR" | "USD" | "EUR" | "GBP";
      type: "deposit" | "balance" | "full";
      method: "stripe" | "payhere" | "bank_transfer";
      reference: string;
      notes?: string;
    },
  ): Promise<{ data: Booking; source: "laravel" | "mock" }> {
    try {
      const res = await api.post<Booking>(`/bookings/${bookingId}/payments`, payment);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const booking = store.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const newRecord: PaymentRecord = {
        id: `PAY-${Date.now()}`,
        booking_id: bookingId,
        amount: Number(payment.amount),
        currency: payment.currency,
        type: payment.type,
        method: payment.method,
        reference: payment.reference.trim() || `TX-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        notes: payment.notes,
      };

      if (!booking.payments) booking.payments = [];
      booking.payments.push(newRecord);

      const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid >= booking.revenue_lkr * 0.98) {
        booking.payment_status = "fully_paid";
        booking.lifecycle_stage = "confirmation_vouchers";
      } else if (totalPaid > 0) {
        booking.payment_status = "deposit_paid";
        booking.lifecycle_stage = "confirmation_vouchers";
      }

      saveMockStore(store);
      return { data: booking, source: "mock" };
    }
  },

  // STAGE 5: SERVICE VOUCHERS GENERATION
  async getVouchers(
    bookingId: number,
  ): Promise<{ data: ServiceVoucher[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<ServiceVoucher[]>(`/bookings/${bookingId}/vouchers`);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const booking = store.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const vouchers: ServiceVoucher[] = [];

      // 1. Hotel check-in vouchers
      const days = booking.itinerary_days || [];
      const distinctHotels = new Map<string, ItineraryDay>();
      days.forEach((day) => {
        if (!distinctHotels.has(day.hotel_name) && day.hotel_name !== "Departure") {
          distinctHotels.set(day.hotel_name, day);
        }
      });

      distinctHotels.forEach((day) => {
        const token = `VOUCH-${booking.booking_number}-${day.day_number}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        vouchers.push({
          id: `HTL-${day.day_number}`,
          type: "hotel_checkin",
          title: `Hotel Check-in Voucher: ${day.hotel_name}`,
          supplier_name: day.hotel_name,
          booking_number: booking.booking_number,
          guest_name: booking.guest_name,
          valid_date: day.date,
          service_details: `Accommodation for ${booking.pax_adults} Adults, ${booking.pax_children} Children. Meal Plan: ${day.meal_plan || "HB"}.`,
          room_or_vehicle: day.room_category || "Deluxe Suite",
          meal_plan: day.meal_plan || "HB",
          verification_token: token,
          qr_data: `https://serendibdmc.com/verify?token=${token}`,
        });
      });

      // 2. Transport Duty Slip
      const transportToken = `TRANS-${booking.booking_number}-DUTY`;
      vouchers.push({
        id: "TRP-1",
        type: "transport_duty_slip",
        title: `Chauffeur Duty Slip: ${booking.transport_type}`,
        supplier_name: "Serendib Executive Fleet",
        booking_number: booking.booking_number,
        guest_name: booking.guest_name,
        valid_date: `${booking.arrival_date} to ${booking.departure_date}`,
        service_details: `Private vehicle allocated with Chauffeur Guide ${booking.driver_guide} (${booking.driver_phone || "+94 77 123 4567"}). Full tour routing included.`,
        room_or_vehicle: booking.transport_type,
        verification_token: transportToken,
        qr_data: `https://serendibdmc.com/verify?token=${transportToken}`,
      });

      return { data: vouchers, source: "mock" };
    }
  },

  // STAGE 6: AUTOMATED CLIENT DOCUMENTS (Welcome Letter, Agreement, Thank You)
  async getDocument(
    bookingId: number,
    type: "quotation" | "welcome_letter" | "travel_agreement" | "thank_you_survey",
  ): Promise<{
    data: {
      type: string;
      title: string;
      content_html: string;
    };
    source: "laravel" | "mock";
  }> {
    try {
      const res = await api.get(`/bookings/${bookingId}/documents/${type}`);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const b = store.bookings.find((item) => item.id === bookingId);
      if (!b) throw new Error("Booking not found");

      let title = "";
      let content_html = "";

      if (type === "welcome_letter") {
        title = `Guest Welcome Letter - ${b.guest_name}`;
        content_html = `
          <div style="font-family: serif; color: #0f172a; line-height: 1.6;">
            <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #059669; margin: 0; font-size: 24px;">AYUBOWAN & WELCOME TO SRI LANKA!</h2>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Serendib & Metshu Travels Destination Management</p>
            </div>
            
            <p>Dear <strong>${b.guest_name}</strong>,</p>
            <p>On behalf of our entire team across the island, we are thrilled to welcome you to Sri Lanka for your upcoming tour (<strong>${b.booking_number}</strong>)!</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px; color: #059669; font-size: 14px; text-transform: uppercase;">Airport Meeting Point & Chauffeur Details</h4>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Arrival Flight:</strong> ${b.arrival_flight}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Airport Meeting Point:</strong> Bandaranaike International Airport (CMB) Arrival Lobby - Outside Exit Door #2.</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Your Chauffeur-Guide:</strong> ${b.driver_guide} (Phone / WhatsApp: ${b.driver_phone || "+94 77 123 4567"})</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Assigned Vehicle:</strong> ${b.transport_type} (Air-Conditioned Private Vehicle)</p>
            </div>

            <p style="font-size: 13px;">Your private guide will be waiting right at the airport exit holding a personalized paging board with your name. Complimentary mineral water and local SIM card assistance are ready in your vehicle.</p>

            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; font-size: 12px; color: #065f46;">
              <strong>24/7 Concierge Hotline:</strong> +94 74 394 2844 | Office: L 12, Ceylinco House, Colombo 01
            </div>

            <p>We wish you an extraordinary, safe, and inspiring journey across our beautiful paradise island.</p>
            <p style="margin-top: 25px;">Warmest Regards,<br><strong>Operations Director</strong><br>Serendib & Metshu DMC</p>
          </div>
        `;
      } else if (type === "travel_agreement") {
        title = `Travel Agreement & Terms of Service - ${b.booking_number}`;
        content_html = `
          <div style="font-family: sans-serif; color: #1e293b; font-size: 12px; line-height: 1.6;">
            <h2 style="font-size: 18px; color: #059669; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">DMC TRAVEL SERVICE AGREEMENT</h2>
            <p><strong>Booking Ref:</strong> ${b.booking_number} | <strong>Guest:</strong> ${b.guest_name} | <strong>Agent:</strong> ${b.agent?.name || "Direct"}</p>
            
            <h4 style="margin: 14px 0 6px;">1. Scope of Services</h4>
            <p>Serendib / Metshu Travels agrees to deliver private transport, chauffeur guide services, selected hotel accommodations, and listed excursion admissions between ${b.arrival_date} and ${b.departure_date}.</p>
            
            <h4 style="margin: 14px 0 6px;">2. Payment Terms</h4>
            <p>Agreed Total Revenue: LKR ${b.revenue_lkr.toLocaleString()}. A 30% deposit is required to confirm hotel reservations. The remaining 70% balance must be settled 14 days prior to arrival or via authorized payment link.</p>
            
            <h4 style="margin: 14px 0 6px;">3. Cancellation Policy</h4>
            <p>&bull; 30+ days prior to arrival: Full refund minus 10% administrative processing fee.<br>
               &bull; 15-29 days prior: 50% cancellation fee applies.<br>
               &bull; Under 14 days or No-Show: 100% cancellation fee applies.</p>
            
            <h4 style="margin: 14px 0 6px;">4. Insurance & Liability</h4>
            <p>All passenger vehicles carry comprehensive passenger liability insurance under Sri Lanka Tourist Board regulations. Comprehensive international travel insurance is strongly advised for all clients.</p>
          </div>
        `;
      } else if (type === "thank_you_survey") {
        title = `Post-Trip Thank You & Review Survey - ${b.guest_name}`;
        content_html = `
          <div style="font-family: serif; color: #0f172a; line-height: 1.6;">
            <h2 style="color: #059669; margin: 0 0 10px;">THANK YOU FOR TRAVELING WITH US!</h2>
            <p>Dear ${b.guest_name},</p>
            <p>We hope you had a safe flight home following your tour across Sri Lanka! It was an absolute privilege for our team and guide ${b.driver_guide} to host you.</p>
            <p>Your feedback helps us continuously elevate our private journeys for future travellers.</p>
            <div style="margin: 25px 0;">
              <a href="https://metshutravels.com/feedback?ref=${b.booking_number}" style="background: #059669; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">Complete 2-Minute Guest Feedback &rarr;</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you enjoyed your experience, we would be deeply grateful if you could share a brief review on our Google / TripAdvisor page.</p>
            <p>Ayubowan, and we look forward to welcoming you back to Sri Lanka!</p>
          </div>
        `;
      } else {
        title = `Quotation Proposal - ${b.booking_number}`;
        content_html = `
          <div style="font-family: sans-serif; color: #0f172a;">
            <h2>Tour Quotation Proposal: ${b.booking_number}</h2>
            <p><strong>Lead Guest:</strong> ${b.guest_name} | <strong>Total Pax:</strong> ${b.pax_adults} Adults, ${b.pax_children} Children</p>
            <p><strong>Dates:</strong> ${b.arrival_date} to ${b.departure_date} (${b.itinerary_days?.length || 7} Days)</p>
            <h3 style="color: #059669;">Total Quotation: LKR ${b.revenue_lkr.toLocaleString()} (approx. $${b.revenue_usd || Math.round(b.revenue_lkr / 300)} USD)</h3>
          </div>
        `;
      }

      return {
        data: {
          type,
          title,
          content_html,
        },
        source: "mock",
      };
    }
  },

  // STAGE ADVANCEMENT
  async updateLifecycleStage(
    bookingId: number,
    stage: LifecycleStage,
  ): Promise<{ data: Booking; source: "laravel" | "mock" }> {
    try {
      const res = await api.put<Booking>(`/bookings/${bookingId}/stage`, { stage });
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const booking = store.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");
      booking.lifecycle_stage = stage;
      saveMockStore(store);
      return { data: booking, source: "mock" };
    }
  },
};
