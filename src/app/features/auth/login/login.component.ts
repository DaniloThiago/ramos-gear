import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly highlights = [
    'Login simples com email e senha',
    'Guardas protegendo dashboard e admin',
    'Base preparada para offline e multiempresa',
  ];

  readonly demoAccounts = [
    { label: 'Administrador', email: 'admin@ramosgear.com' },
    { label: 'Vistoriador', email: 'vistoriador@ramosgear.com' },
  ];

  authError = false;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  submit(): void {
    this.authError = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const success = this.auth.login(this.email.value, this.password.value);
    if (!success) {
      this.authError = true;
      return;
    }

    void this.router.navigateByUrl('/dashboard');
  }
}
