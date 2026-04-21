import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FinalDecision, InspectionItemResult } from '../../../app.models';
import { InspectionService } from '../../../core/inspection/inspection.service';
import { VehicleDiagramComponent } from '../../../shared/components/vehicle-diagram/vehicle-diagram.component';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [RouterLink, VehicleDiagramComponent],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
})
export class SummaryComponent {
  private readonly inspectionService = inject(InspectionService);
  private readonly router = inject(Router);

  readonly decisions: FinalDecision[] = [
    'Aprovado',
    'Aprovado com apontamentos',
    'Nao recomendado',
  ];
  readonly draft = computed(() => this.inspectionService.loadDraft());
  readonly items = computed(() => this.draft()?.items ?? []);
  readonly suggestedDecision = computed(() => this.suggestDecision(this.items()));
  readonly selectedDecision = signal<FinalDecision>('Aprovado');
  readonly generalNotes = signal('');

  constructor() {
    const draft = this.draft();
    if (!draft) {
      void this.router.navigateByUrl('/inspection/start');
      return;
    }

    this.selectedDecision.set(this.suggestedDecision());
    this.generalNotes.set(draft.generalNotes ?? '');
  }

  selectDecision(decision: FinalDecision): void {
    this.selectedDecision.set(decision);
  }

  decisionLabel(decision: FinalDecision): string {
    if (decision === 'Nao recomendado') {
      return 'Não recomendado';
    }

    return decision;
  }

  updateGeneralNotes(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.generalNotes.set(input.value);
  }

  itemClassification(item: InspectionItemResult): string {
    if (item.kind === 'pintura') {
      return item.paintingClass ?? 'Sem classificação';
    }

    if (item.kind === 'estrutura') {
      return item.structureClass ?? 'Sem classificação';
    }

    return 'Observações';
  }

  itemTone(item: InspectionItemResult): 'success' | 'warning' | 'orange' | 'danger' | 'neutral' {
    const severity = this.itemSeverity(item);

    if (severity >= 3) {
      return 'danger';
    }

    if (severity === 2) {
      return 'orange';
    }

    if (severity === 1) {
      return 'warning';
    }

    if (severity === 0) {
      return 'success';
    }

    return 'neutral';
  }

  generateReport(): void {
    const draft = this.draft();
    if (!draft) {
      return;
    }

    this.inspectionService.saveDraft({
      ...draft,
      decision: this.selectedDecision(),
      generalNotes: this.generalNotes().trim(),
    });

    void this.router.navigate(['/report'], {
      queryParams: { decision: this.selectedDecision() },
    });
  }

  private suggestDecision(items: InspectionItemResult[]): FinalDecision {
    const severity = items.reduce((worst, item) => Math.max(worst, this.itemSeverity(item)), -1);

    if (severity >= 3) {
      return 'Nao recomendado';
    }

    if (severity >= 1) {
      return 'Aprovado com apontamentos';
    }

    return 'Aprovado';
  }

  private itemSeverity(item: InspectionItemResult): number {
    if (item.status === 'pendente') {
      return -1;
    }

    if (item.kind === 'pintura') {
      switch (item.paintingClass) {
        case 'Original':
          return 0;
        case 'Repintura':
          return 1;
        case 'Retrabalhada':
          return 2;
        case 'Substituida':
          return 3;
        default:
          return -1;
      }
    }

    if (item.kind === 'estrutura') {
      switch (item.structureClass) {
        case 'Original':
          return 0;
        case 'Reparo':
          return 1;
        case 'Avariada':
          return 3;
        default:
          return -1;
      }
    }

    return -1;
  }
}
