import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '../../../../../config';
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, Shield } from 'lucide-react';

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('System Administrator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${IAM_SERVICE_URL}/auth/admin/signup`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, roleTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessId(data.systemId);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create account.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to connect to authentication server.');
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl overflow-hidden p-8 text-center border border-[#E5E7EB] dark:border-[#333333]">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-6">Your unique Admin ID has been generated. <strong className="text-red-500">Please save this ID, as you will need it to log in.</strong></p>
          
          <div className="bg-gray-50 dark:bg-[#121212] border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 mb-8">
            <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Your Admin ID</span>
            <span className="text-4xl font-mono font-bold text-purple-600 tracking-wider">{successId}</span>
          </div>

          <button 
            onClick={() => router.push('/admin/login')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-row-reverse">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-bl from-purple-900 via-purple-700 to-indigo-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="flex justify-end relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Help+</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6 text-right">
          <h1 className="text-4xl font-bold text-white leading-tight">
            System Overseer<br />Operations
          </h1>
          <p className="text-white/70 text-lg ml-auto max-w-md leading-relaxed">
            Gain access to system configuration, audit logs, and IAM permissions.
          </p>
        </div>
        <div className="relative z-10 flex justify-end items-center gap-2 text-white/40 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>SOC 2 Type II · HIPAA · HITRUST CSF Certified</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 text-purple-700 mb-10 justify-center">
            <ShieldCheck className="h-7 w-7" />
            <span className="text-2xl font-bold tracking-tight">Help+</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Registration</h2>
            <p className="text-gray-500 text-sm mt-2">Sign up for a Help+ administrator pass</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Role Title</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. System Administrator"
                  className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@help-plus.com"
                  className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                  required
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
                  required
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
              className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already an admin? <Link href="/admin/login" className="text-purple-700 font-semibold hover:underline">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
