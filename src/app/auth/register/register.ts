import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  success: string | null = null;

  form = this.fb.group({
    nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['CONTADOR'] // opcional, según tu API
  });

  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = null; this.success = null;
    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.success = 'Usuario creado. Ya puedes iniciar sesión.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo registrar';
        this.loading = false;
      }
    });
  }
}
