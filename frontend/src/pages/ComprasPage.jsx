import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table
} from 'reactstrap';
import { getCompras, registrarCompra, getInsumos } from '../services/api';

const nuevaLineaInsumo = () => ({
  tipo: 'insumo',
  id: '',
  cantidad: '1',
  costoUnitario: ''
});

const nuevaLineaGasto = () => ({
  tipo: 'gasto',
  categoria: 'Transporte',
  nombre: '',
  cantidad: '1',
  costoUnitario: ''
});

const moneda = valor => `$${Number(valor || 0).toFixed(2)}`;

export default function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedor, setProveedor] = useState('');
  const [numFactura, setNumFactura] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [items, setItems] = useState([nuevaLineaInsumo()]);
  const [mensaje, setMensaje] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setErrorCarga('');
    try {
      const [listadoCompras, listadoInsumos] = await Promise.all([getCompras(), getInsumos()]);
      setCompras(listadoCompras);
      setInsumos(listadoInsumos);
    } catch (err) {
      setErrorCarga(err.message);
    }
  };

  const totales = useMemo(() => {
    return items.reduce((sumas, item) => {
      const linea = Number(item.cantidad || 0) * Number(item.costoUnitario || 0);
      sumas.total += linea;
      if (item.tipo === 'gasto') sumas.gastos += linea;
      else sumas.costos += linea;
      return sumas;
    }, { total: 0, costos: 0, gastos: 0 });
  }, [items]);

  const cuentasPendientes = compras
    .filter(compra => compra.estadoPago === 'Pendiente de Pago (CXP)')
    .reduce((total, compra) => total + Number(compra.totalCompra || 0), 0);
  const totalCostos = compras.reduce((total, compra) => total + Number(compra.totalCostos || 0), 0);
  const totalGastos = compras.reduce((total, compra) => total + Number(compra.totalGastos || 0), 0);

  const actualizarLinea = (index, cambios) => {
    setItems(actuales => actuales.map((item, i) => i === index ? { ...item, ...cambios } : item));
  };

  const cambiarTipoLinea = (index, tipo) => {
    actualizarLinea(index, tipo === 'gasto' ? nuevaLineaGasto() : nuevaLineaInsumo());
  };

  const handleRegistrar = async event => {
    event.preventDefault();
    setMensaje(null);
    setGuardando(true);
    try {
      const res = await registrarCompra({
        proveedor,
        numFactura,
        fecha: new Date(`${fecha}T12:00:00`).toISOString(),
        fechaVencimiento: fechaVencimiento || null,
        items: items.map(item => ({
          ...item,
          cantidad: Number(item.cantidad),
          costoUnitario: Number(item.costoUnitario)
        }))
      });
      setMensaje({ tipo: 'success', texto: `${res.mensaje} Total CxP: ${moneda(res.compra.totalCompra)}.` });
      setProveedor('');
      setNumFactura('');
      setFecha(new Date().toISOString().slice(0, 10));
      setFechaVencimiento('');
      setItems([nuevaLineaInsumo()]);
      await cargarDatos();
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">🚚 Facturas de compra y cuentas por pagar</h3>
      {mensaje && <Alert color={mensaje.tipo}>{mensaje.texto}</Alert>}
      {errorCarga && <Alert color="danger">{errorCarga}</Alert>}

      <Row className="g-3 mb-4">
        <Col md="4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody>
              <div className="text-muted">Cuentas por pagar pendientes</div>
              <div className="fs-3 fw-bold text-danger">{moneda(cuentasPendientes)}</div>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody>
              <div className="text-muted">Costos en insumos registrados</div>
              <div className="fs-3 fw-bold text-primary">{moneda(totalCostos)}</div>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody>
              <div className="text-muted">Gastos registrados</div>
              <div className="fs-3 fw-bold text-warning">{moneda(totalGastos)}</div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl="5">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h5 className="fw-bold mb-3">Registrar factura de compra</h5>
              <Form onSubmit={handleRegistrar}>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="proveedorCompra">Proveedor</Label>
                      <Input id="proveedorCompra" required value={proveedor} onChange={event => setProveedor(event.target.value)} placeholder="Nombre del proveedor" />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="numeroFacturaCompra">Número de factura</Label>
                      <Input id="numeroFacturaCompra" required value={numFactura} onChange={event => setNumFactura(event.target.value)} placeholder="FAC-8890" />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="fechaCompra">Fecha de factura</Label>
                      <Input id="fechaCompra" type="date" required value={fecha} onChange={event => setFecha(event.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="fechaVencimiento">Vencimiento CxP (opcional)</Label>
                      <Input id="fechaVencimiento" type="date" value={fechaVencimiento} onChange={event => setFechaVencimiento(event.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Detalle de la factura</h6>
                  <div className="d-flex gap-2">
                    <Button type="button" size="sm" color="outline-primary" onClick={() => setItems(currentes => [...currentes, nuevaLineaInsumo()])}>+ Insumo</Button>
                    <Button type="button" size="sm" color="outline-warning" onClick={() => setItems(currentes => [...currentes, nuevaLineaGasto()])}>+ Gasto</Button>
                  </div>
                </div>

                {items.map((item, index) => {
                  const subtotalLinea = Number(item.cantidad || 0) * Number(item.costoUnitario || 0);
                  return (
                    <Card key={index} className="mb-2 bg-light border-0">
                      <CardBody className="p-3">
                        <Row className="g-2 align-items-end">
                          <Col xs="7">
                            <FormGroup className="mb-0">
                              <Label>Tipo de línea</Label>
                              <Input type="select" value={item.tipo} onChange={event => cambiarTipoLinea(index, event.target.value)}>
                                <option value="insumo">Insumo (afecta inventario)</option>
                                <option value="gasto">Gasto (no afecta inventario)</option>
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col xs="5" className="text-end">
                            <Button
                              type="button"
                              size="sm"
                              color="outline-danger"
                              disabled={items.length === 1}
                              onClick={() => setItems(actuales => actuales.filter((_, i) => i !== index))}
                            >
                              Quitar
                            </Button>
                          </Col>

                          {item.tipo === 'insumo' ? (
                            <Col xs="12">
                              <FormGroup className="mb-0">
                                <Label>Insumo</Label>
                                <Input
                                  type="select"
                                  required
                                  value={item.id}
                                  onChange={event => actualizarLinea(index, { id: event.target.value })}
                                >
                                  <option value="">Seleccionar insumo</option>
                                  {insumos.map(insumo => (
                                    <option key={insumo.id} value={insumo.id}>{insumo.nombre} (stock: {insumo.stock} {insumo.unidad})</option>
                                  ))}
                                </Input>
                              </FormGroup>
                            </Col>
                          ) : (
                            <>
                              <Col sm="5">
                                <FormGroup className="mb-0">
                                  <Label>Categoría</Label>
                                  <Input type="select" value={item.categoria} onChange={event => actualizarLinea(index, { categoria: event.target.value })}>
                                    <option>Transporte</option>
                                    <option>Servicios</option>
                                    <option>Mantenimiento</option>
                                    <option>Otros</option>
                                  </Input>
                                </FormGroup>
                              </Col>
                              <Col sm="7">
                                <FormGroup className="mb-0">
                                  <Label>Descripción del gasto</Label>
                                  <Input required value={item.nombre} onChange={event => actualizarLinea(index, { nombre: event.target.value })} placeholder="Ej. Flete de mercadería" />
                                </FormGroup>
                              </Col>
                            </>
                          )}

                          <Col sm="6">
                            <FormGroup className="mb-0">
                              <Label>{item.tipo === 'gasto' ? 'Unidades' : 'Cantidad'}</Label>
                              <Input type="number" min="0.001" step="any" required value={item.cantidad} onChange={event => actualizarLinea(index, { cantidad: event.target.value })} />
                            </FormGroup>
                          </Col>
                          <Col sm="6">
                            <FormGroup className="mb-0">
                              <Label>{item.tipo === 'gasto' ? 'Costo por unidad ($)' : 'Costo unitario ($)'}</Label>
                              <Input type="number" min="0" step="0.01" required value={item.costoUnitario} onChange={event => actualizarLinea(index, { costoUnitario: event.target.value })} />
                            </FormGroup>
                          </Col>
                          <Col xs="12" className="text-end small fw-bold">
                            Importe de línea: {moneda(subtotalLinea)}
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  );
                })}

                <div className="border-top pt-3 mt-3">
                  <div className="d-flex justify-content-between"><span>Costos de insumos:</span><strong>{moneda(totales.costos)}</strong></div>
                  <div className="d-flex justify-content-between"><span>Gastos:</span><strong>{moneda(totales.gastos)}</strong></div>
                  <div className="d-flex justify-content-between fs-5 mt-1"><strong>Total de factura / CxP:</strong><strong>{moneda(totales.total)}</strong></div>
                </div>
                <Alert color="info" className="mt-3 mb-3 py-2">
                  La factura se registrará como pendiente de pago. Solo las líneas de insumos aumentarán el inventario.
                </Alert>
                <Button color="primary" block className="fw-bold" disabled={guardando}>
                  {guardando ? 'REGISTRANDO...' : 'REGISTRAR FACTURA Y CxP'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col xl="7">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Facturas y cuentas por pagar</h5>
                <Button color="secondary" outline size="sm" onClick={cargarDatos}>Actualizar</Button>
              </div>
              {compras.length === 0 ? (
                <Alert color="secondary" className="mb-0">Todavía no hay facturas de compra registradas.</Alert>
              ) : (
                <Table striped responsive hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      <th>Fecha</th>
                      <th>Proveedor / factura</th>
                      <th>Vence</th>
                      <th>Total</th>
                      <th>Estado CxP</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compras.slice().reverse().map(compra => (
                      <tr key={compra.id}>
                        <td>{new Date(compra.fecha).toLocaleDateString('es-SV')}</td>
                        <td>{compra.proveedor}<br /><small className="text-muted">{compra.numFactura}</small></td>
                        <td>{compra.fechaVencimiento ? new Date(`${compra.fechaVencimiento}T12:00:00`).toLocaleDateString('es-SV') : '—'}</td>
                        <td className="fw-bold">{moneda(compra.totalCompra)}</td>
                        <td><Badge color="warning" className="text-dark">{compra.estadoPago || 'Pendiente de Pago (CXP)'}</Badge></td>
                        <td><Button size="sm" color="outline-primary" onClick={() => setCompraSeleccionada(compra)}>Ver</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal isOpen={Boolean(compraSeleccionada)} toggle={() => setCompraSeleccionada(null)} size="lg">
        {compraSeleccionada && (
          <>
            <ModalHeader toggle={() => setCompraSeleccionada(null)}>Detalle de factura {compraSeleccionada.numFactura}</ModalHeader>
            <ModalBody>
              <Row className="mb-3">
                <Col sm="6"><strong>Proveedor:</strong> {compraSeleccionada.proveedor}</Col>
                <Col sm="6"><strong>Fecha:</strong> {new Date(compraSeleccionada.fecha).toLocaleDateString('es-SV')}</Col>
                <Col sm="6"><strong>Vencimiento:</strong> {compraSeleccionada.fechaVencimiento ? new Date(`${compraSeleccionada.fechaVencimiento}T12:00:00`).toLocaleDateString('es-SV') : 'No indicado'}</Col>
                <Col sm="6"><strong>Estado:</strong> {compraSeleccionada.estadoPago || 'Pendiente de Pago (CXP)'}</Col>
              </Row>
              <Table bordered responsive size="sm">
                <thead className="table-light">
                  <tr><th>Tipo</th><th>Descripción</th><th>Cantidad</th><th>Costo unitario</th><th>Importe</th></tr>
                </thead>
                <tbody>
                  {compraSeleccionada.items.map((item, index) => (
                    <tr key={`${item.id || item.nombre}-${index}`}>
                      <td>{item.tipo === 'insumo' ? 'Insumo' : `Gasto: ${item.categoria || 'Otros'}`}</td>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>{moneda(item.costoUnitario)}</td>
                      <td>{moneda(item.subtotal ?? item.cantidad * item.costoUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="ms-auto" style={{ maxWidth: '280px' }}>
                <div className="d-flex justify-content-between"><span>Costos de insumos:</span><strong>{moneda(compraSeleccionada.totalCostos)}</strong></div>
                <div className="d-flex justify-content-between"><span>Gastos:</span><strong>{moneda(compraSeleccionada.totalGastos)}</strong></div>
                <div className="d-flex justify-content-between fs-5 mt-2"><strong>Total por pagar:</strong><strong>{moneda(compraSeleccionada.totalCompra)}</strong></div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setCompraSeleccionada(null)}>Cerrar</Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}
