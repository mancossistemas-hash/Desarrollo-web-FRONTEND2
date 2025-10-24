import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.Register) },


  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'diario', loadComponent: () => import('./pages/diario/diario').then(m => m.Diario) },
  { path: 'mayor', loadComponent: () => import('./pages/mayor/mayor').then(m => m.Mayor) },
  { path: 'balances', loadComponent: () => import('./pages/balances/balances').then(m => m.Balances) },
  { path: 'bancos-caja', loadComponent: () => import('./pages/bancos-caja/bancos-caja').then(m => m.BancosCaja) },
  { path: 'inventario', loadComponent: () => import('./pages/inventario/inventario').then(m => m.InventarioComponent) },
  { path: 'clientes', loadComponent: () => import('./pages/clientes/clientes').then(m => m.Clientes) },
  { path: 'proveedores', loadComponent: () => import('./pages/proveedores/proveedores').then(m => m.Proveedores) },
  { path: 'estado-resultados', loadComponent: () => import('./pages/estado-resultado/estado-resultado').then(m => m.EstadoResultadoComponent) },
  
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) }
];
