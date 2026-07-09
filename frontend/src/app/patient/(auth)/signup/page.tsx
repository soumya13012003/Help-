"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeartPulse, Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, Calendar, Phone, MapPin, Droplet, Users, ArrowLeft, Home } from 'lucide-react';

export default function PatientSignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'Prefer not to say',
    phone: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms & Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      // Assuming iam-service or patient-service handles this
      const endpoint = `${IAM_SERVICE_URL}/auth/patient/signup`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           email: formData.email,
           password: formData.password,
           roles: ["PATIENT"],
           name: formData.name,
           dob: formData.dob,
           gender: formData.gender,
           phone: formData.phone,
           bloodGroup: formData.bloodGroup,
           address: formData.address,
           emergencyContact: formData.emergencyContact
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessId(data.systemId);
        setLoading(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Signup failed.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to connect to server.');
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212] p-4 sm:p-8 relative">
        <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#333333] overflow-hidden p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Successful</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Your Patient ID has been generated.</p>
          
          <div className="bg-gray-50 dark:bg-[#2A2A2A] rounded-xl p-6 mb-8">
            <p className="text-sm text-gray-500 mb-2 uppercase font-semibold">Your Patient ID</p>
            <span className="text-4xl font-mono font-bold text-[#20B2AA] tracking-wider">{successId}</span>
          </div>

          <button 
            onClick={() => router.push('/patient/login')}
            className="w-full bg-[#20B2AA] hover:bg-[#1C9B95] text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

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
      <div className="w-full max-w-2xl bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-100 dark:border-[#333333] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#20B2AA] to-[#0F52BA] p-8 text-center relative overflow-hidden">
           <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-white/10" />
           <div className="absolute bottom-[-30px] left-[-30px] w-[100px] h-[100px] rounded-full bg-white/10" />
           
           <div className="relative z-10 flex flex-col items-center justify-center">
             <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
               <HeartPulse className="w-7 h-7 text-white" />
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight">Create Patient Account</h2>
             <p className="text-white/80 text-sm mt-1">Join Help+ for seamless healthcare access</p>
           </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            
            {/* Basic Info Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="jane@example.com"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
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
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">Demographics & Medical</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none appearance-none"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Blood Group (Optional)</label>
                  <div className="relative">
                    <Droplet className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none appearance-none"
                    >
                      <option value="">Select...</option>
                      <option>A+</option><option>A-</option>
                      <option>B+</option><option>B-</option>
                      <option>AB+</option><option>AB-</option>
                      <option>O+</option><option>O-</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Address *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Full residential address"
                      rows={2}
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">Emergency Contact *</label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Name and Phone Number"
                      className="w-full bg-white dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#333333] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#20B2AA] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#20B2AA] focus:ring-[#20B2AA]"
              />
              <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400">
                I agree to the Help+ <a href="#" className="text-[#20B2AA] hover:underline">Terms of Service</a> and <a href="#" className="text-[#20B2AA] hover:underline">Privacy Policy</a>. I consent to my medical data being processed in accordance with HIPAA regulations.
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#20B2AA] hover:bg-[#1a928c] text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 shadow-lg shadow-[#20B2AA]/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Complete Registration <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Already have a Patient account? <Link href="/patient/login" className="text-[#20B2AA] font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
