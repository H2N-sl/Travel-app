import axios, { type AxiosInstance } from "axios";

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
  meals: string;
  activities: string;
  transport: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  agent_id: number;
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
  status: string;
  special_requests?: string | null;
  revenue_lkr: number;
  expenses_hotels?: number;
  expenses_transport?: number;
  expenses_guide?: number;
  expenses_activities?: number;
  expenses_other?: number;
  agent?: Agent;
  itinerary_days?: ItineraryDay[];
}

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

const STORAGE_API_KEY = "serendib_api_base_url";

export function getStoredApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_API_KEY);
    if (saved) return saved;
  }
  return import.meta.env.VITE_API_BASE_URL || "/api";
}

export function setStoredApiBaseUrl(url: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_API_KEY, url);
  }
  api.defaults.baseURL = url;
}

export const api: AxiosInstance = axios.create({
  baseURL: getStoredApiBaseUrl(),
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Seed data storage fallback for preview/development when Laravel is offline
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

// REST API Methods with automated mock fallback
export const apiClient = {
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
};
