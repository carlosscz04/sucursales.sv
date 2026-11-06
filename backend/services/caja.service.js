function errorPeticion(mensaje) {
  const error = new Error(mensaje);
  error.status = 400;
  return error;
}

export function abrirTurnoCaja(datosSucursal, sucursalId, cajero, montoInicial, guardar) {
  const { turnosCaja } = datosSucursal;
  if (turnosCaja.some(turno => turno.estado === "ABIERTO")) {
    throw errorPeticion("Ya hay un turno de caja abierto.");
  }

  const turno = {
    id: `TURNO-${String(turnosCaja.length + 1).padStart(2, "0")}`,
    sucursalId,
    cajero,
    fechaApertura: new Date().toISOString(),
    montoInicial,
    estado: "ABIERTO",
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    ventasBitcoin: 0,
    montoCierre: 0,
    diferencia: 0
  };

  turnosCaja.push(turno);
  try {
    guardar();
  } catch (error) {
    turnosCaja.pop();
    throw error;
  }
  return turno;
}

export function cerrarTurnoCaja(datosSucursal, efectivoContado, guardar) {
  const { turnosCaja } = datosSucursal;
  const turno = turnosCaja.find(item => item.estado === "ABIERTO");
  if (!turno) throw errorPeticion("No hay ningún turno de caja abierto.");

  const montoContadoNum = Number(efectivoContado);
  if (efectivoContado === "" || !Number.isFinite(montoContadoNum) || montoContadoNum < 0) {
    throw errorPeticion("El efectivo contado debe ser un número válido igual o mayor que cero.");
  }

  const estadoAnterior = { ...turno };
  const efectivoEsperado = Number((turno.montoInicial + turno.ventasEfectivo).toFixed(2));
  const diferencia = Number((montoContadoNum - efectivoEsperado).toFixed(2));

  turno.estado = "CERRADO";
  turno.fechaCierre = new Date().toISOString();
  turno.montoCierre = montoContadoNum;
  turno.diferencia = diferencia;

  try {
    guardar();
  } catch (error) {
    Object.assign(turno, estadoAnterior);
    throw error;
  }

  return {
    cajero: turno.cajero,
    montoInicial: Number(turno.montoInicial),
    ventasEfectivo: Number(turno.ventasEfectivo),
    ventasTarjeta: Number(turno.ventasTarjeta),
    ventasBitcoin: Number(turno.ventasBitcoin),
    efectivoEsperado,
    efectivoContado: montoContadoNum,
    diferencia: diferencia === 0
      ? "Cuadre Perfecto ($0.00)"
      : diferencia > 0
        ? `Sobrante: +$${diferencia.toFixed(2)}`
        : `Faltante: -$${Math.abs(diferencia).toFixed(2)}`
  };
}
