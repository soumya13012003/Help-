import React, { useRef } from 'react';
import { Download, Printer, CreditCard, DollarSign } from 'lucide-react';

interface BillViewerProps {
  bill: any;
  onClose: () => void;
}

export function BillViewer({ bill, onClose }: BillViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:w-full print:max-w-none print:h-screen">
        
        {/* Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Consultation Invoice</h2>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Print Bill
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-8 sm:p-12 bg-white text-gray-900 print:p-8">
          
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">INVOICE</h1>
              <p className="text-gray-500 font-mono mt-1">#INV-{bill.id?.substring(0,8).toUpperCase() || 'NEW'}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">HEALTH CHOICE CLINIC</h2>
              <p className="text-sm text-gray-500">123 Riverside St, Bingham, NY 130</p>
              <p className="text-sm text-gray-500">contact@healthchoice.com</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
              <h3 className="text-lg font-bold text-gray-900">{bill.patientName}</h3>
              <p className="text-sm font-mono text-gray-500">Patient ID: {bill.patientSystemId || bill.patientId?.substring(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Service Provider</p>
              <h3 className="text-lg font-bold text-gray-900">{bill.doctorName}</h3>
              <p className="text-sm text-gray-500">Medical Physician</p>
            </div>
          </div>

          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-3 text-sm font-bold text-gray-900">Description</th>
                <th className="text-right py-3 text-sm font-bold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 text-gray-700">
                  <p className="font-semibold text-gray-900">General Medical Consultation</p>
                  <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                </td>
                <td className="py-4 text-right font-mono font-medium text-gray-900">
                  ${Number(bill.amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-mono text-gray-900">${Number(bill.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Tax (0%)</span>
                <span className="font-mono text-gray-900">$0.00</span>
              </div>
              <div className="flex justify-between py-4 border-b-2 border-gray-900">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-gray-900 flex items-center"><DollarSign className="w-5 h-5"/>{Number(bill.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Please pay within 30 days of receiving this invoice.</p>
            <p className="font-medium mt-1">Thank you for your business.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
