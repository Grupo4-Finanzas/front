import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

type AuthTab = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  activeTab: AuthTab = 'login';
  errorMessage = '';
  successMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    acceptedPrivacy: [false, [Validators.requiredTrue]]
  });

  switchTab(tab: AuthTab): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitLogin(): void {
    this.authService.startSession().subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.errorMessage = 'No se pudo iniciar sesión.';
        this.successMessage = '';
      }
    });
  }

  submitRegister(): void {
    this.authService.startSession().subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.errorMessage = 'No se pudo crear sesión.';
        this.successMessage = '';
      }
    });
  }

  hasLoginError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return control.invalid && control.touched;
  }

  hasRegisterError(
    field: 'fullName' | 'email' | 'password' | 'confirmPassword' | 'acceptedPrivacy'
  ): boolean {
    const control = this.registerForm.controls[field];
    return control.invalid && control.touched;
  }
}
