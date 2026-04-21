import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { defaultBranding } from '../../app.data';
import { AppDraft, FinalDecision, InspectionItemResult, InspectionRecord } from '../../app.models';
import { AuthService } from '../../core/auth/auth.service';
import { InspectionService } from '../../core/inspection/inspection.service';
import { PdfService } from '../../core/pdf/pdf.service';
import { VehicleDiagramComponent } from '../../shared/components/vehicle-diagram/vehicle-diagram.component';

type ReportStatus = 'idle' | 'generating' | 'ready' | 'error';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [RouterLink, VehicleDiagramComponent],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent implements AfterViewInit, OnDestroy {
  private readonly inspectionService = inject(InspectionService);
  private readonly pdfService = inject(PdfService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly draft = signal<AppDraft | null>(this.inspectionService.loadDraft());
  readonly items = computed(() => this.draft()?.items ?? []);
  readonly company = computed(() =>
    this.auth.getCompanyBranding(this.auth.user()?.companyId ?? defaultBranding.companyId),
  );
  readonly selectedDecision = signal<FinalDecision>('Aprovado');
  readonly status = signal<ReportStatus>('idle');
  readonly feedback = signal('');
  readonly reopenedFromHistory = signal(false);

  @ViewChild('reportTemplate') private readonly reportTemplate?: ElementRef<HTMLElement>;

  private generatedBlob: Blob | null = null;
  private generatedUrl: string | null = null;
  private readonly filename = 'laudo-ramos-gear.pdf';

  constructor() {
    const inspectionId = this.route.snapshot.queryParamMap.get('inspectionId');

    if (inspectionId) {
      const record = this.inspectionService.getInspectionById(inspectionId);
      if (!record) {
        void this.router.navigateByUrl('/dashboard');
        return;
      }

      this.draft.set(this.inspectionToDraft(record));
      this.selectedDecision.set(record.decision);
      this.reopenedFromHistory.set(true);
      return;
    }

    const draft = this.draft();
    if (!draft) {
      void this.router.navigateByUrl('/inspection/start');
      return;
    }

    const queryDecision = this.route.snapshot.queryParamMap.get('decision') as FinalDecision | null;
    this.selectedDecision.set(queryDecision ?? draft.decision ?? 'Aprovado');
  }

  ngAfterViewInit(): void {
    this.status.set('ready');
  }

  ngOnDestroy(): void {
    this.revokeGeneratedUrl();
  }

  reportDate(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date());
  }

  statusLabel(): string {
    switch (this.status()) {
      case 'generating':
        return 'Gerando';
      case 'ready':
        return 'Pronto';
      case 'error':
        return 'Erro';
      default:
        return 'Aguardando';
    }
  }

  vehicleLabel(draft: AppDraft): string {
    return [draft.vehicle.brand, draft.vehicle.model, draft.vehicle.modelYear || draft.vehicle.manufacturingYear]
      .filter(Boolean)
      .join(' ');
  }

  decisionLabel(decision: FinalDecision): string {
    if (decision === 'Nao recomendado') {
      return 'Não recomendado';
    }

    return decision;
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

  async generatePdf(): Promise<void> {
    await this.buildPdf();
    this.feedback.set('PDF gerado com sucesso. Você pode baixar ou compartilhar agora.');
  }

  async downloadPdf(): Promise<void> {
    try {
      const blob = await this.buildPdf();
      this.pdfService.download(blob, this.filename);
      this.feedback.set('Download do PDF iniciado.');
    } catch {
      this.status.set('error');
      this.feedback.set('Não foi possível gerar o PDF agora.');
    }
  }

  async sharePdf(): Promise<void> {
    try {
      const blob = await this.buildPdf();
      const shared = await this.pdfService.share(blob, this.filename);

      if (shared) {
        this.feedback.set('Compartilhamento aberto com sucesso.');
        return;
      }

      this.feedback.set('Compartilhamento não suportado. O PDF foi baixado.');
    } catch {
      this.status.set('error');
      this.feedback.set('Não foi possível compartilhar o PDF agora.');
    }
  }

  async emailPdf(): Promise<void> {
    try {
      await this.buildPdf();

      const draft = this.draft();
      if (!draft) {
        return;
      }

      const subject = encodeURIComponent(`Laudo cautelar - ${this.vehicleLabel(draft)}`);
      const body = encodeURIComponent(
        [
          `Olá, ${draft.customer.name}.`,
          '',
          'Segue o laudo cautelar gerado pelo Ramos Gear.',
          'O PDF já está pronto para download/compartilhamento no navegador.',
          '',
          `Veículo: ${this.vehicleLabel(draft)}`,
          `Decisão: ${this.decisionLabel(this.selectedDecision())}`,
        ].join('\n'),
      );

      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      this.feedback.set('Cliente de e-mail aberto com os dados do laudo.');
    } catch {
      this.status.set('error');
      this.feedback.set('Não foi possível preparar o e-mail agora.');
    }
  }

  get logoSrc(): string {
    return this.company().logoUrl || '/assets/logo.png';
  }

  private async buildPdf(): Promise<Blob> {
    if (this.generatedBlob && this.status() === 'ready') {
      return this.generatedBlob;
    }

    const draft = this.draft();
    if (!draft) {
      throw new Error('Draft não encontrado.');
    }

    this.status.set('generating');

    if (!draft.inspectionId) {
      this.inspectionService.saveDraft({
        ...draft,
        inspectionId: this.createId(),
      });
    }

    await this.waitForRender();

    const template = this.reportTemplate?.nativeElement;
    if (!template) {
      throw new Error('Template do laudo indisponível.');
    }

    await this.waitForImages(template);

    const blob = await this.pdfService.generateFromElement(template, this.filename);
    this.generatedBlob = blob;
    this.revokeGeneratedUrl();
    this.generatedUrl = URL.createObjectURL(blob);

    if (!this.reopenedFromHistory()) {
      const updatedDraft = this.inspectionService.loadDraft();
      if (updatedDraft) {
        const record: InspectionRecord = {
          id: updatedDraft.inspectionId ?? this.createId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customer: updatedDraft.customer,
          vehicle: updatedDraft.vehicle,
          decision: this.selectedDecision(),
          companyId: this.company().companyId || defaultBranding.companyId,
          items: updatedDraft.items,
          generalNotes: updatedDraft.generalNotes?.trim(),
        };

        this.inspectionService.saveInspection(record);
        this.inspectionService.clearDraft();
        this.draft.set({
          ...updatedDraft,
          inspectionId: record.id,
          decision: this.selectedDecision(),
        });
      }
    }

    this.status.set('ready');
    return blob;
  }

  private async waitForRender(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private async waitForImages(template: HTMLElement): Promise<void> {
    const images = Array.from(template.querySelectorAll('img'));

    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) {
          return;
        }

        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      }),
    );
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

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `inspection-${Date.now()}`;
  }

  private inspectionToDraft(record: InspectionRecord): AppDraft {
    return {
      inspectorEmail: this.auth.user()?.email ?? '',
      inspectionId: record.id,
      customer: record.customer,
      vehicle: record.vehicle,
      checklistId: 'padrao',
      currentStep: 0,
      itemCursor: 0,
      items: record.items,
      decision: record.decision,
      generalNotes: record.generalNotes ?? '',
    };
  }

  private revokeGeneratedUrl(): void {
    if (this.generatedUrl) {
      URL.revokeObjectURL(this.generatedUrl);
      this.generatedUrl = null;
    }
  }
}
