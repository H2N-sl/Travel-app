const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dmcDesktop", {
  unlockAdmin: () => ipcRenderer.invoke("dmc:unlock-admin"),
  logoutAdmin: () => ipcRenderer.invoke("dmc:logout-admin"),
  getAgents: () => ipcRenderer.invoke("dmc:get-agents"),
  getBookings: () => ipcRenderer.invoke("dmc:get-bookings"),
  getInquiries: () => ipcRenderer.invoke("dmc:get-inquiries"),
  createAgent: (data) => ipcRenderer.invoke("dmc:create-agent", data),
  createBooking: (data) => ipcRenderer.invoke("dmc:create-booking", data),
  createInquiry: (data) => ipcRenderer.invoke("dmc:submit-inquiry", data),
  updateInquiryStatus: (id, status) =>
    ipcRenderer.invoke("dmc:update-inquiry-status", id, status),
  updateItinerary: (bookingId, days) =>
    ipcRenderer.invoke("dmc:update-itinerary", bookingId, days),
});
