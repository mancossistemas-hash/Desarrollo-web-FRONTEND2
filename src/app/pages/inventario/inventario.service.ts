import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface Inventario {
  productoId?: number;
  nombreProducto: string;
  descripcion?: string;
  cantidadExistente: number;
  precioUnitario: number;
  tipoProducto: string;
}

export interface AjusteStockRequest {
  cantidad: number;
  operacion: 'sumar' | 'restar';
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://localhost:8080/api/inventario';

  constructor(private http: HttpClient) { }

  // Obtener todos los productos con filtros opcionales
  getAll(filters?: {
    q?: string,        // CAMBIADO: nombreProducto -> q
    tipo?: string      // CAMBIADO: tipoProducto -> tipo
  }): Observable<Inventario[]> {
    let params = new HttpParams();
    
    // El backend usa 'q' para búsqueda por nombre
    if (filters?.q) {
      params = params.set('q', filters.q);
    }
    // El backend usa 'tipo' para filtrar por tipo
    if (filters?.tipo) {
      params = params.set('tipo', filters.tipo);
    }

    return this.http.get<Inventario[]>(`${environment.apiUrl}/inventario`, { params });
  }

  // Obtener un producto por ID
  getById(id: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${environment.apiUrl}/inventario/${id}`);
  }

  // Crear nuevo producto
  create(producto: Inventario): Observable<Inventario> {
    return this.http.post<Inventario>(`${environment.apiUrl}/inventario`, producto);
  }

  // Actualizar producto existente
  update(id: number, producto: Inventario): Observable<Inventario> {
    return this.http.put<Inventario>(`${environment.apiUrl}/inventario/${id}`, producto);
  }

  // Eliminar producto
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/inventario/${id}`);
  }

  // Ajustar stock - CORREGIDO para usar 'delta' como query param
  ajustarStock(id: number, cantidad: number, operacion: 'sumar' | 'restar'): Observable<Inventario> {
    // El backend espera un parámetro 'delta'
    // Si es 'sumar', delta es positivo
    // Si es 'restar', delta es negativo
    const delta = operacion === 'sumar' ? cantidad : -cantidad;
    
    const params = new HttpParams().set('delta', delta.toString());
    
    return this.http.patch<Inventario>(
      `${environment.apiUrl}/inventario/${id}/ajustar-stock`,
      null,  // Sin body
      { params }
    );
  }

  // Actualizar precio unitario
  actualizarPrecio(id: number, precio: number): Observable<Inventario> {
    const params = new HttpParams().set('valor', precio.toString());
    
    return this.http.patch<Inventario>(
      `${environment.apiUrl}/inventario/${id}/precio`,
      null,  // Sin body
      { params }
    );
  }
}