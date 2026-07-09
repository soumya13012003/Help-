"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Phone, Video, Mail, Clock, ChevronRight, Heart, Thermometer, Droplets } from 'lucide-react';

const PATIENTS = [
  { id: 'PT-1290', name: 'Eleanor Vance', age: 42, gender: 'Female', dob: '1984-03-12', mrn: 'MRN-00291', phone: '+1 (555) 012-3456', status: 'active', lastVisit: '2 days ago', conditions: ['Hypertension', 'Type 2 Diabetes'], vitals: { bp: '142/92', hr: 78, temp: '98.6°F', spo2: '97%' } },
  { id: 'PT-8841', name: 'Marcus Chen', age: 28, gender: 'Male', dob: '1998-07-22', mrn: 'MRN-00842', phone: '+1 (555) 987-6543', status: 'active', lastVisit: '1 week ago', conditions: ['Migraine', 'Anxiety'], vitals: { bp: '118/76', hr: 72, temp: '98.2°F', spo2: '99%' } },
  { id: 'PT-4322', name: 'Sarah Jenkins', age: 65, gender: 'Female', dob: '1961-11-05', mrn: 'MRN-00433', phone: '+1 (555) 456-7890', status: 'active', lastVisit: 'Today', conditions: ['Hypertension', 'Hyperlipidemia', 'Osteoarthritis'], vitals: { bp: '136/84', hr: 68, temp: '97.9°F', spo2: '96%' } },
  { id: 'PT-7710', name: 'David Park', age: 55, gender: 'Male', dob: '1971-01-30', mrn: 'MRN-00771', phone: '+1 (555) 321-0987', status: 'discharged', lastVisit: '3 weeks ago', conditions: ['COPD', 'Former Smoker'], vitals: { bp: '128/80', hr: 82, temp: '98.4°F', spo2: '93%' } },
];

export default function PatientRosterPage() {
  const [selectedPatient, setSelectedPatient] = useState<typeof PATIENTS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = PATIENTS.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex gap-6">
      {/* Left: Patient List */}
      <div className={`transition-all duration-300 ${selectedPatient ? 'w-2/5' : 'w-full'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">Patient Roster</h1>
            <p className="text-gray-500 text-sm mt-1">{PATIENTS.length} registered patients</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none"
          />
        </div>

        {/* Patient Cards */}
        <div className="space-y-2">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`p-4 bg-white dark:bg-[#1E1E1E] rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedPatient?.id === patient.id
                  ? 'border-[#0F52BA] shadow-md ring-1 ring-[#0F52BA]/20'
                  : 'border-[#E5E7EB] dark:border-[#333333]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#20B2AA] flex items-center justify-center text-white text-sm font-bold">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{patient.name}</h3>
                    <p className="text-xs text-gray-500">{patient.id} · {patient.age} yrs · {patient.gender}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={patient.status === 'active' ? 'default' : 'warning'}>
                    {patient.status === 'active' ? 'Active' : 'Discharged'}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {patient.conditions.map((c, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">No patients match your search.</p>
          )}
        </div>
      </div>

      {/* Right: Patient Detail */}
      {selectedPatient && (
        <div className="w-3/5 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg shadow-sm h-[calc(100vh-6rem)] sticky top-6 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-[#E5E7EB] dark:border-[#333333]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#20B2AA] flex items-center justify-center text-white text-xl font-bold">
                  {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                  <p className="text-sm text-gray-500">DOB: {selectedPatient.dob} · MRN: {selectedPatient.mrn}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"><Phone className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"><Video className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"><Mail className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Latest Vitals</h3>
            <div className="grid grid-cols-4 gap-3">
              <VitalCard icon={<Heart className="w-4 h-4 text-[#D32F2F]" />} label="Blood Pressure" value={selectedPatient.vitals.bp} />
              <VitalCard icon={<Heart className="w-4 h-4 text-[#F57C00]" />} label="Heart Rate" value={`${selectedPatient.vitals.hr} bpm`} />
              <VitalCard icon={<Thermometer className="w-4 h-4 text-[#0F52BA]" />} label="Temperature" value={selectedPatient.vitals.temp} />
              <VitalCard icon={<Droplets className="w-4 h-4 text-[#20B2AA]" />} label="SpO2" value={selectedPatient.vitals.spo2} />
            </div>
          </div>

          {/* Conditions */}
          <div className="px-6 pb-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Active Conditions</h3>
            <div className="space-y-2">
              {selectedPatient.conditions.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg">
                  <span className="text-sm font-medium">{c}</span>
                  <Badge variant="default">Active</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 pb-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <TimelineItem time="Today, 9:15 AM" text="Lab results received (CBC, CMP)" />
              <TimelineItem time="Yesterday, 2:30 PM" text="Telehealth follow-up completed" />
              <TimelineItem time="3 days ago" text="Prescription renewed: Lisinopril 10mg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VitalCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span></div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function TimelineItem({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-1.5 w-2 h-2 rounded-full bg-[#0F52BA] flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-900 dark:text-gray-100">{text}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{time}</p>
      </div>
    </div>
  );
}
