import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { SimulationService } from '../../../../core/services/simulation.service';

import { User } from '../../../../core/models/user.model';
import { DashboardData } from '../../../../core/models/dashboard.model';
import { SimulationHistoryItem } from '../../../../core/models/simulation.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly simulationService = inject(SimulationService);

  user?: User;
  dashboard?: DashboardData;

  recentSimulations: SimulationHistoryItem[] = [];

  isLoading = true;
  errorMessage = '';

  get userFirstName(): string {
    return this.user?.firstName || this.user?.fullName?.split(' ')[0] || 'Usuario';
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      user: this.authService.getCurrentUser$(),
      dashboard: this.dashboardService.getDashboardData(),
      simulationHistory: this.simulationService.getSimulationHistory()
    }).subscribe({
      next: ({ user, dashboard, simulationHistory }) => {
        this.user = user;
        this.dashboard = dashboard;

        this.recentSimulations = simulationHistory.slice(0, 3);

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la información del dashboard.';
        this.isLoading = false;
      }
    });
  }
}
