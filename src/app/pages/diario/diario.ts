import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiarioService, LibroDiario } from './libro-diario.service';
import { CuentaService, Cuenta } from '../../cuenta/cuenta.service';

@Component({
  selector: 'app-diario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diario.html',
  styleUrls: ['./diario.css']
})
export class Diario implements OnInit {
  transacciones: LibroDiario[] = [];
  cuentas: Cuenta[] = [];
  
  showModal = false;
  isEditMode = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  currentTransaccion: LibroDiario = this.initTransaccion();

  tiposOperacion = ['Ingreso', 'Gasto', 'Compra', 'Venta', 'Otro'];

  constructor(
    private diarioService: DiarioService,
    private cuentaService: CuentaService
  ) {}

  ngOnInit(): void {
    this.loadCuentas();
  }

  initTransaccion(): LibroDiario {
    return {
      cuenta: { 
        cuentaId: null as any  // Cambiar a null para que funcione con el select
      },
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      tipo_operacion: 'Ingreso',
      debito: 0,
      credito: 0,
      documentoRespaldo: ''
    };
  }

  loadTransacciones(): void {
    this.loading = true;
    this.diarioService.getAll().subscribe({
      next: (data) => {
        console.log('Transacciones cargadas:', data);
        if (data && data.length > 0) {
          console.log('Primera transacción:', data[0]);
        }
        this.transacciones = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar transacciones:', error);
        this.showError('Error al cargar las transacciones: ' + error.message);
        this.loading = false;
      }
    });
  }

  loadCuentas(): void {
    console.log('Cargando cuentas...');
    this.cuentaService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Cuentas cargadas exitosamente:', data);
        console.log('📊 Total de cuentas:', data.length);
        this.cuentas = data;
        
        // Log detallado de cada cuenta
        this.cuentas.forEach((cuenta, index) => {
          console.log(`Cuenta ${index}:`, {
            id: cuenta.cuentaId,
            codigo: cuenta.codigoCuenta,
            nombre: cuenta.nombreCuenta,
            tipo: cuenta.tipoCuenta
          });
        });
        
        if (this.cuentas.length === 0) {
          console.warn('⚠️ No hay cuentas disponibles');
          this.showError('No hay cuentas disponibles. Por favor, cree cuentas primero.');
        }
        
        // Después de cargar las cuentas, cargamos las transacciones
        this.loadTransacciones();
      },
      error: (error) => {
        console.error('❌ Error al cargar cuentas:', error);
        this.showError('Error al cargar cuentas: ' + error.message);
        this.loadTransacciones();
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentTransaccion = this.initTransaccion();
    
    console.log('🔵 ABRIENDO MODAL CREAR');
    console.log('📋 Cuentas disponibles en el modal:', this.cuentas.length);
    console.log('📝 Cuentas array:', this.cuentas);
    console.log('🎯 Transacción inicial:', this.currentTransaccion);
    console.log('🔢 cuenta.cuentaId inicial:', this.currentTransaccion.cuenta.cuentaId);
    
    this.showModal = true;
    this.clearMessages();
  }

  openEditModal(transaccion: LibroDiario): void {
    this.isEditMode = true;
    
    console.log('🟡 ABRIENDO MODAL EDITAR');
    console.log('📄 Transacción a editar:', transaccion);
    console.log('🔢 Cuenta ID de la transacción:', transaccion.cuenta.cuentaId);
    console.log('📋 Cuentas disponibles:', this.cuentas.length);
    
    // Copiar la transacción completa
    this.currentTransaccion = {
      ...transaccion,
      cuenta: { 
        cuentaId: transaccion.cuenta.cuentaId,
        nombreCuenta: transaccion.cuenta.nombreCuenta,
        codigoCuenta: transaccion.cuenta.codigoCuenta,
        tipoCuenta: transaccion.cuenta.tipoCuenta
      }
    };
    
    console.log('✏️ currentTransaccion después de copiar:', this.currentTransaccion);
    console.log('🎯 cuenta.cuentaId asignado:', this.currentTransaccion.cuenta.cuentaId);
    console.log('🔍 Tipo de cuentaId:', typeof this.currentTransaccion.cuenta.cuentaId);
    
    // Verificar si la cuenta existe en el array
    const cuentaExiste = this.cuentas.find(c => c.cuentaId === this.currentTransaccion.cuenta.cuentaId);
    console.log('✅ ¿La cuenta existe en el array?', cuentaExiste ? 'SÍ' : 'NO');
    if (cuentaExiste) {
      console.log('📌 Cuenta encontrada:', cuentaExiste);
    }
    
    this.showModal = true;
    this.clearMessages();
  }

  closeModal(): void {
    console.log('🔴 CERRANDO MODAL');
    this.showModal = false;
    this.currentTransaccion = this.initTransaccion();
    this.clearMessages();
  }

  saveTransaccion(): void {
    console.log('💾 GUARDANDO TRANSACCIÓN');
    console.log('📝 Datos a guardar:', this.currentTransaccion);
    console.log('🔢 cuenta.cuentaId:', this.currentTransaccion.cuenta.cuentaId);
    console.log('🔍 Tipo de cuentaId:', typeof this.currentTransaccion.cuenta.cuentaId);
    
    if (!this.validateTransaccion()) {
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.currentTransaccion.transaccion_id) {
      console.log('✏️ Actualizando transacción ID:', this.currentTransaccion.transaccion_id);
      this.diarioService.update(this.currentTransaccion.transaccion_id, this.currentTransaccion).subscribe({
        next: () => {
          console.log('✅ Transacción actualizada');
          this.showSuccess('Transacción actualizada exitosamente');
          this.loadTransacciones();
          this.closeModal();
        },
        error: (error) => {
          console.error('❌ Error al actualizar:', error);
          this.showError('Error al actualizar: ' + error.message);
          this.loading = false;
        }
      });
    } else {
      console.log('➕ Creando nueva transacción');
      this.diarioService.create(this.currentTransaccion).subscribe({
        next: () => {
          console.log('✅ Transacción creada');
          this.showSuccess('Transacción creada exitosamente');
          this.loadTransacciones();
          this.closeModal();
        },
        error: (error) => {
          console.error('❌ Error al crear:', error);
          this.showError('Error al crear: ' + error.message);
          this.loading = false;
        }
      });
    }
  }

  deleteTransaccion(id: number): void {
    if (!confirm('¿Está seguro de eliminar esta transacción?')) {
      return;
    }

    console.log('🗑️ Eliminando transacción ID:', id);
    this.loading = true;
    this.diarioService.delete(id).subscribe({
      next: () => {
        console.log('✅ Transacción eliminada');
        this.showSuccess('Transacción eliminada exitosamente');
        this.loadTransacciones();
      },
      error: (error) => {
        console.error('❌ Error al eliminar:', error);
        this.showError('Error al eliminar: ' + error.message);
        this.loading = false;
      }
    });
  }

  validateTransaccion(): boolean {
    console.log('🔍 VALIDANDO TRANSACCIÓN');
    console.log('cuenta.cuentaId:', this.currentTransaccion.cuenta.cuentaId);
    console.log('descripcion:', this.currentTransaccion.descripcion);
    console.log('debito:', this.currentTransaccion.debito);
    console.log('credito:', this.currentTransaccion.credito);
    
    if (!this.currentTransaccion.cuenta.cuentaId) {
      console.warn('⚠️ Validación fallida: No hay cuenta seleccionada');
      this.showError('Debe seleccionar una cuenta');
      return false;
    }
    if (!this.currentTransaccion.descripcion.trim()) {
      console.warn('⚠️ Validación fallida: Descripción vacía');
      this.showError('La descripción es requerida');
      return false;
    }
    if (this.currentTransaccion.debito === 0 && this.currentTransaccion.credito === 0) {
      console.warn('⚠️ Validación fallida: Débito y crédito en 0');
      this.showError('Debe ingresar un valor en débito o crédito');
      return false;
    }
    
    console.log('✅ Validación exitosa');
    return true;
  }

  getCuentaNombre(cuentaId: number): string {
    if (!cuentaId) {
      return 'Sin cuenta';
    }
    
    if (this.cuentas.length === 0) {
      return 'Cargando...';
    }
    
    const cuenta = this.cuentas.find(c => c.cuentaId === cuentaId);
    
    if (!cuenta) {
      console.warn(`⚠️ Cuenta no encontrada para ID: ${cuentaId}`);
      return `Cuenta ID: ${cuentaId}`;
    }
    
    return `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}`;
  }

  getCuentaNombreFromTransaccion(transaccion: LibroDiario): string {
    if (transaccion.cuenta && transaccion.cuenta.cuentaId) {
      const codigo_cuenta = transaccion.cuenta.codigoCuenta;
      const nombre_cuenta = transaccion.cuenta.nombreCuenta;
      
      if (codigo_cuenta && nombre_cuenta) {
        return `${codigo_cuenta} - ${nombre_cuenta}`;
      }
      
      return this.getCuentaNombre(transaccion.cuenta.cuentaId);
    }
    
    return 'Sin cuenta';
  }

  getTotalDebito(): number {
    return this.transacciones.reduce((sum, t) => sum + Number(t.debito), 0);
  }

  getTotalCredito(): number {
    return this.transacciones.reduce((sum, t) => sum + Number(t.credito), 0);
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

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Método para debugging del select
  onCuentaChange(event: any): void {
    console.log('🔄 SELECT CHANGE EVENT');
    console.log('Event:', event);
    console.log('Event target value:', event.target.value);
    console.log('currentTransaccion.cuenta.cuentaId:', this.currentTransaccion.cuenta.cuentaId);
    console.log('Tipo:', typeof this.currentTransaccion.cuenta.cuentaId);
  }

  // TrackBy para optimizar el rendering del select
  trackByCuentaId(index: number, cuenta: Cuenta): number {
    return cuenta.cuentaId;
  }
}