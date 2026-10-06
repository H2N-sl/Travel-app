/**
 * ==============================================================================
 * FILE: src/config/company.ts
 * WHITELABEL COMPANY BRANDING CONFIGURATION
 * ==============================================================================
 * 
 * 🔰 BEGINNER & WHITELABEL GUIDE - HOW TO REBRAND THIS APPLICATION:
 * ------------------------------------------------------------------------------
 * This single configuration file acts as the "Single Source of Truth" for your
 * Destination Management Company (DMC) or travel agency.
 * 
 * To rebrand this entire website for a different travel company (e.g. "Serendib Journeys",
 * "Ceylon Heritage Tours", "Island Escape DMC"), simply change the values below!
 * 
 * Every component (Navbar, Hero, Footer, Day-by-Day Modals, Operations Dashboard,
 * Hotel Vouchers, Driver Duty Slips, and Client Documents) will automatically
 * update its branding, contact details, licensing, and colors!
 * ==============================================================================
 */

export interface CompanyConfig {
  name: string;
  legalName: string;
  shortName: string;
  tagline: string;
  subTagline: string;
  description: string;
  licenseNumber: string;
  registrationNumber: string;
  taxNumber?: string;
  foundedYear: number;
  contact: {
    phone: string;
    phoneRaw: string;
    email: string;
    bookingEmail: string;
    whatsapp: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    operatingHours: string;
    emergencyHotline: string;
    googleMapsEmbedUrl?: string;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tripadvisor?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  currencies: {
    default: "LKR" | "USD" | "EUR" | "GBP";
    secondary: "USD" | "EUR" | "GBP";
    exchangeRateUSD: number;
    symbol: string;
  };
  branding: {
    logoUrl: string;
    logoDarkUrl?: string;
    faviconUrl: string;
    colors: {
      primary: string;    // Main brand highlight (default emerald: #059669)
      primaryHover: string; // Button hover state (default #10b981)
      secondary: string;  // Supporting brand accent (default teal: #0d9488)
      accent: string;     // Attention grabber/star badges (default amber: #f59e0b)
      darkBg: string;     // Dark mode background (#020617)
      lightBg: string;    // Light mode background (#f8fafc)
    };
  };
  features: {
    enablePublicWebsite: boolean;
    enableOperationsPortal: boolean;
    enableOnlineBooking: boolean;
    enableMultiCurrency: boolean;
    enableDarkModeToggle: boolean;
  };
}

export const companyConfig: CompanyConfig = {
  // 1. Basic Company Identity
  name: "Metshu Travels",
  legalName: "Metshu Travels & Tours (Pvt) Ltd",
  shortName: "METSHU",
  tagline: "Personalized & Unforgettable Journeys Across Sri Lanka",
  subTagline: "Sri Lanka • In Its Own Time",
  description:
    "Thoughtful Sri Lanka journeys, planned with local insight, private luxury transport, certified chauffeur guides, and handpicked boutique accommodations.",
  
  // 2. Official Accreditation & Licensing
  licenseNumber: "SLTDA/SQA/PRO/01892",
  registrationNumber: "PV 00291823",
  taxNumber: "TIN-109283741",
  foundedYear: 2018,

  // 3. Contact & Office Location
  contact: {
    phone: "+94 74 394 2844",
    phoneRaw: "+94743942844",
    email: "info@metshutravels.com",
    bookingEmail: "reservations@metshutravels.com",
    whatsapp: "+94 74 394 2844",
    address: "L 12, Ceylinco House, Colombo 01",
    city: "Colombo",
    country: "Sri Lanka",
    postalCode: "00100",
    operatingHours: "24/7 Island Concierge & Support",
    emergencyHotline: "+94 74 394 2844",
  },

  // 4. Social Media Channels
  socialLinks: {
    facebook: "https://facebook.com/metshutravels",
    instagram: "https://instagram.com/metshutravels",
    tripadvisor: "https://tripadvisor.com/metshutravels",
    youtube: "https://youtube.com/@metshutravels",
  },

  // 5. Currency Preferences
  currencies: {
    default: "LKR",
    secondary: "USD",
    exchangeRateUSD: 300,
    symbol: "Rs",
  },

  // 6. Whitelabel Theme Colors & Assets
  branding: {
    logoUrl: "/assets/images/branding/logo.svg",
    logoDarkUrl: "/assets/images/branding/logo-white.svg",
    faviconUrl: "/favicon.svg",
    colors: {
      primary: "#059669",      // Vibrant Emerald
      primaryHover: "#10b981", // Lighter Emerald for button hover
      secondary: "#0d9488",    // Ocean Teal
      accent: "#f59e0b",       // Warm Amber Gold
      darkBg: "#020617",       // Deep Slate 950
      lightBg: "#f8fafc",      // Crisp Slate 50
    },
  },

  // 7. System Features Flags
  features: {
    enablePublicWebsite: true,
    enableOperationsPortal: true,
    enableOnlineBooking: true,
    enableMultiCurrency: true,
    enableDarkModeToggle: true,
  },
};

// Export alias for easy backwards compatibility
export default companyConfig;
