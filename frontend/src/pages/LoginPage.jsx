import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Container, Form, FormGroup, Input, Label } from "reactstrap";
import { getSucursales, login, setupAccount } from "../services/api";

const departamentos = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz",
  "La Unión", "Morazán", "San Miguel", "San Salvador", "San Vicente",
  "Santa Ana", "Sonsonate", "Usulután"
];

export default function LoginPage({ onAuthenticated, resumenCierre }) {
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState("");
  const [nombreSucursal, setNombreSucursal] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("cajero");
  const [montoInicial, setMontoInicial] = useState("100");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const cargarSucursales = async () => {
    try {
      const lista = await getSucursales();
      setSucursales(lista);
      setSucursalId(current => lista.some(item => item.id === current) ? current : (lista[0]?.id || ""));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const setupRequired = sucursales.length === 0;

  const handleSubmit = async event => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = setupRequired
        ? await setupAccount({
          nombre,
          username,
          password,
          montoInicial,
          sucursal: { nombre: nombreSucursal, departamento, municipio }
        })
        : await login(username, password, montoInicial, sucursalId, rol);
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError.message);
      if (setupRequired) await cargarSucursales();
    } finally {
      setLoading(false);
    }
  };

  if (loadingBranches) {
    return <Container className="py-5 text-center">Cargando sucursales...</Container>;
  }

  return (
    <Container className="py-5" style={{ maxWidth: 520 }}>
      <Card className="shadow border-0">
        <CardBody className="p-4">
          <h2 className="fw-bold text-center mb-2">☕ Orígenes SV</h2>
          <p className="text-muted text-center mb-4">
            {setupRequired ? "Registra la primera sucursal y crea su cuenta gerente." : "Selecciona tu sucursal y rol para iniciar sesión."}
          </p>

          {resumenCierre && (
            <Alert color="success">
              Sesión cerrada. {resumenCierre.cajero}: {resumenCierre.diferencia}
            </Alert>
          )}
          {error && <Alert color="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            {setupRequired ? (
              <>
                <h5 className="fw-bold">Primera sucursal</h5>
                <FormGroup>
                  <Label for="nombreSucursal">Nombre de la sucursal</Label>
                  <Input id="nombreSucursal" value={nombreSucursal} onChange={event => setNombreSucursal(event.target.value)} placeholder="Sucursal Escalón" required maxLength={100} />
                </FormGroup>
                <FormGroup>
                  <Label for="departamentoSucursal">Departamento</Label>
                  <Input id="departamentoSucursal" type="select" value={departamento} onChange={event => setDepartamento(event.target.value)} required>
                    <option value="">Selecciona un departamento</option>
                    {departamentos.map(item => <option key={item} value={item}>{item}</option>)}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="municipioSucursal">Municipio</Label>
                  <Input id="municipioSucursal" value={municipio} onChange={event => setMunicipio(event.target.value)} placeholder="Municipio" required maxLength={100} />
                </FormGroup>
                <hr />
                <h5 className="fw-bold">Cuenta gerente de sucursal</h5>
                <FormGroup>
                  <Label for="nombre">Nombre completo</Label>
                  <Input id="nombre" value={nombre} onChange={event => setNombre(event.target.value)} required />
                </FormGroup>
              </>
            ) : (
              <>
                <FormGroup>
                  <Label for="sucursalId">Sucursal</Label>
                  <Input id="sucursalId" type="select" value={sucursalId} onChange={event => setSucursalId(event.target.value)} required>
                    {sucursales.map(sucursal => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre} — {sucursal.municipio}, {sucursal.departamento}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="rol">Rol</Label>
                  <Input id="rol" type="select" value={rol} onChange={event => setRol(event.target.value)}>
                    <option value="admin">Administrador / Gerente de sucursal</option>
                    <option value="cajero">Cajero</option>
                  </Input>
                </FormGroup>
              </>
            )}

            <FormGroup>
              <Label for="username">Usuario</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={event => setUsername(event.target.value)}
                minLength={3}
                maxLength={30}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label for="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={setupRequired ? "new-password" : "current-password"}
                value={password}
                onChange={event => setPassword(event.target.value)}
                minLength={8}
                required
              />
              {setupRequired && <small className="text-muted">Debe tener al menos 8 caracteres.</small>}
            </FormGroup>
            <FormGroup>
              <Label for="montoInicial">Fondo inicial de caja ($)</Label>
              <Input
                id="montoInicial"
                type="number"
                min="0"
                step="0.01"
                value={montoInicial}
                onChange={event => setMontoInicial(event.target.value)}
                required
              />
            </FormGroup>
            <Button color="success" className="w-100 fw-bold" disabled={loading}>
              {loading ? "Procesando..." : setupRequired ? "Registrar sucursal y abrir caja" : "Entrar y abrir caja"}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}
