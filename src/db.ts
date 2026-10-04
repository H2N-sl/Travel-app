export interface Agent {
  id: string;
  code: string;
  name: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  currentSeq: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  destination: string;
  hotelId: string;
  hotelName: string;
  meals: string;
  activities: string;
  transport: string;
  notes: string | null;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  agentId: string;
  agentName: string;
  guestName: string;
  nationality: string;
  paxAdults: number;
  paxChildren: number;
  arrivalDate: string;
  departureDate: string;
  arrivalFlight: string;
  departureFlight: string;
  transportType: string;
  driverGuide: string;
  status: string;
  specialRequests: string | null;
  internalNotes: string | null;
  revenueLKR: number;
  expenses: {
    hotels: number;
    transport: number;
    guide: number;
    activities: number;
    other: number;
  };
  itinerary: ItineraryDay[];
}

export type NewAgent = Omit<Agent, "id" | "currentSeq" | "createdAt" | "updatedAt">;

export type NewBooking = Pick<
  Booking,
  | "agentId"
  | "guestName"
  | "nationality"
  | "paxAdults"
  | "paxChildren"
  | "arrivalDate"
  | "departureDate"
  | "arrivalFlight"
  | "departureFlight"
  | "transportType"
  | "driverGuide"
  | "revenueLKR"
  | "specialRequests"
  | "internalNotes"
>;

export interface Inquiry {
  id: string;
  fullName: string;
  email: string;
  nationality: string;
  arrivalDate: string;
  departureDate: string;
  travelers: number;
  packageInterest: string;
  interests: string;
  message: string;
  status: "New" | "Contacted" | "Closed";
  createdAt: string;
  updatedAt: string;
}

export type NewInquiry = Omit<Inquiry, "id" | "status" | "createdAt" | "updatedAt">;

export interface DesktopDatabaseApi {
  unlockAdmin(): Promise<boolean>;
  logoutAdmin(): Promise<void>;
  getAgents(): Promise<Agent[]>;
  getBookings(): Promise<Booking[]>;
  getInquiries(): Promise<Inquiry[]>;
  createAgent(data: NewAgent): Promise<Agent>;
  createBooking(data: NewBooking): Promise<Booking>;
  createInquiry(data: NewInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: string, status: Inquiry["status"]): Promise<Inquiry>;
  updateItinerary(bookingId: string, days: ItineraryDay[]): Promise<Booking>;
}

declare global {
  interface Window {
    dmcDesktop?: DesktopDatabaseApi;
  }
}

function desktopApi(): DesktopDatabaseApi {
  if (!window.dmcDesktop) {
    throw new Error("The local database is available only in the desktop app.");
  }
  return window.dmcDesktop;
}

export const db = {
  isAvailable: () => typeof window !== "undefined" && Boolean(window.dmcDesktop),
  unlockAdmin: () => desktopApi().unlockAdmin(),
  logoutAdmin: () => desktopApi().logoutAdmin(),
  getAgents: () => desktopApi().getAgents(),
  getBookings: () => desktopApi().getBookings(),
  getInquiries: () => desktopApi().getInquiries(),
  createAgent: (data: NewAgent) => desktopApi().createAgent(data),
  createBooking: (data: NewBooking) => desktopApi().createBooking(data),
  createInquiry: (data: NewInquiry) => desktopApi().createInquiry(data),
  updateInquiryStatus: (id: string, status: Inquiry["status"]) =>
    desktopApi().updateInquiryStatus(id, status),
  updateItinerary: (bookingId: string, days: ItineraryDay[]) =>
    desktopApi().updateItinerary(bookingId, days),
};