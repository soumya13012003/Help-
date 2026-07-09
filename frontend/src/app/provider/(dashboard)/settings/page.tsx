"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Bell, Shield, Palette, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your Help+ workspace</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <SettingsSection title="Provider Profile" icon={<User className="w-5 h-5" />}>
          <div className="grid grid-cols-2 gap-4">
            <SettingsInput label="Full Name" defaultValue="Dr. Rajan Mehta" />
            <SettingsInput label="Specialty" defaultValue="Cardiology" />
            <SettingsInput label="NPI Number" defaultValue="1234567890" />
            <SettingsInput label="Email" defaultValue="dr.mehta@helpplus.health" />
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={<Bell className="w-5 h-5" />}>
          <div className="space-y-4">
            <ToggleRow label="Enable Push Notifications" description="Receive alerts for new patients, lab results, and messages." enabled={notifEnabled} onToggle={() => setNotifEnabled(!notifEnabled)} />
            <ToggleRow label="Critical AI Flags" description="Immediate alerts when AI detects high-risk patients in the triage queue." enabled={criticalAlerts} onToggle={() => setCriticalAlerts(!criticalAlerts)} />
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security & Compliance" icon={<Shield className="w-5 h-5" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Enforced by organization policy (HIPAA)</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg">
              <div>
                <p className="text-sm font-medium">Session Timeout</p>
                <p className="text-xs text-gray-500">Automatic logout after inactivity</p>
              </div>
              <span className="text-sm font-medium">15 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg">
              <div>
                <p className="text-sm font-medium">Audit Log Access</p>
                <p className="text-xs text-gray-500">All clinical decisions are cryptographically sealed</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">SHA-256</span>
            </div>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance" icon={<Palette className="w-5 h-5" />}>
          <ToggleRow label="Dark Mode" description="Switch between light and dark themes." enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </SettingsSection>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button variant="primary" size="md" onClick={handleSave}>
            {saved ? <><Check className="w-4 h-4 mr-1" /> Saved!</> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#333333] bg-gray-50 dark:bg-[#1A1A1A] flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SettingsInput({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none"
      />
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-[#0F52BA]' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
