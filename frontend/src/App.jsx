import { useState } from "react";
import DashboardMesero from "./pages/mesero/DashboardMesero";
import SeleccionarMesa from "./pages/mesero/SeleccionarMesa";
import MenuProductos from "./pages/mesero/MenuProductos";
import ResumenPedido from "./pages/mesero/ResumenPedido";
import PedidoConfirmado from "./pages/mesero/PedidoConfirmado";
import SeguimientoPedido from "./pages/mesero/SeguimientoPedido";

export default function App() {
  const [paso, setPaso] = useState("dashboard");
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [itemsPedido, setItemsPedido] = useState([]);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [pedidoEnSeguimiento, setPedidoEnSeguimiento] = useState(null);

  function irANuevoPedido() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
    setPaso("mesas");
  }

  function irASeguimientoPedido(pedido) {
    setPedidoEnSeguimiento(pedido);
    setPaso("seguimiento");
  }

  function manejarMesaSeleccionada(mesa) {
    setMesaSeleccionada(mesa);
    setPaso("productos");
  }

  function volverADashboard() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
    setPedidoEnSeguimiento(null);
    setPaso("dashboard");
  }

  function editarMesa() {
    setMesaSeleccionada(null);
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
    setPaso("confirmado");
  }

  function cerrarSesion() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
    setPedidoEnSeguimiento(null);
    setPaso("dashboard");
  }

  if (paso === "dashboard") {
    return (
      <DashboardMesero
        onNuevoPedido={irANuevoPedido}
        onCerrarSesion={cerrarSesion}
        onVerPedido={irASeguimientoPedido}
      />
    );
  }

  if (paso === "mesas") {
    return (
      <SeleccionarMesa
        onMesaSeleccionada={manejarMesaSeleccionada}
        onVolver={volverADashboard}
      />
    );
  }

  if (paso === "productos") {
    return (
      <MenuProductos
        mesaSeleccionada={mesaSeleccionada}
        itemsPedido={itemsPedido}
        setItemsPedido={setItemsPedido}
        onVolver={volverADashboard}
        onContinuarResumen={irAResumen}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (paso === "resumen") {
    return (
      <ResumenPedido
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
        pedido={pedidoEnSeguimiento}
        onVolver={volverADashboard}
      />
    );
  }

  return (
    <PedidoConfirmado
      pedido={pedidoConfirmado}
      onNuevoPedido={volverADashboard}
    />
  );
}