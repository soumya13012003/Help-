"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Mic, MicOff, VideoOff, Phone, MonitorUp, MessageSquare, Clock, User } from 'lucide-react';

const UPCOMING_SESSIONS = [
  { id: 'TH-001', patient: 'Eleanor Vance', time: '10:30 AM', status: 'ready', complaint: 'Follow-up: Chest Pain', waitTime: '2m' },
  { id: 'TH-002', patient: 'Sarah Jenkins', time: '11:00 AM', status: 'scheduled', complaint: 'Routine: Hypertension Check', waitTime: '--' },
  { id: 'TH-003', patient: 'David Park', time: '11:30 AM', status: 'scheduled', complaint: 'Post-Discharge: COPD Review', waitTime: '--' },
];

export default function TelehealthPage() {
  const [inCall, setInCall] = useState(false);
  const [activePatient, setActivePatient] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const startCall = (patient: string) => {
    setActivePatient(patient);
    setInCall(true);
  };

  const endCall = () => {
    setInCall(false);
    setActivePatient(null);
    setMicOn(true);
    setCamOn(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">Telehealth</h1>
          <p className="text-gray-500 text-sm mt-1">Virtual patient encounters</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Video Area */}
        <div className="flex-1">
          <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
            {inCall ? (
              <>
                {/* Simulated video feed */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#20B2AA] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                      {activePatient?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <p className="text-white text-lg font-semibold">{activePatient}</p>
                    <p className="text-gray-400 text-sm mt-1 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Connected
                    </p>
                  </div>
                </div>
                {/* Self-view */}
                <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-700 rounded-lg border-2 border-gray-600 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F52BA] to-[#20B2AA] flex items-center justify-center text-white text-sm font-bold">DR</div>
                </div>
                {/* Duration */}
                <div className="absolute top-4 left-4 bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">No active session</p>
                <p className="text-sm">Select a patient from the queue to start</p>
              </div>
            )}
          </div>

          {/* Controls */}
          {inCall && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full transition-colors ${micOn ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300' : 'bg-red-500 text-white'}`}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={() => setCamOn(!camOn)} className={`p-3 rounded-full transition-colors ${camOn ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300' : 'bg-red-500 text-white'}`}>
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 transition-colors">
                <MonitorUp className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
              <button onClick={endCall} className="p-3 rounded-full bg-[#D32F2F] text-white hover:bg-[#B71C1C] transition-colors ml-4">
                <Phone className="w-5 h-5 rotate-[135deg]" />
              </button>
            </div>
          )}
        </div>

        {/* Session Queue */}
        <div className="w-80 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#333333] bg-gray-50 dark:bg-[#1A1A1A]">
            <h2 className="font-semibold text-sm">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#333333]">
            {UPCOMING_SESSIONS.map((session) => (
              <div key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{session.patient}</span>
                  <Badge variant={session.status === 'ready' ? 'critical' : 'default'}>
                    {session.status === 'ready' ? 'Ready' : session.time}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">{session.complaint}</p>
                {session.status === 'ready' ? (
                  <Button variant="primary" size="sm" onClick={() => startCall(session.patient)} className="w-full">
                    <Video className="w-3 h-3 mr-1" /> Join Session
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" /> Scheduled for {session.time}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
