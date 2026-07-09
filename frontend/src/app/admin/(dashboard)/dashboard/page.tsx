import React from 'react';
import { Users, Shield, Server, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">System Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor Help+ infrastructure, active sessions, and security logs.</p>
        </div>
        <button className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
          Generate System Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="1,248" change="+12%" icon={<Users className="w-5 h-5 text-purple-600" />} />
        <StatCard title="Active Doctors" value="342" change="+3%" icon={<Activity className="w-5 h-5 text-blue-600" />} />
        <StatCard title="Security Alerts" value="2" change="-1" icon={<Shield className="w-5 h-5 text-red-500" />} />
        <StatCard title="API Uptime" value="99.99%" change="Optimal" icon={<Server className="w-5 h-5 text-green-500" />} />
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-100 dark:border-[#333333] shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Recent Audit Logs</h2>
        <div className="space-y-4">
          <LogEntry action="Doctor Account Approved" user="Admin Jane" target="Dr. Smith (Cardiology)" time="2m ago" type="success" />
          <LogEntry action="MFA Policy Updated" user="Admin Jane" target="Global Security Config" time="15m ago" type="info" />
          <LogEntry action="Failed Login Attempt" user="System" target="IP 192.168.1.100" time="1h ago" type="warning" />
          <LogEntry action="New Admin Registered" user="Admin Jane" target="Admin Mike (Operations)" time="3h ago" type="success" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
  const isPositive = change.startsWith('+') || change === 'Optimal';
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-100 dark:border-[#333333] p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg">
          {icon}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

function LogEntry({ action, user, target, time, type }: { action: string, user: string, target: string, time: string, type: 'success' | 'warning' | 'info' }) {
  const colors = {
    success: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    warning: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#333333]">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{action}</p>
          <p className="text-xs text-gray-500">by {user} &rarr; {target}</p>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">{time}</span>
    </div>
  );
}
