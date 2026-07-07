import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/pages/auth/auth.component';
import { DashboardComponent } from './features/dashboard/pages/dashboard/dashboard.component';
import { SimulationComponent } from './features/simulation/pages/simulation/simulation.component';
import { SimulationResultsComponent } from './features/simulation/pages/simulation-results/simulation-results.component';
import { PaymentPlanDetailComponent } from './features/simulation/pages/payment-plan-detail/payment-plan-detail.component';
import { SimulationHistoryComponent } from './features/history/pages/simulation-history/simulation-history.component';
import { HelpCenterComponent } from './features/help/pages/help-center/help-center.component';
import { ProfileComponent } from './features/profile/pages/profile/profile.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'forgot-password', component: AuthComponent, data: { mode: 'forgot' } },
  { path: 'reset-password', component: AuthComponent, data: { mode: 'reset' } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'simulation', component: SimulationComponent, canActivate: [authGuard] },
  { path: 'simulation-results/:id', component: SimulationResultsComponent, canActivate: [authGuard] },
  { path: 'simulation-results/:id/payment-plan', component: PaymentPlanDetailComponent, canActivate: [authGuard] },
  { path: 'history', component: SimulationHistoryComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'help', component: HelpCenterComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'auth' }
];
