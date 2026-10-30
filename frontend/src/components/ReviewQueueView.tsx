import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { ReviewItem } from '../types';
import { 
  AlertOctagon, 
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Filter, 
  ShieldAlert,
  Edit3
} from 'lucide-react';

export const ReviewQueueView: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Resolution modal state
  const [resolvingItem, setResolvingItem] = useState<ReviewItem | null>(null);
  const [manualNote, setManualNote] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideAmount, setOverrideAmount] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getReviewQueue(
        statusFilter === 'ALL' ? undefined : statusFilter,
        typeFilter === 'ALL' ? undefined : typeFilter
      );
      setItems(data);
    } catch (err) {
      console.error('Error fetching review items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, typeFilter]);

  const handleResolve = async () => {
    if (!resolvingItem) return;
    try {
      await api.resolveReviewItem(resolvingItem.id, {
        note: manualNote,
        overrideCategory: overrideCategory || undefined,
        overrideAmount: overrideAmount ? Number(overrideAmount) : undefined,
        resolvedBy: 'Senior Compliance Officer',
        resolvedAt: new Date().toISOString()
      });
      setResolvingItem(null);
      setManualNote('');
      setOverrideCategory('');
      setOverrideAmount('');
      fetchItems();
    } catch (err) {
      console.error('Error resolving item:', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.dismissReviewItem(id);
      fetchItems();
    } catch (err) {
      console.error('Error dismissing item:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Banner */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Strict Zero-Guessing Policy Active</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            The normalizer refuses to infer subjective phrases ("good moral standing", "meritorious"), ambiguous timelines ("occasional", "as needed"), or missing monetary caps. These are quarantined here for verified human determination.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-500" />
            Human-in-the-Loop Review Queue
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {items.length} items
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer text-slate-700"
            >
              <option value="PENDING">Pending Review</option>
              <option value="RESOLVED">Resolved / Overridden</option>
              <option value="DISMISSED">Dismissed</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer text-slate-700"
            >
              <option value="ALL">All Targets</option>
              <option value="BENEFIT">Benefit Statements</option>
              <option value="ELIGIBILITY">Eligibility Criteria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review Items Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading review queue...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">Review Queue Clear!</p>
            <p>No items currently require human resolution under the selected filters.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-5 shadow-sm transition-all ${
                item.status === 'PENDING'
                  ? 'bg-white border-amber-200 hover:border-amber-400'
                  : item.status === 'RESOLVED'
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    item.targetType === 'BENEFIT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                  }`}>
                    {item.targetType}
                  </span>

                  <span className="font-bold text-slate-900 text-xs">
                    {item.schemeName || 'Unspecified Scheme Source'}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {item.id}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    item.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Raw Text */}
              <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                <span className="text-slate-400 font-sans block mb-1 uppercase tracking-wider text-[10px]">Quarantined Snippet:</span>
                "{item.rawText}"
              </div>

              {/* Diagnostic Reasons */}
              <div className="mt-3 space-y-1.5">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Diagnostic Rejection Reasons:
                </span>
                <ul className="space-y-1">
                  {item.reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs bg-amber-50 text-amber-900 px-2.5 py-1.5 rounded-lg border border-amber-200 font-mono">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resolved Data Display if already resolved */}
              {item.status === 'RESOLVED' && item.resolvedData && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  <span className="font-bold block mb-1">Human Resolution Notes:</span>
                  <pre className="text-[11px] font-mono bg-white p-2 rounded border border-emerald-100 overflow-x-auto">
                    {JSON.stringify(item.resolvedData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actions */}
              {item.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Dismiss Item
                  </button>
                  <button
                    onClick={() => {
                      setResolvingItem(item);
                      setOverrideCategory(item.extractedPartial?.category || '');
                      setOverrideAmount(item.extractedPartial?.amount ? String(item.extractedPartial.amount) : '');
                    }}
                    className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Resolve / Manual Override
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Human Resolution Modal */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              Human Compliance Resolution
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-50 p-2 rounded">
              "{resolvingItem.rawText}"
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Normalized Category</label>
                <input
                  type="text"
                  placeholder="e.g. financial_assistance, pension"
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Amount (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Compliance Audit Note *</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this interpretation was approved..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setResolvingItem(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolve}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all"
              >
                Approve & Save Structured Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
