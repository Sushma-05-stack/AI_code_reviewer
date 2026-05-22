import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'api', label: 'API Info', icon: Shield },
  ];

  const saveProfile = async () => {
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      // In a real app, call PATCH /api/auth/me
      updateUser({ name: profile.name });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          <h3 className="font-semibold text-white">Profile Information</h3>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user?.name}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
              <div className="text-xs text-slate-500 mt-1">{user?.totalReviews || 0} reviews completed</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/60 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </motion.div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          <h3 className="font-semibold text-white">Change Password</h3>

          {[
            { key: 'current', label: 'Current Password' },
            { key: 'newPass', label: 'New Password' },
            { key: 'confirm', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passwords[key]}
                  onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white focus:outline-none focus:border-purple-500/60 transition-all text-sm"
                  placeholder="••••••••"
                />
                {key === 'newPass' && (
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => toast.success('Password change coming soon')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Lock size={15} /> Update Password
          </button>
        </motion.div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="font-semibold text-white">Notification Preferences</h3>
          {[
            { label: 'Review completed', desc: 'Get notified when a code review finishes', enabled: true },
            { label: 'Critical issues found', desc: 'Alert when critical vulnerabilities are detected', enabled: true },
            { label: 'Weekly summary', desc: 'Weekly digest of your review activity', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5">
              <div>
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${item.enabled ? 'bg-purple-600' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* API Info tab */}
      {activeTab === 'api' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="font-semibold text-white">AI Provider Configuration</h3>
          <p className="text-slate-400 text-sm">Configure your AI API keys in the server <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">.env</code> file.</p>

          <div className="space-y-3">
            {[
              { key: 'GEMINI_API_KEY', label: 'Google Gemini API Key', link: 'https://aistudio.google.com/app/apikey', priority: 'Primary' },
              { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', link: 'https://platform.openai.com/api-keys', priority: 'Fallback' },
            ].map((item) => (
              <div key={item.key} className="p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.priority === 'Primary' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {item.priority}
                  </span>
                </div>
                <code className="text-xs text-slate-400 font-mono">{item.key}=your_key_here</code>
                <div className="mt-2">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300">
                    Get API key →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-green-300 text-sm font-medium mb-1">Demo Mode Available</p>
            <p className="text-slate-400 text-xs">Without API keys, the platform runs in demo mode with pattern-based analysis. Add real API keys for full AI-powered reviews.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
