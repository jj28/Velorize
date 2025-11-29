// Core data models for Velorize

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  SOP_LEADER = 'sop_leader',
  VIEWER = 'viewer',
}

export interface Product {
  id: string;
  skuCode: string;
  name: string;
  category?: string;
  unitCost?: number;
  rrp?: number;
  uom?: string;
  trltDays?: number; // Total Replenishment Lead Time
  shelfLifeDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BOM {
  id: string;
  finishedGoodId: string;
  componentId: string;
  quantity: number;
  uom: string;
}

export interface StockOnHand {
  id: string;
  productId: string;
  location: string;
  quantity: number;
  asOfDate: string;
}

export interface DemandForecast {
  id: string;
  productId: string;
  forecastDate: string;
  forecastQuantity: number;
  forecastMethod: ForecastMethod;
  createdAt: string;
}

export type ForecastMethod = 'SARIMA' | 'MovingAverage' | 'Exponential' | 'Manual';

export interface SalesActual {
  id: string;
  productId: string;
  customerId?: string;
  saleDate: string;
  quantity: number;
  revenue: number;
}

export interface ForecastAccuracy {
  id: string;
  productId: string;
  periodStart: string;
  periodEnd: string;
  wmape: number; // Weighted Mean Absolute Percentage Error
  bias: number;
  forecastTotal: number;
  actualTotal: number;
  calculatedAt: string;
}

export interface AgingExcessItem {
  productId: string;
  skuCode: string;
  productName: string;
  category: string;
  currentStock: number;
  forecastDemand: number;
  excessQuantity: number;
  daysOfInventory: number;
  shelfLifeRemaining?: number;
  cashTied: number;
}

export interface ABCClassification {
  productId: string;
  skuCode: string;
  productName: string;
  abcClass: 'A' | 'B' | 'C';
  xyzClass: 'X' | 'Y' | 'Z';
  annualRevenue: number;
  annualVolume: number;
  demandVariability: number;
}
