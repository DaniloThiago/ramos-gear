import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { createDefaultChecklistConfig } from '../../../app.data';
import {
  AppDraft,
  ChecklistItemConfig,
  InspectionItemResult,
  PaintingClass,
  StructureClass,
} from '../../../app.models';
import { InspectionService } from '../../../core/inspection/inspection.service';
import { StepClassifyComponent } from './step-classify/step-classify.component';
import { StepPhotoComponent } from './step-photo/step-photo.component';

type WizardPhase = 'photo' | 'classify';
type ClassValue = PaintingClass | StructureClass | '';

function createResult(item: ChecklistItemConfig): InspectionItemResult {
  return {
    itemId: item.id,
    title: item.title,
    instruction: item.instruction,
    kind: item.kind,
    vehiclePart: item.vehiclePart,
    photo: null,
    status: 'pendente',
    notes: '',
  };
}

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [RouterLink, StepPhotoComponent, StepClassifyComponent],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.css',
})
export class WizardComponent {
  private readonly checklist = createDefaultChecklistConfig();
  private readonly inspectionService = inject(InspectionService);
  private readonly router = inject(Router);
  private readonly draft = this.inspectionService.draft();

  readonly step = signal(this.draft?.currentStep ?? 0);
  readonly phase = signal<WizardPhase>(this.resolveInitialPhase());
  readonly items = signal<InspectionItemResult[]>(this.resolveItems());

  readonly currentItem = computed(() => this.items()[this.step()] ?? null);
  readonly currentIndex = computed(() => this.step() + 1);
  readonly totalItems = computed(() => this.items().length);
  readonly progress = computed(() => {
    const total = this.totalItems();
    if (!total) {
      return 0;
    }

    return Math.min(100, ((this.step() + 1) / total) * 100);
  });
  readonly stepLabel = computed(() => {
    const item = this.currentItem();
    return item ? `Item ${this.currentIndex()} de ${this.totalItems()} — ${item.title}` : 'Sem itens';
  });

  constructor() {
    if (!this.draft) {
      void this.router.navigateByUrl('/inspection/start');
    }
  }

  get currentClass(): ClassValue {
    const item = this.currentItem();
    if (!item) {
      return '';
    }

    if (item.kind === 'pintura') {
      return item.paintingClass ?? '';
    }

    if (item.kind === 'estrutura') {
      return item.structureClass ?? '';
    }

    return '';
  }

  get currentNotes(): string {
    return this.currentItem()?.notes ?? '';
  }

  capturePhoto(photo: string): void {
    this.updateCurrentItem((item) => ({
      ...item,
      photo,
      status: 'capturada',
    }));
  }

  redoPhoto(): void {
    this.updateCurrentItem((item) => ({
      ...item,
      photo: null,
      status: 'pendente',
    }));
    this.phase.set('photo');
  }

  confirmPhoto(): void {
    if (this.currentItem()?.photo) {
      this.phase.set('classify');
      this.saveDraft();
    }
  }

  updateClassification(event: { classification: ClassValue; notes: string }): void {
    this.updateCurrentItem((item) => ({
      ...item,
      paintingClass: item.kind === 'pintura' ? (event.classification as PaintingClass | '') || undefined : item.paintingClass,
      structureClass:
        item.kind === 'estrutura' ? (event.classification as StructureClass | '') || undefined : item.structureClass,
      notes: event.notes,
    }));
  }

  previousStep(): void {
    if (this.phase() === 'classify') {
      this.phase.set('photo');
      return;
    }

    if (this.step() > 0) {
      this.step.update((value) => value - 1);
      this.phase.set('classify');
      this.saveDraft();
      return;
    }

    void this.router.navigateByUrl('/inspection/start');
  }

  nextStep(): void {
    this.saveDraft();

    if (this.step() >= this.totalItems() - 1) {
      void this.router.navigateByUrl('/inspection/summary');
      return;
    }

    this.step.update((value) => value + 1);
    this.phase.set('photo');
    this.saveDraft();
  }

  private resolveInitialPhase(): WizardPhase {
    const draftItem = this.resolveItems()[this.draft?.currentStep ?? 0];
    if (!draftItem || !draftItem.photo) {
      return 'photo';
    }

    return 'classify';
  }

  private resolveItems(): InspectionItemResult[] {
    const existingById = new Map(this.draft?.items.map((item) => [item.itemId, item]) ?? []);
    return this.checklist.map((item: ChecklistItemConfig) => existingById.get(item.id) ?? createResult(item));
  }

  private updateCurrentItem(updater: (item: InspectionItemResult) => InspectionItemResult): void {
    const current = this.currentItem();
    if (!current) {
      return;
    }

    const nextItems = this.items().map((item) => (item.itemId === current.itemId ? updater(item) : item));
    this.items.set(nextItems);

    this.saveDraft();
  }

  private saveDraft(): void {
    const current = this.currentItem();
    const snapshot = this.inspectionService.draft();
    const draft: AppDraft = {
      inspectorEmail: snapshot?.inspectorEmail ?? '',
      inspectionId: snapshot?.inspectionId,
      customer: snapshot?.customer ?? { name: '', phone: '', email: '' },
      vehicle:
        snapshot?.vehicle ?? {
          plate: '',
          renavam: '',
          mileage: '',
          motorNumber: '',
          documentMotorNumber: '',
          chassisNumber: '',
          documentChassisNumber: '',
          remarcado: 'Não',
          vehicleType: '',
          brand: '',
          model: '',
          manufacturingYear: '',
          modelYear: '',
          species: '',
          fuel: '',
          color: '',
          cityUfJurisdiction: '',
          passengerCapacity: '',
          enginePower: '',
          transmissionType: '',
        },
      checklistId: snapshot?.checklistId ?? 'padrao',
      currentStep: this.step(),
      itemCursor: this.step(),
      items: this.items(),
      decision: snapshot?.decision ?? 'Aprovado',
      generalNotes: snapshot?.generalNotes ?? '',
    };

    if (!current) {
      return;
    }

    this.inspectionService.saveDraft(draft);
  }
}
