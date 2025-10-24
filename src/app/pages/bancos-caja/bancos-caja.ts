import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BancoCajaService, BancoCaja, ResumenPorTipo } from './bancos-caja.service';
import { BancoService, Banco } from '../../banco/banco.service';

@Component({
  selector: 'app-bancos-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bancos-caja.html',
  styleUrl: './bancos-caja.css'
})
export class BancosCaja implements OnInit {
  // Listas
  transacciones: BancoCaja[] = [];
  transaccionesFiltradas: BancoCaja[] = [];
  bancos: Banco[] = [];
  
  // Resúmenes
  totalGeneral: number = 0;
  totalPorTipo: ResumenPorTipo = {};
  
  // Filtros
  filtros = {
    bancoId: undefined as number | undefined,
    tipo: '',
    desde: '',
    hasta: ''
  };
  
  // Formulario
  transaccionForm: BancoCaja = this.getEmptyForm();
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  
  // Tipos de transacción disponibles
  tiposTransaccion: string[] = ['Depósito', 'Cheque Emitido', 'Pago', 'Cobro'];
  
  // Estado
  cargando: boolean = false;
  error: string = '';
  mensajeExito: string = '';

  constructor(
    private bancoCajaService: BancoCajaService,
    private bancoService: BancoService
  ) {}

  ngOnInit(): void {
    this.cargarBancos();
    this.cargarTransacciones();
    this.cargarResumenes();
  }

  // ===== CARGA DE DATOS =====
  cargarBancos(): void {
    this.bancoService.getAll().subscribe({
      next: (data) => {
        this.bancos = data;
        console.log('Bancos cargados:', this.bancos); // Debug
      },
      error: (err) => {
        console.error('Error al cargar bancos:', err);
        // Si no hay endpoint de bancos, crear lista por defecto
        this.bancos = [
          { bancoId: 1, nombre: 'Banco Principal' },
          { bancoId: 2, nombre: 'Banco Secundario' },
          { bancoId: 3, nombre: 'Caja Chica' }
        ];
      }
    });
  }

  cargarTransacciones(): void {
    this.cargando = true;
    this.error = '';
    
    // Construir objeto de filtros solo con valores definidos
    const filtrosActivos: any = {};
    
    if (this.filtros.bancoId !== undefined && this.filtros.bancoId !== null) {
      filtrosActivos.bancoId = this.filtros.bancoId;
    }
    if (this.filtros.tipo && this.filtros.tipo !== '') {
      filtrosActivos.tipo = this.filtros.tipo;
    }
    if (this.filtros.desde && this.filtros.desde !== '') {
      filtrosActivos.desde = this.filtros.desde;
    }
    if (this.filtros.hasta && this.filtros.hasta !== '') {
      filtrosActivos.hasta = this.filtros.hasta;
    }
    
    // Solo pasar filtros si hay alguno activo
    const filtrosParaEnviar = Object.keys(filtrosActivos).length > 0 ? filtrosActivos : undefined;
    
    this.bancoCajaService.getAll(filtrosParaEnviar).subscribe({
      next: (data) => {
        this.transacciones = data;
        this.transaccionesFiltradas = data;
        this.cargando = false;
        console.log('Transacciones cargadas:', data.length); // Debug
      },
      error: (err) => {
        this.error = 'Error al cargar las transacciones';
        console.error('Error detallado:', err);
        this.cargando = false;
      }
    });
  }

  cargarResumenes(): void {
    // Construir objeto de filtros solo con valores definidos
    const filtrosActivos: any = {};
    
    if (this.filtros.bancoId !== undefined && this.filtros.bancoId !== null) {
      filtrosActivos.bancoId = this.filtros.bancoId;
    }
    if (this.filtros.desde && this.filtros.desde !== '') {
      filtrosActivos.desde = this.filtros.desde;
    }
    if (this.filtros.hasta && this.filtros.hasta !== '') {
      filtrosActivos.hasta = this.filtros.hasta;
    }
    
    const filtrosParaEnviar = Object.keys(filtrosActivos).length > 0 ? filtrosActivos : undefined;
    
    // Cargar total general
    this.bancoCajaService.getTotal(filtrosParaEnviar).subscribe({
      next: (total) => {
        this.totalGeneral = total;
        console.log('Total general:', total); // Debug
      },
      error: (err) => {
        console.error('Error al cargar total:', err);
      }
    });

    // Cargar total por tipo
    this.bancoCajaService.getTotalPorTipo(filtrosParaEnviar).subscribe({
      next: (totales) => {
        this.totalPorTipo = totales;
        console.log('Total por tipo:', totales); // Debug
      },
      error: (err) => {
        console.error('Error al cargar totales por tipo:', err);
      }
    });
  }

  // ===== FILTROS =====
  aplicarFiltros(): void {
    console.log('Aplicando filtros:', this.filtros); // Debug
    this.cargarTransacciones();
    this.cargarResumenes();
  }

  limpiarFiltros(): void {
    this.filtros = {
      bancoId: undefined,
      tipo: '',
      desde: '',
      hasta: ''
    };
    this.aplicarFiltros();
  }

  // ===== CRUD =====
  abrirFormularioNuevo(): void {
    this.transaccionForm = this.getEmptyForm();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirFormularioEdicion(transaccion: BancoCaja): void {
    this.transaccionForm = { ...transaccion };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.transaccionForm = this.getEmptyForm();
    this.modoEdicion = false;
  }

  guardarTransaccion(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.error = '';

    // Crear una copia limpia del formulario sin los campos extras del backend
    const transaccionParaEnviar: BancoCaja = {
      fecha: this.transaccionForm.fecha,
      tipoTransaccion: this.transaccionForm.tipoTransaccion,
      monto: this.transaccionForm.monto,
      bancoId: this.transaccionForm.bancoId,
      descripcion: this.transaccionForm.descripcion || ''
    };

    console.log('Guardando transacción:', transaccionParaEnviar); // Debug

    if (this.modoEdicion && this.transaccionForm.transaccionBancoId) {
      // Actualizar
      this.bancoCajaService.update(
        this.transaccionForm.transaccionBancoId,
        transaccionParaEnviar
      ).subscribe({
        next: (response) => {
          console.log('Respuesta actualización:', response); // Debug
          this.mensajeExito = 'Transacción actualizada exitosamente';
          this.cargarTransacciones();
          this.cargarResumenes();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          console.error('Error al actualizar:', err); // Debug
          this.error = err.error?.message || err.message || 'Error al actualizar la transacción';
          this.cargando = false;
        }
      });
    } else {
      // Crear
      this.bancoCajaService.create(transaccionParaEnviar).subscribe({
        next: (response) => {
          console.log('Respuesta creación:', response); // Debug
          this.mensajeExito = 'Transacción creada exitosamente';
          this.cargarTransacciones();
          this.cargarResumenes();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          console.error('Error al crear:', err); // Debug
          this.error = err.error?.message || err.message || 'Error al crear la transacción';
          this.cargando = false;
        }
      });
    }
  }

  eliminarTransaccion(id: number): void {
    if (!confirm('¿Está seguro de eliminar esta transacción?')) {
      return;
    }

    this.cargando = true;
    this.bancoCajaService.delete(id).subscribe({
      next: () => {
        this.mensajeExito = 'Transacción eliminada exitosamente';
        this.cargarTransacciones();
        this.cargarResumenes();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al eliminar la transacción';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // ===== VALIDACIÓN =====
  validarFormulario(): boolean {
    if (!this.transaccionForm.fecha) {
      this.error = 'La fecha es obligatoria';
      return false;
    }
    if (!this.transaccionForm.tipoTransaccion) {
      this.error = 'El tipo de transacción es obligatorio';
      return false;
    }
    if (!this.transaccionForm.monto || this.transaccionForm.monto <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return false;
    }
    if (!this.transaccionForm.bancoId) {
      this.error = 'El banco es obligatorio';
      return false;
    }
    return true;
  }

  // ===== UTILIDADES =====
  getEmptyForm(): BancoCaja {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      fecha: hoy,
      tipoTransaccion: '',
      monto: 0,
      bancoId: this.bancos.length > 0 ? this.bancos[0].bancoId : 1,
      descripcion: ''
    };
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTotalPorTipoArray(): { tipo: string, total: number }[] {
    return Object.entries(this.totalPorTipo).map(([tipo, total]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      total
    }));
  }

  getColorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      'depósito': '#10b981',
      'cheque emitido': '#f59e0b',
      'pago': '#ef4444',
      'cobro': '#3b82f6'
    };
    return colores[tipo.toLowerCase()] || '#6b7280';
  }

  getNombreBanco(transaccion: BancoCaja): string {
    // Si viene el nombre desde el backend, usarlo directamente
    if (transaccion.bancoNombre) {
      return transaccion.bancoNombre;
    }
    // Fallback: buscar en la lista local
    const banco = this.bancos.find(b => b.bancoId === transaccion.bancoId);
    return banco ? banco.nombre : `Banco #${transaccion.bancoId}`;
  }
}