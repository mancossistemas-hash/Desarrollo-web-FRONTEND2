import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { map, Observable } from 'rxjs';

export interface Kpi { title: string; value: string; }
export interface Card { label: string; path: string; icon?: string; description?: string; }
export interface Alert { type: 'info'|'warning'|'error'|'success'|string; text: string; }
export interface AsientoSimple {
  id: number; fecha: string | null; descripcion: string; debito: number; credito: number;
}
export interface DashboardResponse {
  role: string;
  kpis: Kpi[];
  cards: Card[];
  alerts: Alert[];
  ultimosAsientos: AsientoSimple[];
}

interface BackendDashboardResponse {
  ventasMes?: number;
  gastosMes?: number;
  valorInventario?: number;
  saldoBanco?: number;
  asientosDia?: number;
  descuadreDia?: number;
  ultimosAsientos?: { transaccionId: number; fecha: string; descripcion: string; debito: number; credito: number; }[];
  cobrosHoy?: number;
  pagosHoy?: number;
  topPorCobrar?: { nombre: string; saldoPendiente: number }[];
  topPorPagar?: { nombre: string; saldoPendiente: number }[];
}

function mapToUI(role: string, b: BackendDashboardResponse): DashboardResponse {
  const kpis: Kpi[] = [];
  const alerts: Alert[] = [];
  
  // Cards según rol - todos los módulos disponibles
  const allCards: Card[] = [
    { label: 'Libro Diario', path: '/diario', icon: '📖', description: 'Registro cronológico de transacciones' },
    { label: 'Libro Mayor', path: '/mayor', icon: '📊', description: 'Movimientos por cuenta contable' },
    { label: 'Balances', path: '/balances', icon: '⚖️', description: 'Balance de saldos y estados financieros' },
    { label: 'Bancos y Caja', path: '/bancos-caja', icon: '🏦', description: 'Control de efectivo y bancos' },
    { label: 'Inventario', path: '/inventario', icon: '📦', description: 'Gestión de productos y stock' },
    { label: 'Clientes', path: '/clientes', icon: '👥', description: 'Administración de clientes' },
    { label: 'Proveedores', path: '/proveedores', icon: '🏢', description: 'Administración de proveedores' },
    { label: 'Estado de resultado', path: '/estado-resultado', icon: '📋', description: 'Estado de resultado'}
  ];

  let cards: Card[] = [];

  // Filtrar cards según rol
  if (role === 'ADMINISTRADOR') {
    cards = allCards; // El admin tiene acceso a todo
    kpis.push(
      { title: 'Ventas del mes', value: `Q ${(b.ventasMes ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` },
      { title: 'Gastos del mes', value: `Q ${(b.gastosMes ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` },
      { title: 'Valor Inventario', value: `Q ${(b.valorInventario ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` },
      { title: 'Saldo Banco', value: `Q ${(b.saldoBanco ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` }
    );
  } else if (role === 'CONTADOR') {
    // Contador accede a módulos contables
    cards = allCards.filter(c => 
      ['/diario', '/mayor', '/balances', '/bancos-caja'].includes(c.path)
    );
    kpis.push(
      { title: 'Asientos hoy', value: String(b.asientosDia ?? 0) },
      { title: 'Descuadre hoy', value: `Q ${(b.descuadreDia ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` }
    );
  } else if (role === 'CAJERO') {
    // Cajero accede a bancos, clientes y proveedores
    cards = allCards.filter(c => 
      ['/bancos-caja', '/clientes', '/proveedores', '/inventario'].includes(c.path)
    );
    kpis.push(
      { title: 'Cobros hoy', value: `Q ${(b.cobrosHoy ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` },
      { title: 'Pagos hoy', value: `Q ${(b.pagosHoy ?? 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` }
    );
  }

  // Alerts de ejemplo
  if ((b.descuadreDia ?? 0) > 0 && role === 'CONTADOR') {
    alerts.push({ type: 'warning', text: `⚠️ Hay descuadre de Q ${b.descuadreDia?.toLocaleString('es-GT')} en el libro diario de hoy` });
  }

  if ((b.valorInventario ?? 0) < 5000 && role === 'ADMINISTRADOR') {
    alerts.push({ type: 'info', text: '📦 El inventario está bajo. Considera realizar pedidos.' });
  }

  const ultimos: AsientoSimple[] = (b.ultimosAsientos ?? []).map(a => ({
    id: a.transaccionId,
    fecha: a.fecha ?? null,
    descripcion: a.descripcion,
    debito: a.debito ?? 0,
    credito: a.credito ?? 0,
  }));

  return { role, kpis, cards, alerts, ultimosAsientos: ultimos };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  private getRoleFromStorage(): string {
    return localStorage.getItem('role') || 'ADMINISTRADOR';
  }

  getMetrics(): Observable<DashboardResponse> {
    const apiUrl = `${environment.apiUrl}/dashboard/metrics`;
    console.log('🌐 API URL →', apiUrl);
    
    const role = this.getRoleFromStorage();
    console.log('🎭 Rol detectado →', role);
    
    return this.http
      .get<BackendDashboardResponse>(apiUrl)
      .pipe(
        map(b => {
          console.log('📦 Respuesta raw del backend:', b);
          const mapped = mapToUI(role, b);
          console.log('🔄 Datos mapeados:', mapped);
          return mapped;
        })
      );
  }
}