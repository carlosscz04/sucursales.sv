// ============================================================================
// COMPONENTE PRINCIPAL (APP.JSX) - RESTAURANTE ORÍGENES SV
// Orquesta el estado de la vista actual y consulta las alertas de inventario.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Alert, Button, Container, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import AppNavbar from './components/Navbar';
import POSPage from './pages/POSPage';
import ComprobantesPage from './pages/ComprobantesPage';
import InventarioPage from './pages/InventarioPage';
import ComprasPage from './pages/ComprasPage';
import CajaPage from './pages/CajaPage';
import RRHHPage from './pages/RRHHPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import {
  clearAuthToken,
  getAlertasStock,
  getCurrentSession,
  getTurnoActivo,
  logout
} from './services/api';

export default function App() {
  const [vistaActual, setVistaActual] = useState('pos');
  const [alertasCount, setAlertasCount] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [turnoParaCerrar, setTurnoParaCerrar] = useState(null);
  const [efectivoContado, setEfectivoContado] = useState('0');
  const [logoutError, setLogoutError] = useState('');
  const [resumenCierre, setResumenCierre] = useState(null);

  useEffect(() => {
    const iniciar = async () => {
      try {
        if (sessionStorage.getItem('authToken')) {
          try {
            const session = await getCurrentSession();
            setUsuario(session.usuario);
            setSucursal(session.sucursal);
          } catch {
            clearAuthToken();
          }
        }
      } catch (err) {
        setLogoutError(err.message);
      } finally {
        setAuthReady(true);
      }
    };
    iniciar();
  }, []);

  useEffect(() => {
    if (usuario?.rol === 'admin') cargarAlertas();
  }, [usuario]);

  const cargarAlertas = async () => {
    try {
      const data = await getAlertasStock();
      setAlertasCount(data.totalAlertas || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthenticated = (session) => {
    setUsuario(session.usuario);
    setSucursal(session.sucursal);
    setVistaActual('pos');
    setResumenCierre(null);
    setLogoutError('');
  };

  const prepararCierreSesion = async () => {
    setLogoutError('');
    try {
      const turno = await getTurnoActivo();
      setTurnoParaCerrar(turno);
      setEfectivoContado(turno ? String(turno.montoInicial + turno.ventasEfectivo) : '0');
      setLogoutModalOpen(true);
    } catch (err) {
      setLogoutError(err.message);
    }
  };

  const handleLogout = async () => {
    setLogoutError('');
    try {
      const result = await logout(turnoParaCerrar ? efectivoContado : null);
      setResumenCierre(result.resumenCierre);
      setUsuario(null);
      setSucursal(null);
      setLogoutModalOpen(false);
      setTurnoParaCerrar(null);
      setVistaActual('pos');
    } catch (err) {
      setLogoutError(err.message);
    }
  };

  if (!authReady) {
    return <Container className="py-5 text-center">Conectando con el servidor...</Container>;
  }

  if (!usuario) {
    return (
      <>
        {logoutError && <Alert color="danger" className="m-3">{logoutError}</Alert>}
        <LoginPage
          onAuthenticated={handleAuthenticated}
          resumenCierre={resumenCierre}
        />
      </>
    );
  }

  return (
    <div>
      <AppNavbar 
        vistaActual={vistaActual}
        setVistaActual={vista => {
          if (usuario.rol === 'admin' || vista === 'pos') setVistaActual(vista);
        }}
        alertasCount={alertasCount}
        usuario={usuario}
        sucursal={sucursal}
        onLogout={prepararCierreSesion}
        onNavigateUsers={() => setVistaActual('usuarios')}
      />
      
      <Container fluid className="px-4 pb-5">
        {vistaActual === 'pos' && <POSPage />}
        {usuario.rol === 'admin' && vistaActual === 'comprobantes' && <ComprobantesPage />}
        {usuario.rol === 'admin' && vistaActual === 'inventario' && <InventarioPage />}
        {usuario.rol === 'admin' && vistaActual === 'compras' && <ComprasPage />}
        {usuario.rol === 'admin' && vistaActual === 'caja' && <CajaPage usuario={usuario} />}
        {usuario.rol === 'admin' && vistaActual === 'rrhh' && <RRHHPage usuario={usuario} />}
        {vistaActual === 'usuarios' && usuario.rol === 'admin' && <UsersPage />}
      </Container>

      <Modal isOpen={logoutModalOpen} toggle={() => setLogoutModalOpen(false)}>
        <ModalHeader toggle={() => setLogoutModalOpen(false)}>Cerrar sesión</ModalHeader>
        <ModalBody>
          {logoutError && <Alert color="danger">{logoutError}</Alert>}
          {turnoParaCerrar ? (
            <>
              <p>Al salir se cerrará el turno de <strong>{turnoParaCerrar.cajero}</strong> y se guardará el resumen.</p>
              <FormGroup>
                <Label for="efectivoContado">Efectivo físico contado ($)</Label>
                <Input
                  id="efectivoContado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={efectivoContado}
                  onChange={event => setEfectivoContado(event.target.value)}
                  required
                />
              </FormGroup>
            </>
          ) : (
            <p>No hay un turno abierto. ¿Deseas cerrar sesión?</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setLogoutModalOpen(false)}>Cancelar</Button>
          <Button color="danger" onClick={handleLogout}>Cerrar sesión{turnoParaCerrar ? " y caja" : ""}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
