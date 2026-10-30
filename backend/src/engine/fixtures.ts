import { SchemeDocument } from './types.js';

export const REAL_WORLD_SCHEME_FIXTURES: SchemeDocument[] = [
  {
    id: 'sch_pm_kisan',
    code: 'PM-KISAN',
    name: 'Pradhan Mantri Kisan Samman Nidhi',
    ministryOrDepartment: 'Ministry of Agriculture & Farmers Welfare',
    state: 'All India',
    messyBenefitText: '₹6,000 a year in three equal instalments of ₹2,000 directly credited via DBT to bank accounts',
    messyEligibilityText: 'Small and marginal farmers having cultivable land up to 2 hectares and parivar aay under 2.5 lakh',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_sc_scholarship',
    code: 'PMS-SC',
    name: 'Post-Matric Scholarship for SC/ST Students',
    ministryOrDepartment: 'Ministry of Social Justice and Empowerment',
    state: 'All India',
    messyBenefitText: 'Annual scholarship assistance of Rs 1.2 lakh distributed per semester',
    messyEligibilityText: 'SC/ST families with income under ₹2.5 lakh and student age between 16 and 30 years',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_ladli_behna',
    code: 'LBY-MP',
    name: 'Mukhyamantri Ladli Behna Yojana',
    ministryOrDepartment: 'Women and Child Development Department',
    state: 'Madhya Pradesh',
    messyBenefitText: 'Direct cash transfer of Rs 1,250 per month into Aadhaar linked account',
    messyEligibilityText: 'Women resident of Madhya Pradesh with age between 21 and 60 years and family income under ₹2.5 lakh',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_pmay_gramin',
    code: 'PMAY-G',
    name: 'Pradhan Mantri Awaas Yojana - Gramin',
    ministryOrDepartment: 'Ministry of Rural Development',
    state: 'All India',
    messyBenefitText: 'Housing construction financial grant of ₹1,20,000 in three instalments',
    messyEligibilityText: 'BPL families with gross annual income under ₹1.5 lakh living in kutcha dwellings',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_old_age_pension',
    code: 'IGNOAPS-MH',
    name: 'Indira Gandhi National Old Age Pension Scheme',
    ministryOrDepartment: 'Social Justice & Special Assistance',
    state: 'Maharashtra',
    messyBenefitText: 'Old age pension of ₹1,000 per month',
    messyEligibilityText: 'Senior citizens with age at least 60 years belonging to BPL card category residing in Maharashtra',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_widow_pension',
    code: 'WPS-UP',
    name: 'Destitute Widow Pension Scheme',
    ministryOrDepartment: 'Department of Women Welfare',
    state: 'Uttar Pradesh',
    messyBenefitText: 'Monthly widow pension allowance of Rs 1,000/- per month',
    messyEligibilityText: 'Widowed women resident of Uttar Pradesh with family income not exceeding 2 lakh and age at least 18 years',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_construction_bocw',
    code: 'BOCW-TOOLKIT',
    name: 'BOCW Registered Construction Worker Skill Kit',
    ministryOrDepartment: 'Building and Other Construction Workers Board',
    state: 'Karnataka',
    messyBenefitText: 'One-time toolkit grant of ₹20,000 for purchasing occupational tools',
    messyEligibilityText: 'Construction worker registered under BOCW with age 18 to 55 years and resident of Karnataka',
    updatedAt: new Date().toISOString()
  },

  // ---------------- Adversarial & Edge Cases for Testing / Review Queue ----------------
  {
    id: 'sch_adversarial_vague',
    code: 'ADV-VAGUE-01',
    name: 'Ambiguous Discretionary Welfare Grant (Should Route to Review Queue)',
    ministryOrDepartment: 'Discretionary Relief Fund',
    state: 'All India',
    messyBenefitText: 'Discretionary financial aid distributed occasionally as decided by local taluk committee',
    messyEligibilityText: 'Deserving citizens of good moral character with approximate income around 2 lakhs',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_adversarial_unbounded_sub',
    code: 'ADV-PERCENT-02',
    name: 'Uncapped Solar Pump Subsidy (Should Route to Review Queue)',
    ministryOrDepartment: 'Renewable Energy Department',
    state: 'Rajasthan',
    messyBenefitText: 'Subsidy of 50% on solar agricultural pumps without specified maximum cap',
    messyEligibilityText: 'Patriotic farmers of martyr families with land holding under 5 acres in Rajasthan',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sch_complex_compound',
    code: 'COMPLEX-03',
    name: 'Multi-Caste Divyang Youth Entrepreneurship Scheme',
    ministryOrDepartment: 'Skill Development & Entrepreneurship',
    state: 'Tamil Nadu',
    messyBenefitText: '₹2.5 lakh one-time capital subsidy grant',
    messyEligibilityText: 'SC/ST/OBC applicants with disability at least 40% and parivar aay under ₹3 lakh and age 18 to 35 residing in Tamil Nadu',
    updatedAt: new Date().toISOString()
  }
];
