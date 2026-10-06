/**
 * ==============================================================================
 * FILE: src/services/api.ts
 * SERENDIB & METSHU DMC - COMPLETE 6-STAGE RESERVATION LIFECYCLE API SERVICE
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT IS A REST API AND HOW DOES THIS FILE WORK?
 * ------------------------------------------------------------------------------
 * In modern web development, applications are split into two separate halves:
 * 
 * 1. THE FRONTEND (Vue 3):
 *    - This is what the user sees in their web browser (buttons, forms, cards, colors).
 *    - It runs on the user's computer inside Google Chrome, Safari, etc.
 * 
 * 2. THE BACKEND (Laravel / PHP):
 *    - This runs on a web server or your local computer (e.g. http://127.0.0.1:8000).
 *    - It connects to a database (like MySQL or SQLite) and stores data permanently.
 * 
 * 3. THE REST API (The Bridge):
 *    - "REST API" is the standard language the Frontend uses to talk to the Backend.
 *    - Common HTTP Methods:
 *      * GET    -> "Please fetch data for me" (e.g. GET /api/bookings)
 *      * POST   -> "Please save a new record" (e.g. POST /api/bookings)
 *      * PUT    -> "Please update an existing record completely" (e.g. PUT /api/bookings/1/itinerary)
 *      * PATCH  -> "Please update a specific field" (e.g. PATCH /api/inquiries/5/status)
 *      * DELETE -> "Please delete a record"
 * 
 * 4. AXIOS:
 *    - Axios is the JavaScript library we use below to send these HTTP requests across the network.
 * 
 * 5. SMART DUAL-MODE (LARAVEL + MOCK FALLBACK):
 *    - When your Laravel backend is running at http://127.0.0.1:8000, this service
 *      sends all requests to Laravel!
 *    - If Laravel is NOT running (e.g. you are just testing the frontend UI or
 *      showing a demo), it automatically falls back to an in-browser database (`localStorage`).
 *    - This means the app NEVER crashes with a blank screen! Everything works smoothly.
 * 
 * ------------------------------------------------------------------------------
 * 🛠️ HOW TO MAKE MANUAL CHANGES:
 * - Change default API URL: see `getStoredApiBaseUrl()` around line 190.
 * - Change default pricing / markup: see `calculateQuote()` around line 700.
 * - Add a new field to bookings: add it to `interface Booking` below and update `NewBooking`.
 * ==============================================================================
 */

import axios, { type AxiosInstance, type AxiosError } from "axios";

// ==============================================================================
// SECTION 1: DATA TYPES & INTERFACES (THE BLUEPRINTS)
// ==============================================================================
// In TypeScript, an "interface" or "type" defines the exact shape of an object.
// Think of it as a form template: it tells the computer what fields must exist!

/**
 * LifecycleStage:
 * Represents which of the 6 stages a booking is currently in:
 * 1. inquiry_intake: Guest just submitted a form or inquiry.
 * 2. itinerary_customization: Tour consultant is selecting hotels, route, vehicle.
 * 3. quotation_billing: Costing engine calculating net rates, markup, and selling price.
 * 4. confirmation_vouchers: Deposit received, creating vouchers and POs.
 * 5. operations_dispatch: Chauffeur assigned, duty slip ready, guest arrives in Sri Lanka!
 * 6. post_trip: Guest departed, sending thank-you letter and feedback review.
 */
export type LifecycleStage =
  | "inquiry_intake"
  | "itinerary_customization"
  | "quotation_billing"
  | "confirmation_vouchers"
  | "operations_dispatch"
  | "post_trip";

/**
 * PaymentStatus:
 * - 'pending': No payment received yet.
 * - 'deposit_paid': Partial deposit received (usually 30%).
 * - 'fully_paid': 100% of the invoice has been settled.
 * - 'cancelled': Tour was cancelled.
 */
export type PaymentStatus = "pending" | "deposit_paid" | "fully_paid" | "cancelled";

/**
 * MealPlan:
 * Standard international hospitality meal plan codes:
 * - RO: Room Only (no meals included)
 * - BB: Bed & Breakfast (only morning breakfast included)
 * - HB: Half Board (breakfast + dinner included - most popular for Sri Lanka tours)
 * - FB: Full Board (breakfast + lunch + dinner included)
 * - AI: All Inclusive (all meals + drinks included)
 */
export type MealPlan = "RO" | "BB" | "HB" | "FB" | "AI";

/**
 * Agent:
 * Represents an overseas wholesale tour agency (e.g. from the UK, Germany, Australia)
 * who partners with Serendib / Metshu Travels to send clients.
 */
export interface Agent {
  id: number;               // Unique database ID
  code: string;             // 3-letter uppercase code, e.g. "ABC" or "KUO"
  name: string;             // Company name, e.g. "ABC Travel UK Ltd"
  country: string;          // Country of the agency
  contact_person: string;   // Name of primary contact agent
  email: string;            // Agent email address
  phone: string;            // Agent phone or WhatsApp
  current_seq: number;      // Sequence number used to generate unique booking codes (e.g. ABC-2026-0001)
  created_at?: string;      // Timestamp when registered
  updated_at?: string;      // Timestamp when updated
}

/**
 * NewAgent:
 * The data required when registering a brand-new overseas agent.
 */
export interface NewAgent {
  code: string;
  name: string;
  country: string;
  contact_person: string;
  email: string;
  phone: string;
}

/**
 * ItineraryDay:
 * Represents one single day in a tourist's schedule.
 * Example: Day 2 -> Sigiriya -> Heritance Kandalama Hotel -> HB -> Lion Rock Climb.
 */
export interface ItineraryDay {
  id?: number;              // Database ID
  booking_id?: number;      // Which booking this day belongs to
  day_number: number;       // Day 1, Day 2, Day 3, etc.
  date: string;             // Date in YYYY-MM-DD format
  destination: string;      // City / Location (e.g. "Kandy", "Ella", "Yala")
  hotel_name: string;       // Name of the booked hotel
  room_category?: string;   // e.g. "Deluxe Sea View", "Standard", "Junior Suite"
  meal_plan?: MealPlan;     // "RO" | "BB" | "HB" | "FB" | "AI"
  meals: string;            // Human-readable summary, e.g. "Breakfast & Dinner included"
  activities: string;       // Highlights, e.g. "Temple of the Tooth Relic, Botanical Gardens"
  transport: string;        // Vehicle used, e.g. "Luxury AC Van (Toyota KDH)"
  notes?: string;           // Special internal notes for guide or driver
}

/**
 * PaymentRecord:
 * Tracks every financial transaction made towards a booking (deposit, balance, or full).
 */
export interface PaymentRecord {
  id: string;               // Unique receipt ID, e.g. "PAY-101"
  booking_id: number;       // Associated booking ID
  amount: number;           // Amount paid
  currency: "LKR" | "USD" | "EUR" | "GBP"; // Currency code
  type: "deposit" | "balance" | "full";    // Payment stage
  method: "stripe" | "payhere" | "bank_transfer"; // Gateway or bank transfer
  reference: string;        // Transaction ID or bank transfer SWIFT code
  date: string;             // Date received
  notes?: string;           // Optional remarks
}

/**
 * ServiceVoucher:
 * Legal document handed to service providers (Hotels, Chauffeurs, Safari Jeeps)
 * guaranteeing payment by the DMC.
 */
export interface ServiceVoucher {
  id: string;               // Unique voucher ID
  type: "hotel_checkin" | "transport_duty_slip" | "safari_pass";
  title: string;            // Document title, e.g. "Hotel Check-in Voucher"
  supplier_name: string;    // Name of hotel or safari operator
  booking_number: string;   // Booking code (e.g. "ABC-2026-0001")
  guest_name: string;       // Guest primary name
  valid_date: string;       // Check-in date or service date
  service_details: string;  // Included services (number of pax, meals, etc.)
  room_or_vehicle: string;  // Room type or vehicle plate
  meal_plan?: string;       // Meal plan code
  verification_token: string; // Anti-fraud verification code
  qr_data: string;          // Data encoded into QR code for mobile scanning
}

/**
 * Booking:
 * The MASTER reservation document holding all information about a tour booking.
 */
export interface Booking {
  id: number;
  booking_number: string;     // Unique identifier formatted as {AGENT_CODE}-{YEAR}-{SEQUENCE}
  agent_id: number;           // Foreign key connecting to the Agent
  guest_name: string;         // Primary guest / party name
  nationality: string;        // Guest nationality
  pax_adults: number;         // Count of adult passengers
  pax_children: number;       // Count of children passengers
  pax_infants?: number;       // Count of infant passengers
  arrival_date: string;       // Date of arrival at CMB Airport
  departure_date: string;     // Date of departure from CMB Airport
  arrival_flight: string;     // Flight number and time (e.g. "UL504 @ 12:40 PM")
  departure_flight: string;   // Flight number and time (e.g. "UL503 @ 02:15 PM")
  transport_type: string;     // Allocated vehicle class (e.g. "Luxury AC Van")
  driver_guide: string;       // Assigned certified chauffeur guide
  driver_phone?: string;      // Chauffeur direct mobile / WhatsApp
  driver_language?: string;   // Languages spoken by guide (English, German, French)
  status: string;             // "In Operation", "Confirmed", "Completed", "Cancelled"
  lifecycle_stage: LifecycleStage; // Which of the 6 stages this booking is currently in
  payment_status: PaymentStatus;   // "pending", "deposit_paid", "fully_paid"
  special_requests?: string | null;// Dietary, honeymoon, wheelchair requests
  revenue_lkr: number;        // Gross selling price in Sri Lankan Rupees (LKR)
  revenue_usd?: number;       // Approximate price in US Dollars (USD)
  markup_percentage?: number; // Profit margin percentage applied (e.g. 25%)
  expenses_hotels?: number;   // Net supplier cost for accommodations
  expenses_transport?: number;// Net supplier cost for vehicle & fuel
  expenses_guide?: number;    // Chauffeur guide fee & allowances
  expenses_activities?: number;// Entrance tickets & safari costs
  expenses_other?: number;    // Miscellaneous contingency expenses
  payments: PaymentRecord[];  // List of recorded payments
  agent?: Agent;              // Nested agent object
  itinerary_days?: ItineraryDay[]; // Nested day-by-day itinerary
}

/**
 * NewBooking:
 * The data required from the form when creating a new tour reservation.
 */
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

/**
 * Inquiry:
 * Represents a customer lead submitted from the public website contact form.
 */
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

/**
 * NewInquiry:
 * Form data submitted from the public website.
 */
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

// ==============================================================================
// SECTION 2: API BASE URL & AXIOS HTTP INSTANCE
// ==============================================================================

// Key used to store custom backend URL in browser's localStorage
const STORAGE_API_KEY = "serendib_api_base_url";

/**
 * getStoredApiBaseUrl():
 * Finds the API URL to connect to.
 * 1. First checks if user typed a custom URL in the UI (saved in localStorage).
 * 2. If not, checks Vite's environment variable `VITE_API_BASE_URL`.
 * 3. Defaults to "/api" (which proxies to local server or dev server).
 */
export function getStoredApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_API_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_API_BASE_URL || "/api";
}

/**
 * setStoredApiBaseUrl(url):
 * Allows the user or developer to change the API URL live in the browser.
 * For example: change from "/api" to "http://127.0.0.1:8000/api".
 */
export function setStoredApiBaseUrl(url: string): void {
  const cleanUrl = url.trim();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_API_KEY, cleanUrl);
  }
  api.defaults.baseURL = cleanUrl;
}

/**
 * api (Axios Instance):
 * The configured HTTP client that sends network requests.
 * - timeout: 6000ms (6 seconds) before aborting if server is unresponsive.
 * - headers: Requests and expects JSON data format.
 */
export const api: AxiosInstance = axios.create({
  baseURL: getStoredApiBaseUrl(),
  timeout: 6000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==============================================================================
// SECTION 3: IN-BROWSER PERSISTENT MOCK STORE (FALLBACK DATABASE)
// ==============================================================================
// WHY DOES THIS EXIST?
// When building or testing the Vue 3 frontend before your Laravel backend is
// started or deployed, we don't want the frontend to display red error banners.
// Instead, we store sample agents, bookings, and inquiries in localStorage!
// If your Laravel backend goes live, the code below automatically connects to it.

const MOCK_STORAGE_KEY = "serendib_metshu_lifecycle_store_v2";

interface MockStore {
  agents: Agent[];
  bookings: Booking[];
  inquiries: Inquiry[];
}

/**
 * getInitialMockStore():
 * Creates rich, realistic initial sample data for Sri Lanka travel tours.
 * Includes a registered UK agent, an active 7-day luxury circuit, and an incoming lead.
 */
function getInitialMockStore(): MockStore {
  // 1. Sample Overseas Wholesale Agent:
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

  // 2. Sample Active Tour Booking (7-Day Island Discovery):
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
    lifecycle_stage: "operations_dispatch", // Stage 5: In Operation & Dispatched
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
        notes: "30% Initial Deposit Paid via Stripe",
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
        notes: "70% Balance settlement confirmed via Bank Wire",
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
        notes: "Welcome garland and cold towels ready upon arrival",
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

  // 3. Sample Incoming Customer Inquiry:
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

/**
 * loadMockStore():
 * Reads the mock database from the browser's localStorage.
 * If none exists, creates the initial sample data and saves it.
 */
function loadMockStore(): MockStore {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(MOCK_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // If parsing fails, fall back to initial data
    }
  }
  const init = getInitialMockStore();
  saveMockStore(init);
  return init;
}

/**
 * saveMockStore(store):
 * Writes the updated data into the browser's localStorage.
 */
function saveMockStore(store: MockStore): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage quota errors in private browsing modes
    }
  }
}

// ==============================================================================
// SECTION 4: COMPLETE LIFECYCLE SERVICE & REST API CLIENT (apiClient)
// ==============================================================================
// Below is the main object exported to Vue components (`PublicWebsite.vue` and
// `OperationsPortal.vue`).
// Every method uses a "Try Laravel First, Fallback to Mock if Offline" pattern:
// 1. `try { await api.get(...) }` -> attempts real network call to Laravel.
// 2. `catch { ... }` -> if Laravel is offline or returns error, runs local mock logic.

export const apiClient = {

  /**
   * checkConnection():
   * Tests whether the Laravel REST API backend is reachable.
   * Sends a quick test request to `/agents`.
   * Returns: { isOnline: true/false, message: string, url: string }
   */
  async checkConnection(): Promise<{ isOnline: boolean; message: string; url: string }> {
    const targetUrl = getStoredApiBaseUrl();
    try {
      // Send a quick ping to the Laravel backend (3 second timeout)
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

  // ----------------------------------------------------------------------------
  // STAGE 1: INQUIRIES & LEAD CAPTURE
  // ----------------------------------------------------------------------------

  /**
   * getInquiries():
   * Fetches all inquiries submitted through the website contact form.
   * Endpoint: GET /api/inquiries
   */
  async getInquiries(): Promise<{ data: Inquiry[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Inquiry[]>("/inquiries");
      return { data: res.data, source: "laravel" };
    } catch {
      // Mock Fallback: Read inquiries from browser localStorage
      const store = loadMockStore();
      return { data: store.inquiries, source: "mock" };
    }
  },

  /**
   * createInquiry(payload):
   * Saves a new inquiry when a tourist submits the website contact form.
   * Endpoint: POST /api/inquiries
   */
  async createInquiry(payload: NewInquiry): Promise<{ data: Inquiry; source: "laravel" | "mock" }> {
    try {
      const res = await api.post<Inquiry>("/inquiries", payload);
      return { data: res.data, source: "laravel" };
    } catch {
      // Mock Fallback: Generate a unique ID and save to browser localStorage
      const store = loadMockStore();
      const newInquiry: Inquiry = {
        id: Date.now(), // Use current millisecond timestamp as unique ID
        ...payload,
        status: "New",
        created_at: new Date().toISOString(),
      };
      // Insert at beginning of array so newest shows first
      store.inquiries.unshift(newInquiry);
      saveMockStore(store);
      return { data: newInquiry, source: "mock" };
    }
  },

  /**
   * updateInquiryStatus(id, status):
   * Updates an inquiry's status to 'New', 'Contacted', or 'Closed'.
   * Endpoint: PATCH /api/inquiries/{id}/status
   */
  async updateInquiryStatus(
    id: number,
    status: Inquiry["status"],
  ): Promise<{ data: Inquiry; source: "laravel" | "mock" }> {
    try {
      const res = await api.patch<Inquiry>(`/inquiries/${id}/status`, { status });
      return { data: res.data, source: "laravel" };
    } catch {
      // Mock Fallback: Find by ID and update status
      const store = loadMockStore();
      const inq = store.inquiries.find((i) => i.id === id);
      if (!inq) throw new Error("Inquiry not found");
      inq.status = status;
      saveMockStore(store);
      return { data: inq, source: "mock" };
    }
  },

  // ----------------------------------------------------------------------------
  // STAGE 1 (B): OVERSEAS AGENT DIRECTORY
  // ----------------------------------------------------------------------------

  /**
   * getAgents():
   * Fetches all registered overseas wholesale tour operators.
   * Endpoint: GET /api/agents
   */
  async getAgents(): Promise<{ data: Agent[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Agent[]>("/agents");
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      return { data: store.agents, source: "mock" };
    }
  },

  /**
   * createAgent(payload):
   * Registers a new overseas agent (e.g. from UK, Germany, USA).
   * Endpoint: POST /api/agents
   */
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

  // ----------------------------------------------------------------------------
  // STAGE 1 (C): TOUR BOOKING CREATION
  // ----------------------------------------------------------------------------

  /**
   * getBookings():
   * Fetches all bookings with their nested agent and itinerary days.
   * Endpoint: GET /api/bookings
   */
  async getBookings(): Promise<{ data: Booking[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Booking[]>("/bookings");
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      return { data: store.bookings, source: "mock" };
    }
  },

  /**
   * createBooking(payload):
   * Creates a new booking record, generates unique booking number,
   * calculates estimated supplier expenses, and attaches Day 1 itinerary.
   * Endpoint: POST /api/bookings
   */
  async createBooking(payload: NewBooking): Promise<{ data: Booking; source: "laravel" | "mock" }> {
    try {
      const res = await api.post<Booking>("/bookings", payload);
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      const agentIdNum = Number(payload.agent_id);
      const agent = store.agents.find((a) => a.id === agentIdNum);

      // Increment agent sequence counter (e.g. 1 -> 2)
      const nextSeq = (agent?.current_seq ?? 0) + 1;
      if (agent) {
        agent.current_seq = nextSeq;
      }

      // Generate booking number format: {AGENT_CODE}-{YEAR}-{0001}
      const agentCode = agent?.code || "SRN";
      const bookingNumber = `${agentCode}-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`;
      const rev = Number(payload.revenue_lkr) || 0;

      // Construct booking record
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
        lifecycle_stage: "itinerary_customization", // Moves to Stage 2 automatically
        payment_status: "pending",
        special_requests: payload.special_requests || null,
        revenue_lkr: rev,
        revenue_usd: Math.round(rev / 300), // Approximate 1 USD = 300 LKR
        markup_percentage: 25,
        expenses_hotels: Math.round(rev * 0.45),     // Standard DMC baseline: ~45% hotels
        expenses_transport: Math.round(rev * 0.15),  // Standard DMC baseline: ~15% transport
        expenses_guide: Math.round(rev * 0.05),      // Standard DMC baseline: ~5% guide fee
        expenses_activities: Math.round(rev * 0.08), // Standard DMC baseline: ~8% admissions
        expenses_other: Math.round(rev * 0.02),      // Standard DMC baseline: ~2% incidentals
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

  // ----------------------------------------------------------------------------
  // STAGE 2: ITINERARY BUILDING & RESOURCE ALLOCATION
  // ----------------------------------------------------------------------------

  /**
   * updateItinerary(bookingId, days):
   * Saves custom day-by-day itinerary sequence with destinations, hotels,
   * room categories, and meal plans (RO, BB, HB, FB).
   * Endpoint: PUT /api/bookings/{id}/itinerary
   */
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

      // Renumber days in sequence 1, 2, 3...
      booking.itinerary_days = days.map((d, i) => ({
        ...d,
        day_number: i + 1,
      }));
      booking.lifecycle_stage = "quotation_billing"; // Advance to Stage 3
      saveMockStore(store);
      return { data: booking, source: "mock" };
    }
  },

  /**
   * updateAllocations(bookingId, allocations):
   * Allocates fleet class (Van, Sedan, Coach) and certified chauffeur guide.
   * Endpoint: PUT /api/bookings/{id}/allocations
   */
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

  // ----------------------------------------------------------------------------
  // STAGE 3: FINANCIAL COSTING & QUOTATION ENGINE
  // ----------------------------------------------------------------------------

  /**
   * calculateQuote(bookingId, params):
   * Calculates supplier net rates (hotel nights, daily transport, guide fees,
   * safari/activity tickets), applies the DMC markup margin (e.g. 20% - 30%),
   * and computes selling prices in LKR and target currency.
   * Endpoint: POST /api/bookings/{id}/calculate-quote
   */
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

      // Real-world Sri Lanka DMC baseline rates per day:
      const net_hotels = daysCount * 140000;    // ~LKR 140,000 per night (4-star luxury room)
      const net_transport = daysCount * 45000;  // ~LKR 45,000 per day (Fuel + AC Van rental)
      const net_guide = daysCount * 18000;      // ~LKR 18,000 per day (Chauffeur daily allowance)
      const net_activities = daysCount * 25000; // ~LKR 25,000 per day (Sigiriya, Yala tickets)
      const net_total = net_hotels + net_transport + net_guide + net_activities;

      // Apply DMC markup margin:
      const markup = params.markup_percentage || 25;
      const markup_amount = Math.round(net_total * (markup / 100));
      const gross_total_lkr = net_total + markup_amount;
      const gross_total_usd = Math.round(gross_total_lkr / 300);

      // Save calculated financials to booking:
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
          deposit_required: Math.round(gross_total_lkr * 0.3), // 30% standard deposit
        },
        source: "mock",
      };
    }
  },

  // ----------------------------------------------------------------------------
  // STAGE 4: INVOICING & PAYMENT PROCESSING
  // ----------------------------------------------------------------------------

  /**
   * recordPayment(bookingId, payment):
   * Logs a deposit or balance payment received via Stripe, PayHere, or Bank SWIFT.
   * When 100% is paid, automatically advances booking to Stage 5 (Confirmation & Vouchers).
   * Endpoint: POST /api/bookings/{id}/payments
   */
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

      // Check total paid against gross revenue:
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

  // ----------------------------------------------------------------------------
  // STAGE 5: SERVICE VOUCHERS GENERATION
  // ----------------------------------------------------------------------------

  /**
   * getVouchers(bookingId):
   * Generates printable Hotel Check-in Vouchers and Chauffeur Duty Slips
   * equipped with anti-fraud verification tokens and QR code links.
   * Endpoint: GET /api/bookings/{id}/vouchers
   */
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

      // 1. Hotel check-in vouchers (one for each distinct hotel stay)
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

      // 2. Chauffeur Guide Duty Slip
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

  // ----------------------------------------------------------------------------
  // STAGE 6: AUTOMATED CLIENT DOCUMENTS (Welcome Letter, Agreement, Survey)
  // ----------------------------------------------------------------------------

  /**
   * getDocument(bookingId, type):
   * Generates formal HTML documents:
   * - 'welcome_letter': Official arrival instructions, emergency hotline, driver phone.
   * - 'travel_agreement': Contract terms, payment schedule, cancellation clauses.
   * - 'thank_you_survey': Post-trip feedback questionnaire link.
   * - 'quotation': Formal quotation proposal breakdown.
   * Endpoint: GET /api/bookings/{id}/documents/{type}
   */
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

  // ----------------------------------------------------------------------------
  // LIFECYCLE STAGE ADVANCEMENT
  // ----------------------------------------------------------------------------

  /**
   * updateLifecycleStage(bookingId, stage):
   * Advances or moves the booking between the 6 stages:
   * 'inquiry_intake' -> 'itinerary_customization' -> 'quotation_billing' ->
   * 'confirmation_vouchers' -> 'operations_dispatch' -> 'post_trip'
   * Endpoint: PUT /api/bookings/{id}/stage
   */
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
