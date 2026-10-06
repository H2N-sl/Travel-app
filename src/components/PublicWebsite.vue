<script setup lang="ts">
/**
 * ==============================================================================
 * METSHU TRAVELS - PUBLIC WEBSITE FRONTEND (metshutravels.com design & features)
 * ==============================================================================
 * 
 * 🔰 FEATURES & ARCHITECTURE INTEGRATION:
 * 1. WHITELABEL BRANDING: Consumes `useCompany()` to dynamically display company name,
 *    tagline, contact numbers, email, physical office address, and SLTDA license.
 * 2. DYNAMIC ASSET IMAGES: Consumes `useImages()` with automatic fallback handling
 *    (@error="handleImageError($event, ...)") for hero, tours, excursions, fleet, and gallery.
 * 3. DUAL-THEME SUPPORT: Supports both Light & Dark modes smoothly via Tailwind classes
 *    and includes the `<ThemeToggle />` component in the announcement bar and header.
 * 4. 6-STAGE DMC CONNECTION: Direct button to switch to the Operations Portal and
 *    inquiry form directly hooked to the REST API (`apiClient.createInquiry`).
 * ==============================================================================
 */

import { ref, computed } from 'vue';
import { apiClient, type NewInquiry } from '../services/api';
import { useCompany } from '../composables/useCompany';
import { useImages } from '../composables/useImages';
import { useTheme } from '../composables/useTheme';
import ThemeToggle from './ThemeToggle.vue';

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
  MessageCircle,
  ExternalLink
} from 'lucide-vue-next';

// ------------------------------------------------------------------------------
// 1. COMPOSABLES INTEGRATION
// ------------------------------------------------------------------------------
const { company } = useCompany();
const { images, handleImageError } = useImages();
const { isDark } = useTheme();

// Emit event to switch to DMC Operations System in parent App.vue
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
// 2. TOUR PACKAGES DATA (Connected to dynamic image paths)
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
  fallbackImage: string;
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

const TOUR_PACKAGES = computed<TourPackage[]>(() => [
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
    image: images.tours.miniature.src,
    fallbackImage: images.tours.miniature.fallback,
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
        description: 'Airport greeting by your dedicated chauffeur-guide. Transfer to your coastal beach hotel to unwind after your flight.'
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
        description: 'Morning coastal leisure, optional turtle hatchery visit, scenic highway drive to Colombo Airport for your departure flight with unforgettable memories.'
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
    image: images.tours.heritage.src,
    fallbackImage: images.tours.heritage.fallback,
    route: 'Negombo · Kalpitiya · Sigiriya · Kandy · Nuwara Eliya · Ella · Yala · Galle · Colombo',
    highlights: [
      'Kalpitiya Dolphin & Marine Safari',
      'Sigiriya 5th Century Lion Rock Fortress climb',
      'Dambulla Golden Cave Temple UNESCO Site',
      'Pedro Tea Estate & Nanu Oya scenic train',
      'Full Day Yala Leopard & Sloth Bear Safari',
      'Historic 17th-century Galle Dutch Fort'
    ],
    inclusions: [
      '9 nights in handpicked heritage hotels & boutique hillside tea lodges',
      'Private air-conditioned luxury vehicle throughout the tour',
      'Certified English/German/French speaking chauffeur-guide',
      'All safari jeeps, national park permits, and boat excursion tickets',
      'Complimentary airport concierge meet & greet with fresh orchid garlands'
    ],
    days: [
      {
        day: 1,
        destination: 'Negombo Coastal Town',
        title: 'Ayubowan & Coastal Arrival',
        hotel: 'Heritance Negombo',
        meals: 'Dinner included',
        description: 'Arrival at Colombo Airport (CMB). Paging greeting by chauffeur guide, short transfer to beachfront hotel.'
      },
      {
        day: 2,
        destination: 'Kalpitiya Peninsula',
        title: 'Ocean Marine & Dolphin Pod Watching',
        hotel: 'Dolphin Beach Resort Kalpitiya',
        meals: 'Breakfast & Dinner',
        description: 'Early morning boat excursion into the Indian Ocean to witness hundreds of spinner dolphins dancing alongside the boat.'
      },
      {
        day: 3,
        destination: 'Sigiriya Cultural Triangle',
        title: 'Dambulla Rock Cave Temple Monastery',
        hotel: 'Heritance Kandalama',
        meals: 'Breakfast & Dinner',
        description: 'Drive inland toward the ancient Cultural Triangle. Explore the spectacular cave shrines of Dambulla containing ancient Buddhist murals.'
      },
      {
        day: 4,
        destination: 'Sigiriya / Polonnaruwa',
        title: 'Lion Rock Fortress & Ancient Medieval Ruins',
        hotel: 'Heritance Kandalama',
        meals: 'Breakfast & Dinner',
        description: 'Ascend the dramatic 5th-century rock fortress of King Kashyapa before the midday sun. Afternoon bicycle tour among ancient Polonnaruwa palaces.'
      },
      {
        day: 5,
        destination: 'Kandy Royal Hill City',
        title: 'Matale Spice Farm & Temple of the Tooth',
        hotel: 'Earl’s Regency Kandy',
        meals: 'Breakfast & Dinner',
        description: 'Scenic drive to Kandy, stopping at an organic spice plantation. Evening visit to the Sacred Tooth Relic Temple during evening puja ceremony.'
      },
      {
        day: 6,
        destination: 'Nuwara Eliya Hill Station',
        title: 'Ramboda Falls & Ceylon Tea Estate Trails',
        hotel: 'Grand Hotel Nuwara Eliya',
        meals: 'Breakfast & Dinner',
        description: 'Ascend through dramatic waterfalls into the mist-draped hill country. Tour a working tea factory and taste authentic pure Ceylon Pekoe tea.'
      },
      {
        day: 7,
        destination: 'Ella Highland Village',
        title: 'Scenic Observation Train & Little Adam’s Peak',
        hotel: '98 Acres Resort Ella',
        meals: 'Breakfast & Dinner',
        description: 'Board the iconic blue hill country train across gorges and pine forests to Ella. Sunset hike up Little Adam’s Peak overlooking Ella Gap.'
      },
      {
        day: 8,
        destination: 'Yala National Park',
        title: 'Rawana Falls & Afternoon 4x4 Leopard Safari',
        hotel: 'Cinnamon Wild Yala',
        meals: 'Breakfast & Dinner',
        description: 'Stop at cascading Rawana Falls before heading to the southern plains. Afternoon game drive in Yala to spot leopards, elephants, and crocodiles.'
      },
      {
        day: 9,
        destination: 'Galle Coastal Fort',
        title: 'Stilt Fishermen & UNESCO Dutch Fort Walk',
        hotel: 'Le Grand Galle or Amangalla',
        meals: 'Breakfast',
        description: 'Drive along the southern shoreline, observing traditional stilt fishermen. Walking tour of 17th-century cobblestone alleys, lighthouse, and art galleries.'
      },
      {
        day: 10,
        destination: 'Colombo Airport Departure',
        title: 'Coastal Highway Transfer & Safe Journey Home',
        hotel: 'Departure',
        meals: 'Breakfast',
        description: 'Southern Expressway transfer to Colombo International Airport for your departure flight.'
      }
    ]
  },
  {
    id: '14n-15d-grand',
    duration: '14 Nights / 15 Days',
    daysCount: 15,
    nightsCount: 14,
    title: 'Grand All-Island Discovery Circuit',
    category: 'extended',
    subtitle: 'The definitive Sri Lanka expedition covering the northern peninsula, east coast surf, misty hills, wildlife and south.',
    priceLKR: 'from LKR 1,180,000 / person',
    priceUSD: 'from $3,850 USD / person',
    image: images.tours.grand.src,
    fallbackImage: images.tours.grand.fallback,
    route: 'Colombo · Wilpattu · Jaffna · Trincomalee · Sigiriya · Kandy · Ella · Arugam Bay · Yala · Galle · Colombo',
    highlights: [
      'Wilpattu National Park Private Safari',
      'Jaffna Peninsula & Nallur Kandaswamy Kovil',
      'Trincomalee Pigeon Island Coral Snorkeling',
      'Sigiriya & Pidurangala Sunrise Viewpoint',
      'Kandy Esala & Botanical Gardens',
      'Arugam Bay East Coast Surfing Vibe',
      'Wild Coast Tented Safari & Beach BBQ'
    ],
    inclusions: [
      '14 nights in Sri Lanka’s premier 5-star boutique hotels & eco-lodges',
      'Private dedicated luxury vehicle & chauffeur guide for all 15 days',
      'Internal scenic train tickets & marine boat charters',
      'All national park safari jeeps, trackers, and admissions included',
      'Complimentary 24/7 concierge support hotline across the island'
    ],
    days: [
      {
        day: 1,
        destination: 'Colombo / Negombo',
        title: 'Airport VIP Arrival & Refreshment',
        hotel: 'The Wallawwa Boutique Hotel',
        meals: 'Dinner included',
        description: 'VIP airport arrival greeting and relaxation at a historic colonial manor house surrounded by tropical gardens.'
      },
      {
        day: 2,
        destination: 'Wilpattu National Park',
        title: 'Ancient Villu Lakes & Wilderness Safari',
        hotel: 'Mahoora Tented Safari Camp',
        meals: 'Breakfast & Dinner',
        description: 'Explore Sri Lanka’s largest and oldest national park, characterized by natural rainwater lakes (villus).'
      },
      {
        day: 3,
        destination: 'Anuradhapura',
        title: 'Ancient Sacred Capital & Monasteries',
        hotel: 'Ulagalla by Uga Escapes',
        meals: 'Breakfast & Dinner',
        description: 'Visit the 2,500-year-old sacred city, Jaya Sri Maha Bodhi tree, and towering stupas.'
      },
      {
        day: 4,
        destination: 'Jaffna',
        title: 'Northern Cultural Journey',
        hotel: 'Jetwing Jaffna',
        meals: 'Breakfast & Dinner',
        description: 'Drive along Elephant Pass into the distinctive cultural landscape and culinary traditions of the Tamil north.'
      },
      {
        day: 5,
        destination: 'Jaffna Peninsula',
        title: 'Nallur Kandaswamy Temple & Point Pedro',
        hotel: 'Jetwing Jaffna',
        meals: 'Breakfast & Dinner',
        description: 'Visit the northernmost tip of Sri Lanka at Point Pedro and explore historic Jaffna Fort and Nallur Kovil.'
      },
      {
        day: 6,
        destination: 'Trincomalee',
        title: 'East Coast Beaches & Koneswaram Temple',
        hotel: 'Trinco Blu by Cinnamon',
        meals: 'Breakfast & Dinner',
        description: 'Cross to the northeastern coastline. Visit the cliffside Koneswaram Temple overlooking the Indian Ocean.'
      },
      {
        day: 7,
        destination: 'Sigiriya',
        title: 'Lion Rock & Pidurangala Sunset',
        hotel: 'Heritance Kandalama',
        meals: 'Breakfast & Dinner',
        description: 'Climb the 5th-century rock fortress and witness sunset from the summit of Pidurangala rock.'
      },
      {
        day: 8,
        destination: 'Kandy',
        title: 'Matale Spices & Royal Temple of Tooth',
        hotel: 'The Grand Kandyan',
        meals: 'Breakfast & Dinner',
        description: 'Drive through the central hills with temple visits and evening cultural drum performances.'
      },
      {
        day: 9,
        destination: 'Ella',
        title: 'World Famous Scenic Train Ride',
        hotel: '98 Acres Resort Ella',
        meals: 'Breakfast & Dinner',
        description: 'Observation deck train journey passing through tea plantations, waterfalls, and mist-veiled cloud forests.'
      },
      {
        day: 10,
        destination: 'Arugam Bay',
        title: 'East Coast Surf & Dune Sunset',
        hotel: 'Kottukal Beach House by Jetwing',
        meals: 'Breakfast',
        description: 'Cross into the sun-drenched east coast, known for world-class surfing waves and relaxed bohemian atmosphere.'
      },
      {
        day: 11,
        destination: 'Arugam Bay / Pottuvil',
        title: 'Lagoon Safari & Beach Leisure',
        hotel: 'Kottukal Beach House by Jetwing',
        meals: 'Breakfast',
        description: 'Pottuvil lagoon eco-boat tour to spot water monitors, crocodiles, and wild bathing elephants.'
      },
      {
        day: 12,
        destination: 'Yala National Park',
        title: 'Southern Wildlife & Bush BBQ',
        hotel: 'Wild Coast Tented Lodge',
        meals: 'Breakfast & Wild BBQ Dinner',
        description: '4x4 safari with wildlife tracking and an unforgettable beachside bush BBQ under the star-studded southern sky.'
      },
      {
        day: 13,
        destination: 'Mirissa',
        title: 'Southern Beach Coast & Whale Watching',
        hotel: 'Weligama Bay Marriott Resort',
        meals: 'Breakfast',
        description: 'Blue whale watching boat excursion and sunset cocktails at Coconut Tree Hill.'
      },
      {
        day: 14,
        destination: 'Galle Dutch Fort',
        title: 'Historic Fort & Coastal Charm',
        hotel: 'Amangalla or Le Grand Galle',
        meals: 'Breakfast & Dinner',
        description: 'Walk the historic ramparts, colonial museums, and relax by the tropical turquoise coast.'
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
]);

// ------------------------------------------------------------------------------
// 3. DAY EXCURSIONS (Dynamic image assets)
// ------------------------------------------------------------------------------
const DAY_EXCURSIONS = computed(() => [
  {
    title: 'Sigiriya & Dambulla Day Excursion',
    duration: 'Full Day (10-12 hrs)',
    departure: 'From Colombo, Negombo or Kandy',
    image: images.excursions.sigiriya.src,
    fallback: images.excursions.sigiriya.fallback,
    description: 'Scale the 5th-century Lion Rock fortress and explore Dambulla Cave Temple with a private chauffeur-guide.'
  },
  {
    title: 'Galle Fort & Madu River Boat Safari',
    duration: 'Full Day (8-10 hrs)',
    departure: 'From Colombo, Bentota or Galle',
    image: images.excursions.galle.src,
    fallback: images.excursions.galle.fallback,
    description: 'Explore the UNESCO 17th-century ramparts, cinnamon islands on Madu River, and sea turtle hatcheries.'
  },
  {
    title: 'Kandy Cultural & Tea Trail Tour',
    duration: 'Full Day (9-11 hrs)',
    departure: 'From Colombo or Negombo',
    image: images.excursions.kandy.src,
    fallback: images.excursions.kandy.fallback,
    description: 'Visit the Sacred Temple of the Tooth Relic, Peradeniya Botanical Gardens, and a heritage Ceylon tea factory.'
  },
  {
    title: 'Yala National Park 4x4 Leopard Safari',
    duration: 'Half Day (4 hrs) or Full Day',
    departure: 'From Yala, Tissamaharama or Hambantota',
    image: images.excursions.yala.src,
    fallback: images.excursions.yala.fallback,
    description: 'Track leopards, wild elephants, sloth bears, and exotic birds in customized high-clearance 4x4 safari jeeps.'
  }
]);

// ------------------------------------------------------------------------------
// 4. PRIVATE LUXURY FLEET (Dynamic image assets)
// ------------------------------------------------------------------------------
const FLEET_VEHICLES = computed(() => [
  {
    name: 'Toyota KDH Luxury High-Roof Van',
    capacity: '2 - 7 Guests + Luggage',
    features: ['High-Roof Dual AC', 'Reclining Luxury Seats', 'Complimentary WiFi & Cool Box', 'USB Charging Ports'],
    image: images.fleet.kdhVan.src,
    fallback: images.fleet.kdhVan.fallback,
    description: 'Our most popular touring vehicle for couples and families across Sri Lanka circuits.'
  },
  {
    name: 'Executive Touring Sedan (Premio / Allion)',
    capacity: '1 - 3 Guests + Luggage',
    features: ['Climate Control AC', 'Plush Leather Interior', 'Smooth Ride Suspension', 'Ideal for Couples'],
    image: images.fleet.sedan.src,
    fallback: images.fleet.sedan.fallback,
    description: 'Refined comfort for solo travelers, couples, and executive business travelers.'
  },
  {
    name: 'Toyota Coaster Luxury Tourist Coach',
    capacity: '8 - 18 Guests + Luggage',
    features: ['Panoramic View Windows', 'Full PA Audio System', 'Spacious Legroom', 'Dedicated Luggage Bay'],
    image: images.fleet.miniCoach.src,
    fallback: images.fleet.miniCoach.fallback,
    description: 'Designed for small groups, university tours, and extended family expeditions.'
  },
  {
    name: 'Toyota Land Cruiser Prado 4x4',
    capacity: '1 - 4 Guests + Gear',
    features: ['All-Terrain 4WD', 'High Ground Clearance', 'Leather Interior', 'Wilderness & Hill Roads'],
    image: images.fleet.suv.src,
    fallback: images.fleet.suv.fallback,
    description: 'Premium adventure transport for wildlife photographers and luxury safari travelers.'
  }
]);

// Filtered tours computed
const filteredTours = computed(() => {
  return TOUR_PACKAGES.value.filter(tour => {
    return (
      activeCategoryTab.value === 'all' ||
      tour.category === activeCategoryTab.value ||
      (activeCategoryTab.value === 'classic' && tour.id.includes('classic')) ||
      (activeCategoryTab.value === 'extended' && tour.id.includes('grand'))
    );
  });
});

// Modal helpers
const openTourModal = (tour: TourPackage) => {
  selectedTour.value = tour;
  showItineraryModal.value = true;
};

const selectTourForInquiry = (tourId: string) => {
  inquiryForm.value.package_interest = tourId;
  const element = document.getElementById('inquiry-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// Handle Inquiry Submission
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
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-300">
    
    <!-- ==================================================================== -->
    <!-- 1. TOP ANNOUNCEMENT & CONTACT BAR -->
    <!-- ==================================================================== -->
    <div class="bg-emerald-900/90 dark:bg-emerald-950 border-b border-emerald-800/60 dark:border-emerald-900/60 px-4 py-2 text-xs text-emerald-100 dark:text-emerald-200 transition-colors">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div class="flex items-center gap-4 text-[11px]">
          <span class="flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-emerald-300" />
            <!-- Dynamic Whitelabel Address -->
            <span>{{ company.contact.address }}, {{ company.contact.country }}</span>
          </span>
          <span class="hidden md:flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-emerald-300" />
            <!-- Dynamic Operating Hours -->
            <span>{{ company.contact.operatingHours }}</span>
          </span>
        </div>

        <div class="flex items-center gap-4 text-[11px]">
          <!-- Dynamic Direct Phone -->
          <a :href="'tel:' + company.contact.phoneRaw" class="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone class="w-3.5 h-3.5 text-emerald-300" />
            <span>{{ company.contact.phone }}</span>
          </a>

          <!-- Dynamic Email -->
          <a :href="'mailto:' + company.contact.email" class="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors">
            <Mail class="w-3.5 h-3.5 text-emerald-300" />
            <span>{{ company.contact.email }}</span>
          </a>

          <!-- Accessible Theme Toggle in Top Bar -->
          <div class="border-l border-emerald-700/60 pl-3">
            <ThemeToggle compact />
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- 2. MAIN HEADER & NAVIGATION -->
    <!-- ==================================================================== -->
    <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Whitelabel Brand Logo -->
        <a href="#home" class="flex items-center gap-3 group">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <Compass class="w-6 h-6" />
          </div>
          <div>
            <span class="block font-black text-xl tracking-wider text-slate-900 dark:text-white uppercase">{{ company.shortName }}</span>
            <span class="block text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">Travels &bull; Sri Lanka</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <a href="#tours" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Tour Packages</a>
          <a href="#excursions" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Day Excursions</a>
          <a href="#fleet" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Private Fleet</a>
          <a href="#gallery" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Highlights</a>
          <a href="#why-us" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Why Choose Us</a>
          <a href="#inquiry-section" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Plan My Trip</a>
        </nav>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5">
          <!-- Accessible Theme Toggle in Header -->
          <ThemeToggle />

          <!-- Working DMC Operations System Button -->
          <button
            @click="emit('open-operations')"
            class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-md shadow-emerald-950/20 transition-all border border-emerald-400/30 group"
            title="Switch to DMC Operations & Bookings Panel"
          >
            <LayoutDashboard class="w-4 h-4 text-emerald-100 group-hover:rotate-12 transition-transform" />
            <span class="font-mono hidden sm:inline">DMC Operations</span>
          </button>

          <a
            href="#inquiry-section"
            class="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <span>Book a Tour</span>
            <ArrowRight class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </a>
        </div>
      </div>
    </header>

    <!-- ==================================================================== -->
    <!-- 3. HERO SECTION (Dynamic Hero Image & Whitelabel Branding) -->
    <!-- ==================================================================== -->
    <section id="home" class="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden">
      <!-- Background Image with Central Fallback Handling -->
      <img
        :src="images.hero.main.src"
        :alt="images.hero.main.alt"
        @error="handleImageError($event, images.hero.main.fallback)"
        class="absolute inset-0 w-full h-full object-cover object-center"
      />
      <!-- Adaptive Dark/Light Overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/60"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center sm:text-left z-10 w-full">
        <div class="max-w-3xl space-y-6">
          <div class="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <Sparkles class="w-3.5 h-3.5" />
            <!-- Dynamic Subtitle -->
            <span>{{ company.subTagline }} &bull; SLTDA Certified DMC</span>
          </div>

          <!-- Dynamic Main Tagline -->
          <h1 class="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
            Personalized &amp; Unforgettable Journeys Across <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">Sri Lanka.</span>
          </h1>

          <!-- Dynamic Company Description -->
          <p class="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
            {{ company.description }}
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
          <div class="pt-8 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-200">
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
    <!-- 4. FEATURED TOUR PACKAGES (metshutravels.com flagship) -->
    <!-- ==================================================================== -->
    <section id="tours" class="py-20 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Curated Itineraries</span>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">Featured Sri Lanka Tour Packages</h2>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
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
              :class="activeCategoryTab === cat.id ? 'bg-emerald-600 text-white font-bold' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'"
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
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/60 transition-all duration-300 flex flex-col group shadow-lg dark:shadow-xl"
          >
            <!-- Card Image with Dynamic Fallback & Duration Badge -->
            <div class="relative h-60 overflow-hidden bg-slate-800">
              <img
                :src="tour.image"
                :alt="tour.title"
                @error="handleImageError($event, tour.fallbackImage)"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
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
                <h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {{ tour.title }}
                </h3>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {{ tour.subtitle }}
                </p>

                <!-- Highlights List -->
                <div class="mt-4 space-y-1.5">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Package Highlights:</span>
                  <ul class="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <li v-for="h in tour.highlights.slice(0, 3)" :key="h" class="flex items-start gap-2">
                      <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{{ h }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Card Pricing and Actions -->
              <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div class="flex items-baseline justify-between">
                  <span class="text-[10px] text-slate-500 uppercase font-semibold">Tailor-Made Rates</span>
                  <div class="text-right">
                    <span class="block text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ tour.priceLKR }}</span>
                    <span class="block text-[10px] text-slate-500 font-mono">({{ tour.priceUSD }})</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="openTourModal(tour)"
                    class="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold py-2.5 rounded-lg transition-colors text-center"
                  >
                    View Day Plan
                  </button>
                  <button
                    @click="selectTourForInquiry(tour.id)"
                    class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors text-center shadow-md shadow-emerald-950/20"
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
    <!-- 5. DAY EXCURSIONS SECTION (Dynamic Image Assets) -->
    <!-- ==================================================================== -->
    <section id="excursions" class="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Day Trips &amp; Safaris</span>
          <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">Signature Sri Lanka Day Excursions</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Short on time? Join our private full-day &amp; half-day excursions with hotel pickup, luxury vehicle, admissions, and personal chauffeur-guide.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="exc in DAY_EXCURSIONS"
            :key="exc.title"
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col group shadow-md"
          >
            <div class="relative h-44 overflow-hidden bg-slate-800">
              <img
                :src="exc.image"
                :alt="exc.title"
                @error="handleImageError($event, exc.fallback)"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span class="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                {{ exc.duration }}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {{ exc.title }}
                </h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {{ exc.description }}
                </p>
              </div>
              <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span class="text-slate-500">{{ exc.departure }}</span>
                <button
                  @click="selectTourForInquiry(exc.title)"
                  class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Book Trip &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 6. SCENIC GALLERY / HIGHLIGHTS (Dynamic useImages().gallery) -->
    <!-- ==================================================================== -->
    <section id="gallery" class="py-20 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Visual Journey</span>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">Sri Lanka Highlights Gallery</h2>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              Captivating destinations you will discover on our private circuits across paradise island.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="item in images.gallery"
            :key="item.id"
            class="group relative h-64 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-800"
          >
            <img
              :src="item.src"
              :alt="item.alt"
              @error="handleImageError($event, item.fallback)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
            <div class="absolute bottom-4 left-4 right-4">
              <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{{ item.region }}</span>
              <h3 class="text-base font-bold text-white mt-0.5">{{ item.title }}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 7. PRIVATE LUXURY FLEET & CERTIFIED DRIVER GUIDES -->
    <!-- ==================================================================== -->
    <section id="fleet" class="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Executive Transport</span>
          <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">Private Luxury Vehicle Fleet</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Every journey with {{ company.name }} includes a private air-conditioned vehicle and an accredited Sri Lanka Tourist Board chauffeur-guide.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="v in FLEET_VEHICLES"
            :key="v.name"
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-md"
          >
            <div class="relative h-44 overflow-hidden bg-slate-800">
              <img
                :src="v.image"
                :alt="v.name"
                @error="handleImageError($event, v.fallback)"
                class="w-full h-full object-cover"
              />
              <span class="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {{ v.capacity }}
              </span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">{{ v.name }}</h4>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{{ v.description }}</p>
                <ul class="mt-3 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <li v-for="feat in v.features" :key="feat" class="flex items-center gap-1.5">
                    <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{{ feat }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 8. WHY CHOOSE METSHU TRAVELS & SUSTAINABILITY -->
    <!-- ==================================================================== -->
    <section id="why-us" class="py-20 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Authentic Island Hospitality</span>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              Why Discerning Travelers Choose <span class="text-emerald-600 dark:text-emerald-400">{{ company.name }}</span>
            </h2>
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              We are not just a booking portal; we are a fully accredited Destination Management Company headquartered at {{ company.contact.address }}. Our team lives and breathes Sri Lanka.
            </p>

            <div class="space-y-4 pt-2">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white">SLTDA Certified &amp; Fully Insured</h4>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">Official tourism license {{ company.licenseNumber }} with comprehensive passenger liability protection.</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <HeartHandshake class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white">Direct Wholesale DMC Rates</h4>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">No middleman markups. Direct contracts with top boutique hotels, safari camps, and transport fleet.</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Award class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white">24/7 Island Concierge</h4>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">Direct contact with your dedicated travel manager before, during, and after your trip.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Testimonial Highlights -->
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
            <div class="flex items-center gap-1 text-amber-400">
              <Star class="w-5 h-5 fill-amber-400" />
              <Star class="w-5 h-5 fill-amber-400" />
              <Star class="w-5 h-5 fill-amber-400" />
              <Star class="w-5 h-5 fill-amber-400" />
              <Star class="w-5 h-5 fill-amber-400" />
              <span class="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">4.9 / 5.0 (280+ Reviews)</span>
            </div>

            <blockquote class="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
              &ldquo;Our 10-day tour with {{ company.name }} exceeded every expectation. Our chauffeur Samantha was courteous, incredibly knowledgeable about wildlife, and ensured we always felt safe. A truly 5-star experience from airport arrival to departure.&rdquo;
            </blockquote>

            <div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p class="font-bold text-slate-900 dark:text-white">David &amp; Sarah Jenkins</p>
                <p class="text-[11px] text-slate-500">London, United Kingdom</p>
              </div>
              <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Verified Guest Tour</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================== -->
    <!-- 9. CUSTOM TOUR BUILDER & INQUIRY FORM (Connected to REST API) -->
    <!-- ==================================================================== -->
    <section id="inquiry-section" class="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left Info Column -->
            <div class="space-y-6">
              <div>
                <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Get in Touch</span>
                <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-1">Plan Your Dream Sri Lanka Tour</h3>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Fill in your travel preferences and our travel consultants will craft a customized itinerary and quote within 24 hours.
                </p>
              </div>

              <div class="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div class="flex items-start gap-2.5">
                  <MapPin class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{{ company.contact.address }}</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <Phone class="w-4 h-4 text-emerald-500 shrink-0" />
                  <a :href="'tel:' + company.contact.phoneRaw" class="hover:underline font-semibold">{{ company.contact.phone }}</a>
                </div>
                <div class="flex items-center gap-2.5">
                  <Mail class="w-4 h-4 text-emerald-500 shrink-0" />
                  <a :href="'mailto:' + company.contact.email" class="hover:underline">{{ company.contact.email }}</a>
                </div>
              </div>

              <!-- Official Registration Badge -->
              <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                <p class="font-bold">SLTDA License: {{ company.licenseNumber }}</p>
                <p class="text-slate-600 dark:text-slate-400 mt-0.5">Company Reg: {{ company.registrationNumber }}</p>
              </div>
            </div>

            <!-- Right Form Column -->
            <form @submit.prevent="handleInquirySubmit" class="lg:col-span-2 space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Your Full Name *</label>
                  <input
                    v-model="inquiryForm.full_name"
                    required
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Email Address *</label>
                  <input
                    v-model="inquiryForm.email"
                    required
                    type="email"
                    placeholder="e.g. eleanor@example.co.uk"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Nationality</label>
                  <input
                    v-model="inquiryForm.nationality"
                    type="text"
                    placeholder="e.g. British, German"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Expected Arrival</label>
                  <input
                    v-model="inquiryForm.arrival_date"
                    required
                    type="date"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Number of Travelers</label>
                  <input
                    v-model.number="inquiryForm.travelers"
                    type="number"
                    min="1"
                    max="50"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Interested Package</label>
                <select
                  v-model="inquiryForm.package_interest"
                  class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                >
                  <option value="custom">Custom Tailor-Made Itinerary</option>
                  <option value="5n-6d-classic">5N / 6D The Island in Miniature</option>
                  <option value="9n-10d-heritage">9N / 10D Heritage, Highlands &amp; Coastal</option>
                  <option value="14n-15d-grand">14N / 15D Grand All-Island Discovery Circuit</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Travel Notes &amp; Special Requests</label>
                <textarea
                  v-model="inquiryForm.message"
                  required
                  rows="3"
                  placeholder="Tell us about hotel preferences (4-star / luxury), pace, must-see places, or children's ages..."
                  class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none resize-none"
                ></textarea>
              </div>

              <!-- Status Messages -->
              <div v-if="inquirySuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Check class="w-4 h-4" />
                <span>Thank you! Your trip inquiry has been received. Our team will contact you shortly.</span>
              </div>

              <div v-if="inquiryError" class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 dark:text-rose-400">
                {{ inquiryError }}
              </div>

              <button
                type="submit"
                :disabled="submittingInquiry"
                class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
    <!-- 10. FOOTER (Whitelabel companyConfig & Theme Switcher) -->
    <!-- ==================================================================== -->
    <footer class="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-12 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Col 1: Brand & Bio -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-slate-900 dark:text-white">
            <Compass class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span class="font-black text-lg uppercase">{{ company.name }}</span>
          </div>
          <p class="text-xs leading-relaxed">
            {{ company.description }}
          </p>
          <div class="flex items-center gap-3 pt-1">
            <ThemeToggle showLabel />
          </div>
        </div>

        <!-- Col 2: Multi-Day Packages -->
        <div class="space-y-3">
          <h4 class="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Tour Circuits</h4>
          <ul class="space-y-2">
            <li><a href="#tours" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">5N/6D Island in Miniature</a></li>
            <li><a href="#tours" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">9N/10D Heritage to Highlands</a></li>
            <li><a href="#tours" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">14N/15D Grand Expedition</a></li>
            <li><a href="#excursions" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Day Excursions &amp; Safaris</a></li>
          </ul>
        </div>

        <!-- Col 3: Contact Info -->
        <div class="space-y-3">
          <h4 class="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Office Colombo</h4>
          <ul class="space-y-2">
            <li class="flex items-start gap-2">
              <MapPin class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{{ company.contact.address }}</span>
            </li>
            <li class="flex items-center gap-2">
              <Phone class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <a :href="'tel:' + company.contact.phoneRaw" class="hover:text-slate-900 dark:hover:text-white">{{ company.contact.phone }}</a>
            </li>
            <li class="flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <a :href="'mailto:' + company.contact.email" class="hover:text-slate-900 dark:hover:text-white">{{ company.contact.email }}</a>
            </li>
          </ul>
        </div>

        <!-- Col 4: Operations & System Access -->
        <div class="space-y-3">
          <h4 class="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Operations &amp; Agents</h4>
          <p class="text-xs">
            Access our back-office DMC reservation system, overseas agent directory, and live REST API endpoints.
          </p>
          <button
            @click="emit('open-operations')"
            class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md transition-colors"
          >
            <LayoutDashboard class="w-3.5 h-3.5" />
            <span>Launch Operations Portal</span>
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <span>&copy; {{ new Date().getFullYear() }} {{ company.legalName }}. All rights reserved.</span>
        <span>Registered Destination Management Company (DMC) &bull; SLTDA License: {{ company.licenseNumber }}</span>
      </div>
    </footer>

    <!-- ==================================================================== -->
    <!-- 11. DAY-BY-DAY ITINERARY MODAL -->
    <!-- ==================================================================== -->
    <div v-if="showItineraryModal && selectedTour" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transition-colors">
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded">
                {{ selectedTour.duration }}
              </span>
              <span class="text-slate-500 dark:text-slate-400 text-xs font-mono">{{ selectedTour.priceLKR }}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-1">{{ selectedTour.title }}</h3>
          </div>
          <button @click="showItineraryModal = false" class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Itinerary Days List -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div
            v-for="d in selectedTour.days"
            :key="d.day"
            class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">Day {{ d.day }}: {{ d.destination }}</span>
              <span class="text-[10px] text-slate-500 font-mono">{{ d.meals }}</span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-xs">{{ d.title }}</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ d.description }}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-800">
              <span class="text-slate-400">Accommodation:</span> {{ d.hotel }}
            </p>
          </div>

          <!-- Inclusions -->
          <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <h4 class="font-bold text-slate-900 dark:text-white text-xs">Package Inclusions:</h4>
            <ul class="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <li v-for="inc in selectedTour.inclusions" :key="inc" class="flex items-start gap-2">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{{ inc }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <button
            @click="showItineraryModal = false"
            class="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg"
          >
            Close
          </button>
          <button
            @click="showItineraryModal = false; selectTourForInquiry(selectedTour.id);"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg"
          >
            Book This Itinerary
          </button>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- 12. FLOATING WHATSAPP BUTTON (Using company.contact.whatsapp) -->
    <!-- ==================================================================== -->
    <a
      :href="'https://wa.me/' + company.contact.phoneRaw + '?text=Hello%20' + encodeURIComponent(company.name) + ',%20I%20would%20like%20to%20inquire%20about%20a%20private%20tour%20package.'"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
      :title="'Chat directly with ' + company.name + ' on WhatsApp'"
    >
      <MessageCircle class="w-6 h-6" />
      <span class="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
        Chat on WhatsApp
      </span>
    </a>

  </div>
</template>
