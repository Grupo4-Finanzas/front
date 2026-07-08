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

interface PaymentCompositionBar {
  period: number;
  label: string;
  interest: number;
  amortization: number;
  costs: number;
  balloon: number;
  total: number;
  interestHeight: number;
  amortizationHeight: number;
  costsHeight: number;
  balloonHeight: number;
  isFinal: boolean;
}

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
    return this.calculation?.results.viability === 'VIABLE' ? 'Favorable' : 'No favorable';
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

  get keyPaymentComposition(): PaymentCompositionBar[] {
    const schedule = this.calculation?.results.schedule ?? [];
    const termMonths = this.calculation?.results.termMonths ?? schedule.length;
    const balloonAmount = this.calculation?.results.balloonPaymentAmount ?? 0;

    if (!schedule.length) {
      return [];
    }

    const keyPeriods = Array.from(new Set([1, 12, 24, termMonths]))
      .filter(period => period > 0 && period <= termMonths);

    const rows = keyPeriods
      .map(period => schedule.find(row => row.period === period))
      .filter((row): row is PaymentScheduleRow => !!row);

    const rawBars = rows.map(row => {
      const isFinal = row.period === termMonths;
      const balloon = isFinal ? Math.max(balloonAmount, 0) : 0;
      const amortization = Math.max(
        isFinal && row.amortization > balloon
          ? row.amortization - balloon
          : row.amortization,
        0
      );
      const costs = Math.max(row.costs, 0);
      const interest = Math.max(row.interest, 0);
      const total = interest + amortization + costs + balloon;

      return {
        period: row.period,
        label: row.period === 1
          ? 'Inicio'
          : isFinal
            ? 'Mes final'
            : `Mes ${row.period}`,
        interest,
        amortization,
        costs,
        balloon,
        total,
        isFinal
      };
    });

    return rawBars.map(bar => ({
      ...bar,
      ...this.buildReadableSegmentHeights({
        interest: bar.interest,
        amortization: bar.amortization,
        costs: bar.costs,
        balloon: bar.balloon
      })
    }));
  }

  private buildReadableSegmentHeights(segments: {
    interest: number;
    amortization: number;
    costs: number;
    balloon: number;
  }): Pick<
    PaymentCompositionBar,
    'interestHeight' | 'amortizationHeight' | 'costsHeight' | 'balloonHeight'
  > {
    const entries = Object.entries(segments)
      .map(([key, value]) => ({
        key: key as keyof typeof segments,
        value: Math.max(value, 0)
      }))
      .filter(entry => entry.value > 0);

    if (!entries.length) {
      return {
        interestHeight: 0,
        amortizationHeight: 0,
        costsHeight: 0,
        balloonHeight: 0
      };
    }

    const visualWeights = entries.map(entry => ({
      ...entry,
      weight: Math.sqrt(entry.value)
    }));
    const weightTotal = visualWeights.reduce((sum, entry) => sum + entry.weight, 0);
    const minimumVisibleHeight = 9;
    const fixedHeight = visualWeights.length * minimumVisibleHeight;
    const flexibleHeight = Math.max(100 - fixedHeight, 0);

    const heights = {
      interestHeight: 0,
      amortizationHeight: 0,
      costsHeight: 0,
      balloonHeight: 0
    };

    for (const entry of visualWeights) {
      const height = minimumVisibleHeight + (entry.weight / weightTotal) * flexibleHeight;
      heights[`${entry.key}Height` as keyof typeof heights] = height;
    }

    return heights;
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
