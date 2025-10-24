import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface Cliente {
  clienteId: number;
  nombreCliente: string;
  direccion: string;
  telefono: string;
  correo: string;
  saldoPendiente: number;
}

export interface ClienteCreate {
  nombreCliente: string;
  direccion: string;
  telefono: string;
  correo: string;
  saldoPendiente?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);

  // Obtener todos los clientes con filtros opcionales
  getAll(filters?: {
    q?: string;        // Búsqueda por nombreCliente o correo
  }): Observable<Cliente[]> {
    let params = new HttpParams();
    
    if (filters?.q) {
      params = params.set('q', filters.q);
    }

    return this.http.get<Cliente[]>(`${environment.apiUrl}/clientes`, { params });
  }

  // Obtener un cliente por ID
  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${environment.apiUrl}/clientes/${id}`);
  }

  // Crear nuevo cliente
  create(cliente: ClienteCreate): Observable<Cliente> {
    return this.http.post<Cliente>(`${environment.apiUrl}/clientes`, cliente);
  }

  // Actualizar cliente existente
  update(id: number, cliente: ClienteCreate): Observable<Cliente> {
    return this.http.put<Cliente>(`${environment.apiUrl}/clientes/${id}`, cliente);
  }

  // Eliminar cliente
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/clientes/${id}`);
  }
}