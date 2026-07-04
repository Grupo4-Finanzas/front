import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  SimulationHistoryItem,
  SimulationHistoryStatus
} from '../../../../core/models/simulation.model';
import { SimulationService } from '../../../../core/services/simulation.service';

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
  private readonly fb = inject(FormBuilder);

  allItems: SimulationHistoryItem[] = [];
  filteredItems: SimulationHistoryItem[] = [];

  currentPage = 1;
  pageSize = 6;

  filterForm = this.fb.nonNullable.group({
    search: [''],
    dateRange: ['ALL_TIME' as DateRangeFilter],
    status: ['ALL' as StatusFilter]
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.simulationService.getSimulationHistory().subscribe({
      next: history => {
        this.allItems = history;
        this.filteredItems = history;
        this.currentPage = 1;
      }
    });
  }

  applyFilters(): void {
    const { search, dateRange, status } = this.filterForm.getRawValue();
    const normalizedSearch = search.trim().toLowerCase();

    this.filteredItems = this.allItems.filter(item => {
      const matchesSearch =
        !normalizedSearch ||
        String(item.id).includes(normalizedSearch) ||
        String(item.vehiclePrice).includes(normalizedSearch) ||
        String(item.tceaPercentage).includes(normalizedSearch) ||
        String(item.monthlyPayment).includes(normalizedSearch);

      const matchesDate = this.matchesDateRange(item.createdAt, dateRange);
      const matchesStatus = status === 'ALL' || item.status === status;

      return matchesSearch && matchesDate && matchesStatus;
    });

    this.currentPage = 1;
  }

  clearFilters(): void {
    this.filterForm.setValue({
      search: '',
      dateRange: 'ALL_TIME',
      status: 'ALL'
    });

    this.filteredItems = this.allItems;
    this.currentPage = 1;
  }

  deleteSimulation(id: number): void {
    const shouldDelete = confirm('¿Eliminar esta simulación del historial?');

    if (!shouldDelete) {
      return;
    }

    this.simulationService.deleteCalculationResult(id).subscribe({
      next: () => {
        this.loadHistory();
      }
    });
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

  get paginatedItems(): SimulationHistoryItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.filteredItems.length / this.pageSize), 1);
  }

  get showingFrom(): number {
    if (!this.filteredItems.length) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredItems.length);
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

  private matchesDateRange(createdAtRaw: string, dateRange: DateRangeFilter): boolean {
    if (dateRange === 'ALL_TIME') {
      return true;
    }

    const createdAt = new Date(createdAtRaw);
    const now = new Date();

    if (dateRange === 'THIS_YEAR') {
      return createdAt.getFullYear() === now.getFullYear();
    }

    const days =
      dateRange === 'LAST_30_DAYS'
        ? 30
        : 90;

    const limit = new Date();
    limit.setDate(now.getDate() - days);

    return createdAt >= limit;
  }
}
