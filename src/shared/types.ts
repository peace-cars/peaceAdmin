export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  retailPriceETB: number;
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  dutyStatus: 'DUTY_PAID' | 'DUTY_FREE';
  images: string[];
  locationName?: string;
  certifiedKm?: number;
  batterySoh?: number;
  status: string;
  branchId: string;
  inquiryCount?: number;
  vinChassis?: string;
  plateCode?: string;
  chargerType?: string;
  softwareLanguage?: string;
  rangeKm?: number;
  batteryCapacity?: string | number;
  motorPower?: string | number;
  driveTrain?: string;
  interiorColor?: string;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
}

export interface TradeInRequest {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  estimatedValue: number;
  status: string;
}
