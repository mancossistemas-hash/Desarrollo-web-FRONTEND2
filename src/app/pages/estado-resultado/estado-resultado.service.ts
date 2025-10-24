import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface EstadoResultado {
  estadoResultadosId: number;
  fechaInicio: string;  // Formato ISO: YYYY-MM-DD
  fechaFin: string;     // Formato ISO: YYYY-MM-DD
  ingresosTotales: number;
  costosTotales: number;
  gastosTotales: number;
  resultadoNeto: number;
}

export interface EstadoResultadoCreate {
  fechaInicio: string;
  fechaFin: string;
  ingresosTotales: number;
  costosTotales: number;
  gastosTotales: number;
  resultadoNeto: number;
}

export interface GenerarEstadoRequest {
  inicio: string;  // Formato ISO: YYYY-MM-DD
  fin: string;     // Formato ISO: YYYY-MM-DD
}

@Injectable({
  providedIn: 'root'
})
export class EstadoResultadoService {
  private http = inject(HttpClient);

  // Obtener todos los estados de resultado
  getAll(): Observable<EstadoResultado[]> {
    return this.http.get<EstadoResultado[]>(`${environment.apiUrl}/estado-resultados`);
  }

  // Obtener un estado de resultado por ID
  getById(id: number): Observable<EstadoResultado> {
    return this.http.get<EstadoResultado>(`${environment.apiUrl}/estado-resultados/${id}`);
  }

  // Crear nuevo estado de resultado
  create(estadoResultado: EstadoResultadoCreate): Observable<EstadoResultado> {
    return this.http.post<EstadoResultado>(`${environment.apiUrl}/estado-resultados`, estadoResultado);
  }

  // Actualizar estado de resultado existente
  update(id: number, estadoResultado: EstadoResultadoCreate): Observable<EstadoResultado> {
    return this.http.put<EstadoResultado>(`${environment.apiUrl}/estado-resultados/${id}`, estadoResultado);
  }

  // Eliminar estado de resultado
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/estado-resultados/${id}`);
  }

  // Generar estado de resultado por período
  generar(inicio: string, fin: string): Observable<EstadoResultado> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);
    
    return this.http.post<EstadoResultado>(`${environment.apiUrl}/estado-resultados/generar`, null, { params });
  }
}