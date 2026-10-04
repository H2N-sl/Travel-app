function createAdminAuth() {
  const authenticatedSenders = new Set();

  return {
    unlock(senderId) {
      authenticatedSenders.add(senderId);
      return true;
    },
    logout: (senderId) => authenticatedSenders.delete(senderId),
    isAuthenticated: (senderId) => authenticatedSenders.has(senderId),
  };
}

module.exports = { createAdminAuth };
