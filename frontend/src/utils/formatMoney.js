/**
 * Returns a locale string for a currency code.
 *
 * @param {string} currency
 * @returns {string}
 */
const getLocaleForCurrency = (currency) => {
  const map = {
    USD: 'en-US',
    EUR: 'en-IE',
    GBP: 'en-GB',
    AUD: 'en-AU',
    CAD: 'en-CA',
    INR: 'en-IN'
  };
  return map[currency] || navigator.language || 'en-US';
};

/**
 * Formats a numerical amount as a currency string.
 *
 * @param {number} amount - The amount to format.
 * @param {string} [currency=INR] - The currency code.
 * @param {number} [minimumFractionDigits=2]
 * @param {number} [maximumFractionDigits=2]
 * @returns {string} The formatted currency string.
 */
export const formatMoney = (
  amount,
  currency = 'INR',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
) => {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

export default formatMoney;