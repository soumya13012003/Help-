"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HeartPulse, Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Phone, User, ArrowLeft, Home } from 'lucide-react';

export default function PatientLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [systemId, setSystemId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (loginMethod === 'email' && (!systemId.trim() || !password.trim())) {
      setError('Please enter your Patient ID and password.');
      return;
    }

    if (loginMethod === 'phone' && (!phone.trim() || !otp.trim())) {
      setError('Please enter both phone number and OTP.');
      return;
    }

    setLoading(true);

    try {
      // Always route to /auth/patient/login
      const endpoint = `${IAM_SERVICE_URL}/auth/patient/login`;
      
      const body = loginMethod === 'email' 
        ? { systemId, password } 
        : { phone, otp }; // Assuming backend will eventually support this

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('patient_auth', JSON.stringify({
          authenticated: true,
          token: data.access_token,
          refresh_token: data.refresh_token,
          role: 'patient',
        }));

        router.push('/patient/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to authentication server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-4 sm:p-8 relative">
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-50 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </button>
      </div>
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#333333] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#20B2AA] to-[#0F52BA] p-8 text-center relative overflow-hidden">
           <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-white/10" />
           <div className="absolute bottom-[-30px] left-[-30px] w-[100px] h-[100px] rounded-full bg-white/10" />
           
           <div className="relative z-10 flex flex-col items-center justify-center">
             <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
               <HeartPulse className="w-7 h-7 text-white" />
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight">Patient Portal</h2>
             <p className="text-white/80 text-sm mt-1">Access your medical records securely</p>
           </div>
        </div>

        <div className="p-8">
          {isRegistered && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium text-center">
              Registration successful! Please log in.
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-lg mb-6">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'email' ? 'bg-white shadow text-[#20B2AA]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'phone' ? 'bg-white shadow text-[#20B2AA]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Phone (OTP)
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginMethod === 'email' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Patient ID</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={systemId}
                      onChange={(e) => setSystemId(e.target.value)}
                      placeholder="PAT-123456"
                      className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
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
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
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
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">One-Time Password (OTP)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none tracking-widest"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#20B2AA] hover:underline">
                      Send OTP
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/patient/forgot-password" className="text-xs text-[#20B2AA] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#20B2AA] hover:bg-[#1a928c] text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 shadow-lg shadow-[#20B2AA]/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            New to Help+? <Link href="/patient/signup" className="text-[#20B2AA] font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
