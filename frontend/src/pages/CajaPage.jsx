// ============================================================================
// VISTA DE CAJA Y ARQUEO POR TURNO
// Desarrollado por: Integrante 7 (feature/frontend-caja-ui)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Button, Form, FormGroup, Label, Input, Alert, Badge, Table } from 'reactstrap';
import { getTurnoActivo, getTurnosCaja, aperturarCaja, cerrarCaja } from '../services/api';

export default function CajaPage({ usuario }) {
  const [turno, setTurno] = useState(null);
  const [montoInicial, setMontoInicial] = useState(100);
  const [cajero] = useState(usuario.nombre);
  const [efectivoContado, setEfectivoContado] = useState(0);
  const [mensaje, setMensaje] = useState(null);
  const [resumenCierre, setResumenCierre] = useState(null);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    cargarDatosCaja();
  }, []);

  const cargarDatosCaja = async () => {
    await Promise.all([cargarTurno(), cargarHistorial()]);
  };

  const cargarTurno = async () => {
    try {
      const data = await getTurnoActivo();
      setTurno(data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarHistorial = async () => {
    try {
      setHistorial(await getTurnosCaja());
    } catch (err) {
      console.error(err);
    }
  };

  const handleApertura = async (e) => {
    e.preventDefault();
    try {
      const res = await aperturarCaja(cajero, montoInicial);
      setMensaje({ tipo: "success", texto: res.mensaje });
      await cargarDatosCaja();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    }
  };

  const handleCierre = async (e) => {
    e.preventDefault();
    try {
      const res = await cerrarCaja(efectivoContado);
      setResumenCierre(res.resumenCierre);
      setMensaje({ tipo: "success", texto: res.mensaje });
      await cargarDatosCaja();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">💵 Control de Caja, Flujos & Arqueo de Turno</h3>
      {mensaje && <Alert color={mensaje.tipo}>{mensaje.texto}</Alert>}

      <Row>
        <Col md="6">
          <Card className="shadow-sm border-0 mb-4">
            <CardBody>
              <h5 className="fw-bold mb-3">Estado del Turno Actual</h5>
              {turno ? (
                <div>
                  <Alert color="success" className="d-flex justify-content-between align-items-center">
                    <span>TURNO ABIERTO POR: <strong>{turno.cajero}</strong></span>
                    <Badge color="success" pill>ACTIVO</Badge>
                  </Alert>
                  <p><strong>Monto Inicial de Apertura:</strong> ${turno.montoInicial.toFixed(2)}</p>
                  <p><strong>Ventas en Efectivo:</strong> ${turno.ventasEfectivo.toFixed(2)}</p>
                  <p><strong>Ventas en Tarjeta:</strong> ${turno.ventasTarjeta.toFixed(2)}</p>
                  <p><strong>Ventas en Bitcoin/Chivo:</strong> ${turno.ventasBitcoin.toFixed(2)}</p>
                  <hr />
                  <h6 className="fw-bold text-primary">Efectivo Esperado en Caja: ${(turno.montoInicial + turno.ventasEfectivo).toFixed(2)}</h6>
                </div>
              ) : (
                <Alert color="secondary">No hay ningún turno de caja abierto actualmente.</Alert>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          {!turno ? (
            <Card className="shadow-sm border-0">
              <CardBody>
                <h5 className="fw-bold mb-3">🔑 Apertura de Caja por Turno</h5>
                <Form onSubmit={handleApertura}>
                  <FormGroup>
                    <Label>Nombre del Cajero</Label>
                    <Input value={cajero} disabled required />
                  </FormGroup>
                  <FormGroup>
                    <Label>Monto Inicial ($ Fondo de Caja)</Label>
                    <Input type="number" step="0.01" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} required />
                  </FormGroup>
                  <Button color="success" block className="fw-bold">APERTURAR CAJA</Button>
                </Form>
              </CardBody>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardBody>
                <h5 className="fw-bold mb-3">🔒 Arqueo y Cierre de Caja</h5>
                <Form onSubmit={handleCierre}>
                  <FormGroup>
                    <Label>Efectivo Físico Contado en Caja ($)</Label>
                    <Input type="number" step="0.01" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} required />
                  </FormGroup>
                  <Button color="danger" block className="fw-bold">CERRAR Y CUADRAR TURNO</Button>
                </Form>
              </CardBody>
            </Card>
          )}

          {resumenCierre && (
            <Card className="shadow-sm border-0 mt-4 bg-dark text-white">
              <CardBody>
                <h5 className="text-warning fw-bold">📄 Resumen de Cuadre de Caja</h5>
                <p>Efectivo Esperado: ${resumenCierre.efectivoEsperado.toFixed(2)}</p>
                <p>Efectivo Contado: ${resumenCierre.efectivoContado.toFixed(2)}</p>
                <p className="fw-bold fs-5">Resultado: {resumenCierre.diferencia}</p>
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mt-2">
        <CardBody>
          <h5 className="fw-bold mb-3">Historial de turnos y arqueos</h5>
          {historial.length === 0 ? (
            <Alert color="secondary" className="mb-0">Todavía no hay turnos registrados.</Alert>
          ) : (
            <Table striped responsive hover>
              <thead className="table-dark">
                <tr>
                  <th>Cajero</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th>Fondo inicial</th>
                  <th>Efectivo contado</th>
                  <th>Diferencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(item => (
                  <tr key={item.id}>
                    <td>{item.cajero}</td>
                    <td>{new Date(item.fechaApertura).toLocaleString()}</td>
                    <td>{item.fechaCierre ? new Date(item.fechaCierre).toLocaleString() : "—"}</td>
                    <td>${Number(item.montoInicial).toFixed(2)}</td>
                    <td>{item.estado === "CERRADO" ? `$${Number(item.montoCierre).toFixed(2)}` : "—"}</td>
                    <td>{item.estado === "CERRADO" ? `$${Number(item.diferencia).toFixed(2)}` : "—"}</td>
                    <td><Badge color={item.estado === "ABIERTO" ? "success" : "secondary"}>{item.estado}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
