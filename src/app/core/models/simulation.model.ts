export type CurrencyCode = 'PEN' | 'USD';
export type RateType = 'TEA' | 'TEM';
export type GraceType = 'NONE' | 'TOTAL' | 'PARTIAL';
export type PaymentFrequency = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY';
export type SimulationViability = 'VIABLE' | 'NOT_VIABLE';
export type PaymentStatus = 'COMPLETED' | 'NEXT' | 'PENDING';
export type SimulationHistoryStatus = 'CALCULATED' | 'SAVED' | 'EXPIRED';

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

export interface SimulationCalculationResponse {
  id: number;
  createdAt: string;
  input: SimulationDraft;
  results: SimulationResults;
}

export interface SimulationResults {
  currency: CurrencyCode;
  monthlyPayment: number;
  includedCostsDescription: string;

  initialCapital: number;
  termMonths: number;
  effectiveRatePercentage: number;

  tceaPercentage: number;
  van: number;
  tirPercentage: number;
  viability: SimulationViability;

  interestAmortizationChart: InterestAmortizationChartItem[];
  balanceEvolution: BalanceEvolutionPoint[];
  schedule: PaymentScheduleRow[];
}

export interface InterestAmortizationChartItem {
  period: number;
  interestPercentage: number;
  capitalPercentage: number;
}

export interface BalanceEvolutionPoint {
  period: number;
  balance: number;
}

export interface PaymentScheduleRow {
  period: number;
  amortization: number;
  interest: number;
  costs: number;
  totalPayment: number;
  finalBalance: number;
}

export interface PaymentScheduleRow {
  period: number;
  initialBalance: number;
  amortization: number;
  interest: number;
  insurance: number;
  administrativeExpenses: number;
  costs: number;
  totalPayment: number;
  finalBalance: number;
  status: PaymentStatus;
}

export interface SimulationHistoryItem {
  id: number;
  createdAt: string;
  vehiclePrice: number;
  currency: CurrencyCode;
  tceaPercentage: number;
  monthlyPayment: number;
  termMonths: number;
  status: SimulationHistoryStatus;
}
