import { useEffect, useMemo, useState } from "react";

import HeaderMesero from "../../components/mesero/HeaderMesero";
import { getPedidos } from "../../services/api";

function formatearHora(fecha) {
    if (!fecha) return "--:--";

    const fechaPedido = new Date(fecha);

    if (Number.isNaN(fechaPedido.getTime())) {
        return "--:--";
    }

    return fechaPedido.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatearEstado(estado) {
    if (!estado) return "";

    return estado
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (letra) => letra.toUpperCase());
}

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

function esPedidoParaCocina(pedido) {
    return ["PENDIENTE", "EN_PREPARACION"].includes(pedido.estado);
}

export default function DashboardCocina({ usuario, onCerrarSesion }) {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargarPedidos() {
            try {
                setLoading(true);
                setError("");

                const data = await getPedidos();
                setPedidos(data);
            } catch (error) {
                console.error(error);
                setPedidos([]);
                setError("No se pudieron cargar los pedidos de cocina.");
            } finally {
                setLoading(false);
            }
        }

        cargarPedidos();
    }, []);

    const pedidosCocina = useMemo(() => {
        return pedidos.filter(esPedidoParaCocina);
    }, [pedidos]);

    return (
        <div className="dashboard-shell">
            <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

            <main className="page-container dashboard-page">
                <header className="dashboard-hero">
                    <h1 className="page-title dashboard-title">Pedidos de Cocina</h1>
                    <p className="page-subtitle">
                        Consulta los pedidos pendientes de preparación
                    </p>
                </header>

                <section className="card cocina-card">
                    <div className="cocina-card-header">
                        <div>
                            <h2 className="section-title">Bandeja de cocina</h2>
                            <p className="page-subtitle">
                                Pedidos pendientes y en preparación
                            </p>
                        </div>

                        <span className="cocina-counter">
                            {pedidosCocina.length}
                        </span>
                    </div>

                    {loading && <p className="loading-text">Cargando pedidos...</p>}

                    {!loading && error && (
                        <p className="error-text">{error}</p>
                    )}

                    {!loading && !error && pedidosCocina.length === 0 && (
                        <div className="empty-state cocina-empty-state">
                            <p>No hay pedidos pendientes para cocina.</p>
                        </div>
                    )}

                    {!loading && !error && pedidosCocina.length > 0 && (
                        <div className="cocina-orders-list">
                            {pedidosCocina.map((pedido) => (
                                <article
                                    key={pedido.id_pedido}
                                    className="cocina-order-card"
                                >
                                    <div className="cocina-order-header">
                                        <div>
                                            <h3>{pedido.numero_pedido}</h3>
                                            <p>
                                                Mesa {pedido.id_mesa} · {formatearHora(pedido.fecha_hora_creacion)}
                                            </p>
                                        </div>

                                        <span className="status-pill">
                                            {formatearEstado(pedido.estado)}
                                        </span>
                                    </div>

                                    <div className="cocina-order-products">
                                        {(pedido.items || []).map((item, index) => (
                                            <div
                                                key={`${pedido.id_pedido}-${item.id_producto}-${index}`}
                                                className="cocina-product-row"
                                            >
                                                <div>
                                                    <strong>
                                                        {item.cantidad} × {item.nombre_producto}
                                                    </strong>

                                                    {item.observacion_item && (
                                                        <p className="item-note">
                                                            Nota: {item.observacion_item}
                                                        </p>
                                                    )}
                                                </div>

                                                <span>
                                                    $ {formatearPrecio(item.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}