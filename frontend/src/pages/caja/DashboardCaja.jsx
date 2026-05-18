import { useEffect, useMemo, useState } from "react";

import HeaderMesero from "../../components/mesero/HeaderMesero";
import {
    getPedidos,
    getPedidosCaja,
} from "../../services/api";

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

function formatearFechaHora(fecha) {
    if (!fecha) return "--/--/---- --:--";

    const fechaPedido = new Date(fecha);

    if (Number.isNaN(fechaPedido.getTime())) {
        return "--/--/---- --:--";
    }

    const fechaFormateada = fechaPedido.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
    });

    const horaFormateada = fechaPedido.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    return `${fechaFormateada} ${horaFormateada}`;
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

function obtenerMesa(pedido) {
    return pedido.numero_mesa || pedido.id_mesa;
}

function formatearEstado(estado) {
    if (!estado) return "";

    return estado
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (letra) => letra.toUpperCase());
}

export default function DashboardCaja({ usuario, onCerrarSesion }) {
    const [pedidosCaja, setPedidosCaja] = useState([]);
    const [pedidosGenerales, setPedidosGenerales] = useState([]);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function cargarPedidos() {
        try {
            setLoading(true);
            setError("");

            const [pedidosListos, todosLosPedidos] = await Promise.all([
                getPedidosCaja(),
                getPedidos(),
            ]);

            setPedidosCaja(pedidosListos);
            setPedidosGenerales(todosLosPedidos);
        } catch (error) {
            console.error(error);
            setPedidosCaja([]);
            setPedidosGenerales([]);
            setError("No se pudieron cargar los pedidos de caja.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarPedidos();
    }, []);

    const pedidosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) {
            return pedidosCaja;
        }

        return pedidosCaja.filter((pedido) => {
            const numeroPedido = String(pedido.numero_pedido || "").toLowerCase();
            const mesa = String(obtenerMesa(pedido) || "").toLowerCase();
            const textoMesa = `mesa ${mesa}`;
            const estado = String(pedido.estado || "").toLowerCase();

            return (
                numeroPedido.includes(texto) ||
                mesa.includes(texto) ||
                textoMesa.includes(texto) ||
                estado.includes(texto)
            );
        });
    }, [pedidosCaja, busqueda]);

    const pedidosFacturadosHoy = useMemo(() => {
        return pedidosGenerales.filter(
            (pedido) => pedido.estado === "FACTURADO" && esPedidoDeHoy(pedido)
        );
    }, [pedidosGenerales]);

    const totalPendiente = useMemo(() => {
        return pedidosCaja.reduce(
            (total, pedido) => total + Number(pedido.total || 0),
            0
        );
    }, [pedidosCaja]);

    const totalDia = useMemo(() => {
        return pedidosFacturadosHoy.reduce(
            (total, pedido) => total + Number(pedido.total || 0),
            0
        );
    }, [pedidosFacturadosHoy]);

    const busquedaActiva = busqueda.trim().length > 0;
    const sinResultados = busquedaActiva && pedidosFiltrados.length === 0;

    function limpiarBusqueda() {
        setBusqueda("");
    }

    function abrirDetalle(pedido) {
        setPedidoSeleccionado(pedido);
    }

    function volverAlListado() {
        setPedidoSeleccionado(null);
    }

    if (pedidoSeleccionado) {
        return (
            <div className="dashboard-shell">
                <HeaderMesero
                    usuario={usuario}
                    onCerrarSesion={onCerrarSesion}
                />

                <main className="cashier-detail-page">
                    <button
                        type="button"
                        className="cashier-back-button"
                        onClick={volverAlListado}
                    >
                        ← Volver
                    </button>

                    <section className="invoice-detail-card">
                        <header className="invoice-detail-hero">
                            <div className="invoice-detail-icon">▤</div>

                            <div>
                                <h1>Detalle de Factura</h1>
                                <p>Pedido {pedidoSeleccionado.numero_pedido}</p>
                            </div>
                        </header>

                        <div className="invoice-detail-body">
                            <section className="invoice-info-grid">
                                <div>
                                    <p>Mesa</p>
                                    <strong>{obtenerMesa(pedidoSeleccionado)}</strong>
                                </div>

                                <div>
                                    <p>Atendido por</p>
                                    <strong>{pedidoSeleccionado.mesero || "No registrado"}</strong>
                                </div>

                                <div>
                                    <p>Fecha y Hora</p>
                                    <strong>
                                        {formatearFechaHora(pedidoSeleccionado.fecha_hora_creacion)}
                                    </strong>
                                </div>

                                <div>
                                    <p>Estado</p>
                                    <strong>{String(pedidoSeleccionado.estado || "").toLowerCase()}</strong>
                                </div>
                            </section>

                            <section className="invoice-products-section">
                                <h2>Productos</h2>

                                <div className="invoice-products-list">
                                    {pedidoSeleccionado.items.map((item) => (
                                        <article
                                            key={`${item.id_producto}-${item.nombre_producto}`}
                                            className="invoice-product-row"
                                        >
                                            <div>
                                                <strong>{item.nombre_producto}</strong>
                                                <p>
                                                    {item.cantidad} × ${formatearPrecio(item.precio_unitario)}
                                                </p>

                                                {item.observacion_item && (
                                                    <p className="invoice-product-note">
                                                        Nota: {item.observacion_item}
                                                    </p>
                                                )}
                                            </div>

                                            <span>
                                                $ {formatearPrecio(item.subtotal)}
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="invoice-total-row">
                                <h2>Total:</h2>

                                <strong>
                                    $ {formatearPrecio(pedidoSeleccionado.total)}
                                </strong>
                            </section>

                            <section className="invoice-detail-actions">
                                <button
                                    type="button"
                                    className="btn invoice-secondary-button"
                                    onClick={volverAlListado}
                                >
                                    Volver
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary invoice-primary-button"
                                    onClick={() => {
                                        alert("La generación de factura se desarrolla en la HU7.");
                                    }}
                                >
                                    Facturar
                                </button>
                            </section>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero
                usuario={usuario}
                onCerrarSesion={onCerrarSesion}
            />

            <main className="cashier-page">
                <section className="cashier-title-block">
                    <div className="cashier-title-icon">$</div>

                    <div>
                        <h1>Panel de Caja</h1>
                        <p>Gestiona las facturas y pagos</p>
                    </div>
                </section>

                <section className="cashier-summary-grid">
                    <article className="cashier-summary-card cashier-summary-pending">
                        <p>Pendientes por Facturar</p>
                        <strong>{pedidosCaja.length}</strong>
                        <span>$ {formatearPrecio(totalPendiente)}</span>
                    </article>

                    <article className="cashier-summary-card cashier-summary-today">
                        <p>Facturados Hoy</p>
                        <strong>{pedidosFacturadosHoy.length}</strong>
                        <span>$ {formatearPrecio(totalDia)}</span>
                    </article>

                    <article className="cashier-summary-card cashier-summary-total">
                        <p>Total del Día</p>
                        <strong>$ {formatearPrecio(totalDia)}</strong>
                    </article>
                </section>

                <section className="cashier-orders-card">
                    <div className="cashier-card-header">
                        <h2>Pedidos Pendientes por Facturar</h2>
                        <p>Selecciona un pedido para generar la factura</p>
                    </div>

                    <div className="cashier-search-wrap">
                        <span className="cashier-search-icon">⌕</span>

                        <input
                            type="text"
                            className="cashier-search-input"
                            placeholder="Buscar por número de pedido, mesa o estado..."
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                        />

                        {busquedaActiva && (
                            <button
                                type="button"
                                className="cashier-search-clear"
                                onClick={limpiarBusqueda}
                                aria-label="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {loading && (
                        <section className="cashier-empty-state">
                            <p>Cargando pedidos...</p>
                        </section>
                    )}

                    {!loading && error && (
                        <p className="error-text">{error}</p>
                    )}

                    {!loading && !error && sinResultados && (
                        <section className="cashier-empty-state cashier-empty-search">
                            <div className="cashier-empty-icon">⌕</div>
                            <p>
                                No se encontraron pedidos con "{busqueda.trim()}"
                            </p>
                        </section>
                    )}

                    {!loading && !error && !sinResultados && pedidosFiltrados.length === 0 && (
                        <section className="cashier-empty-state">
                            <p>No hay pedidos pendientes por facturar</p>
                        </section>
                    )}

                    {!loading && !error && !sinResultados && pedidosFiltrados.length > 0 && (
                        <div className="cashier-table-wrap">
                            <table className="cashier-table">
                                <thead>
                                    <tr>
                                        <th>Pedido</th>
                                        <th>Mesa</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pedidosFiltrados.map((pedido) => (
                                        <tr key={pedido.id_pedido}>
                                            <td>{pedido.numero_pedido}</td>
                                            <td>Mesa {obtenerMesa(pedido)}</td>
                                            <td>
                                                <span className="cashier-status-ready">
                                                    {formatearEstado(pedido.estado)}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>
                                                    $ {formatearPrecio(pedido.total)}
                                                </strong>
                                            </td>
                                            <td>
                                                <div className="cashier-actions">
                                                    <button
                                                        type="button"
                                                        className="cashier-detail-button"
                                                        onClick={() => abrirDetalle(pedido)}
                                                    >
                                                        Ver Detalle
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="cashier-invoice-button"
                                                        onClick={() => abrirDetalle(pedido)}
                                                    >
                                                        Generar Factura
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}