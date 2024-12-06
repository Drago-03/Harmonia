class PremiumManager {
    constructor() {
      this.premiumServers = new Set();
      this.premiumUsers = new Set();
      this.prices = {
        server: 9.99,  // USD per month
        personal: 4.99  // USD per month
      };
    }
  
    isPremiumServer(guildId) {
      return this.premiumServers.has(guildId);
    }
  
    isPremiumUser(userId) {
      return this.premiumUsers.has(userId);
    }
  
    addPremiumServer(guildId) {
      this.premiumServers.add(guildId);
    }
  
    addPremiumUser(userId) {
      this.premiumUsers.add(userId);
    }
  
    removePremiumServer(guildId) {
      this.premiumServers.delete(guildId);
    }
  
    removePremiumUser(userId) {
      this.premiumUsers.delete(userId);
    }
  
    getPrices() {
      return this.prices;
    }
  }
  
  export default new PremiumManager();