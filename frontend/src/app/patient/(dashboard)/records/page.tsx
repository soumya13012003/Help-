"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, FileOutput } from 'lucide-react';
import { PrescriptionViewer } from '@/components/PrescriptionViewer';

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function PatientRecordsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [viewingPrescription, setViewingPrescription] = useState<any | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('patient_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          const decoded = decodeJwt(parsed.token);
          if (decoded?.sub) {
            setPatientId(decoded.sub);
            fetchRecords(decoded.sub);
          }
        }
      } catch (e) {
        console.error('Failed to decode token', e);
      }
    }
  }, []);

  const fetchRecords = async (patId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/prescriptions/patient/${patId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Group by appointmentId since multiple medicines can belong to one appointment
        const grouped: any[] = [];
        const map = new Map<string, any>();

        data.forEach((p: any) => {
          if (!map.has(p.appointmentId)) {
            map.set(p.appointmentId, {
              id: p.id,
              appointmentId: p.appointmentId,
              doctorId: p.doctorId,
              doctorName: p.doctorName,
              patientId: p.patientId,
              patientName: 'Patient', // In real app, fetch from patient profile
              createdAt: p.createdAt,
              medicines: []
            });
            grouped.push(map.get(p.appointmentId));
          }
          map.get(p.appointmentId).medicines.push({
            medication: p.medication,
            dosage: p.dosage,
            frequency: p.frequency,
            instructions: p.instructions,
            additionalTests: p.additionalTests
          });
        });

        setPrescriptions(grouped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Medical Records</h1>
        <p className="text-gray-500 mt-1 text-sm">View and download your digital prescriptions.</p>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2A2A2A]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            My Prescriptions
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading records...
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No Records Found</h3>
            <p className="text-gray-500 text-sm mt-1">You don't have any prescriptions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#333333]">
            {prescriptions.map((pres) => (
              <div key={pres.id} className="p-5 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Prescription from {pres.doctorName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {new Date(pres.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {pres.medicines.length} Medication(s) Prescribed
                  </p>
                </div>
                <button
                  onClick={() => setViewingPrescription(pres)}
                  className="bg-[#0F52BA] hover:bg-[#0c4296] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileOutput className="w-4 h-4" /> View Prescription
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingPrescription && (
        <PrescriptionViewer 
          prescription={viewingPrescription}
          medicines={viewingPrescription.medicines}
          onClose={() => setViewingPrescription(null)}
        />
      )}
    </div>
  );
}
