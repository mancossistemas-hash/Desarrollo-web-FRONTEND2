import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalanceSaldoService, BalanceSaldo } from './balancesService';

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balances.html',
  styleUrl: './balances.css'
})
export class Balances implements OnInit {
  balances: BalanceSaldo[] = [];
  balancesFiltrados: BalanceSaldo[] = [];
  
  // Filtros
  fechaSeleccionada: string = '';
  tipoCuentaFiltro: string = '';
  busquedaTexto: string = '';
  
  // Estado
  cargando: boolean = false;
  error: string = '';
  mostrarModalGenerar: boolean = false;
  fechaGenerar: string = '';
  
  // Totales
  totalDeudor: number = 0;
  totalAcreedor: number = 0;
  
  // Tipos de cuenta únicos
  tiposCuenta: string[] = [];

  constructor(private balanceSaldoService: BalanceSaldoService) {
    // Establecer fecha actual por defecto
    const hoy = new Date();
    this.fechaGenerar = hoy.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarBalances();
  }

  cargarBalances(): void {
    this.cargando = true;
    this.error = '';
    
    this.balanceSaldoService.getAllBalances().subscribe({
      next: (data) => {
        this.balances = data;
        this.balancesFiltrados = data;
        this.calcularTotales();
        this.extraerTiposCuenta();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los balances: ' + (err.error?.message || err.message);
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  generarBalance(): void {
    if (!this.fechaGenerar) {
      alert('Por favor selecciona una fecha');
      return;
    }

    this.cargando = true;
    this.error = '';
    
    this.balanceSaldoService.generarBalance(this.fechaGenerar).subscribe({
      next: (data) => {
        this.balances = data;
        this.balancesFiltrados = data;
        this.calcularTotales();
        this.extraerTiposCuenta();
        this.cargando = false;
        this.mostrarModalGenerar = false;
        alert('Balance generado correctamente');
      },
      error: (err) => {
        this.error = 'Error al generar el balance: ' + (err.error?.message || err.message);
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  aplicarFiltros(): void {
    this.balancesFiltrados = this.balances.filter(balance => {
      // Filtro por tipo de cuenta
      const cumpleTipo = !this.tipoCuentaFiltro || balance.tipoCuenta === this.tipoCuentaFiltro;
      
      // Filtro por búsqueda de texto (código o nombre de cuenta)
      const cumpleBusqueda = !this.busquedaTexto || 
        balance.codigoCuenta.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        balance.nombreCuenta.toLowerCase().includes(this.busquedaTexto.toLowerCase());
      
      return cumpleTipo && cumpleBusqueda;
    });
    
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.totalDeudor = this.balancesFiltrados.reduce((sum, b) => sum + (b.saldoDeudor || 0), 0);
    this.totalAcreedor = this.balancesFiltrados.reduce((sum, b) => sum + (b.saldoAcreedor || 0), 0);
  }

  extraerTiposCuenta(): void {
    const tipos = new Set(this.balances.map(b => b.tipoCuenta));
    this.tiposCuenta = Array.from(tipos).sort();
  }

  limpiarFiltros(): void {
    this.tipoCuentaFiltro = '';
    this.busquedaTexto = '';
    this.balancesFiltrados = this.balances;
    this.calcularTotales();
  }

  abrirModalGenerar(): void {
    this.mostrarModalGenerar = true;
  }

  cerrarModalGenerar(): void {
    this.mostrarModalGenerar = false;
  }

  exportarCSV(): void {
    const headers = ['Código', 'Nombre Cuenta', 'Tipo', 'Saldo Deudor', 'Saldo Acreedor', 'Fecha'];
    const rows = this.balancesFiltrados.map(b => [
      b.codigoCuenta,
      b.nombreCuenta,
      b.tipoCuenta,
      b.saldoDeudor.toFixed(2),
      b.saldoAcreedor.toFixed(2),
      b.fecha
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance_saldos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  }

  getColorTipoCuenta(tipo: string): string {
    const colores: { [key: string]: string } = {
      'Activo': '#10b981',
      'Pasivo': '#ef4444',
      'Patrimonio': '#8b5cf6',
      'Ingreso': '#3b82f6',
      'Gasto': '#f59e0b'
    };
    return colores[tipo] || '#6b7280';
  }
}