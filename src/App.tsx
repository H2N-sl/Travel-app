import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  db,
  type Agent,
  type Booking,
  type ItineraryDay,
  type NewAgent,
  type NewBooking,
  type Inquiry,
  type NewInquiry,
} from "./db";
import PublicPortal from "./PublicPortal";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  Search,
  Plus,
  ChevronRight,
  Trash2,
  Mail,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Map as MapIcon,
  Download,
  Globe,
  Briefcase,
  Compass,
  Navigation,
  Shield,
  FileSpreadsheet,
  Sparkles,
  X,
} from "lucide-react";

const SHOWCASE_PLANS = [
  {
    id: "plan_cultural",
    title: "Cultural Heritage & Tea Country",
    duration: "7 Days / 6 Nights",
    hotels: "4-star Heritage Resorts",
    priceLKR: "from LKR 450,000 / person",
    image:
      "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=85",
    description:
      "Explore the Cultural Triangle, royal Kandy, and the misty tea country in one classic circuit.",
    routeStops: ["Colombo", "Sigiriya", "Kandy", "Nuwara Eliya", "Colombo"],
    highlights: [
      "Sigiriya Rock Fortress",
      "Temple of the Tooth Relic",
      "Scenic Hill Country Train",
      "Ceylon Tea Factory",
    ],
    days: [
      {
        day: 1,
        title: "Arrival & Colombo Transit",
        desc: "Airport greeting, hotel transfer, and an evening street food walk.",
      },
      {
        day: 2,
        title: "Dambulla & Sigiriya",
        desc: "Drive to the Cultural Triangle and explore the Dambulla Cave Temple.",
      },
      {
        day: 3,
        title: "Sigiriya Rock Fortress",
        desc: "Climb Lion Rock early, followed by a village and countryside visit.",
      },
      {
        day: 4,
        title: "Royal City of Kandy",
        desc: "Visit a spice garden, the Temple of the Tooth, and a cultural performance.",
      },
      {
        day: 5,
        title: "Scenic Tea Country Railway",
        desc: "Train journey toward Nanu Oya and a Ceylon tea factory visit.",
      },
      {
        day: 6,
        title: "Nuwara Eliya",
        desc: "Explore Gregory Lake and the colonial-era hill station at leisure.",
      },
      {
        day: 7,
        title: "Colombo Departure",
        desc: "Transfer to Colombo Airport for your departure flight.",
      },
    ],
    inclusions: [
      "6 nights in selected 4-star heritage hotels",
      "Private air-conditioned transport with chauffeur-guide",
      "Daily breakfast and dinner",
      "Listed sightseeing and tea factory visit",
    ],
    exclusions: [
      "International airfare and visa fees",
      "Lunches, drinks, and personal expenses",
      "Optional activities and gratuities",
      "Travel insurance",
    ],
    budgetBreakdown: [
      { label: "Accommodation", amount: 165000 },
      { label: "Transport & chauffeur-guide", amount: 95000 },
      { label: "Meals", amount: 60000 },
      { label: "Entry fees & experiences", amount: 75000 },
      { label: "Rail & other costs", amount: 55000 },
    ],
  },
  {
    id: "plan_wildlife",
    title: "Wildlife Safari & Southern Coast",
    duration: "10 Days / 9 Nights",
    hotels: "5-star Safari Lodges & Beach Resorts",
    priceLKR: "from LKR 780,000 / person",
    image:
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=85",
    description:
      "Pair a Yala safari and Ella's highlands with Galle's heritage streets and the southern coast.",
    routeStops: [
      "Negombo",
      "Yala National Park",
      "Ella",
      "Galle Fort",
      "Bentota",
      "Colombo",
    ],
    highlights: [
      "4x4 Yala Jeep Safari",
      "Nine Arches Bridge",
      "Galle Fort",
      "Bentota River Safari",
    ],
    days: [
      {
        day: 1,
        title: "Arrival in Negombo",
        desc: "Airport pick-up and check-in at a coastal resort.",
      },
      {
        day: 2,
        title: "Journey to Yala",
        desc: "Travel south and settle into a safari lodge near the park.",
      },
      {
        day: 3,
        title: "Yala Leopard Safari",
        desc: "Dawn 4x4 safari in search of leopards, elephants, and other wildlife.",
      },
      {
        day: 4,
        title: "Ella Mountain Escape",
        desc: "Travel into the hill country and visit Ravana Falls.",
      },
      {
        day: 5,
        title: "Nine Arches Bridge & Little Adam's Peak",
        desc: "Take a morning hike to the railway bridge and surrounding viewpoints.",
      },
      {
        day: 6,
        title: "Galle Fort",
        desc: "Explore the UNESCO-listed fort and walk its ramparts at sunset.",
      },
      {
        day: 7,
        title: "Bentota Beach Retreat",
        desc: "Relax by the coast and take a Madu River mangrove safari.",
      },
      {
        day: 8,
        title: "Whale Watching Option",
        desc: "Optional seasonal whale-watching excursion from Mirissa.",
      },
      {
        day: 9,
        title: "Leisure & Water Sports",
        desc: "Enjoy a flexible day on the coast.",
      },
      {
        day: 10,
        title: "Airport Departure",
        desc: "Transfer to Colombo Airport for your departure flight.",
      },
    ],
    inclusions: [
      "9 nights in selected safari lodges and beach resorts",
      "Private air-conditioned transport with chauffeur-guide",
      "Daily breakfast and dinner",
      "One Yala 4x4 safari and listed experiences",
    ],
    exclusions: [
      "International airfare and visa fees",
      "Lunches, drinks, and personal expenses",
      "Optional whale watching and water sports",
      "Travel insurance and gratuities",
    ],
    budgetBreakdown: [
      { label: "Accommodation", amount: 290000 },
      { label: "Transport & chauffeur-guide", amount: 130000 },
      { label: "Meals", amount: 90000 },
      { label: "Safari & park fees", amount: 130000 },
      { label: "Activities & experiences", amount: 75000 },
      { label: "Other costs", amount: 65000 },
    ],
  },
  {
    id: "plan_express",
    title: "Island Express Getaway",
    duration: "5 Days / 4 Nights",
    hotels: "3-star / 4-star Boutique Stays",
    priceLKR: "from LKR 290,000 / person",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
    description:
      "A compact escape combining Kandy's cultural highlights, a scenic rail journey, and beach time.",
    routeStops: ["Colombo", "Kandy", "Bentota", "Colombo"],
    highlights: [
      "Kandy Cultural Highlights",
      "High Country Train Ride",
      "Bentota Beach",
    ],
    days: [
      {
        day: 1,
        title: "Arrival & Kandy",
        desc: "Meet at the airport, drive to Kandy, and visit the Temple of the Tooth.",
      },
      {
        day: 2,
        title: "Gardens & Scenic Train",
        desc: "Visit Peradeniya Botanical Gardens and take a scenic rail journey.",
      },
      {
        day: 3,
        title: "Transfer to Bentota",
        desc: "Travel to the west coast and enjoy an evening by the beach.",
      },
      {
        day: 4,
        title: "River & Coast",
        desc: "Take a Madu River boat ride and visit a sea turtle conservation centre.",
      },
      {
        day: 5,
        title: "Departure",
        desc: "Transfer to Colombo Airport for your return flight.",
      },
    ],
    inclusions: [
      "4 nights in selected 3-star or 4-star boutique hotels",
      "Private air-conditioned transport with chauffeur-guide",
      "Daily breakfast",
      "Listed Kandy, rail, and coastal experiences",
    ],
    exclusions: [
      "International airfare and visa fees",
      "Lunches, dinners, and drinks",
      "Optional water sports and personal expenses",
      "Travel insurance and gratuities",
    ],
    budgetBreakdown: [
      { label: "Accommodation", amount: 90000 },
      { label: "Transport & chauffeur-guide", amount: 65000 },
      { label: "Meals", amount: 40000 },
      { label: "Activities & rail", amount: 55000 },
      { label: "Other costs", amount: 40000 },
    ],
  },
] as const;

type ShowcasePlan = (typeof SHOWCASE_PLANS)[number];

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "agents" | "bookings" | "detail" | "inquiries"
  >("dashboard");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("b1");
  const [bookingSubTab, setBookingSubTab] = useState<
    | "itinerary"
    | "vouchers"
    | "map"
    | "finalDocs"
    | "welcomeLetter"
    | "settlement"
  >("itinerary");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [selectedShowcasePlan, setSelectedShowcasePlan] =
    useState<ShowcasePlan | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [isUnlockingAdmin, setIsUnlockingAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const itinerarySaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!db.isAvailable() || !isAdminMode) return;
    let active = true;

    Promise.all([db.getAgents(), db.getBookings(), db.getInquiries()])
      .then(([loadedAgents, loadedBookings, loadedInquiries]) => {
        if (!active) return;
        setAgents(loadedAgents);
        setBookings(loadedBookings);
        setInquiries(loadedInquiries);
        setSelectedBookingId(loadedBookings[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (active) {
          setDatabaseError(
            error instanceof Error
              ? error.message
              : "Unable to load operations data.",
          );
        }
      });

    return () => {
      active = false;
      if (itinerarySaveTimer.current) clearTimeout(itinerarySaveTimer.current);
    };
  }, [isAdminMode]);

  const currentBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedBookingId) || bookings[0];
  }, [bookings, selectedBookingId]);

  const filteredBookings = useMemo(() => {
    if (!globalSearch.trim()) return bookings;
    const q = globalSearch.toLowerCase();
    return bookings.filter(
      (b) =>
        b.bookingNumber.toLowerCase().includes(q) ||
        b.agentName.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        b.itinerary.some(
          (item) =>
            item.hotelName.toLowerCase().includes(q) ||
            item.destination.toLowerCase().includes(q),
        ),
    );
  }, [bookings, globalSearch]);

  const persistItinerary = (
    bookingId: string,
    itinerary: ItineraryDay[],
    immediate = false,
  ) => {
    if (!db.isAvailable()) return;
    if (itinerarySaveTimer.current) clearTimeout(itinerarySaveTimer.current);

    const save = () => {
      void db
        .updateItinerary(bookingId, itinerary)
        .then(() => setDatabaseError(null))
        .catch((error: unknown) => {
          setDatabaseError(
            error instanceof Error
              ? error.message
              : "Unable to save itinerary.",
          );
        });
    };

    if (immediate) save();
    else itinerarySaveTimer.current = setTimeout(save, 400);
  };

  const updateItineraryField = (
    index: number,
    field: "destination" | "hotelName" | "meals" | "activities" | "transport",
    value: string,
  ) => {
    if (!currentBooking) return;
    const itinerary = currentBooking.itinerary.map((day, dayIndex) =>
      dayIndex === index ? { ...day, [field]: value } : day,
    );
    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === currentBooking.id ? { ...booking, itinerary } : booking,
      ),
    );
    persistItinerary(currentBooking.id, itinerary);
  };

  const handleAdminUnlock = async () => {
    setIsUnlockingAdmin(true);
    try {
      if (db.isAvailable()) await db.unlockAdmin();
      setIsAdminMode(true);
      setActiveTab("dashboard");
      return true;
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : "Unable to open staff tools.");
      return false;
    } finally {
      setIsUnlockingAdmin(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      if (db.isAvailable()) await db.logoutAdmin();
    } finally {
      setIsAdminMode(false);
      setActiveTab("dashboard");
      setAgents([]);
      setBookings([]);
      setInquiries([]);
      setSelectedBookingId("");
    }
  };

  const handleInquirySubmit = async (inquiry: NewInquiry) => {
    setInquiryError(null);
    setInquirySubmitted(false);
    if (!db.isAvailable()) {
      setInquiryError(
        "Inquiry submission is available in the installed desktop app.",
      );
      return false;
    }
    try {
      await db.createInquiry(inquiry);
      setInquirySubmitted(true);
      return true;
    } catch (error) {
      setInquiryError(
        error instanceof Error
          ? error.message
          : "Unable to submit your inquiry.",
      );
      return false;
    }
  };

  const handleInquiryStatusChange = async (
    inquiryId: string,
    status: Inquiry["status"],
  ) => {
    try {
      const updated = await db.updateInquiryStatus(inquiryId, status);
      setInquiries((previous) =>
        previous.map((inquiry) =>
          inquiry.id === updated.id ? updated : inquiry,
        ),
      );
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : "Unable to update inquiry.",
      );
    }
  };

  const handleCreateAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const agentData: NewAgent = {
      code: (formData.get("code") as string).toUpperCase(),
      name: formData.get("name") as string,
      country: formData.get("country") as string,
      contactPerson: formData.get("contactPerson") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    };

    try {
      const newAgent = db.isAvailable()
        ? await db.createAgent(agentData)
        : { ...agentData, id: `ag_${Date.now()}`, currentSeq: 0 };
      setAgents((previous) => [newAgent, ...previous]);
      setDatabaseError(null);
      setShowNewAgentModal(false);
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : "Unable to create agent.",
      );
    }
  };

  const handleCreateBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const agentId = formData.get("agentId") as string;
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const bookingData: NewBooking = {
      agentId: agent.id,
      guestName: formData.get("guestName") as string,
      nationality: formData.get("nationality") as string,
      paxAdults: Number(formData.get("paxAdults")),
      paxChildren: Number(formData.get("paxChildren")),
      arrivalDate: formData.get("arrivalDate") as string,
      departureDate: formData.get("departureDate") as string,
      arrivalFlight: formData.get("arrivalFlight") as string,
      departureFlight: formData.get("departureFlight") as string,
      transportType: formData.get("transportType") as string,
      driverGuide: formData.get("driverGuide") as string,
      specialRequests: formData.get("specialRequests") as string,
      internalNotes: formData.get("internalNotes") as string,
      revenueLKR: Number(formData.get("revenueLKR")),
    };

    try {
      let newBooking: Booking;
      if (db.isAvailable()) {
        newBooking = await db.createBooking(bookingData);
        setAgents(await db.getAgents());
      } else {
        const nextSeq = agent.currentSeq + 1;
        newBooking = {
          ...bookingData,
          id: `b_${Date.now()}`,
          bookingNumber: `${agent.code}-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`,
          agentName: agent.name,
          status: "Confirmed",
          itinerary: [{
            day: 1,
            date: bookingData.arrivalDate,
            destination: "Colombo",
            hotelId: "h1",
            hotelName: "Cinnamon Grand Colombo",
            meals: "Dinner",
            activities: "Airport Transfer & Leisure",
            transport: bookingData.transportType,
            notes: "Welcome upon arrival",
          }],
          expenses: {
            hotels: bookingData.revenueLKR * 0.45,
            transport: bookingData.revenueLKR * 0.15,
            guide: bookingData.revenueLKR * 0.05,
            activities: bookingData.revenueLKR * 0.08,
            other: bookingData.revenueLKR * 0.02,
          },
        };
        setAgents((previous) => previous.map((item) =>
          item.id === agentId ? { ...item, currentSeq: nextSeq } : item,
        ));
      }
      setBookings((previous) => [newBooking, ...previous]);
      setSelectedBookingId(newBooking.id);

      setDatabaseError(null);
      setShowNewBookingModal(false);
      setActiveTab("detail");
    } catch (error) {
      setDatabaseError(
        error instanceof Error ? error.message : "Unable to create booking.",
      );
    }
  };

  const addItineraryDay = () => {
    const nextDayNum = currentBooking.itinerary.length + 1;
    const lastDay =
      currentBooking.itinerary[currentBooking.itinerary.length - 1];

    let nextDate = "2026-10-18";
    if (lastDay && lastDay.date) {
      const d = new Date(lastDay.date);
      d.setDate(d.getDate() + 1);
      nextDate = d.toISOString().split("T")[0];
    }

    const updatedItinerary = [
      ...currentBooking.itinerary,
      {
        day: nextDayNum,
        date: nextDate,
        destination: "Galle Fort",
        hotelId: "h7",
        hotelName: "Amangalla",
        meals: "Breakfast, Dinner",
        activities: "Heritage Fort Walk",
        transport: currentBooking.transportType,
        notes: "Sightseeing",
      },
    ];

    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === currentBooking.id
          ? { ...booking, itinerary: updatedItinerary }
          : booking,
      ),
    );
    persistItinerary(currentBooking.id, updatedItinerary, true);
  };

  const removeItineraryDay = (index: number) => {
    const updated = currentBooking.itinerary
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, day: idx + 1 }));
    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === currentBooking.id
          ? { ...booking, itinerary: updated }
          : booking,
      ),
    );
    persistItinerary(currentBooking.id, updated, true);
  };

  if (!isAdminMode) {
    return (
      <PublicPortal
        inquiryError={inquiryError}
        isUnlockingAdmin={isUnlockingAdmin}
        inquirySubmitted={inquirySubmitted}
        onAdminUnlock={handleAdminUnlock}
        onInquirySubmit={handleInquirySubmit}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-900/30">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                Serendib DMC
              </h1>
              <p className="text-xs text-emerald-400 font-medium">
                Sri Lanka Operations
              </p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Operations Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "bookings" || activeTab === "detail"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Booking Management</span>
              <span className="ml-auto bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("agents")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "agents"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Overseas Agents</span>
              <span className="ml-auto bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                {agents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("inquiries")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "inquiries"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Client Inquiries</span>
              <span className="ml-auto bg-slate-800 text-amber-300 text-xs px-2 py-0.5 rounded-full">
                {inquiries.filter((inquiry) => inquiry.status === "New").length}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                OP
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Kavinda Silva
                </p>
                <p className="text-[10px] text-slate-400">
                  Senior Reservations Mgr
                </p>
              </div>
            </div>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Quick search by Agent, Booking #, Guest, Hotel or Destination..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewBookingModal(true)}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Reservation</span>
            </button>
            <button
              onClick={() => void handleAdminLogout()}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-400/50 hover:text-white"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Exit admin</span>
            </button>
          </div>
        </header>

        {databaseError && (
          <div
            role="alert"
            className="mx-6 mt-3 flex items-start justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            <span>{databaseError}</span>
            <button
              onClick={() => setDatabaseError(null)}
              aria-label="Dismiss database error"
              className="text-rose-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    DMC Tour Operations Control
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time status of incoming agent requests, operational
                    movements, and pending supplier settlements.
                  </p>
                </div>
                <button
                  onClick={() => setShowShowcaseModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md self-start sm:self-auto"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Browse Client Packages &amp; Past Tours</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Tours In Operation
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">1</p>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" /> On Schedule
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Navigation className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Upcoming Arrivals (7 Days)
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">1</p>
                    <span className="text-[10px] text-sky-400 font-semibold flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" /> Ready for check-in
                    </span>
                  </div>
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Pending Vouchers
                    </p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">3</p>
                    <span className="text-[10px] text-amber-400/80 font-semibold flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 mr-1" /> Action Required
                    </span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Unsettled Tour Margin
                    </p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      LKR 1.63M
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center mt-1">
                      Avg. 34.2% Margin
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center">
                      <Sparkles className="w-4 h-4 text-emerald-400 mr-2" />{" "}
                      Live Tour Operations Status
                    </h3>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      View All Bookings
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {booking.bookingNumber}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {booking.guestName}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                              {booking.paxAdults} Adults, {booking.paxChildren}{" "}
                              Child
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>
                              Agent:{" "}
                              <strong className="text-slate-300">
                                {booking.agentName}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Guide:{" "}
                              <strong className="text-slate-300">
                                {booking.driverGuide}
                              </strong>
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span>
                              Current Leg:{" "}
                              <strong>
                                {booking.itinerary[0]?.destination}
                              </strong>{" "}
                              ({booking.itinerary[0]?.hotelName})
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              booking.status === "In Operation"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            }`}
                          >
                            {booking.status}
                          </span>

                          <button
                            onClick={() => {
                              setSelectedBookingId(booking.id);
                              setActiveTab("detail");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />{" "}
                    Pending Staff Checklist
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start space-x-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                      />
                      <div>
                        <p className="font-semibold text-slate-200">
                          Send Hotel Voucher to Heritance Kandalama
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Booking ABC-2026-0001 (Ref: Mr. Smith)
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start space-x-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                      />
                      <div>
                        <p className="font-semibold text-slate-200">
                          Prepare Welcome Kit & SIM Card
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Arrival UL504 - Oct 10th @ 12:40 PM
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                      />
                      <div className="line-through text-slate-500">
                        <p className="font-semibold">
                          Assign Driver/National Guide
                        </p>
                        <p className="text-[10px]">
                          Assigned to Samantha Bandara
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agents */}
          {activeTab === "agents" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Overseas Travel Agents
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage B2B agent partners, unique booking code prefix
                    series, and contact details.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewAgentModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-900/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Agent</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                          PREFIX: {agent.code}
                        </span>
                        <h3 className="text-base font-bold text-white mt-2">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center mt-1">
                          <Globe className="w-3 h-3 mr-1 text-slate-500" />{" "}
                          {agent.country}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact Person:</span>
                        <span className="font-medium">
                          {agent.contactPerson}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-mono text-emerald-400">
                          {agent.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-mono">{agent.phone}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-slate-400">
                          Current Auto Series:
                        </span>
                        <span className="font-mono text-slate-200">
                          {agent.code}-2026-
                          {(agent.currentSeq + 1).toString().padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings List */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    All Agent Bookings
                  </h2>
                  <p className="text-xs text-slate-400">
                    Filter, search, and manage all incoming reservations across
                    overseas travel partners.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewBookingModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-900/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Booking</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Booking Ref</th>
                      <th className="py-3.5 px-4">Agent Name</th>
                      <th className="py-3.5 px-4">Main Guest</th>
                      <th className="py-3.5 px-4">Pax</th>
                      <th className="py-3.5 px-4">Tour Dates</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Revenue (LKR)</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredBookings.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {b.bookingNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {b.agentName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {b.guestName}
                        </td>
                        <td className="py-3.5 px-4">
                          {b.paxAdults} A / {b.paxChildren} C
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {b.arrivalDate} to {b.departureDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.status === "In Operation"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                          {b.revenueLKR.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedBookingId(b.id);
                              setActiveTab("detail");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1 rounded-md transition-colors inline-flex items-center space-x-1"
                          >
                            <span>Open File</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "inquiries" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Client Trip Inquiries
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Review public requests and track follow-up status.
                </p>
              </div>
              {inquiries.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
                  <Mail className="mx-auto h-6 w-6 text-slate-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-200">
                    No trip inquiries yet
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    New public requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inquiry) => (
                    <article
                      key={inquiry.id}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-white">
                              {inquiry.fullName}
                            </h3>
                            <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400">
                              {inquiry.nationality}
                            </span>
                          </div>
                          <a
                            href={`mailto:${inquiry.email}`}
                            className="mt-1 inline-block text-xs text-emerald-400 hover:underline"
                          >
                            {inquiry.email}
                          </a>
                          <p className="mt-3 text-xs text-slate-300">
                            {inquiry.packageInterest} · {inquiry.travelers}{" "}
                            traveler{inquiry.travelers === 1 ? "" : "s"}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {inquiry.arrivalDate || "Dates flexible"} to{" "}
                            {inquiry.departureDate || "not specified"}
                          </p>
                          {inquiry.interests && (
                            <p className="mt-2 text-xs text-slate-300">
                              Interests: {inquiry.interests}
                            </p>
                          )}
                          <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-300">
                            {inquiry.message}
                          </p>
                          <p className="mt-3 text-[10px] text-slate-500">
                            Received{" "}
                            {new Date(inquiry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <label className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Follow-up status
                          <select
                            value={inquiry.status}
                            onChange={(event) =>
                              void handleInquiryStatusChange(
                                inquiry.id,
                                event.target.value as Inquiry["status"],
                              )
                            }
                            className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs normal-case text-slate-200 outline-none focus:border-emerald-500"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Workspace Detail */}
          {activeTab === "detail" && currentBooking && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                        {currentBooking.bookingNumber}
                      </span>
                      <h2 className="text-xl font-bold text-white">
                        {currentBooking.guestName}
                      </h2>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                        {currentBooking.paxAdults} Adults,{" "}
                        {currentBooking.paxChildren} Child (
                        {currentBooking.nationality})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center space-x-4">
                      <span>
                        Agent:{" "}
                        <strong className="text-slate-200">
                          {currentBooking.agentName}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Arrival Flight:{" "}
                        <strong className="text-slate-200">
                          {currentBooking.arrivalFlight}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Driver/Guide:{" "}
                        <strong className="text-slate-200">
                          {currentBooking.driverGuide}
                        </strong>
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Status:
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                      {currentBooking.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pt-1">
                  {[
                    {
                      id: "itinerary",
                      label: "1. Itinerary Builder",
                      icon: Calendar,
                    },
                    {
                      id: "vouchers",
                      label: "2. Supplier Vouchers",
                      icon: FileText,
                    },
                    {
                      id: "map",
                      label: "3. Interactive Route Map",
                      icon: MapIcon,
                    },
                    {
                      id: "finalDocs",
                      label: "4. Final Tour File",
                      icon: Briefcase,
                    },
                    {
                      id: "welcomeLetter",
                      label: "5. Guest Welcome Letter",
                      icon: Mail,
                    },
                    {
                      id: "settlement",
                      label: "6. Tour Settlement Sheet",
                      icon: DollarSign,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = bookingSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setBookingSubTab(tab.id as any)}
                        className={`flex items-center space-x-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                            : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtabs */}
              {bookingSubTab === "itinerary" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center">
                      <Calendar className="w-4 h-4 text-emerald-400 mr-2" />{" "}
                      Day-by-Day Itinerary Planner
                    </h3>
                    <button
                      onClick={addItineraryDay}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tour Day</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentBooking.itinerary.map((day, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center justify-center">
                              D{day.day}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white">
                                Day {day.day}: {day.destination}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {day.date}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => removeItineraryDay(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                            title="Remove Day"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase">
                              Destination & Location
                            </label>
                            <input
                              type="text"
                              value={day.destination}
                              onChange={(e) =>
                                updateItineraryField(
                                  idx,
                                  "destination",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                persistItinerary(
                                  currentBooking.id,
                                  currentBooking.itinerary,
                                  true,
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 mt-1 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase">
                              Overnight Hotel
                            </label>
                            <input
                              type="text"
                              value={day.hotelName}
                              onChange={(e) =>
                                updateItineraryField(
                                  idx,
                                  "hotelName",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                persistItinerary(
                                  currentBooking.id,
                                  currentBooking.itinerary,
                                  true,
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 mt-1 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase">
                              Meal Plan Included
                            </label>
                            <input
                              type="text"
                              value={day.meals}
                              onChange={(e) =>
                                updateItineraryField(
                                  idx,
                                  "meals",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                persistItinerary(
                                  currentBooking.id,
                                  currentBooking.itinerary,
                                  true,
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 mt-1 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] text-slate-400 font-semibold uppercase">
                              Sightseeing & Planned Activities
                            </label>
                            <input
                              type="text"
                              value={day.activities}
                              onChange={(e) =>
                                updateItineraryField(
                                  idx,
                                  "activities",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                persistItinerary(
                                  currentBooking.id,
                                  currentBooking.itinerary,
                                  true,
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 mt-1 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase">
                              Transport Mode
                            </label>
                            <input
                              type="text"
                              value={day.transport}
                              onChange={(e) =>
                                updateItineraryField(
                                  idx,
                                  "transport",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                persistItinerary(
                                  currentBooking.id,
                                  currentBooking.itinerary,
                                  true,
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 mt-1 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookingSubTab === "vouchers" && (
                <div className="space-y-6">
                  <div className="bg-white text-slate-900 border border-slate-300 rounded-xl p-6 space-y-6 shadow-2xl">
                    <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                      <div>
                        <h1 className="text-xl font-extrabold uppercase tracking-wider text-slate-900">
                          Serendib Destination Management
                        </h1>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Level 4, World Trade Centre, Colombo 01, Sri Lanka |
                          +94 11 234 5678
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Email: reservations@serendibdmc.lk
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 rounded">
                          HOTEL RESERVATION VOUCHER
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                          Voucher #: VCH-{currentBooking.bookingNumber}-H1
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Date Issued: Oct 04, 2026
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded p-3 bg-slate-50">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          To Supplier / Hotel:
                        </p>
                        <p className="font-bold text-sm text-slate-900">
                          Heritance Kandalama
                        </p>
                        <p className="text-slate-600">
                          Sigiriya / Dambulla, Sri Lanka
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          Booking Reference:
                        </p>
                        <p className="font-bold text-slate-900">
                          Agent Ref: {currentBooking.bookingNumber}
                        </p>
                        <p className="text-slate-600">
                          Overseas Agent: {currentBooking.agentName}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        Guest & Stay Particulars
                      </h4>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-slate-100 rounded">
                          <span className="text-[10px] text-slate-500 block">
                            Guest Name:
                          </span>
                          <strong className="text-slate-900">
                            {currentBooking.guestName}
                          </strong>
                        </div>
                        <div className="p-2 bg-slate-100 rounded">
                          <span className="text-[10px] text-slate-500 block">
                            Pax Count:
                          </span>
                          <strong className="text-slate-900">
                            {currentBooking.paxAdults} Adults,{" "}
                            {currentBooking.paxChildren} Child
                          </strong>
                        </div>
                        <div className="p-2 bg-slate-100 rounded">
                          <span className="text-[10px] text-slate-500 block">
                            Check-In Date:
                          </span>
                          <strong className="text-slate-900">2026-10-11</strong>
                        </div>
                        <div className="p-2 bg-slate-100 rounded">
                          <span className="text-[10px] text-slate-500 block">
                            Check-Out Date:
                          </span>
                          <strong className="text-slate-900">
                            2026-10-13 (2 Nights)
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                        Services & Inclusions
                      </h4>
                      <table className="w-full text-left text-xs border border-slate-300">
                        <thead className="bg-slate-200 text-slate-800">
                          <tr>
                            <th className="p-2 border-r border-slate-300">
                              Room Category
                            </th>
                            <th className="p-2 border-r border-slate-300">
                              Meal Plan
                            </th>
                            <th className="p-2 border-r border-slate-300">
                              Quantity
                            </th>
                            <th className="p-2">Special Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border-r border-slate-300 font-semibold">
                              Superior Luxury Room
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              Half Board (HB - Breakfast & Dinner)
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              1 Double Room
                            </td>
                            <td className="p-2 text-slate-600">
                              Honeymoon Setup on arrival day. High floor
                              requested.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">
                          Billing Instructions:
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          All room and meal charges billed directly to Serendib
                          DMC Account. Personal extras to be settled by guest
                          prior to check-out.
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-32 h-10 border-b border-slate-400 mb-1"></div>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Authorized Tour Officer Signature
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Voucher</span>
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Voucher to Hotel</span>
                    </button>
                  </div>
                </div>
              )}

              {bookingSubTab === "map" &&
                (() => {
                  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
                  const itinerary = currentBooking.itinerary;
                  const firstStop = itinerary[0];
                  const lastStop = itinerary[itinerary.length - 1];
                  const origin = firstStop
                    ? encodeURIComponent(`${firstStop.destination}, Sri Lanka`)
                    : "";
                  const destination = lastStop
                    ? encodeURIComponent(`${lastStop.destination}, Sri Lanka`)
                    : "";
                  const waypoints = itinerary
                    .slice(1, -1)
                    .map((item) =>
                      encodeURIComponent(`${item.destination}, Sri Lanka`),
                    )
                    .join("|");

                  const mapEmbedUrl =
                    apiKey && origin && destination
                      ? `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(apiKey)}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&mode=driving`
                      : "";
                  const directionsUrl =
                    origin && destination
                      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving${waypoints ? `&waypoints=${waypoints}` : ""}`
                      : "";

                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white flex items-center">
                            <MapIcon className="w-4 h-4 text-emerald-400 mr-2" />
                            Live Google Maps Tour Directions
                          </h3>
                          <span className="text-xs text-slate-400">
                            Total Stops:{" "}
                            <strong>{itinerary.length} Destinations</strong>
                          </span>
                        </div>

                        <div className="w-full h-96 rounded-lg border border-slate-800 overflow-hidden shadow-inner bg-slate-950">
                          {mapEmbedUrl ? (
                            <iframe
                              title="Sri Lanka Tour Route"
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={mapEmbedUrl}
                            />
                          ) : directionsUrl ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                              <p className="text-sm text-slate-300">
                                Add a Google Maps API key to embed live
                                directions.
                              </p>
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                              >
                                Open driving directions in Google Maps
                              </a>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center p-6 text-sm text-slate-400">
                              No itinerary stops are available to map.
                            </div>
                          )}
                        </div>

                        {!apiKey && itinerary.length > 0 && (
                          <p className="text-xs text-amber-400">
                            Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your
                            environment to show the route here.
                          </p>
                        )}

                        <div className="flex items-center gap-2 overflow-x-auto py-2">
                          {itinerary.map((item, idx) => (
                            <div
                              key={`${item.day}-${idx}`}
                              className="flex-shrink-0 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2"
                            >
                              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                                Day {item.day}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-200">
                                  {item.destination}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {item.hotelName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {bookingSubTab === "finalDocs" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Guest Final Tour Booklet File
                      </h3>
                      <p className="text-xs text-slate-400">
                        Complete consolidated documentation for driver-guide and
                        guest arrival folder.
                      </p>
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export Full PDF Folder</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                      <h4 className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">
                        Flight Details
                      </h4>
                      <p className="text-slate-300">
                        Arrival:{" "}
                        <strong className="text-white">
                          {currentBooking.arrivalFlight}
                        </strong>
                      </p>
                      <p className="text-slate-300">
                        Departure:{" "}
                        <strong className="text-white">
                          {currentBooking.departureFlight}
                        </strong>
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                      <h4 className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">
                        24/7 Emergency Contacts
                      </h4>
                      <p className="text-slate-300">
                        Hotline:{" "}
                        <strong className="text-white">
                          +94 77 123 4567 (Operations Desk)
                        </strong>
                      </p>
                      <p className="text-slate-300">
                        Chauffeur Guide:{" "}
                        <strong className="text-white">
                          {currentBooking.driverGuide} (+94 71 987 6543)
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {bookingSubTab === "welcomeLetter" && (
                <div className="space-y-4">
                  <div className="bg-white text-slate-900 border border-slate-300 rounded-xl p-8 space-y-6 shadow-2xl">
                    <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                      <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-wide">
                        AYUBOWAN & WELCOME TO SRI LANKA
                      </h1>
                      <p className="text-xs text-emerald-700 font-semibold uppercase tracking-widest">
                        Serendib Destination Management Company
                      </p>
                    </div>

                    <div className="text-xs text-slate-700 space-y-4 leading-relaxed font-serif">
                      <p>
                        Dear <strong>{currentBooking.guestName}</strong>,
                      </p>

                      <p>
                        On behalf of the entire team at Serendib DMC and your
                        travel partner{" "}
                        <strong>{currentBooking.agentName}</strong>, we extend
                        our warmest Sri Lankan welcome to our beautiful island
                        paradise!
                      </p>

                      <p>
                        Your personal National Guide / Chauffeur,{" "}
                        <strong>{currentBooking.driverGuide}</strong>, will be
                        accompanying you throughout your tour. We have carefully
                        planned every detail of your journey across Sri Lanka to
                        ensure a memorable, relaxing, and immersive experience.
                      </p>

                      <div className="bg-amber-50 border border-amber-200 p-4 rounded text-xs space-y-1 font-sans">
                        <strong className="text-amber-900 block font-bold">
                          Important Arrival Note:
                        </strong>
                        <p className="text-amber-800">
                          Your emergency contact hotline during your stay is
                          available 24/7 at <strong>+94 77 123 4567</strong>.
                        </p>
                      </div>

                      <p>
                        We wish you an extraordinary journey filled with
                        unforgettable moments!
                      </p>

                      <div className="pt-4 border-t border-slate-200 font-sans text-xs">
                        <p className="font-bold text-slate-900">
                          Warm Regards,
                        </p>
                        <p className="text-slate-600">
                          The Tour Operations Team
                        </p>
                        <p className="text-xs text-emerald-700 font-semibold">
                          Serendib DMC Sri Lanka
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-800 text-slate-200 text-xs px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Welcome Letter</span>
                    </button>
                  </div>
                </div>
              )}

              {bookingSubTab === "settlement" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Financial Tour Settlement & Profit Margin Sheet
                      </h3>
                      <p className="text-xs text-slate-400">
                        Automated revenue breakdown against actual supplier
                        expenditure.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Gross Revenue (Agent Invoiced)
                      </span>
                      <p className="text-xl font-bold font-mono text-white mt-1">
                        LKR {currentBooking.revenueLKR.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Total Operational Expenses
                      </span>
                      <p className="text-xl font-bold font-mono text-rose-400 mt-1">
                        LKR{" "}
                        {Object.values(currentBooking.expenses)
                          .reduce((a, b) => a + b, 0)
                          .toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                        Net DMC Profit Margin
                      </span>
                      <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        LKR{" "}
                        {(
                          currentBooking.revenueLKR -
                          Object.values(currentBooking.expenses).reduce(
                            (a, b) => a + b,
                            0,
                          )
                        ).toLocaleString()}
                        <span className="text-xs text-slate-400 ml-2 font-sans font-normal">
                          (
                          {(
                            ((currentBooking.revenueLKR -
                              Object.values(currentBooking.expenses).reduce(
                                (a, b) => a + b,
                                0,
                              )) /
                              currentBooking.revenueLKR) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Cost Itemization
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                      <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Cost Category</th>
                          <th className="p-3">Description</th>
                          <th className="p-3 text-right">Amount (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr>
                          <td className="p-3 font-semibold text-white">
                            Hotels & Accommodation
                          </td>
                          <td className="p-3 text-slate-400">
                            Total room nights across all itinerary stays
                          </td>
                          <td className="p-3 text-right font-mono">
                            {currentBooking.expenses.hotels.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">
                            Transport & Fuel
                          </td>
                          <td className="p-3 text-slate-400">
                            Vehicle mileage, toll fees & driver allowance
                          </td>
                          <td className="p-3 text-right font-mono">
                            {currentBooking.expenses.transport.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">
                            National Guide / Chauffeur Fee
                          </td>
                          <td className="p-3 text-slate-400">
                            Guide daily fees & subsistence
                          </td>
                          <td className="p-3 text-right font-mono">
                            {currentBooking.expenses.guide.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">
                            Excursions & Entrance Tickets
                          </td>
                          <td className="p-3 text-slate-400">
                            Sigiriya tickets, National Park safari, Temple fees
                          </td>
                          <td className="p-3 text-right font-mono">
                            {currentBooking.expenses.activities.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">
                            Miscellaneous & Water
                          </td>
                          <td className="p-3 text-slate-400">
                            Welcome garlands, SIM cards & bottled water
                          </td>
                          <td className="p-3 text-right font-mono">
                            {currentBooking.expenses.other.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Agent Modal */}
      {showNewAgentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Register Overseas Travel Agent
              </h3>
              <button
                onClick={() => setShowNewAgentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Agent Code / Prefix (3 Letters)
                </label>
                <input
                  required
                  name="code"
                  maxLength={3}
                  placeholder="e.g. TUI"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Company Name
                </label>
                <input
                  required
                  name="name"
                  placeholder="e.g. TUI Travels UK"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Country
                </label>
                <input
                  required
                  name="country"
                  placeholder="e.g. United Kingdom"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Contact Person
                </label>
                <input
                  required
                  name="contactPerson"
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="agent@tui.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Phone
                </label>
                <input
                  required
                  name="phone"
                  placeholder="+44 20 1234 5678"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewAgentModal(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Create New Agent Reservation File
              </h3>
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Select Overseas Agent
                  </label>
                  <select
                    name="agentId"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Main Guest Full Name
                  </label>
                  <input
                    required
                    name="guestName"
                    placeholder="e.g. Mr. Robert Taylor"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Guest Nationality
                  </label>
                  <input
                    required
                    name="nationality"
                    placeholder="e.g. Australian"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Adults
                    </label>
                    <input
                      required
                      type="number"
                      name="paxAdults"
                      defaultValue={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Children
                    </label>
                    <input
                      required
                      type="number"
                      name="paxChildren"
                      defaultValue={0}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Arrival Date
                  </label>
                  <input
                    required
                    type="date"
                    name="arrivalDate"
                    defaultValue="2026-10-20"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Departure Date
                  </label>
                  <input
                    required
                    type="date"
                    name="departureDate"
                    defaultValue="2026-10-27"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Arrival Flight Info
                  </label>
                  <input
                    required
                    name="arrivalFlight"
                    placeholder="e.g. UL504 @ 12:40 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Departure Flight Info
                  </label>
                  <input
                    required
                    name="departureFlight"
                    placeholder="e.g. UL503 @ 02:15 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Transport Vehicle Type
                  </label>
                  <input
                    required
                    name="transportType"
                    defaultValue="Luxury AC Van (Toyota KDH)"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Assigned Driver / Guide
                  </label>
                  <input
                    required
                    name="driverGuide"
                    defaultValue="Samantha Bandara (National Guide)"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 font-semibold block mb-1">
                    Total Quoted Revenue (LKR)
                  </label>
                  <input
                    required
                    type="number"
                    name="revenueLKR"
                    defaultValue={2200000}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 font-semibold block mb-1">
                    Special Guest Requests
                  </label>
                  <textarea
                    name="specialRequests"
                    placeholder="Diets, anniversaries, extra bed..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Generate Booking File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShowcaseModal && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            setShowShowcaseModal(false);
            setSelectedShowcasePlan(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="showcase-title"
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl p-4 sm:p-6 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="showcase-title"
                    className="text-base font-bold text-white"
                  >
                    Serendib DMC - Client Portfolio &amp; Packages
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sample tour templates, budget tiers, and featured hotel
                    partners.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShowcaseModal(false);
                  setSelectedShowcasePlan(null);
                }}
                aria-label="Close showcase"
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedShowcasePlan ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSelectedShowcasePlan(null)}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold"
                  >
                    &larr; Back to All Packages
                  </button>
                  <span className="text-xs text-slate-400 font-mono font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    {selectedShowcasePlan.duration}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <h4 className="text-xl font-bold text-white">
                        {selectedShowcasePlan.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed mt-2">
                        {selectedShowcasePlan.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedShowcasePlan.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2 text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Starting Price / Person
                    </span>
                    <p className="text-lg font-bold font-mono text-emerald-400">
                      {selectedShowcasePlan.priceLKR}
                    </p>
                    <p className="text-slate-300">
                      Hotel tier: <strong>{selectedShowcasePlan.hotels}</strong>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Indicative sample pricing; confirm availability and final
                      inclusions.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                    <MapIcon className="w-4 h-4 mr-1.5" /> Circuit Map Route
                  </h5>
                  {(() => {
                    const apiKey =
                      import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
                    const stops = selectedShowcasePlan.routeStops;
                    const origin = encodeURIComponent(`${stops[0]}, Sri Lanka`);
                    const destination = encodeURIComponent(
                      `${stops[stops.length - 1]}, Sri Lanka`,
                    );
                    const waypoints = stops
                      .slice(1, -1)
                      .map((stop) => encodeURIComponent(`${stop}, Sri Lanka`))
                      .join("|");
                    const mapUrl = apiKey
                      ? `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(apiKey)}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&mode=driving`
                      : "";
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving${waypoints ? `&waypoints=${waypoints}` : ""}`;

                    return mapUrl ? (
                      <div className="w-full h-64 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <iframe
                          title={`${selectedShowcasePlan.title} driving route`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={mapUrl}
                        />
                      </div>
                    ) : (
                      <div className="min-h-32 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <p className="text-xs text-slate-400">
                          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to embed
                          this route.
                        </p>
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                        >
                          Open this driving route in Google Maps
                        </a>
                      </div>
                    );
                  })()}
                </section>

                <section className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                    Day-by-Day Journey Outline
                  </h5>
                  <div className="space-y-2">
                    {selectedShowcasePlan.days.map((day) => (
                      <div
                        key={day.day}
                        className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-start gap-3"
                      >
                        <span className="w-8 h-7 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          Day {day.day}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {day.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {day.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                      Included
                    </h5>
                    <ul className="space-y-2">
                      {selectedShowcasePlan.inclusions.map((item) => (
                        <li
                          key={item}
                          className="text-xs text-slate-300 flex gap-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                      Not Included
                    </h5>
                    <ul className="space-y-2">
                      {selectedShowcasePlan.exclusions.map((item) => (
                        <li
                          key={item}
                          className="text-xs text-slate-300 flex gap-2"
                        >
                          <span className="text-amber-400" aria-hidden="true">
                            -
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Illustrative Budget / Person
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sample allocation in LKR; final pricing varies by dates
                      and availability.
                    </p>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {selectedShowcasePlan.budgetBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-mono text-slate-200">
                          LKR {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 flex items-center justify-between gap-3 text-sm font-bold">
                      <span className="text-white">
                        Estimated Package Total
                      </span>
                      <span className="font-mono text-emerald-400">
                        LKR{" "}
                        {selectedShowcasePlan.budgetBreakdown
                          .reduce((total, item) => total + item.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <>
                <section
                  aria-label="Company highlights"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"
                >
                  {[
                    ["12+ Years", "Inbound DMC Excellence"],
                    ["1,400+", "Tours Operated"],
                    ["100% LKR", "Local Rate Transparency"],
                    ["24/7", "On-Ground Support"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="bg-slate-950 border border-slate-800 p-3 rounded-lg"
                    >
                      <p className="text-lg font-bold text-emerald-400">
                        {value}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {label}
                      </p>
                    </div>
                  ))}
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                    <Compass className="w-4 h-4 mr-1.5" /> Popular Signature
                    Circuits
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SHOWCASE_PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedShowcasePlan(plan)}
                        className="text-left bg-slate-950 border border-slate-800 rounded-lg overflow-hidden group flex flex-col hover:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
                      >
                        <div className="h-36 overflow-hidden relative">
                          <img
                            src={plan.image}
                            alt={plan.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 right-2 bg-slate-900/90 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded">
                            {plan.duration}
                          </span>
                        </div>
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">
                              {plan.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {plan.description}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex items-end justify-between gap-2">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">
                              {plan.hotels}
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-400 text-right">
                              {plan.priceLKR}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                    <Globe className="w-4 h-4 mr-1.5" /> Featured Hotel Partners
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Cinnamon Grand Colombo",
                      "Heritance Kandalama",
                      "Earl's Regency",
                      "Grand Hotel Nuwara Eliya",
                      "Taj Bentota Resort & Spa",
                    ].map((hotel) => (
                      <span
                        key={hotel}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"
                      >
                        {hotel}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1.5" /> Budget Tiers (Per
                    Night / Twin Share)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Standard",
                        price: "LKR 35,000 - 55,000",
                        description:
                          "Comfortable 3-star boutique hotels and private AC car.",
                        color: "text-sky-400",
                      },
                      {
                        name: "Premium - Most Popular",
                        price: "LKR 65,000 - 95,000",
                        description:
                          "5-star resorts, private AC van, and licensed national guide.",
                        color: "text-emerald-400",
                      },
                      {
                        name: "Ultra-Luxury / VIP",
                        price: "LKR 120,000+",
                        description:
                          "Luxury heritage suites and tailored private experiences.",
                        color: "text-amber-400",
                      },
                    ].map((tier) => (
                      <div
                        key={tier.name}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1"
                      >
                        <span
                          className={`text-[10px] font-bold uppercase ${tier.color}`}
                        >
                          {tier.name}
                        </span>
                        <p className="font-bold text-white text-sm">
                          {tier.price}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {tier.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Sample estimates only; final pricing depends on travel
                    dates, availability, and inclusions.
                  </p>
                </section>
              </>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setShowShowcaseModal(false);
                  setSelectedShowcasePlan(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2 rounded-lg"
              >
                Close Showcase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
