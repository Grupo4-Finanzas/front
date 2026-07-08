import { SimulationHistoryItem } from './simulation.model';

export interface DashboardData {
  summary: SimulationSummary;
  simulations: SimulationHistoryItem[];
  recommendedVehicle: RecommendedVehicle;
}

export interface SimulationSummary {
  tcea: number;
  van: number;
  monthlyPayment: number;
  termMonths: number;
  currency?: 'PEN' | 'USD';
}

export interface RecommendedVehicle {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}
