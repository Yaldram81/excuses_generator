
import React from 'react';
import { UserProfile, UsageRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, Scale, Coins } from 'lucide-react';
import CredibilityIndicator from './CredibilityIndicator';

interface Props {
  profile: UserProfile;
  history: UsageRecord[];
}

const Dashboard: React.FC<Props> = ({ profile, history }) => {
  const chartData = history.slice(-15).map((h, i) => ({
    name: i,
    credibility: (h.credibilityImpact * 100),
    timestamp: new Date(h.timestamp).toLocaleDateString()
  }));

  const categoryCounts = history.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const interestRate = (profile.honestyDebt * 5); // 5% per unit of debt
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Stats */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Honesty Debt</span>
              <Scale className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">{profile.honestyDebt}</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-tighter">Units Owed</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Interest</span>
              <Coins className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">{interestRate}%</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-tighter">Fiction Surcharge</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Risk Score</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">{(profile.riskScore * 100).toFixed(0)}</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-tighter">Audit Risk</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Trends</span>
              {profile.overallCredibility > 0.5 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
            </div>
            <div className="mt-4">
              <span className={`text-sm font-bold truncate ${profile.overallCredibility > 0.5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profile.overallCredibility > 0.8 ? 'Pristine' : profile.overallCredibility > 0.5 ? 'Stable' : 'Insolvent'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-tighter">Social Rating</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Capital Delta Log</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 15 Sessions</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="credibility" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Profile Sidebar */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Scale size={120} className="text-indigo-900" />
          </div>
          <CredibilityIndicator score={profile.overallCredibility} />
          <h3 className="mt-4 font-bold text-lg text-slate-900">Current Standing</h3>
          <p className="text-xs text-slate-500 text-center mt-2 px-4 italic font-medium leading-relaxed">
            {profile.overallCredibility > 0.8 
              ? "Your capital is abundant. Spend it wisely; honesty is currently your cheapest asset."
              : profile.overallCredibility > 0.5
              ? "Trust is thinning. The interest on your current debt is manageable but rising."
              : "Financial insolvency detected. The social ecosystem is actively devaluing your input."}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Category Fatigue</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="capitalize font-bold truncate">{d.name}</span>
                </div>
                <span className="font-black text-slate-400">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
