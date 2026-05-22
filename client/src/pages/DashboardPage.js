import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Shield, Code2, TrendingUp, AlertTriangle,
  Upload, Clock, ArrowRight, Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/stats'),
      api.get('/reports/history?limit=5'),
    ])
      .then(([statsRes, historyRes]) => {
        setStats(statsRes.data);
        setHistory(historyRes.data.reports);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Reviews', value: stats.totalReviews, icon: Code2, color: 'from-purple-600 to-blue-600', change: '+' + stats.totalReviews },
    { label: 'Avg Score', value: `${stats.avgScore}/100`, icon: TrendingUp, color: 'from-green-600 to-teal-600', change: 'Quality metric' },
    { label: 'Total Issues', value: stats.totalIssues, icon: AlertTriangle, color: 'from-orange-600 to-red-600', change: 'Across all reviews' },
    { label: 'Critical Issues', value: stats.criticalIssues, icon: Shield, color: 'from-red-600 to-pink-600', change: 'Needs attention' },
  ] : [];

  const pieData = stats ? Object.entries(stats.languageDistribution || {}).map(([name, value]) => ({ name, value })) : [];
  const PIE_COLORS = ['#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2">
          {[0,1,2].map(i => <div key={i} className="loading-dot w-3 h-3 rounded-full bg-purple-500" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your code review overview</p>
        </div>
        <Link to="/upload">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Upload size={16} /> New Review
          </motion.button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5 border border-white/5 hover:border-purple-500/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">{card.value}</div>
            <div className="text-sm text-slate-400">{card.label}</div>
            <div className="text-xs text-slate-500 mt-1">{card.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score trend */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-purple-400" />
            <h3 className="font-semibold text-white">Score Trend</h3>
          </div>
          {stats?.scoreTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.scoreTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px', color: '#e2e8f0' }}
                  formatter={(v) => [`${v}/100`, 'Score']}
                />
                <Area type="monotone" dataKey="score" stroke="#a855f7" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              No review data yet. <Link to="/upload" className="text-purple-400 ml-1">Start your first review →</Link>
            </div>
          )}
        </div>

        {/* Language distribution */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Code2 size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Languages</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.slice(0, 4).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-slate-500">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm text-center">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent reviews */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-cyan-400" />
            <h3 className="font-semibold text-white">Recent Reviews</h3>
          </div>
          <Link to="/history" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((report) => {
              const scoreColor = report.overallScore >= 80 ? 'text-green-400' : report.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400';
              return (
                <Link key={report._id} to={`/results/${report._id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center">
                        <Code2 size={16} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{report.repositoryName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {report.reviewType} · {report.language} · {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${scoreColor}`}>{report.overallScore}</div>
                        <div className="text-xs text-slate-500">score</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">{report.metrics?.totalIssues || 0}</div>
                        <div className="text-xs text-slate-500">issues</div>
                      </div>
                      <ArrowRight size={16} className="text-slate-600" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Code2 size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No reviews yet</p>
            <Link to="/upload">
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Start Your First Review
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
