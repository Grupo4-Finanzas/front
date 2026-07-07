import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  SimulationCalculationResponse,
  SimulationDraft,
  SimulationHistoryItem,
  PaymentScheduleRow,
  PageResponse
} from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly baseUrl = `${environment.apiUrl}/simulations`;

  constructor(private readonly http: HttpClient) {}

  calculateSimulation(draft: SimulationDraft): Observable<SimulationCalculationResponse> {
    return this.http
      .post<SimulationCalculationResponse>(`${this.baseUrl}/calculate`, draft)
      .pipe(map(response => this.normalizeCalculationResponse(response)));
  }

  getCalculationResultById(id: number): Observable<SimulationCalculationResponse> {
    return this.http
      .get<SimulationCalculationResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(response => this.normalizeCalculationResponse(response)));
  }

  getSimulationHistory(): Observable<SimulationHistoryItem[]> {
    return this.http.get<SimulationHistoryItem[]>(`${this.baseUrl}/history`);
  }

  getSimulationHistoryPage(
    page = 0,
    size = 10,
    createdFrom?: string,
    createdTo?: string
  ): Observable<PageResponse<SimulationHistoryItem>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (createdFrom) {
      params = params.set('createdFrom', createdFrom);
    }

    if (createdTo) {
      params = params.set('createdTo', createdTo);
    }

    return this.http.get<PageResponse<SimulationHistoryItem>>(
      `${this.baseUrl}/history/page`,
      { params }
    );
  }

  deleteCalculationResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPaymentSchedule(id: number): Observable<PaymentScheduleRow[]> {
    return this.http.get<PaymentScheduleRow[]>(`${this.baseUrl}/${id}/schedule`);
  }

  downloadSimulationPdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${id}/report/pdf`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  downloadSchedulePdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${id}/schedule/export/pdf`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  downloadScheduleXlsx(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${id}/schedule/export/xlsx`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  private normalizeCalculationResponse(
    response: SimulationCalculationResponse
  ): SimulationCalculationResponse {
    const schedule = response.results.schedule ?? [];

    return {
      ...response,
      results: {
        ...response.results,
        includedCostsDescription:
          response.results.includedCostsDescription ??
          'Incluye seguros, gastos administrativos y costos financieros de la simulacion.',
        interestAmortizationChart:
          response.results.interestAmortizationChart?.length
            ? response.results.interestAmortizationChart
            : this.buildInterestAmortizationChart(schedule),
        balanceEvolution:
          response.results.balanceEvolution?.length
            ? response.results.balanceEvolution
            : this.buildBalanceEvolution(schedule),
        schedule
      }
    };
  }

  private buildInterestAmortizationChart(
    schedule: PaymentScheduleRow[]
  ): SimulationCalculationResponse['results']['interestAmortizationChart'] {
    return schedule.slice(0, 12).map(row => {
      const base = row.interest + row.amortization;

      if (!base) {
        return {
          period: row.period,
          interestPercentage: 0,
          capitalPercentage: 0
        };
      }

      return {
        period: row.period,
        interestPercentage: (row.interest / base) * 100,
        capitalPercentage: (row.amortization / base) * 100
      };
    });
  }

  private buildBalanceEvolution(
    schedule: PaymentScheduleRow[]
  ): SimulationCalculationResponse['results']['balanceEvolution'] {
    const points = schedule.filter(row =>
      row.period === 1 ||
      row.period % 12 === 0 ||
      row.period === schedule.length
    );

    return points.map(row => ({
      period: row.period,
      balance: row.finalBalance
    }));
  }
}
