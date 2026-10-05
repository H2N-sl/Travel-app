/**
 * ==============================================================================
 * SERENDIB DMC - REST API CLIENT & LARAVEL BACKEND INTEGRATION SERVICE
 * ==============================================================================
 * 
 * This service provides the complete API bridge between the Vue 3 frontend
 * and the Laravel 12 REST API backend.
 * 
 * KEY FEATURES:
 * 1. Configurable Base URL: You can change the backend URL in 3 ways:
 *    - In the UI using the "API Configuration" modal (saved to localStorage).
 *    - Via environment variable: VITE_API_BASE_URL in your .env file.
 *    - Defaults to 'http://127.0.0.1:8000/api' for local Laravel development.
 * 2. Automatic Offline Fallback: If the Laravel server is not yet running or
 *    unreachable, requests seamlessly fall back to an in-browser storage mock
 *    so the UI remains 100% interactive without crashing.
 * 3. Connection Health Check: A ping test to verify whether Laravel is online.
 * 
 * LARAVEL CORS REQUIREMENT:
 * Ensure config/cors.php in Laravel has:
 *   'paths' => ['api/*', 'sanctum/csrf-cookie'],
 *   'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
 *   'allowed_methods' => ['*'],
 *   'allowed_headers' => ['*'],
 *   'supports_credentials' => true,
 * ==============================================================================
 */

import axios, { type AxiosInstance, type AxiosError } from "axios";

// ------------------------------------------------------------------------------
// DATA MODELS & TYPES
// (Matching Laravel Eloquent Models and Database Migrations)
// ------------------------------------------------------------------------------

/**
 * Agent Model (corresponds to Laravel 'Agent' Eloquent Model)
 * Database Table: 'agents'
 */
export interface Agent {
  id: number;
  code: string;           // Unique 3-4 letter uppercase agent code (e.g. "ABC", "LON")
  name: string;           // Agency full business name (e.g. "ABC Travel UK Ltd")
  country: string;        // Source market country (e.g. "United Kingdom", "Germany")
  contact_person: string; // Primary account manager/contact name
  email: string;          // Booking voucher email address
  phone: string;          // International contact phone number
  current_seq: number;    // Counter used for sequential booking reference generation
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload sent when creating a new overseas agent via POST /api/agents
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
 * ItineraryDay Model (corresponds to Laravel 'ItineraryDay' Eloquent Model)
 * Database Table: 'itinerary_days' (foreign key: 'booking_id')
 */
export interface ItineraryDay {
  id?: number;
  booking_id?: number;
  day_number: number;   // Day sequence (1, 2, 3...)
  date: string;         // YYYY-MM-DD
  destination: string;  // e.g. "Colombo", "Sigiriya", "Kandy", "Nuwara Eliya"
  hotel_name: string;   // Partner hotel or resort name
  meals: string;        // Meal plan: "Breakfast", "Half Board (Dinner)", etc.
  activities: string;   // Excursions, safaris, temple visits, hikes
  transport: string;    // "Private AC Van", "Scenic Railway + Van", etc.
}

/**
 * Booking Model (corresponds to Laravel 'Booking' Eloquent Model)
 * Database Table: 'bookings' (with relations: 'agent', 'itinerary_days')
 */
export interface Booking {
  id: number;
  booking_number: string;     // Unique reference format: {AGENT_CODE}-{YEAR}-{0001}
  agent_id: number;           // Foreign key referencing 'agents.id'
  guest_name: string;         // Lead traveller or party name
  nationality: string;        // Guest passport nationality
  pax_adults: number;         // Adult passenger count
  pax_children: number;       // Child passenger count
  arrival_date: string;       // YYYY-MM-DD
  departure_date: string;     // YYYY-MM-DD
  arrival_flight: string;     // e.g. "UL504 @ 12:40 PM"
  departure_flight: string;   // e.g. "UL503 @ 02:15 PM"
  transport_type: string;     // Vehicle category
  driver_guide: string;       // Allocated national chauffeur-guide
  status: string;             // "In Operation", "Confirmed", "Completed", "Cancelled"
  special_requests?: string | null; // Honeymoon cake, dietary, wheelchair, etc.
  revenue_lkr: number;        // Agreed contract revenue in Sri Lankan Rupees (LKR)
  expenses_hotels?: number;   // Calculated hotel costs (~45%)
  expenses_transport?: number;// Vehicle & fuel costs (~15%)
  expenses_guide?: number;    // Licensed guide daily allowance (~5%)
  expenses_activities?: number;// Entrance fees, safaris, train tickets (~8%)
  expenses_other?: number;    // Misc/contingency (~2%)
  agent?: Agent;              // Eager-loaded Agent relation
  itinerary_days?: ItineraryDay[]; // Eager-loaded Itinerary days relation
}

/**
 * Payload sent when creating a new booking via POST /api/bookings
 */
export interface NewBooking {
  agent_id: number | string;
  guest_name: string;
  nationality: string;
  pax_adults: number;
  pax_children: number;
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
 * Inquiry Model (corresponds to Laravel 'Inquiry' Eloquent Model)
 * Database Table: 'inquiries'
 */
export interface Inquiry {
  id: number;
  full_name: string;        // Prospective traveller name
  email: string;            // Contact email address
  nationality: string;      // Origin country
  arrival_date: string;     // Intended arrival date
  departure_date: string;   // Intended departure date
  travelers: number;        // Party size
  package_interest: string; // Selected circuit identifier or "custom"
  interests: string;        // Wildlife, tea country, surfing, heritage, etc.
  message: string;          // Traveller notes / wishes
  status: "New" | "Contacted" | "Closed"; // Pipeline stage
  created_at?: string;
}

/**
 * Payload sent when submitting a public trip inquiry via POST /api/inquiries
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

// ------------------------------------------------------------------------------
// API BASE URL CONFIGURATION
// ------------------------------------------------------------------------------

const STORAGE_API_KEY = "serendib_api_base_url";

/**
 * Resolves the currently active API Base URL.
 * Priority:
 * 1. User manual override stored in browser localStorage.
 * 2. Vite environment variable VITE_API_BASE_URL (if provided in .env).
 * 3. Default fallback: '/api' (or 'http://127.0.0.1:8000/api' for local Laravel).
 */
export function getStoredApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_API_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_API_BASE_URL || "/api";
}

/**
 * Updates the API Base URL at runtime and saves it to localStorage.
 * This lets you test against http://127.0.0.1:8000/api or any staging server.
 */
export function setStoredApiBaseUrl(url: string): void {
  const cleanUrl = url.trim();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_API_KEY, cleanUrl);
  }
  api.defaults.baseURL = cleanUrl;
}

// ------------------------------------------------------------------------------
// AXIOS INSTANCE CREATION
// ------------------------------------------------------------------------------

export const api: AxiosInstance = axios.create({
  baseURL: getStoredApiBaseUrl(),
  timeout: 6000, // 6-second timeout before falling back
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ------------------------------------------------------------------------------
// IN-BROWSER PERSISTENT MOCK STORE
// (Active when Laravel is offline so the app never crashes during development)
// ------------------------------------------------------------------------------

const MOCK_STORAGE_KEY = "serendib_laravel_mock_store_v1";

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
    arrival_date: "2026-10-10",
    departure_date: "2026-10-17",
    arrival_flight: "UL504 @ 12:40 PM",
    departure_flight: "UL503 @ 02:15 PM",
    transport_type: "Luxury AC Van (Toyota KDH)",
    driver_guide: "Samantha Bandara (National Guide)",
    status: "In Operation",
    special_requests: "Honeymoon arrangement, vegetarian meal.",
    revenue_lkr: 2850000,
    expenses_hotels: 1250000,
    expenses_transport: 420000,
    expenses_guide: 140000,
    expenses_activities: 210000,
    expenses_other: 65000,
    agent: defaultAgent,
    itinerary_days: [
      {
        id: 1,
        booking_id: 1,
        day_number: 1,
        date: "2026-10-10",
        destination: "Colombo",
        hotel_name: "Cinnamon Grand Colombo",
        meals: "Dinner",
        activities: "Airport greeting, Colombo City Tour",
        transport: "Private Van",
      },
      {
        id: 2,
        booking_id: 1,
        day_number: 2,
        date: "2026-10-11",
        destination: "Sigiriya / Dambulla",
        hotel_name: "Heritance Kandalama",
        meals: "Breakfast, Dinner",
        activities: "Dambulla Cave Temple Tour",
        transport: "Private Van",
      },
      {
        id: 3,
        booking_id: 1,
        day_number: 3,
        date: "2026-10-12",
        destination: "Sigiriya",
        hotel_name: "Heritance Kandalama",
        meals: "Breakfast, Dinner",
        activities: "Morning Sigiriya Rock Fortress climb & Habarana safari",
        transport: "Private Van",
      },
      {
        id: 4,
        booking_id: 1,
        day_number: 4,
        date: "2026-10-13",
        destination: "Kandy",
        hotel_name: "Earl's Regency",
        meals: "Breakfast, Dinner",
        activities: "Temple of the Tooth Relic & Cultural dance performance",
        transport: "Private Van",
      },
      {
        id: 5,
        booking_id: 1,
        day_number: 5,
        date: "2026-10-14",
        destination: "Nuwara Eliya",
        hotel_name: "Grand Hotel Nuwara Eliya",
        meals: "Breakfast, Dinner",
        activities: "Scenic hill country train ride & Pedro Tea Estate visit",
        transport: "Scenic Rail + Van",
      },
      {
        id: 6,
        booking_id: 1,
        day_number: 6,
        date: "2026-10-15",
        destination: "Bentota",
        hotel_name: "Taj Bentota Resort & Spa",
        meals: "Breakfast, Dinner",
        activities: "Drive to southwest coast, sunset walk on golden beach",
        transport: "Private Van",
      },
      {
        id: 7,
        booking_id: 1,
        day_number: 7,
        date: "2026-10-16",
        destination: "Colombo Airport",
        hotel_name: "Departure",
        meals: "Breakfast",
        activities: "Madu River boat safari, Turtle Conservation & Airport transfer",
        transport: "Private Van",
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
    package_interest: "grand-10",
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
      // ignore JSON parse errors
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
      // ignore localStorage quota errors
    }
  }
}

// ------------------------------------------------------------------------------
// API CLIENT IMPLEMENTATION WITH RESILIENT LARAVEL DISCOVERY
// ------------------------------------------------------------------------------

export const apiClient = {
  /**
   * Pings the configured API endpoint to check if Laravel is reachable.
   * Tests GET /agents with a short timeout.
   */
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

  /**
   * GET /api/agents
   * Fetches all registered overseas travel agents.
   * Laravel: AgentController@index -> response()->json(Agent::all())
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
   * POST /api/agents
   * Registers a new overseas partner agent.
   * Laravel: AgentController@store -> validates input and saves Agent model.
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

  /**
   * GET /api/bookings
   * Fetches all tour reservations with agent details and itinerary days.
   * Laravel: BookingController@index -> Booking::with(['agent', 'itineraryDays'])->latest()->get()
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
   * POST /api/bookings
   * Creates a new booking, generates booking reference {CODE}-{YEAR}-{0001},
   * increments agent sequence, and creates the Day 1 arrival itinerary item.
   * Laravel: BookingController@store
   */
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
        arrival_date: payload.arrival_date,
        departure_date: payload.departure_date,
        arrival_flight: payload.arrival_flight || "UL504 @ 12:40 PM",
        departure_flight: payload.departure_flight || "UL503 @ 02:15 PM",
        transport_type: payload.transport_type || "Luxury AC Van (Toyota KDH)",
        driver_guide: payload.driver_guide || "Samantha Bandara (National Guide)",
        status: "In Operation",
        special_requests: payload.special_requests || null,
        revenue_lkr: rev,
        expenses_hotels: Math.round(rev * 0.45),
        expenses_transport: Math.round(rev * 0.15),
        expenses_guide: Math.round(rev * 0.05),
        expenses_activities: Math.round(rev * 0.08),
        expenses_other: Math.round(rev * 0.02),
        itinerary_days: [
          {
            id: 1,
            day_number: 1,
            date: payload.arrival_date,
            destination: "Colombo",
            hotel_name: "Cinnamon Grand Colombo",
            meals: "Dinner",
            activities: "Airport greeting, Colombo City Tour",
            transport: payload.transport_type,
          },
        ],
      };
      store.bookings.unshift(newBooking);
      saveMockStore(store);
      return { data: newBooking, source: "mock" };
    }
  },

  /**
   * PUT /api/bookings/{id}/itinerary
   * Updates the full itinerary day list for a specific reservation.
   * Laravel: BookingController@updateItinerary
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
      booking.itinerary_days = days.map((d, i) => ({
        ...d,
        day_number: i + 1,
      }));
      saveMockStore(store);
      return { data: booking, source: "mock" };
    }
  },

  /**
   * GET /api/inquiries
   * Retrieves all customer trip inquiries.
   * Laravel: InquiryController@index
   */
  async getInquiries(): Promise<{ data: Inquiry[]; source: "laravel" | "mock" }> {
    try {
      const res = await api.get<Inquiry[]>("/inquiries");
      return { data: res.data, source: "laravel" };
    } catch {
      const store = loadMockStore();
      return { data: store.inquiries, source: "mock" };
    }
  },

  /**
   * POST /api/inquiries
   * Submits a customer inquiry from the public website trip planner.
   * Laravel: InquiryController@store
   */
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

  /**
   * PATCH /api/inquiries/{id}/status
   * Updates the workflow status of an inquiry ('New' -> 'Contacted' -> 'Closed').
   * Laravel: InquiryController@updateStatus
   */
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
};
