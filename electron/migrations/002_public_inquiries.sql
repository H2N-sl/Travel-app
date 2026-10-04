CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  nationality TEXT NOT NULL,
  arrivalDate TEXT NOT NULL,
  departureDate TEXT NOT NULL,
  travelers INTEGER NOT NULL CHECK (travelers BETWEEN 1 AND 30),
  packageInterest TEXT NOT NULL,
  interests TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX inquiries_status_createdAt_idx
  ON inquiries(status, createdAt DESC);