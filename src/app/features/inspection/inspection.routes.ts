import { Routes } from '@angular/router';

export const inspectionRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'start',
  },
  {
    path: 'start',
    loadComponent: () =>
      import('./start/start.component').then((m) => m.StartComponent),
  },
  {
    path: 'wizard',
    loadComponent: () =>
      import('./wizard/wizard.component').then((m) => m.WizardComponent),
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('./summary/summary.component').then((m) => m.SummaryComponent),
  },
  {
    path: '**',
    redirectTo: 'start',
  },
];
