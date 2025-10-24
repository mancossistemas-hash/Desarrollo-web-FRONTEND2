import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibroMayorService, LibroMayor } from './libro-mayor.service';
import { CuentaService, Cuenta } from '../../cuenta/cuenta.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-mayor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mayor.html',
  styleUrls: ['./mayor.css']
})
export class Mayor implements OnInit {
  movimientos: LibroMayor[] = [];
  movimientosFiltrados: LibroMayor[] = [];
  cuentas: Cuenta[] = [];
  
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Filtros
  cuentaSeleccionada: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  
  // Estadísticas
  saldoCuenta: number = 0;
  totalDebitos: number = 0;
  totalCreditos: number = 0;
  
  // Vista
  vistaActual: 'todos' | 'por-cuenta' = 'todos';

  constructor(
    private mayorService: LibroMayorService,
    private cuentaService: CuentaService
  ) {}

  ngOnInit(): void {
    this.inicializarFechas();
    this.loadCuentas();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.fechaInicio = primerDia.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  loadCuentas(): void {
    console.log('📚 Cargando cuentas...');
    this.cuentaService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Cuentas cargadas:', data.length);
        this.cuentas = data;
        this.loadMovimientos();
      },
      error: (error) => {
        console.error('❌ Error al cargar cuentas:', error);
        this.showError('Error al cargar cuentas: ' + error.message);
      }
    });
  }

  loadMovimientos(): void {
    this.loading = true;
    console.log('📖 Cargando movimientos del libro mayor...');
    
    this.mayorService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Movimientos cargados:', data.length);
        if (data && data.length > 0) {
          console.log('🔍 ESTRUCTURA DEL PRIMER MOVIMIENTO:');
          console.log('Movimiento completo:', data[0]);
          console.log('Objeto transaccion:', data[0].transaccion);
          console.log('¿Tiene transaccionId?', data[0].transaccion.transaccion_id);
          console.log('¿Tiene transaccion_id?', (data[0].transaccion as any).transaccion_id);
        }
        this.movimientos = data;
        this.aplicarFiltros();
        this.calcularTotales();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar movimientos:', error);
        this.showError('Error al cargar movimientos: ' + error.message);
        this.loading = false;
      }
    });
  }

  loadMovimientosPorCuenta(cuentaId: number): void {
    if (!cuentaId) return;
    
    this.loading = true;
    console.log(`📖 Cargando movimientos de cuenta ${cuentaId}...`);
    
    this.mayorService.getByCuenta(cuentaId).subscribe({
      next: (data) => {
        console.log('✅ Movimientos de cuenta cargados:', data.length);
        this.movimientos = data;
        this.aplicarFiltros();
        this.calcularTotales();
        this.loadSaldoCuenta(cuentaId);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar movimientos de cuenta:', error);
        this.showError('Error al cargar movimientos: ' + error.message);
        this.loading = false;
      }
    });
  }

  loadSaldoCuenta(cuentaId: number): void {
    this.mayorService.getSaldoByCuenta(cuentaId).subscribe({
      next: (data) => {
        console.log('💰 Saldo de cuenta:', data);
        this.saldoCuenta = data.saldo;
      },
      error: (error) => {
        console.error('❌ Error al cargar saldo:', error);
      }
    });
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros...');
    
    let resultado = [...this.movimientos];
    
    // Filtro por fecha
    if (this.fechaInicio) {
      resultado = resultado.filter(m => m.fecha >= this.fechaInicio);
    }
    if (this.fechaFin) {
      resultado = resultado.filter(m => m.fecha <= this.fechaFin);
    }
    
    // Filtro por cuenta (solo si está seleccionada)
    if (this.cuentaSeleccionada && this.vistaActual === 'todos') {
      resultado = resultado.filter(m => m.cuenta.cuentaId === this.cuentaSeleccionada);
    }
    
    // Ordenar por fecha descendente
    resultado.sort((a, b) => {
      const fechaCompare = b.fecha.localeCompare(a.fecha);
      if (fechaCompare !== 0) return fechaCompare;
      return (b.mayorId || 0) - (a.mayorId || 0);
    });
    
    this.movimientosFiltrados = resultado;
    console.log(`✅ ${resultado.length} movimientos después de filtros`);
  }

  calcularTotales(): void {
    this.totalDebitos = this.movimientosFiltrados.reduce((sum, m) => sum + Number(m.debito), 0);
    this.totalCreditos = this.movimientosFiltrados.reduce((sum, m) => sum + Number(m.credito), 0);
    console.log(`📊 Totales - Débitos: ${this.totalDebitos}, Créditos: ${this.totalCreditos}`);
  }

  onCuentaChange(): void {
    console.log('🔄 Cuenta seleccionada:', this.cuentaSeleccionada);
    
    if (this.vistaActual === 'por-cuenta' && this.cuentaSeleccionada) {
      this.loadMovimientosPorCuenta(this.cuentaSeleccionada);
    } else {
      this.aplicarFiltros();
      this.calcularTotales();
    }
  }

  onFechaChange(): void {
    console.log('📅 Fechas cambiadas:', this.fechaInicio, '-', this.fechaFin);
    this.aplicarFiltros();
    this.calcularTotales();
  }

  cambiarVista(vista: 'todos' | 'por-cuenta'): void {
    console.log('👁️ Cambiando vista a:', vista);
    this.vistaActual = vista;
    this.cuentaSeleccionada = null;
    this.saldoCuenta = 0;
    
    if (vista === 'todos') {
      this.loadMovimientos();
    }
  }

  limpiarFiltros(): void {
    console.log('🧹 Limpiando filtros...');
    this.cuentaSeleccionada = null;
    this.inicializarFechas();
    this.aplicarFiltros();
    this.calcularTotales();
  }

  getCuentaNombre(cuentaId: number): string {
    const cuenta = this.cuentas.find(c => c.cuentaId === cuentaId);
    if (!cuenta) return `Cuenta ID: ${cuentaId}`;
    return `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}`;
  }

  getCuentaNombreFromMovimiento(movimiento: LibroMayor): string {
    if (movimiento.cuenta.codigoCuenta && movimiento.cuenta.nombreCuenta) {
      return `${movimiento.cuenta.codigoCuenta} - ${movimiento.cuenta.nombreCuenta}`;
    }
    return this.getCuentaNombre(movimiento.cuenta.cuentaId);
  }

  getTipoCuentaBadge(movimiento: LibroMayor): string {
    const tipoCuenta = movimiento.cuenta.tipoCuenta?.toLowerCase() || '';
    const map: { [key: string]: string } = {
      'activo': 'tipo-activo',
      'pasivo': 'tipo-pasivo',
      'patrimonio': 'tipo-patrimonio',
      'ingreso': 'tipo-ingreso',
      'gasto': 'tipo-gasto'
    };
    return map[tipoCuenta] || 'tipo-otro';
  }

  exportarExcel(): void {
    console.log('📊 INICIANDO EXPORTACIÓN A EXCEL');
    console.log('Movimientos a exportar:', this.movimientosFiltrados.length);
    
    if (this.movimientosFiltrados.length === 0) {
      this.showError('No hay movimientos para exportar');
      return;
    }

    try {
      // Verificar que XLSX esté disponible
      if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX no está disponible');
        this.showError('Error: Librería XLSX no cargada. Ejecute: npm install xlsx');
        return;
      }

      console.log('✅ XLSX disponible, preparando datos...');

      // Preparar los datos para Excel
      const datosExcel = this.movimientosFiltrados.map(mov => ({
        'ID': mov.mayorId || '',
        'Fecha': mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-GT') : '',
        'Código Cuenta': mov.cuenta?.codigoCuenta || '',
        'Nombre Cuenta': mov.cuenta?.nombreCuenta || '',
        'Tipo Cuenta': mov.cuenta?.tipoCuenta || '',
        'ID Transacción': mov.transaccion?.transaccion_id || '',
        'Descripción': mov.transaccion?.descripcion || '',
        'Débito': Number(mov.debito) || 0,
        'Crédito': Number(mov.credito) || 0,
        'Saldo': mov.saldo !== undefined && mov.saldo !== null ? Number(mov.saldo) : ''
      }));

      console.log('✅ Datos preparados:', datosExcel.length, 'registros');

      // Agregar fila de totales
      datosExcel.push({
        'ID': '',
        'Fecha': '',
        'Código Cuenta': '',
        'Nombre Cuenta': '',
        'Tipo Cuenta': '',
        'ID Transacción': '',
        'Descripción': '** TOTALES **',
        'Débito': this.totalDebitos,
        'Crédito': this.totalCreditos,
        'Saldo': this.totalDebitos - this.totalCreditos
      });

      console.log('✅ Fila de totales agregada');

      // Crear libro de trabajo
      console.log('Creando worksheet...');
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 8 },  // ID
        { wch: 12 }, // Fecha
        { wch: 15 }, // Código Cuenta
        { wch: 30 }, // Nombre Cuenta
        { wch: 15 }, // Tipo Cuenta
        { wch: 15 }, // ID Transacción
        { wch: 40 }, // Descripción
        { wch: 15 }, // Débito
        { wch: 15 }, // Crédito
        { wch: 15 }  // Saldo
      ];

      console.log('✅ Worksheet creado');

      // Crear libro
      console.log('Creando workbook...');
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Libro Mayor');

      console.log('✅ Workbook creado');

      // Generar nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `LibroMayor_${fecha}.xlsx`;

      console.log('Guardando archivo:', nombreArchivo);

      // Guardar archivo
      XLSX.writeFile(wb, nombreArchivo);

      console.log('✅✅✅ EXCEL EXPORTADO EXITOSAMENTE');
      this.showSuccess(`Archivo ${nombreArchivo} descargado exitosamente`);
    } catch (error: any) {
      console.error('❌❌❌ ERROR AL EXPORTAR EXCEL:', error);
      console.error('Stack:', error.stack);
      this.showError('Error al exportar a Excel: ' + (error.message || 'Error desconocido'));
    }
  }

  exportarExcelPorCuenta(): void {
    if (!this.cuentaSeleccionada) {
      this.showError('Debe seleccionar una cuenta');
      return;
    }

    console.log('📊 Exportando Excel por cuenta...');

    try {
      const cuentaInfo = this.cuentas.find(c => c.cuentaId === this.cuentaSeleccionada);
      
      // Preparar datos
      const datosExcel = this.movimientosFiltrados.map(mov => ({
        'ID': mov.mayorId,
        'Fecha': new Date(mov.fecha).toLocaleDateString('es-GT'),
        'ID Transacción': mov.transaccion.transaccion_id,
        'Descripción': mov.transaccion.descripcion || '',
        'Débito': mov.debito,
        'Crédito': mov.credito,
        'Saldo': mov.saldo || ''
      }));

      // Agregar totales
      datosExcel.push({
        'ID': 0,
        'Fecha': '',
        'ID Transacción': 0,
        'Descripción': 'TOTALES',
        'Débito': this.totalDebitos,
        'Crédito': this.totalCreditos,
        'Saldo': this.saldoCuenta
      });

      // Crear worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);

      // Ajustar anchos
      ws['!cols'] = [
        { wch: 8 },
        { wch: 12 },
        { wch: 15 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];

      // Crear workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const nombreHoja = cuentaInfo 
        ? `${cuentaInfo.codigoCuenta} - ${cuentaInfo.nombreCuenta}`.substring(0, 30)
        : 'Libro Mayor';
      
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

      // Guardar
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `LibroMayor_Cuenta${this.cuentaSeleccionada}_${fecha}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      this.showSuccess(`Archivo ${nombreArchivo} descargado exitosamente`);
      console.log('✅ Excel exportado exitosamente');
    } catch (error) {
      console.error('❌ Error al exportar Excel:', error);
      this.showError('Error al exportar a Excel');
    }
  }

  imprimirReporte(): void {
    window.print();
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  trackByMayorId(index: number, item: LibroMayor): number {
    return item.mayorId || index;
  }
}