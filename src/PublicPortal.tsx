import React, { useState } from "react";
import { NewInquiry } from "./db";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Compass,
  Leaf,
  MapPin,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

const PUBLIC_PACKAGES = [
  {
    id: "classic-6",
    duration: "6 days / 5 nights",
    title: "The island in miniature",
    route: "Negombo · Kandy · Ella · Yala · Mirissa",
    detail: "Culture, hill-country rail, safari and a slow finish by the sea.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1100&q=85",
    alt: "Open tropical shoreline at the water's edge",
  },
  {
    id: "grand-10",
    duration: "10 days / 9 nights",
    title: "Heritage to highlands",
    route: "Sigiriya · Kandy · Nuwara Eliya · Ella · Galle",
    detail:
      "Ancient capitals, tea country and the characterful southern coast.",
    image:
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1100&q=85",
    alt: "Ornate temple architecture reflected across a lake",
  },
  {
    id: "ultimate-15",
    duration: "15 days / 14 nights",
    title: "The long way around",
    route: "Wilpattu · Jaffna · Anuradhapura · Arugam Bay · Galle",
    detail:
      "A broader circuit through the north, east, ancient cities and coast.",
    image:
      "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1100&q=85",
    alt: "Lush tea country on a Sri Lankan journey",
  },
];

const HIGHLIGHTS = [
  {
    title: "Ancient stone, living history",
    place: "Sigiriya & the Cultural Triangle",
    image:
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "A railway through the clouds",
    place: "Kandy to Ella",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Tea country at first light",
    place: "Nuwara Eliya",
    image:
      "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Wild Sri Lanka, up close",
    place: "Yala National Park",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=85",
  },
];

const GUEST_NOTES = [
  {
    quote:
      "We traded a checklist for a train window, a long lunch, and time to stay another night.",
    route: "Tea country · sample guest note",
  },
  {
    quote:
      "The best moments were the ones between destinations: a roadside fruit stop and a quiet walk at dusk.",
    route: "Southern coast · sample guest note",
  },
  {
    quote:
      "Every day felt considered, but never hurried. We came home with stories, not just photographs.",
    route: "Cultural Triangle · sample guest note",
  },
];

interface PublicPortalProps {
  inquiryError: string | null;
  isUnlockingAdmin: boolean;
  inquirySubmitted: boolean;
  onAdminUnlock: () => Promise<boolean>;
  onInquirySubmit: (inquiry: NewInquiry) => Promise<boolean>;
}

export default function PublicPortal({
  inquiryError,
  isUnlockingAdmin,
  inquirySubmitted,
  onAdminUnlock,
  onInquirySubmit,
}: PublicPortalProps) {
  const [selectedPackage, setSelectedPackage] = useState("custom");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const handleInquirySubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubmittingInquiry(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const inquiry: NewInquiry = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      nationality: String(formData.get("nationality") || ""),
      arrivalDate: String(formData.get("arrivalDate") || ""),
      departureDate: String(formData.get("departureDate") || ""),
      travelers: Number(formData.get("travelers")),
      packageInterest: String(formData.get("packageInterest") || ""),
      interests: String(formData.get("interests") || ""),
      message: String(formData.get("message") || ""),
    };

    const submitted = await onInquirySubmit(inquiry);
    if (submitted) {
      form.reset();
      setSelectedPackage("custom");
    }
    setSubmittingInquiry(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] text-[#17352f]">
      <header className="relative z-20 flex h-[76px] items-center justify-between border-b border-[#d8e4df] bg-white px-5 sm:px-10 lg:px-16">
        <a
          href="#top"
          className="flex items-center gap-3"
          aria-label="Serendib DMC home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#164f43] text-white">
            <Compass className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-lg leading-none tracking-wide">
              SERENDIB
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#4d766a]">
              Destination journeys
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-[#35544c] md:flex">
          <a className="hover:text-[#d76345]" href="#journeys">
            Journeys
          </a>
          <a className="hover:text-[#d76345]" href="#island">
            The island
          </a>
          <a className="hover:text-[#d76345]" href="#stories">
            Guest notes
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onAdminUnlock()}
            disabled={isUnlockingAdmin}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-[#547269] transition hover:text-[#17352f]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isUnlockingAdmin ? "Opening..." : "Staff"}</span>
          </button>
          <a
            href="#inquiry"
            className="rounded-md bg-[#d76345] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#bd5137]"
          >
            Plan a journey
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate min-h-[590px] overflow-hidden bg-[#17352f] sm:min-h-[650px]">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=90"
            alt="A wide tropical beach on Sri Lanka's coast"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#10241f]/45" />
          <div className="relative mx-auto flex min-h-[590px] max-w-[1440px] items-center px-6 py-20 sm:min-h-[650px] sm:px-12 lg:px-20">
            <div className="max-w-3xl text-white">
              <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d9e9df]">
                <span className="h-px w-8 bg-[#e7815d]" />
                Made for the curious
              </p>
              <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-[72px]">
                Sri Lanka, in its own time.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
                From salt-air mornings to mist-covered highlands, find the
                island through thoughtful routes and the people who know it
                best.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#journeys"
                  className="inline-flex items-center gap-3 rounded-md bg-[#e77b58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d86645]"
                >
                  Explore journeys <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#island"
                  className="rounded-md border border-white/55 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Find your kind of island
                </a>
              </div>
            </div>
            <div className="absolute bottom-6 right-7 hidden max-w-48 text-right text-[10px] uppercase tracking-[0.14em] text-white/80 sm:block lg:right-16">
              Indian Ocean · 7° North
            </div>
          </div>
        </section>

        <section
          id="journeys"
          className="scroll-mt-20 px-5 py-20 sm:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d76345]">
                  Go a little further
                </p>
                <h2 className="mt-3 font-serif text-4xl text-[#17352f] sm:text-5xl">
                  Journeys shaped around you
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#587168]">
                A first glimpse of the island. Each route can be slowed down,
                extended, or made entirely your own.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {PUBLIC_PACKAGES.map((tour) => (
                <article
                  key={tour.id}
                  className="group overflow-hidden rounded-lg border border-[#d8e4df] bg-white"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={tour.image}
                      alt={tour.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute bottom-3 left-3 rounded bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#245346]">
                      {tour.duration}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="font-serif text-2xl text-[#17352f]">
                      {tour.title}
                    </h3>
                    <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#688078]">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#d76345]" />
                      {tour.route}
                    </p>
                    <p className="mt-4 min-h-12 text-sm leading-6 text-[#45635a]">
                      {tour.detail}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackage(tour.id);
                        document
                          .getElementById("inquiry")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#b85037] hover:text-[#17352f]"
                    >
                      Ask about this journey{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-[#71877f]">
              Hotel selection and final pricing are tailored to your dates and
              preferences.
            </p>
          </div>
        </section>

        <section
          id="island"
          className="scroll-mt-20 border-y border-[#dce7e2] bg-[#eaf2ed] px-5 py-20 sm:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-9 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d76345]">
                A thousand small discoveries
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-tight text-[#17352f] sm:text-5xl">
                Find the island between the landmarks.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((place, index) => (
                <article key={place.title} className="group">
                  <div className="relative h-64 overflow-hidden rounded-lg bg-[#b8cec4]">
                    <img
                      src={place.image}
                      alt={place.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#245346]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-xl text-[#17352f]">
                    {place.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#6b8279]">{place.place}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-5 py-20 sm:px-10 lg:px-16 lg:py-24"
          aria-labelledby="approach-heading"
        >
          <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d76345]">
                Travel with intention
              </p>
              <h2
                id="approach-heading"
                className="mt-3 font-serif text-4xl leading-tight text-[#17352f] sm:text-5xl"
              >
                Local knowledge.
                <br />
                Room to wander.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-[#587168]">
                Thoughtful stays, trusted local guides, and breathing room in
                every itinerary. We plan around what draws you here.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Compass,
                  title: "Routes with rhythm",
                  copy: "A considered pace, with space for the unplanned.",
                },
                {
                  icon: Leaf,
                  title: "Closer to local life",
                  copy: "Meet the makers, cooks, guides, and hosts along the way.",
                },
                {
                  icon: ShieldCheck,
                  title: "One local team",
                  copy: "A familiar point of contact from first note to final day.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="border-l-2 border-[#d76345] py-2 pl-4"
                >
                  <Icon className="h-5 w-5 text-[#397563]" />
                  <h3 className="mt-5 font-serif text-xl text-[#17352f]">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#6b8279]">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stories"
          className="scroll-mt-20 bg-[#173f37] px-5 py-20 text-white sm:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f39b77]">
              From the road
            </p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">
              A few words from the journey
            </h2>
            <p className="mt-3 text-xs text-white/60">
              Sample testimonial copy. Replace with verified guest reviews
              before publishing.
            </p>
            <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
              {GUEST_NOTES.map((note) => (
                <figure
                  key={note.route}
                  className="rounded-lg border border-white/15 bg-white/[0.06] p-5 sm:p-6"
                >
                  <div className="text-3xl leading-none text-[#f39b77]">“</div>
                  <blockquote className="mt-2 font-serif text-xl leading-7 text-white/95">
                    {note.quote}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-white/15 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b9d0c7]">
                    {note.route}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section
          id="inquiry"
          className="scroll-mt-16 px-5 py-20 sm:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d76345]">
                Start with a hello
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-tight text-[#17352f] sm:text-5xl">
                Tell us what
                <br />
                you’re dreaming of.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[#587168]">
                Share a few details and our local team will come back with ideas
                shaped around your dates, interests, and pace.
              </p>
              <div className="mt-8 flex flex-wrap gap-5 text-xs text-[#547269]">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#d76345]" /> Flexible
                  dates welcome
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#d76345]" /> Solo travellers
                  to groups
                </span>
              </div>
            </div>

            <form
              onSubmit={handleInquirySubmit}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <label className="text-xs font-semibold text-[#31574c]">
                Full name
                <input
                  required
                  name="fullName"
                  autoComplete="name"
                  maxLength={120}
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c]">
                Email address
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c]">
                Nationality
                <input
                  required
                  name="nationality"
                  maxLength={100}
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c]">
                Travellers
                <input
                  required
                  name="travelers"
                  type="number"
                  min="1"
                  max="30"
                  defaultValue="2"
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c]">
                Arrival
                <input
                  required
                  name="arrivalDate"
                  type="date"
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c]">
                Departure
                <input
                  required
                  name="departureDate"
                  type="date"
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c] sm:col-span-2">
                Journey you have in mind
                <select
                  name="packageInterest"
                  value={selectedPackage}
                  onChange={(event) => setSelectedPackage(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                >
                  <option value="custom">A journey made for me</option>
                  {PUBLIC_PACKAGES.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.duration} - {tour.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#31574c] sm:col-span-2">
                What are you drawn to?
                <input
                  name="interests"
                  placeholder="Wildlife, food, rail journeys, beaches..."
                  maxLength={500}
                  className="mt-1.5 w-full rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              <label className="text-xs font-semibold text-[#31574c] sm:col-span-2">
                A little more about your trip
                <textarea
                  required
                  name="message"
                  rows={4}
                  maxLength={2000}
                  placeholder="Anything that would help us get to know your plans..."
                  className="mt-1.5 w-full resize-y rounded-md border border-[#cbdcd4] bg-white px-3 py-2.5 text-sm text-[#17352f] outline-none focus:border-[#397563]"
                />
              </label>
              {inquiryError && (
                <p role="alert" className="text-xs text-rose-700 sm:col-span-2">
                  {inquiryError}
                </p>
              )}
              {inquirySubmitted && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm font-medium text-[#28745a] sm:col-span-2"
                >
                  <Check className="h-4 w-4" /> Thank you. Your inquiry is with
                  our local team.
                </p>
              )}
              <div className="sm:col-span-2">
                <button
                  disabled={submittingInquiry}
                  type="submit"
                  className="inline-flex items-center gap-3 rounded-md bg-[#d76345] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#bd5137] disabled:cursor-wait disabled:opacity-60"
                >
                  {submittingInquiry ? "Sending..." : "Send a trip inquiry"}
                  <Send className="h-4 w-4" />
                </button>
                <p className="mt-3 text-[10px] leading-5 text-[#71877f]">
                  Your details are used only to respond to this trip inquiry.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="flex flex-col justify-between gap-4 border-t border-[#d8e4df] bg-white px-5 py-7 text-xs text-[#6b8279] sm:flex-row sm:items-center sm:px-10 lg:px-16">
        <span>© 2026 Serendib DMC · Sri Lanka</span>
        <span className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" /> Colombo, Sri Lanka
        </span>
      </footer>

    </div>
  );
}
