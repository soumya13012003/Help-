"use client";
import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '@/config';

import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, FileOutput, DollarSign } from 'lucide-react';
import { BillViewer } from '@/components/BillViewer';

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function PatientBillingPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [viewingBill, setViewingBill] = useState<any | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('patient_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          const decoded = decodeJwt(parsed.token);
          if (decoded?.sub) {
            setPatientId(decoded.sub);
            fetchBills(decoded.sub);
          }
        }
      } catch (e) {
        console.error('Failed to decode token', e);
      }
    }
  }, []);

  const fetchBills = async (patId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${PATIENT_SERVICE_URL}/clinical/bills/patient/${patId}`);
      if (res.ok) {
        setBills(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalUnpaid = bills
    .filter(b => b.status === 'PENDING')
    .reduce((sum, current) => sum + Number(current.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Billing & Invoices</h1>
        <p className="text-gray-500 mt-1 text-sm">View your consultation invoices and outstanding balances.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Outstanding Balance</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">${totalUnpaid.toFixed(2)}</p>
          </div>
        </div>
        {totalUnpaid > 0 && (
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            Pay Now
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2A2A2A]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Invoice History
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading invoices...
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No Invoices Found</h3>
            <p className="text-gray-500 text-sm mt-1">You don't have any billing history.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#333333]">
            {bills.map((bill) => (
              <div key={bill.id} className="p-5 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Consultation with {bill.doctorName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {new Date(bill.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    {bill.status === 'PENDING' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Unpaid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ${Number(bill.amount).toFixed(2)}
                  </p>
                  <button
                    onClick={() => setViewingBill({
                      ...bill,
                      patientName: 'Patient' // Ideally fetch from state
                    })}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-[#333333] dark:hover:bg-[#444444] text-gray-800 dark:text-gray-200 text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FileOutput className="w-4 h-4" /> View Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingBill && (
        <BillViewer 
          bill={viewingBill}
          onClose={() => setViewingBill(null)}
        />
      )}
    </div>
  );
}
