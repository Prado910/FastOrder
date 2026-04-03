import { useState } from "react";
import DashboardMesero from "./pages/mesero/DashboardMesero";
import SeleccionarMesa from "./pages/mesero/SeleccionarMesa";
import MenuProductos from "./pages/mesero/MenuProductos";
import ResumenPedido from "./pages/mesero/ResumenPedido";
import PedidoConfirmado from "./pages/mesero/PedidoConfirmado";

export default function App() {
  const [paso, setPaso] = useState("dashboard");
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [itemsPedido, setItemsPedido] = useState([]);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  function irANuevoPedido() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
    setPaso("mesas");
  }

  function manejarMesaSeleccionada(mesa) {
    setMesaSeleccionada(mesa);
    setPaso("productos");
  }

  function volverADashboard() {
    setMesaSeleccionada(null);
    setItemsPedido([]);
    setPedidoConfirmado(null);
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

  if (paso === "dashboard") {
    return <DashboardMesero onNuevoPedido={irANuevoPedido} />;
  }

  if (paso === "mesas") {
    return <SeleccionarMesa onMesaSeleccionada={manejarMesaSeleccionada} />;
  }

  if (paso === "productos") {
    return (
      <MenuProductos
        mesaSeleccionada={mesaSeleccionada}
        itemsPedido={itemsPedido}
        setItemsPedido={setItemsPedido}
        onVolver={volverADashboard}
        onContinuarResumen={irAResumen}
      />
    );
  }

  if (paso === "resumen") {
    return (
      <ResumenPedido
        mesaSeleccionada={mesaSeleccionada}
        itemsPedido={itemsPedido}
        onVolverAlMenu={volverAProductos}
        onEditarMesa={editarMesa}
        onPedidoConfirmado={manejarPedidoConfirmado}
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