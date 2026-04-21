import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { defaultBranding } from '../../app.data';
import { InspectionRecord } from '../../app.models';
import { AuthService } from '../../core/auth/auth.service';
import { InspectionService } from '../../core/inspection/inspection.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  constructor(
    public readonly auth: AuthService,
    public readonly inspectionService: InspectionService,
  ) {}

  readonly company = computed(() =>
    this.auth.getCompanyBranding(this.auth.user()?.companyId ?? defaultBranding.companyId),
  );

  readonly orderedInspections = computed(() =>
    this.inspectionService
      .inspections()
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
  );

  readonly totalInspections = computed(() => this.inspectionService.total());

  formatCreatedAt(dateValue: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateValue));
  }

  vehicleLabel(record: InspectionRecord): string {
    return `${record.vehicle.brand} ${record.vehicle.model} ${record.vehicle.modelYear || record.vehicle.manufacturingYear || ''}`.trim();
  }

  decisionTone(decision: InspectionRecord['decision']): string {
    switch (decision) {
      case 'Aprovado':
        return 'success';
      case 'Aprovado com apontamentos':
        return 'warning';
      default:
        return 'danger';
    }
  }
}
