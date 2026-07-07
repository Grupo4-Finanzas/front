import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  user?: User;
  successMessage = '';
  errorMessage = '';
  isSubmittingProfile = false;
  passwordVisible = false;

  profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    currentPassword: [''],
    newPassword: [''],
    confirmPassword: [''],
    preferredCurrency: ['PEN']
  });

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe({
      next: user => {
        this.user = user;
        this.profileForm.patchValue({
          fullName: user.fullName,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          preferredCurrency: 'PEN'
        });
      },
      error: () => {
        this.router.navigateByUrl('/auth');
      }
    });
  }

  submitProfile(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { fullName, currentPassword, newPassword, confirmPassword } =
      this.profileForm.getRawValue();
    const shouldChangePassword = !!currentPassword || !!newPassword || !!confirmPassword;

    if (shouldChangePassword && (!currentPassword || !newPassword || !confirmPassword)) {
      this.errorMessage = 'Completa la contrasena actual, la nueva y su confirmacion.';
      return;
    }

    if (shouldChangePassword && newPassword !== confirmPassword) {
      this.errorMessage = 'La nueva contrasena y la confirmacion no coinciden.';
      return;
    }

    this.isSubmittingProfile = true;

    this.authService.updateProfile({ fullName }).subscribe({
      next: user => {
        this.user = user;

        if (shouldChangePassword) {
          this.changePassword(currentPassword, newPassword, confirmPassword);
          return;
        }

        this.successMessage = 'Datos actualizados correctamente.';
        this.isSubmittingProfile = false;
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'No se pudieron actualizar los datos.';
        this.isSubmittingProfile = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  private changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): void {
    this.authService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword
    }).subscribe({
      next: () => {
        this.successMessage = 'Datos y contrasena actualizados correctamente.';
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        this.isSubmittingProfile = false;
      },
      error: err => {
        this.errorMessage =
          err?.error?.message || 'Los datos se actualizaron, pero no se pudo cambiar la contrasena.';
        this.isSubmittingProfile = false;
      }
    });
  }
}
