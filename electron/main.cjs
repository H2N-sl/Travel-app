const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { createDatabase } = require("./database.cjs");
const { createAdminAuth } = require("./admin-auth.cjs");

let database;
let adminAuth;

function assertTrustedSender(event) {
  const senderUrl = event.senderFrame?.url;
  if (!senderUrl) throw new Error("Untrusted database request");

  const url = new URL(senderUrl);
  const isDevServer =
    !app.isPackaged &&
    url.protocol === "http:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "5173";
  const isPackagedFile = app.isPackaged && url.protocol === "file:";
  if (!isDevServer && !isPackagedFile) {
    throw new Error("Untrusted database request");
  }
}

function requireObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

function requireText(data, key, maxLength = 500) {
  const value = data[key];
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(
      `${key} is required and must be under ${maxLength} characters`,
    );
  }
  return value;
}

function readText(data, key, maxLength = 500) {
  const value = data[key];
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error(`${key} must be a string under ${maxLength} characters`);
  }
  return value;
}

function handleWithEvent(channel, callback) {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedSender(event);
    return callback(event, ...args);
  });
}

function handle(channel, callback) {
  handleWithEvent(channel, (_event, ...args) => callback(...args));
}

function handleAdmin(channel, callback) {
  handleWithEvent(channel, (event, ...args) => {
    if (!adminAuth?.isAuthenticated(event.sender.id)) {
      throw new Error("Admin authentication is required.");
    }
    return callback(...args);
  });
}

function registerDatabaseHandlers() {
  // Temporary open-access mode; restore authentication before public deployment.
  handleWithEvent("dmc:unlock-admin", (event) =>
    adminAuth.unlock(event.sender.id),
  );
  handleWithEvent("dmc:logout-admin", (event) =>
    adminAuth.logout(event.sender.id),
  );
  handleAdmin("dmc:get-agents", () => database.getAgents());
  handleAdmin("dmc:get-bookings", () => database.getBookings());
  handleAdmin("dmc:get-inquiries", () => database.getInquiries());
  handle("dmc:submit-inquiry", (input) => {
    const data = requireObject(input, "Inquiry");
    const email = requireText(data, "email", 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    const travelers = Number(data.travelers);
    if (!Number.isInteger(travelers) || travelers < 1 || travelers > 30) {
      throw new Error("Traveler count must be between 1 and 30.");
    }
    return database.createInquiry({
      fullName: requireText(data, "fullName", 120),
      email,
      nationality: requireText(data, "nationality", 100),
      arrivalDate: readText(data, "arrivalDate", 20),
      departureDate: readText(data, "departureDate", 20),
      travelers,
      packageInterest: requireText(data, "packageInterest", 120),
      interests: readText(data, "interests", 500),
      message: requireText(data, "message", 2000),
    });
  });
  handleAdmin("dmc:update-inquiry-status", (id, status) => {
    if (!["New", "Contacted", "Closed"].includes(status)) {
      throw new Error("Invalid inquiry status.");
    }
    return database.updateInquiryStatus(requireText({ id }, "id", 100), status);
  });
  handleAdmin("dmc:create-agent", (input) => {
    const data = requireObject(input, "Agent");
    const code = requireText(data, "code", 3);
    if (!/^[A-Za-z0-9]{2,3}$/.test(code)) {
      throw new Error("Agent code must be 2-3 letters or numbers");
    }
    return database.createAgent({
      code,
      name: requireText(data, "name"),
      country: requireText(data, "country"),
      contactPerson: requireText(data, "contactPerson"),
      email: requireText(data, "email", 254),
      phone: requireText(data, "phone", 50),
    });
  });
  handleAdmin("dmc:create-booking", (input) => {
    const data = requireObject(input, "Booking");
    const paxAdults = Number(data.paxAdults);
    const paxChildren = Number(data.paxChildren);
    const revenueLKR = Number(data.revenueLKR);
    if (!Number.isInteger(paxAdults) || paxAdults < 0)
      throw new Error("Invalid adult count");
    if (!Number.isInteger(paxChildren) || paxChildren < 0)
      throw new Error("Invalid child count");
    if (!Number.isFinite(revenueLKR) || revenueLKR < 0)
      throw new Error("Invalid revenue amount");
    return database.createBooking({
      agentId: requireText(data, "agentId", 100),
      guestName: requireText(data, "guestName"),
      nationality: requireText(data, "nationality", 100),
      paxAdults,
      paxChildren,
      arrivalDate: requireText(data, "arrivalDate", 20),
      departureDate: requireText(data, "departureDate", 20),
      arrivalFlight: requireText(data, "arrivalFlight"),
      departureFlight: requireText(data, "departureFlight"),
      transportType: requireText(data, "transportType"),
      driverGuide: requireText(data, "driverGuide"),
      revenueLKR,
      specialRequests:
        typeof data.specialRequests === "string" ? data.specialRequests : "",
      internalNotes:
        typeof data.internalNotes === "string" ? data.internalNotes : "",
    });
  });
  handleAdmin("dmc:update-itinerary", (bookingId, input) => {
    requireText({ bookingId }, "bookingId", 100);
    if (!Array.isArray(input) || input.length > 60)
      throw new Error("Invalid itinerary");
    const days = input.map((day) => {
      const item = requireObject(day, "Itinerary day");
      return {
        date: requireText(item, "date", 20),
        destination: readText(item, "destination"),
        hotelId: readText(item, "hotelId", 100),
        hotelName: readText(item, "hotelName"),
        meals: readText(item, "meals"),
        activities: readText(item, "activities"),
        transport: readText(item, "transport"),
        notes: readText(item, "notes"),
      };
    });
    return database.updateItinerary(bookingId, days);
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on(
    "did-start-navigation",
    (_event, _url, _isInPlace, isMainFrame) => {
      if (isMainFrame) adminAuth.logout(window.webContents.id);
    },
  );
  window.on("closed", () => adminAuth.logout(window.webContents.id));
  if (!app.isPackaged) {
    window.loadURL("http://127.0.0.1:5173");
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  adminAuth = createAdminAuth();
  database = createDatabase(
    path.join(app.getPath("userData"), "serendib-dmc.sqlite"),
  );
  registerDatabaseHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => database?.close());
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
