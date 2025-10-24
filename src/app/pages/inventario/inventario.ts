import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, Inventario } from './inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class InventarioComponent implements OnInit {
  // Listas
  productos: Inventario[] = [];
  productosFiltrados: Inventario[] = [];
  
  // Filtros - CORREGIDOS para coincidir con backend
  filtros = {
    tipo: '',           // Backend usa 'tipo'
    q: '',              // Backend usa 'q' para búsqueda por nombre
  };
  
  // Formulario
  productoForm: Inventario = this.getEmptyForm();
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  
  // Ajuste de stock
  mostrarAjusteStock: boolean = false;
  productoAjuste: Inventario | null = null;
  ajusteStock = {
    cantidad: 0,
    operacion: 'sumar' as 'sumar' | 'restar'
  };
  
  // Tipos de producto disponibles
  tiposProducto: string[] = ['Mercadería', 'Mobiliario', 'Equipo'];
  
  // Resúmenes
  valorTotalInventario: number = 0;
  totalProductos: number = 0;
  
  // Estado
  cargando: boolean = false;
  error: string = '';
  mensajeExito: string = '';

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  // ===== CARGA DE DATOS =====
  cargarProductos(): void {
    this.cargando = true;
    this.error = '';
    
    // Construir objeto de filtros solo con valores definidos
    const filtrosActivos: any = {};
    
    // El backend usa 'tipo' para filtrar por tipo de producto
    if (this.filtros.tipo && this.filtros.tipo !== '') {
      filtrosActivos.tipo = this.filtros.tipo;
    }
    
    // El backend usa 'q' para búsqueda por nombre
    if (this.filtros.q && this.filtros.q !== '') {
      filtrosActivos.q = this.filtros.q;
    }
    
    const filtrosParaEnviar = Object.keys(filtrosActivos).length > 0 ? filtrosActivos : undefined;
    
    console.log('Cargando con filtros:', filtrosParaEnviar); // Debug
    
    this.inventarioService.getAll(filtrosParaEnviar).subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        this.totalProductos = data.length;
        this.cargarResumenes();
        this.cargando = false;
        console.log('Productos cargados:', data.length);
      },
      error: (err) => {
        this.error = 'Error al cargar los productos';
        console.error('Error detallado:', err);
        this.cargando = false;
      }
    });
  }

  cargarResumenes(): void {
    // Calcular valor total del inventario
    this.valorTotalInventario = this.productos.reduce((total, producto) => {
      return total + (producto.cantidadExistente * producto.precioUnitario);
    }, 0);
  }

  // ===== FILTROS =====
  aplicarFiltros(): void {
    console.log('Aplicando filtros:', this.filtros);
    this.cargarProductos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      tipo: '',
      q: ''
    };
    this.aplicarFiltros();
  }

  // ===== CRUD =====
  abrirFormularioNuevo(): void {
    this.productoForm = this.getEmptyForm();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  abrirFormularioEdicion(producto: Inventario): void {
    this.productoForm = { ...producto };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.productoForm = this.getEmptyForm();
    this.modoEdicion = false;
  }

  guardarProducto(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.error = '';

    const productoParaEnviar: Inventario = {
      nombreProducto: this.productoForm.nombreProducto,
      descripcion: this.productoForm.descripcion || '',
      cantidadExistente: this.productoForm.cantidadExistente,
      precioUnitario: this.productoForm.precioUnitario,
      tipoProducto: this.productoForm.tipoProducto
    };

    console.log('Guardando producto:', productoParaEnviar);

    if (this.modoEdicion && this.productoForm.productoId) {
      // Actualizar
      this.inventarioService.update(
        this.productoForm.productoId,
        productoParaEnviar
      ).subscribe({
        next: (response) => {
          console.log('Respuesta actualización:', response);
          this.mensajeExito = 'Producto actualizado exitosamente';
          this.cargarProductos();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.error = err.error?.message || err.message || 'Error al actualizar el producto';
          this.cargando = false;
        }
      });
    } else {
      // Crear
      this.inventarioService.create(productoParaEnviar).subscribe({
        next: (response) => {
          console.log('Respuesta creación:', response);
          this.mensajeExito = 'Producto creado exitosamente';
          this.cargarProductos();
          this.cerrarFormulario();
          this.cargando = false;
          setTimeout(() => this.mensajeExito = '', 3000);
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.error = err.error?.message || err.message || 'Error al crear el producto';
          this.cargando = false;
        }
      });
    }
  }

  eliminarProducto(id: number): void {
    if (!confirm('¿Está seguro de eliminar este producto del inventario?')) {
      return;
    }

    this.cargando = true;
    this.inventarioService.delete(id).subscribe({
      next: () => {
        this.mensajeExito = 'Producto eliminado exitosamente';
        this.cargarProductos();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al eliminar el producto';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // ===== AJUSTE DE STOCK =====
  abrirAjusteStock(producto: Inventario): void {
    this.productoAjuste = producto;
    this.ajusteStock = {
      cantidad: 0,
      operacion: 'sumar'
    };
    this.mostrarAjusteStock = true;
    this.error = '';
    this.mensajeExito = '';
  }

  cerrarAjusteStock(): void {
    this.mostrarAjusteStock = false;
    this.productoAjuste = null;
  }

  aplicarAjusteStock(): void {
    if (!this.productoAjuste || this.ajusteStock.cantidad <= 0) {
      this.error = 'La cantidad debe ser mayor a 0';
      return;
    }

    // Validar que no deje stock negativo si es resta
    if (this.ajusteStock.operacion === 'restar') {
      if (this.ajusteStock.cantidad > this.productoAjuste.cantidadExistente) {
        this.error = 'No hay suficiente stock para esta operación';
        return;
      }
    }

    this.cargando = true;
    this.error = '';

    console.log('Ajustando stock:', {
      id: this.productoAjuste.productoId,
      cantidad: this.ajusteStock.cantidad,
      operacion: this.ajusteStock.operacion
    });

    this.inventarioService.ajustarStock(
      this.productoAjuste.productoId!,
      this.ajusteStock.cantidad,
      this.ajusteStock.operacion
    ).subscribe({
      next: (response) => {
        console.log('Stock ajustado:', response);
        const operacionTexto = this.ajusteStock.operacion === 'sumar' ? 'aumentado' : 'disminuido';
        this.mensajeExito = `Stock ${operacionTexto} exitosamente`;
        this.cargarProductos();
        this.cerrarAjusteStock();
        this.cargando = false;
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        console.error('Error al ajustar stock:', err);
        this.error = err.error?.message || err.error || 'Error al ajustar el stock';
        this.cargando = false;
      }
    });
  }

  // ===== VALIDACIÓN =====
  validarFormulario(): boolean {
    if (!this.productoForm.nombreProducto || this.productoForm.nombreProducto.trim() === '') {
      this.error = 'El nombre del producto es obligatorio';
      return false;
    }
    if (!this.productoForm.tipoProducto) {
      this.error = 'El tipo de producto es obligatorio';
      return false;
    }
    if (this.productoForm.cantidadExistente === undefined || this.productoForm.cantidadExistente < 0) {
      this.error = 'La cantidad debe ser mayor o igual a 0';
      return false;
    }
    if (!this.productoForm.precioUnitario || this.productoForm.precioUnitario <= 0) {
      this.error = 'El precio unitario debe ser mayor a 0';
      return false;
    }
    return true;
  }

  // ===== UTILIDADES =====
  getEmptyForm(): Inventario {
    return {
      nombreProducto: '',
      descripcion: '',
      cantidadExistente: 0,
      precioUnitario: 0,
      tipoProducto: ''
    };
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  }

  calcularValorTotal(producto: Inventario): number {
    return producto.cantidadExistente * producto.precioUnitario;
  }

  getColorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      'mercadería': '#3b82f6',
      'mobiliario': '#10b981',
      'equipo': '#f59e0b'
    };
    return colores[tipo.toLowerCase()] || '#6b7280';
  }

  getIconoTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'mercadería': '📦',
      'mobiliario': '🪑',
      'equipo': '🔧'
    };
    return iconos[tipo.toLowerCase()] || '📋';
  }

  getEstadoStock(cantidad: number): { texto: string, clase: string } {
    if (cantidad === 0) {
      return { texto: 'Agotado', clase: 'stock-agotado' };
    } else if (cantidad < 10) {
      return { texto: 'Bajo', clase: 'stock-bajo' };
    } else if (cantidad < 50) {
      return { texto: 'Medio', clase: 'stock-medio' };
    } else {
      return { texto: 'Alto', clase: 'stock-alto' };
    }
  }

  getTotalProductosPorTipo(tipo: string): number {
    return this.productos.filter(p => p.tipoProducto.toLowerCase() === tipo.toLowerCase()).length;
  }

  getValorTotalPorTipo(tipo: string): number {
    return this.productos
      .filter(p => p.tipoProducto.toLowerCase() === tipo.toLowerCase())
      .reduce((total, producto) => total + this.calcularValorTotal(producto), 0);
  }
}