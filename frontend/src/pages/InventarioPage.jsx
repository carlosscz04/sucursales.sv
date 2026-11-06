// ============================================================================
// VISTA DE INVENTARIO Y ALERTAS DE STOCK MÍNIMO
// Desarrollado por: Integrante 6 (feature/frontend-inventario-ui)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Table, Card, CardBody, Badge, Alert, Row, Col } from 'reactstrap';
import { getInsumos, getAlertasStock } from '../services/api';

export default function InventarioPage() {
  const [insumos, setInsumos] = useState([]);
  const [alertas, setAlertas] = useState(null);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const dataInsumos = await getInsumos();
      setInsumos(dataInsumos);
      const dataAlertas = await getAlertasStock();
      setAlertas(dataAlertas);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">📦 Control de Inventario & Alertas de Stock</h3>

      {alertas && alertas.totalAlertas > 0 && (
        <Alert color="danger" className="shadow-sm">
          <h5 className="alert-heading fw-bold">⚠️ Alertas de Stock Mínimo ({alertas.totalAlertas})</h5>
          <p className="mb-0">
            Existen materias primas o insumos por debajo del límite de reabastecimiento programado. Se sugiere emitir orden de compra.
          </p>
        </Alert>
      )}

      <Row>
        <Col md="12">
          <Card className="shadow-sm border-0">
            <CardBody>
              <h5 className="fw-bold mb-3">Materias Primas e Insumos en Bodega</h5>
              <Table striped hover responsive>
                <thead className="table-dark">
                  <tr>
                    <th>Código</th>
                    <th>Insumo</th>
                    <th>Stock Actual</th>
                    <th>Unidad</th>
                    <th>Stock Mínimo</th>
                    <th>Costo Unit.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map(item => {
                    const bajoStock = item.stock <= item.stockMinimo;
                    return (
                      <tr key={item.id} className={bajoStock ? "table-danger" : ""}>
                        <td><strong>{item.id}</strong></td>
                        <td>{item.nombre}</td>
                        <td className="fw-bold">{item.stock}</td>
                        <td>{item.unidad}</td>
                        <td>{item.stockMinimo}</td>
                        <td>${item.costoUnitario.toFixed(4)}</td>
                        <td>
                          {bajoStock ? (
                            <Badge color="danger">CRÍTICO / ALERTA</Badge>
                          ) : (
                            <Badge color="success">ÓPTIMO</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
