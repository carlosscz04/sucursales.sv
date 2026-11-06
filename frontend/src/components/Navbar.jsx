// ============================================================================
// COMPONENTE NAVBAR Y NAVEGACIÓN
// Desarrollado por: Integrante 7 (feature/frontend-caja-ui)
// ============================================================================

import React from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, Button, Badge } from 'reactstrap';

export default function AppNavbar({ vistaActual, setVistaActual, alertasCount, usuario, sucursal, onLogout, onNavigateUsers }) {
  return (
    <Navbar color="dark" dark expand="md" className="px-4 mb-4 shadow">
      <NavbarBrand href="#" className="fw-bold text-warning fs-4">
        ☕ Orígenes SV
      </NavbarBrand>
      <Nav className="ms-auto d-flex flex-wrap align-items-center gap-2" navbar>
        <NavItem>
          <Button 
            color={vistaActual === 'pos' ? 'warning' : 'outline-light'} 
            onClick={() => setVistaActual('pos')}
          >
            🛒 POS Ventas
          </Button>
        </NavItem>
        {usuario.rol === 'admin' && (
          <NavItem>
            <Button
              color={vistaActual === 'comprobantes' ? 'warning' : 'outline-light'}
              onClick={() => setVistaActual('comprobantes')}
            >
              📄 Facturas / CCF
            </Button>
          </NavItem>
        )}
        {usuario.rol === 'admin' && (
        <NavItem>
          <Button 
            color={vistaActual === 'inventario' ? 'warning' : 'outline-light'} 
            onClick={() => setVistaActual('inventario')}
          >
            📦 Inventario
            {alertasCount > 0 && <Badge color="danger" className="ms-2">{alertasCount}</Badge>}
          </Button>
        </NavItem>
        )}
        {usuario.rol === 'admin' && (
        <NavItem>
          <Button 
            color={vistaActual === 'compras' ? 'warning' : 'outline-light'} 
            onClick={() => setVistaActual('compras')}
          >
            🚚 Compras (CXP)
          </Button>
        </NavItem>
        )}
        {usuario.rol === 'admin' && (
        <NavItem>
          <Button 
            color={vistaActual === 'caja' ? 'warning' : 'outline-light'} 
            onClick={() => setVistaActual('caja')}
          >
            💵 Caja & Flujos
          </Button>
        </NavItem>
        )}
        {usuario.rol === 'admin' && (
        <NavItem>
          <Button 
            color={vistaActual === 'rrhh' ? 'warning' : 'outline-light'} 
            onClick={() => setVistaActual('rrhh')}
          >
            👥 RRHH & Planilla
          </Button>
        </NavItem>
        )}
        {usuario.rol === 'admin' && (
          <NavItem>
            <Button
              color={vistaActual === 'usuarios' ? 'warning' : 'outline-light'}
              onClick={onNavigateUsers}
            >
              👤 Usuarios
            </Button>
          </NavItem>
        )}
        <NavItem className="text-light mx-2 text-end">
          {usuario.nombre}<br />
          <small>{sucursal?.nombre || 'Sucursal'}</small>
        </NavItem>
        <NavItem>
          <Button color="outline-warning" onClick={onLogout}>Cerrar sesión</Button>
        </NavItem>
      </Nav>
    </Navbar>
  );
}
