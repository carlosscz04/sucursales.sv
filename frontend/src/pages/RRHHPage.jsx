import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Card, CardBody, Form, FormGroup, Input, Label, Table, Row, Col } from 'reactstrap';
import { getPlanilla, registrarEmpleado } from '../services/api';

export default function RRHHPage({ usuario }) {
  const [planilla, setPlanilla] = useState(null);
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [salarioQuincenal, setSalarioQuincenal] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const esAdministrador = usuario?.rol === 'admin';

  useEffect(() => {
    cargarPlanilla();
  }, []);

  const cargarPlanilla = async () => {
    setCargando(true);
    try {
      setPlanilla(await getPlanilla());
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  const handleRegistrarEmpleado = async event => {
    event.preventDefault();
    setMensaje(null);
    setGuardando(true);
    try {
      const resultado = await registrarEmpleado({
        nombre,
        cargo,
        salarioQuincenal: Number(salarioQuincenal)
      });
      setMensaje({ tipo: 'success', texto: resultado.mensaje });
      setNombre('');
      setCargo('');
      setSalarioQuincenal('');
      await cargarPlanilla();
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">👥 Recursos Humanos & Planilla Quincenal (El Salvador)</h3>
      {mensaje && <Alert color={mensaje.tipo}>{mensaje.texto}</Alert>}

      {esAdministrador && (
        <Card className="shadow-sm border-0 mb-4">
          <CardBody>
            <h5 className="fw-bold mb-3">Registrar empleado</h5>
            <Form onSubmit={handleRegistrarEmpleado}>
              <Row className="align-items-end">
                <Col md="4">
                  <FormGroup>
                    <Label for="empleadoNombre">Nombre completo</Label>
                    <Input id="empleadoNombre" value={nombre} onChange={event => setNombre(event.target.value)} required />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label for="empleadoCargo">Cargo</Label>
                    <Input id="empleadoCargo" value={cargo} onChange={event => setCargo(event.target.value)} required />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label for="empleadoSalario">Salario bruto quincenal ($)</Label>
                    <Input
                      id="empleadoSalario"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={salarioQuincenal}
                      onChange={event => setSalarioQuincenal(event.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="2" className="mb-3">
                  <Button color="primary" block disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Agregar empleado'}
                  </Button>
                </Col>
              </Row>
              <small className="text-muted">El sueldo indicado es por quincena. El sistema calculará ISSS, AFP, ISR y salario neto automáticamente.</small>
            </Form>
          </CardBody>
        </Card>
      )}

      {cargando && <Alert color="secondary">Cargando planilla...</Alert>}
      {!cargando && planilla?.detalles.length === 0 && (
        <Alert color="info">
          Aún no hay empleados registrados. {esAdministrador ? 'Registra el primero en el formulario.' : 'Solicita al administrador que registre el personal.'}
        </Alert>
      )}
      {!cargando && planilla && planilla.detalles.length > 0 && (
        <>
          <Alert color="info">Los descuentos y el salario neto se calculan automáticamente a partir del sueldo bruto quincenal asignado.</Alert>
          <Row className="mb-4">
            <Col md="3">
              <Card className="bg-primary text-white shadow-sm border-0">
                <CardBody className="text-center">
                  <h6>Total Bruto Quincenal</h6>
                  <h4 className="fw-bold">${planilla.resumenGlobal.totalBruto.toFixed(2)}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md="3">
              <Card className="bg-info text-white shadow-sm border-0">
                <CardBody className="text-center">
                  <h6>Retenciones ISSS (3%)</h6>
                  <h4 className="fw-bold">${planilla.resumenGlobal.totalISSS.toFixed(2)}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md="3">
              <Card className="bg-warning text-dark shadow-sm border-0">
                <CardBody className="text-center">
                  <h6>Retenciones AFP (7.25%)</h6>
                  <h4 className="fw-bold">${planilla.resumenGlobal.totalAFP.toFixed(2)}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md="3">
              <Card className="bg-success text-white shadow-sm border-0">
                <CardBody className="text-center">
                  <h6>Total Neto a Pagar</h6>
                  <h4 className="fw-bold">${planilla.resumenGlobal.totalNeto.toFixed(2)}</h4>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm border-0">
            <CardBody>
              <h5 className="fw-bold mb-3">Boletas de Pago Quincenal de Empleados</h5>
              <Table striped responsive hover>
                <thead className="table-dark">
                  <tr>
                    <th>Empleado</th>
                    <th>Cargo</th>
                    <th>Salario Bruto</th>
                    <th>ISSS (3%)</th>
                    <th>AFP (7.25%)</th>
                    <th>Imponible ISR</th>
                    <th>ISR (Renta)</th>
                    <th>Total Deduc.</th>
                    <th>Salario Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {planilla.detalles.map(emp => (
                    <tr key={emp.empleadoId}>
                      <td><strong>{emp.nombre}</strong></td>
                      <td><Badge color="secondary">{emp.cargo}</Badge></td>
                      <td className="fw-bold">${emp.salarioBruto.toFixed(2)}</td>
                      <td className="text-danger">-${emp.isss.toFixed(2)}</td>
                      <td className="text-danger">-${emp.afp.toFixed(2)}</td>
                      <td>${emp.imponibleRenta.toFixed(2)}</td>
                      <td className="text-danger">-${emp.isr.toFixed(2)}</td>
                      <td className="fw-bold text-danger">-${emp.totalDeducciones.toFixed(2)}</td>
                      <td className="fw-bold text-success fs-6">${emp.salarioNeto.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
