import React from 'react';
import { Edit2, Trash2, Image as ImageIcon, FileText, Building2, Printer } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../lib/utils';

interface DesktopTableProps {
  cars: any[];
  loading: boolean;
  onView: (car: any) => void;
  onEdit: (car: any) => void;
  onDelete: (id: string) => void;
  onPrint: (car: any) => void;
}

export const DesktopTable: React.FC<DesktopTableProps> = ({
  cars,
  loading,
  onView,
  onEdit,
  onDelete,
  onPrint,
}) => (
  <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle/30 p-2 hidden md:block">
    <div className="flex flex-col gap-1.5 p-6 border-b border-border-subtle/30">
      <h2 className="text-[13px] font-bold text-text-main">Registry Ledger</h2>
      <p className="text-[12px] text-text-muted/60 font-medium">
        Official documentation of vehicles across the branch network
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-text-muted font-medium text-[13px]">
            <th className="pb-4 pt-6 px-4">Unit Description</th>
            <th className="pb-4 pt-6 px-4">Registry Valuation</th>
            <th className="pb-4 pt-6 px-4">Branch Hub</th>
            <th className="pb-4 pt-6 px-4">Technical Dossier</th>
            <th className="pb-4 pt-6 px-4 text-right">Operational Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td
                    colSpan={5}
                    className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 rounded-2xl mb-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-xl bg-border-subtle/40 animate-pulse shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/4 bg-border-subtle/40 animate-pulse rounded" />
                        <div className="h-3 w-1/3 bg-border-subtle/40 animate-pulse rounded" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </>
          ) : cars.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-text-muted">
                No vehicles found in the registry.
              </td>
            </tr>
          ) : (
            cars.map((car) => (
              <tr
                key={car.id}
                onClick={() => onView(car)}
                className="group transition-all cursor-pointer"
              >
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-l border-border-subtle/30 rounded-l-2xl group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-12 rounded-xl overflow-hidden border border-border-subtle bg-bg-secondary shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                      <img
                        src={car.image}
                        alt={car.model}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {car.floorPlanLoan && (
                        <div className="absolute inset-0 border-2 border-warning rounded-xl" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-main font-bold text-sm tracking-tight leading-tight group-hover:text-primary-main transition-colors">
                        {car.year} {car.make} {car.model}
                      </p>
                      <Tooltip content="System Registry ID">
                        <Badge
                          variant="default"
                          className="font-mono text-[12px] cursor-help bg-bg-secondary border border-border-subtle/30 text-text-muted/60"
                        >
                          ID: {car.id.substring(0, 8).toUpperCase()}
                        </Badge>
                      </Tooltip>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="space-y-1.5">
                    <p className="text-text-main font-bold text-sm tracking-tight leading-none">
                      {car.priceFormatted}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Tooltip content="Tax &amp; Import Status">
                        <Badge
                          variant={car.duty === 'DUTY PAID' ? 'primary' : 'warning'}
                          className="cursor-help"
                        >
                          {car.duty === 'DUTY PAID'
                            ? 'Tax Paid'
                            : car.duty === 'DUTY FREE'
                            ? 'Tax Exempt'
                            : car.duty}
                        </Badge>
                      </Tooltip>
                      {car.status === 'SHOWROOM' &&
                        Math.floor(
                          (new Date().getTime() - new Date(car.createdAt).getTime()) /
                            (1000 * 3600 * 24),
                        ) > 30 && (
                          <Tooltip content="Aged Inventory Alert">
                            <Badge
                              variant="error"
                              className="cursor-help bg-error-main/10 text-error-main border border-error-main/20"
                            >
                              Aged Stock
                            </Badge>
                          </Tooltip>
                        )}
                      {car.floorPlanLoan && (
                        <Tooltip
                          content={`Floor Plan Loan - Maturity: ${car.maturityDate || 'N/A'}`}
                        >
                          <Badge
                            variant="default"
                            className="cursor-help bg-warning/10 text-warning border border-warning/20"
                          >
                            On Credit
                          </Badge>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <Tooltip content="Current Physical Location">
                    <div className="flex items-center gap-2 text-text-muted/60 text-[13px] font-bold bg-bg-secondary/50 px-3 py-2 rounded-xl border border-border-subtle/30 group-hover:border-primary-main/20 transition-all w-fit cursor-help">
                      <Building2 size={12} className="text-primary-main/30" /> {car.branchName}
                    </div>
                  </Tooltip>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-border-subtle/30 group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center gap-2">
                    <Tooltip
                      content={car.gallery.length > 0 ? 'View Asset Photos' : 'No Photos Uploaded'}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-xl border transition-all shadow-sm',
                          car.gallery.length > 0
                            ? 'bg-primary-main/10 text-primary-main border-primary-main/20'
                            : 'bg-bg-secondary text-text-muted/10 border-border-subtle/30',
                        )}
                      >
                        <ImageIcon size={14} />
                      </div>
                    </Tooltip>
                    <Tooltip
                      content={
                        car.internalDocuments.length > 0
                          ? 'View Technical Docs'
                          : 'No Docs Uploaded'
                      }
                    >
                      <div
                        className={cn(
                          'p-2 rounded-xl border transition-all shadow-sm',
                          car.internalDocuments.length > 0
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-bg-secondary text-text-muted/10 border-border-subtle/30',
                        )}
                      >
                        <FileText size={14} />
                      </div>
                    </Tooltip>
                  </div>
                </td>
                <td className="py-4 px-4 bg-bg-secondary/30 border-y border-r border-border-subtle/30 rounded-r-2xl text-right group-hover:bg-bg-secondary/50 group-hover:border-primary-main/30 transition-all">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <Tooltip content="Print Sales Receipt">
                      <button
                        className="w-10 h-10 flex items-center justify-center bg-bg rounded-xl text-text-muted hover:text-primary-main border border-border-subtle shadow-sm transition-all active:scale-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrint(car);
                        }}
                      >
                        <Printer size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Modify Asset Registry">
                      <button
                        className="w-10 h-10 flex items-center justify-center bg-bg-secondary rounded-xl text-text-muted/60 hover:text-primary-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(car);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Remove Asset from Registry">
                      <button
                        className="w-10 h-10 flex items-center justify-center bg-bg-secondary rounded-xl text-text-muted/60 hover:text-error-main border border-border-subtle/30 shadow-sm transition-all active:scale-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(car.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
