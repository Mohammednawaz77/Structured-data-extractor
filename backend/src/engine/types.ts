export type Operator = 
  | '<=' 
  | '>=' 
  | '<' 
  | '>' 
  | '==' 
  | '!=' 
  | 'IN' 
  | 'NOT_IN' 
  | 'BETWEEN';

export type Combinator = 'AND' | 'OR';

export interface ConceptDefinition {
  id: string;
  label: string;
  dataType: 'number' | 'category' | 'boolean' | 'string' | 'range';
  allowedValues?: string[];
  unit?: string;
  aliases: string[];
  description: string;
}

export interface BenefitCategoryDefinition {
  id: string;
  label: string;
  aliases: string[];
  description: string;
}

export interface BenefitTypeDefinition {
  id: string;
  label: string;
  aliases: string[];
  description: string;
}

export interface BenefitRow {
  id: string;
  rawText: string;
  category: string;
  type: string;
  amount: number | null;
  currency: string;
  frequency: 'one_time' | 'annual' | 'monthly' | 'quarterly' | 'per_semester' | 'per_instalment' | 'custom' | null;
  numberOfInstalments: number | null;
  instalmentAmount: number | null;
  confidence: number; // 0.0 to 1.0
  status: 'PARSED' | 'NEEDS_REVIEW';
  reviewReasons?: string[];
}

export interface AtomicCondition {
  type: 'ATOMIC';
  concept: string;
  conceptLabel?: string;
  operator: Operator;
  value: string | number | boolean | (string | number)[];
  unit?: string;
  confidence: number;
  rawSnippet?: string;
}

export interface CompoundCondition {
  type: 'COMPOUND';
  combinator: Combinator;
  conditions: (AtomicCondition | CompoundCondition)[];
  confidence: number;
}

export type EligibilityConditionNode = AtomicCondition | CompoundCondition;

export interface EligibilityParseResult {
  id: string;
  rawText: string;
  ast: EligibilityConditionNode | null;
  confidence: number;
  status: 'PARSED' | 'NEEDS_REVIEW';
  reviewReasons?: string[];
}

export interface ReviewItem {
  id: string;
  schemeName?: string;
  rawText: string;
  targetType: 'BENEFIT' | 'ELIGIBILITY';
  confidence: number;
  reasons: string[];
  extractedPartial?: any;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolvedData?: any;
  createdAt: string;
}

export interface SchemeDocument {
  id: string;
  code: string;
  name: string;
  ministryOrDepartment: string;
  state: string;
  messyBenefitText: string;
  messyEligibilityText: string;
  parsedBenefit?: BenefitRow;
  parsedEligibility?: EligibilityParseResult;
  updatedAt: string;
}
