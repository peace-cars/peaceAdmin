import React from 'react';
import { VehicleCard } from './VehicleCard';

interface VehicleGridProps {
  cars: any[];
  bottomRef: React.Ref<HTMLDivElement>;
  hasMore: boolean;
  loading: boolean;
  onOpen: (car: any) => void;
  onPrint: (car: any) => void;
}

export const VehicleGrid: React.FC<VehicleGridProps> = ({
  cars,
  bottomRef,
  hasMore,
  loading,
  onOpen,
  onPrint,
}) => (
  <div className="flex flex-col gap-3">
    {/* "Vehicles" header row */}
    <div className="flex items-center justify-between">
      <p className="text-[15px] font-black text-text-main">Vehicles</p>
      <span className="text-[12px] font-bold text-primary-main">See all</span>
    </div>

    {/* 2-column grid */}
    <div className="grid grid-cols-2 gap-3">
      {loading ? (
        <>
          <div className="h-48 rounded-2xl bg-border-subtle/40 animate-pulse" />
          <div className="h-48 rounded-2xl bg-border-subtle/40 animate-pulse" />
          <div className="h-48 rounded-2xl bg-border-subtle/40 animate-pulse" />
          <div className="h-48 rounded-2xl bg-border-subtle/40 animate-pulse" />
        </>
      ) : (
        cars.map((car) => (
          <VehicleCard
            key={car.id}
            car={car}
            onOpen={() => onOpen(car)}
            onPrint={() => onPrint(car)}
          />
        ))
      )}
    </div>

    {hasMore && <div ref={bottomRef} className="h-4 w-full" />}
  </div>
);
