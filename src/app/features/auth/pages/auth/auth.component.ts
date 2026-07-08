import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

type AuthTab = 'login' | 'register' | 'forgot' | 'reset';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  activeTab: AuthTab = 'login';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  registerForm = this.fb.nonNullable.group({
    documentNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptedPrivacy: [false, [Validators.requiredTrue]]
  });

  forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resetPasswordForm = this.fb.nonNullable.group({
    token: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor() {
    const mode = this.route.snapshot.data['mode'] as AuthTab | undefined;

    if (mode) {
      this.activeTab = mode;
    }
  }

  switchTab(tab: AuthTab): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitLogin(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.isSubmitting = false;
        const backendMessage = err?.error?.message;
        this.errorMessage = backendMessage || 'Correo o contraseña incorrectos.';
      }
    });
  }

  submitRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();

    if (formValue.password !== formValue.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmitting = true;

    this.authService.register(formValue).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message || 'No se pudo completar el registro.';
      }
    });
  }

  submitForgotPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.forgotPassword(this.forgotPasswordForm.getRawValue()).subscribe({
      next: response => {
        this.isSubmitting = false;
        this.successMessage = response.resetToken
          ? `Token generado: ${response.resetToken}`
          : response.message || 'Revisa tu correo para continuar.';

        if (response.resetToken) {
          this.resetPasswordForm.controls.token.setValue(response.resetToken);
        }

        this.activeTab = 'reset';
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message || 'No se pudo generar el token de recuperacion.';
      }
    });
  }

  submitResetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const value = this.resetPasswordForm.getRawValue();

    if (value.newPassword !== value.confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    this.isSubmitting = true;

    this.authService.resetPassword(value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Contrasena restablecida. Ya puedes iniciar sesion.';
        this.resetPasswordForm.reset({
          token: '',
          newPassword: '',
          confirmPassword: ''
        });
        this.activeTab = 'login';
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message || 'No se pudo restablecer la contrasena.';
      }
    });
  }

  hasLoginError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return control.invalid && control.touched;
  }

  hasRegisterError(
    field:
      | 'documentNumber'
      | 'fullName'
      | 'email'
      | 'password'
      | 'confirmPassword'
      | 'acceptedPrivacy'
  ): boolean {
    const control = this.registerForm.controls[field];
    return control.invalid && control.touched;
  }

  hasForgotError(field: 'email'): boolean {
    const control = this.forgotPasswordForm.controls[field];
    return control.invalid && control.touched;
  }

  hasResetError(field: 'token' | 'newPassword' | 'confirmPassword'): boolean {
    const control = this.resetPasswordForm.controls[field];
    return control.invalid && control.touched;
  }
}
