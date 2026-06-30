import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { User } from '../../../../core/models/user.model';
import { DashboardData } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  user?: User;
  dashboard?: DashboardData;

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;

    this.authService.getCurrentUser$().subscribe({
      next: user => {
        this.user = user;

        this.dashboardService.getDashboardData().subscribe({
          next: dashboard => {
            this.dashboard = dashboard;
            this.isLoading = false;
          },
          error: () => {
            this.errorMessage = 'No se pudo cargar la información del dashboard.';
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el usuario.';
        this.isLoading = false;
      }
    });
  }
}
