import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '../../../../../config';
"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, FileText, ArrowRight, Loader2, Stethoscope, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  patientId: string;
  patientSystemId: string;
  appointmentDate: string;
  reasonForVisit: string;
  status: string;
  doctorName: string | null;
  doctorSystemId: string | null;
  department: string | null;
  createdAt: string;
}

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

interface Doctor {
  id: string;
  systemId?: string;
  email: string;
  department?: string;
  status: string;
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const [userId, setUserId] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  useEffect(() => {
    // Fetch doctors for the dropdown
    const fetchDoctors = async () => {
      try {
        const docRes = await fetch(`${IAM_SERVICE_URL}/users/doctors');
        if (docRes.ok) {
          const docData = await docRes.json();
          const activeDocs = docData.filter((d: Doctor) => d.status === 'ACTIVE');
          setDoctors(activeDocs);
          
          // Extract unique departments
          const depts = new Set<string>();
          activeDocs.forEach((d: Doctor) => {
            if (d.department) depts.add(d.department);
          });
          setAvailableDepartments(Array.from(depts));
        }
      } catch (err) {
        console.error('Failed to fetch doctors', err);
      }
    };
    fetchDoctors();

    const authData = localStorage.getItem('patient_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          const decoded = decodeJwt(parsed.token);
          if (decoded?.sub) {
            setUserId(decoded.sub);
            fetchAppointments(decoded.sub);
          }
        }
      } catch (e) {
        console.error('Failed to decode token', e);
      }
    }
  }, []);

  const fetchAppointments = async (patientId: string) => {
    try {
      setLoadingAppointments(true);
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/patient/${patientId}`);
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get systemId from auth
      const authData = localStorage.getItem('patient_auth');
      let systemId = '';
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          const decoded = decodeJwt(parsed.token);
          // We'll need to send systemId too — for now we use sub
        }
      }

      // Find doctor if selected
      const doc = doctors.find(d => d.id === selectedDoctorId);

      const dateTime = new Date(`${date}T${time}`).toISOString();
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userId,
          appointmentDate: dateTime,
          reasonForVisit: reason,
          department: department || undefined,
          doctorId: doc?.id || undefined,
          doctorSystemId: doc?.systemId || undefined,
          doctorName: doc?.email || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setShowForm(false);
        setDate('');
        setTime('');
        setReason('');
        setDepartment('');
        setSelectedDoctorId('');
        // Refresh list
        fetchAppointments(userId);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Appointments</h1>
          <p className="text-gray-500 mt-1 text-sm">Book new appointments and track your existing ones.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#0F52BA] hover:bg-[#0a3d8f] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" /> {showForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">
            Your appointment request has been submitted! The admin will allocate a doctor shortly.
          </p>
        </div>
      )}

      {/* Booking Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Appointment Request</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Preferred Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333333] rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Preferred Time</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333333] rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Department (Optional)</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setSelectedDoctorId(''); // Reset doctor when dept changes
                  }}
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333333] rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none appearance-none"
                >
                  <option value="">Any Department</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Preferred Doctor (Optional)</label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  disabled={doctors.length === 0}
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333333] rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none appearance-none disabled:opacity-50"
                >
                  <option value="">Any Available Doctor</option>
                  {doctors
                    .filter(doc => !department || doc.department === department)
                    .map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.email.split('@')[0]} ({doc.department || 'General'})
                      </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Reason for Visit / Symptoms</label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe why you need to see a doctor..."
                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333333] rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#333333]">
            <button
              type="submit"
              disabled={loading || !userId}
              className="flex items-center justify-center gap-2 bg-[#0F52BA] hover:bg-[#0a3d8f] text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Request <ArrowRight className="w-5 h-5" /></>}
            </button>
            {!userId && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Unable to identify patient. Please log in again.
              </p>
            )}
          </div>
        </form>
      )}

      {/* Appointments List */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2A2A2A]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Your Appointments</h2>
        </div>

        {loadingAppointments ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No Appointments Yet</h3>
            <p className="text-gray-500 text-sm mt-1">Book your first appointment using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#333333]">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-5 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(apt.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-[#121212] p-3 rounded-lg">
                  {apt.reasonForVisit}
                </p>

                {apt.doctorName && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Dr. {apt.doctorName}</span>
                    {apt.department && <span className="text-gray-500">· {apt.department}</span>}
                    {apt.doctorSystemId && <span className="text-xs text-gray-400 font-mono">({apt.doctorSystemId})</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
