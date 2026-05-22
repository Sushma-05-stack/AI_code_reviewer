import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Code2, GitBranch, FileSearch, Award, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Security Analysis', desc: 'Detect SQL injection, XSS, hardcoded secrets, and OWASP Top 10 vulnerabilities automatically.', color: 'from-red-500 to-orange-500' },
  { icon: Zap, title: 'Performance Review', desc: 'Identify memory leaks, inefficient loops, N+1 queries, and blocking operations.', color: 'from-yellow-500 to-amber-500' },
  { icon: Code2, title: 'Code Quality', desc: 'Detect code smells, naming violations, duplicate logic, and SOLID principle breaches.', color: 'from-blue-500 to-cyan-500' },
  { icon: GitBranch, title: 'GitHub Integration', desc: 'Scan entire repositories directly from GitHub URLs with one click.', color: 'from-purple-500 to-pink-500' },
  { icon: FileSearch, title: 'Multi-Language', desc: 'Supports Python, JavaScript, TypeScript, Java, C++, Go, PHP, Rust, and more.', color: 'from-green-500 to-teal-500' },
  { icon: Award, title: 'Audit Reports', desc: 'Download professional PDF/JSON audit reports with severity classifications.', color: 'from-indigo-500 to-purple-500' },
];

const languages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'PHP', 'Rust', 'Ruby', 'C#'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg">AI Code Reviewer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link to="/register" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-purple-400 pulse-neon" />
              Powered by Gemini AI & GPT-4
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="gradient-text">AI-Powered</span>
              <br />
              Code Review Platform
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Automatically detect bugs, security vulnerabilities, and performance issues in your code.
              Get professional audit reports in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:opacity-90 transition-opacity neon-purple"
                >
                  Start Free Review <ArrowRight size={20} />
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition-colors"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 mt-20 max-w-2xl mx-auto"
          >
            {[
              { value: '10+', label: 'Languages' },
              { value: '4', label: 'Review Types' },
              { value: '100%', label: 'AI-Powered' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-slate-400 text-lg">Enterprise-grade code analysis in one platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest mb-6">Supported Languages</p>
          <div className="flex flex-wrap justify-center gap-3">
            {languages.map((lang) => (
              <span key={lang} className="px-4 py-2 rounded-full border border-white/10 text-slate-300 text-sm hover:border-purple-500/50 hover:text-purple-300 transition-colors cursor-default">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400">Three simple steps to better code</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Code', desc: 'Upload files, ZIP archives, or paste a GitHub repository URL.' },
              { step: '02', title: 'AI Analysis', desc: 'Our AI engine analyzes your code for bugs, vulnerabilities, and quality issues.' },
              { step: '03', title: 'Get Report', desc: 'Receive a detailed audit report with fixes, scores, and downloadable PDF.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-black gradient-text opacity-30 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 gradient-border">
            <h2 className="text-4xl font-bold mb-4">Ready to Review Your Code?</h2>
            <p className="text-slate-400 mb-8">Join developers who trust AI Code Reviewer for secure, high-quality code.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {['No credit card required', 'Instant results', 'PDF reports'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle size={16} className="text-green-400" />
                  {item}
                </div>
              ))}
            </div>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Get Started Free
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Code2 size={16} className="text-purple-400" />
          <span className="text-white font-medium">AI Code Reviewer</span>
        </div>
        <p>Enterprise-grade AI-powered code analysis platform</p>
      </footer>
    </div>
  );
}
