"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Users, Video, Settings, Bell, Search, X, LogOut, Calendar, ArrowLeft, Home } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'critical', title: 'Critical AI Flag', message: 'Eleanor Vance (PT-1290) flagged as HIGH RISK — 92% cardiac event probability.', time: '2m ago', read: false },
  { id: 2, type: 'lab', title: 'Lab Results Available', message: 'CBC + CMP results ready for Sarah Jenkins (PT-4322).', time: '15m ago', read: false },
  { id: 3, type: 'info', title: 'Telehealth Reminder', message: 'Session with David Park starts in 30 minutes.', time: '28m ago', read: true },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [userName, setUserName] = useState('Doctor');
  const [initials, setInitials] = useState('DR');
  const [doctorId, setDoctorId] = useState('');
  const [toastNotif, setToastNotif] = useState<string | null>(null);
  const appointmentsRef = React.useRef<any[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
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

  useEffect(() => {
    const authData = localStorage.getItem('provider_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (!parsed.authenticated || parsed.role !== 'doctor') {
          router.push('/provider/login');
          return;
        }
        
        if (parsed.token) {
          const base64Url = parsed.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(base64));
          const name = decoded.email?.split('@')[0] || decoded.systemId || 'Doctor';
          setUserName(name);
          setInitials(name.substring(0, 2).toUpperCase());
          if (decoded.sub) setDoctorId(decoded.sub);
        }
      } catch (e) {
        console.error('Auth parse error:', e);
      }
    } else {
      router.push('/provider/login');
    }
  }, [router]);

  useEffect(() => {
    if (!doctorId) return;

    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/doctor/${doctorId}`);
        if (res.ok) {
          appointmentsRef.current = await res.json();
        }
      } catch (e) {}
    };
    fetchAppointments();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/doctor/${doctorId}`);
        if (res.ok) {
          const newData = await res.json();
          let alerted = false;
          
          newData.forEach((newAppt: any) => {
            const oldAppt = appointmentsRef.current.find((a) => a.id === newAppt.id);
            // If we have a new appointment that wasn't in our previous list (or status just updated to SCHEDULED)
            if (!oldAppt || (oldAppt.status !== 'SCHEDULED' && newAppt.status === 'SCHEDULED')) {
              if (!alerted) {
                playAlarm();
                alerted = true;
              }
              const dateStr = new Date(newAppt.appointmentDate).toLocaleString();
              const msg = `New Appointment: ${newAppt.patientName || newAppt.patientSystemId} on ${dateStr}`;
              
              setToastNotif(msg);
              setTimeout(() => setToastNotif(null), 10000);
              
              setNotifications(prev => [
                { id: Date.now(), type: 'info', title: 'New Appointment Assigned', message: msg, time: 'Just now', read: false },
                ...prev
              ]);
            }
          });
          appointmentsRef.current = newData;
        }
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [doctorId]);



  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowNotifs(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    localStorage.removeItem('provider_auth');
    router.push('/provider/login');
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] dark:bg-[#121212]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] dark:border-[#333333]">
          <Link href="/provider/triage" className="flex items-center gap-2 text-[#0F52BA] dark:text-[#2B73EA]">
            <Activity className="h-6 w-6 font-bold" />
            <span className="text-xl font-bold font-heading tracking-tight">Help+</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem icon={<Activity className="w-5 h-5" />} label="Triage Queue" href="/provider/triage" active={pathname === '/provider/triage'} />
          <NavItem icon={<Users className="w-5 h-5" />} label="Patient Roster" href="/provider/patients" active={pathname === '/provider/patients'} />
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Appointments" href="/provider/appointments" active={pathname === '/provider/appointments'} />
          <NavItem icon={<Video className="w-5 h-5" />} label="Telehealth" href="/provider/telehealth" active={pathname === '/provider/telehealth'} />
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#333333] space-y-2">
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" href="/provider/settings" active={pathname === '/provider/settings'} />
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
      <div className="flex-1 flex flex-col min-w-0 relative">
        {toastNotif && (
          <div className="absolute top-20 right-8 z-50 bg-[#0F52BA] text-white p-4 rounded-lg shadow-lg border border-[#0a3d8f] flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
            <Bell className="w-5 h-5 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm">New Assignment</h4>
              <p className="text-sm mt-1">{toastNotif}</p>
            </div>
            <button onClick={() => setToastNotif(null)} className="ml-4 text-white/80 hover:text-white">
              ×
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#E5E7EB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] glass sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline">Back</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
                title="Go to Landing Page"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Home</span>
              </button>
            </div>
            
            <div className="flex items-center w-72 relative">
              <Search className="w-4 h-4 absolute left-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search patients, MRN..." 
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-md pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none"
              />
            </div>
          </div>
            <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative dropdown-container">
              <button 
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  if (!showNotifs) setShowProfileMenu(false);
                }} 
                className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#D32F2F] rounded-full border-2 border-white dark:border-[#1E1E1E] text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-12 w-96 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#333333] flex items-center justify-between bg-gray-50 dark:bg-[#1A1A1A]">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-[#0F52BA] hover:underline">Mark all read</button>
                      )}
                      <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#333333]">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'critical' ? 'bg-[#D32F2F]' : n.type === 'lab' ? 'bg-[#F57C00]' : 'bg-[#0F52BA]'}`} />
                          <div>
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <div 
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  if (!showProfileMenu) setShowNotifs(false);
                }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#20B2AA] flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity uppercase"
              >
                {initials}
              </div>
              
              {showProfileMenu && (
                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#333333] bg-gray-50 dark:bg-[#1A1A1A]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
                    <p className="text-xs text-gray-500">Provider</p>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-[#D32F2F] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors font-medium"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, href }: { icon: React.ReactNode; label: string; active?: boolean; href: string }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-[#0F52BA]/10 text-[#0F52BA] dark:text-[#2B73EA] dark:bg-[#2B73EA]/20' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
