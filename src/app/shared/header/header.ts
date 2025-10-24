import { Component, effect, signal, inject, OnInit, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { filter } from 'rxjs';

type NavLink = { label: string; path: string; exact?: boolean; roles?: string[] };

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  appName = 'Sistema Contable';
  
  // Todas las rutas disponibles
  private allNavLinks: NavLink[] = [
    { label: 'Dashboard', path: '/dashboard', exact: true },
    { label: 'Libro Diario', path: '/diario', roles: ['ADMINISTRADOR', 'CONTADOR'] },
    { label: 'Libro Mayor', path: '/mayor', roles: ['ADMINISTRADOR', 'CONTADOR'] },
    { label: 'Balances', path: '/balances', roles: ['ADMINISTRADOR', 'CONTADOR'] },
    { label: 'Bancos/Caja', path: '/bancos-caja' },
    { label: 'Inventario', path: '/inventario' },
    { label: 'Clientes', path: '/clientes' },
    { label: 'Proveedores', path: '/proveedores' },
    { label: 'Estado de Resultados', path: '/estado-resultados' }
  ];

  // Signals
  mobileOpen = signal(false);
  dark = signal(false);
  
  // Referencias directas a los signals del AuthService
  isAuthenticated = this.authService.isAuthenticated;
  userRole = this.authService.currentRole;
  
  // Navegación filtrada según rol
  nav = computed(() => {
    if (!this.isAuthenticated()) return [];
    const role = this.userRole();
    if (!role) return [];
    
    // ADMINISTRADOR ve todo
    if (role === 'ADMINISTRADOR') return this.allNavLinks;
    
    // Filtrar según roles permitidos
    return this.allNavLinks.filter(link => {
      if (!link.roles) return true;
      return link.roles.includes(role);
    });
  });

  constructor() {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    this.dark.set(savedTheme === 'dark');
    
    // Effect para aplicar el tema
    effect(() => {
      const isDark = this.dark();
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  ngOnInit() {
    // Cerrar menú móvil en cada cambio de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobile();
      });
  }

  toggleMobile() { 
    this.mobileOpen.set(!this.mobileOpen()); 
  }
  
  closeMobile() { 
    this.mobileOpen.set(false); 
  }
  
  toggleDark() { 
    this.dark.set(!this.dark()); 
  }

  logout() {
    this.authService.logout();
    this.closeMobile();
    this.router.navigate(['/login']);
  }

  // Generar avatar con iniciales del username
  getAvatarInitials(): string {
    const username = this.authService.getUsername();
    if (!username || username === 'Usuario') return 'U';
    
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username[0].toUpperCase();
  }

  // Username del token
  getUsername(): string {
    return this.authService.getUsername() || 'Usuario';
  }

  // Color de avatar basado en el rol
  getAvatarColor(): string {
    const role = this.userRole();
    const colors: Record<string, string> = {
      'ADMINISTRADOR': '#3b82f6',
      'CONTADOR': '#8b5cf6',
      'CAJERO': '#10b981'
    };
    return colors[role || ''] || '#6b7280';
  }
}