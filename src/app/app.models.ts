export type UserRole = 'admin' | 'vistoriador';
export type ChecklistKind = 'pintura' | 'estrutura' | 'geral';
export type PhotoStatus = 'pendente' | 'capturada';
export type PaintingClass = 'Original' | 'Repintura' | 'Retrabalhada' | 'Substituida';
export type StructureClass = 'Original' | 'Reparo' | 'Avariada';
export type FinalDecision = 'Aprovado' | 'Aprovado com apontamentos' | 'Nao recomendado';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId: string;
}

export interface CompanyBranding {
  companyId: string;
  companyName: string;
  logoUrl: string;
  accentColor: string;
}

export interface VehicleInfo {
  plate: string;
  renavam: string;
  mileage: string;
  motorNumber: string;
  documentMotorNumber: string;
  chassisNumber: string;
  documentChassisNumber: string;
  remarcado: string;
  vehicleType: string;
  brand: string;
  model: string;
  manufacturingYear: string;
  modelYear: string;
  species: string;
  fuel: string;
  color: string;
  cityUfJurisdiction: string;
  passengerCapacity: string;
  enginePower: string;
  transmissionType: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

export interface ChecklistItemConfig {
  id: string;
  title: string;
  instruction: string;
  kind: ChecklistKind;
  vehiclePart: string;
  required: boolean;
}

export interface InspectionItemResult {
  itemId: string;
  title: string;
  instruction: string;
  kind: ChecklistKind;
  vehiclePart: string;
  photo: string | null;
  status: PhotoStatus;
  paintingClass?: PaintingClass;
  structureClass?: StructureClass;
  notes: string;
}

export interface InspectionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: CustomerInfo;
  vehicle: VehicleInfo;
  decision: FinalDecision;
  companyId: string;
  items: InspectionItemResult[];
  pdfUrl?: string;
  generalNotes?: string;
}

export interface AppDraft {
  inspectorEmail: string;
  inspectionId?: string;
  customer: CustomerInfo;
  vehicle: VehicleInfo;
  checklistId: string;
  currentStep: number;
  itemCursor: number;
  items: InspectionItemResult[];
  decision: FinalDecision;
  generalNotes?: string;
}
