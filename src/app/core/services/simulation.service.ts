import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

import {
  SimulationCalculationResponse,
  SimulationDraft,
  SimulationRequest
} from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly simulationsUrl = 'assets/data/simulations.json';
  private readonly simulationsStorageKey = 'crediauto_simulations';
  private readonly resultsStorageKey = 'crediauto_calculation_results';
  private readonly latestResultIdKey = 'crediauto_latest_calculation_id';

  constructor(private readonly http: HttpClient) {}

  getSimulations(): Observable<SimulationRequest[]> {
    return this.http.get<SimulationRequest[]>(this.simulationsUrl).pipe(
      catchError(() => of([])),
      map(seedSimulations => [
        ...seedSimulations,
        ...this.getLocalSimulations()
      ])
    );
  }

  saveSimulation(draft: SimulationDraft): Observable<SimulationRequest> {
    const newSimulation: SimulationRequest = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...draft
    };

    const currentSimulations = this.getLocalSimulations();

    localStorage.setItem(
      this.simulationsStorageKey,
      JSON.stringify([...currentSimulations, newSimulation])
    );

    return of(newSimulation);
  }

  calculateSimulation(draft: SimulationDraft): Observable<SimulationCalculationResponse> {
    // Mock temporal.
    // Luego esto será:
    // return this.http.post<SimulationCalculationResponse>(`${environment.apiUrl}/simulations/calculate`, draft);

    const response = this.buildCalculationResponse(draft);

    const currentResults = this.getLocalCalculationResults();

    localStorage.setItem(
      this.resultsStorageKey,
      JSON.stringify([...currentResults, response])
    );

    localStorage.setItem(this.latestResultIdKey, String(response.id));

    return of(response);
  }

  getCalculationResultById(id: number): Observable<SimulationCalculationResponse | null> {
    const result = this.getLocalCalculationResults().find(item => item.id === id);
    return of(result ?? null);
  }

  getLatestCalculationResult(): Observable<SimulationCalculationResponse | null> {
    const latestId = Number(localStorage.getItem(this.latestResultIdKey));

    if (!latestId) {
      return of(null);
    }

    return this.getCalculationResultById(latestId);
  }

  private getLocalSimulations(): SimulationRequest[] {
    const rawSimulations = localStorage.getItem(this.simulationsStorageKey);

    if (!rawSimulations) {
      return [];
    }

    try {
      return JSON.parse(rawSimulations) as SimulationRequest[];
    } catch {
      return [];
    }
  }

  private getLocalCalculationResults(): SimulationCalculationResponse[] {
    const rawResults = localStorage.getItem(this.resultsStorageKey);

    if (!rawResults) {
      return [];
    }

    try {
      return JSON.parse(rawResults) as SimulationCalculationResponse[];
    } catch {
      return [];
    }
  }

  private buildCalculationResponse(draft: SimulationDraft): SimulationCalculationResponse {
    const vehiclePrice = draft.vehicle.vehiclePrice;
    const initialFee = vehiclePrice * (draft.credit.initialFeePercentage / 100);
    const initialCapital = vehiclePrice - initialFee;

    const termMonths = draft.credit.termMonths;
    const annualRate = draft.interest.rateValuePercentage / 100;

    const monthlyRate =
      draft.interest.rateType === 'TEA'
        ? Math.pow(1 + annualRate, 1 / 12) - 1
        : annualRate;

    const baseMonthlyPayment =
      monthlyRate === 0
        ? initialCapital / termMonths
        : initialCapital * ((monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1));

    const estimatedMonthlyCosts =
      draft.costs.administrativeExpenses +
      initialCapital * (draft.costs.lifeInsuranceMonthlyRatePercentage / 100);

    const monthlyPayment = baseMonthlyPayment + estimatedMonthlyCosts;

    const tceaPercentage = draft.interest.rateValuePercentage + 2.32;
    const tirPercentage = draft.financialAnalysis.targetTirPercentage + 3.4;
    const van = initialCapital * 0.0693;

    const schedule = this.buildSchedule(
      initialCapital,
      monthlyPayment,
      monthlyRate,
      estimatedMonthlyCosts,
      termMonths
    );

    return {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      input: draft,
      results: {
        currency: draft.vehicle.currency,
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        includedCostsDescription:
          'Esta cuota incluye seguro de desgravamen y gastos administrativos fijos bajo un esquema referencial de amortización francesa.',

        initialCapital: Number(initialCapital.toFixed(2)),
        termMonths,
        effectiveRatePercentage: draft.interest.rateValuePercentage,

        tceaPercentage: Number(tceaPercentage.toFixed(2)),
        van: Number(van.toFixed(2)),
        tirPercentage: Number(tirPercentage.toFixed(2)),
        viability: van >= 0 ? 'VIABLE' : 'NOT_VIABLE',

        interestAmortizationChart: [
          { period: 1, interestPercentage: 100, capitalPercentage: 15 },
          { period: 6, interestPercentage: 88, capitalPercentage: 28 },
          { period: 12, interestPercentage: 72, capitalPercentage: 42 },
          { period: 24, interestPercentage: 50, capitalPercentage: 65 },
          { period: 36, interestPercentage: 32, capitalPercentage: 82 },
          { period: termMonths, interestPercentage: 15, capitalPercentage: 100 }
        ],

        balanceEvolution: [
          { period: 1, balance: Number(initialCapital.toFixed(2)) },
          { period: Math.round(termMonths * 0.25), balance: Number((initialCapital * 0.76).toFixed(2)) },
          { period: Math.round(termMonths * 0.5), balance: Number((initialCapital * 0.49).toFixed(2)) },
          { period: Math.round(termMonths * 0.75), balance: Number((initialCapital * 0.22).toFixed(2)) },
          { period: termMonths, balance: 0 }
        ],

        schedule
      }
    };
  }

  private buildSchedule(
    initialCapital: number,
    monthlyPayment: number,
    monthlyRate: number,
    monthlyCosts: number,
    termMonths: number
  ) {
    let currentBalance = initialCapital;

    return Array.from({ length: termMonths }, (_, index) => {
      const period = index + 1;

      const interest = currentBalance * monthlyRate;
      const insurance = monthlyCosts * 0.6;
      const administrativeExpenses = monthlyCosts * 0.4;
      const amortization = Math.max(monthlyPayment - interest - monthlyCosts, 0);
      const finalBalance = Math.max(currentBalance - amortization, 0);

      const row = {
        period,
        initialBalance: Number(currentBalance.toFixed(2)),
        amortization: Number(amortization.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        insurance: Number(insurance.toFixed(2)),
        administrativeExpenses: Number(administrativeExpenses.toFixed(2)),
        costs: Number(monthlyCosts.toFixed(2)),
        totalPayment: Number(monthlyPayment.toFixed(2)),
        finalBalance: Number(finalBalance.toFixed(2)),
        status: this.getPaymentStatus(period)
      };

      currentBalance = finalBalance;

      return row;
    });
  }

  private getPaymentStatus(period: number) {
    if (period <= 2) {
      return 'COMPLETED' as const;
    }

    if (period === 3) {
      return 'NEXT' as const;
    }

    return 'PENDING' as const;
  }
}
