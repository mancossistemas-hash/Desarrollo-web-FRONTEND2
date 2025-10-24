import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email?: string;  // Opcional
  role?: string;   // Opcional
}

export interface RegisterRequest {
  nombreUsuario: string;
  email: string;
  password: string;
  rolId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Keys para localStorage
  private readonly TOKEN_KEY = 'token';
  private readonly USERNAME_KEY = 'username';
  private readonly ROLE_KEY = 'role';

  // Signals para el estado de autenticación (nombres consistentes)
  isAuth = signal(false);
  userRole = signal<string | null>(null);
  userName = signal<string | null>(null);

  // DEPRECATED: Mantener compatibilidad con código antiguo
  get isAuthenticated() { return this.isAuth; }
  get currentRole() { return this.userRole; }
  get currentUser() { return this.userName; }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar si hay sesión al iniciar
    this.checkStoredAuth();
  }

  private checkStoredAuth() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const username = localStorage.getItem(this.USERNAME_KEY);
    let role = localStorage.getItem(this.ROLE_KEY);

    if (token && username && role) {
      // Normalizar rol a mayúsculas
      role = role.toUpperCase();
      localStorage.setItem(this.ROLE_KEY, role); // Actualizar en storage
      
      this.isAuth.set(true);
      this.userName.set(username);
      this.userRole.set(role);
      console.log('🔐 Sesión restaurada:', { username, role });
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('📦 Respuesta del backend:', response);
          
          // Extraer datos del token si no vienen en la respuesta
          let username: string;
          let role: string;

          if (response.email) {
            // Si viene el email en la respuesta
            username = response.email.split('@')[0];
            role = response.role || 'USER';
          } else {
            // Extraer del token JWT
            const tokenData = this.decodeToken(response.token);
            username = tokenData.username || tokenData.sub?.split('@')[0] || 'usuario';
            role = tokenData.role || tokenData.authorities || 'USER';
          }

          // Limpiar el prefijo ROLE_ si existe
          if (typeof role === 'string' && role.startsWith('ROLE_')) {
            role = role.substring(5);
          }

          // NORMALIZAR A MAYÚSCULAS para consistencia
          role = role.toUpperCase();
          
          console.log('🔄 Rol normalizado a:', role);
          
          // Guardar en localStorage
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USERNAME_KEY, username);
          localStorage.setItem(this.ROLE_KEY, role);

          // Actualizar signals
          this.isAuth.set(true);
          this.userName.set(username);
          this.userRole.set(role);

          console.log('✅ Login exitoso:', { username, role });
        })
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, data);
  }

  logout() {
    // Limpiar localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.ROLE_KEY);

    // Resetear signals
    this.isAuth.set(false);
    this.userName.set(null);
    this.userRole.set(null);

    console.log('👋 Sesión cerrada');

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  // Getters para acceso directo
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  // Helpers de autorización
  hasRole(role: string): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }

  // Verificar si el token es válido (no expirado)
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      
      if (!exp) return true; // Si no tiene expiración, asumimos válido
      
      const now = Math.floor(Date.now() / 1000);
      return exp > now;
    } catch {
      return false;
    }
  }

  // Decodificar token JWT
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('❌ Error decodificando token:', error);
      return {};
    }
  }
}