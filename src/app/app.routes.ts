import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./site/site').then((m) => m.SiteComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
