import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  SimulationHistoryItem,
  SimulationHistoryStatus
} from '../../../../core/models/simulation.model';
import { SimulationService } from '../../../../core/services/simulation.service';
import { AuthService } from '../../../../core/services/auth.service';

type DateRangeFilter = 'LAST_30_DAYS' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL_TIME';
type StatusFilter = 'ALL' | SimulationHistoryStatus;

@Component({
  selector: 'app-simulation-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './simulation-history.component.html',
  styleUrl: './simulation-history.component.css'
})
export class SimulationHistoryComponent implements OnInit {
  private readonly simulationService = inject(SimulationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  allItems: SimulationHistoryItem[] = [];
  filteredItems: SimulationHistoryItem[] = [];

  currentPage = 1;
  pageSize = 6;
  totalElements = 0;
  backendTotalPages = 1;

  filterForm = this.fb.nonNullable.group({
    search: [''],
    dateRange: ['ALL_TIME' as DateRangeFilter],
    status: ['ALL' as StatusFilter]
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(pageIndex = this.currentPage - 1): void {
    const { dateRange } = this.filterForm.getRawValue();
    const { createdFrom, createdTo } = this.getDateRangeParams(dateRange);

    this.simulationService
      .getSimulationHistoryPage(pageIndex, this.pageSize, createdFrom, createdTo)
      .subscribe({
        next: response => {
          this.allItems = response.content;
          this.currentPage = response.page + 1;
          this.totalElements = response.totalElements;
          this.backendTotalPages = Math.max(response.totalPages, 1);
          this.applyLocalFilters();
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadHistory(0);
  }

  clearFilters(): void {
    this.filterForm.setValue({
      search: '',
      dateRange: 'ALL_TIME',
      status: 'ALL'
    });

    this.currentPage = 1;
    this.loadHistory(0);
  }

  deleteSimulation(id: number): void {
    const shouldDelete = confirm('Eliminar esta simulacion del historial?');

    if (!shouldDelete) {
      return;
    }

    this.simulationService.deleteCalculationResult(id).subscribe({
      next: () => {
        this.loadHistory(Math.max(this.currentPage - 1, 0));
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadHistory(this.currentPage);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.loadHistory(this.currentPage - 2);
    }
  }

  get paginatedItems(): SimulationHistoryItem[] {
    return this.filteredItems;
  }

  get totalPages(): number {
    return this.backendTotalPages;
  }

  get showingFrom(): number {
    if (!this.totalElements || !this.filteredItems.length) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    if (!this.filteredItems.length) {
      return 0;
    }

    return this.showingFrom + this.filteredItems.length - 1;
  }

  get monthlyCount(): number {
    const now = new Date();

    return this.allItems.filter(item => {
      const createdAt = new Date(item.createdAt);

      return createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear();
    }).length;
  }

  get averageTcea(): number {
    if (!this.allItems.length) {
      return 0;
    }

    const total = this.allItems.reduce((sum, item) => sum + item.tceaPercentage, 0);
    return total / this.allItems.length;
  }

  get latestSimulation(): SimulationHistoryItem | null {
    return this.allItems[0] ?? null;
  }

  getStatusLabel(status: SimulationHistoryStatus): string {
    return {
      CALCULATED: 'Calculado',
      SAVED: 'Guardado',
      EXPIRED: 'Expirado'
    }[status];
  }

  getStatusClass(status: SimulationHistoryStatus): string {
    return {
      CALCULATED: 'status-calculated',
      SAVED: 'status-saved',
      EXPIRED: 'status-expired'
    }[status];
  }

  private applyLocalFilters(): void {
    const { search, status } = this.filterForm.getRawValue();
    const normalizedSearch = search.trim().toLowerCase();

    this.filteredItems = this.allItems.filter(item => {
      const matchesSearch =
        !normalizedSearch ||
        String(item.id).includes(normalizedSearch) ||
        String(item.vehiclePrice).includes(normalizedSearch) ||
        String(item.tceaPercentage).includes(normalizedSearch) ||
        String(item.monthlyPayment).includes(normalizedSearch);

      const matchesStatus = status === 'ALL' || item.status === status;

      return matchesSearch && matchesStatus;
    });
  }

  private getDateRangeParams(dateRange: DateRangeFilter): {
    createdFrom?: string;
    createdTo?: string;
  } {
    if (dateRange === 'ALL_TIME') {
      return {};
    }

    const now = new Date();
    const createdTo = this.formatDateParam(now);

    if (dateRange === 'THIS_YEAR') {
      return {
        createdFrom: `${now.getFullYear()}-01-01`,
        createdTo
      };
    }

    const createdFrom = new Date(now);
    createdFrom.setDate(now.getDate() - (dateRange === 'LAST_30_DAYS' ? 30 : 90));

    return {
      createdFrom: this.formatDateParam(createdFrom),
      createdTo
    };
  }

  private formatDateParam(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
