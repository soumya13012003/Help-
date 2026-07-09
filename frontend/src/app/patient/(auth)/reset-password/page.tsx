"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HeartPulse, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid reset token.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${IAM_SERVICE_URL}/auth/patient/reset-password`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/patient/login');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset password. The link might be expired.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-gray-500 mb-6">Your password has been successfully reset. You will be redirected to the login page momentarily.</p>
          <Link href="/patient/login" className="text-[#20B2AA] hover:underline font-semibold">
            Click here if you are not redirected
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#333333] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#20B2AA] to-[#0F52BA] p-8 text-center relative overflow-hidden">
           <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-white/10" />
           <div className="absolute bottom-[-30px] left-[-30px] w-[100px] h-[100px] rounded-full bg-white/10" />
           
           <div className="relative z-10 flex flex-col items-center justify-center">
             <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
               <HeartPulse className="w-7 h-7 text-white" />
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight">Create New Password</h2>
           </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
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

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!error.includes('token')}
              className="w-full bg-[#20B2AA] hover:bg-[#1a928c] text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 shadow-lg shadow-[#20B2AA]/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
