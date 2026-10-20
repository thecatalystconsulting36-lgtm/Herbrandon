// Netlify Blobs storage for published portfolios (built into Netlify — nothing to set up).
let override = null;
exports._setStore = (s) => { override = s; }; // used by tests only
exports.getPortfolios = (event) => {
  if (override) return override;
  const { getStore, connectLambda } = require("@netlify/blobs");
  if (event && connectLambda) connectLambda(event);
  return getStore("portfolios");
};
