import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente, ClienteCreate } from './clientes.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {
  private clienteService = inject(ClienteService);

  // Listas
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  
  // Filtros
  filtros = {
    q: ''  // Búsqueda por nombreCliente o correo
  };
  
  // Formulario
  clienteForm: ClienteCreate = this.getEmptyForm();
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  
  // Estados
  cargando: boolean = false;
  error: string = '';
  mensajeExito: string = '';

  ngOnInit(): void {
    this.cargarClientes();
  }

  // ===== CARGA DE DATOS =====
  cargarClientes(): void {
    this.cargando = true;
    this.error = '';
    
    const filtrosActivos: any = {};
    
    if (this.filtros.q && this.filtros.q !== '') {
      filtrosActivos.q = this.filtros.q;
    }
    
    const filtrosParaEnviar = Object.keys(filtrosActivos).length > 0 ? filtrosActivos : undefined;
    
    this.clienteService.getAll(filtrosParaEnviar).subscribe({
      next: (data) => {
        this.clientes = data;
        this.clientesFiltrados = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los clientes';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  // ===== FILTROS =====
  aplicarFiltros(): void {
    this.cargarClientes();
  }

  limpiarFiltros(): void {
    this.filtros = { q: '' };
    this.aplicarFiltros();
  }

  // ===== CRUD =====
  abrirFormularioNuevo(): void {
    this.clienteForm = this.getEmptyForm();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirFormularioEdicion(cliente: Cliente): void {
    this.clienteForm = { 
      nombreCliente: cliente.nombreCliente,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      correo: cliente.correo,
      saldoPendiente: cliente.saldoPendiente
    };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.clienteForm = this.getEmptyForm();
    this.modoEdicion = false;
  }

  guardarCliente(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.error = '';

    if (this.modoEdicion) {
      // Actualizar
      const clienteId = this.clientes.find(c => 
        c.nombreCliente === this.clienteForm.nombreCliente || 
        c.correo === this.clienteForm.correo
      )?.clienteId;

      if (clienteId) {
        this.clienteService.update(clienteId, this.clienteForm).subscribe({
          next: () => {
            this.mensajeExito = 'Cliente actualizado exitosamente';
            this.cargarClientes();
            this.cerrarFormulario();
            this.cargando = false;
            setTimeout(() => this.mensajeExito = '', 3000);
          },
          error: (err) => {
            this.error = err.error?.message || 'Error al actualizar el cliente';
            this.cargando = false;
          }
        });
      }
    } else {
      // Crear
      this.clienteService.create(this.clienteForm).subscribe({
        next: () => {
          this.mensajeExito = 'Cliente creado exitosamente';
          this.cargarClientes();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear el cliente';
          this.cargando = false;
        }
      });
    }
  }

  eliminarCliente(id: number): void {
    if (!confirm('¿Está seguro de eliminar este cliente?')) {
      return;
    }

    this.cargando = true;
    this.clienteService.delete(id).subscribe({
      next: () => {
        this.mensajeExito = 'Cliente eliminado exitosamente';
        this.cargarClientes();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al eliminar el cliente';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // ===== VALIDACIÓN =====
  validarFormulario(): boolean {
    if (!this.clienteForm.nombreCliente || this.clienteForm.nombreCliente.trim() === '') {
      this.error = 'El nombre del cliente es obligatorio';
      return false;
    }
    if (!this.clienteForm.correo || this.clienteForm.correo.trim() === '') {
      this.error = 'El correo es obligatorio';
      return false;
    }
    if (!this.validarEmail(this.clienteForm.correo)) {
      this.error = 'El formato del correo no es válido';
      return false;
    }
    if (!this.clienteForm.telefono || this.clienteForm.telefono.trim() === '') {
      this.error = 'El teléfono es obligatorio';
      return false;
    }
    if (!this.clienteForm.direccion || this.clienteForm.direccion.trim() === '') {
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
  getEmptyForm(): ClienteCreate {
    return {
      nombreCliente: '',
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
    return this.clientes.reduce((total, cliente) => total + cliente.saldoPendiente, 0);
  }

  getClientesConSaldo(): number {
    return this.clientes.filter(c => c.saldoPendiente > 0).length;
  }

  getClientesAlDia(): number {
    return this.clientes.filter(c => c.saldoPendiente === 0).length;
  }
}