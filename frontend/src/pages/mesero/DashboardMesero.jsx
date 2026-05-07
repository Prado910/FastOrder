import { useEffect, useMemo, useState } from "react";
import HeaderMesero from "../../components/mesero/HeaderMesero";
import { getPedidosActivos } from "../../services/api";

import orderWhiteIcon from "../../assets/orderWhite.png";
import searchIcon from "../../assets/search.png";

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

function formatearHora(fecha) {
    if (!fecha) return "--:--";

    return new Date(fecha).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function contarProductos(items = []) {
    return items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}

function formatearEstado(estado) {
    if (!estado) return "";
    return estado
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (l) => l.toUpperCase());
}

export default function DashboardMesero({ onNuevoPedido, onCerrarSesion, onVerPedido }) {
    const [pedidos, setPedidos] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        async function cargarPedidos() {
            try {
                const data = await getPedidosActivos({ idUsuarioMesero: 1 });
                setPedidos(data);
            } catch (error) {
                console.error(error);
            }
        }

        cargarPedidos();
    }, []);

    const pedidosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return pedidos;

        return pedidos.filter((pedido) => {
            const numero = (pedido.numero_pedido || "").toLowerCase();
            const mesa = String(pedido.id_mesa || "");
            return numero.includes(texto) || mesa.includes(texto);
        });
    }, [pedidos, busqueda]);

    const totalHoy = pedidos.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);
    const completados = pedidos.filter((pedido) => pedido.estado === "ENTREGADO").length;

    return (
        <div className="dashboard-shell">
            <HeaderMesero onCerrarSesion={onCerrarSesion} />

            <main className="page-container dashboard-page">
                <section className="dashboard-hero">
                    <div>
                        <h1 className="page-title dashboard-title">Bienvenido, Carlos Méndez</h1>
                        <p className="page-subtitle dashboard-subtitle">
                            Gestiona tus pedidos de forma eficiente
                        </p>
                    </div>
                </section>

                <section className="dashboard-metrics">
                    <article className="metric-card metric-card-danger">
                        <div>
                            <p className="metric-label">Pedidos Activos</p>
                            <h2 className="metric-value">{pedidos.length}</h2>
                        </div>
                        <img src={orderWhiteIcon} alt="" className="metric-icon-img" />
                    </article>

                    <article className="metric-card metric-card-warning">
                        <div>
                            <p className="metric-label">Total Hoy</p>
                            <h2 className="metric-value">{formatearPrecio(totalHoy)}</h2>
                        </div>
                        <img src={orderWhiteIcon} alt="" className="metric-icon-img" />
                    </article>

                    <article className="metric-card metric-card-success">
                        <div>
                            <p className="metric-label">Completados</p>
                            <h2 className="metric-value">{completados}</h2>
                        </div>
                        <img src={orderWhiteIcon} alt="" className="metric-icon-img" />
                    </article>
                </section>

                <section className="card dashboard-cta-card">
                    <button
                        type="button"
                        className="btn btn-primary btn-cta"
                        onClick={onNuevoPedido}
                    >
                        +&nbsp;&nbsp;Nuevo Pedido
                    </button>
                </section>

                <section className="card active-orders-card">
                    <div className="section-header active-orders-header">
                        <div>
                            <h2 className="section-title">Pedidos Activos</h2>
                            <p className="page-subtitle">Gestiona tus pedidos en curso</p>
                        </div>
                    </div>

                    <div className="search-input-wrap">
                        <img src={searchIcon} alt="" className="search-input-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por mesa o número de pedido..."
                            className="search-input search-input-with-icon"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {pedidosFiltrados.length === 0 ? (
                        <div className="empty-state empty-state-large">
                            <p>No hay pedidos activos</p>
                        </div>
                    ) : (
                        <div className="pedidos-activos-list">
                            {pedidosFiltrados.map((pedido) => (
                                <button
                                    key={pedido.id_pedido}
                                    type="button"
                                    className="pedido-active-row"
                                    onClick={() => onVerPedido(pedido)}
                                >
                                    <div>
                                        <div className="pedido-row-header">
                                            <span className="mesa-pill">Mesa {pedido.id_mesa}</span>
                                            <span>{pedido.numero_pedido}</span>
                                        </div>

                                        <p>
                                            {contarProductos(pedido.items)} producto
                                            {contarProductos(pedido.items) !== 1 ? "s" : ""}
                                        </p>
                                        <p className="text-muted">
                                            {formatearHora(pedido.fecha_hora_creacion)}
                                        </p>
                                    </div>

                                    <div className="pedido-row-side">
                                        <span className="status-pill">
                                            {formatearEstado(pedido.estado)}
                                        </span>
                                        <strong>$ {formatearPrecio(pedido.total)}</strong>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}