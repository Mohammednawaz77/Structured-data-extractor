import { 
  AtomicCondition, 
  CompoundCondition, 
  EligibilityConditionNode, 
  EligibilityParseResult, 
  Operator 
} from './types.js';
import { ELIGIBILITY_CONCEPTS } from './concepts.js';
import { extractMonetaryAmount, extractNumericRange, parseIndianNumericValue } from './numberParser.js';

export function parseEligibilityText(
  rawText: string, 
  id: string = `elig_${Date.now()}`
): EligibilityParseResult {
  const text = rawText.trim();
  const reasons: string[] = [];
  let confidence = 1.0;

  if (!text || text.length < 3) {
    return {
      id,
      rawText,
      ast: null,
      confidence: 0,
      status: 'NEEDS_REVIEW',
      reviewReasons: ['EMPTY_INPUT: Input eligibility text is empty or blank.']
    };
  }

  // 1. Check for known subjective / non-deterministic words
  const subjectivePatterns = [
    { pattern: /\b(good moral|moral character|reputable|decent family)\b/i, reason: "SUBJECTIVE_CRITERIA: 'Moral character/repute' cannot be evaluated deterministically." },
    { pattern: /\b(meritorious|promising|exceptional talent)\b/i, reason: "SUBJECTIVE_CRITERIA: 'Merit/talent' requires defined academic thresholds (marks/grades)." },
    { pattern: /\b(hardworking|dedicated|deserving|needy)\b/i, reason: "SUBJECTIVE_CRITERIA: 'Deserving/needy' is subjective; requires explicit income/wealth limits." },
    { pattern: /\b(approx|approximately|around|nearly|roughly)\b/i, reason: "AMBIGUOUS_OPERATOR: Fuzzy qualifiers ('approx', 'around') prevent strict eligibility boundary checks." }
  ];

  for (const item of subjectivePatterns) {
    if (item.pattern.test(text)) {
      reasons.push(item.reason);
      confidence -= 0.45;
    }
  }

  // 2. Check for unknown concepts or untracked administrative policies
  const untrackedPhrases = [
    { pattern: /\b(freedom fighter|patriotic|martyr family)\b/i, reason: "UNKNOWN_CONCEPT: 'Freedom fighter/martyr status' is not in standard eligibility ontology." },
    { pattern: /\b(covid orphan|pandemic affected)\b/i, reason: "UNKNOWN_CONCEPT: 'Covid affected/orphan' requires specific scheme certificate mapping." }
  ];

  for (const item of untrackedPhrases) {
    if (item.pattern.test(text)) {
      reasons.push(item.reason);
      confidence -= 0.40;
    }
  }

  // 3. Clause Splitting & AST building
  // Government criteria are often compound: "Clause A AND Clause B", or with clauses: "SC/ST families WITH income < 2.5 lakh"
  const atomicConditions: AtomicCondition[] = [];

  // A. Check for Social Category (SC/ST/OBC/General/EWS)
  const socialCatCondition = extractSocialCategoryCondition(text);
  if (socialCatCondition) {
    atomicConditions.push(socialCatCondition);
  }

  // B. Check for Income Condition
  const incomeCondition = extractIncomeCondition(text);
  if (incomeCondition) {
    atomicConditions.push(incomeCondition);
  }

  // C. Check for Age Condition (single value, min/max, or range)
  const ageCondition = extractAgeCondition(text);
  if (ageCondition) {
    atomicConditions.push(ageCondition);
  }

  // D. Check for State / Domicile Condition
  const stateCondition = extractStateCondition(text);
  if (stateCondition) {
    atomicConditions.push(stateCondition);
  }

  // E. Check for Gender Condition
  const genderCondition = extractGenderCondition(text);
  if (genderCondition) {
    atomicConditions.push(genderCondition);
  }

  // F. Check for Land Holding Condition
  const landCondition = extractLandCondition(text);
  if (landCondition) {
    atomicConditions.push(landCondition);
  }

  // G. Check for Occupation Condition
  const occupationCondition = extractOccupationCondition(text);
  if (occupationCondition) {
    atomicConditions.push(occupationCondition);
  }

  // H. Check for Disability Percentage Condition
  const disabilityCondition = extractDisabilityCondition(text);
  if (disabilityCondition) {
    atomicConditions.push(disabilityCondition);
  }

  // I. Check for Marital Status Condition
  const maritalCondition = extractMaritalStatusCondition(text);
  if (maritalCondition) {
    atomicConditions.push(maritalCondition);
  }

  // J. Check for BPL / Antyodaya Condition
  const bplCondition = extractBplCondition(text);
  if (bplCondition) {
    atomicConditions.push(bplCondition);
  }

  // 4. Verify coverage: If the text had words that weren't parsed into any condition
  if (atomicConditions.length === 0) {
    reasons.push("NO_CONDITIONS_IDENTIFIED: No standard eligibility concepts (age, income, category, state, land, occupation) could be reliably extracted.");
    confidence = 0.1;
  } else {
    // Check if there are complex clauses that might have been skipped
    const textLower = text.toLowerCase();
    const hasUnparsedClause = detectUnparsedCriteria(textLower);
    if (hasUnparsedClause) {
      reasons.push(hasUnparsedClause);
      confidence -= 0.35;
    }
  }

  // 5. Build Boolean AST (Root is AND unless specific top-level OR is detected)
  let rootAst: EligibilityConditionNode | null = null;
  if (atomicConditions.length === 1) {
    rootAst = atomicConditions[0];
  } else if (atomicConditions.length > 1) {
    // Detect whether clauses are linked by OR or AND
    // Usually criteria across different concepts (e.g. Caste AND Income AND Age) are ANDed
    const hasTopLevelOr = /\b(either|or)\b/i.test(text) && !/(sc|st|obc)\s+or\s+(sc|st|obc)/i.test(text);
    rootAst = {
      type: 'COMPOUND',
      combinator: hasTopLevelOr ? 'OR' : 'AND',
      conditions: atomicConditions,
      confidence: parseFloat((atomicConditions.reduce((acc, c) => acc + c.confidence, 0) / atomicConditions.length).toFixed(2))
    };
  }

  confidence = Math.max(0, Math.min(1.0, parseFloat(confidence.toFixed(2))));
  const status: 'PARSED' | 'NEEDS_REVIEW' = (confidence >= 0.70 && reasons.length === 0 && rootAst !== null) 
    ? 'PARSED' 
    : 'NEEDS_REVIEW';

  return {
    id,
    rawText,
    ast: rootAst,
    confidence,
    status,
    reviewReasons: reasons.length > 0 ? reasons : undefined
  };
}

// ----------------- Extractors -----------------

function extractSocialCategoryCondition(text: string): AtomicCondition | null {
  const lower = text.toLowerCase();
  const matchedCategories: string[] = [];

  // SC & ST combined: "SC/ST", "SC or ST", "SC and ST"
  if (/(sc\/st|sc\s+and\s+st|sc\s+or\s+st|scheduled\s+caste)/i.test(lower)) {
    matchedCategories.push('SC', 'ST');
  } else {
    if (/\b(sc|scheduled\s+caste)\b/i.test(lower)) matchedCategories.push('SC');
    if (/\b(st|scheduled\s+tribe)\b/i.test(lower)) matchedCategories.push('ST');
  }

  if (/\b(obc|other\s+backward\s+classes?)\b/i.test(lower)) matchedCategories.push('OBC');
  if (/\b(ews|economically\s+weaker\s+section)\b/i.test(lower)) matchedCategories.push('EWS');
  if (/\b(minority|minorities)\b/i.test(lower)) matchedCategories.push('Minority');
  if (/\b(general\s+category|gen\b)/i.test(lower)) matchedCategories.push('General');

  const unique = Array.from(new Set(matchedCategories));
  if (unique.length > 0) {
    return {
      type: 'ATOMIC',
      concept: 'social_category',
      conceptLabel: ELIGIBILITY_CONCEPTS.social_category.label,
      operator: unique.length > 1 ? 'IN' : '==',
      value: unique.length > 1 ? unique : unique[0],
      confidence: 0.98,
      rawSnippet: unique.join('/')
    };
  }
  return null;
}

function extractIncomeCondition(text: string): AtomicCondition | null {
  // Look for income keywords followed by operator and amount
  // "income under ₹2.5 lakh", "income <= 250000", "income below Rs 1,50,000", "income not exceeding 3 lakh"
  const incomePattern = /(?:income|parivar\s+aay|household\s+income|earnings?)\s*(?:is|of)?\s*(under|below|less\s+than|up\s+to|upto|not\s+exceeding|<=|<|above|greater\s+than|more\s+than|>=|>)?\s*([₹rsinr\d,\.\s]+(?:crores?|cr|lakhs?|lacs?|lac|thousands?|k)?(?:\s*rupees)?)/i;
  
  let match = text.match(incomePattern);
  if (!match) {
    // Alternative: "under ₹2.5 lakh income", "below 2.5 lakh annual income"
    const altPattern = /(under|below|less\s+than|up\s+to|upto|not\s+exceeding|<=|<|above|greater\s+than|>=|>)\s*([₹rsinr\d,\.\s]+(?:crores?|cr|lakhs?|lacs?|lac|thousands?|k)?)\s*(?:annual\s+)?income/i;
    match = text.match(altPattern);
  }

  if (match) {
    const rawOp = match[1] ? match[1].toLowerCase().trim() : 'under';
    const rawVal = match[2];
    const numeric = extractMonetaryAmount(rawVal) || { amount: parseIndianNumericValue(rawVal), currency: 'INR' };

    if (numeric.amount !== null && !isNaN(numeric.amount)) {
      let op: Operator = '<=';
      if (rawOp.includes('above') || rawOp.includes('greater') || rawOp.includes('more') || rawOp.includes('>')) {
        op = rawOp.includes('>=') ? '>=' : '>';
      } else if (rawOp.includes('<=')) {
        op = '<=';
      } else if (rawOp.includes('<')) {
        op = '<';
      }

      return {
        type: 'ATOMIC',
        concept: 'income',
        conceptLabel: ELIGIBILITY_CONCEPTS.income.label,
        operator: op,
        value: numeric.amount,
        unit: 'INR/year',
        confidence: 0.96,
        rawSnippet: match[0]
      };
    }
  }

  return null;
}

function extractAgeCondition(text: string): AtomicCondition | null {
  // 1. Range: "age between 18 and 35", "age 18 to 35 years", "18-35 years of age"
  const rangePattern = /(?:age\s+)?(?:between\s+)?(\d+)\s*(?:to|and|-|–)\s*(\d+)\s*(?:years|yrs|years\s+of\s+age)?/i;
  if (/age|years\s+old|years\s+of\s+age|umar/i.test(text)) {
    const rangeMatch = text.match(rangePattern);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1], 10);
      const max = parseInt(rangeMatch[2], 10);
      if (min >= 0 && max <= 120 && min < max) {
        return {
          type: 'ATOMIC',
          concept: 'age',
          conceptLabel: ELIGIBILITY_CONCEPTS.age.label,
          operator: 'BETWEEN',
          value: [min, max],
          unit: 'years',
          confidence: 0.98,
          rawSnippet: rangeMatch[0]
        };
      }
    }
  }

  // 2. Single threshold: "age above 60 years", "age at least 18", "age under 25", "minimum age 21"
  const singlePattern = /(?:age|umar)\s*(?:of|is)?\s*(at\s+least|minimum|min|above|greater\s+than|>=|>|under|below|up\s+to|maximum|max|<=|<)?\s*(\d+)\s*(?:years|yrs)?/i;
  const match = text.match(singlePattern);
  if (match) {
    const rawOp = match[1] ? match[1].toLowerCase() : '>=';
    const ageVal = parseInt(match[2], 10);
    if (!isNaN(ageVal) && ageVal > 0 && ageVal <= 120) {
      let op: Operator = '>=';
      if (rawOp.includes('under') || rawOp.includes('below') || rawOp.includes('max') || rawOp.includes('<')) {
        op = '<=';
      } else {
        op = '>=';
      }

      return {
        type: 'ATOMIC',
        concept: 'age',
        conceptLabel: ELIGIBILITY_CONCEPTS.age.label,
        operator: op,
        value: ageVal,
        unit: 'years',
        confidence: 0.95,
        rawSnippet: match[0]
      };
    }
  }

  return null;
}

function extractStateCondition(text: string): AtomicCondition | null {
  const recognizedStates = ELIGIBILITY_CONCEPTS.state.allowedValues || [];
  for (const st of recognizedStates) {
    const regex = new RegExp(`\\b(?:resident\\s+of|residing\\s+in|domicile\\s+of|native\\s+of)?\\s*(${st})\\b`, 'i');
    if (regex.test(text)) {
      return {
        type: 'ATOMIC',
        concept: 'state',
        conceptLabel: ELIGIBILITY_CONCEPTS.state.label,
        operator: '==',
        value: st,
        confidence: 0.98,
        rawSnippet: st
      };
    }
  }
  return null;
}

function extractGenderCondition(text: string): AtomicCondition | null {
  const lower = text.toLowerCase();
  if (/\b(women|woman|girl|female|mahila|kanya|widow)\b/i.test(lower)) {
    return {
      type: 'ATOMIC',
      concept: 'gender',
      conceptLabel: ELIGIBILITY_CONCEPTS.gender.label,
      operator: '==',
      value: 'Female',
      confidence: 0.98,
      rawSnippet: 'Female'
    };
  }
  if (/\b(transgender|third\s+gender)\b/i.test(lower)) {
    return {
      type: 'ATOMIC',
      concept: 'gender',
      conceptLabel: ELIGIBILITY_CONCEPTS.gender.label,
      operator: '==',
      value: 'Transgender',
      confidence: 0.98,
      rawSnippet: 'Transgender'
    };
  }
  return null;
}

function extractLandCondition(text: string): AtomicCondition | null {
  const match = text.match(/(?:land|landholding|cultivable\s+land)\s*(?:is|of)?\s*(under|up\s+to|upto|less\s+than|<=|<|above|more\s+than|>=|>)?\s*(\d+(?:\.\d+)?)\s*(acres?|hectares?|bigha)/i);
  if (match) {
    const rawOp = match[1] || 'under';
    const amount = parseFloat(match[2]);
    const unit = match[3].toLowerCase().startsWith('hect') ? 'hectares' : 'acres';

    return {
      type: 'ATOMIC',
      concept: 'land_holding',
      conceptLabel: ELIGIBILITY_CONCEPTS.land_holding.label,
      operator: (rawOp.includes('above') || rawOp.includes('>')) ? '>=' : '<=',
      value: amount,
      unit,
      confidence: 0.94,
      rawSnippet: match[0]
    };
  }

  // Also recognize "small/marginal farmers" -> land <= 2 hectares (standard Indian norm)
  if (/\b(small\s+(?:and|\/)?\s*marginal\s+farmers?|marginal\s+farmer)\b/i.test(text)) {
    return {
      type: 'ATOMIC',
      concept: 'land_holding',
      conceptLabel: ELIGIBILITY_CONCEPTS.land_holding.label,
      operator: '<=',
      value: 2,
      unit: 'hectares',
      confidence: 0.90,
      rawSnippet: 'Small and marginal farmer (<= 2 hectares)'
    };
  }

  return null;
}

function extractOccupationCondition(text: string): AtomicCondition | null {
  const lower = text.toLowerCase();
  const occMap: Record<string, string> = {
    'construction worker': 'Construction Worker',
    'bocw': 'Construction Worker',
    'artisan': 'Artisan',
    'weaver': 'Artisan',
    'street vendor': 'Street Vendor',
    'hawker': 'Street Vendor',
    'farmer': 'Small/Marginal Farmer',
    'kisan': 'Small/Marginal Farmer',
    'student': 'Student'
  };

  for (const [key, val] of Object.entries(occMap)) {
    if (lower.includes(key)) {
      return {
        type: 'ATOMIC',
        concept: 'occupation',
        conceptLabel: ELIGIBILITY_CONCEPTS.occupation.label,
        operator: '==',
        value: val,
        confidence: 0.92,
        rawSnippet: key
      };
    }
  }
  return null;
}

function extractDisabilityCondition(text: string): AtomicCondition | null {
  const match = text.match(/(?:disability|pwd|handicapped|divyang)\s*(?:percentage|of)?\s*(at\s+least|minimum|>=|>)?\s*(\d+)\s*%/i);
  if (match) {
    const val = parseInt(match[2], 10);
    return {
      type: 'ATOMIC',
      concept: 'disability_percentage',
      conceptLabel: ELIGIBILITY_CONCEPTS.disability_percentage.label,
      operator: '>=',
      value: val,
      unit: '%',
      confidence: 0.96,
      rawSnippet: match[0]
    };
  }
  return null;
}

function extractMaritalStatusCondition(text: string): AtomicCondition | null {
  const lower = text.toLowerCase();
  if (/\b(widow|widowed)\b/i.test(lower)) {
    return {
      type: 'ATOMIC',
      concept: 'marital_status',
      conceptLabel: ELIGIBILITY_CONCEPTS.marital_status.label,
      operator: '==',
      value: 'Widowed',
      confidence: 0.98,
      rawSnippet: 'Widow'
    };
  }
  if (/\b(divorced|destitute\s+woman)\b/i.test(lower)) {
    return {
      type: 'ATOMIC',
      concept: 'marital_status',
      conceptLabel: ELIGIBILITY_CONCEPTS.marital_status.label,
      operator: '==',
      value: 'Divorced',
      confidence: 0.95,
      rawSnippet: 'Divorced'
    };
  }
  return null;
}

function extractBplCondition(text: string): AtomicCondition | null {
  const lower = text.toLowerCase();
  if (/\b(bpl|below\s+poverty\s+line|antyodaya|aay\s+card|yellow\s+ration\s+card)\b/i.test(lower)) {
    return {
      type: 'ATOMIC',
      concept: 'bpl_status',
      conceptLabel: ELIGIBILITY_CONCEPTS.bpl_status.label,
      operator: '==',
      value: true,
      confidence: 0.96,
      rawSnippet: 'BPL / Antyodaya'
    };
  }
  return null;
}

function detectUnparsedCriteria(textLower: string): string | null {
  // If text has phrases indicating qualifications that were not covered by standard ontology
  if (textLower.includes('having passed') || textLower.includes('matric') || textLower.includes('10th pass')) {
    return "UNSUPPORTED_QUALIFIER: Educational qualification criteria detected without standardized grade/exam concept.";
  }
  if (textLower.includes('bank account') || textLower.includes('aadhaar')) {
    return "ADMINISTRATIVE_PREREQUISITE: Bank account/Aadhaar seeding is an operational requirement rather than an eligibility demographic condition.";
  }
  return null;
}
