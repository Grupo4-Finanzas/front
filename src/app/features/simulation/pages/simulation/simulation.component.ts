import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  CurrencyCode,
  GraceType,
  SimulationDraft
} from '../../../../core/models/simulation.model';
import { SimulationService } from '../../../../core/services/simulation.service';

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
  private readonly router = inject(Router);

  successMessage = '';
  errorMessage = '';
  isSubmitting = false;

  simulationForm = this.fb.nonNullable.group({
    documentNumber: ['', [Validators.required]],
    fullName: ['', [Validators.required]],

    currency: ['PEN' as CurrencyCode, [Validators.required]],
    vehiclePrice: [0, [Validators.required, Validators.min(1)]],

    initialFeePercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    balloonFeePercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    termMonths: [0, [Validators.required, Validators.min(1)]],

    rateType: ['TEA', [Validators.required]],
    rateValuePercentage: [0, [Validators.required, Validators.min(0)]],
    paymentFrequency: ['MONTHLY', [Validators.required]],

    graceType: ['NONE' as GraceType, [Validators.required]],
    graceMonths: [0, [Validators.required, Validators.min(0)]],

    targetTirPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],

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
      initialFeePercentage: 0,
      balloonFeePercentage: 0,
      termMonths: 0,
      rateType: 'TEA',
      rateValuePercentage: 0,
      paymentFrequency: 'MONTHLY',
      graceType: 'NONE',
      graceMonths: 0,
      targetTirPercentage: 0,
      lifeInsuranceMonthlyRatePercentage: 0,
      administrativeExpenses: 0,
      vehicleInsuranceAnnualRatePercentage: 0
    });
  }

  setCurrency(currency: CurrencyCode): void {
    this.simulationForm.controls.currency.setValue(currency);
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
      this.errorMessage = 'Completa los campos obligatorios antes de calcular la simulación.';
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
        rateType: formValue.rateType as 'TEA' | 'TEM',
        rateValuePercentage: Number(formValue.rateValuePercentage),
        paymentFrequency: formValue.paymentFrequency as 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY'
      },
      gracePeriod: {
        type: formValue.graceType,
        months: Number(formValue.graceMonths)
      },
      financialAnalysis: {
        targetTirPercentage: Number(formValue.targetTirPercentage)
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
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'No se pudo calcular la simulación.';
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

  get currencySymbol(): string {
    return this.selectedCurrency === 'PEN' ? 'S/' : '$';
  }
}
