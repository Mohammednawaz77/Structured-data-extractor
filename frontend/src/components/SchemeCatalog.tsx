import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { SchemeDocument } from '../types';
import { BenefitRowCard } from './BenefitRowCard';
import { EligibilityAstViewer } from './EligibilityAstViewer';
import { 
  Building2, 
  MapPin, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from 'lucide-react';

export const SchemeCatalog: React.FC = () => {
  const [schemes, setSchemes] = useState<SchemeDocument[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>('sch_pm_kisan');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Scheme Form
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeMinistry, setNewSchemeMinistry] = useState('');
  const [newSchemeState, setNewSchemeState] = useState('All India');
  const [newBenefitText, setNewBenefitText] = useState('');
  const [newEligibilityText, setNewEligibilityText] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchSchemes = async () => {
    try {
      const data = await api.getSchemes();
      setSchemes(data);
    } catch (err) {
      console.error('Failed to load schemes:', err);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName || !newBenefitText || !newEligibilityText) return;
    setCreating(true);
    try {
      const created = await api.parseScheme({
        schemeName: newSchemeName,
        ministry: newSchemeMinistry,
        state: newSchemeState,
        benefitText: newBenefitText,
        eligibilityText: newEligibilityText
      });
      setSchemes([created, ...schemes]);
      setExpandedId(created.id);
      setShowAddModal(false);
      // Reset form
      setNewSchemeName('');
      setNewSchemeMinistry('');
      setNewBenefitText('');
      setNewEligibilityText('');
    } catch (err) {
      console.error('Error creating scheme:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredSchemes = schemes.filter(s => {
    if (filterState === 'ALL') return true;
    if (filterState === 'NEEDS_REVIEW') {
      return s.parsedBenefit?.status === 'NEEDS_REVIEW' || s.parsedEligibility?.status === 'NEEDS_REVIEW';
    }
    if (filterState === 'PARSED') {
      return s.parsedBenefit?.status === 'PARSED' && s.parsedEligibility?.status === 'PARSED';
    }
    return s.state.toLowerCase() === filterState.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Government Welfare Scheme Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real administrative scheme texts parsed into structured benefit rows and eligibility rule trees.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer text-slate-700"
            >
              <option value="ALL">All Documents ({schemes.length})</option>
              <option value="PARSED">Fully Parsed</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="All India">National (All India)</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </div>
      </div>

      {/* Schemes List */}
      <div className="space-y-4">
        {filteredSchemes.map((scheme) => {
          const isExpanded = expandedId === scheme.id;
          const benefitOk = scheme.parsedBenefit?.status === 'PARSED';
          const eligOk = scheme.parsedEligibility?.status === 'PARSED';

          return (
            <div
              key={scheme.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all"
            >
              {/* Card Header / Summary bar */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    benefitOk && eligOk ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {benefitOk && eligOk ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {scheme.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">
                        {scheme.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {scheme.ministryOrDepartment}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {scheme.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end text-xs">
                    <span className={benefitOk && eligOk ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {benefitOk && eligOk ? 'Structured Ready' : 'Review Triggered'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Avg Conf: {(((scheme.parsedBenefit?.confidence || 0) + (scheme.parsedEligibility?.confidence || 0)) / 2 * 100).toFixed(0)}%
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Inspection Area */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-6">
                  {/* Side-by-side Benefit Row & Eligibility AST */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        1. Normalized Benefit Row:
                      </h4>
                      {scheme.parsedBenefit && (
                        <BenefitRowCard benefit={scheme.parsedBenefit} />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        2. Normalized Eligibility AST Rule Tree:
                      </h4>
                      {scheme.parsedEligibility && (
                        <EligibilityAstViewer eligibility={scheme.parsedEligibility} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Scheme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Ingest & Normalize New Scheme Document
            </h3>

            <form onSubmit={handleCreateScheme} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Minister Krishi Sahayata"
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ministry / Dept</label>
                  <input
                    type="text"
                    placeholder="e.g. Department of Agriculture"
                    value={newSchemeMinistry}
                    onChange={(e) => setNewSchemeMinistry(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State / Territory</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra, All India"
                    value={newSchemeState}
                    onChange={(e) => setNewSchemeState(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unstructured Benefit Statement *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. ₹5,000 per year distributed in two instalments of ₹2,500 each"
                  value={newBenefitText}
                  onChange={(e) => setNewBenefitText(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unstructured Eligibility Statement *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Small farmers with land under 2 hectares and annual parivar aay under 2.5 lakh"
                  value={newEligibilityText}
                  onChange={(e) => setNewEligibilityText(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all"
                >
                  {creating ? 'Normalizing...' : 'Parse & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
