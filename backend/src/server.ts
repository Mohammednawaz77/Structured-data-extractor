import express, { Request, Response } from 'express';
import cors from 'cors';
import { parseBenefitText } from './engine/benefitParser.js';
import { parseEligibilityText } from './engine/eligibilityParser.js';
import { ELIGIBILITY_CONCEPTS, BENEFIT_CATEGORIES, BENEFIT_TYPES } from './engine/concepts.js';
import { REAL_WORLD_SCHEME_FIXTURES } from './engine/fixtures.js';
import { reviewQueue } from './engine/reviewQueue.js';
import { SchemeDocument } from './engine/types.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory Scheme Repository (pre-seeded with real-world scheme fixtures)
const schemeStore: Map<string, SchemeDocument> = new Map();

// Initialize schemes with parsed results
function initializeSchemes() {
  for (const fixture of REAL_WORLD_SCHEME_FIXTURES) {
    const parsedBenefit = parseBenefitText(fixture.messyBenefitText, `ben_${fixture.id}`);
    const parsedEligibility = parseEligibilityText(fixture.messyEligibilityText, `elig_${fixture.id}`);

    // If either has low confidence or review reasons, enqueue to review queue
    if (parsedBenefit.status === 'NEEDS_REVIEW') {
      reviewQueue.enqueue({
        id: `rev_ben_${fixture.id}`,
        schemeName: fixture.name,
        rawText: fixture.messyBenefitText,
        targetType: 'BENEFIT',
        confidence: parsedBenefit.confidence,
        reasons: parsedBenefit.reviewReasons || ['LOW_CONFIDENCE'],
        extractedPartial: parsedBenefit,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    }

    if (parsedEligibility.status === 'NEEDS_REVIEW') {
      reviewQueue.enqueue({
        id: `rev_elig_${fixture.id}`,
        schemeName: fixture.name,
        rawText: fixture.messyEligibilityText,
        targetType: 'ELIGIBILITY',
        confidence: parsedEligibility.confidence,
        reasons: parsedEligibility.reviewReasons || ['LOW_CONFIDENCE'],
        extractedPartial: parsedEligibility,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    }

    schemeStore.set(fixture.id, {
      ...fixture,
      parsedBenefit,
      parsedEligibility,
      updatedAt: new Date().toISOString()
    });
  }
}

initializeSchemes();

// ----------------- API Routes -----------------

// 1. Parse individual messy benefit text
app.post('/api/parse/benefit', (req: Request, res: Response) => {
  const { text, schemeName } = req.body;
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" must be a string.' });
  }

  const result = parseBenefitText(text);

  // Send anything you cannot map confidently to review list. Do not guess.
  if (result.status === 'NEEDS_REVIEW') {
    reviewQueue.enqueue({
      id: `rev_${Date.now()}`,
      schemeName: schemeName || 'Ad-Hoc Benefit Evaluation',
      rawText: text,
      targetType: 'BENEFIT',
      confidence: result.confidence,
      reasons: result.reviewReasons || ['LOW_CONFIDENCE'],
      extractedPartial: result,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  return res.json(result);
});

// 2. Parse individual messy eligibility text
app.post('/api/parse/eligibility', (req: Request, res: Response) => {
  const { text, schemeName } = req.body;
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" must be a string.' });
  }

  const result = parseEligibilityText(text);

  // Send anything you cannot map confidently to review list. Do not guess.
  if (result.status === 'NEEDS_REVIEW') {
    reviewQueue.enqueue({
      id: `rev_${Date.now()}`,
      schemeName: schemeName || 'Ad-Hoc Eligibility Evaluation',
      rawText: text,
      targetType: 'ELIGIBILITY',
      confidence: result.confidence,
      reasons: result.reviewReasons || ['LOW_CONFIDENCE'],
      extractedPartial: result,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  return res.json(result);
});

// 3. Parse a scheme document (both benefit & eligibility)
app.post('/api/parse/scheme', (req: Request, res: Response) => {
  const { benefitText, eligibilityText, schemeName, state, code, ministry } = req.body;

  const parsedBenefit = parseBenefitText(benefitText || '');
  const parsedEligibility = parseEligibilityText(eligibilityText || '');

  const id = `sch_${Date.now()}`;
  const schemeDoc: SchemeDocument = {
    id,
    code: code || `SCH-${Math.floor(100 + Math.random() * 900)}`,
    name: schemeName || 'Untitled Government Scheme',
    ministryOrDepartment: ministry || 'General Administration',
    state: state || 'All India',
    messyBenefitText: benefitText || '',
    messyEligibilityText: eligibilityText || '',
    parsedBenefit,
    parsedEligibility,
    updatedAt: new Date().toISOString()
  };

  // Route low confidence elements to Review Queue
  if (parsedBenefit.status === 'NEEDS_REVIEW') {
    reviewQueue.enqueue({
      id: `rev_ben_${id}`,
      schemeName: schemeDoc.name,
      rawText: benefitText,
      targetType: 'BENEFIT',
      confidence: parsedBenefit.confidence,
      reasons: parsedBenefit.reviewReasons || ['LOW_CONFIDENCE'],
      extractedPartial: parsedBenefit,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  if (parsedEligibility.status === 'NEEDS_REVIEW') {
    reviewQueue.enqueue({
      id: `rev_elig_${id}`,
      schemeName: schemeDoc.name,
      rawText: eligibilityText,
      targetType: 'ELIGIBILITY',
      confidence: parsedEligibility.confidence,
      reasons: parsedEligibility.reviewReasons || ['LOW_CONFIDENCE'],
      extractedPartial: parsedEligibility,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  schemeStore.set(id, schemeDoc);
  return res.status(201).json(schemeDoc);
});

// 4. List all scheme documents
app.get('/api/schemes', (_req: Request, res: Response) => {
  const schemes = Array.from(schemeStore.values());
  return res.json(schemes);
});

// 5. Get scheme by ID
app.get('/api/schemes/:id', (req: Request, res: Response) => {
  const scheme = schemeStore.get(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: 'Scheme not found' });
  }
  return res.json(scheme);
});

// 6. Review Queue endpoints
app.get('/api/review-queue', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const targetType = req.query.targetType as string | undefined;
  const items = reviewQueue.getAll({ status, targetType });
  return res.json(items);
});

// Human-in-the-loop Resolution: Operator supplies approved / normalized data
app.post('/api/review-queue/:id/resolve', (req: Request, res: Response) => {
  const { resolvedData } = req.body;
  const updated = reviewQueue.resolve(req.params.id, resolvedData);
  if (!updated) {
    return res.status(404).json({ error: 'Review item not found.' });
  }
  return res.json(updated);
});

// Dismiss review item
app.post('/api/review-queue/:id/dismiss', (req: Request, res: Response) => {
  const updated = reviewQueue.dismiss(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Review item not found.' });
  }
  return res.json(updated);
});

// 7. Concept Ontology & Metadata endpoint
app.get('/api/concepts', (_req: Request, res: Response) => {
  return res.json({
    eligibilityConcepts: ELIGIBILITY_CONCEPTS,
    benefitCategories: BENEFIT_CATEGORIES,
    benefitTypes: BENEFIT_TYPES,
    operators: ['<=', '>=', '<', '>', '==', '!=', 'IN', 'BETWEEN'],
    frequencies: ['annual', 'monthly', 'quarterly', 'per_semester', 'one_time', 'per_instalment']
  });
});

// 8. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    version: '1.0.0',
    totalSchemes: schemeStore.size,
    reviewQueueSize: reviewQueue.getAll({ status: 'PENDING' }).length
  });
});

app.listen(PORT, () => {
  console.log(`[Haqdarshak Engine API] Server running on http://localhost:${PORT}`);
});
