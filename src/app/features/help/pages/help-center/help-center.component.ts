import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.css'
})
export class HelpCenterComponent {
  searchTerm = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  faqs: FaqItem[] = [
    {
      id: 1,
      question: 'Que es la TCEA y como se calcula?',
      answer: 'La Tasa de Costo Efectiva Anual representa el costo total del credito. Incluye la tasa de interes, comisiones, seguros y gastos adicionales asociados al prestamo.',
      isOpen: true
    },
    {
      id: 2,
      question: 'En que consiste la cuota Balloon?',
      answer: 'La cuota Balloon es un pago final mayor al resto de cuotas, usado para reducir los pagos mensuales durante el plazo del credito.',
      isOpen: false
    },
    {
      id: 3,
      question: 'Que documentos necesito para calificar?',
      answer: 'Usualmente se requiere documento de identidad, sustento de ingresos y evaluacion crediticia. En esta version el flujo es solo de simulacion.',
      isOpen: false
    },
    {
      id: 4,
      question: 'Puedo realizar pagos anticipados?',
      answer: 'Si, el simulador puede prepararse para escenarios de pago anticipado, pero el calculo final dependera de las reglas que implemente el backend.',
      isOpen: false
    }
  ];

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

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }
}
