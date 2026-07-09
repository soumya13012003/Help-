import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '../../../../../config';
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, Pill, MessageSquare, Clock, HeartPulse, Activity, Bell } from 'lucide-react';

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    // Auth check
    const authDataStr = localStorage.getItem('patient_auth');
    if (!authDataStr) {
      router.push('/patient/login');
      return;
    }

    try {
      const authData = JSON.parse(authDataStr);
      if (!authData.authenticated || authData.role !== 'patient') {
        router.push('/patient/login');
        return;
      }

      const fetchProfile = async () => {
        try {
          const res = await fetch('http://localhost:3002/patient/profile', {
            headers: {
              Authorization: `Bearer ${authData.token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          } else {
            setProfile({ name: 'Patient' });
          }

          // Fetch real prescriptions for recent medical records
          if (authData.token) {
            const base64Url = authData.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(atob(base64));
            if (decoded?.sub) {
              const pRes = await fetch(`${PATIENT_SERVICE_URL}/clinical/prescriptions/patient/${decoded.sub}`);
              if (pRes.ok) {
                const pData = await pRes.json();
                setRecentPrescriptions(pData);
              }
            }
          }
        } catch (e) {
          setProfile({ name: 'Patient' });
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } catch (e) {
      router.push('/patient/login');
    }
  }, [router]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><HeartPulse className="w-8 h-8 text-[#20B2AA] animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {profile?.name}</h1>
          <p className="text-gray-500 text-sm">Here is your health overview for today.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-full text-gray-500 hover:text-[#20B2AA] transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Quick Stats / Vitals Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<HeartPulse className="text-rose-500 w-5 h-5" />} title="Heart Rate" value="72 bpm" trend="Normal" trendColor="text-green-500" />
        <StatCard icon={<Activity className="text-blue-500 w-5 h-5" />} title="Blood Pressure" value="120/80" trend="Optimal" trendColor="text-green-500" />
        <StatCard icon={<Clock className="text-amber-500 w-5 h-5" />} title="Next Dose" value="14:00" trend="Aspirin 75mg" trendColor="text-gray-500" />
        <StatCard icon={<Calendar className="text-purple-500 w-5 h-5" />} title="Next Visit" value="Oct 12" trend="Dr. Smith (Cardiology)" trendColor="text-gray-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Content Area (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333333] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#20B2AA]" />
                Upcoming Appointments
              </h2>
              <button className="text-sm font-medium text-[#20B2AA] hover:underline">View All</button>
            </div>
            
            <div className="space-y-3">
              <AppointmentCard 
                doctor="Dr. Sarah Smith" 
                specialty="Cardiologist"
                date="Oct 12, 2026"
                time="10:00 AM"
                type="Video Consult"
                status="Confirmed"
              />
              <AppointmentCard 
                doctor="Dr. James Wilson" 
                specialty="General Physician"
                date="Oct 28, 2026"
                time="2:30 PM"
                type="In-Person"
                status="Pending"
              />
            </div>
            <button className="w-full mt-4 py-2 border border-[#20B2AA] text-[#20B2AA] rounded-xl font-medium text-sm hover:bg-[#20B2AA]/5 transition-colors">
              Book New Appointment
            </button>
          </div>

          {/* Recent Medical Records */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333333] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#20B2AA]" />
                Recent Medical Records
              </h2>
              <button onClick={() => router.push('/patient/records')} className="text-sm font-medium text-[#20B2AA] hover:underline">View All</button>
            </div>
            
            <div className="space-y-3">
              {recentPrescriptions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent records found.</p>
              ) : (
                // Group by appointment ID to only show 1 card per prescription
                Object.values(recentPrescriptions.reduce((acc: any, curr: any) => {
                  if (!acc[curr.appointmentId]) acc[curr.appointmentId] = curr;
                  return acc;
                }, {})).slice(0, 3).map((p: any) => (
                  <RecordCard 
                    key={p.id} 
                    title={`Digital Prescription`} 
                    date={new Date(p.createdAt).toLocaleDateString()} 
                    doctor={p.doctorName} 
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Area (1 column on large screens) */}
        <div className="space-y-6">
          
          {/* Active Prescriptions */}
          <div className="bg-gradient-to-br from-[#20B2AA]/10 to-[#0F52BA]/10 rounded-2xl p-5 border border-[#20B2AA]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#0F52BA]" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Prescriptions</h2>
              </div>
              <button onClick={() => router.push('/patient/records')} className="text-xs font-medium text-[#20B2AA] hover:underline">View All</button>
            </div>
            
            <ul className="space-y-4">
              {recentPrescriptions.length === 0 ? (
                <li className="text-gray-500 text-sm">No active medicines found.</li>
              ) : (
                recentPrescriptions.slice(0, 3).map((med, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{med.medication} {med.dosage && `- ${med.dosage}`}</p>
                      <p className="text-xs text-gray-500">{med.frequency}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Messages */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333333] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#20B2AA]" />
                Messages
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 items-start cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">SS</div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-[#20B2AA] transition-colors">Dr. Sarah Smith</p>
                  <p className="text-xs text-gray-500 line-clamp-1">Your recent lab results look good. Keep up the diet.</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Open Chat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend, trendColor }: any) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-2xl border border-gray-100 dark:border-[#333333] shadow-sm flex flex-col justify-between h-28">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
        {icon} {title}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className={`text-xs font-medium mt-1 ${trendColor}`}>{trend}</p>
      </div>
    </div>
  );
}

function AppointmentCard({ doctor, specialty, date, time, type, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#20B2AA]/30 transition-colors bg-gray-50/50 dark:bg-[#121212]/50">
      <div className="flex gap-3 items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#20B2AA] to-[#0F52BA] flex items-center justify-center text-white font-bold shadow-sm">
          {doctor.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{doctor}</p>
          <p className="text-xs text-gray-500">{specialty}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{type}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{status}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm text-gray-900 dark:text-white">{date}</p>
        <p className="text-xs text-gray-500 font-medium">{time}</p>
      </div>
    </div>
  );
}

function RecordCard({ title, date, doctor }: any) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#20B2AA]/30 transition-colors bg-gray-50/50 dark:bg-[#121212]/50 cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FileText className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500">Uploaded by {doctor}</p>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">{date}</span>
    </div>
  );
}
