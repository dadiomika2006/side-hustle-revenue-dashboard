// Exchange rates baseline (relative to USD)
const RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.51,
  CAD: 1.36
};

/**
 * Get exchange rate from one currency to another
 * @param {string} from 
 * @param {string} to 
 * @returns {number}
 */
function getExchangeRate(from, to) {
  const f = (from || 'USD').toUpperCase();
  const t = (to || 'USD').toUpperCase();
  if (f === t) return 1.0;
  
  const rateFrom = RATES[f] || 1.0;
  const rateTo = RATES[t] || 1.0;
  
  // Example: EUR -> GBP
  // EUR is 0.92 per USD, GBP is 0.79 per USD.
  // 1 EUR = (1 / 0.92) USD = 1.087 USD
  // 1.087 USD * 0.79 = 0.858 GBP.
  // Formula: (1 / rateFrom) * rateTo = rateTo / rateFrom
  return rateTo / rateFrom;
}

/**
 * Convert amount from one currency to another
 * @param {number} amount 
 * @param {string} from 
 * @param {string} to 
 * @returns {number}
 */
function convertCurrency(amount, from, to) {
  if (!amount || isNaN(amount)) return 0;
  const rate = getExchangeRate(from, to);
  return amount * rate;
}

module.exports = {
  RATES,
  getExchangeRate,
  convertCurrency
};
