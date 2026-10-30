import { BenefitRow } from './types.js';
import { BENEFIT_CATEGORIES, BENEFIT_TYPES } from './concepts.js';
import { extractMonetaryAmount, parseIndianNumericValue, wordToNumber } from './numberParser.js';

export function parseBenefitText(rawText: string, id: string = `ben_${Date.now()}`): BenefitRow {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const reasons: string[] = [];
  let confidence = 1.0;

  // 1. Check for empty or excessively vague input
  if (!text || text.length < 3) {
    return {
      id,
      rawText,
      category: 'unknown',
      type: 'unknown',
      amount: null,
      currency: 'INR',
      frequency: null,
      numberOfInstalments: null,
      instalmentAmount: null,
      confidence: 0,
      status: 'NEEDS_REVIEW',
      reviewReasons: ['EMPTY_OR_UNREADABLE: Input text is empty or too short.']
    };
  }

  // 2. Identify Category
  let category = 'financial_assistance';
  let categoryMatched = false;
  for (const [catKey, catDef] of Object.entries(BENEFIT_CATEGORIES)) {
    if (catDef.aliases.some(alias => lower.includes(alias))) {
      category = catKey;
      categoryMatched = true;
      break;
    }
  }
  if (!categoryMatched) {
    // If not explicitly matched by alias, check if it's purely monetary
    if (lower.includes('pension')) category = 'pension';
    else if (lower.includes('scholarship') || lower.includes('stipend')) category = 'scholarship';
    else if (lower.includes('house') || lower.includes('awaas') || lower.includes('housing')) category = 'housing_grant';
    else {
      confidence -= 0.15; // Unspecified category penalty
    }
  }

  // 3. Identify Benefit Type
  let benefitType = 'direct_benefit_transfer_dbt';
  let typeMatched = false;
  for (const [typeKey, typeDef] of Object.entries(BENEFIT_TYPES)) {
    if (typeDef.aliases.some(alias => lower.includes(alias))) {
      benefitType = typeKey;
      typeMatched = true;
      break;
    }
  }
  if (!typeMatched) {
    if (lower.includes('cash') || lower.includes('samman') || lower.includes('instalment')) {
      benefitType = 'cash_transfer';
    } else if (lower.includes('waiver') || lower.includes('concession')) {
      benefitType = 'fee_waiver';
    } else if (lower.includes('loan') || lower.includes('credit')) {
      benefitType = 'subsidized_loan';
    } else if (lower.includes('kit') || lower.includes('cycle') || lower.includes('tablet')) {
      benefitType = 'in_kind';
    } else {
      benefitType = 'cash_transfer';
      confidence -= 0.10;
    }
  }

  // 4. Extract Amount & Currency
  let amount: number | null = null;
  let currency = 'INR';

  // Check for ambiguous or subjective amount phrasing
  const subjectivePatterns = [
    /reasonable/i, /handsome/i, /as decided by/i, /discretionary/i,
    /variable/i, /to be announced/i, /tbd/i, /subject to funds/i
  ];
  for (const pattern of subjectivePatterns) {
    if (pattern.test(lower)) {
      reasons.push(`SUBJECTIVE_AMOUNT: Statement contains non-deterministic amount criteria (${lower.match(pattern)?.[0]}).`);
      confidence -= 0.40;
    }
  }

  // Handle Percentage Subsidy without ceiling: e.g. "50% subsidy"
  const percentageMatch = lower.match(/(\d+)\s*%/);
  if (percentageMatch && !lower.match(/subject to|max|maximum|ceiling|upto|up to/)) {
    reasons.push(`UNBOUNDED_PERCENTAGE: Benefit provides ${percentageMatch[1]}% subsidy without specifying an absolute monetary cap.`);
    confidence -= 0.35;
  }

  const monetary = extractMonetaryAmount(text);
  if (monetary) {
    amount = monetary.amount;
    currency = monetary.currency;
  } else if (benefitType === 'fee_waiver' && (lower.includes('100%') || lower.includes('full'))) {
    amount = 100; // 100% waiver
  } else if (benefitType === 'in_kind') {
    amount = null; // In-kind item
  } else {
    reasons.push('MISSING_AMOUNT: Unable to extract a deterministic numeric benefit amount.');
    confidence -= 0.50;
  }

  // 5. Extract Frequency & Instalments
  let frequency: BenefitRow['frequency'] = null;
  let numberOfInstalments: number | null = null;
  let instalmentAmount: number | null = null;

  if (lower.match(/\b(a year|per year|annual|annually|yearly|per annum|\/yr|\/year|\/annum)\b/)) {
    frequency = 'annual';
  } else if (lower.match(/\b(per month|monthly|a month|\/month|\/mth|pratimaah)\b/)) {
    frequency = 'monthly';
  } else if (lower.match(/\b(per quarter|quarterly|every 3 months|every three months)\b/)) {
    frequency = 'quarterly';
  } else if (lower.match(/\b(per semester|each semester|every semester)\b/)) {
    frequency = 'per_semester';
  } else if (lower.match(/\b(one time|one-time|lump sum|single instalment|single payment|at the time of)\b/)) {
    frequency = 'one_time';
    numberOfInstalments = 1;
  } else if (lower.match(/\b(per instalment|per installment|each instalment|per payment)\b/)) {
    frequency = 'per_instalment';
  }

  // Check for ambiguous frequencies
  const ambiguousFreqPatterns = [/occasional/i, /from time to time/i, /periodically/i, /as needed/i, /intermittent/i];
  for (const pattern of ambiguousFreqPatterns) {
    if (pattern.test(lower)) {
      reasons.push(`AMBIGUOUS_FREQUENCY: Non-deterministic frequency term '${lower.match(pattern)?.[0]}' detected.`);
      confidence -= 0.40;
    }
  }

  // Pattern A: "three instalments of ₹2,000 each", "3 instalments of 2000 each"
  const eachMatch = lower.match(/(\w+|\d+)\s*(?:equal\s+)?(?:instalments?|installments?|tranches?)\s+of\s+([₹rsinr\d,\.\s]+(?:crores?|cr|lakhs?|lacs?|lac|thousands?|k)?)\s*(?:each)?/i);
  if (eachMatch) {
    const count = wordToNumber(eachMatch[1]);
    const perInstalmentMonetary = extractMonetaryAmount(eachMatch[2] || '');
    if (count && perInstalmentMonetary) {
      numberOfInstalments = count;
      instalmentAmount = perInstalmentMonetary.amount;
      amount = count * perInstalmentMonetary.amount;
      if (!frequency) {
        frequency = 'per_instalment';
      }
    }
  }

  // Pattern B: "in three instalments", "in 3 instalments", "3 equal instalments", "4 tranches"
  if (!numberOfInstalments) {
    const instalmentMatch = lower.match(/(?:in\s+)?(\w+|\d+)\s*(?:equal\s+)?(?:instalments?|installments?|tranches?|cycles?)/i);
    if (instalmentMatch) {
      const rawVal = instalmentMatch[1];
      const parsedNum = wordToNumber(rawVal);
      if (parsedNum !== null && parsedNum > 0) {
        numberOfInstalments = parsedNum;
      } else {
        reasons.push(`UNPARSEABLE_INSTALMENTS: Could not parse instalment quantity from '${rawVal}'.`);
        confidence -= 0.25;
      }
    }
  }

  // Reconcile frequency and instalments
  if (!frequency && benefitType !== 'in_kind' && benefitType !== 'fee_waiver') {
    if (numberOfInstalments && numberOfInstalments > 1) {
      if (lower.includes('year') || lower.includes('annum')) {
        frequency = 'annual';
      } else {
        frequency = 'per_instalment';
      }
    } else {
      reasons.push('MISSING_FREQUENCY: Payment cadence (annual, monthly, one-time) could not be identified with confidence.');
      confidence -= 0.30;
    }
  }

  // Compute or verify instalment amount
  // Case: "₹6,000 a year in three instalments" -> instalmentAmount = 6000 / 3 = 2000
  if (amount !== null && numberOfInstalments && numberOfInstalments > 0 && !instalmentAmount) {
    instalmentAmount = Math.round(amount / numberOfInstalments);
  }

  // 7. Strict Confidence Gatekeeper
  confidence = Math.max(0, Math.min(1.0, parseFloat(confidence.toFixed(2))));
  const status: 'PARSED' | 'NEEDS_REVIEW' = (confidence >= 0.70 && reasons.length === 0) ? 'PARSED' : 'NEEDS_REVIEW';

  return {
    id,
    rawText,
    category,
    type: benefitType,
    amount,
    currency,
    frequency,
    numberOfInstalments,
    instalmentAmount,
    confidence,
    status,
    reviewReasons: reasons.length > 0 ? reasons : undefined
  };
}
