import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Code2, Download, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Info, ArrowLeft, FileText, Copy
} from 'lucide-react';

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'badge-critical' },
  High: { color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'badge-high' },
  Medium: { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'badge-medium' },
  Low: { color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'badge-low' },
};

function ScoreRing({ score, size = 120 }) {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black text-white">{score}</div>
        <div className="text-xs text-slate-400">/ 100</div>
      </div>
    </div>
  );
}

function IssueCard({ issue, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.Medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.badge} flex-shrink-0`}>
            {issue.severity}
          </span>
          <span className="text-sm text-white font-medium truncate">{issue.issue}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className="text-xs text-slate-500 hidden sm:block">{issue.file}:{issue.line}</span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</div>
                  <div className="text-sm text-slate-300 font-mono">{issue.file} — Line {issue.line}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Category</div>
                  <div className="text-sm text-slate-300">{issue.category}</div>
                </div>
              </div>

              {issue.impact && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Impact</div>
                  <div className="text-sm text-slate-300 leading-relaxed">{issue.impact}</div>
                </div>
              )}

              {issue.fix && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommended Fix</div>
                  <div className="text-sm text-slate-300 leading-relaxed">{issue.fix}</div>
                </div>
              )}

              {issue.optimizedCode && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Corrected Code</div>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <Editor
                      height="120px"
                      defaultLanguage="javascript"
                      value={issue.optimizedCode}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                        lineNumbers: 'off',
                        padding: { top: 8, bottom: 8 },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [severityFilter, setSeverityFilter] = useState('All');

  useEffect(() => {
    api.get(`/review/${id}`)
      .then(res => setReport(res.data.report))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPDF = () => {
    window.open(`/api/reports/${id}/pdf`, '_blank');
  };

  const downloadJSON = () => {
    window.open(`/api/reports/${id}/json`, '_blank');
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2">
          {[0,1,2].map(i => <div key={i} className="loading-dot w-3 h-3 rounded-full bg-purple-500" />)}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
        <p className="text-white text-lg mb-4">Report not found</p>
        <Link to="/history" className="text-purple-400 hover:text-purple-300">← Back to History</Link>
      </div>
    );
  }

  const filteredIssues = severityFilter === 'All'
    ? report.issues
    : report.issues.filter(i => i.severity === severityFilter);

  const barData = [
    { name: 'Critical', value: report.metrics?.critical || 0, fill: '#ef4444' },
    { name: 'High', value: report.metrics?.high || 0, fill: '#f97316' },
    { name: 'Medium', value: report.metrics?.medium || 0, fill: '#eab308' },
    { name: 'Low', value: report.metrics?.low || 0, fill: '#22c55e' },
  ];

  const tabs = ['overview', 'issues', 'code', 'recommendations'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/history" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={16} /> Back to History
          </Link>
          <h1 className="text-2xl font-bold text-white">{report.repositoryName}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
            <span>{report.reviewType}</span>
            <span>·</span>
            <span>{report.language}</span>
            <span>·</span>
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            {report.processingTime && <><span>·</span><span>{(report.processingTime / 1000).toFixed(1)}s</span></>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-all"
          >
            <Download size={15} /> JSON
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <FileText size={15} /> PDF Report
          </button>
        </div>
      </div>

      {/* Score + metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
          <ScoreRing score={report.overallScore} />
          <div className="text-sm text-slate-400 mt-3">Overall Score</div>
        </div>
        {[
          { label: 'Critical', value: report.metrics?.critical || 0, color: 'text-red-400' },
          { label: 'High', value: report.metrics?.high || 0, color: 'text-orange-400' },
          { label: 'Total Issues', value: report.metrics?.totalIssues || 0, color: 'text-purple-400' },
        ].map((m) => (
          <div key={m.label} className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
            <div className={`text-4xl font-black ${m.color}`}>{m.value}</div>
            <div className="text-sm text-slate-400 mt-2">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-blue-400" />
          <h3 className="font-semibold text-white">Executive Summary</h3>
        </div>
        <p className="text-slate-300 leading-relaxed">{report.summary}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'issues' ? `Issues (${report.issues?.length || 0})` : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Bar chart */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-white mb-6">Issue Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px', color: '#e2e8f0' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'issues' && (
          <motion.div key="issues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    severityFilter === sev
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                  {sev !== 'All' && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({report.issues?.filter(i => i.severity === sev).length || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredIssues.length > 0 ? (
              <div className="space-y-3">
                {filteredIssues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <p className="text-white text-lg">No {severityFilter !== 'All' ? severityFilter : ''} issues found</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'code' && (
          <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-purple-400" />
                  <span className="text-sm font-medium text-white">Optimized Code</span>
                </div>
                <button
                  onClick={() => copyCode(report.optimizedCode)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              {report.optimizedCode ? (
                <Editor
                  height="500px"
                  defaultLanguage={report.language?.toLowerCase() || 'javascript'}
                  value={report.optimizedCode}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  No optimized code available
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div key="recommendations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-white mb-6">AI Recommendations</h3>
              {report.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {report.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/3 border border-white/5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">{i + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No recommendations available</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
