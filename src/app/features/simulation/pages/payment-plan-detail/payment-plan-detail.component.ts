import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  PaymentScheduleRow,
  PaymentStatus,
  SimulationCalculationResponse
} from '../../../../core/models/simulation.model';
import { SimulationService } from '../../../../core/services/simulation.service';
import { downloadBlobResponse } from '../../../../core/utils/download-blob';
import { AuthService } from '../../../../core/services/auth.service';

type PaymentStatusFilter = 'ALL' | PaymentStatus;

@Component({
  selector: 'app-payment-plan-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './payment-plan-detail.component.html',
  styleUrl: './payment-plan-detail.component.css'
})
export class PaymentPlanDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly simulationService = inject(SimulationService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  calculation?: SimulationCalculationResponse | null;

  isLoading = true;
  errorMessage = '';

  filteredRows: PaymentScheduleRow[] = [];
  currentPage = 1;
  pageSize = 5;
  isDownloadingPdf = false;
  isDownloadingXlsx = false;

  filterForm = this.fb.nonNullable.group({
    fromMonth: [1],
    toMonth: [999],
    status: ['ALL' as PaymentStatusFilter]
  });

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

        if (!result) {
          this.errorMessage = 'No se encontró el plan de pagos.';
          this.isLoading = false;
          return;
        }

        this.filterForm.controls.toMonth.setValue(result.results.termMonths);
        this.filteredRows = result.results.schedule;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el plan de pagos.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    if (!this.calculation) {
      return;
    }

    const formValue = this.filterForm.getRawValue();

    const maxMonth = this.calculation.results.termMonths;
    const fromMonth = this.normalizeMonth(formValue.fromMonth, 1, maxMonth);
    const toMonth = this.normalizeMonth(formValue.toMonth, fromMonth, maxMonth);
    const status = formValue.status;

    this.filterForm.patchValue({
      fromMonth,
      toMonth
    });

    this.filteredRows = this.calculation.results.schedule.filter(row => {
      const isInsideMonthRange = row.period >= fromMonth && row.period <= toMonth;
      const matchesStatus = status === 'ALL' || row.status === status;

      return isInsideMonthRange && matchesStatus;
    });

    this.currentPage = 1;
  }

  clearFilters(): void {
    if (!this.calculation) {
      return;
    }

    this.filterForm.setValue({
      fromMonth: 1,
      toMonth: this.calculation.results.termMonths,
      status: 'ALL'
    });

    this.filteredRows = this.calculation.results.schedule;
    this.currentPage = 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  get paginatedRows(): PaymentScheduleRow[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRows.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.filteredRows.length / this.pageSize), 1);
  }

  get showingFrom(): number {
    if (!this.filteredRows.length) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
  }

  get currencyCode(): string {
    return this.calculation?.results.currency === 'PEN' ? 'PEN' : 'USD';
  }

  get statusLabelMap(): Record<PaymentStatus, string> {
    return {
      COMPLETED: 'Completado',
      NEXT: 'Próximo',
      PENDING: 'Pendiente'
    };
  }

  getStatusClass(status: PaymentStatus): string {
    return {
      COMPLETED: 'status-completed',
      NEXT: 'status-next',
      PENDING: 'status-pending'
    }[status];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }

  downloadSchedulePdf(): void {
    if (!this.calculation || this.isDownloadingPdf) {
      return;
    }

    this.isDownloadingPdf = true;

    this.simulationService.downloadSchedulePdf(this.calculation.id).subscribe({
      next: response => {
        downloadBlobResponse(response, `simulation-${this.calculation?.id}-schedule.pdf`);
        this.isDownloadingPdf = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo exportar el cronograma en PDF.';
        this.isDownloadingPdf = false;
      }
    });
  }

  downloadScheduleXlsx(): void {
    if (!this.calculation || this.isDownloadingXlsx) {
      return;
    }

    this.isDownloadingXlsx = true;

    this.simulationService.downloadScheduleXlsx(this.calculation.id).subscribe({
      next: response => {
        downloadBlobResponse(response, `simulation-${this.calculation?.id}-schedule.xlsx`);
        this.isDownloadingXlsx = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo exportar el cronograma en Excel.';
        this.isDownloadingXlsx = false;
      }
    });
  }

  private normalizeMonth(value: number, fallback: number, maxMonth: number): number {
    const month = Number(value);

    if (!month || month < 1) {
      return fallback;
    }

    if (month > maxMonth) {
      return maxMonth;
    }

    return month;
  }
}
