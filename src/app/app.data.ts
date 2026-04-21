import {
  ChecklistItemConfig,
  CompanyBranding,
  User,
} from './app.models';

export const storageKeys = {
  session: 'ramos-gear.session',
  draft: 'ramos-gear.draft',
  inspections: 'ramos-gear.inspections',
  users: 'ramos-gear.users',
  branding: 'ramos-gear.branding',
  checklists: 'ramos-gear.checklists',
};

export const defaultBranding: CompanyBranding = {
  companyId: 'demo-company',
  companyName: 'Ramos Gear',
  logoUrl: 'assets/logo.png',
  accentColor: '#e11d2e',
};

export const defaultUsers: User[] = [
  {
    id: 'u-admin',
    name: 'Administrador Demo',
    email: 'admin@ramosgear.com',
    password: '123456',
    role: 'admin',
    companyId: 'demo-company',
  },
  {
    id: 'u-inspector',
    name: 'Vistoriador Demo',
    email: 'vistoriador@ramosgear.com',
    password: '123456',
    role: 'vistoriador',
    companyId: 'demo-company',
  },
];

export const defaultChecklists: Record<string, ChecklistItemConfig[]> = {
  padrao: [
    {
      id: 'frente-geral',
      title: 'Frente geral',
      instruction: 'Fotografar a frente completa do veiculo, com boa iluminacao.',
      kind: 'estrutura',
      vehiclePart: 'frente',
      required: true,
    },
    {
      id: 'lado-esquerdo',
      title: 'Lateral esquerda',
      instruction: 'Fotografar toda a lateral esquerda do veiculo.',
      kind: 'pintura',
      vehiclePart: 'lado-esquerdo',
      required: true,
    },
    {
      id: 'lado-direito',
      title: 'Lateral direita',
      instruction: 'Fotografar toda a lateral direita do veiculo.',
      kind: 'pintura',
      vehiclePart: 'lado-direito',
      required: true,
    },
    {
      id: 'traseira',
      title: 'Traseira',
      instruction: 'Fotografar a traseira completa, incluindo placa e tampa do porta-malas.',
      kind: 'estrutura',
      vehiclePart: 'traseira',
      required: true,
    },
    {
      id: 'painel-odometro',
      title: 'Painel e odometro',
      instruction: 'Fotografar o painel com odometro visivel.',
      kind: 'geral',
      vehiclePart: 'painel',
      required: true,
    },
    {
      id: 'chassi',
      title: 'Identificacao de chassi',
      instruction: 'Fotografar a identificacao do chassi ou etiqueta vinculada.',
      kind: 'estrutura',
      vehiclePart: 'chassi',
      required: true,
    },
  ],
};

export function createDefaultChecklistConfig(): ChecklistItemConfig[] {
  return defaultChecklists['padrao'].map((item) => ({ ...item }));
}
