// ============================================================================
// MOTOR DE CÁLCULO DE PLANILLA Y RETENCIONES LEGALES DE EL SALVADOR
// Desarrollado por: Integrante 4 (feature/backend-rrhh-nomina)
// Aplica deducciones de ley: ISSS (3%), AFP (7.25%) y Tablas de ISR Quincenal.
// ============================================================================

// Bloque 1: Cálculo de ISSS (3% con tope máximo de $30 por quincena / $1,000 base)
export const calcularISSS = (salarioBruto) => {
  const PorcentajeISSS = 0.03;
  const TechoQuincenalISSS = 500.00; // $1,000 mensual = $500 quincenal
  const baseCalculo = Math.min(salarioBruto, TechoQuincenalISSS);
  return Number((baseCalculo * PorcentajeISSS).toFixed(2));
};

// Bloque 2: Cálculo de AFP (7.25% sin tope)
export const calcularAFP = (salarioBruto) => {
  const PorcentajeAFP = 0.0725;
  return Number((salarioBruto * PorcentajeAFP).toFixed(2));
};

// Bloque 3: Cálculo de Renta (ISR) Tabla Quincenal de El Salvador
export const calcularISRQuincenal = (salarioImponible) => {
  // Tabla oficial de retención ISR Quincenal en El Salvador
  if (salarioImponible <= 236.00) {
    return 0.00; // Tramo I: Exento
  } else if (salarioImponible <= 447.62) {
    // Tramo II: 10% sobre exceso de $236.00 + cuota fija de $8.83
    return Number(((salarioImponible - 236.00) * 0.10 + 8.83).toFixed(2));
  } else if (salarioImponible <= 1019.05) {
    // Tramo III: 20% sobre exceso de $447.62 + cuota fija de $30.00
    return Number(((salarioImponible - 447.62) * 0.20 + 30.00).toFixed(2));
  } else {
    // Tramo IV: 30% sobre exceso de $1,019.05 + cuota fija de $144.28
    return Number(((salarioImponible - 1019.05) * 0.30 + 144.28).toFixed(2));
  }
};

// Bloque 4: Generación completa de la boleta de pago quincenal
export const calcularPlanillaEmpleado = (empleado) => {
  const bruto = empleado.salarioQuincenal;
  const isss = calcularISSS(bruto);
  const afp = calcularAFP(bruto);
  
  // Salario imponible para Renta = Salario Bruto - ISSS - AFP
  const imponibleRenta = bruto - isss - afp;
  const isr = calcularISRQuincenal(imponibleRenta);
  
  const totalDeducciones = Number((isss + afp + isr).toFixed(2));
  const salarioNeto = Number((bruto - totalDeducciones).toFixed(2));

  return {
    empleadoId: empleado.id,
    nombre: empleado.nombre,
    cargo: empleado.cargo,
    salarioBruto: bruto,
    isss,
    afp,
    imponibleRenta: Number(imponibleRenta.toFixed(2)),
    isr,
    totalDeducciones,
    salarioNeto
  };
};
