import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface LibroMayor {
  mayorId?: number;
  cuenta: {
    cuentaId: number;
    nombreCuenta?: string;
    codigoCuenta?: string;
    tipoCuenta?: string;
  };
  transaccion: {
    transaccion_id: number;  // Backend envía en snake_case
    descripcion?: string;
    fecha?: string;
    tipo_operacion?: string;
    debito?: number;
    credito?: number;
    documentoRespaldo?: string;
  };
  fecha: string;
  debito: number;
  credito: number;
  saldo?: number;
}

export interface SaldoCuenta {
  cuentaId: number;
  saldo: number;
}

@Injectable({
  providedIn: 'root'
})
export class LibroMayorService {
  private apiUrl = 'http://localhost:8080/api/libro-mayor';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Obtener todos los movimientos del libro mayor
  getAll(): Observable<LibroMayor[]> {
    return this.http.get<LibroMayor[]>(`${environment.apiUrl}/libro-mayor`, { headers: this.getHeaders() });
  }

  // Obtener movimientos por cuenta específica
  getByCuenta(cuentaId: number): Observable<LibroMayor[]> {
    return this.http.get<LibroMayor[]>(`${environment.apiUrl}/libro-mayor/${cuentaId}`, { headers: this.getHeaders() });
  }

  // Obtener saldo de una cuenta
  getSaldoByCuenta(cuentaId: number): Observable<SaldoCuenta> {
    return this.http.get<SaldoCuenta>(`${environment.apiUrl}/libro-mayor/saldo/${cuentaId}`, { headers: this.getHeaders() });
  }
}