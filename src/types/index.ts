// ==========================================
// PeaceCars Admin — Centralized Type Definitions
// ==========================================

// === Enums (as const objects) ===

export const VehicleStatus = {
  SOURCING: 'SOURCING',
  IN_TRANSIT: 'IN_TRANSIT',
  CUSTOMS_CLEARING: 'CUSTOMS_CLEARING',
  RECONDITIONING: 'RECONDITIONING',
  SHOWROOM: 'SHOWROOM',
  SOLD: 'SOLD',
  ARCHIVED: 'ARCHIVED',
} as const;
export type VehicleStatus = typeof VehicleStatus[keyof typeof VehicleStatus];

export const TradeInStatus = {
  NEW_LEAD: 'NEW_LEAD',
  INSPECTION_PENDING: 'INSPECTION_PENDING',
  CLARIFICATION_REQUIRED: 'CLARIFICATION_REQUIRED',
  MANAGER_REVIEW: 'MANAGER_REVIEW',
  ESCALATED_TO_GM: 'ESCALATED_TO_GM',
  OFFER_MADE: 'OFFER_MADE',
  NEGOTIATING: 'NEGOTIATING',
  ACQUIRED: 'ACQUIRED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  STALE: 'STALE',
} as const;
export type TradeInStatus = typeof TradeInStatus[keyof typeof TradeInStatus];

export const RoleType = {
  USER: 'USER',
  BROKER: 'BROKER',
  STAFF: 'STAFF',
  DISTRICT_MANAGER: 'DISTRICT_MANAGER',
  GENERAL_MANAGER: 'GENERAL_MANAGER',
  FINANCE_AUDITOR: 'FINANCE_AUDITOR',
} as const;
export type RoleType = typeof RoleType[keyof typeof RoleType];

export const FuelType = {
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
} as const;
export type FuelType = typeof FuelType[keyof typeof FuelType];

export const DutyStatus = {
  DUTY_PAID: 'DUTY_PAID',
  DUTY_FREE: 'DUTY_FREE',
  IN_BONDED: 'IN_BONDED',
} as const;
export type DutyStatus = typeof DutyStatus[keyof typeof DutyStatus];

export const BudgetStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  DISBURSED: 'DISBURSED',
  REJECTED: 'REJECTED',
} as const;
export type BudgetStatus = typeof BudgetStatus[keyof typeof BudgetStatus];

// === Domain Models ===

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone_number?: string;
  is_active: boolean;
  district_id?: string;
  manager_id?: string;
  created_at?: string;
}

export interface District {
  id: string;
  name: string;
  code?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone_number?: string;
  role: RoleType;
  branch_id?: string;
  district_id?: string;
  is_verified: boolean;
  is_inspector_verified: boolean;
  commission_tier?: number;
  gamification_points?: number;
  avatar_url?: string;
  date_of_birth?: string;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  retail_price_etb: number;
  status: VehicleStatus;
  fuel: FuelType;
  duty: DutyStatus;
  branch_id?: string;
  vin_chassis?: string;
  plate_code?: string;
  images?: string[];
  battery_soh_percent?: number;
  certified_km?: number;
  range_km?: number;
  motor_power_kw?: number;
  drive_train?: string;
  interior_color?: string;
  battery_capacity_kwh?: number;
  features?: string[];
  unit_cost?: number;
  total_landed_cost_etb?: number;
  floor_plan_loan?: boolean;
  maturity_date?: string;
  created_at?: string;
  branches?: { name: string };
}

export interface TradeInRequest {
  id: string;
  customer: string;
  phone: string;
  vehicle: string;
  plate: string;
  arrivedAt: string;
  location: string;
  locationAddress?: string;
  financing: boolean;
  status: TradeInStatus;
  photos?: string[];
  askingPrice?: number;
  inspections?: Inspection[];
  vehicleDetails?: Record<string, unknown>;
  contactPhone?: string;
  contactCity?: string;
}

export interface Inspection {
  id: string;
  trade_in_id: string;
  inspector_id: string;
  mechanical_score: number;
  exterior_score: number;
  interior_score: number;
  checklist?: Record<string, unknown>;
  ev_data?: Record<string, unknown>;
  final_notes?: string;
  is_certified: boolean;
  created_at: string;
  profiles?: { full_name: string; role: string };
}

export interface StaffBudget {
  id: string;
  requester_id: string;
  amount_requested: number;
  amount_approved?: number;
  purpose: string;
  status: BudgetStatus;
  receipt_url?: string;
  approver_id?: string;
  auditor_id?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
    locations?: { name: string };
  };
}

export interface Commission {
  id: string;
  beneficiaryName: string;
  beneficiaryRole: string;
  type: string;
  amountEtb: number;
  profitMargin: number;
  dmVerified: boolean;
  gmApproved: boolean;
  isPaid: boolean;
  payoutDate?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  message?: string;
  type?: string;
  isRead: boolean;
  created_at?: string;
  reference_id?: string;
}

export interface StaffTask {
  id: string;
  assigned_to: string;
  trade_in_id?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_REVIEW';
  completed_at?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  fullName: string;
  role: string;
  locationId?: string;
  score: number;
  totalSales: number;
  averageRating?: number;
  isSellerOfMonth: boolean;
}

export interface DistrictOverview {
  district_id: string;
  district_name: string;
  dm_name?: string;
  total_branches: number;
  total_staff: number;
  total_vehicles: number;
  total_value_etb: number;
}

export interface Scope {
  branchName?: string;
  branchId?: string;
  districtId?: string;
  districtName?: string;
  role?: string;
}
