// ============================================================================
// MOTOR DE DESCUENTO DE RECETAS E INVENTARIO
// Desarrollado por: Integrante 2 (feature/backend-inventario-recetas)
// Este servicio se encarga de verificar el stock disponible y descontar los
// ingredientes necesarios según la fórmula técnica de cada producto vendido.
// ============================================================================

// Bloque 1: Función para verificar si hay suficiente stock antes de vender
export const verificarStockDisponible = (itemsCarrito, { insumos, productos }) => {
  const faltantes = [];

  // Iterar sobre cada producto enviado en la orden de venta
  for (const item of itemsCarrito) {
    const prod = productos.find(p => p.id === item.productoId);
    if (!prod) continue;

    // Si es producto de reventa, se evalúa su stock directo
    if (prod.tipo === "reventa") {
      if (prod.stock < item.cantidad) {
        faltantes.push(`Producto de reventa '${prod.nombre}' sin stock suficiente (Disp: ${prod.stock})`);
      }
    } 
    // Si es producto elaborado, se verifican todos los insumos de su receta
    else if (prod.tipo === "elaborado" && prod.receta) {
      for (const ing of prod.receta) {
        const insumoBase = insumos.find(i => i.id === ing.insumoId);
        const reqTotal = ing.cantidad * item.cantidad;
        if (!insumoBase || insumoBase.stock < reqTotal) {
          faltantes.push(`Insumo '${insumoBase?.nombre || ing.insumoId}' insuficiente para ${item.cantidad}x ${prod.nombre}. (Requiere: ${reqTotal} ${insumoBase?.unidad}, Disponible: ${insumoBase?.stock || 0})`);
        }
      }
    }
  }

  return { valido: faltantes.length === 0, errores: faltantes };
};

// Bloque 2: Función para ejecutar el descuento real del inventario tras la venta
export const descontarInventarioPorVenta = (itemsCarrito, { insumos, productos }) => {
  for (const item of itemsCarrito) {
    const prod = productos.find(p => p.id === item.productoId);
    if (!prod) continue;

    // Caso A: Descuento directo para productos de reventa
    if (prod.tipo === "reventa") {
      prod.stock -= item.cantidad;
    } 
    // Caso B: Descuento de materias primas e insumos según receta
    else if (prod.tipo === "elaborado" && prod.receta) {
      for (const ing of prod.receta) {
        const insumoBase = insumos.find(i => i.id === ing.insumoId);
        if (insumoBase) {
          insumoBase.stock -= (ing.cantidad * item.cantidad);
        }
      }
    }
  }
};
