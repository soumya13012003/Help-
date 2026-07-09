"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Activity, Loader2, X, FileText, TrendingUp, BedDouble, Plus, Check, Upload } from 'lucide-react';



const HOSPITAL_BEDS = [
  { ward: 'ICU', total: 12, occupied: 10, color: '#D32F2F' },
  { ward: 'Cardiac', total: 20, occupied: 14, color: '#F57C00' },
  { ward: 'General', total: 50, occupied: 32, color: '#0F52BA' },
  { ward: 'Pediatric', total: 15, occupied: 6, color: '#20B2AA' },
  { ward: 'ER Holding', total: 8, occupied: 7, color: '#7B1FA2' },
];

export default function TriageDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [beds, setBeds] = useState(HOSPITAL_BEDS);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [xaiData, setXaiData] = useState<any>(null);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinSuccess, setWalkinSuccess] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  // Walk-in form state
  const [wName, setWName] = useState('');
  const [wAge, setWAge] = useState('');
  const [wComplaint, setWComplaint] = useState('');
  const [wUrgency, setWUrgency] = useState('warning');
  const [wTestType, setWTestType] = useState('General Report');
  const [wFile, setWFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWFile(file);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      // Simulate NLP/OCR extraction from PDF or Image
      setTimeout(() => {
        let score = Math.floor(15 + Math.random() * 20);
        let status = 'default';
        let simulatedText = "extracted vitals from document. patient shows mild symptoms.";
        
        // Randomly simulate a critical finding for demo purposes
        if (file.name.toLowerCase().includes('critical') || file.name.toLowerCase().includes('ecg')) {
          score = Math.floor(90 + Math.random() * 8);
          status = 'critical';
          simulatedText = "OCR detected severe arrhythmias and elevated ST segments.";
        } else if (file.name.toLowerCase().includes('warning') || file.name.toLowerCase().includes('blood')) {
          score = Math.floor(45 + Math.random() * 30);
          status = 'warning';
          simulatedText = "OCR detected elevated cholesterol and mild fever.";
        }

        setWName(file.name.replace('.pdf', '').replace('.jpg', '').replace('.png', '') + ' (From Report)');
        setWAge(String(Math.floor(25 + Math.random() * 50)));
        setWComplaint(`[Extracted from ${wTestType}]\n${simulatedText}`);
        setWUrgency(status);
        setIsUploading(false);
      }, 2000); // Simulate OCR processing time
    };
    reader.readAsDataURL(file); // Safe for PDFs and Images
  };

  const fetchAIExplanation = async (patient: any) => {
    setSelectedPatient(patient);
    setLoading(true);
    setXaiData(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fhir_patient_payload: JSON.stringify({ resourceType: "Bundle", entry: [{ resource: { resourceType: "Patient", id: patient.id } }] }),
          clinical_query: patient.query,
          condition_filter: "Cardiology"
        })
      });
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setXaiData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the backend AI service. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const addWalkin = async () => {
    if (!wName.trim() || !wAge.trim() || !wComplaint.trim()) return;
    
    const text = wComplaint.toLowerCase();
    let score = Math.floor(15 + Math.random() * 20);
    let status = 'default';
    if (text.includes('chest') || text.includes('myocardial') || text.includes('severe')) {
      score = Math.floor(90 + Math.random() * 8);
      status = 'critical';
    } else if (text.includes('fever') || text.includes('pain') || text.includes('migraine')) {
      score = Math.floor(45 + Math.random() * 30);
      status = 'warning';
    }

    const newPatient = {
      name: wName,
      age: parseInt(wAge),
      waitTime: '0m',
      aiScore: score,
      status: status,
      complaint: wComplaint,
      location: 'In-Person (Walk-in)',
      query: text,
    };

    try {
      await fetch('http://127.0.0.1:8000/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      await fetchQueue();
    } catch (e) {
      console.error(e);
    }

    setWalkinSuccess(true);
    setTimeout(() => {
      setShowWalkinModal(false);
      setWalkinSuccess(false);
      setWName(''); setWAge(''); setWComplaint(''); setWUrgency('warning'); setWTestType('General Report'); setWFile(null);
    }, 1200);
  };

  const handleAdmit = async (patientId: string, ward: string) => {
    try {
      await fetch('http://127.0.0.1:8000/queue/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId })
      });
      await fetchQueue();
    } catch (e) {
      console.error(e);
    }
    
    // Occupy bed
    setBeds(prev => prev.map(b => 
      b.ward === ward ? { ...b, occupied: b.occupied + 1 } : b
    ));
    
    // Clear selection
    setSelectedPatient(null);
  };

  const totalBeds = beds.reduce((s, b) => s + b.total, 0);
  const totalOccupied = beds.reduce((s, b) => s + b.occupied, 0);
  const totalAvailable = totalBeds - totalOccupied;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 flex gap-6">
        {/* Left Column: Triage Queue */}
        <div className={`transition-all duration-300 ${selectedPatient ? 'w-1/2' : 'w-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-gray-100">Triage Queue</h1>
              <p className="text-gray-500 text-sm mt-1">AI-Assisted priority routing</p>
            </div>
            {!selectedPatient && (
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={() => setShowWalkinModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Walk-in
                </Button>
              </div>
            )}
          </div>

          {/* KPI + Bed Availability */}
          {!selectedPatient && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <KpiCard title="Total Waiting" value={String(queue.length)} icon={<UsersIcon />} trend={`${queue.length} in queue`} />
                <KpiCard title="Critical Flags (AI)" value={String(queue.filter(p => p.status === 'critical').length)} icon={<AlertTriangle className="text-[#D32F2F]" />} trend="Immediate attention required" urgent />
                <KpiCard title="Avg Wait Time" value="18m" icon={<Clock className="text-[#F57C00]" />} trend="-4m from yesterday" />
                <KpiCard title="Active Encounters" value="6" icon={<Activity className="text-[#20B2AA]" />} />
              </div>

              {/* Bed Availability */}
              <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E5E7EB] dark:border-[#333333] shadow-sm mb-6 overflow-hidden">
                <div className="px-6 py-3 border-b border-[#E5E7EB] dark:border-[#333333] bg-gray-50 dark:bg-[#1A1A1A] flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-[#0F52BA]" /> Hospital Bed Availability
                  </h2>
                  <span className="text-xs font-medium text-[#388E3C] bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    {totalAvailable} beds available
                  </span>
                </div>
                <div className="p-4 grid grid-cols-5 gap-3">
                  {beds.map((ward) => {
                    const available = ward.total - ward.occupied;
                    const pct = (ward.occupied / ward.total) * 100;
                    return (
                      <div key={ward.ward} className="text-center">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{ward.ward}</p>
                        {/* Circular Progress */}
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={pct > 85 ? '#D32F2F' : ward.color} strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">{available}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500">{ward.occupied}/{ward.total} occupied</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Queue Table */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E5E7EB] dark:border-[#333333] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#333333] bg-gray-50 dark:bg-[#1A1A1A] flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Active Queue</h2>
              <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">Sorted by AI Risk Score</span>
            </div>
            <div className="divide-y divide-[#E5E7EB] dark:divide-[#333333]">
              {queue.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => fetchAIExplanation(patient)}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group cursor-pointer ${selectedPatient?.id === patient.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-center gap-6 w-1/2">
                    <div className={`w-1.5 h-12 rounded-full ${patient.status === 'critical' ? 'bg-[#D32F2F]' : patient.status === 'warning' ? 'bg-[#F57C00]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <Badge variant={patient.status as any}>{patient.aiScore} Risk</Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                        <span>{patient.id}</span>
                        <span>•</span>
                        <span>{patient.age} yrs</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {patient.waitTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-2/5">
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{patient.complaint}</p>
                    <p className="text-xs text-gray-500 mt-1">{patient.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Explanation Panel */}
        {selectedPatient && (
          <div className="w-1/2 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg shadow-sm flex flex-col h-[calc(100vh-6rem)] sticky top-6">
            <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#333333] flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A]">
              <div>
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0F52BA]" />
                  AI Clinical Assessment
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-1">Patient: {selectedPatient.id}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}><X className="w-4 h-4" /></Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0F52BA] mb-4" />
                  <p>Running SHAP/LIME Explainers...</p>
                </div>
              ) : xaiData ? (
                <div className="space-y-8">
                  <div className="p-4 rounded-lg border border-[#0F52BA]/20 bg-blue-50/30 dark:bg-blue-900/10">
                    <h3 className="font-semibold text-[#0F52BA] flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      {xaiData.prediction.risk_category} Risk ({Math.round(xaiData.prediction.risk_score * 100)}%)
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      &quot;{xaiData.prediction.declarative_summary}&quot;
                    </p>
                    <div className="mt-3 text-sm font-semibold">
                      Recommended Action: <span className="text-[#D32F2F]">{xaiData.prediction.recommended_action}</span>
                    </div>
                  </div>

                  {/* Bed Allocation Option for >90% Risk */}
                  {selectedPatient.aiScore > 90 && (
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
                      <h3 className="font-semibold text-[#D32F2F] flex items-center gap-2 mb-2">
                        <BedDouble className="w-4 h-4" />
                        Immediate Admission Required
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        AI Score is <strong>{selectedPatient.aiScore}</strong> (Critical). Recommend immediate bed allocation.
                      </p>
                      
                      {(() => {
                        let targetWard = 'ICU';
                        const q = selectedPatient.query.toLowerCase();
                        if (q.includes('chest') || q.includes('heart') || q.includes('myocardial')) targetWard = 'Cardiac';
                        if (selectedPatient.age < 18) targetWard = 'Pediatric';
                        
                        const wardInfo = beds.find(b => b.ward === targetWard);
                        const hasBed = wardInfo && (wardInfo.total - wardInfo.occupied) > 0;
                        
                        return (
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              Suggested Ward: <span className="font-bold text-gray-900 dark:text-gray-100">{targetWard}</span><br />
                              Status: {hasBed ? <span className="text-green-600 font-medium">Beds Available</span> : <span className="text-red-600 font-medium">Full Capacity</span>}
                            </div>
                            <Button 
                              onClick={() => handleAdmit(selectedPatient.id, targetWard)}
                              disabled={!hasBed}
                              className="bg-[#D32F2F] hover:bg-red-800 text-white"
                              size="sm"
                            >
                              Admit to {targetWard}
                            </Button>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {xaiData.explainability.visual_assets?.structured_shap_chart_base64 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Explainability Vectors (SHAP)
                      </h3>
                      <img
                        src={xaiData.explainability.visual_assets.structured_shap_chart_base64}
                        alt="SHAP Force Plot"
                        className="w-full rounded-md border border-gray-100 dark:border-gray-800"
                      />
                    </div>
                  )}

                  {xaiData.clinical_context.rag_guidelines?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Retrieved Guidelines (RAG)
                      </h3>
                      <div className="space-y-3">
                        {xaiData.clinical_context.rag_guidelines.map((doc: any, i: number) => (
                          <div key={i} className="p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded text-sm border-l-2 border-[#0F52BA]">
                            <p className="text-gray-700 dark:text-gray-300 mb-1">{doc.text_chunk}</p>
                            <p className="text-xs text-gray-500 font-mono">Source: {doc.source_uri}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 dark:border-[#333333]">
                    <p className="text-[10px] text-gray-400 font-mono text-center">
                      Cryptographic Audit Seal (SHA-256):<br />{xaiData.metadata.audit_seal}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center mt-8">Failed to load data.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!walkinSuccess) setShowWalkinModal(false); }}>
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl w-full max-w-md border border-[#E5E7EB] dark:border-[#333333]" onClick={e => e.stopPropagation()}>
            {walkinSuccess ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#388E3C]" />
                </div>
                <h3 className="text-lg font-bold mb-1">Patient Added!</h3>
                <p className="text-sm text-gray-500">Added to queue and sorted by AI risk score.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#333333] flex justify-between items-center">
                  <h2 className="font-bold text-lg">Register Walk-in Patient</h2>
                  <button onClick={() => setShowWalkinModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#333333] rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-[#1A1A1A]/50 transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0F52BA] mb-2" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Extracting patient data via NLP...</p>
                      </div>
                    ) : wFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="w-8 h-8 text-[#388E3C] mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{wFile.name}</p>
                        <p className="text-xs text-green-600 font-semibold mt-1">Data Extracted Successfully</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Patient Report</p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Select the test type below and upload the file.</p>
                        
                        <select 
                          value={wTestType} 
                          onChange={(e) => setWTestType(e.target.value)}
                          className="mb-4 w-48 bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none text-center"
                        >
                          <option value="General Report">General Report</option>
                          <option value="ECG">ECG (Electrocardiogram)</option>
                          <option value="CT Scan">CT Scan</option>
                          <option value="MRI">MRI</option>
                          <option value="Blood Panel">Blood Panel</option>
                        </select>

                        <label className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#333333] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                          Browse Files
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    <div className="h-px bg-gray-200 dark:bg-[#333333] flex-1"></div>
                    <span className="text-xs font-semibold text-gray-400 uppercase">Or Enter Manually</span>
                    <div className="h-px bg-gray-200 dark:bg-[#333333] flex-1"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                    <input value={wName} onChange={e => setWName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Age *</label>
                      <input value={wAge} onChange={e => setWAge(e.target.value)} type="number" placeholder="e.g. 45" className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Urgency *</label>
                      <select value={wUrgency} onChange={e => setWUrgency(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none">
                        <option value="critical">🔴 Critical</option>
                        <option value="warning">🟠 Urgent</option>
                        <option value="default">⚪ Routine</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Chief Complaint *</label>
                    <textarea value={wComplaint} onChange={e => setWComplaint(e.target.value)} rows={3} placeholder="Describe the patient's primary symptoms..." className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F52BA] outline-none resize-none" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#333333] flex justify-end gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowWalkinModal(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={addWalkin} disabled={!wName.trim() || !wAge.trim() || !wComplaint.trim()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add to Queue
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({ title, value, icon, trend, urgent }: { title: string; value: string; icon: React.ReactNode; trend?: string; urgent?: boolean }) {
  return (
    <div className={`p-5 rounded-lg border bg-white dark:bg-[#1E1E1E] shadow-sm ${urgent ? 'border-[#D32F2F]/30 bg-red-50/10' : 'border-[#E5E7EB] dark:border-[#333333]'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold font-heading">{value}</div>
      {trend && <div className={`text-xs mt-2 ${urgent ? 'text-[#D32F2F] font-medium' : 'text-gray-500'}`}>{trend}</div>}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0F52BA]">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
