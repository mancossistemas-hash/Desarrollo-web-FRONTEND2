import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Reactive Form
  form!: FormGroup;
  
  // UI state
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  ngOnInit() {
    // Inicializar el formulario
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  OnSubmit() {
    // Limpiar error previo
    this.error.set(null);

    // Validar formulario
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);

    const { email, password } = this.form.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        this.loading.set(false);
        
        const errorMsg = err?.error?.message || 
                        err?.error?.error || 
                        err?.message ||
                        'Credenciales inválidas. Por favor intenta nuevamente.';
        this.error.set(errorMsg);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  // Getters para acceder fácilmente a los controles
  get emailControl() {
    return this.form.get('email');
  }

  get passwordControl() {
    return this.form.get('password');
  }

  // Helpers para mostrar errores
  getEmailError(): string | null {
    const control = this.emailControl;
    if (control?.hasError('required') && control.touched) {
      return 'El correo es requerido';
    }
    if (control?.hasError('email') && control.touched) {
      return 'Ingresa un correo válido';
    }
    return null;
  }

  getPasswordError(): string | null {
    const control = this.passwordControl;
    if (control?.hasError('required') && control.touched) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('minlength') && control.touched) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  }
}