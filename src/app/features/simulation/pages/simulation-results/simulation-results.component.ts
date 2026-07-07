import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { SimulationService } from '../../../../core/services/simulation.service';
import { SimulationCalculationResponse } from '../../../../core/models/simulation.model';
import { PaymentScheduleRow } from '../../../../core/models/simulation.model';
import { downloadBlobResponse } from '../../../../core/utils/download-blob';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-simulation-results',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe],
  templateUrl: './simulation-results.component.html',
  styleUrl: './simulation-results.component.css'
})
export class SimulationResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly simulationService = inject(SimulationService);
  private readonly authService = inject(AuthService);

  calculation?: SimulationCalculationResponse | null;

  isLoading = true;
  errorMessage = '';
  isDownloadingPdf = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'No se encontró el identificador de la simulación.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      result: this.simulationService.getCalculationResultById(id),
      schedule: this.simulationService.getPaymentSchedule(id).pipe(
        catchError(() => of(null))
      )
    }).pipe(
      map(({ result, schedule }) => ({
        ...result,
        results: {
          ...result.results,
          schedule: schedule ?? result.results.schedule
        }
      }))
    ).subscribe({
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

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }

  downloadPdf(): void {
    if (!this.calculation || this.isDownloadingPdf) {
      return;
    }

    this.isDownloadingPdf = true;

    this.simulationService.downloadSimulationPdf(this.calculation.id).subscribe({
      next: response => {
        downloadBlobResponse(response, `simulation-${this.calculation?.id}-report.pdf`);
        this.isDownloadingPdf = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo descargar el PDF de la simulacion.';
        this.isDownloadingPdf = false;
      }
    });
  }
}
