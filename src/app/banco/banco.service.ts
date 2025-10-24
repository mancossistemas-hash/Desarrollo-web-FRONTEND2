import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Banco {
  bancoId: number;  // CORREGIDO: era 'id', ahora es 'bancoId'
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BancoService {


  constructor(private http: HttpClient) { }

  // Obtener todos los bancos
  getAll(): Observable<Banco[]> {
    return this.http.get<Banco[]>(`${environment.apiUrl}/bancos`);
  }

  // Obtener un banco por ID
  getById(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${environment.apiUrl}/bancos/${id}`);
  }

  // Crear nuevo banco
  create(banco: Banco): Observable<Banco> {
    return this.http.post<Banco>(`${environment.apiUrl}/bancos`, banco);
  }

  // Actualizar banco
  update(id: number, banco: Banco): Observable<Banco> {
    return this.http.put<Banco>(`${environment.apiUrl}/bancos/${id}`, banco);
  }

  // Eliminar banco
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/bancos/${id}`);
  }
}