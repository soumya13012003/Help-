import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '../../../../../config';
"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, UserPlus, FileText, ArrowRight, Loader2, Stethoscope, List } from 'lucide-react';

interface AppointmentRequest {
  id: string;
  patientId: string;
  patientSystemId: string | null;
  patientName: string | null;
  patientEmail: string | null;
  appointmentDate: string;
  reasonForVisit: string;
  status: string;
  doctorName: string | null;
  doctorSystemId: string | null;
  department: string | null;
  createdAt: string;
}

interface Doctor {
  id: string;
  systemId?: string;
  email: string;
  department?: string;
  status: string;
}

export default function AppointmentQueuePage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentRequest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch queue
      const reqRes = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/queue');
      if (reqRes.ok) {
        setRequests(await reqRes.json());
      }
      // Fetch all appointments
      const allRes = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/all');
      if (allRes.ok) {
        setAllAppointments(await allRes.json());
      }
      // Fetch doctors for assignment
      const docRes = await fetch(`${IAM_SERVICE_URL}/users/doctors');
      if (docRes.ok) {
        const docData = await docRes.json();
        setDoctors(docData.filter((d: Doctor) => d.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocate = async (appointmentId: string) => {
    if (!selectedDoctorId) return;

    const doc = doctors.find(d => d.id === selectedDoctorId);
    if (!doc) return;

    try {
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/${appointmentId}/allocate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doc.id,
          doctorSystemId: doc.systemId || '',
          doctorName: doc.email,
          department: doc.department || 'General',
        }),
      });

      if (res.ok) {
        setAllocatingId(null);
        setSelectedDoctorId('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      REQUESTED: 'bg-amber-100 text-amber-700 border-amber-200',
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Appointment Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">Review patient requests and allocate doctors.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#1A1A1A] p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'queue'
              ? 'bg-white dark:bg-[#1E1E1E] shadow text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Queue ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white dark:bg-[#1E1E1E] shadow text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List className="w-4 h-4" /> All Appointments ({allAppointments.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading...
          </div>
        ) : activeTab === 'queue' ? (
          /* Pending Queue View */
          <div className="divide-y divide-gray-100 dark:divide-[#333333]">
            {requests.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">All Caught Up!</h3>
                <p className="text-gray-500 text-sm mt-1">There are no pending appointment requests.</p>
              </div>
            )}

            {requests.map(req => (
              <div key={req.id} className="p-6 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-purple-600" />
                        Patient Request
                      </h3>
                      <p className="text-sm text-gray-500">
                        Patient: <span className="font-mono font-semibold">{req.patientSystemId || req.patientId.substring(0, 8)}</span>
                        {req.patientEmail && <span className="ml-2 text-gray-400">({req.patientEmail})</span>}
                      </p>
                    </div>
                    <div className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(req.appointmentDate).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#121212] p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" /> Reason for Visit
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 text-sm">
                      {req.reasonForVisit || "No symptoms provided."}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-80 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-6 md:pt-0 md:pl-6">
                  {allocatingId === req.id ? (
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase text-gray-500">Select Doctor</label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                      >
                        <option value="">-- Choose a Doctor --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.systemId || d.email} ({d.department || 'General'})</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAllocate(req.id)}
                          disabled={!selectedDoctorId}
                          className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-md transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setAllocatingId(null)}
                          className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">Awaiting doctor assignment.</p>
                      <button
                        onClick={() => setAllocatingId(req.id)}
                        className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
                      >
                        Allocate Doctor <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* All Appointments View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-[#333333]">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Patient</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Reason</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Doctor</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
                {allAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-[#252525]">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">
                      {apt.patientSystemId || apt.patientId.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {apt.reasonForVisit}
                    </td>
                    <td className="px-6 py-4">
                      {apt.doctorSystemId ? (
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-mono text-xs">{apt.doctorSystemId}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
