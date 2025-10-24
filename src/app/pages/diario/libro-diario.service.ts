import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface LibroDiario {
  transaccion_id?: number;
  cuenta: {
    cuentaId: number;        // Backend envía en camelCase
    nombreCuenta?: string;   // Backend envía en camelCase
    codigoCuenta?: string;   // Backend envía en camelCase
    tipoCuenta?: string;     // Backend envía en camelCase
    descripcion?: string;
  };
  fecha: string;
  descripcion: string;
  tipo_operacion: string;
  debito: number;
  credito: number;
  documentoRespaldo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiarioService {
  private apiUrl = 'http://localhost:8080/api/libro-diario';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAll(): Observable<LibroDiario[]> {
    return this.http.get<LibroDiario[]>(`${environment.apiUrl}/libro-diario`, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<LibroDiario> {
    return this.http.get<LibroDiario>(`${environment.apiUrl}/libro-diario/${id}`, { headers: this.getHeaders() });
  }

  create(transaccion: LibroDiario): Observable<LibroDiario> {
    return this.http.post<LibroDiario>(`${environment.apiUrl}/libro-diario`, transaccion, { headers: this.getHeaders() });
  }

  update(id: number, transaccion: LibroDiario): Observable<LibroDiario> {
    return this.http.put<LibroDiario>(`${environment.apiUrl}/libro-diario/${id}`, transaccion, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/libro-diario/${id}`, { headers: this.getHeaders() });
  }
}