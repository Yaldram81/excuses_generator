
import React, { useState } from 'react';
import { UsageRecord, Outcome } from '../types';
import { Calendar, CheckCircle, HelpCircle, XCircle, MessageSquare, Heart } from 'lucide-react';
import { analyzeReflections } from '../services/geminiService';

interface Props {
  history: UsageRecord[];
  onReflect: (id: string, outcome: Outcome, rating: number, notes: string) => void;
}

const History: React.FC<Props> = ({ history, onReflect }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(Outcome.ACCEPTED);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const handleReflectSubmit = async (record: UsageRecord) => {
    onReflect(record.id, outcome, rating / 10, notes);
    setLoadingInsight(true);
    try {
      const msg = await analyzeReflections({ ...record, outcome, reflectionNotes: notes });
      setInsight(msg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
      setSelectedId(null);
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {insight && (
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg animate-in zoom-in-95 flex items-start gap-4">
          <Heart className="w-8 h-8 shrink-0 fill-indigo-400" />
          <div>
            <h4 className="font-bold mb-1">Ethical Insight</h4>
            <p className="text-indigo-100">{insight}</p>
            <button onClick={() => setInsight(null)} className="mt-2 text-xs font-bold underline opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Audit Log
          </h2>
          <span className="text-sm text-slate-500">{history.length} Records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Your record is clean. For now.
            </div>
          ) : (
            [...history].reverse().map((record) => (
              <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${record.wasTrue ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {record.wasTrue ? 'Fact' : 'Fiction'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${record.credibilityImpact > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {record.credibilityImpact > 0 ? '+' : ''}{(record.credibilityImpact * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="text-lg text-slate-800 font-medium mb-4 italic">
                  "{record.context}"
                </p>

                {record.outcome ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      {record.outcome === Outcome.ACCEPTED && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                      {record.outcome === Outcome.QUESTIONED && <HelpCircle className="w-3 h-3 text-amber-500" />}
                      {record.outcome === Outcome.REJECTED && <XCircle className="w-3 h-3 text-rose-500" />}
                      <span className="capitalize">{record.outcome}</span>
                    </div>
                    {record.reflectionNotes && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        Reflected
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedId(record.id)}
                    className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"
                  >
                    Resolve this record
                  </button>
                )}

                {selectedId === record.id && (
                  <div className="mt-6 p-6 bg-slate-900 rounded-xl text-white space-y-4 animate-in slide-in-from-top-2">
                    <h4 className="font-bold">Post-Event Reflection</h4>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 block">Actual Outcome</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[Outcome.ACCEPTED, Outcome.QUESTIONED, Outcome.REJECTED].map((o) => (
                          <button
                            key={o}
                            onClick={() => setOutcome(o)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${outcome === o ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                          >
                            {o.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs text-slate-400">Internal Comfort Level</label>
                        <span className="text-xs text-indigo-400 font-bold">{rating}/10</span>
                      </div>
                      <input 
                        type="range" min="0" max="10" 
                        value={rating} 
                        onChange={(e) => setRating(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 block">Notes to Self (Ethical Audit)</label>
                      <textarea
                        className="w-full bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none min-h-[80px]"
                        placeholder="Was the lie worth it? What would the truth have cost?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReflectSubmit(record)}
                        disabled={loadingInsight}
                        className="flex-1 bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loadingInsight ? 'Auditing...' : 'Finalize Entry'}
                      </button>
                      <button
                        onClick={() => setSelectedId(null)}
                        className="px-4 py-3 rounded-lg font-bold bg-slate-800 hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
