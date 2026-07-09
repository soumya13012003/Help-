"use client";

import React from 'react';
import Link from 'next/link';
import { HeartPulse, User, ShieldCheck, Stethoscope, ArrowRight, Activity, Calendar, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-gray-900 dark:text-white font-sans selection:bg-[#20B2AA]/30 overflow-x-hidden">
      
      {/* Background Decorative Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#20B2AA]/20 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-gradient-to-bl from-[#0F52BA]/20 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-gradient-to-tr from-purple-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[#0F52BA] dark:text-white">
          <HeartPulse className="w-8 h-8 text-[#20B2AA]" />
          <span className="text-2xl font-black tracking-tighter">Help+</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          <a href="#" className="hover:text-[#20B2AA] transition-colors">Features</a>
          <a href="#" className="hover:text-[#20B2AA] transition-colors">Security</a>
          <a href="#" className="hover:text-[#20B2AA] transition-colors">About Us</a>
        </div>
        <div>
          <Link href="/patient/signup" className="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-full hover:scale-105 transition-transform shadow-lg">
            Join as Patient
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in-down">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md text-sm font-medium text-[#0F52BA] dark:text-[#20B2AA] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#20B2AA] animate-pulse" />
            Next-Generation Healthcare System
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">
            Seamless Care, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#20B2AA] via-[#0F52BA] to-purple-600">Elevated Experience.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Help+ brings patients, doctors, and administrators together in one intelligent, secure, and beautiful platform.
          </p>
        </div>
      </section>

      {/* Portals Section */}
      <section className="relative z-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Patient Portal */}
          <div className="group h-full bg-white/60 dark:bg-[#111111]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#20B2AA]/10 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 rounded-2xl bg-[#20B2AA]/10 flex items-center justify-center mb-8">
              <User className="w-7 h-7 text-[#20B2AA]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-[#20B2AA] transition-colors">Patient Portal</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
              Book appointments, access test results, and connect with your care team instantly. Your health, in your hands.
            </p>
            <div className="mt-auto flex flex-col gap-3">
              <Link href="/patient/login" className="flex items-center text-sm font-semibold text-[#20B2AA] hover:underline">
                Access Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/patient/signup" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:underline">
                New here? Create Patient Account
              </Link>
            </div>
          </div>

          {/* Doctor Portal */}
          <div className="group h-full bg-white/60 dark:bg-[#111111]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F52BA]/10 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 rounded-2xl bg-[#0F52BA]/10 flex items-center justify-center mb-8">
              <Stethoscope className="w-7 h-7 text-[#0F52BA]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-[#0F52BA] transition-colors">Doctor Portal</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
              Manage your clinical schedule, review AI-powered insights, and deliver exceptional care efficiently.
            </p>
            <div className="mt-auto flex flex-col gap-3">
              <Link href="/provider/login" className="flex items-center text-sm font-semibold text-[#0F52BA] hover:underline">
                Access Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/provider/signup" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:underline">
                Apply for Doctor Access
              </Link>
            </div>
          </div>

          {/* Admin Portal */}
          <div className="group h-full bg-white/60 dark:bg-[#111111]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 flex items-center justify-center mb-8">
              <ShieldCheck className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-purple-500 transition-colors">Admin Portal</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
              Oversee system operations, manage staff approvals, monitor analytics, and maintain infrastructure.
            </p>
            <div className="mt-auto flex flex-col gap-3">
              <Link href="/admin/login" className="flex items-center text-sm font-semibold text-purple-600 hover:underline">
                Access Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/admin/signup" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:underline">
                Register as System Admin
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Features Highlight */}
      <section className="relative z-10 bg-white dark:bg-[#111111] py-24 border-t border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="w-12 h-12 mx-auto bg-[#20B2AA]/10 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-[#20B2AA]" />
            </div>
            <h3 className="text-lg font-bold mb-2">Real-time Analytics</h3>
            <p className="text-sm text-gray-500">Live monitoring of vital signs and hospital statistics.</p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto bg-[#0F52BA]/10 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-[#0F52BA]" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Scheduling</h3>
            <p className="text-sm text-gray-500">AI-optimized queue management for zero wait times.</p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto bg-purple-600/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Secure Records</h3>
            <p className="text-sm text-gray-500">HIPAA compliant, fully encrypted electronic health records.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-gray-500 dark:text-gray-600 bg-white dark:bg-[#111111]">
        <p>&copy; {new Date().getFullYear()} Help+ Healthcare. All rights reserved.</p>
      </footer>

    </div>
  );
}
