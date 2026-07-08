import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

interface FaqItem {
  id: number;
  category: FaqCategory;
  question: string;
  answer: string;
  isOpen: boolean;
}

type FaqCategory =
  | 'Uso del sistema'
  | 'Compra Inteligente'
  | 'Tasas e indicadores'
  | 'Periodos de gracia'
  | 'Limitaciones del simulador';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.css'
})
export class HelpCenterComponent {
  searchTerm = '';
  selectedCategory: FaqCategory = 'Uso del sistema';

  readonly categories: FaqCategory[] = [
    'Uso del sistema',
    'Compra Inteligente',
    'Tasas e indicadores',
    'Periodos de gracia',
    'Limitaciones del simulador'
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  faqs: FaqItem[] = [
    {
      id: 1,
      category: 'Uso del sistema',
      question: 'Como creo una nueva simulacion?',
      answer: 'Para crear una simulacion, ingresa al modulo Simulacion, completa los datos del vehiculo, configura la cuota inicial, cuota balon, plazo, tasa de interes, periodo de gracia, seguros y gastos, y luego presiona Calcular simulacion.',
      isOpen: true
    },
    {
      id: 2,
      category: 'Uso del sistema',
      question: 'Puedo guardar varias simulaciones?',
      answer: 'Si. Cada simulacion calculada se guarda en el historial del usuario, permitiendo comparar diferentes escenarios de credito vehicular.',
      isOpen: false
    },
    {
      id: 3,
      category: 'Uso del sistema',
      question: 'Donde puedo ver mi cronograma completo?',
      answer: 'Despues de calcular una simulacion, puedes ingresar al resumen de resultados y seleccionar Ver detalle completo para revisar la tabla de amortizacion mensual.',
      isOpen: false
    },
    {
      id: 4,
      category: 'Uso del sistema',
      question: 'Puedo descargar mi simulacion?',
      answer: 'Si. El sistema permite descargar el resumen de la simulacion en PDF y exportar el cronograma de pagos en PDF o Excel.',
      isOpen: false
    },
    {
      id: 5,
      category: 'Compra Inteligente',
      question: 'Que es la cuota balon?',
      answer: 'La cuota balon es un pago final extraordinario que se realiza al terminar el plazo del credito. En la modalidad Compra Inteligente, permite reducir los pagos mensuales ordinarios, ya que una parte del valor del vehiculo se difiere hasta el ultimo periodo.',
      isOpen: false
    },
    {
      id: 6,
      category: 'Compra Inteligente',
      question: 'Por que el ultimo pago es mucho mas alto?',
      answer: 'Porque en el ultimo periodo se paga la cuota mensual correspondiente y, ademas, la cuota balon pactada. Por eso el pago final es mayor que las cuotas ordinarias.',
      isOpen: false
    },
    {
      id: 7,
      category: 'Compra Inteligente',
      question: 'La cuota mensual incluye la cuota balon?',
      answer: 'No. El pago mensual estimado incluye la cuota ordinaria, seguros y gastos administrativos. La cuota balon se paga al final del credito y se muestra en el cronograma.',
      isOpen: false
    },
    {
      id: 8,
      category: 'Tasas e indicadores',
      question: 'Cual es la diferencia entre TEA y TNA?',
      answer: 'La TEA es una tasa efectiva anual que ya considera el efecto de la capitalizacion. La TNA es una tasa nominal anual y necesita una frecuencia de capitalizacion para convertirse en una tasa efectiva mensual.',
      isOpen: false
    },
    {
      id: 9,
      category: 'Tasas e indicadores',
      question: 'Que es la COK?',
      answer: 'La COK es la tasa de descuento que representa el rendimiento minimo esperado o costo de oportunidad del deudor. En el sistema se utiliza para calcular el VAN.',
      isOpen: false
    },
    {
      id: 10,
      category: 'Tasas e indicadores',
      question: 'Por que la TIR no se puede modificar?',
      answer: 'Porque la TIR no es un dato de entrada. Es un resultado calculado automaticamente a partir de los flujos de caja del credito.',
      isOpen: false
    },
    {
      id: 11,
      category: 'Tasas e indicadores',
      question: 'Por que la TCEA puede ser mayor que la TEA?',
      answer: 'Porque la TCEA incluye no solo los intereses, sino tambien otros costos del credito, como seguros, gastos administrativos y la estructura de pagos del financiamiento.',
      isOpen: false
    },
    {
      id: 12,
      category: 'Periodos de gracia',
      question: 'Que es la gracia parcial?',
      answer: 'Es un periodo inicial en el que el cliente paga intereses, seguros y gastos, pero no amortiza capital. Por ello, el saldo deudor se mantiene durante los meses de gracia parcial.',
      isOpen: false
    },
    {
      id: 13,
      category: 'Periodos de gracia',
      question: 'Que es la gracia total?',
      answer: 'Es un periodo inicial en el que el cliente no realiza ningun pago. Los intereses generados se capitalizan, aumentando el saldo deudor para los siguientes periodos.',
      isOpen: false
    },
    {
      id: 14,
      category: 'Periodos de gracia',
      question: 'La gracia total reduce el costo del credito?',
      answer: 'No necesariamente. Aunque permite no pagar al inicio, los intereses se capitalizan y pueden aumentar el costo total del credito.',
      isOpen: false
    },
    {
      id: 15,
      category: 'Limitaciones del simulador',
      question: 'Este sistema aprueba creditos reales?',
      answer: 'No. El sistema funciona como simulador financiero academico. No realiza evaluacion crediticia real ni aprueba prestamos.',
      isOpen: false
    },
    {
      id: 16,
      category: 'Limitaciones del simulador',
      question: 'El sistema calcula mora o pagos atrasados?',
      answer: 'No. Esta version se enfoca en la simulacion del credito vehicular bajo condiciones normales. No incluye mora, penalidades ni pagos atrasados.',
      isOpen: false
    },
    {
      id: 17,
      category: 'Limitaciones del simulador',
      question: 'Puedo hacer pagos anticipados?',
      answer: 'En esta version, el sistema no recalcula cronogramas por pagos anticipados. Solo permite simular el cronograma inicial del credito.',
      isOpen: false
    }
  ];

  get filteredFaqs(): FaqItem[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();
    const categoryFaqs = this.faqs.filter(faq => faq.category === this.selectedCategory);

    if (!normalizedSearch) {
      return categoryFaqs;
    }

    return categoryFaqs.filter(faq =>
      faq.question.toLowerCase().includes(normalizedSearch) ||
      faq.answer.toLowerCase().includes(normalizedSearch)
    );
  }

  selectCategory(category: FaqCategory): void {
    this.selectedCategory = category;
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
