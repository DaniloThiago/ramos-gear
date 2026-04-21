# App Ramos Gear — Arquitetura Técnica

> Documento de referência para desenvolvimento do MVP de vistoria cautelar veicular.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura Escalável (SaaS Multi-tenant)](#3-arquitetura-escalável-saas-multi-tenant)
4. [Estrutura de Banco de Dados](#4-estrutura-de-banco-de-dados)
5. [Estrutura de Pastas Angular](#5-estrutura-de-pastas-angular)
6. [Fluxo de Telas (Wireframe)](#6-fluxo-de-telas-wireframe)
7. [Mapeamento de Funcionalidades](#7-mapeamento-de-funcionalidades)
8. [Modo Offline (PWA + IndexedDB)](#8-modo-offline-pwa--indexeddb)
9. [Geração de PDF](#9-geração-de-pdf)
10. [Diagrama Visual do Veículo (SVG)](#10-diagrama-visual-do-veículo-svg)
11. [Segurança e Permissões](#11-segurança-e-permissões)
12. [MVP — Código Inicial](#12-mvp--código-inicial)
13. [Roadmap de Evolução](#13-roadmap-de-evolução)

---

## 1. Visão Geral

**App Ramos Gear** é uma PWA (Progressive Web App) para realização de **vistorias cautelares veiculares** em campo. Permite que vistoriadores fotografem, classifiquem e gerem laudos em PDF sem necessidade de treinamento avançado.

### Público-alvo
- Vistoriadores em campo (uso principal via smartphone)
- Administradores de empresas de vistoria (gestão via desktop)

### Princípios de Design
- **Uma ação por tela** — foco total na tarefa atual
- **Câmera first** — fluxo guiado abre câmera automaticamente
- **Offline primeiro** — vistoria não pode ser interrompida por falta de sinal
- **Autoexplicativo** — instruções claras em cada etapa

### Diferenciais
- White-label por empresa (logo + cor de destaque)
- Estrutura SaaS multi-tenant pronta para venda
- Laudo PDF gerado no dispositivo (sem servidor necessário)
- Diagrama SVG colorido automaticamente

---

## 2. Stack Tecnológica

> Todas as tecnologias abaixo são **gratuitas** (open source ou plano free permanente sem cartão de crédito obrigatório).

| Camada | Tecnologia | Custo | Justificativa |
|--------|-----------|-------|---------------|
| Frontend | **Angular 21** (standalone + signals) | Grátis (open source) | Já definido no projeto; tipagem forte; PWA nativo |
| PWA / Offline | `@angular/pwa` + Workbox | Grátis (open source) | Service Worker gerenciado pelo CLI Angular |
| Storage offline | **Dexie.js** (IndexedDB wrapper) | Grátis (open source) | API simples; funciona 100% offline |
| Backend / Auth | **Supabase** (Auth + PostgreSQL + Storage + Edge Functions) | Grátis — plano Free: 500 MB DB, 1 GB Storage, 50k usuários ativos/mês | Open source; self-hostável; dashboard visual |
| PDF | **jsPDF** + **html2canvas** | Grátis (open source) | Geração client-side; zero servidor |
| Diagrama | SVG inline + Angular data binding | Grátis | Controle total; sem dependência externa |
| Hospedagem | **Vercel** | Grátis — plano Hobby ilimitado para projetos pessoais | Deploy automático via GitHub; CDN global |
| E-mail (laudo) | **EmailJS** | Grátis — 200 e-mails/mês | Envio direto do navegador; sem servidor |
| API veicular | **FIPE API** (deividfortuna/fipe) | Grátis — open source | Consulta de marcas, modelos e preços |

### Limites do plano gratuito Supabase

| Recurso | Limite Free |
|---------|------------|
| Banco de dados (PostgreSQL) | 500 MB |
| Storage (fotos/PDFs) | 1 GB |
| Auth (usuários ativos/mês) | 50.000 |
| Edge Functions | 500.000 invocações/mês |
| Bandwidth | 5 GB/mês |

> Para uso inicial (até ~50 empresas clientes com volume moderado) o plano free é suficiente. Quando ultrapassar, o Pro custa US$25/mês.

### Limites do plano gratuito Vercel

| Recurso | Limite Free |
|---------|------------|
| Deploys | Ilimitados |
| Bandwidth | 100 GB/mês |
| Serverless Functions | 100 GB-Horas/mês |
| Domínio customizado | Suportado |

### Dependências npm a instalar

```bash
# Supabase
npm install @supabase/supabase-js

# PWA
ng add @angular/pwa

# PDF
npm install jspdf html2canvas

# IndexedDB (offline)
npm install dexie

# E-mail
npm install emailjs-com
```

---

## 3. Arquitetura Escalável (SaaS Multi-tenant)

```
┌─────────────────────────────────────────────────────────┐
│                      DISPOSITIVO                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Angular PWA (Browser)              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │  Feature  │  │  Core    │  │   Shared     │  │   │
│  │  │  Modules  │  │ Services │  │  Components  │  │   │
│  │  └──────────┘  └──────────┘  └──────────────┘  │   │
│  │         │              │                         │   │
│  │  ┌──────▼──────────────▼──────────────────────┐ │   │
│  │  │         Service Worker (Workbox)            │ │   │
│  │  │   Cache de assets + fila de sincronização   │ │   │
│  │  └──────────────────────────────────────────── ┘ │   │
│  │         │                                         │   │
│  │  ┌──────▼──────────────────────────────────────┐ │   │
│  │  │            IndexedDB (Dexie.js)              │ │   │
│  │  │   Rascunhos de vistoria + cache de fotos     │ │   │
│  │  └──────────────────────────────────────────── ┘ │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS (quando online)
┌───────────────────────────▼─────────────────────────────┐
│                   SUPABASE (free tier)                  │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐│
│  │ Supabase  │  │PostgreSQL │  │  Supabase Storage    ││
│  │   Auth    │  │    DB     │  │   (fotos/laudos)     ││
│  └───────────┘  └───────────┘  └──────────────────────┘│
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Supabase Edge Functions                 │  │
│  │      (webhooks, integração API veicular)          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                  VERCEL (free tier)                     │
│              Hospedagem + CDN global                    │
└─────────────────────────────────────────────────────────┘
```

### Isolamento Multi-tenant

Cada empresa possui um `companyId` único. **Toda tabela no PostgreSQL** contém `company_id` como campo, e as Row Level Security (RLS) policies do Supabase garantem que usuários só leem/escrevem dados da própria empresa.

```
PostgreSQL (Supabase)
  companies        ← company_id (PK)
  users            ← company_id (FK)
  checklists       ← company_id (FK)
  inspections      ← company_id (FK)
  inspection_items ← inspection_id (FK)
```

---

## 4. Estrutura de Banco de Dados

> Backend: **Supabase** (PostgreSQL + Row Level Security). Plano free inclui 500 MB de banco e 1 GB de Storage.

### PostgreSQL — Tabelas

#### `companies`
```sql
create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  accent_color text default '#0f766e',
  max_users   int default 5,
  created_at  timestamptz default now()
);
```

#### `users` (espelha o Supabase Auth `auth.users`)
```sql
create table users (
  id          uuid primary key references auth.users(id),
  name        text not null,
  role        text check (role in ('admin','vistoriador')) not null,
  company_id  uuid references companies(id) not null,
  active      boolean default true,
  created_at  timestamptz default now()
);
```

#### `checklists`
```sql
create table checklists (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) not null,
  name        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table checklist_items (
  id           uuid primary key default gen_random_uuid(),
  checklist_id uuid references checklists(id) on delete cascade,
  title        text not null,
  instruction  text,
  kind         text check (kind in ('pintura','estrutura','geral')) not null,
  vehicle_part text not null,   -- mapeia para ID da peça no SVG
  required     boolean default true,
  "order"      int not null
);
```

#### `inspections`
```sql
create table inspections (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id) not null,
  inspector_id        uuid references users(id) not null,
  checklist_id        uuid references checklists(id),

  -- dados do cliente
  customer_name       text,
  customer_phone      text,
  customer_email      text,

  -- dados do veículo
  vehicle_plate       text,
  vehicle_brand       text,
  vehicle_model       text,
  vehicle_year        text,

  decision            text check (decision in ('Aprovado','Aprovado com apontamentos','Nao recomendado')),
  decision_overridden boolean default false,
  pdf_url             text,

  -- extras (fase 2)
  geolat              numeric,
  geolng              numeric,
  signature_url       text,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table inspection_items (
  id              uuid primary key default gen_random_uuid(),
  inspection_id   uuid references inspections(id) on delete cascade,
  item_id         text not null,        -- id do ChecklistItem original
  title           text,
  kind            text,
  vehicle_part    text,
  photo_url       text,                 -- URL Supabase Storage
  painting_class  text,                 -- 'Original' | 'Repintura' | etc.
  structure_class text,                 -- 'Original' | 'Reparo' | 'Avariada'
  notes           text
);
```

#### `drafts` — apenas IndexedDB local (Dexie.js), não persiste no banco
```typescript
// Estrutura local (TypeScript) — sincroniza com inspections quando online
{
  id: string;
  inspectorEmail: string;
  companyId: string;
  customer: CustomerInfo;
  vehicle: VehicleInfo;
  checklistId: string;
  currentStep: number;
  items: InspectionItemResult[];  // fotos como base64 local
  decision: FinalDecision;
  lastSavedAt: string;
}
```

### Row Level Security (RLS) — Supabase

```sql
-- Habilitar RLS em todas as tabelas
alter table companies       enable row level security;
alter table users           enable row level security;
alter table checklists      enable row level security;
alter table inspections     enable row level security;
alter table inspection_items enable row level security;

-- Usuário só vê dados da própria empresa
create policy "empresa própria" on inspections
  for all using (
    company_id = (select company_id from users where id = auth.uid())
  );

-- Admin pode escrever; vistoriador só lê
create policy "admin escreve checklists" on checklists
  for insert, update, delete using (
    (select role from users where id = auth.uid()) = 'admin'
  );
```

### Índices PostgreSQL necessários
```sql
create index on inspections (company_id, created_at desc);
create index on inspections (company_id, inspector_id, created_at desc);
create index on users (company_id, role);
create index on checklist_items (checklist_id, "order");
```

### Supabase Storage — estrutura de buckets
```
bucket: ramos-gear  (público somente para leitura autenticada)
  /{companyId}/
    /inspections/{inspectionId}/
      /photos/{itemId}.jpg
      laudo.pdf
    /logos/logo.png
```

---

## 5. Estrutura de Pastas Angular

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts        ← login, logout, user$ signal
│   │   │   ├── auth.guard.ts          ← protege rotas autenticadas
│   │   │   └── role.guard.ts          ← protege rotas de admin
│   │   ├── inspection/
│   │   │   ├── inspection.service.ts  ← CRUD de vistorias
│   │   │   └── draft.service.ts       ← rascunho local (Dexie)
│   │   ├── pdf/
│   │   │   └── pdf.service.ts         ← geração do laudo
│   │   ├── storage/
│   │   │   └── storage.service.ts     ← upload Firebase Storage
│   │   └── sync/
│   │       └── sync.service.ts        ← fila offline → online
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   └── login.component.html
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts  ← lista vistorias, atalhos
│   │   │   ├── dashboard.routes.ts
│   │   │   └── admin/
│   │   │       ├── users/             ← CRUD usuários
│   │   │       └── checklists/        ← CRUD checklists
│   │   │
│   │   ├── inspection/
│   │   │   ├── start/
│   │   │   │   ├── start.component.ts    ← dados cliente/veículo
│   │   │   │   └── start.component.html
│   │   │   ├── wizard/
│   │   │   │   ├── wizard.component.ts   ← orquestra passos
│   │   │   │   ├── step-photo/
│   │   │   │   │   ├── step-photo.component.ts  ← instrução + câmera
│   │   │   │   │   └── step-photo.component.html
│   │   │   │   └── step-classify/
│   │   │   │       ├── step-classify.component.ts  ← classificação
│   │   │   │       └── step-classify.component.html
│   │   │   ├── summary/
│   │   │   │   ├── summary.component.ts  ← diagrama + decisão final
│   │   │   │   └── summary.component.html
│   │   │   └── inspection.routes.ts
│   │   │
│   │   └── report/
│   │       ├── report.component.ts    ← preview do laudo
│   │       ├── report.component.html  ← template HTML → PDF
│   │       └── report.routes.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── vehicle-diagram/
│   │   │   │   ├── vehicle-diagram.component.ts   ← SVG colorizado
│   │   │   │   └── vehicle-diagram.component.html
│   │   │   ├── camera/
│   │   │   │   └── camera.component.ts   ← <input capture="environment">
│   │   │   └── progress-bar/
│   │   │       └── progress-bar.component.ts
│   │   └── pipes/
│   │       └── classification-color.pipe.ts
│   │
│   ├── app.models.ts      ← interfaces TypeScript (existente)
│   ├── app.data.ts        ← dados padrão e checklists (existente)
│   ├── app.routes.ts      ← rotas raiz (atualmente vazio)
│   ├── app.config.ts      ← providers globais (existente)
│   ├── app.ts             ← componente raiz (existente)
│   └── app.css
│
├── main.ts
├── index.html
└── styles.css
```

---

## 6. Fluxo de Telas (Wireframe)

### Fluxo Principal

```
┌─────────────┐
│    LOGIN     │  → E-mail + senha
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│                  DASHBOARD                       │
│  [+ Nova Vistoria]    [Histórico]   (admin: ⚙️)  │
└──────┬──────────────────────────────────────────┘
       │ Nova Vistoria
       ▼
┌─────────────────────────────────────────────────┐
│           DADOS DO CLIENTE E VEÍCULO             │
│  Nome, Celular, E-mail                           │
│  Marca, Modelo, Ano, Placa                       │
│                          [Iniciar Vistoria →]    │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│        WIZARD — PASSO A PASSO                    │
│  ════════════════░░░░░░  3/6                     │
│                                                  │
│  📷 Lateral esquerda                             │
│  "Fotografe toda a lateral esquerda..."          │
│                                                  │
│              [Abrir Câmera]                      │
└──────┬──────────────────────────────────────────┘
       │ foto capturada
       ▼
┌─────────────────────────────────────────────────┐
│              CLASSIFICAÇÃO                       │
│  [foto miniatura]                                │
│                                                  │
│  Como está a pintura nesta área?                 │
│  ○ Original   ○ Repintura                        │
│  ○ Retrabalhada   ○ Substituída                  │
│                                                  │
│  Observações: [____________________________]     │
│                          [Próxima foto →]        │
└──────┬──────────────────────────────────────────┘
       │ (repete para cada item do checklist)
       ▼
┌─────────────────────────────────────────────────┐
│           RESUMO E DIAGRAMA                      │
│                                                  │
│     [SVG do carro colorizado]                    │
│   Verde=Original  Amarelo=Reparo  Vermelho=Avaria│
│                                                  │
│  Classificação sugerida: ⚠️ Aprovado c/ apontos  │
│  [Aprovado] [Aprv. c/ Apontos] [Não Recomendado] │
│                                                  │
│                     [Gerar Laudo PDF →]          │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│                   LAUDO PDF                      │
│  [preview do laudo]                              │
│                                                  │
│  [📤 Compartilhar]  [⬇️ Baixar]  [📧 E-mail]    │
└─────────────────────────────────────────────────┘
```

### Fluxo Admin

```
Dashboard Admin
  ├── Gerenciar Usuários  → Criar / editar / desativar
  ├── Gerenciar Checklists → Adicionar / remover itens
  ├── Histórico de Vistorias → Filtrar por data/vistoriador
  └── Configurações → Logo, nome da empresa, cor
```

---

## 7. Mapeamento de Funcionalidades

| Funcionalidade | Componente / Serviço | Observação |
|----------------|---------------------|------------|
| Login | `features/auth/login` + `AuthService` | Supabase Auth (grátis) |
| Cadastro de usuários | `features/dashboard/admin/users` | Apenas admin |
| Cadastro cliente/veículo | `features/inspection/start` | Salvo no draft |
| Checklist configurável | `features/dashboard/admin/checklists` | Salvo no Supabase PostgreSQL |
| Wizard guiado | `features/inspection/wizard` | Signal `currentStep` |
| Câmera | `shared/components/camera` | `<input type="file" capture="environment">` |
| Análise pintura | `step-classify` (kind=pintura) | Radio buttons |
| Análise estrutura | `step-classify` (kind=estrutura) | Radio buttons |
| Diagrama SVG | `shared/components/vehicle-diagram` | Cores por classificação |
| Classificação final | `features/inspection/summary` | Sugestão automática |
| Geração de PDF | `PdfService` + `features/report` | jsPDF + html2canvas |
| White-label | `CompanyBranding` injetado no `AppConfig` | Logo + cor CSS var |
| Painel admin | `features/dashboard/admin` | Guard de role |
| Modo offline | `DraftService` (Dexie) + `SyncService` | IndexedDB |

### Algoritmo de Sugestão de Classificação Final

```typescript
function suggestDecision(items: InspectionItemResult[]): FinalDecision {
  const hasAvariada = items.some(i => i.structureClass === 'Avariada');
  const hasSubstituida = items.some(i => i.paintingClass === 'Substituida');
  const hasAnyIssue = items.some(
    i => i.paintingClass !== 'Original' || i.structureClass !== 'Original'
  );

  if (hasAvariada || hasSubstituida) return 'Nao recomendado';
  if (hasAnyIssue) return 'Aprovado com apontamentos';
  return 'Aprovado';
}
```

---

## 8. Modo Offline (PWA + IndexedDB)

### Service Worker
O `@angular/pwa` configura o Workbox automaticamente via `ngsw-config.json`:
- Cache de todos os assets estáticos (app shell)
- Estratégia `NetworkFirst` para chamadas Supabase
- Estratégia `CacheFirst` para imagens do Storage

### IndexedDB com Dexie.js

```typescript
// core/inspection/draft.service.ts
import Dexie, { Table } from 'dexie';
import { AppDraft } from '../../app.models';

class RamosGearDB extends Dexie {
  drafts!: Table<AppDraft>;

  constructor() {
    super('ramos-gear-db');
    this.version(1).stores({ drafts: 'inspectorEmail' });
  }
}

const db = new RamosGearDB();

export class DraftService {
  async save(draft: AppDraft) {
    await db.drafts.put(draft);
  }

  async load(email: string): Promise<AppDraft | undefined> {
    return db.drafts.get(email);
  }

  async clear(email: string) {
    await db.drafts.delete(email);
  }
}
```

### Fila de Sincronização

```typescript
// core/sync/sync.service.ts
// Quando o navegador volta ao online:
window.addEventListener('online', () => this.syncPendingDrafts());

async syncPendingDrafts() {
  const draft = await this.draftService.load(this.auth.currentUser.email);
  if (!draft) return;

  // 1. Upload das fotos para Firebase Storage
  // 2. Salva InspectionRecord no Firestore
  // 3. Limpa o draft local
}
```

---

## 9. Geração de PDF

### Fluxo

```
InspectionRecord (em memória)
        │
        ▼
ReportComponent (HTML oculto renderizado no DOM)
        │
        ▼ html2canvas
Canvas (bitmap do laudo)
        │
        ▼ jsPDF
Blob PDF
        │
   ┌────┴────┐
   ▼         ▼
Download   Upload Firebase Storage → URL salvo na inspection
```

### Estrutura do Laudo PDF

```
┌─────────────────────────────────┐
│  [Logo empresa]   LAUDO CAUTELAR│
│  Ramos Gear                     │
├─────────────────────────────────┤
│  DADOS DO CLIENTE               │
│  Nome: João Silva               │
│  Celular: (11) 99999-0000       │
├─────────────────────────────────┤
│  DADOS DO VEÍCULO               │
│  Toyota Corolla 2020 — ABC-1234 │
├─────────────────────────────────┤
│  FOTOS E CLASSIFICAÇÕES         │
│  [foto] Lateral esq. — Repintura│
│  [foto] Frente — Original       │
│  ...                            │
├─────────────────────────────────┤
│  [Diagrama SVG colorizado]      │
├─────────────────────────────────┤
│  RESULTADO: ⚠️ APROVADO C/ APONTOS│
│  Data: 20/04/2026  Local: SP    │
│  Vistoriador: Carlos Ramos      │
└─────────────────────────────────┘
```

---

## 10. Diagrama Visual do Veículo (SVG)

### Mapeamento de peças → classificação → cor

```typescript
// shared/components/vehicle-diagram/vehicle-diagram.component.ts
const COLOR_MAP = {
  Original:      '#22c55e',  // verde
  Repintura:     '#eab308',  // amarelo
  Retrabalhada:  '#f97316',  // laranja
  Substituida:   '#ef4444',  // vermelho
  Reparo:        '#eab308',  // amarelo
  Avariada:      '#ef4444',  // vermelho
};

// vehiclePart IDs no SVG:
// frente, traseira, lado-esquerdo, lado-direito,
// teto, capo, porta-dianteira-esq, porta-dianteira-dir,
// porta-traseira-esq, porta-traseira-dir, chassi, painel
```

### Template SVG (simplificado)
```html
<!-- vehicle-diagram.component.html -->
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Vista superior do veículo -->
  <rect id="capo"          x="120" y="10"  width="160" height="60"
        [attr.fill]="partColor('capo')"   rx="8"/>
  <rect id="teto"          x="120" y="75"  width="160" height="50"
        [attr.fill]="partColor('teto')"   rx="4"/>
  <rect id="traseira"      x="120" y="130" width="160" height="60"
        [attr.fill]="partColor('traseira')" rx="8"/>
  <rect id="lado-esquerdo" x="20"  y="10"  width="95"  height="180"
        [attr.fill]="partColor('lado-esquerdo')" rx="8"/>
  <rect id="lado-direito"  x="285" y="10"  width="95"  height="180"
        [attr.fill]="partColor('lado-direito')" rx="8"/>
  <!-- Legendas -->
  <text x="10" y="195" font-size="10" fill="#22c55e">■ Original</text>
  <text x="70" y="195" font-size="10" fill="#eab308">■ Reparo/Repintura</text>
  <text x="170" y="195" font-size="10" fill="#ef4444">■ Avaria/Substituída</text>
</svg>
```

---

## 11. Segurança e Permissões

### Supabase Row Level Security (RLS)

O Supabase usa PostgreSQL RLS para garantir isolamento entre empresas. Cada política é definida diretamente no banco — **sem código adicional no frontend**.

```sql
-- companies: usuário vê apenas a própria empresa
create policy "ver empresa" on companies for select
  using (id = (select company_id from users where id = auth.uid()));

create policy "admin edita empresa" on companies for update
  using ((select role from users where id = auth.uid()) = 'admin');

-- users: admin vê todos da empresa; vistoriador vê apenas si mesmo
create policy "ver usuários" on users for select
  using (
    company_id = (select company_id from users where id = auth.uid())
    and (
      (select role from users where id = auth.uid()) = 'admin'
      or id = auth.uid()
    )
  );

create policy "admin cria usuários" on users for insert, update, delete
  using ((select role from users where id = auth.uid()) = 'admin');

-- inspections: todos da empresa leem; admin pode deletar
create policy "ver vistorias" on inspections for select
  using (company_id = (select company_id from users where id = auth.uid()));

create policy "criar vistoria" on inspections for insert
  with check (company_id = (select company_id from users where id = auth.uid()));

create policy "admin deleta vistoria" on inspections for delete
  using ((select role from users where id = auth.uid()) = 'admin');

-- checklists: todos da empresa leem; apenas admin edita
create policy "ver checklists" on checklists for select
  using (company_id = (select company_id from users where id = auth.uid()));

create policy "admin edita checklists" on checklists for insert, update, delete
  using ((select role from users where id = auth.uid()) = 'admin');
```

### Supabase Storage — políticas do bucket

```sql
-- Apenas usuários autenticados da mesma empresa acessam os arquivos
create policy "acesso por empresa" on storage.objects for select
  using (
    auth.role() = 'authenticated' and
    (storage.foldername(name))[1] =
      (select company_id::text from users where id = auth.uid())
  );

create policy "upload por empresa" on storage.objects for insert
  with check (
    auth.role() = 'authenticated' and
    (storage.foldername(name))[1] =
      (select company_id::text from users where id = auth.uid())
  );
```

### Roles no Frontend

| Rota | Guard |
|------|-------|
| `/login` | pública |
| `/dashboard` | `AuthGuard` |
| `/inspection/**` | `AuthGuard` |
| `/admin/**` | `AuthGuard` + `RoleGuard('admin')` |

---

## 12. MVP — Código Inicial

### app.routes.ts (rotas raiz)

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'inspection',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/inspection/inspection.routes').then(m => m.inspectionRoutes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadChildren: () =>
      import('./features/dashboard/admin/admin.routes').then(m => m.adminRoutes),
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

### AuthService (esqueleto — fase 1 usa localStorage; fase 2 migra para Supabase Auth)

```typescript
// core/auth/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../app.models';
import { storageKeys, defaultUsers } from '../../app.data';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadSession());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  login(email: string, password: string): boolean {
    const users: User[] = JSON.parse(
      localStorage.getItem(storageKeys.users) ?? JSON.stringify(defaultUsers)
    );
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return false;
    this._user.set(found);
    localStorage.setItem(storageKeys.session, JSON.stringify(found));
    return true;
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem(storageKeys.session);
  }

  private loadSession(): User | null {
    const raw = localStorage.getItem(storageKeys.session);
    return raw ? JSON.parse(raw) : null;
  }
}

// --- Fase 2: substituir pelo SupabaseAuthService abaixo ---
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//
// async login(email: string, password: string) {
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   if (error) return false;
//   this._user.set(data.user as any);
//   return true;
// }
```

### InspectionService (esqueleto)

```typescript
// core/inspection/inspection.service.ts
import { Injectable, signal } from '@angular/core';
import { InspectionRecord, AppDraft } from '../../app.models';
import { storageKeys } from '../../app.data';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private _inspections = signal<InspectionRecord[]>(this.load());

  readonly inspections = this._inspections.asReadonly();

  save(record: InspectionRecord) {
    const list = [...this._inspections(), record];
    this._inspections.set(list);
    localStorage.setItem(storageKeys.inspections, JSON.stringify(list));
  }

  saveDraft(draft: AppDraft) {
    localStorage.setItem(storageKeys.draft, JSON.stringify(draft));
  }

  loadDraft(): AppDraft | null {
    const raw = localStorage.getItem(storageKeys.draft);
    return raw ? JSON.parse(raw) : null;
  }

  clearDraft() {
    localStorage.removeItem(storageKeys.draft);
  }

  private load(): InspectionRecord[] {
    const raw = localStorage.getItem(storageKeys.inspections);
    return raw ? JSON.parse(raw) : [];
  }
}
```

### PdfService (esqueleto)

```typescript
// core/pdf/pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({ providedIn: 'root' })
export class PdfService {
  async generateFromElement(elementId: string, filename: string): Promise<Blob> {
    const el = document.getElementById(elementId)!;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
    return pdf.output('blob');
  }

  download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### WizardComponent (esqueleto)

```typescript
// features/inspection/wizard/wizard.component.ts
import { Component, signal, computed, inject } from '@angular/core';
import { InspectionService } from '../../../core/inspection/inspection.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ChecklistItemConfig, InspectionItemResult } from '../../../app.models';
import { defaultChecklists } from '../../../app.data';

@Component({
  selector: 'app-wizard',
  standalone: true,
  templateUrl: './wizard.component.html',
})
export class WizardComponent {
  private inspectionService = inject(InspectionService);
  private authService = inject(AuthService);

  items: InspectionItemResult[] = defaultChecklists.padrao.map(cfg => ({
    itemId: cfg.id,
    title: cfg.title,
    instruction: cfg.instruction,
    kind: cfg.kind,
    vehiclePart: cfg.vehiclePart,
    photo: null,
    status: 'pendente',
    notes: '',
  }));

  step = signal(0);
  currentItem = computed(() => this.items[this.step()]);
  progress = computed(() => Math.round(((this.step() + 1) / this.items.length) * 100));
  phase = signal<'photo' | 'classify'>('photo');

  onPhotoCapture(base64: string) {
    this.items[this.step()].photo = base64;
    this.items[this.step()].status = 'capturada';
    this.phase.set('classify');
    this.autosave();
  }

  onClassified() {
    if (this.step() < this.items.length - 1) {
      this.step.update(s => s + 1);
      this.phase.set('photo');
    } else {
      // navegar para summary
    }
    this.autosave();
  }

  private autosave() {
    this.inspectionService.saveDraft({
      inspectorEmail: this.authService.user()!.email,
      customer: { name: '', phone: '', email: '' }, // preenchido no start
      vehicle: { plate: '', brand: '', model: '', year: '' },
      checklistId: 'padrao',
      currentStep: this.step(),
      items: this.items,
      decision: 'Aprovado',
    });
  }
}
```

---

## 13. Roadmap de Evolução

### Fase 1 — MVP (mês 1-2)

> Tudo roda 100% no browser com localStorage. Sem backend, sem deploy, sem custo. Objetivo: app funcional que um vistoriador real consiga usar.

---

#### Etapa 1 — Configuração do projeto ✅ concluida
- [x] Angular 21 com standalone components e signals
- [x] Modelos de dados (`app.models.ts`)
- [x] Dados padrão e checklist (`app.data.ts`)
- [x] Chaves de localStorage (`storageKeys`)
- [x] `app.ts` com `RouterOutlet` e título via signal
- [x] Configurar rotas raiz em `app.routes.ts` (lazy loading por feature)
- [x] Adicionar `withComponentInputBinding()` ao `provideRouter` em `app.config.ts`
- [x] Criar `styles.css` global com variáveis CSS de tema (cor de destaque, fontes)

**Entregável:** projeto compila, roda `ng serve`, rota `/` redireciona para `/login`.

---

#### Etapa 2 — Autenticação (localStorage) 🔄 em andamento

**Checklist:**
- [x] Criar `src/app/core/auth/auth.service.ts` com signals `user`, `isLoggedIn`, `isAdmin`
- [x] Implementar `AuthService.login()` buscando usuário no localStorage (seed com `defaultUsers`)
- [x] Implementar `AuthService.logout()` limpando a chave `ramos-gear.session`
- [x] Criar `src/app/core/auth/auth.guard.ts` redirecionando para `/login` se não autenticado
- [x] Criar `src/app/core/auth/role.guard.ts` redirecionando para `/dashboard` se não for admin
- [x] Criar `src/app/features/auth/login/login.component.ts` com Reactive Form (e-mail + senha)
- [x] Criar `src/app/features/auth/login/login.component.html` com layout de tela cheia
- [x] Campos obrigatórios com mensagem de erro inline ao tocar e sair do campo
- [x] Botão "Entrar" desabilitado enquanto formulário inválido
- [x] Exibir mensagem "E-mail ou senha incorretos" sem revelar qual dos dois falhou
- [x] Registrar a rota `/login` em `app.routes.ts` com `loadComponent`
- [x] Adicionar `AuthGuard` nas rotas `/dashboard`, `/inspection` e `/admin`

**Entregável:** login funcional com os dois usuários demo (`admin@ramosgear.com` / `vistoriador@ramosgear.com`, senha `123456`).

---

#### Etapa 3 — Dashboard (tela inicial) ✅ concluida

**Checklist:**
- [x] Criar `src/app/core/inspection/inspection.service.ts` com signal `inspections` lendo do localStorage
- [x] Criar `src/app/features/dashboard/dashboard.component.ts` injetando `AuthService` e `InspectionService`
- [x] Criar `src/app/features/dashboard/dashboard.component.html` com layout mobile-first
- [x] Exibir nome do usuário logado e nome da empresa no topo
- [x] Botão principal **"+ Nova Vistoria"** em destaque (tamanho grande, cor de destaque)
- [x] Renderizar lista de cards de vistorias: data formatada, `marca modelo ano`, badge de resultado
- [x] Badge colorido: verde=Aprovado, amarelo=Aprovado com apontamentos, vermelho=Não recomendado
- [x] Estado vazio: ilustração ou ícone + mensagem "Nenhuma vistoria realizada ainda"
- [x] Ordenar lista por `createdAt` decrescente, limitar a 20 itens
- [x] Ícone ⚙️ visível apenas quando `isAdmin()` -> navega para `/admin`
- [x] Botão "Sair" chama `AuthService.logout()` e redireciona para `/login`
- [x] Registrar rota `/dashboard` em `app.routes.ts` com `AuthGuard`

**Entregável:** dashboard renderizando lista de vistorias do localStorage.

---

#### Etapa 4 — Cadastro de cliente e veículo ✅ concluida

**Checklist:**
- [x] Criar `src/app/features/inspection/start/start.component.ts` com `ReactiveFormsModule`
- [x] Criar `src/app/features/inspection/start/start.component.html` com formulário em seções (Cliente / Veículo)
- [x] Adicionar `provideReactiveFormsModule` (ou importar `ReactiveFormsModule`) ao componente standalone
- [x] Campo **Nome do cliente**: obrigatório, `minLength(3)`
- [x] Campo **Celular**: obrigatório, validador de padrão `(00) 00000-0000`
- [x] Campo **E-mail do cliente**: opcional, validador `Validators.email`
- [x] Campo **Placa**: obrigatório, regex `[A-Z]{3}-?\d{4}` (antiga) ou `[A-Z]{3}\d[A-Z]\d{2}` (Mercosul)
- [x] Campo **Marca**: obrigatório
- [x] Campo **Modelo**: obrigatório
- [x] Campo **Ano**: obrigatório, `min(1950)`, `max(anoAtual + 1)`
- [x] Exibir erros de validação inline ao tocar e sair de cada campo
- [x] Botão "Iniciar Vistoria" desabilitado enquanto formulário inválido
- [x] Ao submeter: criar `AppDraft` inicial e salvar na chave `ramos-gear.draft` via `InspectionService.saveDraft()`
- [x] Se já existir draft no localStorage: exibir modal/alerta com opções "Continuar anterior" ou "Iniciar nova"
- [x] Navegar para `/inspection/wizard` após salvar o draft
- [x] Registrar rotas `/inspection/start` e `/inspection/wizard` em `inspection.routes.ts`

**Entregável:** formulário validado que inicia o draft e navega para o wizard.

---

#### Etapa 5 — Wizard de vistoria (passo a passo) ✅ concluida

**Checklist:**
- [x] Criar `src/app/shared/components/camera/camera.component.ts` com `<input type="file" accept="image/*" capture="environment">`
- [x] Implementar `compressImage()` no `CameraComponent` via Canvas API (maxWidth 1280, quality 0.7)
- [x] Emitir evento `(photoCapture)` com a string base64 comprimida
- [x] Criar `src/app/features/inspection/wizard/step-photo/step-photo.component.ts` recebendo `@Input() item`
- [x] `StepPhotoComponent`: exibir título + instrução + botão "Fotografar" que aciona o `CameraComponent`
- [x] `StepPhotoComponent`: exibir miniatura após captura + botão "Refazer"
- [x] `StepPhotoComponent`: botão "Confirmar foto" emite `(confirmed)` para o wizard
- [x] Criar `src/app/features/inspection/wizard/step-classify/step-classify.component.ts`
- [x] `StepClassifyComponent`: exibir miniatura da foto + radio buttons conforme `item.kind`
  - `pintura` → Original / Repintura / Retrabalhada / Substituída
  - `estrutura` → Original / Reparo / Avariada
  - `geral` → somente campo de observações (sem radio)
- [x] `StepClassifyComponent`: campo de observações livre (opcional)
- [x] `StepClassifyComponent`: botão "Próximo" desabilitado enquanto nenhuma opção selecionada (exceto `geral`)
- [x] Criar `src/app/features/inspection/wizard/wizard.component.ts` com signals `step` e `phase`
- [x] `WizardComponent`: carregar itens do draft existente (para retomada) ou do checklist padrão
- [x] `WizardComponent`: barra de progresso + texto "Item X de Y — [título]"
- [x] `WizardComponent`: botão "Voltar" navega ao item/fase anterior sem perder dados
- [x] `WizardComponent`: autosave no localStorage via `InspectionService.saveDraft()` após cada classificação
- [x] `WizardComponent`: ao concluir último item, navegar para `/inspection/summary`

**Fluxo por item do checklist:**
1. **Fase foto:** exibe título do item + instrução + botão "Fotografar"
2. Ao clicar, abre `<input type="file" accept="image/*" capture="environment">`
3. Foto capturada é comprimida para JPEG a 70% (via Canvas API) e salva como base64
4. Miniatura da foto aparece com botão "Refazer"
5. Botão "Confirmar foto" avança para fase de classificação
6. **Fase classificação:** exibe foto + radio buttons conforme `kind` do item:
   - `pintura`: Original / Repintura / Retrabalhada / Substituída
   - `estrutura`: Original / Reparo / Avariada
   - `geral`: apenas campo de observações (sem classificação)
7. Campo de observações livre (opcional)
8. Botão "Próximo" avança para o próximo item (ou vai para resumo se for o último)

**Estado e progresso:**
- Barra de progresso no topo: `currentStep / totalItems`
- Texto "Item 3 de 6 — Lateral direita"
- Botão "Voltar" permite revisar item anterior sem perder dados
- Autosave no localStorage após cada classificação

**Compressão de imagens (Camera component):**
```typescript
compressImage(file: File, maxWidth = 1280, quality = 0.7): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = URL.createObjectURL(file);
  });
}
```

**Entregável:** wizard completo percorrendo todos os itens do checklist padrão, com fotos e classificações salvas no draft.

---

#### Etapa 6 — Resumo e diagrama SVG ⏳ não iniciado

**Checklist:**
- [ ] Criar `src/app/shared/components/vehicle-diagram/vehicle-diagram.component.ts` recebendo `@Input() items: InspectionItemResult[]`
- [ ] Criar SVG inline (vista superior do veículo) com `id` em cada `<rect>` correspondendo ao `vehiclePart`
- [ ] Implementar `partColor(vehiclePart: string): string` aplicando `COLOR_MAP` ao pior resultado da peça
- [ ] Bindar `[attr.fill]="partColor(part)"` em cada `<rect>` do SVG
- [ ] Adicionar legenda de cores abaixo do SVG (Verde / Amarelo / Laranja / Vermelho / Cinza)
- [ ] Criar `src/app/features/inspection/summary/summary.component.ts` lendo draft via `InspectionService.loadDraft()`
- [ ] Implementar `suggestDecision(items)` e pré-selecionar o resultado sugerido
- [ ] Criar `src/app/features/inspection/summary/summary.component.html`
- [ ] Exibir lista de todos os itens com miniatura da foto + classificação atribuída
- [ ] Exibir `VehicleDiagramComponent` com os itens do draft
- [ ] Três botões de decisão final; o sugerido aparece destacado (borda ou fundo)
- [ ] Campo de observações gerais da vistoria (opcional)
- [ ] Botão "Gerar Laudo PDF" navega para `/report` passando a decisão escolhida
- [ ] Registrar rota `/inspection/summary` em `inspection.routes.ts`

**Entregável:** tela de resumo com diagrama funcional e seleção da decisão final.

---

#### Etapa 7 — Geração e download do PDF ⏳ não iniciado

**Checklist:**
- [ ] Instalar dependências: `npm install jspdf html2canvas`
- [ ] Criar `src/app/core/pdf/pdf.service.ts` com `generateFromElement(id, filename): Promise<Blob>`
- [ ] `PdfService`: usar `html2canvas(el, { scale: 2, useCORS: true })` para capturar o template
- [ ] `PdfService`: gerar PDF A4 portrait via `jsPDF` e retornar `Blob`
- [ ] `PdfService`: implementar `download(blob, filename)` via `URL.createObjectURL`
- [ ] `PdfService`: implementar `share(blob, filename)` via `navigator.share({ files })` com fallback para download
- [ ] Criar `src/app/features/report/report.component.ts` lendo draft via `InspectionService.loadDraft()`
- [ ] Criar `src/app/features/report/report.component.html` com template do laudo (posicionado fora da viewport: `position:absolute; left:-9999px`)
- [ ] Template do laudo: cabeçalho com logo da empresa + título + data/hora de emissão
- [ ] Template do laudo: seção de dados do cliente (nome, celular, e-mail)
- [ ] Template do laudo: seção de dados do veículo (marca, modelo, ano, placa)
- [ ] Template do laudo: grade de fotos com miniatura + título + classificação de cada item
- [ ] Template do laudo: `VehicleDiagramComponent` inline (SVG exportável)
- [ ] Template do laudo: resultado final em destaque (cor conforme decisão)
- [ ] Template do laudo: nome do vistoriador + nome da empresa no rodapé
- [ ] Ao gerar: criar `InspectionRecord` e salvar no localStorage via `InspectionService.save()`
- [ ] Após salvar: limpar draft via `InspectionService.clearDraft()`
- [ ] Exibir botões "Baixar PDF" e "Compartilhar" (ocultar "Compartilhar" se `navigator.share` não suportado)
- [ ] Botão "Voltar ao início" navega para `/dashboard`
- [ ] Registrar rota `/report` em `app.routes.ts` com `AuthGuard`

**Entregável:** PDF gerado localmente, baixável e compartilhável, vistoria salva no histórico.

---

#### Etapa 8 — Painel admin básico ⏳ não iniciado

**Checklist:**

*Estrutura e rotas:*
- [ ] Criar `src/app/features/dashboard/admin/admin.routes.ts` com sub-rotas `/admin/users`, `/admin/checklists`, `/admin/settings`
- [ ] Registrar `/admin` em `app.routes.ts` com `AuthGuard` + `RoleGuard('admin')` e `loadChildren`
- [ ] Criar tela de navegação admin com menu lateral ou abas (Usuários / Checklist / Configurações)

*Gerenciar usuários:*
- [ ] Criar `src/app/features/dashboard/admin/users/users.component.ts`
- [ ] Listar todos os usuários da empresa (do localStorage) em tabela com nome, e-mail, papel e status
- [ ] Formulário inline para adicionar usuário: nome, e-mail, senha, papel (admin/vistoriador)
- [ ] Gerar `id` único (ex: `crypto.randomUUID()`) ao criar usuário
- [ ] Validar limite máximo de usuários ativos (`defaultBranding.maxUsers = 5`) antes de criar
- [ ] Botão "Desativar" marca `active: false` (não apaga) e atualiza localStorage
- [ ] Usuário desativado aparece na lista com visual desabilitado e não consegue fazer login

*Gerenciar checklist:*
- [ ] Criar `src/app/features/dashboard/admin/checklists/checklists.component.ts`
- [ ] Carregar checklist da chave `ramos-gear.checklists` no localStorage (seed com `defaultChecklists`)
- [ ] Listar itens em ordem com botões ▲ e ▼ para reordenar
- [ ] Formulário para adicionar item: título, instrução, tipo (`pintura`/`estrutura`/`geral`), parte do veículo
- [ ] Botão "Remover" com confirmação (`confirm()` nativo ou modal simples)
- [ ] Botão "Salvar checklist" persiste alterações no localStorage
- [ ] Novo checklist salvo é usado automaticamente nas próximas vistorias

*Configurações da empresa (white-label):*
- [ ] Criar `src/app/features/dashboard/admin/settings/settings.component.ts`
- [ ] Campo para nome da empresa (salvo na chave `ramos-gear.branding`)
- [ ] Upload de logo: `<input type="file" accept="image/*">` → converter para base64 → salvar no localStorage
- [ ] `<input type="color">` para cor de destaque com prévia imediata via `document.documentElement.style.setProperty('--accent', cor)`
- [ ] Botão "Salvar configurações" persiste `CompanyBranding` no localStorage
- [ ] Logo e cor carregados no `app.ts` na inicialização e aplicados globalmente

**Entregável:** admin consegue personalizar a empresa e ajustar o checklist sem tocar no código.

---

#### Critérios de conclusão da Fase 1

| Critério | Verificação |
|----------|------------|
| Login funciona com dois usuários | Testar admin e vistoriador |
| Vistoria completa de ponta a ponta | Percorrer todos os 6 itens padrão com fotos reais |
| PDF gerado corretamente | Abrir PDF e conferir logo, fotos, diagrama e resultado |
| Compartilhamento mobile | Testar `navigator.share` em Android/iOS |
| Draft sobrevive refresh | Iniciar vistoria, fechar aba, reabrir e continuar |
| Admin personaliza checklist | Adicionar e remover item, refazer vistoria com novo checklist |
| White-label básico | Trocar logo e cor, confirmar que aparecem no app e no PDF |

### Fase 2 — Supabase + SaaS (mês 3-4)
> Todos os serviços desta fase são gratuitos no plano free do Supabase + Vercel.

- [ ] Migrar auth para **Supabase Auth** (e-mail/senha, grátis)
- [ ] Migrar banco para **Supabase PostgreSQL** (grátis até 500 MB)
- [ ] Upload de fotos/PDFs para **Supabase Storage** (grátis até 1 GB)
- [ ] PWA com suporte offline real (Service Worker + Dexie)
- [ ] Painel admin completo
- [ ] White-label por empresa
- [ ] Múltiplos checklists configuráveis
- [ ] Histórico de vistorias
- [ ] Deploy automático no **Vercel** via GitHub (grátis)

### Fase 3 — Extras sem custo (mês 5-6)
> Todos os itens abaixo usam serviços gratuitos.

- [ ] Assinatura digital do cliente — **signature_pad** (open source)
- [ ] Geolocalização — **Geolocation API** nativa do browser (grátis)
- [ ] Consulta veicular — **API FIPE** open source (grátis)
- [ ] Envio de laudo por e-mail — **EmailJS** (grátis até 200/mês) ou **Resend** (grátis até 3.000/mês)
- [ ] Dashboard de métricas — consultas SQL no Supabase (grátis)
- [ ] Notificações push — **Web Push API** nativa (grátis)

---

## Referências de Código Existente

| Arquivo | Conteúdo |
|---------|----------|
| [src/app/app.models.ts](src/app/app.models.ts) | Todos os tipos e interfaces TypeScript |
| [src/app/app.data.ts](src/app/app.data.ts) | Usuários demo, checklists padrão, storage keys |
| [src/app/app.routes.ts](src/app/app.routes.ts) | Rotas (a ser preenchido conforme seção 12) |
| [src/app/app.config.ts](src/app/app.config.ts) | Providers globais Angular |

---

*Documento gerado em 20/04/2026 — App Ramos Gear v0.1*
