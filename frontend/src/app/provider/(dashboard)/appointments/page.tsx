"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Loader2, Stethoscope, CheckCircle, FileOutput } from 'lucide-react';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import { PrescriptionViewer } from '@/components/PrescriptionViewer';
import { BillViewer } from '@/components/BillViewer';

interface Appointment {
  id: string;
  patientId: string;
  patientSystemId: string | null;
  patientName: string | null;
  patientEmail: string | null;
  appointmentDate: string;
  reasonForVisit: string;
  status: string;
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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState('');

  useEffect(() => {
    const authData = localStorage.getItem('provider_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          const decoded = decodeJwt(parsed.token);
          if (decoded?.sub) {
            setDoctorId(decoded.sub);
            fetchAppointments(decoded.sub);
          }
        }
      } catch (e) {
        console.error('Failed to decode token', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    const interval = setInterval(() => {
      fetchAppointments(doctorId, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [doctorId]);

  const fetchAppointments = async (docId: string, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/doctor/${docId}`);
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [viewingDocs, setViewingDocs] = useState<{ type: 'prescription' | 'bill', data: any, medicines?: any[] } | null>(null);

  const handleCompleteClick = (apt: Appointment) => {
    setCompletingApt(apt);
  };

  const handleCompleteSubmit = async (doctorName: string, medicines: any[], fee: number, additionalTests: string) => {
    if (!completingApt) return;

    try {
      let createdPrescriptions = [];
      let createdBill = null;

      // 1. Save Prescriptions
      if (medicines.length > 0) {
        const pres = medicines.map(m => ({
          appointmentId: completingApt.id,
          patientId: completingApt.patientId,
          doctorId: doctorId,
          doctorName: doctorName,
          medication: m.medication,
          dosage: m.dosage,
          frequency: m.frequency,
          instructions: m.instructions,
          additionalTests: additionalTests // Pass the additional tests
        }));
        const pRes = await fetch(`${PATIENT_SERVICE_URL}/clinical/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prescriptions: pres })
        });
        if (pRes.ok) {
          createdPrescriptions = await pRes.json();
        }
      }

      // 2. Save Bill
      const bRes = await fetch(`${PATIENT_SERVICE_URL}/clinical/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: completingApt.id,
          patientId: completingApt.patientId,
          doctorId: doctorId,
          doctorName: doctorName,
          amount: fee
        })
      });
      if (bRes.ok) {
        createdBill = await bRes.json();
      }

      // 3. Update Status
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/appointments/${completingApt.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      
      if (res.ok && doctorId) {
        fetchAppointments(doctorId);
      }
      
      // Keep data to show docs
      const aptData = { ...completingApt, doctorName };
      setCompletingApt(null);

      // Auto show prescription
      if (createdPrescriptions.length > 0) {
        setViewingDocs({
          type: 'prescription',
          data: { ...aptData, id: createdPrescriptions[0].id || aptData.id, createdAt: Date.now() },
          medicines: createdPrescriptions
        });
      }

    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const scheduled = appointments.filter(a => a.status === 'SCHEDULED');
  const completed = appointments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Appointments</h1>
        <p className="text-gray-500 mt-1 text-sm">Patients assigned to you by the administrator.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{scheduled.length}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completed.length}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{appointments.length}</p>
            <p className="text-xs text-gray-500">Total Patients</p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2A2A2A]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Assigned Patients
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No Patients Assigned</h3>
            <p className="text-gray-500 text-sm mt-1">The administrator hasn't assigned any patients to you yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#333333]">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-5 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {apt.patientName || 'Patient'}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {apt.patientSystemId || apt.patientId.substring(0, 8)}
                        {apt.patientEmail && <span className="ml-2 text-gray-400">({apt.patientEmail})</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                    {apt.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleCompleteClick(apt)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}
                    {apt.status === 'COMPLETED' && (
                      <button
                        onClick={() => setViewingDocs({
                          type: 'prescription',
                          data: { ...apt, id: 'temp', doctorName: apt.doctorName || 'Dr. ' },
                          medicines: [{ medication: 'Consultation Complete', dosage: '-', frequency: '-', instructions: 'Please check official records for full details.' }]
                        })}
                        className="bg-[#0F52BA] hover:bg-[#0c4296] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                      >
                        <FileOutput className="w-3.5 h-3.5" /> View Docs
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(apt.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-[#121212] p-3 rounded-lg">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Reason
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{apt.reasonForVisit}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CompleteAppointmentModal
        isOpen={!!completingApt}
        onClose={() => setCompletingApt(null)}
        appointment={completingApt}
        onComplete={handleCompleteSubmit}
        defaultDoctorName={`Dr. ${completingApt?.doctorName || ''}`}
      />

      {viewingDocs?.type === 'prescription' && (
        <PrescriptionViewer 
          prescription={viewingDocs.data}
          medicines={viewingDocs.medicines || []}
          onClose={() => setViewingDocs({ type: 'bill', data: viewingDocs.data })} // flow into bill viewing
        />
      )}

      {viewingDocs?.type === 'bill' && (
        <BillViewer 
          bill={{ ...viewingDocs.data, amount: 150 }} // using default 150 for view docs if not passed
          onClose={() => setViewingDocs(null)}
        />
      )}
    </div>
  );
}
