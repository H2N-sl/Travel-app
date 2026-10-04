const Database = require("better-sqlite3");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function createDatabase(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const connection = new Database(filename);
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");
  connection.exec(`
    CREATE TABLE IF NOT EXISTS schemaMigrations (
      version TEXT PRIMARY KEY,
      appliedAt TEXT NOT NULL
    );
  `);
  const migrationDirectory = path.join(__dirname, "migrations");
  const appliedMigration = connection.prepare(
    "INSERT INTO schemaMigrations (version, appliedAt) VALUES (?, ?)",
  );
  const migrationExists = connection.prepare(
    "SELECT version FROM schemaMigrations WHERE version = ?",
  );
  for (const filename of fs
    .readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const version = filename.split("_")[0];
    if (migrationExists.get(version)) continue;
    connection.exec("BEGIN IMMEDIATE");
    try {
      connection.exec(
        fs.readFileSync(path.join(migrationDirectory, filename), "utf8"),
      );
      appliedMigration.run(version, new Date().toISOString());
      connection.exec("COMMIT");
    } catch (error) {
      connection.exec("ROLLBACK");
      connection.close();
      throw error;
    }
  }

  const insertAgent = connection.prepare(`
    INSERT INTO agents (id, code, name, country, contactPerson, email, phone, currentSeq, createdAt, updatedAt)
    VALUES (@id, @code, @name, @country, @contactPerson, @email, @phone, @currentSeq, @createdAt, @updatedAt)
  `);
  const insertBooking = connection.prepare(`
    INSERT INTO bookings (
      id, bookingNumber, agentId, guestName, nationality, paxAdults, paxChildren,
      arrivalDate, departureDate, arrivalFlight, departureFlight, transportType,
      driverGuide, status, specialRequests, internalNotes, revenueLKR,
      expensesHotels, expensesTrans, expensesGuide, expensesActiv, expensesOther,
      createdAt, updatedAt
    ) VALUES (
      @id, @bookingNumber, @agentId, @guestName, @nationality, @paxAdults, @paxChildren,
      @arrivalDate, @departureDate, @arrivalFlight, @departureFlight, @transportType,
      @driverGuide, @status, @specialRequests, @internalNotes, @revenueLKR,
      @expensesHotels, @expensesTrans, @expensesGuide, @expensesActiv, @expensesOther,
      @createdAt, @updatedAt
    )
  `);
  const insertDay = connection.prepare(`
    INSERT INTO itineraryDays
      (id, bookingId, dayNumber, date, destination, hotelId, hotelName, meals, activities, transport, notes)
    VALUES
      (@id, @bookingId, @dayNumber, @date, @destination, @hotelId, @hotelName, @meals, @activities, @transport, @notes)
  `);
  const getAgent = connection.prepare("SELECT * FROM agents WHERE id = ?");
  const listAgents = connection.prepare(
    "SELECT * FROM agents ORDER BY createdAt DESC",
  );
  const getBookingRow = connection.prepare(`
    SELECT bookings.*, agents.name AS agentName
    FROM bookings JOIN agents ON agents.id = bookings.agentId
    WHERE bookings.id = ?
  `);
  const listBookingRows = connection.prepare(`
    SELECT bookings.*, agents.name AS agentName
    FROM bookings JOIN agents ON agents.id = bookings.agentId
    ORDER BY bookings.createdAt DESC
  `);
  const listDays = connection.prepare(`
    SELECT dayNumber AS day, date, destination, hotelId, hotelName, meals, activities, transport, notes
    FROM itineraryDays WHERE bookingId = ? ORDER BY dayNumber
  `);
  const insertInquiry = connection.prepare(`
    INSERT INTO inquiries (
      id, fullName, email, nationality, arrivalDate, departureDate, travelers,
      packageInterest, interests, message, status, createdAt, updatedAt
    ) VALUES (
      @id, @fullName, @email, @nationality, @arrivalDate, @departureDate, @travelers,
      @packageInterest, @interests, @message, 'New', @createdAt, @updatedAt
    )
  `);
  const getInquiry = connection.prepare("SELECT * FROM inquiries WHERE id = ?");
  const listInquiries = connection.prepare(
    "SELECT * FROM inquiries ORDER BY createdAt DESC",
  );

  function mapBooking(row) {
    return {
      id: row.id,
      bookingNumber: row.bookingNumber,
      agentId: row.agentId,
      agentName: row.agentName,
      guestName: row.guestName,
      nationality: row.nationality,
      paxAdults: row.paxAdults,
      paxChildren: row.paxChildren,
      arrivalDate: row.arrivalDate,
      departureDate: row.departureDate,
      arrivalFlight: row.arrivalFlight,
      departureFlight: row.departureFlight,
      transportType: row.transportType,
      driverGuide: row.driverGuide,
      status: row.status,
      specialRequests: row.specialRequests,
      internalNotes: row.internalNotes,
      revenueLKR: row.revenueLKR,
      expenses: {
        hotels: row.expensesHotels,
        transport: row.expensesTrans,
        guide: row.expensesGuide,
        activities: row.expensesActiv,
        other: row.expensesOther,
      },
      itinerary: listDays.all(row.id),
    };
  }

  const seedIfEmpty = connection.transaction(() => {
    if (
      connection.prepare("SELECT COUNT(*) AS count FROM agents").get().count > 0
    )
      return;
    const now = new Date().toISOString();
    const agentId = randomUUID();
    insertAgent.run({
      id: agentId,
      code: "ABC",
      name: "ABC Travel UK Ltd",
      country: "United Kingdom",
      contactPerson: "Sarah Jenkins",
      email: "sarah@abctravel.co.uk",
      phone: "+44 20 7946 0912",
      currentSeq: 1,
      createdAt: now,
      updatedAt: now,
    });
    const bookingId = randomUUID();
    insertBooking.run({
      id: bookingId,
      bookingNumber: "ABC-2026-0001",
      agentId,
      guestName: "Mr. David Smith & Family",
      nationality: "British",
      paxAdults: 2,
      paxChildren: 1,
      arrivalDate: "2026-10-10",
      departureDate: "2026-10-17",
      arrivalFlight: "UL504 / 12:40 PM",
      departureFlight: "UL503 / 02:15 PM",
      transportType: "Luxury Air-Conditioned Van (Toyota KDH)",
      driverGuide: "Samantha Bandara (Senior National Guide)",
      status: "In Operation",
      specialRequests: "Honeymoon arrangement, vegetarian meal.",
      internalNotes: "VIP agent client. Ensure prompt hotel check-in.",
      revenueLKR: 2850000,
      expensesHotels: 1250000,
      expensesTrans: 420000,
      expensesGuide: 140000,
      expensesActiv: 210000,
      expensesOther: 65000,
      createdAt: now,
      updatedAt: now,
    });
    [
      {
        date: "2026-10-10",
        destination: "Colombo",
        hotelId: "h1",
        hotelName: "Cinnamon Grand Colombo",
        meals: "Dinner",
        activities: "Airport greeting, Colombo City Tour",
        transport: "Private Van",
        notes: "Welcome kit presentation",
      },
      {
        date: "2026-10-11",
        destination: "Sigiriya / Dambulla",
        hotelId: "h2",
        hotelName: "Heritance Kandalama",
        meals: "Breakfast, Dinner",
        activities: "Dambulla Cave Temple Tour",
        transport: "Private Van",
        notes: "Check in by 4 PM",
      },
    ].forEach((day, index) => {
      insertDay.run({
        id: randomUUID(),
        bookingId,
        dayNumber: index + 1,
        ...day,
      });
    });
  });
  seedIfEmpty();

  return {
    getAgents: () => listAgents.all(),
    getBookings: () => listBookingRows.all().map(mapBooking),
    getInquiries: () => listInquiries.all(),
    createInquiry(data) {
      const now = new Date().toISOString();
      const inquiry = {
        id: randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      insertInquiry.run(inquiry);
      return getInquiry.get(inquiry.id);
    },
    updateInquiryStatus(id, status) {
      const result = connection
        .prepare("UPDATE inquiries SET status = ?, updatedAt = ? WHERE id = ?")
        .run(status, new Date().toISOString(), id);
      if (!result.changes) throw new Error("Inquiry not found");
      return getInquiry.get(id);
    },
    createAgent(data) {
      const now = new Date().toISOString();
      const agent = {
        id: randomUUID(),
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        country: data.country.trim(),
        contactPerson: data.contactPerson.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        currentSeq: 0,
        createdAt: now,
        updatedAt: now,
      };
      insertAgent.run(agent);
      return getAgent.get(agent.id);
    },
    createBooking(data) {
      const create = connection.transaction(() => {
        const agent = getAgent.get(data.agentId);
        if (!agent) throw new Error("Agent not found");
        const now = new Date().toISOString();
        const nextSeq = agent.currentSeq + 1;
        const bookingNumber = `${agent.code}-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`;
        connection
          .prepare(
            "UPDATE agents SET currentSeq = ?, updatedAt = ? WHERE id = ?",
          )
          .run(nextSeq, now, agent.id);
        const id = randomUUID();
        insertBooking.run({
          id,
          bookingNumber,
          agentId: agent.id,
          guestName: data.guestName.trim(),
          nationality: data.nationality.trim(),
          paxAdults: data.paxAdults,
          paxChildren: data.paxChildren,
          arrivalDate: data.arrivalDate,
          departureDate: data.departureDate,
          arrivalFlight: data.arrivalFlight.trim(),
          departureFlight: data.departureFlight.trim(),
          transportType: data.transportType.trim(),
          driverGuide: data.driverGuide.trim(),
          status: "Confirmed",
          specialRequests: data.specialRequests || null,
          internalNotes: data.internalNotes || null,
          revenueLKR: data.revenueLKR,
          expensesHotels: data.revenueLKR * 0.45,
          expensesTrans: data.revenueLKR * 0.15,
          expensesGuide: data.revenueLKR * 0.05,
          expensesActiv: data.revenueLKR * 0.08,
          expensesOther: data.revenueLKR * 0.02,
          createdAt: now,
          updatedAt: now,
        });
        insertDay.run({
          id: randomUUID(),
          bookingId: id,
          dayNumber: 1,
          date: data.arrivalDate,
          destination: "Colombo",
          hotelId: "h1",
          hotelName: "Cinnamon Grand Colombo",
          meals: "Dinner",
          activities: "Airport Transfer & Leisure",
          transport: data.transportType,
          notes: "Welcome upon arrival",
        });
        return mapBooking(getBookingRow.get(id));
      });
      return create();
    },
    updateItinerary(bookingId, days) {
      const update = connection.transaction(() => {
        if (!getBookingRow.get(bookingId)) throw new Error("Booking not found");
        connection
          .prepare("DELETE FROM itineraryDays WHERE bookingId = ?")
          .run(bookingId);
        days.forEach((day, index) => {
          insertDay.run({
            id: randomUUID(),
            bookingId,
            dayNumber: index + 1,
            date: day.date,
            destination: day.destination,
            hotelId: day.hotelId || "",
            hotelName: day.hotelName,
            meals: day.meals,
            activities: day.activities,
            transport: day.transport,
            notes: day.notes || null,
          });
        });
      });
      update();
      return mapBooking(getBookingRow.get(bookingId));
    },
    close: () => connection.close(),
  };
}

module.exports = { createDatabase };
