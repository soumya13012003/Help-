import React, { useRef } from 'react';
import { HeartPulse, Download, Printer, MapPin, Phone, Mail } from 'lucide-react';

interface PrescriptionViewerProps {
  prescription: any;
  medicines: any[];
  onClose: () => void;
}

export function PrescriptionViewer({ prescription, medicines, onClose }: PrescriptionViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col my-auto print:shadow-none print:w-full print:max-w-none print:h-screen">
        
        {/* Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Digital Prescription</h2>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#0F52BA] hover:bg-[#0c4296] text-white rounded-lg text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-8 sm:p-12 bg-white text-gray-900 print:p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-4 border-[#20B2AA] pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#20B2AA] rounded-full flex items-center justify-center">
                <HeartPulse className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#0F52BA] tracking-tight uppercase">HEALTH CHOICE CLINIC</h1>
                <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> 123 Riverside St, Bingham, NY 130</p>
                <p className="text-sm font-semibold text-gray-600 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> contact@healthchoice.com</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">{prescription.doctorName}</h2>
              <p className="text-sm font-medium text-[#20B2AA]">Medical Physician</p>
              <p className="text-sm text-gray-600 mt-1 font-mono flex items-center justify-end gap-1"><Phone className="w-3.5 h-3.5" /> +1 392-747-4830</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex justify-between items-end border-b border-gray-300 pb-4 mb-8">
            <div className="space-y-1">
              <p className="text-sm"><span className="font-bold text-[#0F52BA]">Patient:</span> {prescription.patientName}</p>
              <p className="text-sm"><span className="font-bold text-[#0F52BA]">Patient ID:</span> <span className="font-mono">{prescription.patientSystemId || prescription.patientId?.substring(0, 8)}</span></p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm"><span className="font-bold text-[#0F52BA]">Prescription No:</span> <span className="font-mono">{prescription.id?.substring(0, 8).toUpperCase() || 'NEW'}</span></p>
              <p className="text-sm"><span className="font-bold text-[#0F52BA]">Date:</span> {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Rx Symbol */}
          <div className="mb-6">
            <span className="text-5xl font-serif font-bold text-gray-900">Rx</span>
          </div>

          {/* Medicines List */}
          <div className="min-h-[250px]">
            {medicines.map((med, idx) => (
              <div key={idx} className="mb-6 pl-4 border-l-2 border-[#20B2AA]">
                <p className="text-lg font-bold text-gray-900">
                  {idx + 1}. {med.medication} <span className="text-gray-500 font-normal text-base ml-2">({med.dosage})</span>
                </p>
                <div className="mt-1 text-sm text-gray-700 flex gap-4 font-medium">
                  <p>Timing: <span className="text-[#0F52BA]">{med.frequency}</span></p>
                  {med.instructions && <p>• Notes: <span className="text-gray-600">{med.instructions}</span></p>}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Tests */}
          {medicines.length > 0 && medicines[0].additionalTests && (
            <div className="mb-8 mt-4 bg-yellow-50/50 border border-yellow-200 rounded-lg p-5">
              <p className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span> 
                Additional Tests Required
              </p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{medicines[0].additionalTests}</p>
            </div>
          )}

          {/* Footer Signature */}
          <div className="mt-8 pt-8 border-t border-gray-300 flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500 italic">This is a digitally generated prescription.</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-800 mb-2"></div>
              <p className="font-bold text-gray-900">{prescription.doctorName}</p>
              <p className="text-xs text-gray-500">Signature</p>
            </div>
          </div>
          
          <div className="mt-8 bg-[#0F52BA] p-3 text-center text-white text-xs font-semibold rounded-lg print:rounded-none">
            Thank you for choosing Health Choice Clinic. We wish you a speedy recovery!
          </div>

        </div>
      </div>
    </div>
  );
}
