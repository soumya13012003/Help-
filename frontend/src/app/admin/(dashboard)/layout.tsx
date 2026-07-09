"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Users, Settings, Search, ShieldCheck, Database, Key, Calendar, ArrowLeft, Home } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Admin');
  const [initials, setInitials] = useState('AD');

  useEffect(() => {
    const authData = localStorage.getItem('admin_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (!parsed.authenticated || parsed.role !== 'admin') {
          router.push('/admin/login');
          return;
        }
        
        if (parsed.token) {
          const base64Url = parsed.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(base64));
          const name = decoded.email?.split('@')[0] || decoded.systemId || 'Admin';
          setUserName(name);
          setInitials(name.substring(0, 2).toUpperCase());
        }
      } catch (e) {
        console.error('Auth parse error:', e);
      }
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] dark:bg-[#121212]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] dark:border-[#333333]">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-purple-700 dark:text-purple-500">
            <ShieldCheck className="h-6 w-6 font-bold" />
            <span className="text-xl font-bold font-heading tracking-tight">Help+ Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem icon={<Activity className="w-5 h-5" />} label="System Overview" href="/admin/dashboard" active={pathname === '/admin/dashboard'} />
          <NavItem icon={<Users className="w-5 h-5" />} label="User Management" href="/admin/users" active={pathname === '/admin/users'} />
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Appointment Queue" href="/admin/appointments" active={pathname === '/admin/appointments'} />
          <NavItem icon={<Database className="w-5 h-5" />} label="Audit Logs" href="/admin/logs" active={pathname === '/admin/logs'} />
          <NavItem icon={<Key className="w-5 h-5" />} label="Security & IAM" href="/admin/security" active={pathname === '/admin/security'} />
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#333333]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#E5E7EB] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#1E1E1E] sticky top-0 z-10">
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
                placeholder="Search users, IDs, logs..." 
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-md pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
               {userName}
             </span>
          </div>
        </header>
        
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
          ? 'bg-purple-100 text-purple-700 dark:text-purple-400 dark:bg-purple-900/20' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
