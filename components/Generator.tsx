
import React, { useState } from 'react';
import { generateExcuse } from '../services/geminiService';
import { UserProfile, UsageRecord, GeneratedExcuseResponse, CustomTemplate } from '../types';
import { Loader2, AlertCircle, ShieldCheck, Zap, Lock } from 'lucide-react';

interface Props {
  profile: UserProfile;
  history: UsageRecord[];
  customTemplates: CustomTemplate[];
  onExcuseUsed: (excuse: GeneratedExcuseResponse, context: string, wasTrue: boolean) => void;
}

const Generator: React.FC<Props> = ({ profile, history, customTemplates, onExcuseUsed }) => {
  const [context, setContext] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState<'formal' | 'casual'>('formal');
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedExcuseResponse | null>(null);
  const [isTruthful, setIsTruthful] = useState(false);

  const isBankrupt = profile.overallCredibility < 0.25;

  const handleGenerate = async () => {
    if (!context || !audience) return;
    setLoading(true);
    try {
      // Force 'low' risk (truth-heavy) if bankrupt
      const effectiveRisk = isBankrupt ? 'low' : risk;
      const res = await generateExcuse(context, audience, tone, effectiveRisk, profile, history, customTemplates);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isBankrupt && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 animate-pulse">
          <Lock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Social Capital Bankruptcy</h4>
            <p className="text-xs text-rose-600 mt-1">
              Your credibility is too low to sustain creative pardons. "High" and "Medium" risk profiles are locked. 
              The system will now only generate truth-heavy, vulnerable alternatives.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          Request New Pardon
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">The Context</label>
            <textarea
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
              placeholder="e.g. Missed the 9 AM synchronization meeting..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Target Audience</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Direct Manager, Client, Spouse"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tone</label>
                <select 
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Risk Profile</label>
                <select 
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  value={isBankrupt ? 'low' : risk}
                  disabled={isBankrupt}
                  onChange={(e) => setRisk(e.target.value as any)}
                >
                  <option value="low">Low (Truth-heavy)</option>
                  {!isBankrupt && <option value="medium">Medium</option>}
                  {!isBankrupt && <option value="high">High (Creative)</option>}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !context || !audience}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isBankrupt ? 'Generate Confession' : 'Generate Shield')}
        </button>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
                {result.category}
              </span>
              <h3 className="text-2xl font-bold mt-2 text-slate-900 leading-tight">
                "{result.excuse}"
              </h3>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Believability</div>
              <div className={`text-2xl font-black ${result.basePlausibility > 0.7 ? 'text-emerald-500' : result.basePlausibility > 0.4 ? 'text-amber-500' : 'text-rose-500'}`}>
                {(result.basePlausibility * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl mb-6 text-sm text-slate-600 italic border-l-4 border-slate-200">
            {result.reasoning}
          </div>

          <div className="flex flex-col gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${isTruthful ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <input
                id="truth-check"
                type="checkbox"
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                checked={isTruthful}
                onChange={(e) => setIsTruthful(e.target.checked)}
              />
              <label htmlFor="truth-check" className={`text-sm font-medium ${isTruthful ? 'text-emerald-800' : 'text-amber-800'}`}>
                {isTruthful ? 'This is a verified fact. (Social Dividend Applied)' : 'I swear this excuse is 100% factual. (Honesty bonus applies)'}
              </label>
            </div>

            <button
              onClick={() => {
                onExcuseUsed(result, context, isTruthful);
                setResult(null);
                setContext('');
                setAudience('');
                setIsTruthful(false);
              }}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ShieldCheck className="w-5 h-5" />
              Commit to this record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generator;
