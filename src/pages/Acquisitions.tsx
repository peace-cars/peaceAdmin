import { useState, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Clock,
  Car,
  ChevronRight,
  User,
  Zap,
  MapPin,
  Phone,
  DollarSign,
  Image as ImageIcon,
  ArrowRight,
  X,
  Camera,
  Printer
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../lib/utils';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { EvaluationReport } from '../components/documents/EvaluationReport';
import { InspectionReportView } from '../components/dashboard/InspectionReportView';
import { AcquisitionDossierModal } from '../components/ui/AcquisitionDossierModal';

const initialColumns: { id: string; title: string; items: any[] }[] = [
  { id: 'new', title: 'Inbound Assets', items: [] },
  { id: 'appraisal', title: 'Technical Evaluation', items: [] },
  { id: 'review', title: 'Senior Authorization', items: [] },
  { id: 'offer', title: 'Procurement Settlement', items: [] },
  { id: 'acquired', title: 'Registry Secured', items: [] },
];

const statusMap: Record<string, string[]> = {
  'new': ['NEW_LEAD'],
  'appraisal': ['INSPECTION_PENDING', 'CLARIFICATION_REQUIRED'],
  'review': ['MANAGER_REVIEW'],
  'offer': ['OFFER_MADE', 'NEGOTIATING', 'STALE'],
  'acquired': ['ACQUIRED', 'RECONDITIONING']
};

const Acquisitions = () => {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [columns, setColumns] = useState(initialColumns);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [printReportOpen, setPrintReportOpen] = useState(false);
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);

  const fetchStaff = async () => {
    try {
      const data = await api.get<any[]>('/people');
      setBranchStaff(Array.isArray(data) ? data.filter((s: any) => s.isActive && s.role === 'STAFF') : []);
    } catch (err) {
      console.error('[Acquisitions] Fetch Staff Failed', err);
    }
  };

  const fetchLeads = async () => {
    try {
      const allLeads = await api.get<any[]>('/trade-in-requests');
      const newCols = initialColumns.map(col => ({
        ...col,
        items: (Array.isArray(allLeads) ? allLeads : []).filter((lead: any) => {
          const searchStr = `${lead.vehicle || ''} ${lead.customer || ''}`.toLowerCase();
          if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) return false;
          return statusMap[col.id]?.includes(lead.status);
        }).map((lead: any) => ({
          ...lead,
          // Normalize time display
          time: lead.arrivedAt ? new Date(lead.arrivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'
        }))
      }));
      setColumns(newCols);
    } catch (err) {
      console.error('[Acquisitions] Fetch Failed', err);
    }
  };

  const assignStaff = async (tradeInId: string, staffId: string) => {
    if (!staffId) return;
    try {
      await api.post('/staff-tasks', {
        assigned_to: staffId,
        trade_in_id: tradeInId,
        priority: 'HIGH',
        description: 'Evaluate Incoming Asset',
        status: 'ASSIGNED'
      });
      await api.patch(`/trade-in-requests/${tradeInId}/status`, { status: 'INSPECTION_PENDING' });
      fetchLeads();
      if (selectedLead?.id === tradeInId) setSelectedLead(null);
      alert('Staff assigned for technical evaluation.');
    } catch (err) {
      console.error('[Acquisitions] Assignment Failed', err);
      alert('Assignment failed.');
    }
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      await api.patch(`/trade-in-requests/${leadId}/status`, { status: newStatus });
      fetchLeads();
      setSelectedLead(null);
    } catch (err) {
      console.error('[Acquisitions] Update Failed', err);
    }
  };

  const handleApprove = async (id: string, price: number) => {
    try {
      await api.patch(`/trade-in-requests/${id}/approve`, { offerPrice: price });
      fetchLeads();
      setSelectedLead(null);
      setViewReportOpen(false);
    } catch (err) {
      console.error('[Acquisitions] Approve Failed', err);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.patch(`/trade-in-requests/${id}/reject`, { reason });
      fetchLeads();
      setSelectedLead(null);
      setViewReportOpen(false);
    } catch (err) {
      console.error('[Acquisitions] Reject Failed', err);
    }
  };

  const handleClarification = async (id: string, reason: string) => {
    try {
      await api.patch(`/trade-in-requests/${id}/status`, { status: 'CLARIFICATION_REQUIRED' });
      fetchLeads();
      setSelectedLead(null);
      setViewReportOpen(false);
    } catch (err) {
      console.error('[Acquisitions] Clarification Failed', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchLeads();
      fetchStaff();
    }
  }, [session, searchQuery]);

  const visibleColumns = columns.filter(c => c.id === activeTab);
  const totalLeads = columns.reduce((sum, col) => sum + col.items.length, 0);

  const getTranslatedTitle = (id: string) => {
    switch(id) {
      case 'new': return t('acquisitions.inbound');
      case 'appraisal': return t('acquisitions.evaluation');
      case 'review': return t('acquisitions.authorization');
      case 'offer': return t('acquisitions.settlement');
      case 'acquired': return t('acquisitions.secured');
      default: return id;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW_LEAD': return 'bg-primary-main';
      case 'INSPECTION_PENDING': return 'bg-warning';
      case 'CLARIFICATION_REQUIRED': return 'bg-warning/80';
      case 'MANAGER_REVIEW': return 'bg-accent';
      case 'OFFER_MADE': return 'bg-success';
      case 'NEGOTIATING': return 'bg-primary-main/80';
      case 'STALE': return 'bg-text-muted';
      case 'ACQUIRED': return 'bg-text-main';
      case 'RECONDITIONING': return 'bg-accent/60';
      case 'CLOSED_LOST': return 'bg-error-main';
      case 'REJECTED': return 'bg-error-main/80';
      default: return 'bg-text-muted';
    }
  };

  return (
    <div className="animate-fade-in relative">
      <div className="sticky top-0 z-40 -mx-4 md:-mx-8 px-4 md:px-8 py-3 md:py-4 bg-bg border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
         <div className="flex bg-bg-secondary p-1 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto">
            {columns.map(col => (
              <button 
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={cn(
                  "px-4 py-2 text-[13px] font-medium rounded-lg transition-all flex items-center gap-2 shrink-0 whitespace-nowrap",
                  activeTab === col.id ? "bg-surface-card text-primary-main shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                {getTranslatedTitle(col.id)}
                <Badge variant={activeTab === col.id ? 'primary' : 'default'}>
                  {col.items.length}
                </Badge>
              </button>
            ))}
         </div>

         <div className="relative w-full md:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder={t('acquisitions.filter_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-xl h-11 pl-10 pr-4 text-[14px] text-text-main focus:outline-none focus:border-primary-main/30 focus:ring-2 focus:ring-primary-main/10 transition-all w-full md:w-72 placeholder:text-text-muted" 
            />
         </div>
      </div>

      <div className={cn(
        "flex gap-8 overflow-x-auto pb-16 no-scrollbar",
        activeTab === 'all' ? "justify-start" : "justify-center"
      )}>
        {visibleColumns.map(column => (
          <div key={column.id} className={cn(
            "flex flex-col gap-6 transition-all duration-500",
            activeTab === 'all' ? "min-w-80" : "w-full max-w-6xl"
          )}>
            <div className="flex flex-col gap-1 px-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <h3 className="text-[15px] font-semibold text-text-main">{getTranslatedTitle(column.id)}</h3>
                     <Badge variant="primary">
                       {column.items.length}
                     </Badge>
                  </div>
                  <Tooltip content="Stage Options">
                    <button className="text-text-muted hover:text-text-main transition-all p-2 hover:bg-bg-secondary rounded-xl">
                       <MoreHorizontal size={16} />
                    </button>
                  </Tooltip>
               </div>
               <p className="text-[13px] text-text-muted">
                  {column.id === 'new' && 'Incoming evaluation requests'}
                  {column.id === 'appraisal' && 'Technical & safety inspection'}
                  {column.id === 'review' && 'Final management authorization'}
                  {column.id === 'offer' && 'Price negotiation & agreement'}
                  {column.id === 'acquired' && 'Asset finalized in registry'}
               </p>
            </div>

            <div className={cn(
                "flex-1 bg-bg-secondary p-2 md:p-4 rounded-2xl border border-border-subtle min-h-[400px] transition-all",
                activeTab === 'all' ? "grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3" : "grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 auto-rows-min"
            )}>
               {column.items.map((item: any) => (
                 <div 
                  key={item.id} 
                  onClick={() => setSelectedLead(item)}
                  className="bg-surface-card rounded-2xl border border-border-subtle flex flex-col cursor-pointer hover:border-primary-main/30 transition-all overflow-hidden group shadow-sm"
                 >
                    {/* Marketplace Style Image Container */}
                    <div className="relative aspect-video bg-bg-base overflow-hidden border-b border-border-subtle/30">
                      {item.photos && item.photos.length > 0 ? (
                        <img 
                          src={item.photos[0]} 
                          alt={item.vehicle} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car size={48} className="text-text-muted opacity-10" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant={item.status === 'ACQUIRED' ? 'success' : item.status === 'NEW_LEAD' ? 'info' : 'warning'}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      {/* Photo Count - Bottom Right */}
                      {item.photos && item.photos.length > 1 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-lg text-[11px] font-medium">
                          <Camera size={12} /> {item.photos.length}
                        </div>
                      )}
                    </div>

                    {/* Marketplace Info Section */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                           <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-text-main truncate group-hover:text-primary-main transition-colors">{item.vehicle}</p>
                              <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
                                 <User size={10} className="text-text-dim" />
                                 <span className="truncate">{item.customer}</span>
                              </div>
                           </div>
                           <div className="text-right shrink-0">
                              <p className="text-[13px] font-bold text-text-main leading-tight">
                                {(item.askingPrice || 0).toLocaleString()} 
                              </p>
                              <p className="text-[10px] text-primary-main font-bold">ETB</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                           <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-text-dim text-[10px]">
                                 <Clock size={10} /> {item.time}
                              </div>
                              <div className="flex items-center gap-1 text-text-dim text-[10px]">
                                 <MapPin size={10} /> <span className="truncate max-w-[60px]">{item.location || 'Central'}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-1">
                              <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(item.status).replace('bg-', 'bg-'))} />
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{item.status.split('_')[0]}</span>
                           </div>
                        </div>

                        <div className="pt-1">
                           {item.status === 'NEW_LEAD' ? (
                             <div className="relative" onClick={e => e.stopPropagation()}>
                               <select 
                                 className="w-full bg-bg-secondary border border-border-subtle text-[12px] h-9 px-3 rounded-lg text-text-main outline-none focus:border-primary-main appearance-none cursor-pointer"
                                 onChange={(e) => assignStaff(item.id, e.target.value)}
                                 defaultValue=""
                               >
                                 <option value="" disabled>Assign Staff...</option>
                                 {branchStaff.map(s => <option key={s.id} value={s.id}>{s.fullName || s.full_name}</option>)}
                               </select>
                             </div>
                           ) : (
                             <button className="w-full py-2 bg-bg-secondary hover:bg-surface-hover text-text-secondary rounded-lg text-[11px] font-bold uppercase transition-all">
                                View Dossier
                             </button>
                           )}
                        </div>
                     </div>
                 </div>
               ))}

               {column.items.length === 0 && (
                 <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 bg-surface-card rounded-2xl border border-dashed border-border-subtle">
                    <Car size={28} className="text-text-muted opacity-20" />
                    <div>
                       <p className="text-[14px] text-text-muted">{t('acquisitions.empty_registry')}</p>
                       <p className="text-[13px] text-text-dim mt-0.5">No active items in this stage</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal - Now with Images & Full Info */}
      <AcquisitionDossierModal
        selectedLead={selectedLead}
        onClose={() => setSelectedLead(null)}
        branchStaff={branchStaff}
        onAssignStaff={assignStaff}
        onPrint={() => setPrintReportOpen(true)}
        onViewReport={() => setViewReportOpen(true)}
        onUpdateStatus={updateStatus}
      />

      {/* Document Viewer for Print */}
      {selectedLead && (
        <DocumentViewer 
          isOpen={printReportOpen} 
          onClose={() => setPrintReportOpen(false)} 
          title={`Evaluation Report - ${selectedLead.vehicle}`}
        >
          <EvaluationReport 
            vehicle={{
              make: selectedLead.vehicle?.split(' ')?.[0] || 'Unknown',
              model: selectedLead.vehicle?.split(' ')?.slice(1).join(' ') || 'Unknown',
              year: selectedLead.vehicleDetails?.year || selectedLead.vehicle?.match(/\d{4}/)?.[0] || 'N/A',
              mileage: Number(selectedLead.vehicleDetails?.mileage) || 0,
              condition: selectedLead.inspections?.[0] ? (() => {
                const ins = selectedLead.inspections[0];
                const avg = ((ins.mechanical_score || 0) + (ins.exterior_score || 0) + (ins.interior_score || 0)) / 3;
                return avg >= 80 ? 'A' : avg >= 60 ? 'B+' : avg >= 40 ? 'C' : 'D';
              })() : 'Pending',
              price: selectedLead.askingPrice,
              plate_number: selectedLead.plate,
              id: selectedLead.id,
              inspection: selectedLead.inspections?.[0],
              photos: selectedLead.photos,
              fuel_type: selectedLead.vehicleDetails?.fuel_type,
              transmission: selectedLead.vehicleDetails?.transmission,
              customer: selectedLead.customer,
              phone: selectedLead.phone,
              location: selectedLead.location
            }} 
            date={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          />
        </DocumentViewer>
      )}

      <InspectionReportView 
        lead={selectedLead}
        isOpen={viewReportOpen}
        onClose={() => setViewReportOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestClarification={handleClarification}
      />
    </div>
  );
};

export default Acquisitions;
