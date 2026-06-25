import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextField, TextAreaField } from '../ui/FormControls';
import { 
  CheckCircle2, XCircle, Camera, Trash2, Image as ImageIcon,
  CarFront, Armchair, Cog, Zap, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

interface InspectionPoint {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  photo?: string;
}

interface DetailedInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onSubmit: (data: any) => void;
}

export const DetailedInspectionModal: React.FC<DetailedInspectionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmit
}) => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior' | 'mechanical' | 'ev' | 'summary'>('exterior');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPointId, setUploadingPointId] = useState<string | null>(null);
  
  // Deep Inspection Checklist — 8-10 points per category
  const [checklist, setChecklist] = useState<Record<string, InspectionPoint[]>>({
    exterior: [
      { id: 'paint', label: 'Paint & Body Panels', status: 'pending', notes: '' },
      { id: 'glass', label: 'Windshield & Glass', status: 'pending', notes: '' },
      { id: 'lights', label: 'Headlights, Taillights & Indicators', status: 'pending', notes: '' },
      { id: 'tires', label: 'Tire Tread Depth & Sidewalls', status: 'pending', notes: '' },
      { id: 'wheels', label: 'Wheels & Rims Condition', status: 'pending', notes: '' },
      { id: 'bumpers', label: 'Bumpers & Fenders', status: 'pending', notes: '' },
      { id: 'mirrors', label: 'Side Mirrors & Antenna', status: 'pending', notes: '' },
      { id: 'undercarriage', label: 'Undercarriage & Rust Check', status: 'pending', notes: '' },
      { id: 'wipers', label: 'Wiper Blades & Washer System', status: 'pending', notes: '' },
      { id: 'exhaust', label: 'Exhaust Pipe & Emissions', status: 'pending', notes: '' },
    ],
    interior: [
      { id: 'seats', label: 'Seats & Upholstery', status: 'pending', notes: '' },
      { id: 'dashboard', label: 'Dashboard & Instrument Cluster', status: 'pending', notes: '' },
      { id: 'ac', label: 'Climate Control / AC & Heating', status: 'pending', notes: '' },
      { id: 'odometer', label: 'Odometer Verification & Mileage', status: 'pending', notes: '' },
      { id: 'infotainment', label: 'Infotainment & Audio System', status: 'pending', notes: '' },
      { id: 'windows', label: 'Power Windows & Locks', status: 'pending', notes: '' },
      { id: 'airbags', label: 'Airbag Indicators & Safety', status: 'pending', notes: '' },
      { id: 'carpet', label: 'Carpet, Headliner & Trim', status: 'pending', notes: '' },
      { id: 'seatbelts', label: 'Seatbelt Function & Condition', status: 'pending', notes: '' },
      { id: 'steering_wheel', label: 'Steering Wheel & Column', status: 'pending', notes: '' },
    ],
    mechanical: [
      { id: 'engine', label: 'Engine Performance & Sound', status: 'pending', notes: '' },
      { id: 'braking', label: 'Brake Pads, Discs & Lines', status: 'pending', notes: '' },
      { id: 'steering', label: 'Steering Response & Alignment', status: 'pending', notes: '' },
      { id: 'suspension', label: 'Suspension & Shock Absorbers', status: 'pending', notes: '' },
      { id: 'transmission', label: 'Transmission / Gearbox Shift', status: 'pending', notes: '' },
      { id: 'fluids', label: 'Oil, Coolant & Fluid Levels', status: 'pending', notes: '' },
      { id: 'leaks', label: 'Leak Inspection (Engine Bay & Under)', status: 'pending', notes: '' },
      { id: 'battery', label: 'Battery Health & Terminals', status: 'pending', notes: '' },
      { id: 'clutch', label: 'Clutch / Torque Converter', status: 'pending', notes: '' },
      { id: 'drivetrain', label: 'Drivetrain & CV Joints', status: 'pending', notes: '' },
    ],
    ev: [
      { id: 'ev_battery', label: 'High Voltage Battery Health (SOH)', status: 'pending', notes: '' },
      { id: 'charging', label: 'Charging Port & Cable', status: 'pending', notes: '' },
      { id: 'thermal', label: 'Battery Thermal Management', status: 'pending', notes: '' },
      { id: 'motor', label: 'Electric Motor & Inverter', status: 'pending', notes: '' },
      { id: 'regen', label: 'Regenerative Braking System', status: 'pending', notes: '' },
      { id: 'range', label: 'Range Test & Verification', status: 'pending', notes: '' },
      { id: 'onboard_charger', label: 'Onboard Charger Unit', status: 'pending', notes: '' },
      { id: 'hv_wiring', label: 'High Voltage Wiring Insulation', status: 'pending', notes: '' },
    ]
  });

  const [summary, setSummary] = useState({
    finalNotes: '',
    evData: { batterySoh: '', range: '', chargerIncluded: true }
  });

  const updatePoint = (category: string, id: string, updates: Partial<InspectionPoint>) => {
    setChecklist(prev => ({
      ...prev,
      [category]: prev[category].map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  // Auto-calculate scores from pass/fail ratios
  const calculateScore = (category: string): number => {
    const points = checklist[category];
    const evaluated = points.filter(p => p.status !== 'pending');
    if (evaluated.length === 0) return 0;
    const passCount = evaluated.filter(p => p.status === 'pass').length;
    return Math.round((passCount / points.length) * 100);
  };

  const exteriorScore = calculateScore('exterior');
  const interiorScore = calculateScore('interior');
  const mechanicalScore = calculateScore('mechanical');
  const overallScore = Math.round((exteriorScore + interiorScore + mechanicalScore) / 3);

  // Count progress
  const totalPoints = Object.values(checklist).reduce((sum, cat) => sum + cat.length, 0);
  const evaluatedPoints = Object.values(checklist).reduce((sum, cat) => sum + cat.filter(p => p.status !== 'pending').length, 0);
  const progressPct = Math.round((evaluatedPoints / totalPoints) * 100);

  const handlePhotoUpload = async (category: string, pointId: string, file: File) => {
    if (!session) return;
    setUploadingPointId(pointId);
    try {
      // Convert file to Base64
      const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      const base64Data = await toBase64(file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/storage/upload-base64`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64: base64Data,
          filename: file.name,
          bucket: 'vehicles',
          folder: `inspections/${task.trade_in_id}`
        })
      });

      if (!response.ok) throw new Error('Upload failed');
      const { url } = await response.json();
      updatePoint(category, pointId, { photo: url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPointId(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (evaluatedPoints === 0) {
      alert('Please evaluate at least some inspection points before submitting.');
      return;
    }
    setIsSubmitting(true);
    const payload = {
      leadId: task.trade_in_id,
      mechanical_score: mechanicalScore,
      exterior_score: exteriorScore,
      interior_score: interiorScore,
      checklist,
      ev_data: summary.evData,
      final_notes: summary.finalNotes
    };
    
    await onSubmit(payload);
    setIsSubmitting(false);
  };

  const renderPoint = (category: string, point: InspectionPoint) => (
    <div key={point.id} className="p-4 rounded-2xl bg-surface-card border border-border-subtle/50  transition-colors space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-text-main flex-1">{point.label}</p>
        <div className="flex bg-bg-secondary rounded-xl p-1 shrink-0">
           <button 
            onClick={() => updatePoint(category, point.id, { status: 'pass' })}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              point.status === 'pass' ? "bg-success text-bg shadow-sm" : "text-text-muted hover:text-success hover:bg-surface-card"
            )}
          >
            <CheckCircle2 size={20} />
          </button>
           <button 
            onClick={() => updatePoint(category, point.id, { status: 'fail' })}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              point.status === 'fail' ? "bg-error-main text-bg shadow-sm" : "text-text-muted hover:text-error-main hover:bg-surface-card"
            )}
          >
            <XCircle size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex gap-3">
         <div className="flex-1">
          <textarea 
            placeholder="Notes (optional)..."
            value={point.notes}
            onChange={(e) => updatePoint(category, point.id, { notes: e.target.value })}
            className="w-full bg-bg-secondary border border-border-subtle/30 rounded-xl p-3 text-[14px] text-text-main min-h-[64px] focus:outline-none focus:border-primary-main resize-none placeholder:text-text-muted/40"
          />
        </div>
        <div className="w-16 h-16 shrink-0">
          {point.photo ? (
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-border-subtle group">
              <img src={point.photo} alt={point.label} className="w-full h-full object-cover" />
              <button 
                onClick={() => updatePoint(category, point.id, { photo: undefined })}
                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
           ) : (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-border-subtle/30 divide-y divide-border-subtle/30 bg-bg-secondary">
              <label className="flex-1 flex items-center justify-center text-text-muted hover:bg-surface-card hover:text-primary-main cursor-pointer transition-colors">
                {uploadingPointId === point.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                 <input 
                  type="file" className="hidden" accept="image/*" capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(category, point.id, file);
                  }}
                  disabled={!!uploadingPointId}
                />
              </label>
              <label className="flex-1 flex items-center justify-center text-text-muted hover:bg-surface-card hover:text-primary-main cursor-pointer transition-colors">
                {uploadingPointId === point.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}
                <input 
                  type="file" className="hidden" accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(category, point.id, file);
                  }}
                  disabled={!!uploadingPointId}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabConfig = [
    { id: 'exterior', label: 'Exterior', icon: <CarFront size={16} />, score: exteriorScore },
    { id: 'interior', label: 'Interior', icon: <Armchair size={16} />, score: interiorScore },
    { id: 'mechanical', label: 'Mechanical', icon: <Cog size={16} />, score: mechanicalScore },
    { id: 'ev', label: 'EV / Hybrid', icon: <Zap size={16} />, score: 0 },
    { id: 'summary', label: 'Submit', icon: <CheckCircle2 size={16} />, score: overallScore },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle Inspection Evaluation"
      subtitle={`${task?.trade_in_requests?.vehicle_make_model || task?.description || 'Asset Appraisal'}`}
      maxWidth="max-w-5xl"
    >
      <div className="flex-1 flex flex-col overflow-hidden px-1 pb-4">
        {/* Progress Bar */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-medium text-text-muted">Evaluation Progress</p>
            <p className="text-[14px] font-semibold text-primary-main">{evaluatedPoints}/{totalPoints} points • {progressPct}%</p>
          </div>
           <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-main rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary-main-rgb),0.3)]" 
              style={{ width: `${progressPct}%` }} 
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 px-4 md:px-1 mx-[-16px] md:mx-0 snap-x snap-mandatory">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-5 py-2.5 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all shrink-0 border snap-start",
                activeTab === tab.id 
                  ? "bg-text-main text-bg border-text-main shadow-sm" 
                  : "bg-surface-card text-text-muted border-border-subtle/50 hover:bg-bg-secondary"
              )}
            >
              {tab.icon} {tab.label}
               {tab.id !== 'summary' && tab.id !== 'ev' && (
                <span className={cn(
                  "ml-1 text-[12px] font-medium px-2 py-0.5 rounded-md",
                  activeTab === tab.id ? "bg-bg-secondary/50" : "bg-bg-secondary",
                  tab.score > 70 ? "text-success" : tab.score > 40 ? "text-warning" : tab.score > 0 ? "text-error-main" : ""
                )}>
                  {tab.score}%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar pb-8">
          {activeTab !== 'summary' && (
            <div className="space-y-4">
              {/* Category Score */}
               {activeTab !== 'ev' && (
                <div className="flex items-center gap-3 p-4 bg-bg-secondary/50 rounded-xl border border-border-subtle/30">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[16px]",
                    calculateScore(activeTab) > 70 ? "bg-success/20 text-success" :
                    calculateScore(activeTab) > 40 ? "bg-warning/20 text-warning" :
                    "bg-error-main/20 text-error-main"
                  )}>
                    {calculateScore(activeTab)}%
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-text-main">Category Score</p>
                    <p className="text-[14px] text-text-muted">
                      {checklist[activeTab].filter(p => p.status === 'pass').length} pass • {checklist[activeTab].filter(p => p.status === 'fail').length} fail • {checklist[activeTab].filter(p => p.status === 'pending').length} pending
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklist[activeTab].map(point => renderPoint(activeTab, point))}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
               {/* Auto-Calculated Scores Display */}
               <div className="grid grid-cols-3 gap-4">
                 {[
                   { label: 'Exterior', score: exteriorScore },
                   { label: 'Interior', score: interiorScore },
                   { label: 'Mechanical', score: mechanicalScore },
                  ].map(cat => (
                   <div key={cat.label} className={cn("p-4 rounded-2xl border text-center space-y-1",
                     cat.score > 70 ? "bg-success/10 border-success/20 text-success" :
                     cat.score > 40 ? "bg-warning/10 border-warning/20 text-warning" :
                     "bg-error-main/10 border-error-main/20 text-error-main"
                   )}>
                     <p className="text-[13px] font-medium opacity-60">{cat.label}</p>
                     <p className="text-2xl font-bold">{cat.score}%</p>
                   </div>
                 ))}
               </div>

                <div className="bg-primary-main/10 border border-primary-main/20 rounded-2xl p-6 text-center space-y-2">
                   <p className="text-[15px] font-semibold text-primary-main">Overall Condition Score</p>
                   <div className={cn("text-5xl font-bold tracking-tight",
                     overallScore > 70 ? "text-success" : overallScore > 40 ? "text-warning" : "text-error-main"
                   )}>{overallScore}%</div>
                   <p className="text-[13px] text-text-muted/60">Auto-calculated from {evaluatedPoints} evaluated points</p>
                </div>

               <div className="grid grid-cols-2 gap-4">
                  <TextField label="EV Battery SOH (%)" value={summary.evData.batterySoh} onChange={v => setSummary({...summary, evData: {...summary.evData, batterySoh: v}})} placeholder="e.g. 92" />
                  <TextField label="Estimated Range (km)" value={summary.evData.range} onChange={v => setSummary({...summary, evData: {...summary.evData, range: v}})} placeholder="e.g. 420" />
               </div>

               <TextAreaField 
                 label="Final Professional Assessment" 
                 value={summary.finalNotes} 
                 onChange={v => setSummary({...summary, finalNotes: v})} 
                 placeholder="Summarize the vehicle's overall condition, highlight any concerns, and provide your professional recommendation for the District Manager..."
                 rows={5}
               />
               
               <div className="pt-2">
                 <Button 
                   variant="primary" 
                   className="w-full h-12"
                   onClick={handleFinalSubmit}
                   disabled={isSubmitting}
                 >
                   {isSubmitting ? 'Submitting...' : `Submit Evaluation (${overallScore}%)`}
                 </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
