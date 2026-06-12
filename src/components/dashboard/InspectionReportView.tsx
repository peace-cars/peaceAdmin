import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  CheckCircle2, CarFront, Search, Settings, FileText,
  ShieldCheck, AlertTriangle, User, ChevronRight, MapPin, Phone,
  DollarSign, Tag, Calendar, ClipboardCheck, Download, XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo.png';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { EvaluationReport } from '../documents/EvaluationReport';

interface InspectionReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onApprove?: (id: string, price: number) => void;
  onReject?: (id: string, reason: string) => void;
  onRequestClarification?: (id: string, reason: string) => void;
  isSubmitting?: boolean;
}

export const InspectionReportView: React.FC<InspectionReportViewProps> = ({
  isOpen,
  onClose,
  lead,
  onApprove,
  onReject,
  onRequestClarification,
  isSubmitting
}) => {
  if (!lead) return null;

  const inspection = Array.isArray(lead.inspections) ? lead.inspections[0] : null;
  const checklist = inspection?.checklist || {};
  const inspector = inspection?.profiles || {};
  const hasInspection = !!inspection;
  const details = lead.vehicleDetails || {};

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const printVehicleData = React.useMemo(() => ({
    ...lead,
    inspection: inspection,
    plate_number: lead.plate || details.plate_code || 'Not Recorded',
    make: details.make || lead.vehicle_make_model?.split(' ')[0] || (lead.vehicle && lead.vehicle.length < 35 && !lead.vehicle.toLowerCase().includes('i need') ? lead.vehicle.split(' ')[0] : 'Unspecified'),
    model: details.model || lead.vehicle_make_model?.split(' ').slice(1).join(' ') || (lead.vehicle && lead.vehicle.length < 35 && !lead.vehicle.toLowerCase().includes('i need') ? lead.vehicle.split(' ').slice(1).join(' ') : 'Unspecified'),
    year: details.year || 'Unknown',
    mileage: details.mileage || 0,
    fuel_type: details.fuel_type,
    transmission: details.transmission,
    price: lead.askingPrice || lead.user_asking_price_etb || 0,
    condition: details.overall_condition || 'Not Graded',
    customer: lead.customer || 'Unassigned',
    phone: lead.phone || lead.contactPhone || 'No phone',
    location: lead.location || 'Central Branch',
    photos: lead.photos || [],
  }), [lead, details, inspection]);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const element = printRef.current;

      // 1. Unlock the container so we capture full height
      const prev = {
        overflow:  element.style.overflow,
        maxHeight: element.style.maxHeight,
        height:    element.style.height,
        display:   element.style.display,
      };
      element.style.display   = 'block';
      element.style.overflow  = 'visible';
      element.style.maxHeight = 'none';
      element.style.height    = 'auto';

      // Allow the browser to reflow so we can measure elements
      await new Promise<void>(r => setTimeout(r, 200));

      // SMART PAGINATION: Prevent elements from being sliced in half
      const PAGE_WIDTH_PX = 800;
      const PAGE_RATIO = 277 / 190; // jsPDF A4 usable height / usable width
      const PAGE_HEIGHT_PX = PAGE_WIDTH_PX * PAGE_RATIO;

      const avoidElements = Array.from(element.querySelectorAll('.avoid-slice')) as HTMLElement[];
      
      // Reset any previous dynamic margins
      avoidElements.forEach(el => { el.style.marginTop = '0px'; });

      // Sequentially adjust elements
      for (const el of avoidElements) {
        const rect = el.getBoundingClientRect();
        const containerRect = element.getBoundingClientRect();
        const offsetTop = rect.top - containerRect.top;
        const offsetBottom = offsetTop + rect.height;
        
        const startPage = Math.floor(offsetTop / PAGE_HEIGHT_PX);
        
        // We add a tiny 10px buffer to the bottom so elements right on the edge don't get sliced
        const endPage = Math.floor((offsetBottom + 10) / PAGE_HEIGHT_PX);
        
        // If element spans across a page boundary AND it can actually fit on a single page
        if (startPage !== endPage && rect.height < PAGE_HEIGHT_PX) {
          const nextPageBoundary = (startPage + 1) * PAGE_HEIGHT_PX;
          const pushDown = nextPageBoundary - offsetTop + 20; // 20px padding at top of new page
          el.style.marginTop = `${pushDown}px`;
        }
      }

      // Allow the browser to reflow again with the new margins
      await new Promise<void>(r => setTimeout(r, 200));

      const captureW = element.scrollWidth;
      const captureH = element.scrollHeight;
      const scale    = 2; // retina quality

      // dom-to-image-more uses SVG foreignObject — the browser renders
      // everything natively, so oklch/oklab and all modern CSS just work.
      const dataUrl = await (domtoimage as any).toPng(element, {
        width:  captureW * scale,
        height: captureH * scale,
        bgcolor: '#ffffff',
        style: {
          transform:       `scale(${scale})`,
          transformOrigin: 'top left',
          width:  `${captureW}px`,
          height: `${captureH}px`,
        },
      });

      // 2. Restore original styles
      element.style.overflow  = prev.overflow;
      element.style.maxHeight = prev.maxHeight;
      element.style.height    = prev.height;
      element.style.display   = prev.display;

      // 3. Load the captured image to get natural pixel dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>(r => { img.onload = () => r(); });

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // Draw onto a full canvas for slicing
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width  = imgW;
      fullCanvas.height = imgH;
      const fCtx = fullCanvas.getContext('2d')!;
      fCtx.fillStyle = '#ffffff';
      fCtx.fillRect(0, 0, imgW, imgH);
      fCtx.drawImage(img, 0, 0);

      // 4. Paginate into A4
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const margin  = 10;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const imgHmm  = (imgH / imgW) * usableW;

      let yMm  = 0;
      let page = 0;

      while (yMm < imgHmm) {
        const sliceHmm = Math.min(usableH, imgHmm - yMm);
        const srcYpx   = Math.round((yMm      / imgHmm) * imgH);
        const srcHpx   = Math.round((sliceHmm / imgHmm) * imgH);

        const slice  = document.createElement('canvas');
        slice.width  = imgW;
        slice.height = srcHpx;
        const sCtx   = slice.getContext('2d')!;
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, imgW, srcHpx);
        sCtx.drawImage(fullCanvas, 0, srcYpx, imgW, srcHpx, 0, 0, imgW, srcHpx);

        if (page > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, usableW, sliceHmm);

        yMm  += sliceHmm;
        page += 1;
      }

      pdf.save(`Inspection-Report-PCS-${leadIdSafe}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  const categories = React.useMemo(() => [
    { id: '1', name: 'Exterior & Body', icon: CarFront, data: checklist.exterior || [] },
    { id: '2', name: 'Interior & Cabin', icon: Search, data: checklist.interior || [] },
    { id: '3', name: 'Mechanical & Drivetrain', icon: Settings, data: checklist.mechanical || [] },
  ], [checklist]);

  const formatEvalDate = () => {
    const targetDate = inspection?.created_at || lead.created_at;
    if (!targetDate) return 'Pending';
    try {
      const date = new Date(targetDate);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Date Error';
    }
  };

  const evalDate = formatEvalDate();
  const leadIdSafe = lead.id?.substring(0, 8).toUpperCase() || 'UNKNOWN';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle Appraisal Report"
      subtitle="Complete technical and pricing evaluation"
      maxWidth="max-w-5xl"
    >
      <div className="fixed top-[-9999px] left-[-9999px] w-[800px] z-[-1]">
        <div ref={printRef} className="bg-white hidden print:block" style={{ display: isDownloading ? 'block' : 'none' }}>
          <EvaluationReport vehicle={printVehicleData} date={evalDate} />
        </div>
      </div>

      <div className="space-y-0 pb-0 relative bg-surface-card overflow-hidden flex flex-col font-sans -mx-6 px-6 pt-4">
        
        <div ref={reportRef} className="relative z-10 space-y-8 overflow-y-auto pr-2 pb-8">
          
          {/* Header — stacks on mobile, side-by-side on md+ */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border-subtle pb-6">
            {/* Branding */}
            <div className="flex gap-4 items-center min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-bg-secondary flex items-center justify-center rounded-xl border border-border-subtle shrink-0 overflow-hidden">
                <img src={logo} alt="Peace Cars" className="w-full h-full object-contain p-2" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[17px] sm:text-[20px] font-bold text-text-main leading-tight">Vehicle Appraisal Report</h1>
                <p className="text-[12px] sm:text-[14px] text-text-muted mt-0.5 truncate">Peace Car Sell • Asset Valuation Division</p>
              </div>
            </div>

            {/* Actions + Reference */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Verified</Badge>
                <Button variant="outline" size="sm" onClick={downloadPDF} disabled={isDownloading}>
                  <Download size={14} className="mr-1.5" />
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>
              <div className="text-right">
                <p className="text-[11px] sm:text-[13px] font-medium text-text-muted">Reference ID</p>
                <p className="text-[13px] sm:text-[15px] font-mono font-semibold text-text-main">PCS-{leadIdSafe}</p>
              </div>
            </div>
          </div>

          {/* SECTION 1: VEHICLE OVERVIEW */}
          <div className="space-y-4">
             <h2 className="text-[16px] font-semibold text-text-main border-b border-border-subtle pb-2 flex items-center gap-2">
                <Tag size={18} className="text-primary-main" /> 1. Vehicle Overview
             </h2>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Identity */}
                <div className="col-span-1 lg:col-span-5 space-y-3">
                   <div className="relative aspect-[4/3] bg-bg-secondary rounded-2xl overflow-hidden border border-border-subtle group">
                      {lead.photos && lead.photos.length > 0 ? (
                        <img 
                          src={lead.photos[activePhotoIdx] || lead.photos[0]} 
                          alt={lead.vehicle} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted opacity-40">
                          <CarFront size={40} />
                          <span className="text-[14px] font-medium">No Image</span>
                        </div>
                      )}
                      
                      {lead.photos && lead.photos.length > 1 && (
                        <div className="absolute bottom-3 right-3 flex gap-2 no-print">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActivePhotoIdx(prev => prev > 0 ? prev - 1 : lead.photos.length - 1); }}
                            className="w-8 h-8 bg-surface-card border border-border-subtle rounded-full flex items-center justify-center text-text-main shadow-sm"
                          >
                            <ChevronRight size={16} className="rotate-180" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActivePhotoIdx(prev => prev < lead.photos.length - 1 ? prev + 1 : 0); }}
                            className="w-8 h-8 bg-surface-card border border-border-subtle rounded-full flex items-center justify-center text-text-main shadow-sm"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                   </div>
                   {lead.photos && lead.photos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 no-print">
                        {lead.photos.map((photo: string, idx: number) => (
                          <button 
                            key={idx} 
                            onClick={() => setActivePhotoIdx(idx)}
                            className={cn(
                              "w-16 aspect-[4/3] rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                              idx === activePhotoIdx ? "border-primary-main" : "border-transparent opacity-60"
                            )}
                          >
                            <img src={photo} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                   )}
                </div>

                {/* Core Attributes */}
                 <div className="col-span-1 lg:col-span-7">
                   <div className="grid grid-cols-2 gap-y-5 gap-x-6 bg-bg-secondary p-5 rounded-2xl border border-border-subtle">
                     {[
                       { label: 'Date', value: evalDate, icon: <Calendar size={16}/> },
                       { label: 'Vehicle Model', value: lead.vehicle || lead.vehicle_make_model || 'Unknown Model', icon: <CarFront size={16}/> },
                       { label: 'Customer', value: lead.customer || 'Unassigned', icon: <User size={16}/> },
                       { label: 'Contact Phone', value: lead.phone || lead.contactPhone || 'No phone', icon: <Phone size={16}/> },
                       { label: 'License Plate', value: lead.plate || details.plate_code || 'Not Recorded', icon: <ClipboardCheck size={16}/> },
                       { label: 'Location', value: lead.location || 'Central Branch', icon: <MapPin size={16}/> },
                       { label: 'Tax Status', value: details.duty_status === 'DUTY_PAID' ? 'Tax Paid' : details.duty_status === 'DUTY_FREE' ? 'Tax Exempt' : details.duty_status?.replace('_', ' ') || 'Unknown', icon: <FileText size={16}/> },
                       { label: 'Libre Status', value: details.libre_status?.replace('_', ' ') || 'Unknown', icon: <FileText size={16}/> }
                     ].map(item => (
                       <div key={item.label}>
                          <p className="text-[13px] font-medium text-text-muted flex items-center gap-1.5 mb-1">{item.icon} {item.label}</p>
                          <p className="text-[15px] font-semibold text-text-main truncate">{item.value}</p>
                       </div>
                     ))}
                   </div>

                   <div className="mt-4 flex flex-col md:flex-row gap-4">
                      <div className="flex-1 bg-primary-main/10 border border-primary-main/20 p-4 rounded-2xl">
                         <p className="text-[14px] font-medium text-primary-main flex items-center gap-1.5 mb-1">
                           <DollarSign size={16} /> Requested Price
                         </p>
                         <p className="text-[28px] font-bold text-text-main tracking-tight">
                            {(lead.askingPrice || lead.user_asking_price_etb || 0).toLocaleString()} <span className="text-[14px] font-medium text-primary-main">ETB</span>
                         </p>
                      </div>
                      {hasInspection && (
                        <div className="flex-1 bg-surface-card border border-border-subtle p-4 rounded-2xl flex flex-col justify-center">
                           <p className="text-[14px] font-medium text-text-muted mb-1">Mechanical Score</p>
                           <div className="flex items-end gap-2">
                             <p className="text-[28px] font-bold text-text-main tracking-tight">{inspection.mechanical_score || 0}%</p>
                             <p className="text-[14px] font-medium text-success mb-1.5">Passed</p>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* SECTION 2: TECHNICAL SPECIFICATIONS */}
          {Object.keys(details).length > 0 && (
             <div className="space-y-4 print-break-inside-avoid">
                <h2 className="text-[16px] font-semibold text-text-main border-b border-border-subtle pb-2 flex items-center gap-2">
                   <Settings size={18} className="text-primary-main" /> 2. Technical Specifications
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-white border border-border-subtle p-4 rounded-xl">
                      <p className="text-[13px] font-medium text-text-muted mb-1">Powertrain</p>
                      <p className="text-[15px] font-semibold text-text-main capitalize">{details.fuel_type?.replace('_', ' ') || 'Unknown'}</p>
                      <p className="text-[13px] text-text-muted mt-0.5">{details.engine_cc ? `${details.engine_cc} CC` : ''}</p>
                   </div>
                   <div className="bg-white border border-border-subtle p-4 rounded-xl">
                      <p className="text-[13px] font-medium text-text-muted mb-1">Transmission</p>
                      <p className="text-[15px] font-semibold text-text-main capitalize">{details.transmission?.toLowerCase() || 'Unknown'}</p>
                      <p className="text-[13px] text-text-muted mt-0.5">{details.drive_type?.replace('_', ' ') || 'Standard'}</p>
                   </div>
                   <div className="bg-surface-card border border-border-subtle p-4 rounded-xl">
                      <p className="text-[13px] font-medium text-text-muted mb-1">Mileage</p>
                      <p className="text-[15px] font-semibold text-text-main">{Number(details.mileage || 0).toLocaleString()} km</p>
                   </div>
                   {['ELECTRIC', 'HYBRID'].includes(details.fuel_type) ? (
                     <div className="bg-success/10 border border-success/20 p-4 rounded-xl">
                        <p className="text-[13px] font-medium text-success mb-1">EV Details</p>
                        <p className="text-[15px] font-semibold text-success">{details.battery_kwh ? `${details.battery_kwh} kWh` : 'Battery Unknown'}</p>
                        <p className="text-[13px] text-success mt-0.5">{details.charger_type ? `Charger: ${details.charger_type.replace('_', ' ')}` : ''}</p>
                     </div>
                   ) : (
                     <div className="bg-surface-card border border-border-subtle p-4 rounded-xl">
                        <p className="text-[13px] font-medium text-text-muted mb-1">Accident History</p>
                        <p className="text-[15px] font-semibold text-text-main capitalize">{details.accident_history?.replace('_', ' ') || 'None Reported'}</p>
                     </div>
                   )}
                </div>
             </div>
          )}

          {/* SECTION 3: INSPECTION RESULTS */}
          <div className="space-y-4 print-break-inside-avoid">
             <h2 className="text-[16px] font-semibold text-text-main border-b border-border-subtle pb-2 flex items-center gap-2">
                <Search size={18} className="text-primary-main" /> 3. Technical Inspection
             </h2>

             {!hasInspection ? (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                   <div className="w-14 h-14 bg-warning/20 rounded-full flex items-center justify-center text-warning">
                     <AlertTriangle size={24} />
                   </div>
                   <div>
                     <h3 className="text-[16px] font-bold text-warning">Inspection Pending</h3>
                     <p className="text-[14px] text-warning/80 mt-1 max-w-md mx-auto">
                       This vehicle is awaiting a comprehensive technical inspection by our certified staff. Pricing and final authorization cannot be completed until the inspection is logged.
                     </p>
                   </div>
                </div>
             ) : (
                <div className="space-y-6">
                    {/* Inspector Info */}
                   <div className="flex items-center gap-4 bg-bg-secondary p-4 rounded-xl border border-border-subtle">
                      <div className="w-11 h-11 bg-surface-card border border-border-subtle rounded-full flex items-center justify-center text-text-muted">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-text-muted">Certified Inspector</p>
                        <p className="text-[15px] font-semibold text-text-main">{inspector.full_name || 'Staff Technician'}</p>
                      </div>
                   </div>

                    {/* Categories */}
                   <div className="grid grid-cols-1 gap-4">
                     {categories.map(cat => (
                       <div key={cat.id} className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden print-border">
                          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-3 border-b border-border-subtle">
                            <cat.icon size={18} className="text-text-muted" />
                            <h3 className="text-[15px] font-semibold text-text-main">{cat.name}</h3>
                          </div>

                          <div className="p-0">
                            {cat.data && cat.data.length > 0 ? (
                              <table className="w-full text-left text-[14px]">
                                <tbody>
                                  {cat.data.map((point: any, idx: number) => (
                                    <tr key={point.id || idx} className="border-b border-border-subtle last:border-0">
                                      <td className="py-3 px-4 font-medium text-text-main w-1/2">{point.label}</td>
                                      <td className="py-3 px-4 text-center w-32">
                                        {point.status === 'pass' ? (
                                          <Badge variant="success" className="w-full justify-center">
                                            <CheckCircle2 size={14} className="mr-1" /> Pass
                                          </Badge>
                                        ) : (
                                          <Badge variant="error" className="w-full justify-center">
                                            <XCircle size={14} className="mr-1" /> Defect
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-text-muted">{point.notes || 'No notes provided.'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-4 text-center text-text-muted text-[14px]">No data recorded for this category.</div>
                            )}
                          </div>

                          {/* Photos for Category */}
                          {Array.isArray(cat.data) && cat.data.some((p: any) => p.photo) && (
                            <div className="flex gap-3 p-4 pt-0 overflow-x-auto no-scrollbar no-print">
                               {cat.data.filter((p: any) => p.photo).map((p: any, idx: number) => (
                                 <div key={idx} className="space-y-1 w-32 shrink-0">
                                    <div className="aspect-[4/3] rounded-lg border border-border-subtle overflow-hidden cursor-zoom-in" onClick={() => window.open(p.photo, '_blank')}>
                                       <img src={p.photo} alt={p.label} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[12px] font-medium text-text-muted truncate" title={p.label}>{p.label}</p>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     ))}
                   </div>

                    {/* Final Verdict */}
                   <div className="bg-primary-main/10 border border-primary-main/20 rounded-2xl p-6 print-break-inside-avoid">
                      <div className="flex items-center gap-2 mb-2">
                         <ShieldCheck size={20} className="text-primary-main" />
                         <h3 className="text-[15px] font-semibold text-text-main">Final Inspector Verdict</h3>
                      </div>
                      <p className="text-text-main text-[16px] font-medium italic">
                        "{inspection.final_notes || "The vehicle has been successfully evaluated and meets the required criteria for acquisition."}"
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>

         {/* Action Bar / Footer */}
        <div className="p-4 bg-bg-secondary border-t border-border-subtle z-50 flex items-center justify-between no-print mx--6 -mx-6 mb--4 -mb-4">
           {(lead.status === 'MANAGER_REVIEW' || lead.status === 'ESCALATED_TO_GM') && onApprove && onReject ? (
             <>
               <div className="space-y-0.5 hidden md:block">
                  <p className="text-[15px] font-semibold text-text-main">Management Authorization Required</p>
                  <p className="text-[13px] text-text-muted">Review the appraisal and authorize the final offer.</p>
               </div>
               <div className="flex items-center gap-3 w-full md:w-auto">
                  {onRequestClarification && (
                    <Button 
                      variant="outline" 
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      onClick={() => {
                        const reason = prompt('Please specify what clarification is needed from the customer:');
                        if (reason) {
                          onRequestClarification(lead.id, reason);
                          onClose();
                        }
                      }}
                    >
                      Clarify
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    onClick={() => {
                      const reason = prompt('Please provide a reason for rejecting this vehicle:');
                      if (reason) {
                        onReject(lead.id, reason);
                        onClose();
                      }
                    }}
                  >
                    Reject Vehicle
                  </Button>
                  <Button 
                    variant="primary" 
                    disabled={!hasInspection || isSubmitting}
                    loading={isSubmitting}
                    onClick={() => {
                      const price = prompt('Enter the final approved offer price (ETB):', lead.user_asking_price_etb || lead.askingPrice || 0);
                      if (price) {
                        onApprove(lead.id, Number(price));
                        onClose();
                      }
                    }}
                  >
                    Authorize Offer
                  </Button>
               </div>
             </>
           ) : (
             <div className="w-full flex justify-end">
               <Button variant="outline" className="px-8" onClick={onClose}>
                  Close Report
               </Button>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
};
