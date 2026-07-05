import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SimulationService } from '../../../../core/services/simulation.service';
import { SimulationCalculationResponse } from '../../../../core/models/simulation.model';
import { PaymentScheduleRow } from '../../../../core/models/simulation.model';

@Component({
  selector: 'app-simulation-results',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe],
  templateUrl: './simulation-results.component.html',
  styleUrl: './simulation-results.component.css'
})
export class SimulationResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly simulationService = inject(SimulationService);

  calculation?: SimulationCalculationResponse | null;

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'No se encontró el identificador de la simulación.';
      this.isLoading = false;
      return;
    }

    this.simulationService.getCalculationResultById(id).subscribe({
      next: result => {
        this.calculation = result;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se encontraron resultados para esta simulación.';
        this.isLoading = false;
      }
    });
  }

  get currencyCode(): string {
    return this.calculation?.results.currency === 'PEN' ? 'PEN' : 'USD';
  }

  get viabilityLabel(): string {
    return this.calculation?.results.viability === 'VIABLE' ? 'Viable' : 'No viable';
  }

  get summarySchedule(): PaymentScheduleRow[] {
    const schedule = this.calculation?.results.schedule ?? [];
    const termMonths = this.calculation?.results.termMonths;

    return schedule.filter(row =>
      row.period === 1 ||
      row.period === 12 ||
      row.period === 24 ||
      row.period === termMonths
    );
  }
}
