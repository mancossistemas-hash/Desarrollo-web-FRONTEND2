import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadoResultadoService, EstadoResultado, EstadoResultadoCreate, GenerarEstadoRequest } from './estado-resultado.service';

@Component({
  selector: 'app-estado-resultado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estado-resultado.html',
  styleUrl: './estado-resultado.css'
})
export class EstadoResultadoComponent implements OnInit {
  private estadoResultadoService = inject(EstadoResultadoService);

  // Listas
  estadosResultado: EstadoResultado[] = [];
  estadosFiltrados: EstadoResultado[] = [];
  
  // Filtros
  filtros = {
    fechaInicio: '',
    fechaFin: ''
  };
  
  // Formulario
  estadoForm: EstadoResultadoCreate = this.getEmptyForm();
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  
  // Generar reporte
  mostrarGenerarReporte: boolean = false;
  periodoGenerar = {
    inicio: '',
    fin: ''
  };
  
  // Estados
  cargando: boolean = false;
  error: string = '';
  mensajeExito: string = '';

  // Estado seleccionado para vista detallada
  estadoSeleccionado: EstadoResultado | null = null;
  mostrarDetalle: boolean = false;

  ngOnInit(): void {
    this.cargarEstadosResultado();
  }

  // ===== CARGA DE DATOS =====
  cargarEstadosResultado(): void {
    this.cargando = true;
    this.error = '';
    
    this.estadoResultadoService.getAll().subscribe({
      next: (data) => {
        this.estadosResultado = data;
        this.estadosFiltrados = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los estados de resultado';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  // ===== FILTROS =====
  aplicarFiltros(): void {
    this.estadosFiltrados = this.estadosResultado.filter(estado => {
      let coincide = true;
      
      if (this.filtros.fechaInicio) {
        coincide = coincide && estado.fechaInicio >= this.filtros.fechaInicio;
      }
      
      if (this.filtros.fechaFin) {
        coincide = coincide && estado.fechaFin <= this.filtros.fechaFin;
      }
      
      return coincide;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: '',
      fechaFin: ''
    };
    this.estadosFiltrados = [...this.estadosResultado];
  }

  // ===== CRUD =====
  abrirFormularioNuevo(): void {
    this.estadoForm = this.getEmptyForm();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirFormularioEdicion(estado: EstadoResultado): void {
    this.estadoForm = { 
      fechaInicio: estado.fechaInicio,
      fechaFin: estado.fechaFin,
      ingresosTotales: estado.ingresosTotales,
      costosTotales: estado.costosTotales,
      gastosTotales: estado.gastosTotales,
      resultadoNeto: estado.resultadoNeto
    };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.estadoForm = this.getEmptyForm();
    this.modoEdicion = false;
  }

  guardarEstadoResultado(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.error = '';

    if (this.modoEdicion) {
      // Actualizar - necesitamos el ID del estado seleccionado
      const estadoId = this.estadosResultado.find(e => 
        e.fechaInicio === this.estadoForm.fechaInicio && 
        e.fechaFin === this.estadoForm.fechaFin
      )?.estadoResultadosId;

      if (estadoId) {
        this.estadoResultadoService.update(estadoId, this.estadoForm).subscribe({
          next: () => {
            this.mensajeExito = 'Estado de resultado actualizado exitosamente';
            this.cargarEstadosResultado();
            this.cerrarFormulario();
            this.cargando = false;
            setTimeout(() => this.mensajeExito = '', 3000);
          },
          error: (err) => {
            this.error = err.error?.message || 'Error al actualizar el estado de resultado';
            this.cargando = false;
          }
        });
      }
    } else {
      // Crear
      this.estadoResultadoService.create(this.estadoForm).subscribe({
        next: () => {
          this.mensajeExito = 'Estado de resultado creado exitosamente';
          this.cargarEstadosResultado();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear el estado de resultado';
          this.cargando = false;
        }
      });
    }
  }

  eliminarEstadoResultado(id: number): void {
    if (!confirm('¿Está seguro de eliminar este estado de resultado?')) {
      return;
    }

    this.cargando = true;
    this.estadoResultadoService.delete(id).subscribe({
      next: () => {
        this.mensajeExito = 'Estado de resultado eliminado exitosamente';
        this.cargarEstadosResultado();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al eliminar el estado de resultado';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // ===== GENERAR REPORTE =====
  abrirGenerarReporte(): void {
    // Establecer fechas por defecto (mes actual)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    this.periodoGenerar = {
      inicio: this.formatearFechaISO(primerDiaMes),
      fin: this.formatearFechaISO(ultimoDiaMes)
    };
    
    this.mostrarGenerarReporte = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarGenerarReporte(): void {
    this.mostrarGenerarReporte = false;
    this.periodoGenerar = { inicio: '', fin: '' };
  }

  generarReporte(): void {
    if (!this.validarPeriodoGenerar()) {
      return;
    }

    this.cargando = true;
    this.error = '';

    this.estadoResultadoService.generar(this.periodoGenerar.inicio, this.periodoGenerar.fin).subscribe({
      next: (nuevoEstado) => {
        this.mensajeExito = 'Estado de resultado generado exitosamente';
        this.cargarEstadosResultado();
        this.cerrarGenerarReporte();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al generar el estado de resultado';
        this.cargando = false;
      }
    });
  }

  // ===== VISTA DETALLADA =====
  abrirDetalle(estado: EstadoResultado): void {
    this.estadoSeleccionado = estado;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.estadoSeleccionado = null;
  }

  // ===== VALIDACIÓN =====
  validarFormulario(): boolean {
    if (!this.estadoForm.fechaInicio || !this.estadoForm.fechaFin) {
      this.error = 'Las fechas de inicio y fin son obligatorias';
      return false;
    }
    
    if (new Date(this.estadoForm.fechaFin) < new Date(this.estadoForm.fechaInicio)) {
      this.error = 'La fecha fin no puede ser anterior a la fecha inicio';
      return false;
    }
    
    if (this.estadoForm.ingresosTotales === undefined || this.estadoForm.ingresosTotales < 0) {
      this.error = 'Los ingresos totales deben ser mayor o igual a 0';
      return false;
    }
    
    if (this.estadoForm.costosTotales === undefined || this.estadoForm.costosTotales < 0) {
      this.error = 'Los costos totales deben ser mayor o igual a 0';
      return false;
    }
    
    if (this.estadoForm.gastosTotales === undefined || this.estadoForm.gastosTotales < 0) {
      this.error = 'Los gastos totales deben ser mayor o igual a 0';
      return false;
    }
    
    return true;
  }

  validarPeriodoGenerar(): boolean {
    if (!this.periodoGenerar.inicio || !this.periodoGenerar.fin) {
      this.error = 'Las fechas de inicio y fin son obligatorias';
      return false;
    }
    
    if (new Date(this.periodoGenerar.fin) < new Date(this.periodoGenerar.inicio)) {
      this.error = 'La fecha fin no puede ser anterior a la fecha inicio';
      return false;
    }
    
    return true;
  }

  // ===== UTILIDADES =====
  getEmptyForm(): EstadoResultadoCreate {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    return {
      fechaInicio: this.formatearFechaISO(primerDiaMes),
      fechaFin: this.formatearFechaISO(ultimoDiaMes),
      ingresosTotales: 0,
      costosTotales: 0,
      gastosTotales: 0,
      resultadoNeto: 0
    };
  }

  formatearFechaISO(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  formatearFechaLegible(fechaISO: string): string {
    return new Date(fechaISO).toLocaleDateString('es-GT');
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  }

  calcularUtilidadBruta(estado: EstadoResultado): number {
    return estado.ingresosTotales - estado.costosTotales;
  }

  calcularMargenUtilidadBruta(estado: EstadoResultado): number {
    return estado.ingresosTotales > 0 ? (this.calcularUtilidadBruta(estado) / estado.ingresosTotales) * 100 : 0;
  }

  calcularMargenUtilidadNeta(estado: EstadoResultado): number {
    return estado.ingresosTotales > 0 ? (estado.resultadoNeto / estado.ingresosTotales) * 100 : 0;
  }

  getColorResultado(resultadoNeto: number): string {
    return resultadoNeto >= 0 ? 'resultado-positivo' : 'resultado-negativo';
  }

  getIconoResultado(resultadoNeto: number): string {
    return resultadoNeto >= 0 ? '📈' : '📉';
  }

  getTextoResultado(resultadoNeto: number): string {
    return resultadoNeto >= 0 ? 'Utilidad' : 'Pérdida';
  }

  // Métodos para cálculos de resumen
  getTotalIngresos(): number {
    return this.estadosResultado.reduce((total, estado) => total + estado.ingresosTotales, 0);
  }

  getTotalResultadoNeto(): number {
    return this.estadosResultado.reduce((total, estado) => total + estado.resultadoNeto, 0);
  }

  getEstadosPositivos(): number {
    return this.estadosResultado.filter(estado => estado.resultadoNeto >= 0).length;
  }

  getEstadosNegativos(): number {
    return this.estadosResultado.filter(estado => estado.resultadoNeto < 0).length;
  }

  calcularDiasPeriodo(inicio: string, fin: string): number {
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  const diferencia = fechaFin.getTime() - fechaInicio.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24)) + 1;
}
}