# Haqdarshak Scheme Normalizer & Eligibility AST Engine

A production-grade **MERN** (React, Node.js, Express, TypeScript, Document Store) rule engine designed to transform messy, unstructured government scheme texts into machine-queryable benefit rows and boolean AST (Abstract Syntax Tree) eligibility conditions with a strict **Zero-Guessing Compliance Policy**.

---

## 1. Problem & Core Challenge

Government welfare documents (e.g. PM-KISAN, PMAY, Ladli Behna, Post-Matric Scholarships) are published in unstructured, bureaucratic, and colloquial administrative prose:
- **Messy Benefit Example:** `"₹6,000 a year in three instalments"` or `"Annual scholarship of Rs 1.2 lakh distributed per semester"`
- **Messy Eligibility Example:** `"SC/ST families with income under ₹2.5 lakh"` or `"Women resident of Madhya Pradesh aged between 21 and 60 with parivar aay under ₹2.5 lakh"`

### The Danger of Hallucination in Welfare Entitlement
- In public benefit delivery, an inaccurate rule match either denies an entitled citizen their legal welfare or disperses unauthorized state funds.
- **Strict Rule:** Any clause containing subjective qualifiers, ambiguous frequencies, unmapped concepts, or non-deterministic boundaries **must never be guessed**. It is automatically quarantined in a **Human-in-the-Loop Review Queue** with a specific diagnostic code.

---

## 2. Structured Data Outputs

### A. Benefit Row Output
```json
{
  "id": "ben_1793356008724",
  "rawText": "₹6,000 a year in three instalments",
  "category": "financial_assistance",
  "type": "cash_transfer",
  "amount": 6000,
  "currency": "INR",
  "frequency": "annual",
  "numberOfInstalments": 3,
  "instalmentAmount": 2000,
  "confidence": 0.85,
  "status": "PARSED"
}
```

### B. Eligibility AST (Abstract Syntax Tree) Output
```json
{
  "id": "elig_1793356016905",
  "rawText": "SC/ST families with income under ₹2.5 lakh",
  "ast": {
    "type": "COMPOUND",
    "combinator": "AND",
    "conditions": [
      {
        "type": "ATOMIC",
        "concept": "social_category",
        "conceptLabel": "Social Category / Caste",
        "operator": "IN",
        "value": ["SC", "ST"],
        "confidence": 0.98,
        "rawSnippet": "SC/ST"
      },
      {
        "type": "ATOMIC",
        "concept": "income",
        "conceptLabel": "Annual Family Income",
        "operator": "<=",
        "value": 250000,
        "unit": "INR/year",
        "confidence": 0.96,
        "rawSnippet": "income under ₹2.5 lakh"
      }
    ],
    "confidence": 0.97
  },
  "confidence": 1.0,
  "status": "PARSED"
}
```

### C. Quarantined Review Queue Item (Zero Guessing Policy)
```json
{
  "id": "rev_initial_02",
  "schemeName": "Civic Character Grant",
  "rawText": "Deserving citizens of good moral character with approximate income around 2 lakhs",
  "targetType": "ELIGIBILITY",
  "confidence": 0.25,
  "status": "PENDING",
  "reasons": [
    "SUBJECTIVE_CRITERIA: 'Moral character/repute' cannot be evaluated deterministically.",
    "SUBJECTIVE_CRITERIA: 'Deserving/needy' is subjective; requires explicit income/wealth limits.",
    "AMBIGUOUS_OPERATOR: Fuzzy qualifiers ('approx', 'around') prevent strict eligibility boundary checks."
  ]
}
```

---

## 3. Architecture & Tech Stack

| Component | Technology | Implementation Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | **React 19 + Vite + Tailwind CSS + Lucide Icons** | Interactive Parser Studio, Visual Condition AST Explorer, Scheme Document Catalog, Human Review Workbench, Live Test Suite Runner. |
| **Backend REST API** | **Node.js 24 + Express + TypeScript (ESM)** | REST endpoints for atomic parsing, batch processing, review resolution, and concept taxonomies. |
| **Core Parser Engine** | **Deterministic AST Builder + Lexer** | High-precision tokenization of Indian numbering conventions (`lakh`, `crore`, `k`, `₹`, `Rs`, `/-`), relational operators, and logical combinators (`AND` / `OR`). |
| **Testing Suite** | **Vitest** | 20 test cases verifying canonical examples, tricky Indian administrative prose, and zero-guessing guardrails. |

---

## 4. Key Components in the Solution

1. **Indian Scale & Currency Normalizer (`numberParser.ts`):**
   - Parses `₹2.5 lakh` $\rightarrow$ `250,000`
   - Parses `1.2 crore` $\rightarrow$ `12,000,000`
   - Parses `Rs 1,20,000/-` $\rightarrow$ `120,000`
   - Handles word numerals: `"three equal instalments"` $\rightarrow$ `3`
2. **Benefit Normalizer (`benefitParser.ts`):**
   - Extracts category (`financial_assistance`, `scholarship`, `pension`, `housing_grant`, etc.).
   - Extracts benefit type (`direct_benefit_transfer_dbt`, `cash_transfer`, `in_kind`, `fee_waiver`).
   - Normalizes frequency (`annual`, `monthly`, `quarterly`, `per_semester`, `one_time`, `per_instalment`).
   - Calculates instalments and per-instalment values.
3. **Eligibility Rule Engine (`eligibilityParser.ts`):**
   - Standard concepts: `income`, `age`, `social_category` (SC/ST/OBC/EWS/Gen), `state`, `gender`, `land_holding`, `occupation`, `disability_percentage`, `marital_status`, `bpl_status`.
   - Operators: `<=`, `>=`, `<`, `>`, `==`, `!=`, `IN`, `BETWEEN`.
   - Recursive Boolean AST construction.
4. **Diagnostic Review Dispatcher (`reviewQueue.ts`):**
   - Flags ambiguous frequencies (`AMBIGUOUS_FREQUENCY: 'occasional'`).
   - Flags subjective terms (`SUBJECTIVE_CRITERIA: 'good moral character'`).
   - Flags unbounded subsidies (`UNBOUNDED_PERCENTAGE: '50% subsidy without cap'`).
   - Provides a 1-click human resolution and override dialog.

---

## 5. Running the Application

### A. Run Automated Tests
```powershell
cd backend
npm test
```
All 20 tests verify canonical cases, complex multi-concept rules, and zero-guessing edge cases.

### B. Run Full-Stack MERN System
1. **Start Backend Server:**
   ```powershell
   cd backend
   npm run dev
   # Runs on http://localhost:5000
   ```
2. **Start Frontend Client:**
   ```powershell
   cd frontend
   npm run dev
   # Runs on http://localhost:5173
   ```
