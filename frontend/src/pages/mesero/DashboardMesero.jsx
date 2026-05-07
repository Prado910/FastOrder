import { useEffect, useMemo, useState } from "react";

import HeaderMesero from "../../components/mesero/HeaderMesero";
import { getPedidos } from "../../services/api";

import orderIcon from "../../assets/order.png";
import orderWhiteIcon from "../../assets/orderWhite.png";
import searchIcon from "../../assets/search.png";

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

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

function contarProductos(items = []) {
    return items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}

function formatearEstado(estado) {
    if (!estado) return "";

    return estado
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (letra) => letra.toUpperCase());
}

function esPedidoDeHoy(pedido) {
    if (!pedido.fecha_hora_creacion) return false;

    const fechaPedido = new Date(pedido.fecha_hora_creacion);
    const hoy = new Date();

    if (Number.isNaN(fechaPedido.getTime())) {
        return false;
    }

    return (
        fechaPedido.getFullYear() === hoy.getFullYear() &&
        fechaPedido.getMonth() === hoy.getMonth() &&
        fechaPedido.getDate() === hoy.getDate()
    );
}

function esPedidoActivo(pedido) {
    return !["ENTREGADO", "FACTURADO", "CANCELADO"].includes(pedido.estado);
}

export default function DashboardMesero({
    onNuevoPedido,
    onCerrarSesion,
    onVerPedido,
}) {
    const [pedidos, setPedidos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(false);
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
                setError("No se pudieron cargar los pedidos.");
            } finally {
                setLoading(false);
            }
        }

        cargarPedidos();
    }, []);

    const pedidosActivos = useMemo(() => {
        return pedidos.filter(esPedidoActivo);
    }, [pedidos]);

    const totalHoy = useMemo(() => {
        return pedidos.filter(esPedidoDeHoy).length;
    }, [pedidos]);

    const completados = useMemo(() => {
        return pedidos.filter((pedido) => pedido.estado === "ENTREGADO").length;
    }, [pedidos]);

    const pedidosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return pedidosActivos;

        return pedidosActivos.filter((pedido) => {
            const numeroPedido = String(pedido.numero_pedido || "").toLowerCase();
            const mesa = String(pedido.id_mesa || "").toLowerCase();
            const textoMesa = `mesa ${mesa}`;

            return (
                numeroPedido.includes(texto) ||
                mesa.includes(texto) ||
                textoMesa.includes(texto)
            );
        });
    }, [pedidosActivos, busqueda]);

    const busquedaActiva = busqueda.trim().length > 0;
    const pedidoNoEncontrado = busquedaActiva && pedidosFiltrados.length === 0;

    return (
        <div className="dashboard-shell">
            <HeaderMesero onCerrarSesion={onCerrarSesion} />

            <main className="page-container dashboard-page">
                <section className="dashboard-hero">
                    <div>
                        <h1 className="page-title dashboard-title">
                            Bienvenido, Carlos Méndez
                        </h1>
                        <p className="page-subtitle dashboard-subtitle">
                            Gestiona tus pedidos de forma eficiente
                        </p>
                    </div>
                </section>

                <section className="dashboard-metrics">
                    <article className="metric-card metric-card-danger">
                        <div>
                            <p className="metric-label">Pedidos Activos</p>
                            <h2 className="metric-value">{pedidosActivos.length}</h2>
                        </div>

                        <img
                            src={orderWhiteIcon}
                            alt=""
                            className="metric-icon-img"
                        />
                    </article>

                    <article className="metric-card metric-card-warning">
                        <div>
                            <p className="metric-label">Total Hoy</p>
                            <h2 className="metric-value">{totalHoy}</h2>
                        </div>

                        <img
                            src={orderWhiteIcon}
                            alt=""
                            className="metric-icon-img"
                        />
                    </article>

                    <article className="metric-card metric-card-success">
                        <div>
                            <p className="metric-label">Completados</p>
                            <h2 className="metric-value">{completados}</h2>
                        </div>

                        <img
                            src={orderWhiteIcon}
                            alt=""
                            className="metric-icon-img"
                        />
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
                            <p className="page-subtitle">
                                Gestiona tus pedidos en curso
                            </p>
                        </div>
                    </div>

                    <div className="search-input-wrap">
                        <img
                            src={searchIcon}
                            alt=""
                            className="search-input-icon"
                        />

                        <input
                            type="text"
                            placeholder="Buscar por mesa número de pedido..."
                            className="search-input search-input-with-icon"
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="error-text">
                            {error}
                        </p>
                    )}

                    {loading ? (
                        <div className="empty-state empty-state-large">
                            <p>Cargando pedidos...</p>
                        </div>
                    ) : pedidoNoEncontrado ? (
                        <div className="empty-state empty-state-large">
                            <img
                                src={orderIcon}
                                alt=""
                                className="metric-icon-img"
                            />
                            <p className="error-text">No se encontró el pedido consultado</p>
                        </div>
                    ) : pedidosFiltrados.length === 0 ? (
                        <div className="empty-state empty-state-large">
                            <img
                                src={orderIcon}
                                alt=""
                                className="metric-icon-img"
                            />
                            <p>No hay pedidos activos</p>
                        </div>
                    ) : (
                        <div className="pedidos-activos-list">
                            {pedidosFiltrados.map((pedido) => {
                                const cantidadProductos = contarProductos(pedido.items);

                                return (
                                    <button
                                        key={pedido.id_pedido}
                                        type="button"
                                        className="pedido-active-row"
                                        onClick={() => onVerPedido(pedido)}
                                    >
                                        <div>
                                            <div className="pedido-row-header">
                                                <span className="mesa-pill">
                                                    Mesa {pedido.id_mesa}
                                                </span>

                                                <span>{pedido.numero_pedido}</span>
                                            </div>

                                            <p>
                                                {cantidadProductos} producto
                                                {cantidadProductos !== 1 ? "s" : ""}
                                            </p>

                                            <p className="text-muted">
                                                {formatearHora(pedido.fecha_hora_creacion)}
                                            </p>
                                        </div>

                                        <div className="pedido-row-side">
                                            <span className="status-pill">
                                                {formatearEstado(pedido.estado)}
                                            </span>

                                            <strong>
                                                $ {formatearPrecio(pedido.total)}
                                            </strong>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}