import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router} from '@angular/router';
import { DashboardService, DashboardResponse } from './dashboard.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  private api = inject(DashboardService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<DashboardResponse | null>(null);

  ngOnInit() {
    console.log('🎯 Dashboard ngOnInit ejecutado');
    console.log('📍 Token:', localStorage.getItem('token') ? '✅ Existe' : '❌ No existe');
    console.log('👤 Username:', localStorage.getItem('username'));
    console.log('🎭 Role:', localStorage.getItem('role'));
    
    this.loadDashboard();
  }

  private loadDashboard() {
    this.loading.set(true);
    this.error.set(null);
    
    console.log('🔄 Iniciando carga del dashboard...');
    
    this.api.getMetrics().subscribe({
      next: (res) => { 
        console.log('✅ Datos recibidos del backend:', res);
        console.log('📊 KPIs:', res.kpis);
        console.log('🗂️ Cards:', res.cards);
        console.log('⚠️ Alerts:', res.alerts);
        console.log('📝 Últimos asientos:', res.ultimosAsientos);
        
        this.data.set(res); 
        this.loading.set(false);
        
        console.log('✅ Dashboard cargado exitosamente');
      },
      error: (e) => {
        console.error('❌ Error completo:', e);
        console.error('📦 Status:', e.status);
        console.error('📦 StatusText:', e.statusText);
        console.error('📦 Error body:', e.error);
        console.error('📦 Message:', e.message);
        
        const msg =
          e?.error?.message ||
          e?.error?.error ||
          `${e.status} ${e.statusText}` || 
          'No fue posible cargar el dashboard';
        
        this.error.set(msg);
        this.loading.set(false);
        
        console.log('❌ Error establecido:', msg);
      }
    });
  }

  go(path: string) { 
    console.log('🚀 Navegando a:', path);
    this.router.navigate([path]); 
  }

  getFecha(): string {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('es-GT', opciones);
  }
}