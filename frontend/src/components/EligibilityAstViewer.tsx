import React from 'react';
import type { EligibilityParseResult, EligibilityConditionNode, AtomicCondition, CompoundCondition } from '../types';
import { AlertTriangle, GitFork, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  eligibility: EligibilityParseResult;
}

export const EligibilityAstViewer: React.FC<Props> = ({ eligibility }) => {
  const isParsed = eligibility.status === 'PARSED';

  const renderConditionNode = (node: EligibilityConditionNode, depth: number = 0): React.ReactNode => {
    if (node.type === 'ATOMIC') {
      const atomic = node as AtomicCondition;
      let displayValue = '';
      if (Array.isArray(atomic.value)) {
        displayValue = `[ ${atomic.value.join(', ')} ]`;
      } else if (typeof atomic.value === 'boolean') {
        displayValue = atomic.value ? 'YES' : 'NO';
      } else if (atomic.concept === 'income' && typeof atomic.value === 'number') {
        displayValue = `₹ ${atomic.value.toLocaleString('en-IN')}`;
      } else {
        displayValue = String(atomic.value);
      }

      if (atomic.unit && !displayValue.includes('₹')) {
        displayValue += ` ${atomic.unit}`;
      }

      return (
        <div key={`${atomic.concept}-${depth}`} className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wide border border-indigo-100">
            {atomic.conceptLabel || atomic.concept}
          </span>

          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {atomic.operator}
          </span>

          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
            {displayValue}
          </span>

          {atomic.rawSnippet && (
            <span className="text-[11px] text-slate-400 font-mono italic ml-auto">
              matched: "{atomic.rawSnippet}"
            </span>
          )}

          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
            {(atomic.confidence * 100).toFixed(0)}% conf
          </span>
        </div>
      );
    }

    if (node.type === 'COMPOUND') {
      const compound = node as CompoundCondition;
      return (
        <div key={`compound-${depth}`} className="relative pl-6 border-l-2 border-indigo-300 my-2 space-y-2">
          <div className="absolute -left-3 top-2 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-sm">
            {compound.combinator}
          </div>
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-2 pt-1 flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" /> All conditions must evaluate to TRUE ({compound.combinator})
          </div>
          <div className="space-y-2">
            {compound.conditions.map((child, idx) => (
              <React.Fragment key={idx}>
                {renderConditionNode(child, depth + 1)}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`rounded-xl border p-5 transition-all shadow-sm ${
      isParsed ? 'bg-white border-slate-200 hover:border-indigo-300' : 'bg-amber-50/40 border-amber-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {isParsed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              <ShieldCheck className="w-3.5 h-3.5" /> Logical AST Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" /> Routed to Review Queue
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono">ID: {eligibility.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Confidence:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            eligibility.confidence >= 0.85 ? 'bg-emerald-50 text-emerald-700' :
            eligibility.confidence >= 0.70 ? 'bg-blue-50 text-blue-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {(eligibility.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Raw input snippet */}
      <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-slate-700">
        <span className="text-slate-400 font-sans block mb-1 uppercase tracking-wider text-[10px]">Messy Eligibility Text:</span>
        "{eligibility.rawText}"
      </div>

      {/* AST Render Area */}
      <div className="mt-4">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          Structured Conditions Tree:
        </p>

        {eligibility.ast ? (
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            {renderConditionNode(eligibility.ast)}
          </div>
        ) : (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center text-xs text-amber-800">
            No valid AST conditions could be deterministically synthesized.
          </div>
        )}
      </div>

      {/* Review reasons callout if flagged */}
      {eligibility.reviewReasons && eligibility.reviewReasons.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <p className="font-bold text-amber-900 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Disqualification & Review Reasons (Zero Guessing Policy):
          </p>
          <ul className="list-disc list-inside text-amber-800 space-y-0.5">
            {eligibility.reviewReasons.map((reason, idx) => (
              <li key={idx} className="font-mono text-[11px]">{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
