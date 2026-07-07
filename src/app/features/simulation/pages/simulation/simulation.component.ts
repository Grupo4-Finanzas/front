import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  CapitalizationFrequency,
  CurrencyCode,
  GraceType,
  SimulationDraft
} from '../../../../core/models/simulation.model';
import { SimulationService } from '../../../../core/services/simulation.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.css'
})
export class SimulationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly simulationService = inject(SimulationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  successMessage = '';
  errorMessage = '';
  isSubmitting = false;

  simulationForm = this.fb.nonNullable.group({
    documentNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],

    currency: ['PEN' as CurrencyCode, [Validators.required]],
    vehiclePrice: [0, [Validators.required, Validators.min(1)]],

    initialFeePercentage: [20, [Validators.required, Validators.min(10), Validators.max(30)]],
    balloonFeePercentage: [35, [Validators.required, Validators.min(35), Validators.max(50)]],
    termMonths: [48, [Validators.required]],

    rateType: ['TEA', [Validators.required]],
    rateValuePercentage: [12.5, [Validators.required, Validators.min(0.0000001)]],
    paymentFrequency: ['MONTHLY', [Validators.required]],
    capitalizationFrequency: ['MONTHLY'],

    graceType: ['NONE' as GraceType, [Validators.required]],
    graceMonths: [0, [Validators.required, Validators.min(0), Validators.max(6)]],

    cokAnnualPercentage: [15, [Validators.required, Validators.min(0)]],

    lifeInsuranceMonthlyRatePercentage: [0, [Validators.required, Validators.min(0)]],
    administrativeExpenses: [0, [Validators.required, Validators.min(0)]],
    vehicleInsuranceAnnualRatePercentage: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.simulationForm.reset({
      documentNumber: '',
      fullName: '',
      currency: 'PEN',
      vehiclePrice: 0,
      initialFeePercentage: 20,
      balloonFeePercentage: 35,
      termMonths: 48,
      rateType: 'TEA',
      rateValuePercentage: 12.5,
      paymentFrequency: 'MONTHLY',
      capitalizationFrequency: 'MONTHLY',
      graceType: 'NONE',
      graceMonths: 0,
      cokAnnualPercentage: 15,
      lifeInsuranceMonthlyRatePercentage: 0,
      administrativeExpenses: 0,
      vehicleInsuranceAnnualRatePercentage: 0
    });
  }

  setCurrency(currency: CurrencyCode): void {
    this.simulationForm.controls.currency.setValue(currency);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }

  setGraceType(graceType: GraceType): void {
    this.simulationForm.controls.graceType.setValue(graceType);

    if (graceType === 'NONE') {
      this.simulationForm.controls.graceMonths.setValue(0);
    }
  }

  submitSimulation(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.simulationForm.invalid) {
      this.simulationForm.markAllAsTouched();
      this.errorMessage = 'Completa los campos obligatorios antes de calcular la simulacion.';
      return;
    }

    const formValue = this.simulationForm.getRawValue();

    const draft: SimulationDraft = {
      client: {
        documentNumber: formValue.documentNumber,
        fullName: formValue.fullName
      },
      vehicle: {
        currency: formValue.currency,
        vehiclePrice: Number(formValue.vehiclePrice)
      },
      credit: {
        initialFeePercentage: Number(formValue.initialFeePercentage),
        balloonFeePercentage: Number(formValue.balloonFeePercentage),
        termMonths: Number(formValue.termMonths)
      },
      interest: {
        rateType: formValue.rateType as 'TEA' | 'TNA',
        rateValuePercentage: Number(formValue.rateValuePercentage),
        paymentFrequency: 'MONTHLY',
        capitalizationFrequency:
          formValue.rateType === 'TNA'
            ? (formValue.capitalizationFrequency as CapitalizationFrequency)
            : null
      },
      gracePeriod: {
        type: formValue.graceType,
        months: formValue.graceType === 'NONE' ? 0 : Number(formValue.graceMonths)
      },
      financialAnalysis: {
        cokAnnualPercentage: Number(formValue.cokAnnualPercentage)
      },
      costs: {
        lifeInsuranceMonthlyRatePercentage: Number(formValue.lifeInsuranceMonthlyRatePercentage),
        administrativeExpenses: Number(formValue.administrativeExpenses),
        vehicleInsuranceAnnualRatePercentage: Number(formValue.vehicleInsuranceAnnualRatePercentage)
      }
    };

    this.isSubmitting = true;

    this.simulationService.calculateSimulation(draft).subscribe({
      next: response => {
        this.isSubmitting = false;
        this.router.navigateByUrl(`/simulation-results/${response.id}`);
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'No se pudo calcular la simulacion.';
      }
    });
  }

  hasError(controlName: keyof typeof this.simulationForm.controls): boolean {
    const control = this.simulationForm.controls[controlName];
    return control.invalid && control.touched;
  }

  get selectedCurrency(): CurrencyCode {
    return this.simulationForm.controls.currency.value;
  }

  get selectedGraceType(): GraceType {
    return this.simulationForm.controls.graceType.value;
  }

  get selectedRateType(): string {
    return this.simulationForm.controls.rateType.value;
  }

  get currencySymbol(): string {
    return this.selectedCurrency === 'PEN' ? 'S/' : '$';
  }
}
