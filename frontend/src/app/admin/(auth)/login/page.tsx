import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '../../../../../config';
"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Eye, EyeOff, Lock, Mail, Shield, ArrowRight, Loader2, Key, ShieldCheck, User, ArrowLeft, Home } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  const [systemId, setSystemId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!systemId.trim() || !password.trim()) {
      setError('Please enter your Admin ID and password.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${IAM_SERVICE_URL}/auth/admin/login`;
      
      const body = { systemId, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_auth', JSON.stringify({
          authenticated: true,
          token: data.access_token,
          refresh_token: data.refresh_token,
          role: 'admin',
        }));

        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid credentials or missing MFA setup.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to authentication server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-50 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </div>
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-900 via-purple-700 to-indigo-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Help+</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Admin Portal
          </h1>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            Secure IAM authenticated access strictly for verified Administrators.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>SOC 2 Type II · HIPAA · HITRUST CSF Certified</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administrator Access</h2>
            <p className="text-gray-500 text-sm mt-2">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Admin ID</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                  placeholder="ADM-123456"
                  className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Need an admin account? <a href="/admin/signup" className="text-purple-700 font-semibold hover:underline">Apply here</a>
          </p>

        </div>
      </div>
    </div>
  );
}
