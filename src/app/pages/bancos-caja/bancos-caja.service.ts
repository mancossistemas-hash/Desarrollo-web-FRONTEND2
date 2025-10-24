import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface BancoCaja {
  transaccionBancoId?: number;
  fecha: string;
  tipoTransaccion: string;
  monto: number;
  bancoId: number;
  bancoNombre?: string;      // NUEVO
  bancoCodigo?: string;      // NUEVO
  descripcion?: string;
}

export interface ResumenPorTipo {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class BancoCajaService {

  constructor(private http: HttpClient) { }

  // Obtener todas las transacciones con filtros opcionales
  getAll(filters?: {
    bancoId?: number,
    tipo?: string,
    desde?: string,
    hasta?: string
  }): Observable<BancoCaja[]> {
    let params = new HttpParams();
    
    if (filters?.bancoId) {
      params = params.set('bancoId', filters.bancoId.toString());
    }
    if (filters?.tipo) {
      params = params.set('tipo', filters.tipo);
    }
    if (filters?.desde) {
      params = params.set('desde', filters.desde);
    }
    if (filters?.hasta) {
      params = params.set('hasta', filters.hasta);
    }

    return this.http.get<BancoCaja[]>(`${environment.apiUrl}/bancos-caja`, { params });
  }

  // Obtener una transacción por ID
  getById(id: number): Observable<BancoCaja> {
    return this.http.get<BancoCaja>(`${environment.apiUrl}/bancos-caja/${id}`);
  }

  // Crear nueva transacción
  create(transaccion: BancoCaja): Observable<BancoCaja> {
    return this.http.post<BancoCaja>(`${environment.apiUrl}/bancos-caja`, transaccion);
  }

  // Actualizar transacción existente
  update(id: number, transaccion: BancoCaja): Observable<BancoCaja> {
    return this.http.put<BancoCaja>(`${environment.apiUrl}/bancos-caja/${id}`, transaccion);
  }

  // Eliminar transacción
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/bancos-caja/${id}`);
  }

  // Obtener total con filtros
  getTotal(filters?: {
    desde?: string,
    hasta?: string,
    bancoId?: number
  }): Observable<number> {
    let params = new HttpParams();
    
    if (filters?.desde) {
      params = params.set('desde', filters.desde);
    }
    if (filters?.hasta) {
      params = params.set('hasta', filters.hasta);
    }
    if (filters?.bancoId) {
      params = params.set('bancoId', filters.bancoId.toString());
    }

    return this.http.get<number>(`${environment.apiUrl}/bancos-caja/resumen/total`, { params });
  }

  // Obtener total por tipo con filtros
  getTotalPorTipo(filters?: {
    desde?: string,
    hasta?: string,
    bancoId?: number
  }): Observable<ResumenPorTipo> {
    let params = new HttpParams();
    
    if (filters?.desde) {
      params = params.set('desde', filters.desde);
    }
    if (filters?.hasta) {
      params = params.set('hasta', filters.hasta);
    }
    if (filters?.bancoId) {
      params = params.set('bancoId', filters.bancoId.toString());
    }

    return this.http.get<ResumenPorTipo>(`${environment.apiUrl}/bancos-caja/resumen/por-tipo`, { params });
  }
}