import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { createUser, getUsers, registrarSucursal } from "../services/api";

const departamentos = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz",
  "La Unión", "Morazán", "San Miguel", "San Salvador", "San Vicente",
  "Santa Ana", "Sonsonate", "Usulután"
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nombreSucursal, setNombreSucursal] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [nombreGerente, setNombreGerente] = useState("");
  const [usernameGerente, setUsernameGerente] = useState("");
  const [passwordGerente, setPasswordGerente] = useState("");
  const [sucursalLoading, setSucursalLoading] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setUsers(await getUsers());
    } catch (error) {
      setMensaje({ tipo: "danger", texto: error.message });
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMensaje(null);
    setLoading(true);
    try {
      const result = await createUser({ nombre, username, password });
      setMensaje({ tipo: "success", texto: result.mensaje });
      setNombre("");
      setUsername("");
      setPassword("");
      await cargarUsuarios();
    } catch (error) {
      setMensaje({ tipo: "danger", texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarSucursal = async event => {
    event.preventDefault();
    setMensaje(null);
    setSucursalLoading(true);
    try {
      const result = await registrarSucursal({
        sucursal: { nombre: nombreSucursal, departamento, municipio },
        gerente: { nombre: nombreGerente, username: usernameGerente, password: passwordGerente }
      });
      setMensaje({ tipo: "success", texto: `${result.mensaje} La nueva sucursal ya aparece en la selección de inicio de sesión.` });
      setNombreSucursal("");
      setDepartamento("");
      setMunicipio("");
      setNombreGerente("");
      setUsernameGerente("");
      setPasswordGerente("");
    } catch (error) {
      setMensaje({ tipo: "danger", texto: error.message });
    } finally {
      setSucursalLoading(false);
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">👤 Usuarios y sucursales</h3>
      {mensaje && <Alert color={mensaje.tipo}>{mensaje.texto}</Alert>}
      <Row>
        <Col lg="5">
          <Card className="shadow-sm border-0 mb-4">
            <CardBody>
              <h5 className="fw-bold mb-3">Crear cuenta de cajero</h5>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="nombreUsuario">Nombre del cajero</Label>
                  <Input id="nombreUsuario" value={nombre} onChange={event => setNombre(event.target.value)} required />
                </FormGroup>
                <FormGroup>
                  <Label for="nuevoUsername">Usuario</Label>
                  <Input
                    id="nuevoUsername"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="nuevaPassword">Contraseña inicial</Label>
                  <Input
                    id="nuevaPassword"
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </FormGroup>
                <Button color="primary" disabled={loading}>
                  {loading ? "Guardando..." : "Crear usuario"}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
        <Col lg="7">
          <Card className="shadow-sm border-0 mb-4">
            <CardBody>
              <h5 className="fw-bold mb-3">Registrar otra sucursal</h5>
              <p className="text-muted">Se creará un inventario independiente y una cuenta gerente para esa sucursal.</p>
              <Form onSubmit={handleRegistrarSucursal}>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="nombreNuevaSucursal">Nombre</Label>
                      <Input id="nombreNuevaSucursal" value={nombreSucursal} onChange={event => setNombreSucursal(event.target.value)} required maxLength={100} />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="departamentoNuevaSucursal">Departamento</Label>
                      <Input id="departamentoNuevaSucursal" type="select" value={departamento} onChange={event => setDepartamento(event.target.value)} required>
                        <option value="">Seleccionar</option>
                        {departamentos.map(item => <option key={item} value={item}>{item}</option>)}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="municipioNuevaSucursal">Municipio</Label>
                      <Input id="municipioNuevaSucursal" value={municipio} onChange={event => setMunicipio(event.target.value)} required maxLength={100} />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="nombreNuevoGerente">Nombre del gerente</Label>
                      <Input id="nombreNuevoGerente" value={nombreGerente} onChange={event => setNombreGerente(event.target.value)} required />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="usuarioNuevoGerente">Usuario del gerente</Label>
                      <Input id="usuarioNuevoGerente" value={usernameGerente} onChange={event => setUsernameGerente(event.target.value)} minLength={3} maxLength={30} required />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="claveNuevoGerente">Contraseña inicial</Label>
                      <Input id="claveNuevoGerente" type="password" value={passwordGerente} onChange={event => setPasswordGerente(event.target.value)} minLength={8} required />
                    </FormGroup>
                  </Col>
                </Row>
                <Button color="success" disabled={sucursalLoading}>
                  {sucursalLoading ? "Registrando..." : "Crear sucursal y gerente"}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col lg="7">
          <Card className="shadow-sm border-0">
            <CardBody>
              <h5 className="fw-bold mb-3">Cuentas de esta sucursal</h5>
              <Table striped responsive>
                <thead className="table-dark">
                  <tr><th>Nombre</th><th>Usuario</th><th>Tipo</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.username}>
                      <td>{user.nombre}</td>
                      <td>{user.username}</td>
                      <td>{user.rol === "admin" ? "Administrador" : "Cajero"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
