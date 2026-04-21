import { Component, Input } from '@angular/core';
import { InspectionItemResult } from '../../../app.models';

type SeverityKey = 'gray' | 'green' | 'yellow' | 'orange' | 'red';
type VehicleSide = 'front' | 'back';

interface VehicleMarker {
  id: number;
  side: VehicleSide;
  label: string;
  x: number;
  y: number;
}

interface MarkerViewModel extends VehicleMarker {
  tone: SeverityKey;
}

const IMAGE_PATHS: Record<VehicleSide, string> = {
  front: '/assets/vehicle-diagram/front.png',
  back: '/assets/vehicle-diagram/back.png',
};

const VEHICLE_MARKERS: VehicleMarker[] = [
  { id: 1, side: 'front', label: 'Longarina dianteira direita', x: 21, y: 59 },
  { id: 2, side: 'front', label: 'Painel dianteiro superior', x: 14, y: 66 },
  { id: 3, side: 'front', label: 'Painel dianteiro inferior', x: 9, y: 74 },
  { id: 4, side: 'front', label: 'Longarina dianteira esquerda', x: 25, y: 76 },
  { id: 5, side: 'front', label: 'Coluna A esquerda', x: 53, y: 42 },
  { id: 6, side: 'front', label: 'Suporte caixa de ar esquerda', x: 61, y: 67 },
  { id: 7, side: 'front', label: 'Coluna B esquerda', x: 69, y: 41 },
  { id: 8, side: 'front', label: 'Coluna C esquerda', x: 84, y: 23 },
  { id: 9, side: 'back', label: 'Longarina traseira esquerda', x: 21, y: 59 },
  { id: 10, side: 'back', label: 'Painel traseiro', x: 21, y: 72 },
  { id: 11, side: 'back', label: 'Longarina traseira direita', x: 37, y: 78 },
  { id: 12, side: 'back', label: 'Coluna C direita', x: 47, y: 49 },
  { id: 13, side: 'back', label: 'Coluna B direita', x: 66, y: 41 },
  { id: 14, side: 'back', label: 'Coluna A direita', x: 76, y: 32 },
  { id: 15, side: 'back', label: 'Suporte caixa de ar direita', x: 72, y: 63 },
];

const SEVERITY_LABELS: Record<SeverityKey, string> = {
  gray: 'Sem avaliação',
  green: 'Original',
  yellow: 'Repintura / Reparo',
  orange: 'Retrabalhada',
  red: 'Avariada / Substituida',
};

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

@Component({
  selector: 'app-vehicle-diagram',
  standalone: true,
  templateUrl: './vehicle-diagram.component.html',
  styleUrl: './vehicle-diagram.component.css',
})
export class VehicleDiagramComponent {
  @Input() items: InspectionItemResult[] = [];

  readonly sides = [
    { key: 'front' as const, title: 'Frente', subtitle: 'Imagem frontal' },
    { key: 'back' as const, title: 'Traseira', subtitle: 'Imagem traseira' },
  ];

  readonly legend = [
    { key: 'green', label: SEVERITY_LABELS.green },
    { key: 'yellow', label: SEVERITY_LABELS.yellow },
    { key: 'orange', label: SEVERITY_LABELS.orange },
    { key: 'red', label: SEVERITY_LABELS.red },
    { key: 'gray', label: SEVERITY_LABELS.gray },
  ] as const;

  markersFor(side: VehicleSide): MarkerViewModel[] {
    return VEHICLE_MARKERS.filter((marker) => marker.side === side).map((marker) => ({
      ...marker,
      tone: this.markerTone(marker),
    }));
  }

  markerTone(marker: VehicleMarker): SeverityKey {
    const severity = this.markerSeverity(marker);

    if (severity >= 3) {
      return 'red';
    }

    if (severity === 2) {
      return 'orange';
    }

    if (severity === 1) {
      return 'yellow';
    }

    if (severity === 0) {
      return 'green';
    }

    return 'gray';
  }

  markerSeverity(marker: VehicleMarker): number {
    const relatedItems = this.items.filter((item) => this.matchesMarker(item.vehiclePart, marker));
    if (!relatedItems.length) {
      return -1;
    }

    return relatedItems.reduce((worst, item) => Math.max(worst, this.itemSeverity(item)), -1);
  }

  imagePath(side: VehicleSide): string {
    return IMAGE_PATHS[side];
  }

  private matchesMarker(vehiclePart: string, marker: VehicleMarker): boolean {
    const normalizedPart = normalizeText(vehiclePart);
    const normalizedId = String(marker.id);
    const normalizedLabel = normalizeText(marker.label);

    return normalizedPart === normalizedId || normalizedPart === normalizedLabel;
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
