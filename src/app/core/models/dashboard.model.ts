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
}

export interface SimulationHistoryItem {
  id: number;
  date: string;
  vehiclePrice: number;
  tcea: number;
}

export interface RecommendedVehicle {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}
