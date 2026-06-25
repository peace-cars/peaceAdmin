import React from 'react';
import { Package, Settings, Image as ImageIcon, Zap, FileText, X, ExternalLink, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextField, SelectField } from '../ui/FormControls';
import { DocumentPreviewButton } from '../ui/DocumentViewerModal';
import ImageUpload from '../ImageUpload';
import { cn } from '../../lib/utils';

interface AssetFormModalProps {
  isOpen: boolean;
  editingId: string | null;
  formData: any;
  setFormData: (d: any) => void;
  activeTab: string;
  setActiveTab: (t: any) => void;
  branches: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  editingId,
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  branches,
  onClose,
  onSubmit,
  isSubmitting,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={editingId ? 'Edit Asset Registry' : 'New Asset Registration'}
    subtitle="Regional vehicle inventory and technical archives."
    maxWidth="max-w-4xl"
    footer={
      <>
        <Button variant="outline" className="flex-1 h-12" onClick={onClose} disabled={isSubmitting}>
          Cancel Operation
        </Button>
        <Button
          variant="primary"
          className="flex-1 h-12 shadow-lg shadow-primary-main/20"
          onClick={(e) => onSubmit(e as any)}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {editingId ? 'Commit Asset Changes' : 'Finalize Registry Entry'}
        </Button>
      </>
    }
  >
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-bg-secondary/50 p-1.5 md:p-2 rounded-[100px] border border-border-subtle/30 shrink-0 mx-[-8px] md:mx-0 px-3 md:px-2 snap-x snap-mandatory">
        {[
          { id: 'core', label: 'Core Registry', icon: <Package size={14} /> },
          { id: 'specs', label: 'Specifications', icon: <Settings size={14} /> },
          { id: 'gallery', label: 'Asset Gallery', icon: <ImageIcon size={14} /> },
          { id: 'financials', label: 'Financials', icon: <Zap size={14} /> },
          { id: 'archives', label: 'Internal Archives', icon: <FileText size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 text-[13px] font-bold transition-all rounded-full whitespace-nowrap shrink-0 snap-start',
              activeTab === tab.id
                ? 'bg-surface-card text-primary-main shadow-sm border border-border-subtle/30'
                : 'text-text-muted/60 hover:text-text-main hover:bg-bg-secondary',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto mt-4 px-1 pb-4">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* ── CORE ── */}
          {activeTab === 'core' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <TextField
                label="Make"
                value={formData.make}
                onChange={(v) => setFormData({ ...formData, make: v })}
                placeholder="e.g. Toyota"
              />
              <TextField
                label="Model"
                value={formData.model}
                onChange={(v) => setFormData({ ...formData, model: v })}
                placeholder="e.g. bZ4X"
              />
              <TextField
                label="Year"
                type="number"
                value={formData.year}
                onChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
              />
              <TextField
                label="Retail Price (ETB)"
                type="number"
                value={formData.retailPrice}
                onChange={(v) => setFormData({ ...formData, retailPrice: parseInt(v) })}
              />
              <SelectField
                label="Fuel Type"
                value={formData.fuelType}
                onChange={(v) => setFormData({ ...formData, fuelType: v })}
                options={['ELECTRIC', 'PETROL', 'HYBRID']}
              />
              <SelectField
                label="Duty Status"
                value={formData.dutyStatus}
                onChange={(v) => setFormData({ ...formData, dutyStatus: v })}
                options={['DUTY_PAID', 'DUTY_FREE']}
              />
              <TextField
                label="Plate"
                value={formData.plate}
                onChange={(v) => setFormData({ ...formData, plate: v })}
              />
              <TextField
                label="VIN"
                value={formData.vin}
                onChange={(v) => setFormData({ ...formData, vin: v })}
              />
              <SelectField
                label="Regional Hub"
                value={formData.branchId}
                onChange={(v) => setFormData({ ...formData, branchId: v })}
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
              />
              <SelectField
                label="System Status"
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v })}
                options={['SOURCING', 'SHOWROOM', 'SOLD']}
              />
              <TextField
                label="Certified KM"
                type="number"
                value={formData.certifiedKm}
                onChange={(v) => setFormData({ ...formData, certifiedKm: v })}
                placeholder="e.g. 12000"
              />
            </div>
          )}

          {/* ── SPECS ── */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Electric Powertrain
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <TextField
                    label="Battery (kWh)"
                    value={formData.specifications.batteryKwh}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        specifications: { ...formData.specifications, batteryKwh: v },
                      })
                    }
                  />
                  <TextField
                    label="Range (km)"
                    value={formData.specifications.range}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        specifications: { ...formData.specifications, range: v },
                      })
                    }
                  />
                </div>
                <TextField
                  label="Motor Power"
                  value={formData.specifications.motorPower}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, motorPower: v },
                    })
                  }
                />
              </div>
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Chassis &amp; Interior
                </p>
                <SelectField
                  label="Drive Train"
                  value={formData.specifications.driveTrain}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, driveTrain: v },
                    })
                  }
                  options={['RWD', 'AWD', 'FWD']}
                />
                <TextField
                  label="Interior Color"
                  value={formData.specifications.interiorColor}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, interiorColor: v },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* ── GALLERY ── */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 md:space-y-10">
              <ImageUpload
                bucket="vehicles"
                folder="gallery"
                maxFiles={12}
                onUploadComplete={(urls) =>
                  setFormData((prev: any) => ({ ...prev, gallery: [...prev.gallery, ...urls] }))
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {formData.gallery.map((url: string, i: number) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-border-subtle bg-bg-secondary shadow-sm group/img"
                  >
                    <img src={url} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          gallery: formData.gallery.filter((_: any, idx: number) => idx !== i),
                        })
                      }
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-error-main text-white rounded-xl opacity-0 group-hover/img:opacity-100 transition-all shadow-lg scale-90 group-hover/img:scale-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FINANCIALS ── */}
          {activeTab === 'financials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Costing &amp; Sales
                </p>
                <TextField
                  label="True Unit Cost (ETB)"
                  type="number"
                  value={formData.unitCost}
                  onChange={(v) => setFormData({ ...formData, unitCost: v })}
                  placeholder="Include purchase + reconditioning"
                />
                <TextField
                  label="Sold Date"
                  type="date"
                  value={formData.soldDate}
                  onChange={(v) => setFormData({ ...formData, soldDate: v })}
                />
              </div>
              <div className="space-y-4 md:space-y-6 bg-bg-secondary/50 p-4 md:p-6 rounded-2xl border border-border-subtle/30">
                <p className="text-[13px] font-bold text-text-main uppercase tracking-wider border-l-4 border-primary-main pl-4">
                  Floor Plan Management
                </p>
                <div className="flex items-center gap-3 py-2 md:py-4">
                  <input
                    type="checkbox"
                    id="floorPlan"
                    checked={formData.floorPlanLoan}
                    onChange={(e) =>
                      setFormData({ ...formData, floorPlanLoan: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-border-subtle/30 text-primary-main focus:ring-primary-main"
                  />
                  <label htmlFor="floorPlan" className="text-sm font-bold text-text-main">
                    Vehicle is on Floor Plan / Credit
                  </label>
                </div>
                {formData.floorPlanLoan && (
                  <TextField
                    label="Maturity / Payment Deadline"
                    type="date"
                    value={formData.maturityDate}
                    onChange={(v) => setFormData({ ...formData, maturityDate: v })}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── ARCHIVES ── */}
          {activeTab === 'archives' && (
            <div className="space-y-6 md:space-y-8">
              <ImageUpload
                bucket="vehicles"
                folder="documents"
                label="Upload Technical Dossiers"
                onUploadComplete={(urls) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    internalDocuments: [...prev.internalDocuments, ...urls],
                  }))
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {formData.internalDocuments.map((doc: any, i: number | string) => (
                  <div
                    key={i}
                    className="bg-bg-secondary/50 border border-border-subtle/30 p-6 rounded-3xl flex items-center justify-between group/doc hover:bg-bg-secondary/80 hover:border-primary-main/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-warning/10 border border-warning/20 w-12 h-12 rounded-2xl flex items-center justify-center text-warning shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[13px] font-bold text-text-main line-clamp-1">
                          {typeof doc === 'string' ? doc.split('/').pop() : doc.name}
                        </p>
                        <p className="text-[13px] text-text-muted/40 font-bold uppercase tracking-wider">
                          Internal Resource
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DocumentPreviewButton
                        url={typeof doc === 'string' ? doc : doc.url}
                        title={typeof doc === 'string' ? 'Document' : doc.name}
                        className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-xl text-text-muted/60 hover:text-primary-main shadow-sm transition-all active:scale-90"
                      >
                        <ExternalLink size={16} />
                      </DocumentPreviewButton>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            internalDocuments: formData.internalDocuments.filter(
                              (_: any, idx: number) => idx !== i,
                            ),
                          })
                        }
                        className="w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border-subtle/30 rounded-xl text-error-main hover:bg-error-main/5 hover:border-error-main/20 shadow-sm transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  </Modal>
);
