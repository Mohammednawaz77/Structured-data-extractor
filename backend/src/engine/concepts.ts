import { ConceptDefinition, BenefitCategoryDefinition, BenefitTypeDefinition } from './types.js';

export const ELIGIBILITY_CONCEPTS: Record<string, ConceptDefinition> = {
  income: {
    id: 'income',
    label: 'Annual Family Income',
    dataType: 'number',
    unit: 'INR/year',
    aliases: [
      'income', 'annual income', 'family income', 'household income', 
      'gross income', 'family annual income', 'parivar aay', 'aay'
    ],
    description: 'Total household or applicant annual income in Indian Rupees.'
  },
  age: {
    id: 'age',
    label: 'Applicant Age',
    dataType: 'number',
    unit: 'years',
    aliases: [
      'age', 'years of age', 'years old', 'age limit', 'aayu', 'umar'
    ],
    description: 'Age of the primary applicant in completed years.'
  },
  social_category: {
    id: 'social_category',
    label: 'Social Category / Caste',
    dataType: 'category',
    allowedValues: ['SC', 'ST', 'OBC', 'General', 'EWS', 'Minority', 'DNT'],
    aliases: [
      'category', 'caste', 'social category', 'community', 'sc/st', 'sc', 'st', 'obc', 'ews', 'minority', 'varg'
    ],
    description: 'Recognized affirmative action category or socio-economic group.'
  },
  state: {
    id: 'state',
    label: 'Domicile / Resident State',
    dataType: 'string',
    allowedValues: [
      'Maharashtra', 'Madhya Pradesh', 'Uttar Pradesh', 'Bihar', 'Rajasthan', 
      'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Odisha', 'Andhra Pradesh', 
      'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Jharkhand', 'Chhattisgarh', 
      'Assam', 'Delhi', 'Uttarakhand', 'Himachal Pradesh', 'All India'
    ],
    aliases: [
      'state', 'domicile', 'resident of', 'residing in', 'native of', 'rajya', 'niwasi'
    ],
    description: 'State or Union Territory of permanent residence or domicile.'
  },
  gender: {
    id: 'gender',
    label: 'Gender',
    dataType: 'category',
    allowedValues: ['Female', 'Male', 'Transgender', 'Any'],
    aliases: [
      'gender', 'sex', 'women', 'woman', 'girl', 'female', 'male', 'man', 'mahila', 'purush'
    ],
    description: 'Gender eligibility restriction if scheme is gender-targeted.'
  },
  land_holding: {
    id: 'land_holding',
    label: 'Agricultural Land Holding',
    dataType: 'number',
    unit: 'acres',
    aliases: [
      'land', 'landholding', 'land holding', 'cultivable land', 'agricultural land', 'hectare', 'acre', 'bigha'
    ],
    description: 'Operable agricultural land owned by the farming family.'
  },
  occupation: {
    id: 'occupation',
    label: 'Primary Occupation',
    dataType: 'category',
    allowedValues: [
      'Small/Marginal Farmer', 'Tenant Farmer', 'Agricultural Labourer', 
      'Construction Worker', 'Artisan', 'Student', 'Street Vendor', 'Unemployed', 'Self-Employed'
    ],
    aliases: [
      'occupation', 'profession', 'farmer', 'kisan', 'construction worker', 'bocw', 'student', 'vendor', 'shramik'
    ],
    description: 'Employment or vocational classification of the applicant.'
  },
  disability_percentage: {
    id: 'disability_percentage',
    label: 'Disability Percentage',
    dataType: 'number',
    unit: '%',
    aliases: [
      'disability', 'handicapped', 'pwd', 'divyang', 'disability percentage', 'benchmark disability'
    ],
    description: 'Certified percentage of physical/mental disability.'
  },
  marital_status: {
    id: 'marital_status',
    label: 'Marital Status',
    dataType: 'category',
    allowedValues: ['Unmarried', 'Married', 'Widowed', 'Divorced', 'Abandoned'],
    aliases: [
      'marital status', 'widow', 'widowed', 'divorced', 'destitute woman', 'unmarried', 'single mother'
    ],
    description: 'Civil and marital standing of the applicant.'
  },
  bpl_status: {
    id: 'bpl_status',
    label: 'BPL / Antyodaya Status',
    dataType: 'boolean',
    aliases: [
      'bpl', 'below poverty line', 'antyodaya', 'aay card', 'bpl card', 'poor family'
    ],
    description: 'Whether the family possesses a Below Poverty Line identification.'
  }
};

export const BENEFIT_CATEGORIES: Record<string, BenefitCategoryDefinition> = {
  financial_assistance: {
    id: 'financial_assistance',
    label: 'Direct Financial Assistance',
    aliases: ['financial assistance', 'cash assistance', 'grant', 'direct benefit', 'aid', 'samman nidhi', 'sahayata'],
    description: 'Direct unconditional or conditional cash payment to beneficiary.'
  },
  scholarship: {
    id: 'scholarship',
    label: 'Scholarship & Educational Aid',
    aliases: ['scholarship', 'stipend', 'tuition assistance', 'education aid', 'fellowship', 'chatravritti'],
    description: 'Funds provided to support tuition, maintenance, or academic pursuits.'
  },
  pension: {
    id: 'pension',
    label: 'Social Security Pension',
    aliases: ['pension', 'old age pension', 'widow pension', 'disability pension', 'monthly pension'],
    description: 'Regular recurring stipend for senior citizens, widows, or differently abled.'
  },
  housing_grant: {
    id: 'housing_grant',
    label: 'Housing & Shelter Subsidy',
    aliases: ['housing', 'pucca house', 'home loan subsidy', 'pmay grant', 'construction assistance', 'awaas'],
    description: 'Financial assistance for the construction or upgrade of a residential home.'
  },
  input_subsidy: {
    id: 'input_subsidy',
    label: 'Agricultural / Input Subsidy',
    aliases: ['input subsidy', 'fertilizer subsidy', 'seed subsidy', 'equipment grant', 'krishi subsidy'],
    description: 'Subsidies or vouchers for agricultural inputs or machinery.'
  },
  health_insurance: {
    id: 'health_insurance',
    label: 'Health & Medical Coverage',
    aliases: ['health insurance', 'medical cover', 'cashless treatment', 'hospitalization', 'arogya'],
    description: 'Annual cashless healthcare guarantee or insurance indemnity.'
  },
  loan_waiver: {
    id: 'loan_waiver',
    label: 'Loan / Interest Waiver',
    aliases: ['loan waiver', 'debt relief', 'interest subsidy', 'karz maafi'],
    description: 'Relief or rebate on outstanding agricultural or institutional loans.'
  }
};

export const BENEFIT_TYPES: Record<string, BenefitTypeDefinition> = {
  direct_benefit_transfer_dbt: {
    id: 'direct_benefit_transfer_dbt',
    label: 'Direct Benefit Transfer (DBT)',
    aliases: ['dbt', 'direct bank transfer', 'bank account transfer', 'direct deposit', 'aadhaar linked account'],
    description: 'Electronic transfer credited straight into the bank account of the beneficiary.'
  },
  cash_transfer: {
    id: 'cash_transfer',
    label: 'Cash Transfer',
    aliases: ['cash', 'cash payment', 'financial grant', 'monetary aid'],
    description: 'General monetary payment (DBT or cash voucher).'
  },
  fee_waiver: {
    id: 'fee_waiver',
    label: 'Fee Exemption / Waiver',
    aliases: ['waiver', 'exemption', 'fee waiver', 'free tuition', '100% concession'],
    description: 'Exemption from statutory, academic, or administrative fees.'
  },
  in_kind: {
    id: 'in_kind',
    label: 'In-Kind Goods / Materials',
    aliases: ['in kind', 'free kit', 'bicycle', 'laptop', 'uniform', 'ration', 'equipment'],
    description: 'Physical commodities or equipment rather than currency.'
  },
  subsidized_loan: {
    id: 'subsidized_loan',
    label: 'Subsidized Loan / Low Interest',
    aliases: ['subsidized loan', 'soft loan', 'concession loan', 'collateral free loan'],
    description: 'Credit facility extended with government interest subvention.'
  }
};
