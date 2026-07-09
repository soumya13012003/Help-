import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Printer } from 'lucide-react';

interface Medicine {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onComplete: (doctorName: string, medicines: Medicine[], fee: number, additionalTests: string) => Promise<void>;
  defaultDoctorName: string;
}

export function CompleteAppointmentModal({ isOpen, onClose, appointment, onComplete, defaultDoctorName }: CompleteAppointmentModalProps) {
  const [doctorName, setDoctorName] = useState(defaultDoctorName);
  const [fee, setFee] = useState<number>(150);
  const [additionalTests, setAdditionalTests] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { medication: '', dosage: '', frequency: '', instructions: '' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedFee = localStorage.getItem('doctor_consultation_fee');
      if (savedFee) {
        setFee(Number(savedFee));
      }
      setDoctorName(defaultDoctorName || 'Dr. ');
      setMedicines([{ medication: '', dosage: '', frequency: '', instructions: '' }]);
      setAdditionalTests('');
    }
  }, [isOpen, defaultDoctorName]);

  if (!isOpen || !appointment) return null;

  const handleAddMedicine = () => {
    setMedicines([...medicines, { medication: '', dosage: '', frequency: '', instructions: '' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('doctor_consultation_fee', fee.toString());
    
    // Filter out empty medicines
    const validMedicines = medicines.filter(m => m.medication.trim() !== '');
    
    await onComplete(doctorName, validMedicines, fee, additionalTests);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Appointment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="complete-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Doctor & Patient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-[#121212] p-4 rounded-lg border border-gray-200 dark:border-[#333333]">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Patient Name</label>
                <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Doctor's Official Name</label>
                <input 
                  type="text" 
                  value={doctorName} 
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g., Dr. Ashley D. Stone, M.D."
                  className="w-full bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444444] rounded-md px-3 py-1.5 text-sm"
                  required
                />
              </div>
            </div>

            {/* Prescriptions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Prescription (Medicines)</h3>
                <button type="button" onClick={handleAddMedicine} className="text-xs flex items-center gap-1 text-[#0F52BA] hover:underline font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>
              
              <div className="space-y-3">
                {medicines.map((med, idx) => (
                  <div key={idx} className="flex gap-2 items-start relative">
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      <div className="col-span-12 md:col-span-4">
                        <input type="text" placeholder="Medicine Name (e.g. Paracetamol)" value={med.medication} onChange={(e) => handleMedicineChange(idx, 'medication', e.target.value)} className="w-full bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm" required />
                      </div>
                      <div className="col-span-12 md:col-span-2">
                        <input type="text" placeholder="Dose (500mg)" value={med.dosage} onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)} className="w-full bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm" required />
                      </div>
                      <div className="col-span-12 md:col-span-3">
                        <input type="text" placeholder="Timing (Once A Day)" value={med.frequency} onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)} className="w-full bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm" required />
                      </div>
                      <div className="col-span-12 md:col-span-3">
                        <input type="text" placeholder="Instructions (After meal)" value={med.instructions} onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)} className="w-full bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm" />
                      </div>
                    </div>
                    {medicines.length > 1 && (
                      <button type="button" onClick={() => handleRemoveMedicine(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Tests */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Tests Required (Optional)</h3>
              <textarea 
                placeholder="e.g. Complete Blood Count (CBC), Lipid Profile..."
                value={additionalTests}
                onChange={(e) => setAdditionalTests(e.target.value)}
                className="w-full bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm min-h-[80px] resize-y"
              />
            </div>

            {/* Billing */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Billing (Doctor's Fee)</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold">$</span>
                <input 
                  type="number" 
                  value={fee} 
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-32 bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#333333] rounded-md px-3 py-2 text-sm"
                  min="0"
                  step="0.01"
                  required
                />
                <span className="text-xs text-gray-500 ml-2">This rate will be saved for future appointments until changed.</span>
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#1A1A1A] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="complete-form" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
            {loading ? 'Processing...' : 'Generate Prescription & Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}
