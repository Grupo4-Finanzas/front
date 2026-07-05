import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SimulationCalculationResponse,
  SimulationDraft,
  SimulationHistoryItem
} from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly baseUrl = `${environment.apiUrl}/simulations`;

  constructor(private readonly http: HttpClient) {}

  calculateSimulation(draft: SimulationDraft): Observable<SimulationCalculationResponse> {
    return this.http.post<SimulationCalculationResponse>(`${this.baseUrl}/calculate`, draft);
  }

  getCalculationResultById(id: number): Observable<SimulationCalculationResponse> {
    return this.http.get<SimulationCalculationResponse>(`${this.baseUrl}/${id}`);
  }

  getSimulationHistory(): Observable<SimulationHistoryItem[]> {
    return this.http.get<SimulationHistoryItem[]>(`${this.baseUrl}/history`);
  }

  deleteCalculationResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
