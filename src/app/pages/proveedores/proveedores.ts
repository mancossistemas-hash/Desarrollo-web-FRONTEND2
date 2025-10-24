import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService, Proveedor, ProveedorCreate } from './proveedores.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css'
})
export class Proveedores implements OnInit {
  private proveedorService = inject(ProveedorService);

  // Listas
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  
  // Filtros
  filtros = {
    q: '',              // Búsqueda por nombreProveedor
    correo: '',         // Filtro por correo
    minSaldo: undefined as number | undefined,  // Saldo mínimo
    maxSaldo: undefined as number | undefined   // Saldo máximo
  };
  
  // Formulario
  proveedorForm: ProveedorCreate = this.getEmptyForm();
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  
  // Operaciones de saldo
  mostrarCargarSaldo: boolean = false;
  mostrarAbonarSaldo: boolean = false;
  mostrarActualizarSaldo: boolean = false;
  proveedorOperacion: Proveedor | null = null;
  montoOperacion: number = 0;
  nuevoSaldo: number = 0;
  
  // Estados
  cargando: boolean = false;
  error: string = '';
  mensajeExito: string = '';

  ngOnInit(): void {
    this.cargarProveedores();
  }

  // ===== CARGA DE DATOS =====
  cargarProveedores(): void {
    this.cargando = true;
    this.error = '';
    
    const filtrosActivos: any = {};
    
    if (this.filtros.q && this.filtros.q !== '') {
      filtrosActivos.q = this.filtros.q;
    }
    if (this.filtros.correo && this.filtros.correo !== '') {
      filtrosActivos.correo = this.filtros.correo;
    }
    if (this.filtros.minSaldo !== undefined) {
      filtrosActivos.minSaldo = this.filtros.minSaldo;
    }
    if (this.filtros.maxSaldo !== undefined) {
      filtrosActivos.maxSaldo = this.filtros.maxSaldo;
    }
    
    const filtrosParaEnviar = Object.keys(filtrosActivos).length > 0 ? filtrosActivos : undefined;
    
    this.proveedorService.getAll(filtrosParaEnviar).subscribe({
      next: (data) => {
        this.proveedores = data;
        this.proveedoresFiltrados = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los proveedores';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  // ===== FILTROS =====
  aplicarFiltros(): void {
    this.cargarProveedores();
  }

  limpiarFiltros(): void {
    this.filtros = {
      q: '',
      correo: '',
      minSaldo: undefined,
      maxSaldo: undefined
    };
    this.aplicarFiltros();
  }

  // ===== CRUD =====
  abrirFormularioNuevo(): void {
    this.proveedorForm = this.getEmptyForm();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirFormularioEdicion(proveedor: Proveedor): void {
    this.proveedorForm = { 
      nombreProveedor: proveedor.nombreProveedor,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      correo: proveedor.correo,
      saldoPendiente: proveedor.saldoPendiente
    };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.proveedorForm = this.getEmptyForm();
    this.modoEdicion = false;
  }

  guardarProveedor(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.error = '';

    if (this.modoEdicion) {
      // Actualizar - necesitamos el ID del proveedor seleccionado
      const proveedorId = this.proveedores.find(p => 
        p.nombreProveedor === this.proveedorForm.nombreProveedor || 
        p.correo === this.proveedorForm.correo
      )?.proveedorId;

      if (proveedorId) {
        this.proveedorService.update(proveedorId, this.proveedorForm).subscribe({
          next: () => {
            this.mensajeExito = 'Proveedor actualizado exitosamente';
            this.cargarProveedores();
            this.cerrarFormulario();
            this.cargando = false;
            setTimeout(() => this.mensajeExito = '', 3000);
          },
          error: (err) => {
            this.error = err.error?.message || 'Error al actualizar el proveedor';
            this.cargando = false;
          }
        });
      }
    } else {
      // Crear
      this.proveedorService.create(this.proveedorForm).subscribe({
        next: () => {
          this.mensajeExito = 'Proveedor creado exitosamente';
          this.cargarProveedores();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear el proveedor';
          this.cargando = false;
        }
      });
    }
  }

  eliminarProveedor(id: number): void {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) {
      return;
    }

    this.cargando = true;
    this.proveedorService.delete(id).subscribe({
      next: () => {
        this.mensajeExito = 'Proveedor eliminado exitosamente';
        this.cargarProveedores();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al eliminar el proveedor';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // ===== OPERACIONES DE SALDO =====
  abrirCargarSaldo(proveedor: Proveedor): void {
    this.proveedorOperacion = proveedor;
    this.montoOperacion = 0;
    this.mostrarCargarSaldo = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirAbonarSaldo(proveedor: Proveedor): void {
    this.proveedorOperacion = proveedor;
    this.montoOperacion = 0;
    this.mostrarAbonarSaldo = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirActualizarSaldo(proveedor: Proveedor): void {
    this.proveedorOperacion = proveedor;
    this.nuevoSaldo = proveedor.saldoPendiente;
    this.mostrarActualizarSaldo = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarOperacionSaldo(): void {
    this.mostrarCargarSaldo = false;
    this.mostrarAbonarSaldo = false;
    this.mostrarActualizarSaldo = false;
    this.proveedorOperacion = null;
    this.montoOperacion = 0;
    this.nuevoSaldo = 0;
  }

  ejecutarCargarSaldo(): void {
    if (!this.proveedorOperacion || this.montoOperacion <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.proveedorService.cargarSaldo(this.proveedorOperacion.proveedorId, this.montoOperacion).subscribe({
      next: () => {
        this.mensajeExito = 'Saldo cargado exitosamente';
        this.cargarProveedores();
        this.cerrarOperacionSaldo();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar el saldo';
        this.cargando = false;
      }
    });
  }

  ejecutarAbonarSaldo(): void {
    if (!this.proveedorOperacion || this.montoOperacion <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return;
    }

    // Validar que el monto a abonar no sea mayor al saldo actual
    if (this.montoOperacion > this.proveedorOperacion.saldoPendiente) {
      this.error = 'El monto a abonar no puede ser mayor al saldo pendiente';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.proveedorService.abonarSaldo(this.proveedorOperacion.proveedorId, this.montoOperacion).subscribe({
      next: () => {
        this.mensajeExito = 'Saldo abonado exitosamente';
        this.cargarProveedores();
        this.cerrarOperacionSaldo();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al abonar el saldo';
        this.cargando = false;
      }
    });
  }

  ejecutarActualizarSaldo(): void {
    if (!this.proveedorOperacion || this.nuevoSaldo < 0) {
      this.error = 'El saldo no puede ser negativo';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.proveedorService.actualizarSaldo(this.proveedorOperacion.proveedorId, this.nuevoSaldo).subscribe({
      next: () => {
        this.mensajeExito = 'Saldo actualizado exitosamente';
        this.cargarProveedores();
        this.cerrarOperacionSaldo();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al actualizar el saldo';
        this.cargando = false;
      }
    });
  }

  // ===== VALIDACIÓN =====
  validarFormulario(): boolean {
    if (!this.proveedorForm.nombreProveedor || this.proveedorForm.nombreProveedor.trim() === '') {
      this.error = 'El nombre del proveedor es obligatorio';
      return false;
    }
    if (!this.proveedorForm.correo || this.proveedorForm.correo.trim() === '') {
      this.error = 'El correo es obligatorio';
      return false;
    }
    if (!this.validarEmail(this.proveedorForm.correo)) {
      this.error = 'El formato del correo no es válido';
      return false;
    }
    if (!this.proveedorForm.telefono || this.proveedorForm.telefono.trim() === '') {
      this.error = 'El teléfono es obligatorio';
      return false;
    }
    if (!this.proveedorForm.direccion || this.proveedorForm.direccion.trim() === '') {
      this.error = 'La dirección es obligatoria';
      return false;
    }
    return true;
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===== UTILIDADES =====
  getEmptyForm(): ProveedorCreate {
    return {
      nombreProveedor: '',
      direccion: '',
      telefono: '',
      correo: '',
      saldoPendiente: 0
    };
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  }

  getEstadoSaldo(saldo: number): { texto: string, clase: string } {
    return saldo > 0 
      ? { texto: 'Pendiente', clase: 'saldo-pendiente' }
      : { texto: 'Al día', clase: 'saldo-al-dia' };
  }

  getTotalSaldoPendiente(): number {
    return this.proveedores.reduce((total, proveedor) => total + proveedor.saldoPendiente, 0);
  }

  getProveedoresConSaldo(): number {
    return this.proveedores.filter(p => p.saldoPendiente > 0).length;
  }

  getProveedoresAlDia(): number {
    return this.proveedores.filter(p => p.saldoPendiente === 0).length;
  }
}