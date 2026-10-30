/**
 * Normalizes Indian currency strings, Indian numeric scale (lakh, crore, thousand, k),
 * comma notation (e.g. 1,50,000), and numeric words.
 */

const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12
};

export interface ParsedMonetaryValue {
  amount: number;
  currency: string;
  rawMatched: string;
}

export function wordToNumber(word: string): number | null {
  const clean = word.toLowerCase().trim();
  if (WORD_TO_NUMBER[clean] !== undefined) {
    return WORD_TO_NUMBER[clean];
  }
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parses Indian numeric expressions like "₹2.5 lakh", "Rs 6,000/-", "1.2 crore", "50k"
 */
export function parseIndianNumericValue(text: string): number | null {
  if (!text) return null;

  // Clean trailing punctuation and symbols
  let cleaned = text.trim().toLowerCase();

  // Remove currency marks for calculation
  cleaned = cleaned.replace(/₹|rs\.?|inr|\/[-–]/gi, '').trim();

  // Match: (optional number with decimals or commas) followed by scale (crore/lakh/k/thousand)
  // Example: "2.5 lakh", "1.2 crore", "50 thousand", "75k", "1,50,000"
  
  // 1. Crores: 1 Cr = 10,000,000
  const croreMatch = cleaned.match(/([\d,]+(?:\.\d+)?)\s*(?:crores?|cr\.?)/i);
  if (croreMatch) {
    const base = parseFloat(croreMatch[1].replace(/,/g, ''));
    if (!isNaN(base)) return Math.round(base * 10000000);
  }

  // 2. Lakhs: 1 Lakh = 100,000
  const lakhMatch = cleaned.match(/([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lac|l(?!\w))/i);
  if (lakhMatch) {
    const base = parseFloat(lakhMatch[1].replace(/,/g, ''));
    if (!isNaN(base)) return Math.round(base * 100000);
  }

  // 3. Thousands / K: 1 Thousand = 1,000
  const thousandMatch = cleaned.match(/([\d,]+(?:\.\d+)?)\s*(?:thousands?|k(?!\w))/i);
  if (thousandMatch) {
    const base = parseFloat(thousandMatch[1].replace(/,/g, ''));
    if (!isNaN(base)) return Math.round(base * 1000);
  }

  // 4. Standard Indian comma formatted or raw digits: "1,50,000" or "6000"
  const rawNumMatch = cleaned.match(/([\d,]+(?:\.\d+)?)/);
  if (rawNumMatch) {
    const rawVal = parseFloat(rawNumMatch[1].replace(/,/g, ''));
    if (!isNaN(rawVal)) return Math.round(rawVal);
  }

  return null;
}

/**
 * Extracts monetary amount with currency detection
 */
export function extractMonetaryAmount(text: string): ParsedMonetaryValue | null {
  // Regex to match currency prefixes or suffixes (e.g., ₹2.5 lakh, Rs 6000, 1.2 crore rupees)
  const prefixRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?(?:\s*(?:crores?|cr|lakhs?|lacs?|lac|thousands?|k))?)/i;
  const suffixRegex = /([\d,]+(?:\.\d+)?(?:\s*(?:crores?|cr|lakhs?|lacs?|lac|thousands?|k))?)\s*(?:rupees|inr|\/-)/i;

  const prefixMatch = text.match(prefixRegex);
  if (prefixMatch) {
    const amount = parseIndianNumericValue(prefixMatch[0]);
    if (amount !== null) {
      return { amount, currency: 'INR', rawMatched: prefixMatch[0] };
    }
  }

  const suffixMatch = text.match(suffixRegex);
  if (suffixMatch) {
    const amount = parseIndianNumericValue(suffixMatch[0]);
    if (amount !== null) {
      return { amount, currency: 'INR', rawMatched: suffixMatch[0] };
    }
  }

  // Fallback: look for standalone number if context is purely monetary or simple
  const plainNumber = parseIndianNumericValue(text);
  if (plainNumber !== null) {
    return {
      amount: plainNumber,
      currency: 'INR',
      rawMatched: text.trim()
    };
  }

  return null;
}

/**
 * Parses numeric ranges like:
 * - "between 18 and 35"
 * - "18 to 35 years"
 * - "18-35"
 * - "18 and 40"
 */
export function extractNumericRange(text: string): [number, number] | null {
  const rangeRegex = /(?:between\s+)?(\d+(?:\.\d+)?)\s*(?:to|and|-|–)\s*(\d+(?:\.\d+)?)/i;
  const match = text.match(rangeRegex);
  if (match) {
    const lower = parseFloat(match[1]);
    const upper = parseFloat(match[2]);
    if (!isNaN(lower) && !isNaN(upper)) {
      return [Math.min(lower, upper), Math.max(lower, upper)];
    }
  }
  return null;
}
