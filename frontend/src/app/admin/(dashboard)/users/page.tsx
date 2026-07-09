import { IAM_SERVICE_URL, PATIENT_SERVICE_URL } from '../../../../../config';
"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle, XCircle, Search, MoreVertical } from 'lucide-react';

type UserRole = 'DOCTOR' | 'PATIENT' | 'ADMIN';
type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

interface User {
  id: string;
  systemId?: string;
  email: string;
  status: UserStatus;
  department?: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${IAM_SERVICE_URL}/users/doctors');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Could not connect to IAM service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const updateStatus = async (id: string, newStatus: UserStatus) => {
    try {
      const response = await fetch(`${IAM_SERVICE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchDoctors(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Approve, suspend, and manage Help+ personnel.</p>
        </div>
        <div className="flex items-center gap-2 relative w-64">
           <Search className="w-4 h-4 absolute left-3 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search by email or ID..." 
             className="w-full bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-md pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
           />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333333] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333333] flex justify-between items-center bg-gray-50 dark:bg-[#2A2A2A]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Doctor Directory</h2>
          <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">{doctors.length} Users</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading directory...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#333333]">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Doctor ID / Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Registered</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#333333]">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{doc.systemId || doc.id.substring(0, 8)}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{doc.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {doc.department || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {doc.status === 'PENDING' && (
                        <button onClick={() => updateStatus(doc.id, 'ACTIVE')} className="text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md transition-colors">
                          Approve
                        </button>
                      )}
                      {doc.status === 'ACTIVE' && (
                        <button onClick={() => updateStatus(doc.id, 'SUSPENDED')} className="text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors">
                          Suspend
                        </button>
                      )}
                      {doc.status === 'SUSPENDED' && (
                        <button onClick={() => updateStatus(doc.id, 'ACTIVE')} className="text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors">
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No doctors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="w-3.5 h-3.5" />
        Active
      </span>
    );
  }
  if (status === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <ShieldAlert className="w-3.5 h-3.5" />
        Pending Review
    </span>
  );
}
