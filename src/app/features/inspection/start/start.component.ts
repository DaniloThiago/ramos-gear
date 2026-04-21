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

function renavamValidator(): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = String(control.value ?? '').replace(/\D/g, '');
    return /^\d{9,11}$/.test(value) ? null : { renavam: true };
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
  readonly fuelOptions = ['FLEX/GNV', 'Gasolina', 'Álcool', 'Diesel', 'Elétrico', 'Híbrido'];
  readonly transmissionOptions = ['Manual', 'Automático', 'Automatizado', 'CVT', 'Semi-automático'];
  readonly remarcadoOptions = ['Sim', 'Não'];
  readonly hasDraft = computed(() => this.inspectionService.draft() !== null);
  readonly draftPreview = computed(() => this.inspectionService.draft());

  readonly form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]],
    customerEmail: ['', [optionalEmailValidator()]],
    plate: ['', [Validators.required, plateValidator()]],
    renavam: ['', [Validators.required, renavamValidator()]],
    mileage: ['', [Validators.required]],
    motorNumber: ['', [Validators.required]],
    documentMotorNumber: ['', [Validators.required]],
    chassisNumber: ['', [Validators.required]],
    documentChassisNumber: ['', [Validators.required]],
    remarcado: ['Não', [Validators.required]],
    vehicleType: ['', [Validators.required]],
    brand: ['', [Validators.required]],
    model: ['', [Validators.required]],
    manufacturingYear: [
      new Date().getFullYear().toString(),
      [Validators.required, yearRangeValidator(this.yearMin, this.yearMax)],
    ],
    modelYear: [new Date().getFullYear().toString(), [Validators.required, yearRangeValidator(this.yearMin, this.yearMax)]],
    species: ['', [Validators.required]],
    fuel: ['', [Validators.required]],
    color: ['', [Validators.required]],
    cityUfJurisdiction: ['', [Validators.required]],
    passengerCapacity: ['', [Validators.required]],
    enginePower: ['', [Validators.required]],
    transmissionType: ['', [Validators.required]],
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

  get renavam() {
    return this.form.controls.renavam;
  }

  get mileage() {
    return this.form.controls.mileage;
  }

  get motorNumber() {
    return this.form.controls.motorNumber;
  }

  get documentMotorNumber() {
    return this.form.controls.documentMotorNumber;
  }

  get chassisNumber() {
    return this.form.controls.chassisNumber;
  }

  get documentChassisNumber() {
    return this.form.controls.documentChassisNumber;
  }

  get remarcado() {
    return this.form.controls.remarcado;
  }

  get vehicleType() {
    return this.form.controls.vehicleType;
  }

  get brand() {
    return this.form.controls.brand;
  }

  get model() {
    return this.form.controls.model;
  }

  get manufacturingYear() {
    return this.form.controls.manufacturingYear;
  }

  get modelYear() {
    return this.form.controls.modelYear;
  }

  get species() {
    return this.form.controls.species;
  }

  get fuel() {
    return this.form.controls.fuel;
  }

  get color() {
    return this.form.controls.color;
  }

  get cityUfJurisdiction() {
    return this.form.controls.cityUfJurisdiction;
  }

  get passengerCapacity() {
    return this.form.controls.passengerCapacity;
  }

  get enginePower() {
    return this.form.controls.enginePower;
  }

  get transmissionType() {
    return this.form.controls.transmissionType;
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
        renavam: this.renavam.value.replace(/\D/g, ''),
        mileage: this.mileage.value.trim(),
        motorNumber: this.motorNumber.value.trim(),
        documentMotorNumber: this.documentMotorNumber.value.trim(),
        chassisNumber: this.chassisNumber.value.trim(),
        documentChassisNumber: this.documentChassisNumber.value.trim(),
        remarcado: this.remarcado.value,
        vehicleType: this.vehicleType.value.trim(),
        brand: this.brand.value.trim(),
        model: this.model.value.trim(),
        manufacturingYear: this.manufacturingYear.value.trim(),
        modelYear: this.modelYear.value.trim(),
        species: this.species.value.trim(),
        fuel: this.fuel.value.trim(),
        color: this.color.value.trim(),
        cityUfJurisdiction: this.cityUfJurisdiction.value.trim(),
        passengerCapacity: this.passengerCapacity.value.trim(),
        enginePower: this.enginePower.value.trim(),
        transmissionType: this.transmissionType.value.trim(),
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
