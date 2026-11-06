import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, CardBody, Table } from 'reactstrap';
import ComprobanteModal from '../components/ComprobanteModal';
import { getHistorialVentas } from '../services/api';

const moneda = valor => `$${Number(valor).toFixed(2)}`;

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarComprobantes();
  }, []);

  const cargarComprobantes = async () => {
    setCargando(true);
    setError('');
    try {
      setComprobantes(await getHistorialVentas());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const comprobantesFiltrados = comprobantes
    .filter(comprobante => filtro === 'todos'
      || (filtro === 'ccf' ? comprobante.tipoDocumento === 'CCF' : comprobante.tipoDocumento !== 'CCF'))
    .slice()
    .reverse();

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h3 className="fw-bold mb-0">Facturas y comprobantes CCF</h3>
        <div className="d-flex gap-2">
          <ButtonGroup>
            <Button color={filtro === 'todos' ? 'primary' : 'outline-primary'} onClick={() => setFiltro('todos')}>Todos</Button>
            <Button color={filtro === 'facturas' ? 'primary' : 'outline-primary'} onClick={() => setFiltro('facturas')}>Facturas</Button>
            <Button color={filtro === 'ccf' ? 'primary' : 'outline-primary'} onClick={() => setFiltro('ccf')}>CCF</Button>
          </ButtonGroup>
          <Button color="secondary" outline onClick={cargarComprobantes} disabled={cargando}>Actualizar</Button>
        </div>
      </div>

      {error && <Alert color="danger">{error}</Alert>}
      <Card className="shadow-sm border-0">
        <CardBody>
          {cargando ? (
            <Alert color="secondary" className="mb-0">Cargando comprobantes...</Alert>
          ) : comprobantesFiltrados.length === 0 ? (
            <Alert color="secondary" className="mb-0">No hay comprobantes para mostrar.</Alert>
          ) : (
            <Table striped responsive hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Método de pago</th>
                  <th>Total</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {comprobantesFiltrados.map(comprobante => (
                  <tr key={comprobante.id}>
                    <td className="fw-bold">{comprobante.numeroDocumento}</td>
                    <td>
                      <Badge color={comprobante.tipoDocumento === 'CCF' ? 'primary' : 'success'}>
                        {comprobante.tipoDocumento === 'CCF' ? 'CCF' : 'Factura'}
                      </Badge>
                    </td>
                    <td>{new Date(comprobante.fecha).toLocaleString('es-SV')}</td>
                    <td>{comprobante.cliente}</td>
                    <td>{comprobante.metodoPago}</td>
                    <td className="fw-bold">{moneda(comprobante.total)}</td>
                    <td><Button size="sm" color="outline-primary" onClick={() => setSeleccionado(comprobante)}>Ver</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <ComprobanteModal
        comprobante={seleccionado}
        isOpen={Boolean(seleccionado)}
        onClose={() => setSeleccionado(null)}
      />
    </div>
  );
}
