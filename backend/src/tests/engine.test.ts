import { describe, it, expect } from 'vitest';
import { parseBenefitText } from '../engine/benefitParser.js';
import { parseEligibilityText } from '../engine/eligibilityParser.js';
import { parseIndianNumericValue, extractMonetaryAmount } from '../engine/numberParser.js';
import { AtomicCondition, CompoundCondition } from '../engine/types.js';

describe('Indian Numeric & Currency Normalizer', () => {
  it('correctly parses Indian Lakh expressions', () => {
    expect(parseIndianNumericValue('₹2.5 lakh')).toBe(250000);
    expect(parseIndianNumericValue('2.5 lakhs')).toBe(250000);
    expect(parseIndianNumericValue('Rs. 1 lakh')).toBe(100000);
    expect(parseIndianNumericValue('0.75 lac')).toBe(75000);
  });

  it('correctly parses Indian Crore expressions', () => {
    expect(parseIndianNumericValue('₹1.2 crore')).toBe(12000000);
    expect(parseIndianNumericValue('1.5 Cr')).toBe(15000000);
  });

  it('correctly parses Thousands and K notation', () => {
    expect(parseIndianNumericValue('50k')).toBe(50000);
    expect(parseIndianNumericValue('20 thousand')).toBe(20000);
  });

  it('correctly parses Indian comma separation (e.g. 1,20,000/-)', () => {
    expect(parseIndianNumericValue('Rs. 1,20,000/-')).toBe(120000);
    expect(parseIndianNumericValue('6,000')).toBe(6000);
  });
});

describe('Benefit Normalization Engine', () => {
  it('correctly handles the problem statement canonical case: "₹6,000 a year in three instalments"', () => {
    const result = parseBenefitText('₹6,000 a year in three instalments');
    expect(result.status).toBe('PARSED');
    expect(result.amount).toBe(6000);
    expect(result.currency).toBe('INR');
    expect(result.frequency).toBe('annual');
    expect(result.numberOfInstalments).toBe(3);
    expect(result.instalmentAmount).toBe(2000);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('handles "Annual scholarship of Rs 1.2 lakh distributed per semester"', () => {
    const result = parseBenefitText('Annual scholarship of Rs 1.2 lakh distributed per semester');
    expect(result.status).toBe('PARSED');
    expect(result.category).toBe('scholarship');
    expect(result.amount).toBe(120000);
    expect(result.currency).toBe('INR');
    expect(result.frequency).toBe('annual');
  });

  it('handles "Monthly pension of Rs 1,000 per month"', () => {
    const result = parseBenefitText('Monthly pension of Rs 1,000 per month');
    expect(result.status).toBe('PARSED');
    expect(result.category).toBe('pension');
    expect(result.amount).toBe(1000);
    expect(result.frequency).toBe('monthly');
  });

  it('handles reverse instalment phrasing: "three instalments of ₹2,000 each"', () => {
    const result = parseBenefitText('three equal instalments of ₹2,000 each');
    expect(result.status).toBe('PARSED');
    expect(result.amount).toBe(6000);
    expect(result.numberOfInstalments).toBe(3);
    expect(result.instalmentAmount).toBe(2000);
  });

  // Strict guardrail / Zero-guessing tests:
  it('sends ambiguous frequency text to review list without guessing', () => {
    const result = parseBenefitText('Distressed artisans will receive occasional financial assistance');
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.reviewReasons).toBeDefined();
    expect(result.reviewReasons?.some(r => r.includes('AMBIGUOUS_FREQUENCY'))).toBe(true);
    expect(result.confidence).toBeLessThan(0.70);
  });

  it('sends subjective amounts to review queue without guessing', () => {
    const result = parseBenefitText('Discretionary handsome grant decided by committee at year end');
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.reviewReasons?.some(r => r.includes('SUBJECTIVE_AMOUNT'))).toBe(true);
  });

  it('sends unbounded percentage subsidies to review queue', () => {
    const result = parseBenefitText('50% subsidy on solar pump machinery');
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.reviewReasons?.some(r => r.includes('UNBOUNDED_PERCENTAGE'))).toBe(true);
  });
});

describe('Eligibility Condition Engine (AST & Boolean Logic)', () => {
  it('correctly handles the canonical case: "SC/ST families with income under ₹2.5 lakh"', () => {
    const result = parseEligibilityText('SC/ST families with income under ₹2.5 lakh');
    expect(result.status).toBe('PARSED');
    expect(result.ast).not.toBeNull();
    expect(result.ast?.type).toBe('COMPOUND');

    const compound = result.ast as CompoundCondition;
    expect(compound.combinator).toBe('AND');
    expect(compound.conditions).toHaveLength(2);

    const socialCondition = compound.conditions.find(
      (c): c is AtomicCondition => c.type === 'ATOMIC' && c.concept === 'social_category'
    );
    expect(socialCondition).toBeDefined();
    expect(socialCondition?.operator).toBe('IN');
    expect(socialCondition?.value).toEqual(['SC', 'ST']);

    const incomeCondition = compound.conditions.find(
      (c): c is AtomicCondition => c.type === 'ATOMIC' && c.concept === 'income'
    );
    expect(incomeCondition).toBeDefined();
    expect(incomeCondition?.operator).toBe('<=');
    expect(incomeCondition?.value).toBe(250000);
    expect(incomeCondition?.unit).toBe('INR/year');
  });

  it('handles multi-concept rule: "Age between 18 and 35 years and resident of Maharashtra"', () => {
    const result = parseEligibilityText('Age between 18 and 35 years and resident of Maharashtra');
    expect(result.status).toBe('PARSED');
    const compound = result.ast as CompoundCondition;

    const ageCond = compound.conditions.find(
      (c): c is AtomicCondition => c.type === 'ATOMIC' && c.concept === 'age'
    );
    expect(ageCond?.operator).toBe('BETWEEN');
    expect(ageCond?.value).toEqual([18, 35]);

    const stateCond = compound.conditions.find(
      (c): c is AtomicCondition => c.type === 'ATOMIC' && c.concept === 'state'
    );
    expect(stateCond?.operator).toBe('==');
    expect(stateCond?.value).toBe('Maharashtra');
  });

  it('handles compound multi-caste with disability and income: "SC/ST/OBC applicants with disability at least 40% and parivar aay under ₹3 lakh"', () => {
    const result = parseEligibilityText('SC/ST/OBC applicants with disability at least 40% and parivar aay under ₹3 lakh');
    expect(result.status).toBe('PARSED');
    const compound = result.ast as CompoundCondition;
    expect(compound.conditions.length).toBeGreaterThanOrEqual(3);

    const cat = compound.conditions.find(c => (c as AtomicCondition).concept === 'social_category') as AtomicCondition;
    expect(cat.value).toEqual(['SC', 'ST', 'OBC']);

    const dis = compound.conditions.find(c => (c as AtomicCondition).concept === 'disability_percentage') as AtomicCondition;
    expect(dis.operator).toBe('>=');
    expect(dis.value).toBe(40);

    const inc = compound.conditions.find(c => (c as AtomicCondition).concept === 'income') as AtomicCondition;
    expect(inc.operator).toBe('<=');
    expect(inc.value).toBe(300000);
  });

  // Strict guardrail / Zero-guessing tests for Eligibility:
  it('sends subjective moral/talent criteria to review list with explicit reason', () => {
    const result = parseEligibilityText('Applicants of good moral character and reputable standing');
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.reviewReasons?.some(r => r.includes('SUBJECTIVE_CRITERIA'))).toBe(true);
  });

  it('sends unknown concepts to review list without guessing', () => {
    const result = parseEligibilityText('Patriotic families of freedom fighters');
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.reviewReasons?.some(r => r.includes('UNKNOWN_CONCEPT'))).toBe(true);
  });

  it('sends fuzzy unquantified operators to review queue', () => {
    const result = parseEligibilityText('Family income approximately around 2 lakhs');
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.reviewReasons?.some(r => r.includes('AMBIGUOUS_OPERATOR'))).toBe(true);
  });

  it('handles gender + state + age range + income in one statement', () => {
    const text = 'Women resident of Madhya Pradesh aged between 21 and 60 years with family income under ₹2.5 lakh';
    const result = parseEligibilityText(text);
    expect(result.status).toBe('PARSED');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);

    const compound = result.ast as CompoundCondition;
    expect(compound.conditions.length).toBe(4);

    const gender = compound.conditions.find(c => (c as AtomicCondition).concept === 'gender') as AtomicCondition;
    expect(gender.value).toBe('Female');

    const state = compound.conditions.find(c => (c as AtomicCondition).concept === 'state') as AtomicCondition;
    expect(state.value).toBe('Madhya Pradesh');

    const age = compound.conditions.find(c => (c as AtomicCondition).concept === 'age') as AtomicCondition;
    expect(age.operator).toBe('BETWEEN');
    expect(age.value).toEqual([21, 60]);

    const income = compound.conditions.find(c => (c as AtomicCondition).concept === 'income') as AtomicCondition;
    expect(income.operator).toBe('<=');
    expect(income.value).toBe(250000);
  });

  it('handles BPL families with minimum age for pensions', () => {
    const text = 'Senior citizens with age at least 60 years belonging to BPL card category residing in Maharashtra';
    const result = parseEligibilityText(text);
    expect(result.status).toBe('PARSED');

    const compound = result.ast as CompoundCondition;
    const bpl = compound.conditions.find(c => (c as AtomicCondition).concept === 'bpl_status') as AtomicCondition;
    expect(bpl.value).toBe(true);

    const age = compound.conditions.find(c => (c as AtomicCondition).concept === 'age') as AtomicCondition;
    expect(age.operator).toBe('>=');
    expect(age.value).toBe(60);
  });

  it('handles agricultural land conditions for farmers', () => {
    const text = 'Small and marginal farmers having cultivable land up to 2 hectares and parivar aay under 2.5 lakh';
    const result = parseEligibilityText(text);
    expect(result.status).toBe('PARSED');

    const compound = result.ast as CompoundCondition;
    const land = compound.conditions.find(c => (c as AtomicCondition).concept === 'land_holding') as AtomicCondition;
    expect(land.operator).toBe('<=');
    expect(land.value).toBe(2);
    expect(land.unit).toBe('hectares');
  });
});
