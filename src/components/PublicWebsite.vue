<script setup lang="ts">
/**
 * ==============================================================================
 * METSHU TRAVELS - PUBLIC WEBSITE FRONTEND (metshutravels.com design & features)
 * ==============================================================================
 * 
 * Features:
 * - Brand: Metshu Travels (Sri Lanka)
 * - Office: L 12, Ceylinco House, Colombo 01, Sri Lanka
 * - Direct Contact: +94 74 394 2844 | info@metshutravels.com
 * - Hero with quick package search & filter
 * - Complete 5N/6D, 9N/10D, 14N/15D, 7N/8D tour packages with day-by-day modal
 * - Day excursions and signature experiences
 * - Luxury vehicle fleet & chauffeur guide showcase
 * - Why Choose Metshu Travels & sustainable tourism standards
 * - Customer testimonials & ratings
 * - Custom tour builder & inquiry form (directly connected to /api/inquiries REST API)
 * - Navigation button to switch to the DMC Operations System
 * ==============================================================================
 */

import { ref, computed } from 'vue';
import { apiClient, type NewInquiry } from '../services/api';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Check,
  Car,
  ChevronRight,
  Send,
  Sparkles,
  LayoutDashboard,
  HeartHandshake,
  Globe,
  Award,
  Search,
  X,
  MessageCircle
} from 'lucide-vue-next';

// Emit event to switch to DMC Operations System
const emit = defineEmits<{
  (e: 'open-operations'): void;
}>();

// Filter & Search State
const selectedDuration = ref('ALL');
const selectedStyle = ref('ALL');
const activeCategoryTab = ref('all');

// Modals State
const showItineraryModal = ref(false);
const selectedTour = ref<TourPackage | null>(null);

// Inquiry Form State
const submittingInquiry = ref(false);
const inquirySuccess = ref(false);
const inquiryError = ref<string | null>(null);

const inquiryForm = ref<NewInquiry>({
  full_name: '',
  email: '',
  nationality: 'British',
  arrival_date: '',
  departure_date: '',
  travelers: 2,
  package_interest: 'custom',
  interests: 'Culture, scenic train journey, wildlife safari',
  message: ''
});

// ------------------------------------------------------------------------------
// METSHU TRAVELS TOUR PACKAGES DATA
// (Directly modeled from metshutravels.com offerings)
// ------------------------------------------------------------------------------

export interface TourPackage {
  id: string;
  duration: string;
  daysCount: number;
  nightsCount: number;
  title: string;
  category: 'classic' | 'wildlife' | 'extended' | 'coastal';
  subtitle: string;
  priceLKR: string;
  priceUSD: string;
  image: string;
  route: string;
  highlights: string[];
  inclusions: string[];
  days: {
    day: number;
    destination: string;
    title: string;
    hotel: string;
    meals: string;
    description: string;
  }[];
}

const TOUR_PACKAGES: TourPackage[] = [
  {
    id: '5n-6d-classic',
    duration: '5 Nights / 6 Days',
    daysCount: 6,
    nightsCount: 5,
    title: 'The Island in Miniature',
    category: 'classic',
    subtitle: 'Classic circuit through Kandy, the misty hill country, Yala wildlife and southern ocean shores.',
    priceLKR: 'from LKR 380,000 / person',
    priceUSD: 'from $1,250 USD / person',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=85',
    route: 'Negombo · Kandy · Ella · Yala Safari · Mirissa · Colombo',
    highlights: [
      'Peradeniya Royal Botanical Gardens',
      'Temple of the Sacred Tooth Relic',
      'Scenic Ella Hill Country & Nine Arches Bridge',
      '4x4 Yala National Park Safari (Leopards & Elephants)',
      'Mirissa Southern Beaches & Whale Watching Coast'
    ],
    inclusions: [
      '5 nights luxury 4/5-star boutique accommodation with daily breakfast',
      'Private air-conditioned Toyota KDH luxury van with dedicated English-speaking chauffeur-guide',
      'Fuel, toll charges, highway fees, and driver accommodation & meals',
      '1x Yala National Park 4x4 Jeep Safari with tracker and entrance tickets',
      'Scenic train ride observation carriage tickets from Kandy / Nanu Oya'
    ],
    days: [
      {
        day: 1,
        destination: 'Negombo / Airport Arrival',
        title: 'Warm Welcome to the Wonder of Asia',
        hotel: 'Jetwing Blue or similar (Negombo)',
        meals: 'Dinner included',
        description: 'Airport greeting by your dedicated Metshu Travels chauffeur-guide. Transfer to your coastal beach hotel to unwind after your flight.'
      },
      {
        day: 2,
        destination: 'Kandy Hill Capital',
        title: 'Spice Gardens & Temple of the Tooth',
        hotel: 'Grand Kandyan Hotel or Earl’s Regency',
        meals: 'Breakfast & Dinner',
        description: 'Drive toward royal Kandy. Stop at an aromatic Matale spice garden. In the evening, visit the sacred Temple of the Tooth Relic and enjoy a traditional Kandyan dance & drum performance.'
      },
      {
        day: 3,
        destination: 'Ella Highland Village',
        title: 'Scenic Hill Country Railway to Ella',
        hotel: '98 Acres Resort or Hide Ella',
        meals: 'Breakfast & Dinner',
        description: 'Board the world-famous blue train winding through mist-covered tea plantations, cascading waterfalls, and cloud forests to magical Ella.'
      },
      {
        day: 4,
        destination: 'Yala National Park',
        title: 'Nine Arches Bridge & Wild Safari Adventure',
        hotel: 'Cinnamon Wild Yala or Jetwing Yala',
        meals: 'Breakfast & Dinner',
        description: 'Morning walk to the iconic Nine Arches Bridge. Descend from the highlands to the southern plains of Yala for an afternoon 4x4 leopard and elephant safari.'
      },
      {
        day: 5,
        destination: 'Mirissa Coastal Beach',
        title: 'Galle Heritage Fort & Golden Beach Relaxation',
        hotel: 'Mandara Resort Mirissa or Marriott Weligama',
        meals: 'Breakfast',
        description: 'Drive along the turquoise southern coastline. Explore the UNESCO-listed 17th-century Galle Dutch Fort ramparts and relax on Mirissa’s golden sand beach.'
      },
      {
        day: 6,
        destination: 'Colombo / Airport Departure',
        title: 'Scenic Return & Departure Transfer',
        hotel: 'Departure',
        meals: 'Breakfast',
        description: 'Morning coastal leisure, optional turtle hatchery visit, scenic highway drive to Colombo Airport for your departure flight with unforgettable Sri Lankan memories.'
      }
    ]
  },
  {
    id: '9n-10d-heritage',
    duration: '9 Nights / 10 Days',
    daysCount: 10,
    nightsCount: 9,
    title: 'Heritage, Highlands & Coastal Wonders',
    category: 'extended',
    subtitle: 'From ancient monolithic fortresses and dolphin pods to royal hills and serene southern shores.',
    priceLKR: 'from LKR 690,000 / person',
    priceUSD: 'from $2,250 USD / person',
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=85',
    route: 'Negombo · Kalpitiya · Sigiriya · Kandy · Nuwara Eliya · Ella · Yala · Galle · Colombo',
    highlights: [
      'Kalpitiya Dolphin & Marine Safari',
      'Sigiriya Lion Rock Fortress & Pidurangala',
      'Dambulla Golden Cave Temple',
      'Ceylon Tea Plantation & Colonial Nuwara Eliya',
      'Little Adam’s Peak & Ravana Falls',
      'Yala National Park 4x4 Safari & Galle Fort'
    ],
    inclusions: [
      '9 nights in curated 4-star and 5-star heritage hotels & beach resorts',
      'Private air-conditioned luxury vehicle throughout the tour',
      'Daily breakfast & select dinners at hotel restaurants',
      'All listed sight entrance tickets and private guided tours',
      'Private 4x4 safari jeep in Yala with experienced wildlife ranger'
    ],
    days: [
      {
        day: 1,
        destination: 'Negombo',
        title: 'Arrival & Beachside Relaxation',
        hotel: 'Heritance Negombo',
        meals: 'Dinner',
        description: 'Airport reception and short transfer to your beachfront retreat. Evening tropical cocktail watching the Indian Ocean sunset.'
      },
      {
        day: 2,
        destination: 'Kalpitiya',
        title: 'Coastal Dolphin Watching & Lagoon',
        hotel: 'Pal Palette Kalpitiya',
        meals: 'Breakfast & Dinner',
        description: 'Drive north to Kalpitiya peninsula. Morning boat excursion into the open ocean to witness pods of spinning dolphins playing alongside the boat.'
      },
      {
        day: 3,
        destination: 'Sigiriya Cultural Triangle',
        title: 'Dambulla Rock Cave Temple',
        hotel: 'Aliya Resort & Spa or Heritance Kandalama',
        meals: 'Breakfast & Dinner',
        description: 'Journey east into the Cultural Triangle. Climb to the ancient Dambulla Cave Temple featuring 150+ gilded Buddha statues painted on cavern ceilings.'
      },
      {
        day: 4,
        destination: 'Sigiriya',
        title: 'Lion Rock Fortress & Village Cooking Tour',
        hotel: 'Heritance Kandalama',
        meals: 'Breakfast & Lunch',
        description: 'Early morning ascent of King Kashyapa’s 5th-century Sigiriya Lion Rock Fortress. Afternoon traditional bullock cart ride and authentic village curry lunch.'
      },
      {
        day: 5,
        destination: 'Kandy',
        title: 'Royal Botanical Gardens & Temple of Tooth',
        hotel: 'Earl’s Regency Kandy',
        meals: 'Breakfast & Dinner',
        description: 'Drive through spice hills to Kandy. Visit Peradeniya Royal Botanical Gardens with giant palms and orchids, followed by the sacred Temple of the Tooth Relic.'
      },
      {
        day: 6,
        destination: 'Nuwara Eliya',
        title: 'Little England & Ceylon Tea Estates',
        hotel: 'The Grand Hotel Nuwara Eliya',
        meals: 'Breakfast & Dinner',
        description: 'Ascend into the misty tea mountains. Tour a heritage tea factory, walk through green tea bushes, and stroll around colonial Gregory Lake.'
      },
      {
        day: 7,
        destination: 'Ella',
        title: 'High Altitude Railway & Nine Arches Bridge',
        hotel: '98 Acres Resort Ella',
        meals: 'Breakfast & Dinner',
        description: 'Take the scenic highland train ride to Ella. Hike Little Adam’s Peak and photograph the architectural wonder of the Nine Arches Bridge.'
      },
      {
        day: 8,
        destination: 'Yala',
        title: 'Ravana Falls & Yala Wildlife Safari',
        hotel: 'Cinnamon Wild Yala',
        meals: 'Breakfast & Dinner',
        description: 'Marvel at Ravana Falls before driving to Yala. Late afternoon 4x4 safari exploring block 1 in search of leopards, sloth bears, and wild elephants.'
      },
      {
        day: 9,
        destination: 'Galle Fort & Coast',
        title: 'Historic UNESCO Galle Fort Sunset Walk',
        hotel: 'Le Grand Galle or Radisson Blu Resort',
        meals: 'Breakfast',
        description: 'Drive along the southern coastal road. Explore the colonial Dutch cobblestone streets of Galle Fort, artisan boutiques, and maritime museum.'
      },
      {
        day: 10,
        destination: 'Colombo / Departure',
        title: 'Capital Highlights & Airport Departure',
        hotel: 'Departure',
        meals: 'Breakfast',
        description: 'Scenic drive to Colombo. Brief city tour of Independence Square, Gangaramaya Temple, and transfer to Bandaranaike International Airport.'
      }
    ]
  },
  {
    id: '14n-15d-grand',
    duration: '14 Nights / 15 Days',
    daysCount: 15,
    nightsCount: 14,
    title: 'The Grand Island Expedition',
    category: 'extended',
    subtitle: 'An epic complete odyssey from Jaffna’s northern temples to the surf of Arugam Bay and ancient kingdoms.',
    priceLKR: 'from LKR 1,150,000 / person',
    priceUSD: 'from $3,750 USD / person',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    route: 'Negombo · Kalpitiya · Wilpattu · Jaffna · Anuradhapura · Sigiriya · Kandy · Ella · Arugam Bay · Yala · Mirissa · Galle · Colombo',
    highlights: [
      'Wilpattu Wilderness & Natural Lakes Safari',
      'Jaffna Peninsula, Nallur Kovil & Point Pedro',
      'Ancient UNESCO Anuradhapura Monastic Ruins',
      'Arugam Bay Golden Beaches & Point Break Surf',
      'Yala National Park Wild BBQ Experience',
      'Madu River Mangrove Boat Safari & Galle Fort'
    ],
    inclusions: [
      '14 nights in handpicked luxury resorts, heritage villas & coastal boutique lodges',
      'Dedicated executive vehicle with top-tier licensed Chauffeur-Guide throughout',
      'Daily breakfast, selected lunches, and authentic Sri Lankan dinners',
      '2x National Park Safaris (Wilpattu & Yala) with private 4x4 jeeps',
      'Internal scenic train tickets, boat rides, and site entrance permits'
    ],
    days: [
      {
        day: 1,
        destination: 'Negombo',
        title: 'Arrival in Colombo & Coastal Resort Check-in',
        hotel: 'Jetwing Beach Negombo',
        meals: 'Dinner',
        description: 'Personalized airport greeting and transfer to Negombo.'
      },
      {
        day: 2,
        destination: 'Kalpitiya',
        title: 'Dolphin Watching Ocean Safari',
        hotel: 'Dolphin Beach Resort',
        meals: 'Breakfast & Dinner',
        description: 'Morning boat excursion to view hundreds of spinner dolphins.'
      },
      {
        day: 3,
        destination: 'Wilpattu National Park',
        title: 'Deep Wilderness & Leopard Safari',
        hotel: 'Mahoora Tented Safari Camp',
        meals: 'All Meals Included',
        description: 'Full day safari in Sri Lanka’s largest and oldest national park with natural lakes (villus).'
      },
      {
        day: 4,
        destination: 'Jaffna',
        title: 'Northern Cultural Journey',
        hotel: 'Jetwing Jaffna',
        meals: 'Breakfast & Dinner',
        description: 'Drive along Elephant Pass into the unique cultural landscape of the Tamil north.'
      },
      {
        day: 5,
        destination: 'Jaffna Peninsula',
        title: 'Nallur Kandaswamy Temple & Point Pedro',
        hotel: 'Jetwing Jaffna',
        meals: 'Breakfast & Dinner',
        description: 'Visit the northernmost tip of Sri Lanka at Point Pedro and explore historic Jaffna Fort.'
      },
      {
        day: 6,
        destination: 'Anuradhapura',
        title: 'Sacred Ancient Capital Ruins',
        hotel: 'Ulagalla by Uga Escapes',
        meals: 'Breakfast & Dinner',
        description: 'Explore the 2,500-year-old sacred city, Jaya Sri Maha Bodhi tree, and massive stupas.'
      },
      {
        day: 7,
        destination: 'Sigiriya',
        title: 'Lion Rock & Pidurangala Sunset',
        hotel: 'Heritance Kandalama',
        meals: 'Breakfast & Dinner',
        description: 'Climb the 5th-century rock fortress and witness sunset from Pidurangala.'
      },
      {
        day: 8,
        destination: 'Kandy',
        title: 'Matale Spices & Royal Temple of Tooth',
        hotel: 'The Grand Kandyan',
        meals: 'Breakfast & Dinner',
        description: 'Drive through the central hills with temple visits and evening cultural performances.'
      },
      {
        day: 9,
        destination: 'Ella',
        title: 'World Famous Scenic Train Ride',
        hotel: '98 Acres Resort Ella',
        meals: 'Breakfast & Dinner',
        description: 'Observation deck train journey passing through waterfalls and misty cloud forests.'
      },
      {
        day: 10,
        destination: 'Arugam Bay',
        title: 'East Coast Surf & Dune Sunset',
        hotel: 'Kottukal Beach House by Jetwing',
        meals: 'Breakfast',
        description: 'Cross into the sun-drenched east coast, known for world-class surfing waves and relaxed vibes.'
      },
      {
        day: 11,
        destination: 'Arugam Bay / Pottuvil',
        title: 'Lagoon Safari & Beach Leisure',
        hotel: 'Kottukal Beach House by Jetwing',
        meals: 'Breakfast',
        description: 'Pottuvil lagoon eco-boat tour to spot water monitors, crocodiles, and wild elephants.'
      },
      {
        day: 12,
        destination: 'Yala National Park',
        title: 'Southern Wildlife & Bush BBQ',
        hotel: 'Wild Coast Tented Lodge',
        meals: 'Breakfast & Wild BBQ Dinner',
        description: '4x4 safari with wildlife tracking and an unforgettable beachside bush BBQ under the stars.'
      },
      {
        day: 13,
        destination: 'Mirissa',
        title: 'Southern Beach Coast & Whale Watching',
        hotel: 'Weligama Bay Marriott Resort',
        meals: 'Breakfast',
        description: 'Blue whale watching boat excursion and sunset drinks at Coconut Tree Hill.'
      },
      {
        day: 14,
        destination: 'Galle Dutch Fort',
        title: 'Historic Fort & Coastal Charm',
        hotel: 'Amangalla or Le Grand Galle',
        meals: 'Breakfast & Dinner',
        description: 'Walk the historic ramparts, colonial museums, and relax by the tropical coast.'
      },
      {
        day: 15,
        destination: 'Colombo / Departure',
        title: 'City Highlights & Safe Flight Home',
        hotel: 'Departure',
        meals: 'Breakfast',
        description: 'Final souvenir shopping in Colombo and transfer to the international airport.'
      }
    ]
  }
];

// Day Excursions
const DAY_EXCURSIONS = [
  {
    title: 'Sigiriya & Dambulla Day Excursion',
    duration: 'Full Day (10-12 hrs)',
    departure: 'From Colombo, Negombo or Kandy',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=700&q=80',
    description: 'Scale the 5th-century Lion Rock fortress and explore Dambulla Cave Temple with a private chauffeur-guide.'
  },
  {
    title: 'Galle Fort & Madu River Boat Safari',
    duration: 'Full Day (8-10 hrs)',
    departure: 'From Colombo, Bentota or Galle',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    description: 'Explore the UNESCO 17th-century ramparts, cinnamon islands on Madu River, and sea turtle hatcheries.'
  },
  {
    title: 'Kandy Cultural & Tea Trail Tour',
    duration: 'Full Day (9-11 hrs)',
    departure: 'From Colombo or Negombo',
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=700&q=80',
    description: 'Visit the Sacred Temple of the Tooth Relic, Peradeniya Botanical Gardens, and a heritage Ceylon tea factory.'
  },
  {
    title: 'Yala National Park 4x4 Leopard Safari',
    duration: 'Half Day (4 hrs) or Full Day',
    departure: 'From Yala, Tissamaharama or Hambantota',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=700&q=80',
    description: 'Track leopards, wild elephants, sloth bears, and exotic birds in customized high-clearance 4x4 safari jeeps.'
  }
];

// Filtered tours
const filteredTours = computed(() => {
  return TOUR_PACKAGES.filter(tour => {
    const matchesCategory =
      activeCategoryTab.value === 'all' ||
      tour.category === activeCategoryTab.value ||
      (activeCategoryTab.value === 'classic' && tour.id.includes('classic')) ||
      (activeCategoryTab.value === 'extended' && tour.id.includes('grand'));
    return matchesCategory;
  });
});

// Open Itinerary Modal
const openTourModal = (tour: TourPackage) => {
  selectedTour.value = tour;
  showItineraryModal.value = true;
};

// Select Tour & Scroll to Form
const selectTourForInquiry = (tourId: string) => {
  inquiryForm.value.package_interest = tourId;
  const element = document.getElementById('inquiry-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// Handle Inquiry Submission (POST /api/inquiries via apiClient)
const handleInquirySubmit = async () => {
  submittingInquiry.value = true;
  inquiryError.value = null;
  inquirySuccess.value = false;
  try {
    await apiClient.createInquiry(inquiryForm.value);
    inquirySuccess.value = true;
    inquiryForm.value = {
      full_name: '',
      email: '',
      nationality: 'British',
      arrival_date: '',
      departure_date: '',
      travelers: 2,
      package_interest: 'custom',
      interests: 'Culture, wildlife, beach relaxation',
      message: ''
    };
  } catch (err: unknown) {
    const error = err as Error;
    inquiryError.value = error.message || 'Failed to submit inquiry. Please try again.';
  } finally {
    submittingInquiry.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-600 selection:text-white">
    
    <!-- ==================================================================== -->
    <!-- 1. TOP ANNOUNCEMENT & CONTACT BAR -->
    <!-- ==================================================================== -->
    <div class="bg-emerald-950 border-b border-emerald-900/60 px-4 py-2 text-xs text-emerald-200">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div class="flex items-center gap-4 text-[11px]">
          <span class="flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-emerald-400" />
            <span>L 12, Ceylinco House, Colombo 01, Sri Lanka</span>
          </span>
          <span class="hidden md:flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-emerald-400" />
            <span>24/7 Island Concierge</span>
          </span>
        </div>

        <div class="flex items-center gap-4 text-[11px]">
          <a href="tel:+94743942844" class="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone class="w-3.5 h-3.5 text-emerald-400" />
            <span>+94 74 394 2844</span>
          </a>
          <a href="mailto:info@metshutravels.com" class="flex items-center gap-1.5 hover:text-white transition-colors">
            <Mail class="w-3.5 h-3.5 text-emerald-400" />
            <span>info@metshutravels.com</span>
          </a>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- 2. MAIN HEADER & NAVIGATION -->
    <!-- ==================================================================== -->
    <header class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <!-- Logo -->
        <a href="#home" class="flex items-center gap-3 group">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950 group-hover:scale-105 transition-transform">
            <Compass class="w-6 h-6" />
          </div>
          <div>
            <span class="block font-black text-xl tracking-wider text-white">METSHU</span>
            <span class="block text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">Travels &bull; Sri Lanka</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <a href="#tours" class="hover:text-emerald-400 transition-colors">Tour Packages</a>
          <a href="#excursions" class="hover:text-emerald-400 transition-colors">Day Excursions</a>
          <a href="#fleet" class="hover:text-emerald-400 transition-colors">Private Fleet</a>
          <a href="#why-us" class="hover:text-emerald-400 transition-colors">Why Choose Us</a>
          <a href="#reviews" class="hover:text-emerald-400 transition-colors">Reviews</a>
          <a href="#inquiry-section" class="hover:text-emerald-400 transition-colors">Plan My Trip</a>
        </nav>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3">
          <!-- CRITICAL: Working Operations System Button requested by user -->
          <button
            @click="emit('open-operations')"
            class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-lg shadow-emerald-950 transition-all border border-emerald-400/30 group"
            title="Switch to Serendib / Metshu DMC Operations & Bookings Panel"
          >
            <LayoutDashboard class="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
            <span class="font-mono">DMC Operations</span>
          </button>

          <a
            href="#inquiry-section"
            class="hidden sm:inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-700 transition-colors"
          >
            <span>Book a Tour</span>
            <ArrowRight class="w-3.5 h-3.5 text-emerald-400" />
          </a>
        </div>
      </div>
    </header>

    <!-- ==================================================================== -->
    <!-- 3. HERO SECTION WITH HIGH-IMPACT VISUALS -->
    <!-- ==================================================================== -->
    <section id="home" class="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden">
      <!-- Background Image with Overlay -->
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=90"
        alt="Sri Lanka tropical paradise beach and ocean waves"
        class="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/60"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center sm:text-left z-10 w-full">
        <div class="max-w-3xl space-y-6">
          <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Sri Lanka Tour Operator & DMC</span>
          </div>

          <h1 class="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
            Personalized &amp; Unforgettable Journeys Across <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">Sri Lanka.</span>
          </h1>

          <p class="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            From the misty tea mountains of Nuwara Eliya and Sigiriya’s ancient fortress to Yala’s leopard safaris and pristine southern shores. Thoughtfully crafted with local insight, private luxury transport, and handpicked stays.
          </p>

          <!-- CTAs -->
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#tours"
              class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xl shadow-emerald-950 transition-all hover:scale-[1.02]"
            >
              <span>Explore Tour Packages</span>
              <ArrowRight class="w-4 h-4" />
            </a>

            <button
              @click="emit('open-operations')"
              class="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-emerald-300 font-bold text-sm px-6 py-3.5 rounded-xl border border-emerald-500/40 backdrop-blur transition-all"
            >
              <LayoutDashboard class="w-4 h-4" />
              <span>DMC Staff &amp; Agent System</span>
            </button>
          </div>

          <!-- Feature Badges -->
          <div class="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
            <div class="flex items-center gap-2">
              <Check class="w-4 h-4 text-emerald-400" />
              <span>100% Tailor-Made</span>
            </div>
            <div class="flex items-center gap-2">
              <Check class="w-4 h-4 text-emerald-400" />
              <span>Private Chauffeur</span>
            </div>
            <div class="flex items-center gap-2">
              <Check class="w-4 h-4 text-emerald-400" />
              <span>Direct DMC Rates</span>
            </div>
            <div class="flex items-center gap-2">
              <Check class="w-4 h-4 text-emerald-400" />
              <span>24/7 Island Concierge</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 4. FEATURED MULTI-DAY TOUR PACKAGES (metshutravels.com flagship) -->
    <!-- ==================================================================== -->
    <section id="tours" class="py-20 bg-slate-900/60 border-y border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Curated Itineraries</span>
            <h2 class="text-3xl sm:text-4xl font-black text-white mt-1">Featured Sri Lanka Tour Packages</h2>
            <p class="text-sm text-slate-400 mt-2 max-w-xl">
              All packages include 3-5 star boutique accommodations, private air-conditioned transport, licensed chauffeur-guide, breakfast, and all listed experiences.
            </p>
          </div>

          <!-- Filter Pills -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in [
                { id: 'all', label: 'All Packages' },
                { id: 'classic', label: '5N / 6D Classic' },
                { id: 'extended', label: '9N / 10D & 14N / 15D' }
              ]"
              :key="cat.id"
              @click="activeCategoryTab = cat.id"
              :class="activeCategoryTab === cat.id ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-4 py-2 rounded-lg text-xs transition-colors"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Tours Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <article
            v-for="tour in filteredTours"
            :key="tour.id"
            class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 flex flex-col group shadow-xl"
          >
            <!-- Card Image with Duration Badge -->
            <div class="relative h-60 overflow-hidden">
              <img
                :src="tour.image"
                :alt="tour.title"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <span class="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                {{ tour.duration }}
              </span>
              <div class="absolute bottom-3 left-3 right-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Signature Route</span>
                <p class="text-xs text-white truncate font-medium flex items-center gap-1 mt-0.5">
                  <MapPin class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span class="truncate">{{ tour.route }}</span>
                </p>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-6 flex-1 flex flex-col justify-between space-y-5">
              <div>
                <h3 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {{ tour.title }}
                </h3>
                <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                  {{ tour.subtitle }}
                </p>

                <!-- Highlights List -->
                <div class="mt-4 space-y-1.5">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Package Highlights:</span>
                  <ul class="text-xs text-slate-300 space-y-1">
                    <li v-for="h in tour.highlights.slice(0, 3)" :key="h" class="flex items-start gap-2">
                      <Check class="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{{ h }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Card Pricing and Actions -->
              <div class="pt-4 border-t border-slate-800 space-y-3">
                <div class="flex items-baseline justify-between">
                  <span class="text-[10px] text-slate-500 uppercase font-semibold">Tailor-Made Rates</span>
                  <div class="text-right">
                    <span class="block text-sm font-bold font-mono text-emerald-400">{{ tour.priceLKR }}</span>
                    <span class="block text-[10px] text-slate-400 font-mono">({{ tour.priceUSD }})</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="openTourModal(tour)"
                    class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-lg transition-colors text-center"
                  >
                    View Day Plan
                  </button>
                  <button
                    @click="selectTourForInquiry(tour.id)"
                    class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors text-center shadow-md shadow-emerald-950"
                  >
                    Inquire Now
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 5. DAY EXCURSIONS & SIGNATURE EXPERIENCES -->
    <!-- ==================================================================== -->
    <section id="excursions" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Day Excursions</span>
        <h2 class="text-3xl font-black text-white mt-1">Short Excursions &amp; Day Tours</h2>
        <p class="text-xs text-slate-400 mt-2">
          Private day trips with private chauffeur-guide, pickup from any hotel, entrance fees and return transfer.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="exc in DAY_EXCURSIONS"
          :key="exc.title"
          class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors flex flex-col"
        >
          <div class="h-44 overflow-hidden relative">
            <img :src="exc.image" :alt="exc.title" class="w-full h-full object-cover" />
            <span class="absolute bottom-2 left-2 bg-slate-950/90 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
              {{ exc.duration }}
            </span>
          </div>
          <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h4 class="font-bold text-white text-sm">{{ exc.title }}</h4>
              <p class="text-[11px] text-slate-400 mt-1 line-clamp-3">{{ exc.description }}</p>
            </div>
            <button
              @click="inquiryForm.message = 'I am interested in booking the day excursion: ' + exc.title; selectTourForInquiry('day-tour');"
              class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Ask About Excursion</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 6. FLEET & PRIVATE CHAUFFEUR GUIDES -->
    <!-- ==================================================================== -->
    <section id="fleet" class="py-20 bg-slate-900/40 border-y border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Executive Fleet &amp; Chauffeurs</span>
            <h2 class="text-3xl sm:text-4xl font-black text-white">Travel in Comfort Across the Island</h2>
            <p class="text-sm text-slate-300 leading-relaxed">
              Every Metshu Travels itinerary is operated with our modern private fleet and government-licensed, English-speaking national tourist chauffeur-guides who understand local secrets, wildlife timings, and scenic photo stops.
            </p>

            <div class="space-y-3">
              <div class="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <Car class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 class="text-xs font-bold text-white">Luxury Air-Conditioned Vans (Toyota KDH)</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">High-roof, reclining seats, luggage capacity, onboard cool box and bottled water.</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <Car class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 class="text-xs font-bold text-white">Executive Sedans (Toyota Premio / Allion)</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">Ideal for couples and solo travellers seeking smooth, private touring.</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 class="text-xs font-bold text-white">Certified National Tour Guides</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">Sri Lanka Tourism Development Authority (SLTDA) certified with verified backgrounds.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Fleet Visual Card -->
          <div class="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-2 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1100&q=85"
              alt="Sri Lanka scenic road through lush green hills"
              class="w-full h-80 sm:h-96 object-cover rounded-xl"
            />
            <div class="p-5">
              <div class="flex items-center justify-between text-xs text-slate-300">
                <span class="font-bold text-white">Private Door-to-Door Service</span>
                <span class="text-emerald-400 font-mono">100% Fully Insured</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Airport meet &amp; greet, all parking, highway tolls, and guide accommodations covered.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 7. WHY CHOOSE METSHU TRAVELS -->
    <!-- ==================================================================== -->
    <section id="why-us" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Our Standards</span>
        <h2 class="text-3xl font-black text-white mt-1">Why Travel with Metshu Travels?</h2>
        <p class="text-xs text-slate-400 mt-2">
          Experience Sri Lanka authentically with an established local destination management team.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <HeartHandshake class="w-8 h-8 text-emerald-400" />
          <h3 class="text-base font-bold text-white">Ethical &amp; Sustainable Tourism</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            We actively support local village communities, genuine artisans, and ethical wildlife encounters while strictly avoiding staged animal exploitation.
          </p>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Award class="w-8 h-8 text-emerald-400" />
          <h3 class="text-base font-bold text-white">Direct Local DMC Pricing</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            As an on-the-ground Sri Lankan tour operator, we partner directly with hotels and safari suppliers, guaranteeing premium value without overseas markup.
          </p>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Globe class="w-8 h-8 text-emerald-400" />
          <h3 class="text-base font-bold text-white">24/7 Dedicated Concierge</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            From the moment your plane lands in Colombo until your departure gate, you have a dedicated tour manager reachable on WhatsApp day or night.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 8. REVIEWS & TESTIMONIALS -->
    <!-- ==================================================================== -->
    <section id="reviews" class="py-20 bg-slate-900/60 border-y border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Traveller Reviews</span>
          <h2 class="text-3xl font-black text-white mt-1">What Our Guests Say</h2>
          <div class="flex items-center justify-center gap-1 text-amber-400 mt-2">
            <Star class="w-4 h-4 fill-amber-400" />
            <Star class="w-4 h-4 fill-amber-400" />
            <Star class="w-4 h-4 fill-amber-400" />
            <Star class="w-4 h-4 fill-amber-400" />
            <Star class="w-4 h-4 fill-amber-400" />
            <span class="text-xs text-slate-300 font-bold ml-2">5.0 Star Guest Rating</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <p class="text-xs text-slate-300 italic leading-relaxed">
              "Metshu Travels planned our 10-day trip flawlessly. Our driver-guide Samantha made us feel like family, knew the best viewpoints along the Kandy to Ella railway, and the hotels were outstanding."
            </p>
            <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span class="font-bold text-white">Jonathan &amp; Claire Evans</span>
              <span class="text-slate-500 font-mono">London, UK</span>
            </div>
          </div>

          <div class="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <p class="text-xs text-slate-300 italic leading-relaxed">
              "We saw three leopards in Yala on our morning safari! The team accommodated our vegetarian meals and customized the itinerary when we wanted to stay an extra night in Mirissa. Highly recommended!"
            </p>
            <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span class="font-bold text-white">Markus &amp; Astrid Lind</span>
              <span class="text-slate-500 font-mono">Stockholm, Sweden</span>
            </div>
          </div>

          <div class="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <p class="text-xs text-slate-300 italic leading-relaxed">
              "Traveling as a family with two kids can be stressful, but Metshu Travels took care of every detail. The luxury van was spotless and our guide was wonderful with our children."
            </p>
            <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span class="font-bold text-white">David, Sarah &amp; Kids</span>
              <span class="text-slate-500 font-mono">Sydney, Australia</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 9. INTERACTIVE TRIP CUSTOMIZER & INQUIRY FORM (Connected to REST API) -->
    <!-- ==================================================================== -->
    <section id="inquiry-section" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Left Pitch -->
          <div class="space-y-6">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Direct Local Booking</span>
            <h2 class="text-3xl sm:text-4xl font-black text-white">Plan Your Custom Sri Lanka Journey</h2>
            <p class="text-sm text-slate-300 leading-relaxed">
              Tell us your preferred dates, party size, and travel style. Our Colombo destination team will create a tailor-made proposal and quotation within 24 hours.
            </p>

            <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 text-xs text-slate-300">
              <div class="flex items-center gap-2 text-emerald-400 font-bold">
                <Check class="w-4 h-4" />
                <span>Zero Obligation Quotation</span>
              </div>
              <p class="text-slate-400">
                All itineraries can be customized with boutique villas, special excursions, and dietary preferences.
              </p>
              <div class="pt-2 border-t border-slate-800 flex items-center gap-4 text-[11px] text-slate-400">
                <span>WhatsApp: +94 74 394 2844</span>
                <span>Email: info@metshutravels.com</span>
              </div>
            </div>

            <!-- Operations link badge -->
            <div class="pt-2">
              <p class="text-[11px] text-slate-400 mb-2">Are you a registered overseas agent or DMC staff member?</p>
              <button
                @click="emit('open-operations')"
                class="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors"
              >
                <LayoutDashboard class="w-3.5 h-3.5" />
                <span>Access DMC Operations &amp; Bookings System &rarr;</span>
              </button>
            </div>
          </div>

          <!-- Right Form (Connected to apiClient.createInquiry) -->
          <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 class="text-base font-bold text-white">Trip Inquiry &amp; Quote Request</h3>
            
            <form @submit.prevent="handleInquirySubmit" class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-400 mb-1 font-medium">Full Name</label>
                <input
                  v-model="inquiryForm.full_name"
                  required
                  placeholder="e.g. John Doe"
                  class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    v-model="inquiryForm.email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1 font-medium">Nationality</label>
                  <input
                    v-model="inquiryForm.nationality"
                    required
                    placeholder="e.g. British, German, Australian"
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-slate-400 mb-1 font-medium">Arrival Date</label>
                  <input
                    v-model="inquiryForm.arrival_date"
                    type="date"
                    required
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1 font-medium">Departure Date</label>
                  <input
                    v-model="inquiryForm.departure_date"
                    type="date"
                    required
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1 font-medium">Travellers</label>
                  <input
                    v-model.number="inquiryForm.travelers"
                    type="number"
                    min="1"
                    max="40"
                    required
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Interested Package</label>
                <select
                  v-model="inquiryForm.package_interest"
                  class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                >
                  <option value="custom">Custom Tailor-Made Itinerary</option>
                  <option v-for="t in TOUR_PACKAGES" :key="t.id" :value="t.id">
                    {{ t.duration }} - {{ t.title }}
                  </option>
                  <option value="day-tour">Day Excursion / Safari Only</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Your Travel Interests &amp; Notes</label>
                <textarea
                  v-model="inquiryForm.message"
                  required
                  rows="3"
                  placeholder="Tell us about hotel preferences (4-star / luxury), preferred pace, must-see places, or children's ages..."
                  class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none resize-none"
                ></textarea>
              </div>

              <!-- Status Messages -->
              <div v-if="inquirySuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
                <Check class="w-4 h-4" />
                <span>Thank you! Your trip inquiry has been received. Our team will contact you shortly.</span>
              </div>

              <div v-if="inquiryError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
                {{ inquiryError }}
              </div>

              <button
                type="submit"
                :disabled="submittingInquiry"
                class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send class="w-4 h-4" />
                <span>{{ submittingInquiry ? 'Sending Your Inquiry...' : 'Submit Trip Inquiry' }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 10. FOOTER -->
    <!-- ==================================================================== -->
    <footer class="bg-slate-950 border-t border-slate-800 pt-16 pb-12 text-slate-400 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Col 1: Brand & Bio -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-white">
            <Compass class="w-6 h-6 text-emerald-400" />
            <span class="font-black text-lg">METSHU TRAVELS</span>
          </div>
          <p class="text-xs leading-relaxed text-slate-400">
            Specializing in personalized and unforgettable journeys across Sri Lanka with expert travel planning and local insight.
          </p>
          <p class="text-[11px] text-slate-500">
            Colombo, Sri Lanka &bull; Registered Tour Operator
          </p>
        </div>

        <!-- Col 2: Multi-Day Packages -->
        <div class="space-y-3">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider">Tour Circuits</h4>
          <ul class="space-y-2">
            <li><a href="#tours" class="hover:text-emerald-400 transition-colors">5N/6D Island in Miniature</a></li>
            <li><a href="#tours" class="hover:text-emerald-400 transition-colors">9N/10D Heritage to Highlands</a></li>
            <li><a href="#tours" class="hover:text-emerald-400 transition-colors">14N/15D Grand Expedition</a></li>
            <li><a href="#excursions" class="hover:text-emerald-400 transition-colors">Day Excursions & Safaris</a></li>
          </ul>
        </div>

        <!-- Col 3: Contact Info -->
        <div class="space-y-3">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider">Office Colombo</h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-2">
              <MapPin class="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>L 12, Ceylinco House, Colombo 01, Sri Lanka</span>
            </li>
            <li class="flex items-center gap-2">
              <Phone class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <a href="tel:+94743942844" class="hover:text-white">+94 74 394 2844</a>
            </li>
            <li class="flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <a href="mailto:info@metshutravels.com" class="hover:text-white">info@metshutravels.com</a>
            </li>
          </ul>
        </div>

        <!-- Col 4: Operations & System Access -->
        <div class="space-y-3">
          <h4 class="font-bold text-white text-xs uppercase tracking-wider">Operations &amp; Agents</h4>
          <p class="text-xs text-slate-400">
            Access our back-office DMC reservation system, overseas agent portals, and live REST API endpoints.
          </p>
          <button
            @click="emit('open-operations')"
            class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-emerald-950 transition-colors"
          >
            <LayoutDashboard class="w-3.5 h-3.5" />
            <span>Launch Operations Portal</span>
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <span>&copy; 2026 Metshu Travels (Pvt) Ltd. All rights reserved.</span>
        <span>Registered Destination Management Company (DMC) &bull; Sri Lanka Tourism</span>
      </div>
    </footer>

    <!-- ==================================================================== -->
    <!-- 11. DAY-BY-DAY ITINERARY MODAL -->
    <!-- ==================================================================== -->
    <div v-if="showItineraryModal && selectedTour" class="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded">
                {{ selectedTour.duration }}
              </span>
              <span class="text-slate-400 text-xs font-mono">{{ selectedTour.priceLKR }}</span>
            </div>
            <h3 class="text-lg font-bold text-white mt-1">{{ selectedTour.title }}</h3>
          </div>
          <button @click="showItineraryModal = false" class="text-slate-400 hover:text-white p-2">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Itinerary Days List -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div
            v-for="d in selectedTour.days"
            :key="d.day"
            class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-emerald-400">Day {{ d.day }}: {{ d.destination }}</span>
              <span class="text-[10px] text-slate-500 font-mono">{{ d.meals }}</span>
            </div>
            <h4 class="font-bold text-white text-xs">{{ d.title }}</h4>
            <p class="text-xs text-slate-300 leading-relaxed">{{ d.description }}</p>
            <p class="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-900">
              <span class="text-slate-500">Accommodation:</span> {{ d.hotel }}
            </p>
          </div>

          <!-- Inclusions -->
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 class="font-bold text-white text-xs">Package Inclusions:</h4>
            <ul class="text-xs text-slate-300 space-y-1">
              <li v-for="inc in selectedTour.inclusions" :key="inc" class="flex items-start gap-2">
                <Check class="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{{ inc }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <button
            @click="showItineraryModal = false"
            class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg"
          >
            Close
          </button>
          <button
            @click="showItineraryModal = false; selectTourForInquiry(selectedTour.id);"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-emerald-950"
          >
            Book This Itinerary
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- 12. FLOATING WHATSAPP & QUICK INQUIRY CHAT BUTTON -->
    <!-- ==================================================================== -->
    <a
      href="https://wa.me/94743942844?text=Hello%20Metshu%20Travels,%20I%20would%20like%20to%20inquire%20about%20a%20tour%20package."
      target="_blank"
      rel="noopener noreferrer"
      class="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-2xl shadow-emerald-950 hover:scale-110 transition-all flex items-center justify-center group"
      title="Chat directly with Metshu Travels on WhatsApp (+94 74 394 2844)"
    >
      <MessageCircle class="w-6 h-6" />
      <span class="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
        Chat on WhatsApp
      </span>
    </a>

  </div>
</template>
