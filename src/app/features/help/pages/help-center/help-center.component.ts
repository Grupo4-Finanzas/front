import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.css'
})
export class HelpCenterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  user?: User;
  successMessage = '';
  searchTerm = '';
  passwordVisible = false;

  profileForm = this.fb.nonNullable.group({
    fullName: [''],
    password: [''],
    preferredCurrency: ['PEN']
  });

  faqs: FaqItem[] = [
    {
      id: 1,
      question: '¿Qué es la TCEA y cómo se calcula?',
      answer: 'La Tasa de Costo Efectiva Anual representa el costo total del crédito. Incluye la tasa de interés, comisiones, seguros y gastos adicionales asociados al préstamo.',
      isOpen: true
    },
    {
      id: 2,
      question: '¿En qué consiste la cuota Balloon?',
      answer: 'La cuota Balloon es un pago final mayor al resto de cuotas, usado para reducir los pagos mensuales durante el plazo del crédito.',
      isOpen: false
    },
    {
      id: 3,
      question: '¿Qué documentos necesito para calificar?',
      answer: 'Usualmente se requiere documento de identidad, sustento de ingresos y evaluación crediticia. En esta versión el flujo es solo de simulación.',
      isOpen: false
    },
    {
      id: 4,
      question: '¿Puedo realizar pagos anticipados?',
      answer: 'Sí, el simulador puede prepararse para escenarios de pago anticipado, pero el cálculo final dependerá de las reglas que implemente el backend.',
      isOpen: false
    }
  ];

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe({
      next: user => {
        this.user = user;

        this.profileForm.patchValue({
          fullName: user.fullName,
          password: '',
          preferredCurrency: 'PEN'
        });
      }
    });
  }

  submitProfile(): void {
    const { fullName, preferredCurrency } = this.profileForm.getRawValue();

    this.successMessage = 'Preferencias guardadas localmente.';
    this.profileForm.patchValue({ password: '' });
  }

  get filteredFaqs(): FaqItem[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return this.faqs;
    }

    return this.faqs.filter(faq =>
      faq.question.toLowerCase().includes(normalizedSearch) ||
      faq.answer.toLowerCase().includes(normalizedSearch)
    );
  }

  toggleFaq(id: number): void {
    this.faqs = this.faqs.map(faq => ({
      ...faq,
      isOpen: faq.id === id ? !faq.isOpen : faq.isOpen
    }));
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
