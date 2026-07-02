import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
export class SimulationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly simulationService = inject(SimulationService);

  successMessage = '';
  errorMessage = '';

  simulationForm = this.fb.nonNullable.group({
    documentNumber: ['', [Validators.required]],
    fullName: ['', [Validators.required]],

    currency: ['PEN' as CurrencyCode, [Validators.required]],
    vehiclePrice: [0, [Validators.required, Validators.min(1)]],

    initialFeePercentage: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
    balloonFeePercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    termMonths: [48, [Validators.required, Validators.min(1)]],

    rateType: ['TEA', [Validators.required]],
    rateValuePercentage: [12.5, [Validators.required, Validators.min(0)]],
    paymentFrequency: ['MONTHLY', [Validators.required]],

    graceType: ['NONE' as GraceType, [Validators.required]],
    graceMonths: [0, [Validators.required, Validators.min(0)]],

    targetTirPercentage: [15, [Validators.required, Validators.min(0), Validators.max(100)]],

    lifeInsuranceMonthlyRatePercentage: [0.05, [Validators.required, Validators.min(0)]],
    administrativeExpenses: [10, [Validators.required, Validators.min(0)]],
    vehicleInsuranceAnnualRatePercentage: [3.5, [Validators.required, Validators.min(0)]]
  });

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
      this.errorMessage = 'Completa los campos obligatorios antes de guardar la simulación.';
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

    this.simulationService.saveSimulation(draft).subscribe({
      next: savedSimulation => {
        this.successMessage = `Simulación guardada correctamente. ID: ${savedSimulation.id}`;
        this.simulationForm.markAsPristine();
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar la simulación.';
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
