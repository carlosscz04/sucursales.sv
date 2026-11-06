import React from 'react';
import { Badge, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table, Button } from 'reactstrap';

const moneda = valor => `$${Number(valor).toFixed(2)}`;

export default function ComprobanteModal({ comprobante, isOpen, onClose }) {
  if (!comprobante) return null;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>
        Comprobante de venta
      </ModalHeader>
      <ModalBody>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="fw-bold mb-1">{comprobante.numeroDocumento}</h5>
            <Badge color={comprobante.tipoDocumento === 'CCF' ? 'primary' : 'success'}>
              {comprobante.tipoDocumento === 'CCF' ? 'Comprobante de Crédito Fiscal' : 'Factura Consumidor Final'}
            </Badge>
          </div>
          <strong>{new Date(comprobante.fecha).toLocaleString('es-SV')}</strong>
        </div>

        <Row className="mb-3">
          <Col sm="6"><strong>Cliente:</strong> {comprobante.cliente || 'Cliente General'}</Col>
          <Col sm="6"><strong>NIT / NRF:</strong> {comprobante.nitNrf || 'N/A'}</Col>
          <Col sm="6"><strong>Método de pago:</strong> {comprobante.metodoPago}</Col>
          <Col sm="6"><strong>Cajero:</strong> {comprobante.cajero}</Col>
        </Row>

        <Table bordered responsive size="sm">
          <thead className="table-light">
            <tr>
              <th>Cantidad</th>
              <th>Producto</th>
              <th>Precio unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {comprobante.items.map((item, index) => (
              <tr key={`${item.productoId}-${index}`}>
                <td>{item.cantidad}</td>
                <td>{item.nombre}</td>
                <td>{moneda(item.precioUnitario)}</td>
                <td>{moneda(item.totalLinea)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="ms-auto" style={{ maxWidth: '260px' }}>
          <div className="d-flex justify-content-between"><span>Subtotal:</span><strong>{moneda(comprobante.subtotal)}</strong></div>
          <div className="d-flex justify-content-between"><span>IVA:</span><strong>{moneda(comprobante.iva)}</strong></div>
          <div className="d-flex justify-content-between fs-5 mt-2">
            <strong>Total:</strong><strong className="text-success">{moneda(comprobante.total)}</strong>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>Cerrar</Button>
      </ModalFooter>
    </Modal>
  );
}
