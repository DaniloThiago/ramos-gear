import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'inspection',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/inspection/inspection.routes').then((m) => m.inspectionRoutes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: 'report',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/report/report.component').then((m) => m.ReportComponent),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
