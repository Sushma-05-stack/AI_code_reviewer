import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  Code2, Trash2, Download, Search,
  ChevronLeft, ChevronRight, GitBranch, Upload, FileCode
} from 'lucide-react';

const SOURCE_ICONS = {
  github: GitBranch,
  zip: Upload,
  file: FileCode,
};

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/history?page=${p}&limit=10`);
      setReports(res.data.reports);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted');
      fetchHistory(page);
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const filtered = reports.filter(r =>
    r.repositoryName.toLowerCase().includes(search.toLowerCase()) ||
    r.language.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (score) =>
    score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

  const scoreBg = (score) =>
    score >= 80 ? 'bg-green-500/10 border-green-500/20' : score >= 60 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review History</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} total reviews</p>
        </div>
        <Link to="/upload">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Upload size={16} /> New Review
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by repository name or language..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-all text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex gap-2">
            {[0,1,2].map(i => <div key={i} className="loading-dot w-3 h-3 rounded-full bg-purple-500" />)}
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((report, i) => {
            const SourceIcon = SOURCE_ICONS[report.sourceType] || FileCode;
            return (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/results/${report._id}`}>
                  <div className="glass rounded-2xl p-5 border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                          <SourceIcon size={18} className="text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {report.repositoryName}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500">{report.reviewType}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500">{report.language}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Issue counts */}
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                          {report.metrics?.critical > 0 && (
                            <span className="badge-critical px-2 py-1 rounded-lg">{report.metrics.critical} Critical</span>
                          )}
                          {report.metrics?.high > 0 && (
                            <span className="badge-high px-2 py-1 rounded-lg">{report.metrics.high} High</span>
                          )}
                        </div>

                        {/* Score */}
                        <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold ${scoreBg(report.overallScore)} ${scoreColor(report.overallScore)}`}>
                          {report.overallScore}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.preventDefault(); window.open(`/api/reports/${report._id}/pdf`, '_blank'); }}
                            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                            title="Download PDF"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(report._id, e)}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Code2 size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">
            {search ? 'No results match your search' : 'No reviews yet'}
          </p>
          {!search && (
            <Link to="/upload">
              <button className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Start Your First Review
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
