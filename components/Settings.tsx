
import React, { useState } from 'react';
import { CustomTemplate, Category } from '../types';
import { CATEGORIES, CATEGORY_LABELS } from '../constants';
import { db } from '../services/dbService';
import { Plus, Trash2, Save, X, Settings as SettingsIcon, Database, Download, FileText, AlertTriangle } from 'lucide-react';

interface Props {
  templates: CustomTemplate[];
  onAdd: (template: Omit<CustomTemplate, 'id'>) => void;
  onDelete: (id: string) => void;
}

const Settings: React.FC<Props> = ({ templates, onAdd, onDelete }) => {
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('work');
  const [isAdding, setIsAdding] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd({ text: newText.trim(), category: newCategory });
    setNewText('');
    setIsAdding(false);
  };

  const exportJSON = async () => {
    const profile = await db.getProfile();
    const history = await db.getHistory();
    const templates = await db.getTemplates();
    const data = JSON.stringify({ profile, history, templates }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-capital-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSQLiteFile = async () => {
    const binary = await db.getDatabaseBinary();
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'excuses.db';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = async () => {
    await db.clearAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <SettingsIcon className="w-5 h-5 text-indigo-500" />
            Strategic Templates
          </h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
            >
              <Plus size={16} /> New Phrase
            </button>
          )}
        </div>

        {isAdding && (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Classification</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${newCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pardon Phrasing</label>
              <textarea
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                placeholder="e.g. Due to a localized technical failure in my home network, I am unable to..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"><Save size={16} /> Commit Template</button>
              <button onClick={() => setIsAdding(false)} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 flex items-center justify-center gap-2">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-medium">No custom templates stored in local ledger.</p>
            </div>
          ) : (
            templates.map(template => (
              <div key={template.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 mb-1.5">{CATEGORY_LABELS[template.category]}</span>
                  <p className="text-slate-700 text-sm font-semibold pr-4 leading-relaxed">"{template.text}"</p>
                </div>
                <button onClick={() => onDelete(template.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Forensic Database Management */}
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Database className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Forensic Ledger Management</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-bold uppercase tracking-widest">database/excuses.db</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
              <Download className="w-4 h-4" /> Data Portability
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={downloadSQLiteFile} 
                className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-sm font-bold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-indigo-400 group-hover:text-white" />
                  <span>Download excuses.db</span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-indigo-200">SQLite Binary</span>
              </button>
              
              <button 
                onClick={exportJSON} 
                className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-sm font-bold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400 group-hover:text-white" />
                  <span>Audit Export (JSON)</span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-indigo-200">Human Readable</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-rose-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Finality Protocol
            </h3>
            <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl">
              <p className="text-[11px] text-rose-300 leading-relaxed mb-4 font-medium italic">
                Purging the local database resets all social capital metrics. Credibility will return to 100%, but history is erased forever.
              </p>
              {!showClearConfirm ? (
                <button 
                  onClick={() => setShowClearConfirm(true)} 
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Wipe Database
                </button>
              ) : (
                <div className="flex gap-2 animate-in slide-in-from-bottom-2">
                  <button onClick={clearAllData} className="flex-1 bg-rose-900 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">Confirm Wipe</button>
                  <button onClick={() => setShowClearConfirm(false)} className="px-4 bg-slate-700 text-slate-300 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 transition-colors">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
