import React from 'react';
import type { BenefitRow } from '../types';
import { CheckCircle2, AlertTriangle, IndianRupee, Calendar, Layers, Tag } from 'lucide-react';

interface Props {
  benefit: BenefitRow;
}

export const BenefitRowCard: React.FC<Props> = ({ benefit }) => {
  const isParsed = benefit.status === 'PARSED';

  const formatAmount = (amt: number | null, curr: string) => {
    if (amt === null) return 'N/A';
    return `${curr === 'INR' ? '₹' : curr} ${amt.toLocaleString('en-IN')}`;
  };

  return (
    <div className={`rounded-xl border p-5 transition-all shadow-sm ${
      isParsed ? 'bg-white border-slate-200 hover:border-emerald-300' : 'bg-amber-50/40 border-amber-200'
    }`}>
      {/* Header with status & confidence */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {isParsed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Structured Row Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" /> Routed to Review Queue
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono">ID: {benefit.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Confidence:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            benefit.confidence >= 0.85 ? 'bg-emerald-50 text-emerald-700' :
            benefit.confidence >= 0.70 ? 'bg-blue-50 text-blue-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {(benefit.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Raw text snippet */}
      <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-slate-700">
        <span className="text-slate-400 font-sans block mb-1 uppercase tracking-wider text-[10px]">Messy Document Snippet:</span>
        "{benefit.rawText}"
      </div>

      {/* Structured Fields Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs">
        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium">Category</span>
          </div>
          <p className="font-semibold text-slate-900 capitalize">
            {benefit.category.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Tag className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-medium">Benefit Type</span>
          </div>
          <p className="font-semibold text-slate-900 capitalize">
            {benefit.type.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Total Amount</span>
          </div>
          <p className="font-bold text-emerald-700 text-sm">
            {formatAmount(benefit.amount, benefit.currency)}
          </p>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Frequency</span>
          </div>
          <p className="font-semibold text-slate-900 capitalize">
            {benefit.frequency ? benefit.frequency.replace(/_/g, ' ') : 'Unspecified'}
          </p>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium">Instalments</span>
          </div>
          <p className="font-semibold text-slate-900">
            {benefit.numberOfInstalments ? `${benefit.numberOfInstalments} instalment(s)` : 'N/A'}
          </p>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-medium">Per Instalment</span>
          </div>
          <p className="font-semibold text-teal-800">
            {formatAmount(benefit.instalmentAmount, benefit.currency)}
          </p>
        </div>
      </div>

      {/* Review Reasons Warning if flagged */}
      {benefit.reviewReasons && benefit.reviewReasons.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <p className="font-bold text-amber-900 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Human Review Required (Zero Guessing Policy):
          </p>
          <ul className="list-disc list-inside text-amber-800 space-y-0.5">
            {benefit.reviewReasons.map((reason, idx) => (
              <li key={idx} className="font-mono text-[11px]">{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
