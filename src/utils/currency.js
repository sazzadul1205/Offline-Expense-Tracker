// src/utils/currency.js

export const CURRENCY = "BDT";
export const CURRENCY_SYMBOL = "৳";

// Format currency for BDT - English digits, commas for thousands
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format currency without symbol for input fields - English digits
export const formatNumber = (amount) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Parse amount from string to number
export const parseAmount = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  // Remove currency symbol and commas, then parse
  const cleanValue = value.toString().replace(/[^\d.-]/g, "");
  return parseFloat(cleanValue) || 0;
};

// Get currency symbol for display
export const getCurrencySymbol = () => CURRENCY_SYMBOL;
