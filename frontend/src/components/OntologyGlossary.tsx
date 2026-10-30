import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { ConceptsMetadata } from '../types';
import { BookOpen, Tag, Code, CheckSquare } from 'lucide-react';

export const OntologyGlossary: React.FC = () => {
  const [metadata, setMetadata] = useState<ConceptsMetadata | null>(null);

  useEffect(() => {
    api.getConcepts().then(setMetadata).catch(console.error);
  }, []);

  if (!metadata) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading ontology...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Standard Eligibility Concept & Benefit Taxonomy
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Defined ontology powering deterministic rule synthesis, operator boundary testing, and zero-guess guardrails.
        </p>
      </div>

      {/* Concepts Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-indigo-600" /> Supported Eligibility Concepts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metadata.eligibilityConcepts).map(([key, concept]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{concept.label}</span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                  {concept.dataType}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {concept.description}
              </p>
              {concept.unit && (
                <div className="text-[11px] text-indigo-600 font-medium">
                  Unit: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded">{concept.unit}</span>
                </div>
              )}
              {concept.allowedValues && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">Allowed: </span>
                  <span className="font-mono text-[10px]">{concept.allowedValues.slice(0, 6).join(', ')}{concept.allowedValues.length > 6 ? '...' : ''}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefit Categories & Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-emerald-600" /> Benefit Categories
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm text-xs">
            {Object.entries(metadata.benefitCategories).map(([key, cat]) => (
              <div key={key} className="p-3 hover:bg-slate-50">
                <p className="font-bold text-slate-900">{cat.label}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-amber-600" /> Benefit Delivery Types & Operators
          </h3>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm text-xs">
              {Object.entries(metadata.benefitTypes).map(([key, typ]) => (
                <div key={key} className="p-3 hover:bg-slate-50">
                  <p className="font-bold text-slate-900">{typ.label}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{typ.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
              <span className="font-bold text-slate-700 block mb-2">Relational Operators:</span>
              <div className="flex flex-wrap gap-1.5">
                {metadata.operators.map((op, idx) => (
                  <span key={idx} className="font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    {op}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
