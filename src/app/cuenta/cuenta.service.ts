import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Cuenta {
  cuentaId: number;       // Backend envía en camelCase
  codigoCuenta: string;   // Backend envía en camelCase
  nombreCuenta: string;   // Backend envía en camelCase
  tipoCuenta: string;     // Backend envía en camelCase
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CuentaService {
  private apiUrl = 'http://localhost:8080/api/cuentas';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAll(): Observable<Cuenta[]> {
    return this.http.get<Cuenta[]>(`${environment.apiUrl}/cuentas`, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${environment.apiUrl}/cuentas/${id}`, { headers: this.getHeaders() });
  }

  create(cuenta: Cuenta): Observable<Cuenta> {
    return this.http.post<Cuenta>(environment.apiUrl, cuenta, { headers: this.getHeaders() });
  }

  update(id: number, cuenta: Cuenta): Observable<Cuenta> {
    return this.http.put<Cuenta>(`${environment.apiUrl}/cuentas/${id}`, cuenta, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/cuentas/${id}`, { headers: this.getHeaders() });
  }
}