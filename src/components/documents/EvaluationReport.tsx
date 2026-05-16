import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface EvaluationReportProps {
  vehicle: any;
  date: string;
}

export function EvaluationReport({ vehicle, date }: EvaluationReportProps) {
  const inspectionData = vehicle.inspection || {};
  const checklist = inspectionData.checklist || {};
  const inspector = inspectionData.profiles || {};
  
  const categories = [
    { key: 'exterior', name: 'Exterior & Bodywork' },
    { key: 'interior', name: 'Interior & Electronics' },
    { key: 'mechanical', name: 'Mechanical & Powertrain' },
    { key: 'ev', name: 'Electric Drive System' },
  ];

  // Calculate detailed points and global score
  // Staff form saves: { id, label, status, notes, photo }
  let totalItems = 0;
  let passedItems = 0;
  
  const detailedCategories = categories.map(cat => {
    const points = checklist[cat.key] || [];
    
    let catPass = 0;
    let catFail = 0;
    let catTotal = 0;
    
    const formattedPoints = points.map((p: any, idx: number) => {
      if (p.status === 'pending') return null; // Skip unevaluated points
      catTotal++;
      if (p.status === 'pass') catPass++;
      if (p.status === 'fail') catFail++;
      
      return {
        id: p.id || idx,
        name: p.label || p.name || `Checkpoint ${idx + 1}`,
        status: p.status || 'pending',
        notes: p.notes || '',
        photo: p.photo || null // Staff form saves single photo per point
      };
    }).filter(Boolean);
    
    totalItems += catTotal;
    passedItems += catPass;
    
    const status = catFail > 0 ? 'fail' : catTotal > 0 ? 'pass' : 'warn';
    const catScore = catTotal > 0 ? Math.round((catPass / catTotal) * 100) : 0;
    
    return { name: cat.name, key: cat.key, status, score: catScore, points: formattedPoints, totalChecked: catTotal, passed: catPass, failed: catFail };
  });

  const globalScore = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;
  const hasInspection = totalItems > 0;

  // Use backend scores if available (inspector may have overridden)
  const mechScore = inspectionData.mechanical_score ?? detailedCategories.find(c => c.key === 'mechanical')?.score ?? 0;
  const extScore = inspectionData.exterior_score ?? detailedCategories.find(c => c.key === 'exterior')?.score ?? 0;
  const intScore = inspectionData.interior_score ?? detailedCategories.find(c => c.key === 'interior')?.score ?? 0;
  const avgBackendScore = hasInspection ? Math.round((mechScore + extScore + intScore) / 3) : globalScore;

  return (
    <div className="bg-white text-black p-10 font-sans text-sm print:bg-white print:p-6">
      
      {/* PAGE 1: Executive Summary */}
      <div className="mb-12 print:break-after-page">
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Peace Market</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold mt-1 text-gray-500">Official Diagnostic Evaluation Report</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-mono font-bold">{vehicle.plate_number || 'N/A'}</p>
            <p className="text-xs mt-1 text-gray-500">Report Date: {date}</p>
            <p className="text-xs text-gray-500">ID: {vehicle.id?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Vehicle + Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2">Vehicle Details</h2>
            <div className="grid grid-cols-2 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Make / Model</p>
                <p className="font-bold">{vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Year</p>
                <p className="font-bold">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Mileage</p>
                <p className="font-bold">{(vehicle.mileage || 0).toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Fuel / Powertrain</p>
                <p className="font-bold">{vehicle.fuel_type?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Transmission</p>
                <p className="font-bold capitalize">{vehicle.transmission || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Asking Price</p>
                <p className="font-bold">{(vehicle.price || 0).toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2">Client & Inspector</h2>
            <div className="grid grid-cols-1 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Customer</p>
                <p className="font-bold">{vehicle.customer || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Contact</p>
                <p className="font-bold">{vehicle.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Branch</p>
                <p className="font-bold">{vehicle.location || 'Central'}</p>
              </div>
              {inspector.full_name && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Certified Inspector</p>
                  <p className="font-bold">{inspector.full_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="grid grid-cols-4 gap-4 mb-8 break-inside-avoid">
          <div className="col-span-1 bg-gray-50 p-6 border border-gray-200 text-center flex flex-col items-center justify-center">
            <div className="text-5xl font-black mb-2" style={{ color: avgBackendScore >= 80 ? '#16a34a' : avgBackendScore >= 50 ? '#ca8a04' : '#dc2626' }}>
              {avgBackendScore}%
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Overall Health</p>
          </div>
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {[
              { label: 'Exterior', score: extScore },
              { label: 'Interior', score: intScore },
              { label: 'Mechanical', score: mechScore },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 p-4 border border-gray-200 text-center">
                <p className="text-3xl font-black" style={{ color: s.score >= 80 ? '#16a34a' : s.score >= 50 ? '#ca8a04' : '#dc2626' }}>{s.score}%</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Condition Grade */}
        <div className="mb-8 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Condition Grade</h2>
          <div className="inline-block px-4 py-2 border-2 border-black font-black uppercase text-2xl tracking-wider">
            {vehicle.condition || 'Pending'}
          </div>
        </div>

        {/* Executive Overview Table */}
        <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Category Summary</h2>
        <div className="border border-gray-200 rounded-sm overflow-hidden mb-12 break-inside-avoid">
          {detailedCategories.map((cat, i) => (
            <div key={i} className={`flex items-center p-3 border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="w-8">
                {cat.status === 'pass' && <CheckCircle2 size={16} className="text-green-600" />}
                {cat.status === 'warn' && <AlertTriangle size={16} className="text-yellow-600" />}
                {cat.status === 'fail' && <XCircle size={16} className="text-red-600" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {cat.totalChecked > 0 
                    ? `${cat.passed} passed · ${cat.failed} defects · ${cat.totalChecked} inspected`
                    : 'No points evaluated'
                  }
                </p>
              </div>
              <div className="text-right w-24">
                <span className="font-bold text-lg">{cat.score}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Vehicle Photos */}
        {vehicle.photos && vehicle.photos.length > 0 && (
          <div className="mb-8 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Vehicle Photo Gallery</h2>
            <div className="grid grid-cols-3 gap-3">
              {vehicle.photos.slice(0, 6).map((photo: string, i: number) => (
                <div key={i} className="aspect-[4/3] bg-gray-100 border border-gray-200 overflow-hidden">
                  <img src={photo} alt={`Vehicle photo ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspector Notes */}
        {inspectionData.final_notes && (
          <div className="bg-gray-50 border border-gray-200 p-6 mb-8 break-inside-avoid">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Inspector's Final Assessment</p>
            <p className="text-sm text-gray-800 italic leading-relaxed">"{inspectionData.final_notes}"</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-12 mt-16 break-inside-avoid">
          <div>
            <div className="border-b border-black w-full mb-2"></div>
            <p className="text-[10px] uppercase tracking-widest font-bold">Authorized Inspector Signature</p>
            <p className="text-xs text-gray-500 mt-1">{inspector.full_name || '____________________'}</p>
          </div>
          <div>
            <div className="border-b border-black w-full mb-2"></div>
            <p className="text-[10px] uppercase tracking-widest font-bold">General Manager Approval</p>
            <p className="text-xs text-gray-500 mt-1">Date: ____________________</p>
          </div>
        </div>
      </div>

      {/* DETAILED SECTIONS - One per category */}
      {detailedCategories.filter(cat => cat.points.length > 0).map((cat, idx) => (
        <div key={`detail-${idx}`} className="mt-8 pt-8 border-t-2 border-black print:break-after-page">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight">{cat.name} Report</h2>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Category Score</p>
              <p className="font-bold text-xl" style={{ color: cat.score >= 80 ? '#16a34a' : cat.score >= 50 ? '#ca8a04' : '#dc2626' }}>{cat.score}%</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {cat.points.map((point: any) => (
              <div key={point.id} className="border border-gray-200 p-4 break-inside-avoid">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {point.status === 'pass' && <CheckCircle2 size={16} className="text-green-600" />}
                    {point.status === 'fail' && <XCircle size={16} className="text-red-600" />}
                    <span className="font-bold">{point.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 ${
                    point.status === 'pass' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {point.status === 'pass' ? 'PASS' : 'DEFECT'}
                  </span>
                </div>
                
                {point.notes && (
                  <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 border-l-4 border-gray-300">
                    <p className="font-bold text-[10px] uppercase text-gray-500 mb-1">Inspector Notes:</p>
                    {point.notes}
                  </div>
                )}
                
                {point.photo && (
                  <div className="mt-3">
                    <div className="w-48 aspect-[4/3] bg-gray-100 border border-gray-200 overflow-hidden">
                      <img src={point.photo} alt={point.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Evidence Photo</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* No Inspection Warning */}
      {!hasInspection && (
        <div className="border-2 border-dashed border-yellow-400 bg-yellow-50 p-8 text-center my-8">
          <AlertTriangle size={32} className="text-yellow-600 mx-auto mb-3" />
          <p className="font-bold text-yellow-800 text-lg">Inspection Data Pending</p>
          <p className="text-sm text-yellow-700 mt-1">This vehicle has not been evaluated yet. Detailed scores will appear after staff completes the inspection.</p>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-16 text-center text-[10px] text-gray-400 print-footer">
        <p>Peace Market • Bole Road, Addis Ababa, Ethiopia • +251 111 22 33</p>
        <p>Document generated electronically. Original records retained in digital vault.</p>
      </div>

    </div>
  );
}
