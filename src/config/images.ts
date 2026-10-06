/**
 * ==============================================================================
 * FILE: src/config/images.ts
 * CENTRAL DYNAMIC IMAGE ASSETS REGISTRY
 * ==============================================================================
 * 
 * 🔰 BEGINNER & ASSET MANAGEMENT GUIDE:
 * ------------------------------------------------------------------------------
 * This file is the single central registry for all images across the website.
 * 
 * Folders are structured under `/assets/images/` inside the `public/` directory:
 *   public/assets/images/
 *   ├── hero/          (Homepage hero banners & section headers)
 *   ├── tours/         (Package cards: 5N/6D, 9N/10D, 14N/15D, etc.)
 *   ├── excursions/    (Day trip & attraction cards)
 *   ├── fleet/         (Toyota KDH Vans, Sedans, Jeeps, Mini Coaches)
 *   ├── gallery/       (Scenic destination highlights)
 *   └── branding/      (Logos, badges, stamps)
 * 
 * 🛠️ HOW TO REPLACE AN IMAGE:
 * 1. Drop your new image file into the corresponding `public/assets/images/...` folder.
 * 2. Update the file path in this file if you used a different filename.
 * 3. Every component using `useImages()` will immediately display the new photo!
 * 
 * 🛡️ AUTOMATIC FALLBACK PROTECTION:
 * If an image file is missing or fails to load, `useImages()` automatically swaps
 * to a verified fallback photo or styled placeholder so your website never shows
 * a broken image icon!
 * ==============================================================================
 */

export interface ImageAssetItem {
  src: string;
  alt: string;
  caption?: string;
  fallback?: string;
}

export const imagesConfig = {
  // 1. HERO BANNERS & MAIN HEADERS
  hero: {
    main: {
      src: "/assets/images/hero/sri-lanka-paradise-hero.jpg",
      fallback: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=90",
      alt: "Sri Lanka tropical palm fringed beach and turquoise ocean waves",
      caption: "Unforgettable Sri Lanka Journeys",
    },
    operations: {
      src: "/assets/images/hero/operations-banner.jpg",
      fallback: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80",
      alt: "DMC Tour Operations & Itinerary Dispatch Workspace",
      caption: "Serendib & Metshu DMC Central Console",
    },
  },

  // 2. MULTI-DAY TOUR PACKAGES
  tours: {
    miniature: {
      src: "/assets/images/tours/5n-6d-miniature.jpg",
      fallback: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=85",
      alt: "5 Nights / 6 Days Island in Miniature - Kandy, Ella, Yala & Mirissa",
    },
    heritage: {
      src: "/assets/images/tours/9n-10d-heritage.jpg",
      fallback: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=85",
      alt: "9 Nights / 10 Days Heritage, Highlands & Coastal Wonders",
    },
    grand: {
      src: "/assets/images/tours/14n-15d-grand.jpg",
      fallback: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85",
      alt: "14 Nights / 15 Days Grand All-Island Circuit - Jaffna, East Coast, Hills & South",
    },
    wildlife: {
      src: "/assets/images/tours/7n-8d-wildlife.jpg",
      fallback: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=85",
      alt: "7 Nights / 8 Days Wild Leopard Safaris & Coastal Serenity",
    },
  },

  // 3. DAY EXCURSIONS & SIGNATURE EXPERIENCES
  excursions: {
    sigiriya: {
      src: "/assets/images/excursions/sigiriya-dambulla.jpg",
      fallback: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
      alt: "Sigiriya Lion Rock Fortress & Ancient Water Gardens",
    },
    galle: {
      src: "/assets/images/excursions/galle-fort-madu.jpg",
      fallback: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      alt: "Galle 17th Century Dutch Fort Ramparts & Madu River Eco Safari",
    },
    kandy: {
      src: "/assets/images/excursions/kandy-tea-trail.jpg",
      fallback: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=80",
      alt: "Temple of the Sacred Tooth Relic & Royal Ceylon Tea Plantations",
    },
    yala: {
      src: "/assets/images/excursions/yala-4x4-safari.jpg",
      fallback: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
      alt: "Yala National Park 4x4 Leopard & Wild Elephant Safari",
    },
  },

  // 4. PRIVATE LUXURY VEHICLE FLEET
  fleet: {
    kdhVan: {
      src: "/assets/images/fleet/toyota-kdh-van.jpg",
      fallback: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80",
      alt: "Toyota KDH High-Roof Luxury Air-Conditioned Van",
      capacity: "2-7 Passengers + Luggage",
    },
    sedan: {
      src: "/assets/images/fleet/executive-sedan.jpg",
      fallback: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
      alt: "Toyota Allion / Premio Executive Air-Conditioned Sedan",
      capacity: "1-3 Passengers + Luggage",
    },
    miniCoach: {
      src: "/assets/images/fleet/luxury-mini-coach.jpg",
      fallback: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
      alt: "Toyota Coaster Luxury Air-Conditioned Tourist Coach",
      capacity: "8-18 Passengers + Luggage",
    },
    suv: {
      src: "/assets/images/fleet/toyota-prado-4x4.jpg",
      fallback: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
      alt: "Toyota Land Cruiser Prado 4x4 Luxury SUV",
      capacity: "1-4 Passengers + Safari Gear",
    },
  },

  // 5. DESTINATION HIGHLIGHTS GALLERY
  gallery: [
    {
      id: "sigiriya",
      title: "Sigiriya Lion Rock Fortress",
      region: "Cultural Triangle",
      src: "/assets/images/gallery/sigiriya-fortress.jpg",
      fallback: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
      alt: "Monolithic Sigiriya rock surrounded by lush tropical forest",
    },
    {
      id: "ella-train",
      title: "Scenic Ella Hill Country Railway",
      region: "Central Highlands",
      src: "/assets/images/gallery/ella-nine-arches.jpg",
      fallback: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
      alt: "Iconic blue train crossing the Nine Arches stone viaduct in misty Ella",
    },
    {
      id: "mirissa",
      title: "Mirissa Palm Beach & Whale Coast",
      region: "Southern Shoreline",
      src: "/assets/images/gallery/mirissa-sunset.jpg",
      fallback: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      alt: "Golden sand beach with leaning coconut palms at sunset in Mirissa",
    },
    {
      id: "nuwara-eliya",
      title: "Ceylon High-Grown Tea Estates",
      region: "Little England",
      src: "/assets/images/gallery/nuwara-eliya-tea.jpg",
      fallback: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=80",
      alt: "Misty emerald green tea plantation hills in Nuwara Eliya",
    },
    {
      id: "yala-safari",
      title: "Wild Leopard & Elephant Tracking",
      region: "Yala National Park",
      src: "/assets/images/gallery/yala-wildlife.jpg",
      fallback: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
      alt: "Leopard resting on a rock in Yala National Park",
    },
    {
      id: "galle-fort",
      title: "17th Century Dutch Galle Fort",
      region: "UNESCO World Heritage Site",
      src: "/assets/images/gallery/galle-lighthouse.jpg",
      fallback: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
      alt: "Historic white lighthouse along Galle Fort ocean ramparts",
    },
  ],

  // 6. DEFAULT FALLBACKS & PLACEHOLDERS
  fallbacks: {
    hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=90",
    tour: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=85",
    excursion: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=80",
    fleet: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    placeholder:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500' fill='%230f172a'><rect width='100%25' height='100%25' fill='%230f172a'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2310b981'>Metshu Travels &bull; Sri Lanka Experience</text></svg>",
  },
};

export default imagesConfig;
