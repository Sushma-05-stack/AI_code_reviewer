import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  Upload, GitBranch, FileCode, X, CheckCircle,
  Zap, Shield, Code2, Search, Loader2
} from 'lucide-react';

const REVIEW_TYPES = [
  { value: 'Full Audit', label: 'Full Audit', icon: Search, desc: 'Comprehensive analysis', color: 'from-purple-600 to-blue-600' },
  { value: 'Security', label: 'Security', icon: Shield, desc: 'Vulnerability scan', color: 'from-red-600 to-orange-600' },
  { value: 'Performance', label: 'Performance', icon: Zap, desc: 'Speed & efficiency', color: 'from-yellow-600 to-amber-600' },
  { value: 'Quality', label: 'Code Quality', icon: Code2, desc: 'Best practices', color: 'from-green-600 to-teal-600' },
];

const ACCEPTED_TYPES = {
  'text/plain': ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.php', '.rs', '.rb', '.cs', '.html', '.css'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
};

export default function UploadPage() {
  const [mode, setMode] = useState('file'); // 'file' | 'github'
  const [files, setFiles] = useState([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [reviewType, setReviewType] = useState('Full Audit');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error(`${rejected.length} file(s) rejected. Check file type and size.`);
    }
    setFiles(prev => {
      const newFiles = accepted.filter(f => !prev.find(p => p.name === f.name));
      return [...prev, ...newFiles].slice(0, 20);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleSubmit = async () => {
    if (mode === 'file' && files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }
    if (mode === 'github' && !githubUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    setProgress('Initializing AI review engine...');

    try {
      let reportId;

      if (mode === 'file') {
        setProgress('Uploading files...');
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('reviewType', reviewType);

        setProgress('AI is analyzing your code...');
        const res = await api.post('/review/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total);
            if (pct < 100) setProgress(`Uploading... ${pct}%`);
            else setProgress('AI is analyzing your code...');
          },
        });
        reportId = res.data.reportId;
      } else {
        setProgress('Cloning repository...');
        const res = await api.post('/review/github', { githubUrl: githubUrl.trim(), reviewType });
        reportId = res.data.reportId;
      }

      toast.success('Review completed!');
      navigate(`/results/${reportId}`);
    } catch (err) {
      toast.error(err.message || 'Review failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">New Code Review</h1>
        <p className="text-slate-400 text-sm mt-1">Upload code files or scan a GitHub repository</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { key: 'file', label: 'Upload Files', icon: Upload },
          { key: 'github', label: 'GitHub URL', icon: GitBranch },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === key
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Review type selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Review Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REVIEW_TYPES.map(({ value, label, icon: Icon, desc, color }) => (
            <button
              key={value}
              onClick={() => setReviewType(value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                reviewType === value
                  ? 'border-purple-500/60 bg-purple-500/10'
                  : 'border-white/8 bg-white/3 hover:border-white/15'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon size={15} className="text-white" />
              </div>
              <div className="text-sm font-medium text-white">{label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <AnimatePresence mode="wait">
        {mode === 'file' ? (
          <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-purple-500/40 hover:bg-white/3'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className={isDragActive ? 'text-purple-400' : 'text-slate-500'} />
              </div>
              <p className="text-white font-medium mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-slate-400 text-sm mb-4">or click to browse</p>
              <p className="text-slate-500 text-xs">
                Supports: .py .js .ts .java .cpp .go .php .rs .zip · Max 50MB · Up to 20 files
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                  <span>{files.length} file(s) selected</span>
                  <button onClick={() => setFiles([])} className="text-red-400 hover:text-red-300 text-xs">Clear all</button>
                </div>
                {files.map((file) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode size={16} className="text-purple-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white font-medium">{file.name}</div>
                        <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
                      </div>
                    </div>
                    <button onClick={() => removeFile(file.name)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="github" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-6 border border-white/8">
              <label className="block text-sm font-medium text-slate-300 mb-3">GitHub Repository URL</label>
              <div className="relative">
                <GitBranch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-all text-sm"
                />
              </div>
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-sm font-medium mb-1">Requirements</p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>• Repository must be public</li>
                  <li>• URL format: https://github.com/owner/repo</li>
                  <li>• Large repos are automatically limited to 25 files</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            <span>{progress || 'Processing...'}</span>
          </>
        ) : (
          <>
            <Search size={22} />
            Start AI Review
          </>
        )}
      </motion.button>

      {loading && (
        <div className="glass rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-500 pulse-neon" />
            <span className="text-purple-300 text-sm font-medium">AI Analysis in Progress</span>
          </div>
          <div className="space-y-2">
            {['Parsing code structure', 'Running security checks', 'Analyzing performance', 'Generating recommendations'].map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-slate-400">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
