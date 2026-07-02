import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

import { SimulationDraft, SimulationRequest } from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly simulationsUrl = 'assets/data/simulations.json';
  private readonly storageKey = 'crediauto_simulations';

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
      this.storageKey,
      JSON.stringify([...currentSimulations, newSimulation])
    );

    return of(newSimulation);
  }

  getLatestSimulation(): SimulationRequest | null {
    const simulations = this.getLocalSimulations();

    if (!simulations.length) {
      return null;
    }

    return simulations[simulations.length - 1];
  }

  private getLocalSimulations(): SimulationRequest[] {
    const rawSimulations = localStorage.getItem(this.storageKey);

    if (!rawSimulations) {
      return [];
    }

    try {
      return JSON.parse(rawSimulations) as SimulationRequest[];
    } catch {
      return [];
    }
  }
}
