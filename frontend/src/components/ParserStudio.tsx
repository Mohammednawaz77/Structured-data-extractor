import React, { useState } from 'react';
import { api } from '../api';
import type { BenefitRow, EligibilityParseResult } from '../types';
import { BenefitRowCard } from './BenefitRowCard';
import { EligibilityAstViewer } from './EligibilityAstViewer';
import { Sparkles, Play, RefreshCw, Wand2, ArrowRight } from 'lucide-react';

export const ParserStudio: React.FC = () => {
  const [benefitInput, setBenefitInput] = useState('₹6,000 a year in three instalments');
  const [eligibilityInput, setEligibilityInput] = useState('SC/ST families with income under ₹2.5 lakh');
  
  const [benefitResult, setBenefitResult] = useState<BenefitRow | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityParseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      label: 'PM-KISAN Canonical',
      benefit: '₹6,000 a year in three instalments',
      eligibility: 'SC/ST families with income under ₹2.5 lakh'
    },
    {
      label: 'Ladli Behna (MP Women)',
      benefit: '₹1,250 per month DBT transfer into Aadhaar account',
      eligibility: 'Women resident of Madhya Pradesh aged between 21 and 60 years with family income under ₹2.5 lakh'
    },
    {
      label: 'Post-Matric SC/ST Scholarship',
      benefit: 'Annual scholarship assistance of Rs 1.2 lakh distributed per semester',
      eligibility: 'SC/ST students with family income under ₹2.5 lakh per annum and age 16 to 30'
    },
    {
      label: 'Multi-Caste Divyang Youth',
      benefit: '₹2.5 lakh one-time capital subsidy grant',
      eligibility: 'SC/ST/OBC applicants with disability at least 40% and parivar aay under ₹3 lakh and age 18 to 35 residing in Tamil Nadu'
    },
    {
      label: 'Tricky: Ambiguous / Subjective (Zero Guessing -> Review Queue)',
      benefit: 'Discretionary handsome grant distributed occasionally by district collector',
      eligibility: 'Deserving citizens of good moral character with approximate income around 2 lakhs'
    }
  ];

  const handleParse = async () => {
    setLoading(true);
    try {
      const [benRes, eligRes] = await Promise.all([
        api.parseBenefit(benefitInput),
        api.parseEligibility(eligibilityInput)
      ]);
      setBenefitResult(benRes);
      setEligibilityResult(eligRes);
    } catch (err) {
      console.error('Error parsing inputs:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setBenefitInput(preset.benefit);
    setEligibilityInput(preset.eligibility);
  };

  // Run on first load
  React.useEffect(() => {
    handleParse();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero / Quick Presets Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> High-Precision Deterministic Engine
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Interactive Rule & Benefit Normalization Studio
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Paste or draft unstructured welfare clauses. The engine tokenizes Indian numerals (lakhs, crores, k), maps relational operators, generates Boolean AST condition trees, and dispatches ambiguous clauses to human review.
            </p>
          </div>

          <button
            onClick={handleParse}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 font-bold rounded-xl shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Parse Unstructured Text</span>
          </button>
        </div>

        {/* Quick Presets Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5" /> Try Presets:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="text-xs bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Editors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benefit Input Column */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Messy Benefit Text</span>
              <span className="text-indigo-600 font-mono">(Row Normalizer)</span>
            </label>
            <span className="text-xs text-slate-400">e.g. ₹6,000 a year in three instalments</span>
          </div>

          <textarea
            value={benefitInput}
            onChange={(e) => setBenefitInput(e.target.value)}
            rows={3}
            className="w-full text-sm p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
            placeholder="Type or paste messy benefit text here..."
          />

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500" /> Normalized Benefit Row Result:
            </p>
            {benefitResult ? (
              <BenefitRowCard benefit={benefitResult} />
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Click "Parse Unstructured Text" to evaluate.
              </div>
            )}
          </div>
        </div>

        {/* Eligibility Input Column */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Messy Eligibility Text</span>
              <span className="text-indigo-600 font-mono">(AST Rule Engine)</span>
            </label>
            <span className="text-xs text-slate-400">e.g. SC/ST families with income under ₹2.5 lakh</span>
          </div>

          <textarea
            value={eligibilityInput}
            onChange={(e) => setEligibilityInput(e.target.value)}
            rows={3}
            className="w-full text-sm p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
            placeholder="Type or paste messy eligibility text here..."
          />

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-500" /> Normalized Condition AST:
            </p>
            {eligibilityResult ? (
              <EligibilityAstViewer eligibility={eligibilityResult} />
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Click "Parse Unstructured Text" to evaluate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
