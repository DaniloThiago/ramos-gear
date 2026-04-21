import { Component, computed, inject } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppDraft } from '../../../app.models';
import { AuthService } from '../../../core/auth/auth.service';
import { InspectionService } from '../../../core/inspection/inspection.service';

function optionalEmailValidator(): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null;
    }

    return Validators.email(control) ? { email: true } : null;
  };
}

function yearRangeValidator(min: number, max: number): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = Number(control.value);
    if (!Number.isFinite(value)) {
      return { year: true };
    }

    if (value < min || value > max) {
      return { yearRange: { min, max } };
    }

    return null;
  };
}

function plateValidator(): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = String(control.value ?? '').trim().toUpperCase();
    const pattern = /^([A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;
    return pattern.test(value) ? null : { plate: true };
  };
}

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './start.component.html',
  styleUrl: './start.component.css',
})
export class StartComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly inspectionService = inject(InspectionService);

  readonly yearMax = new Date().getFullYear() + 1;
  readonly yearMin = 1950;
  readonly hasDraft = computed(() => this.inspectionService.draft() !== null);
  readonly draftPreview = computed(() => this.inspectionService.draft());

  readonly form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]],
    customerEmail: ['', [optionalEmailValidator()]],
    plate: ['', [Validators.required, plateValidator()]],
    brand: ['', [Validators.required]],
    model: ['', [Validators.required]],
    year: [new Date().getFullYear().toString(), [Validators.required, yearRangeValidator(this.yearMin, this.yearMax)]],
  });

  get customerName() {
    return this.form.controls.customerName;
  }

  get customerPhone() {
    return this.form.controls.customerPhone;
  }

  get customerEmail() {
    return this.form.controls.customerEmail;
  }

  get plate() {
    return this.form.controls.plate;
  }

  get brand() {
    return this.form.controls.brand;
  }

  get model() {
    return this.form.controls.model;
  }

  get year() {
    return this.form.controls.year;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    const formatted = this.formatPhone(digits);

    this.customerPhone.setValue(formatted);
    input.value = formatted;
  }

  onPlateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();

    this.plate.setValue(value);
    input.value = value;
  }

  continuePrevious(): void {
    void this.router.navigateByUrl('/inspection/wizard');
  }

  startNew(): void {
    this.inspectionService.clearDraft();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const draft: AppDraft = {
      inspectorEmail: this.auth.user()?.email ?? '',
      customer: {
        name: this.customerName.value.trim(),
        phone: this.customerPhone.value.trim(),
        email: this.customerEmail.value.trim(),
      },
      vehicle: {
        plate: this.plate.value.trim().toUpperCase(),
        brand: this.brand.value.trim(),
        model: this.model.value.trim(),
        year: this.year.value.trim(),
      },
      checklistId: 'padrao',
      currentStep: 0,
      itemCursor: 0,
      items: [],
      decision: 'Aprovado',
    };

    this.inspectionService.saveDraft(draft);
    void this.router.navigateByUrl('/inspection/wizard');
  }

  private formatPhone(digits: string): string {
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, digits.length > 10 ? 7 : 6);
    const part3 = digits.slice(digits.length > 10 ? 7 : 6, 11);

    if (!part1) {
      return '';
    }

    if (digits.length <= 2) {
      return `(${part1}`;
    }

    if (digits.length <= 6) {
      return `(${part1}) ${part2}`;
    }

    return `(${part1}) ${part2}-${part3}`;
  }

}
