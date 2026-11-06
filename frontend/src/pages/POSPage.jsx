// ============================================================================
// VISTA POS - TERMINAL DE VENTAS Y FACTURACIÓN
// Desarrollado por: Integrante 5 (feature/frontend-pos-ui)
// Muestra el catálogo visual y gestiona el carrito con Facturas/CCF 13% IVA.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, CardSubtitle, Button, Badge, Table, Form, FormGroup, Label, Input, Alert } from 'reactstrap';
import { getProductos, procesarVenta, getTurnoActivo } from '../services/api';
import ComprobanteModal from '../components/ComprobanteModal';

export default function POSPage() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [tipoDoc, setTipoDoc] = useState("Consumidor Final");
  const [cliente, setCliente] = useState("");
  const [nitNrf, setNitNrf] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [mensaje, setMensaje] = useState(null);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [comprobanteCreado, setComprobanteCreado] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const prods = await getProductos();
      setProductos(prods);
      const turno = await getTurnoActivo();
      setTurnoActivo(turno);
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    }
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (prod) => {
    const existe = carrito.find(item => item.productoId === prod.id);
    if (existe) {
      setCarrito(carrito.map(item => item.productoId === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { productoId: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 }]);
    }
  };

  // Calcular totales con IVA 13%
  const subtotalNeto = carrito.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
  const iva = tipoDoc === "CCF" ? subtotalNeto * 0.13 : subtotalNeto - (subtotalNeto / 1.13);
  const total = tipoDoc === "CCF" ? subtotalNeto + iva : subtotalNeto;

  const handleVender = async () => {
    try {
      setMensaje(null);
      const respuesta = await procesarVenta({
        tipoDocumento: tipoDoc === "CCF" ? "CCF" : "Consumidor Final",
        cliente,
        nitNrf,
        items: carrito,
        metodoPago
      });
      setMensaje({ tipo: "success", texto: `${respuesta.mensaje}! Doc: ${respuesta.venta.numeroDocumento}` });
      setComprobanteCreado(respuesta.venta);
      setCarrito([]);
      setCliente("");
      setNitNrf("");
      cargarDatos();
    } catch (err) {
      setMensaje({ tipo: "danger", texto: err.message });
    }
  };

  return (
    <div>
      {!turnoActivo && (
        <Alert color="warning" className="fw-bold">
          ⚠️ ATENCIÓN: No hay un turno de caja abierto. Diríjase al módulo de 'Caja & Flujos' para aperturar turno antes de vender.
        </Alert>
      )}

      {mensaje && <Alert color={mensaje.tipo}>{mensaje.texto}</Alert>}

      <Row>
        {/* Catálogo de Productos */}
        <Col md="7">
          <h4 className="mb-3 text-dark">📋 Menú de Productos (Elaborados & Reventa)</h4>
          <Row>
            {productos.map(p => (
              <Col md="4" className="mb-3" key={p.id}>
                <Card className="h-100 shadow-sm border-0">
                  <CardBody className="d-flex flex-column justify-content-between">
                    <div>
                      <Badge color={p.tipo === 'elaborado' ? 'info' : 'secondary'} className="mb-2">
                        {p.tipo.toUpperCase()}
                      </Badge>
                      <CardTitle tag="h6" className="fw-bold">{p.nombre}</CardTitle>
                      <CardSubtitle className="text-muted mb-2">{p.categoria}</CardSubtitle>
                    </div>
                    <div>
                      <div className="fs-5 fw-bold text-success mb-2">${p.precio.toFixed(2)}</div>
                      <Button 
                        color="primary" 
                        block 
                        size="sm"
                        disabled={!turnoActivo}
                        onClick={() => agregarAlCarrito(p)}
                      >
                        + Añadir orden
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        {/* Carrito y Facturación */}
        <Col md="5">
          <Card className="shadow-sm border-0">
            <CardBody>
              <h4 className="fw-bold mb-3">🛒 Ticket de Venta (POS)</h4>

              <FormGroup>
                <Label className="fw-bold">Tipo de Comprobante</Label>
                <Input type="select" value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                  <option value="Consumidor Final">Factura Consumidor Final (13% IVA Incluido)</option>
                  <option value="CCF">Comprobante de Crédito Fiscal (CCF + 13% IVA)</option>
                </Input>
              </FormGroup>

              {tipoDoc === "CCF" && (
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label>Razón Social / Cliente</Label>
                      <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ej: Empresa S.A. de C.V." />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label>NIT / NRF</Label>
                      <Input value={nitNrf} onChange={e => setNitNrf(e.target.value)} placeholder="0614-000000-000-0" />
                    </FormGroup>
                  </Col>
                </Row>
              )}

              <Table size="sm" responsive className="mt-2">
                <thead>
                  <tr>
                    <th>Cant</th>
                    <th>Producto</th>
                    <th>P.Unit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">Carrito vacío</td></tr>
                  ) : (
                    carrito.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.cantidad}</td>
                        <td>{item.nombre}</td>
                        <td>${item.precio.toFixed(2)}</td>
                        <td>${(item.precio * item.cantidad).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              <hr />

              <div className="d-flex justify-content-between">
                <span>Subtotal:</span>
                <strong>${subtotalNeto.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>IVA (13%):</span>
                <strong>${iva.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between fs-4 fw-bold text-success mt-2">
                <span>TOTAL A PAGAR:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <FormGroup className="mt-3">
                <Label className="fw-bold">Método de Pago</Label>
                <Input type="select" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Tarjeta">💳 Tarjeta de Crédito/Débito</option>
                  <option value="Bitcoin/Chivo">⚡ Bitcoin / Chivo Wallet</option>
                </Input>
              </FormGroup>

              <Button 
                color="success" 
                block 
                size="lg" 
                className="fw-bold mt-3"
                disabled={carrito.length === 0 || !turnoActivo}
                onClick={handleVender}
              >
                PROCESAR VENTA Y EMITIR FACTURA
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <ComprobanteModal
        comprobante={comprobanteCreado}
        isOpen={Boolean(comprobanteCreado)}
        onClose={() => setComprobanteCreado(null)}
      />
    </div>
  );
}
