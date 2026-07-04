import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/pages/auth/auth.component';
import { DashboardComponent } from './features/dashboard/pages/dashboard/dashboard.component';
import { SimulationComponent } from './features/simulation/pages/simulation/simulation.component';
import { SimulationResultsComponent } from './features/simulation/pages/simulation-results/simulation-results.component';
import { PaymentPlanDetailComponent } from './features/simulation/pages/payment-plan-detail/payment-plan-detail.component';
import { SimulationHistoryComponent } from './features/history/pages/simulation-history/simulation-history.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'simulation', component: SimulationComponent },
  { path: 'simulation-results/:id', component: SimulationResultsComponent },
  { path: 'simulation-results/:id/payment-plan', component: PaymentPlanDetailComponent },
  { path: 'history', component: SimulationHistoryComponent },
  { path: '**', redirectTo: 'auth' }
];
