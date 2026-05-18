import { useState } from "react";

import Login from "./pages/Login";
import DashboardMesero from "./pages/mesero/DashboardMesero";
import SeleccionarMesa from "./pages/mesero/SeleccionarMesa";
import MenuProductos from "./pages/mesero/MenuProductos";
import ResumenPedido from "./pages/mesero/ResumenPedido";
import PedidoConfirmado from "./pages/mesero/PedidoConfirmado";
import SeguimientoPedido from "./pages/mesero/SeguimientoPedido";
import DashboardCocina from "./pages/cocina/DashboardCocina";
import DashboardCaja from "./pages/caja/DashboardCaja";
import DashboardAdmin from "./pages/admin/DashboardAdmin";

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = sessionStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [paso, setPaso] = useState("dashboard");
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [itemsPedido, setItemsPedido] = useState([]);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [pedidoEnSeguimiento, setPedidoEnSeguimiento] = useState(null);
  const [mostrarToastMesa, setMostrarToastMesa] = useState(false);
  const [mostrarToastPedidoEliminado, setMostrarToastPedidoEliminado] = useState(false);

  function manejarLogin(usuarioAutenticado) {
    sessionStorage.setItem("usuario", JSON.stringify(usuarioAutenticado));
    setUsuario(usuarioAutenticado);
    setPaso("dashboard");
  }

  function limpiarFlujoPedido() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
    setPedidoEnSeguimiento(null);
    setMostrarToastMesa(false);
    setMostrarToastPedidoEliminado(false);
  }

  function cerrarSesion() {
    sessionStorage.removeItem("usuario");
    setUsuario(null);
    limpiarFlujoPedido();
    setPaso("dashboard");
  }

  function irANuevoPedido() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
    setPedidoEnSeguimiento(null);
    setPaso("mesas");
  }

  function volverADashboard() {
    setPaso("dashboard");
  }

  function manejarMesaSeleccionada(mesa) {
    setMesaSeleccionada(mesa);
    setMostrarToastMesa(true);
    setPaso("productos");
  }

  function editarMesa() {
    setPaso("mesas");
  }

  function irAResumen() {
    setPaso("resumen");
  }

  function volverAProductos() {
    setPaso("productos");
  }

  function manejarPedidoConfirmado(pedido) {
    setPedidoConfirmado(pedido);
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPaso("confirmado");
  }

  function irASeguimientoPedido(pedido) {
    setPedidoEnSeguimiento(pedido);
    setPaso("seguimiento");
  }

  function manejarPedidoEliminado() {
    setPedidoEnSeguimiento(null);
    setMostrarToastPedidoEliminado(true);
    setPaso("dashboard");
  }

  if (!usuario) {
    return <Login onLogin={manejarLogin} />;
  }

  if (usuario.rol === "ADMINISTRADOR") {
    return (
      <DashboardAdmin
        usuario={usuario}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuario.rol === "COCINA") {
    return (
      <DashboardCocina
        usuario={usuario}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuario.rol === "CAJA") {
    return (
      <DashboardCaja
        usuario={usuario}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (paso === "dashboard") {
    return (
      <DashboardMesero
        usuario={usuario}
        onNuevoPedido={irANuevoPedido}
        onCerrarSesion={cerrarSesion}
        onVerPedido={irASeguimientoPedido}
        mostrarToastPedidoEliminado={mostrarToastPedidoEliminado}
        onOcultarToastPedidoEliminado={() => setMostrarToastPedidoEliminado(false)}
      />
    );
  }

  if (paso === "mesas") {
    return (
      <SeleccionarMesa
        usuario={usuario}
        onMesaSeleccionada={manejarMesaSeleccionada}
        onVolver={volverADashboard}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (paso === "productos") {
    return (
      <MenuProductos
        usuario={usuario}
        mesaSeleccionada={mesaSeleccionada}
        itemsPedido={itemsPedido}
        setItemsPedido={setItemsPedido}
        onVolver={volverADashboard}
        onContinuarResumen={irAResumen}
        onCerrarSesion={cerrarSesion}
        mostrarToastMesa={mostrarToastMesa}
        onOcultarToastMesa={() => setMostrarToastMesa(false)}
      />
    );
  }

  if (paso === "resumen") {
    return (
      <ResumenPedido
        usuario={usuario}
        mesaSeleccionada={mesaSeleccionada}
        itemsPedido={itemsPedido}
        setItemsPedido={setItemsPedido}
        onVolverAlMenu={volverAProductos}
        onEditarMesa={editarMesa}
        onPedidoConfirmado={manejarPedidoConfirmado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (paso === "seguimiento") {
    return (
      <SeguimientoPedido
        usuario={usuario}
        pedido={pedidoEnSeguimiento}
        onVolver={volverADashboard}
        onPedidoEliminado={manejarPedidoEliminado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  return (
    <PedidoConfirmado
      usuario={usuario}
      pedido={pedidoConfirmado}
      onNuevoPedido={volverADashboard}
      onCerrarSesion={cerrarSesion}
    />
  );
}