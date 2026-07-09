"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, FileText, User, HeartPulse, Activity, CreditCard, Settings, LogOut, ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = React.useState('Patient');
  const [initials, setInitials] = React.useState('PT');
  const [patientId, setPatientId] = React.useState('');
  const [notification, setNotification] = React.useState<string | null>(null);
  const appointmentsRef = React.useRef<any[]>([]);

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio API not supported");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('patient_auth');
    router.push('/patient/login');
  };

  React.useEffect(() => {
    const authData = localStorage.getItem('patient_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          const base64Url = parsed.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(base64));
          const name = decoded.email?.split('@')[0] || decoded.systemId || 'Patient';
          setUserName(name);
          setInitials(name.substring(0, 2).toUpperCase());
          if (decoded.sub) setPatientId(decoded.sub);
        }
      } catch (e) {
        console.error('Failed to decode token', e);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!patientId) return;

    // Initial fetch to populate ref
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/patient/${patientId}`);
        if (res.ok) {
          appointmentsRef.current = await res.json();
        }
      } catch (e) {}
    };
    fetchAppointments();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/patient/${patientId}`);
        if (res.ok) {
          const newData = await res.json();
          let alerted = false;
          
          newData.forEach((newAppt: any) => {
            const oldAppt = appointmentsRef.current.find((a) => a.id === newAppt.id);
            if (oldAppt && oldAppt.status === 'REQUESTED' && newAppt.status === 'SCHEDULED') {
              // Trigger alarm
              if (!alerted) {
                playAlarm();
                alerted = true;
              }
              const dateStr = new Date(newAppt.appointmentDate).toLocaleString();
              setNotification(`Appointment Allocated! Dr. ${newAppt.doctorName} on ${dateStr}`);
              setTimeout(() => setNotification(null), 10000); // hide after 10s
            }
          });
          appointmentsRef.current = newData;
        }
      } catch (e) {}
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [patientId]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8F9FA] dark:bg-[#121212]">
      
      {/* Top Bar for Mobile */}
      <header className="md:hidden flex items-center justify-center h-16 bg-white dark:bg-[#1E1E1E] border-b border-[#E5E7EB] dark:border-[#333333] sticky top-0 z-10">
        <div className="flex items-center gap-2 text-[#20B2AA]">
          <HeartPulse className="h-6 w-6 font-bold" />
          <span className="text-xl font-bold font-heading tracking-tight">Help+</span>
        </div>
      </header>

      {/* Sidebar for Desktop / Hidden on Mobile */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] dark:border-[#333333]">
          <div className="flex items-center gap-2 text-[#20B2AA]">
            <HeartPulse className="h-6 w-6 font-bold" />
            <span className="text-xl font-bold font-heading tracking-tight">Help+</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem icon={<Activity className="w-5 h-5" />} label="Overview" href="/patient/dashboard" active={pathname === '/patient/dashboard'} />
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Appointments" href="/patient/appointments" active={pathname === '/patient/appointments'} />
          <NavItem icon={<FileText className="w-5 h-5" />} label="Medical Records" href="/patient/records" active={pathname === '/patient/records'} />
          <NavItem icon={<CreditCard className="w-5 h-5" />} label="Billing" href="/patient/billing" active={pathname === '/patient/billing'} />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" href="/patient/settings" active={pathname === '/patient/settings'} />
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#333333]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {/* Top Header for Desktop */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-[#E5E7EB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
              title="Go to Landing Page"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#20B2AA] to-[#0F52BA] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 relative">
          {notification && (
            <div className="absolute top-4 right-4 z-50 bg-[#20B2AA] text-white p-4 rounded-lg shadow-lg border border-[#1a8f89] flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
              <Bell className="w-5 h-5 mt-0.5 animate-bounce" />
              <div>
                <h4 className="font-bold text-sm">Status Update</h4>
                <p className="text-sm mt-1">{notification}</p>
              </div>
              <button onClick={() => setNotification(null)} className="ml-4 text-white/80 hover:text-white">
                ×
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white dark:bg-[#1E1E1E] border-t border-[#E5E7EB] dark:border-[#333333] flex justify-around items-center z-20">
        <MobileNavItem icon={<Activity className="w-6 h-6" />} label="Overview" href="/patient/dashboard" active={pathname === '/patient/dashboard'} />
        <MobileNavItem icon={<Calendar className="w-6 h-6" />} label="Visits" href="/patient/appointments" active={pathname === '/patient/appointments'} />
        <MobileNavItem icon={<FileText className="w-6 h-6" />} label="Records" href="/patient/records" active={pathname === '/patient/records'} />
        <MobileNavItem icon={<Settings className="w-6 h-6" />} label="Settings" href="/patient/settings" active={pathname === '/patient/settings'} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, href }: { icon: React.ReactNode, label: string, active?: boolean, href: string }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-[#20B2AA]/10 text-[#20B2AA]' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavItem({ icon, label, active, href }: { icon: React.ReactNode, label: string, active?: boolean, href: string }) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        active ? 'text-[#20B2AA]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
