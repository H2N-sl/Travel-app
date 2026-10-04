CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  contactPerson TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  currentSeq INTEGER NOT NULL DEFAULT 0 CHECK (currentSeq >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  bookingNumber TEXT NOT NULL UNIQUE,
  agentId TEXT NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  guestName TEXT NOT NULL,
  nationality TEXT NOT NULL,
  paxAdults INTEGER NOT NULL DEFAULT 2 CHECK (paxAdults >= 0),
  paxChildren INTEGER NOT NULL DEFAULT 0 CHECK (paxChildren >= 0),
  arrivalDate TEXT NOT NULL,
  departureDate TEXT NOT NULL,
  arrivalFlight TEXT NOT NULL,
  departureFlight TEXT NOT NULL,
  transportType TEXT NOT NULL,
  driverGuide TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  specialRequests TEXT,
  internalNotes TEXT,
  revenueLKR REAL NOT NULL CHECK (revenueLKR >= 0),
  expensesHotels REAL NOT NULL DEFAULT 0,
  expensesTrans REAL NOT NULL DEFAULT 0,
  expensesGuide REAL NOT NULL DEFAULT 0,
  expensesActiv REAL NOT NULL DEFAULT 0,
  expensesOther REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE itineraryDays (
  id TEXT PRIMARY KEY,
  bookingId TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  dayNumber INTEGER NOT NULL CHECK (dayNumber > 0),
  date TEXT NOT NULL,
  destination TEXT NOT NULL,
  hotelId TEXT NOT NULL DEFAULT '',
  hotelName TEXT NOT NULL,
  meals TEXT NOT NULL,
  activities TEXT NOT NULL,
  transport TEXT NOT NULL,
  notes TEXT,
  UNIQUE (bookingId, dayNumber)
);

CREATE INDEX itineraryDays_bookingId_dayNumber_idx
  ON itineraryDays(bookingId, dayNumber);