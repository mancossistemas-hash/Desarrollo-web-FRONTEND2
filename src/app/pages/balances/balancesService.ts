import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface BalanceSaldo {
  balanceId: number;
  fecha: string;
  cuentaId: number;
  codigoCuenta: string;
  nombreCuenta: string;
  tipoCuenta: string;
  saldoDeudor: number;
  saldoAcreedor: number;
}

@Injectable({
  providedIn: 'root'
})
export class BalanceSaldoService {
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los balances
  getAllBalances(): Observable<BalanceSaldo[]> {
    return this.http.get<BalanceSaldo[]>(`${environment.apiUrl}/balance-saldos`, { headers: this.getHeaders() });
  }

  // Generar balance para una fecha específica
  generarBalance(fecha: string): Observable<BalanceSaldo[]> {
    return this.http.post<BalanceSaldo[]>(
      `${environment.apiUrl}/balance-saldos/generar?fecha=${fecha}`,
      null,
      { headers: this.getHeaders() }
    );
  }

  // Obtener balance por cuenta
  getBalancePorCuenta(cuentaId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/balance-saldos/${cuentaId}`, { headers: this.getHeaders() });
  }
}