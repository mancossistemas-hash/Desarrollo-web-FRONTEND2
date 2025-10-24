import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface Proveedor {
  proveedorId: number;
  nombreProveedor: string;
  direccion: string;
  telefono: string;
  correo: string;
  saldoPendiente: number;
}

export interface ProveedorCreate {
  nombreProveedor: string;
  direccion: string;
  telefono: string;
  correo: string;
  saldoPendiente?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);

  // Obtener todos los proveedores con filtros opcionales
  getAll(filters?: {
    q?: string;              // Búsqueda por nombreProveedor
    correo?: string;         // Filtro por correo específico
    minSaldo?: number;       // Saldo mínimo
    maxSaldo?: number;       // Saldo máximo
  }): Observable<Proveedor[]> {
    let params = new HttpParams();
    
    if (filters?.q) {
      params = params.set('q', filters.q);
    }
    if (filters?.correo) {
      params = params.set('correo', filters.correo);
    }
    if (filters?.minSaldo !== undefined) {
      params = params.set('minSaldo', filters.minSaldo.toString());
    }
    if (filters?.maxSaldo !== undefined) {
      params = params.set('maxSaldo', filters.maxSaldo.toString());
    }

    return this.http.get<Proveedor[]>(`${environment.apiUrl}/proveedores`, { params });
  }

  // Obtener un proveedor por ID
  getById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${environment.apiUrl}/proveedores/${id}`);
  }

  // Crear nuevo proveedor
  create(proveedor: ProveedorCreate): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${environment.apiUrl}/proveedores`, proveedor);
  }

  // Actualizar proveedor existente
  update(id: number, proveedor: ProveedorCreate): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${environment.apiUrl}/proveedores/${id}`, proveedor);
  }

  // Eliminar proveedor
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/proveedores/${id}`);
  }

  // Operaciones de saldo
  cargarSaldo(id: number, monto: number): Observable<Proveedor> {
    const params = new HttpParams().set('monto', monto.toString());
    return this.http.patch<Proveedor>(`${environment.apiUrl}/proveedores/${id}/cargar`, null, { params });
  }

  abonarSaldo(id: number, monto: number): Observable<Proveedor> {
    const params = new HttpParams().set('monto', monto.toString());
    return this.http.patch<Proveedor>(`${environment.apiUrl}/proveedores/${id}/abonar`, null, { params });
  }

  actualizarSaldo(id: number, valor: number): Observable<Proveedor> {
    const params = new HttpParams().set('valor', valor.toString());
    return this.http.patch<Proveedor>(`${environment.apiUrl}/proveedores/${id}/saldo`, null, { params });
  }
}