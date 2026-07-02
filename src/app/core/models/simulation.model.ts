export type CurrencyCode = 'PEN' | 'USD';
export type RateType = 'TEA' | 'TEM';
export type GraceType = 'NONE' | 'TOTAL' | 'PARTIAL';
export type PaymentFrequency = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY';

export interface SimulationRequest {
  id: number;
  createdAt: string;
  client: ClientData;
  vehicle: VehicleData;
  credit: CreditConfiguration;
  interest: InterestConfiguration;
  gracePeriod: GracePeriodConfiguration;
  financialAnalysis: FinancialAnalysisConfiguration;
  costs: CostsConfiguration;
}

export interface SimulationDraft {
  client: ClientData;
  vehicle: VehicleData;
  credit: CreditConfiguration;
  interest: InterestConfiguration;
  gracePeriod: GracePeriodConfiguration;
  financialAnalysis: FinancialAnalysisConfiguration;
  costs: CostsConfiguration;
}

export interface ClientData {
  documentNumber: string;
  fullName: string;
}

export interface VehicleData {
  currency: CurrencyCode;
  vehiclePrice: number;
}

export interface CreditConfiguration {
  initialFeePercentage: number;
  balloonFeePercentage: number;
  termMonths: number;
}

export interface InterestConfiguration {
  rateType: RateType;
  rateValuePercentage: number;
  paymentFrequency: PaymentFrequency;
}

export interface GracePeriodConfiguration {
  type: GraceType;
  months: number;
}

export interface FinancialAnalysisConfiguration {
  targetTirPercentage: number;
}

export interface CostsConfiguration {
  lifeInsuranceMonthlyRatePercentage: number;
  administrativeExpenses: number;
  vehicleInsuranceAnnualRatePercentage: number;
}
