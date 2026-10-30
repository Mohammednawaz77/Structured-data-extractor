# Haqdarshak Scheme Normalizer & Eligibility Rule Engine
## Comprehensive System Architecture, Engineering Techniques & Interview Preparation Guide

---

## 1. Executive Summary & Problem Context

### 1.1 The Real-World Domain
In social welfare and public entitlement delivery (e.g., **Haqdarshak**, Direct Benefit Transfer [DBT], PM-KISAN, state welfare boards), scheme criteria originate from diverse government circulars, gazettes, and administrative PDFs. 

These documents are drafted in varied administrative prose with colloquial jargon, mixed vernacular phrases (e.g., *parivar aay*, *niwasi*, *pratimaah*), regional numeric conventions (*lakhs*, *crores*, *k*), and ambiguous conditional statements.

### 1.2 The Problem
1. **Unstructured Benefit Statements:** Text such as `"₹6,000 a year in three instalments"` or `"Annual scholarship of Rs 1.2 lakh distributed per semester"` cannot be queried or calculated programmatically by database engines.
2. **Ambiguous Eligibility Criteria:** Criteria such as `"SC/ST families with income under ₹2.5 lakh"` or `"Women resident of Madhya Pradesh aged between 21 and 60 years"` combine multiple disparate demographic concepts with logical operators and range limits.
3. **The Core Danger (False Positives vs. False Negatives):**
   - **False Positive:** Ineligible citizens receive subsidies, wasting government exchequer funds and violating statutory compliance.
   - **False Negative:** An impoverished family is denied life-critical welfare (pensions, housing grants, maternal assistance) due to parsing misinterpretations.

### 1.3 The Core Solution Doctrine: "Zero Guessing"
In welfare rule synthesis, **hallucinating or guessing is strictly forbidden**. 
- If text contains subjective criteria (e.g., *"good moral character"*), ambiguous frequencies (*"occasional aid"*), or unbounded percentages (*"50% subsidy without ceiling"*), the engine refuses to guess.
- It immediately quarantines the statement into a **Human-in-the-Loop (HITL) Review Queue** accompanied by an explicit, actionable **diagnostic reason code**.

---

## 2. What the System Does (End-to-End Capabilities)

```
Messy Scheme Text (Document / PDF Extraction)
        │
        ├── Benefit Text ────────► Benefit Normalizer ──────► Structured Benefit Row
        │                          (Indian Currency + Cadence) (Category, Amount, Freq, Instalments)
        │
        └── Eligibility Text ────► AST Rule Parser ──────────► Boolean Condition Tree (AST)
                                   (Ontology + Relational Ops)  (Concepts, Operators, Values, AND/OR)
                                                │
                                                ▼
                                    Confidence Gatekeeper
                                  (Score >= 70% & No Ambiguities)
                                                │
                                  ┌─────────────┴─────────────┐
                                  ▼                           ▼
                             [ APPROVED ]               [ QUARANTINED ]
                       Ready for Eligibility DB      Review Queue with Diagnostic
                                                     Reasons for Human Compliance
```

### 2.1 Benefit Statement Normalization
Transforms arbitrary prose into normalized database records containing:
- **`category`**: Standard taxonomy (`financial_assistance`, `scholarship`, `pension`, `housing_grant`, `input_subsidy`, `loan_waiver`).
- **`type`**: Delivery channel (`direct_benefit_transfer_dbt`, `cash_transfer`, `in_kind`, `fee_waiver`, `subsidized_loan`).
- **`amount`**: Numeric integer/float normalized to standard currency.
- **`currency`**: Standard ISO code (`INR`).
- **`frequency`**: Cadence (`annual`, `monthly`, `quarterly`, `per_semester`, `one_time`, `per_instalment`).
- **`numberOfInstalments`**: Integer count of disbursements.
- **`instalmentAmount`**: Mathematical quotient (`amount / numberOfInstalments`) or reverse-calculated product.

#### Canonical Example:
- **Input:** `"₹6,000 a year in three instalments"`
- **Normalized Row:**
  ```json
  {
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

### 2.2 Eligibility Condition AST (Abstract Syntax Tree) Parser
Transforms freeform targeting criteria into a recursive boolean logic tree consisting of:
- **`concept`**: Normalized demographic/economic variable (e.g., `income`, `age`, `social_category`, `state`, `land_holding`, `gender`, `disability_percentage`).
- **`operator`**: Deterministic comparison operator (`<=`, `>=`, `<`, `>`, `==`, `!=`, `IN`, `BETWEEN`).
- **`value`**: Typed numeric, string, boolean, or array value.
- **`unit`**: Standardized physical unit (`INR/year`, `years`, `acres`, `hectares`, `%`).
- **`combinator`**: Boolean logic connectors (`AND` vs `OR`).

#### Canonical Example:
- **Input:** `"SC/ST families with income under ₹2.5 lakh"`
- **Normalized AST:**
  ```json
  {
    "type": "COMPOUND",
    "combinator": "AND",
    "conditions": [
      {
        "type": "ATOMIC",
        "concept": "social_category",
        "operator": "IN",
        "value": ["SC", "ST"],
        "confidence": 0.98
      },
      {
        "type": "ATOMIC",
        "concept": "income",
        "operator": "<=",
        "value": 250000,
        "unit": "INR/year",
        "confidence": 0.96
      }
    ],
    "confidence": 0.97,
    "status": "PARSED"
  }
  ```

### 2.3 Strict Zero-Guessing Review Queue
When text fails determinism checks, it is captured with explicit diagnostic tags:
```json
{
  "id": "rev_initial_02",
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

## 3. Engineering Techniques & Algorithmic Solutions

### 3.1 Indian Numeric & Currency Normalization Algorithm
The Indian numbering system differs significantly from Western notation:
- $1 \text{ Lakh} = 100,000$ ($10^5$)
- $1 \text{ Crore} = 10,000,000$ ($10^7$)
- Comma separation follows $2,2,3$ groupings (e.g. `1,20,000` rather than `120,000`).

#### Solution Algorithm (`numberParser.ts`):
1. **Cleaning:** Strip currency symbols (`₹`, `Rs.`, `INR`, `/-`) and sanitize whitespace.
2. **Scale Tokenizer:**
   - Matches Crores: `([\d,]+(?:\.\d+)?)\s*(?:crores?|cr)` $\rightarrow \text{base} \times 10,000,000$
   - Matches Lakhs: `([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lac|l)` $\rightarrow \text{base} \times 100,000$
   - Matches Thousands: `([\d,]+(?:\.\d+)?)\s*(?:thousands?|k)` $\rightarrow \text{base} \times 1,000$
   - Standard Indian Commas: Removes `,` and evaluates standard floating point.
3. **Word-to-Number Lexer:** Converts word numbers (`"three equal instalments"` $\rightarrow$ `3`, `"four tranches"` $\rightarrow$ `4`).

### 3.2 Recursive Abstract Syntax Tree (AST) Generation
To evaluate eligibility, conditions are represented as a recursive Abstract Syntax Tree:
- **`AtomicCondition`**: Single evaluation leaf node ($Concept \circ Value$).
- **`CompoundCondition`**: Branch node containing child conditions joined by boolean combinators ($Condition_1 \land Condition_2$).

#### Operator Resolution Logic:
- `"under"`, `"below"`, `"less than"`, `"not exceeding"`, `"up to"`, `"maximum"` $\rightarrow$ `<=`
- `"at least"`, `"minimum"`, `"above"`, `"greater than"` $\rightarrow$ `>=`
- `"between X and Y"`, `"X to Y years"` $\rightarrow$ `BETWEEN` (`[min, max]`)
- `"SC/ST"`, `"SC, ST or OBC"` $\rightarrow$ `IN` (`['SC', 'ST']`)
- `"resident of Maharashtra"` $\rightarrow$ `==`

### 3.3 Confidence Scoring Matrix & Guardrails
Confidence starts at $1.00$ ($100\%$) and is penalized when non-deterministic or fuzzy patterns appear:
- Missing payment frequency: $-0.30$
- Missing explicit category: $-0.15$
- Subjective amount phrase: $-0.40$
- Subjective moral/aptitude phrase: $-0.45$
- Unknown or untracked concept: $-0.40$
- Fuzzy boundary operator (*approx*, *around*): $-0.45$

**The Gatekeeper Rule:**
$$\text{Status} = \begin{cases} 
\text{PARSED} & \text{if } \text{Confidence} \ge 0.70 \land \text{Reasons.length} = 0 \\
\text{NEEDS\_REVIEW} & \text{otherwise}
\end{cases}$$

---

## 4. Tech Stack Breakdown & Justification

| Layer | Technology | Why Chosen & Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript** | Component-driven architecture with compile-time type safety; zero runtime overhead. |
| **Build Tool** | **Vite 8** | Sub-second Hot Module Replacement (HMR) and optimized Rollup tree-shaking for instant dev feedback. |
| **Styling** | **Tailwind CSS 3** | Utility-first styling for accessible, enterprise-grade responsive UI without custom CSS bloat. |
| **Icons & UI Assets** | **Lucide React** | Clean, accessible vector icons for compliance badges, status pills, and AST nodes. |
| **Backend Runtime** | **Node.js 24 LTS + Express** | High-throughput asynchronous event loop for rapid deterministic rule extraction and parsing. |
| **Language** | **TypeScript (NodeNext / ESM)** | Full type-safety across AST data models, union types for operators, and strict null checks. |
| **Database Architecture** | **In-Memory Store with MongoDB Interface** | Dual-compatible store seeded with realistic Indian welfare schemes; runs out-of-the-box with zero database configuration. |
| **Testing Engine** | **Vitest 2** | Native ESM test runner with Jest-compatible APIs; executes 20 tricky test cases in under 100ms. |

---

## 5. Test Suite Verification (20 Tricky Cases)

The system includes 20 comprehensive unit tests in [`backend/src/tests/engine.test.ts`](file:///c:/Users/hp/OneDrive/Desktop/haqdarshak/backend/src/tests/engine.test.ts):

| Test ID | Category | Scenario / Input | Expected Assertion |
| :--- | :--- | :--- | :--- |
| **TC-01** | Canonical Benefit | `"₹6,000 a year in three instalments"` | `amount: 6000`, `frequency: annual`, `instalments: 3`, `instalmentAmount: 2000`, status: `PARSED` |
| **TC-02** | Canonical Eligibility | `"SC/ST families with income under ₹2.5 lakh"` | `social_category IN [SC, ST]`, `income <= 250000`, combinator: `AND`, status: `PARSED` |
| **TC-03** | Indian Lakhs | `"₹2.5 lakh"`, `"Rs. 1 lakh"`, `"0.75 lac"` | Parses to `250000`, `100000`, `75000` |
| **TC-04** | Indian Crores | `"₹1.2 crore"`, `"1.5 Cr"` | Parses to `12000000`, `15000000` |
| **TC-05** | Commas & Suffixes | `"Rs. 1,20,000/-"` | Parses to `120000` |
| **TC-06** | Reverse Instalment | `"three equal instalments of ₹2,000 each"` | Calculates `total: 6000`, `instalments: 3`, `perInstalment: 2000` |
| **TC-07** | Age Range + State | `"Age between 18 and 35 years and resident of Maharashtra"` | `age BETWEEN [18, 35]`, `state == 'Maharashtra'` |
| **TC-08** | Multi-concept Compound | `"Women resident of MP aged 21 to 60 with income under ₹2.5 lakh"` | 4 atomic conditions joined by `AND` |
| **TC-09** | Landholding Criterion | `"Small and marginal farmers with land up to 2 hectares"` | `land_holding <= 2 hectares` |
| **TC-10** | Zero Guess: Frequency | `"Distressed artisans receive occasional assistance"` | Rejected: `AMBIGUOUS_FREQUENCY` $\rightarrow$ Review Queue |
| **TC-11** | Zero Guess: Subjective | `"Applicants of good moral character and reputable standing"` | Rejected: `SUBJECTIVE_CRITERIA` $\rightarrow$ Review Queue |
| **TC-12** | Zero Guess: Unknown | `"Patriotic families of freedom fighters and martyrs"` | Rejected: `UNKNOWN_CONCEPT` $\rightarrow$ Review Queue |
| **TC-13** | Zero Guess: Unbounded | `"50% subsidy on solar pump machinery without cap"` | Rejected: `UNBOUNDED_PERCENTAGE` $\rightarrow$ Review Queue |
| **TC-14** | Zero Guess: Fuzzy Op | `"Family income approximately around 2 lakhs"` | Rejected: `AMBIGUOUS_OPERATOR` $\rightarrow$ Review Queue |

---

## 6. Interview & Evaluation Cheatsheet

### 6.1 The 30-Second Elevator Pitch
> *"We built an automated text-to-rule normalization engine tailored for Indian welfare administration (like Haqdarshak). It extracts messy administrative prose into structured benefit rows (amount, frequency, instalments) and eligibility AST condition trees (concepts, operators, values, and boolean combinators). Because lives and state funds are at stake, we enforce a strict Zero-Guessing Policy: anything subjective, ambiguous, or unmapped is quarantined into a Human-in-the-Loop review queue with explicit diagnostic codes."*

### 6.2 Key Questions & Senior Developer Answers

#### Q1: "Why use deterministic lexing and AST parsing instead of sending everything to an LLM like GPT-4 or Gemini?"
- **Cost & Latency:** Ingesting millions of welfare records through an LLM introduces ongoing API token costs and 1-3 second latency per snippet. Deterministic parsing executes in under 5 milliseconds with zero marginal cost.
- **Hallucination Risk:** LLMs are non-deterministic; they can subtly alter numbers, fabricate income ceilings, or interpret colloquial words differently across runs.
- **Auditability:** Welfare eligibility requires strict legal compliance. Every single condition in our AST maps to explicit character offsets (`rawSnippet`) in the source text.
- **Ideal Hybrid Architecture:** Use deterministic regex/lexing as the primary filter. Use LLMs only inside the Human-in-the-Loop workbench to propose draft suggestions for human review.

#### Q2: "How does the system handle complex Indian numbering and vernacular vocabulary?"
- Indian scheme circulars mix abbreviations like `Rs. 2.5L`, `₹2.5 lakh`, `1,20,000/-`, and Hindi words like *parivar aay* (household income), *niwasi* (resident), *umar* (age), and *kisan* (farmer).
- Our number normalizer handles scale multipliers ($10^5$ for lakh, $10^7$ for crore) and strips decorative currency suffixes (`/-`).
- Our concept ontology maps regional aliases to standardized canonical keys.

#### Q3: "What prevents false positives when an eligibility clause is vague?"
- Our **Confidence Scoring Gatekeeper**. If a clause uses subjective phrasing like *"good moral standing"* or fuzzy modifiers like *"approximately around"*, the engine penalizes confidence below the $70\%$ threshold and appends a diagnostic code (`SUBJECTIVE_CRITERIA`, `AMBIGUOUS_OPERATOR`).
- This automatically reroutes the clause to the Review Queue where a human compliance officer can either provide a manual override or dismiss it.

---

## 7. Project File Directory Map

```
haqdarshak/
├── backend/
│   ├── src/
│   │   ├── engine/
│   │   │   ├── types.ts              # Data contracts: BenefitRow, AST nodes, ReviewItem
│   │   │   ├── concepts.ts           # Standard Ontology: Concepts, Operators, Benefit Categories
│   │   │   ├── numberParser.ts       # Indian numeric normalizer (Lakhs, Crores, K, Commas)
│   │   │   ├── benefitParser.ts      # Benefit Row parser & cadence calculator
│   │   │   ├── eligibilityParser.ts  # AST parser, condition tree synthesizer & guardrail
│   │   │   ├── reviewQueue.ts        # In-memory review queue store with HITL resolution
│   │   │   └── fixtures.ts           # Real-world scheme fixtures (PM-KISAN, Ladli Behna, PMAY)
│   │   ├── tests/
│   │   │   └── engine.test.ts        # 20 Vitest unit tests for tricky edge cases
│   │   └── server.ts                 # Express REST API endpoints
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BenefitRowCard.tsx        # Structured benefit row UI card
│   │   │   ├── EligibilityAstViewer.tsx  # Interactive visual AST condition tree
│   │   │   ├── ParserStudio.tsx          # Real-time interactive sandbox with presets
│   │   │   ├── SchemeCatalog.tsx         # Document catalog with side-by-side comparison
│   │   │   ├── ReviewQueueView.tsx       # Human-in-the-Loop review workbench
│   │   │   ├── TestRunnerView.tsx        # Interactive test runner dashboard
│   │   │   └── OntologyGlossary.tsx      # Taxonomy & concepts reference
│   │   ├── api.ts                        # Backend API client
│   │   ├── types.ts                      # Client-side TypeScript contracts
│   │   ├── App.tsx                       # Root application layout & navigation
│   │   └── index.css                     # Tailwind CSS configurations
│   └── package.json
│
├── README.md                             # Quickstart & operational overview
└── SYSTEM_ARCHITECTURE_AND_PREP_GUIDE.md # This comprehensive technical reference
```
