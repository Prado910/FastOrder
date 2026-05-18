import { useCallback, useEffect, useMemo, useState } from "react";

import HeaderMesero from "../../components/mesero/HeaderMesero";
import {
    consultarPedido,
    eliminarPedido,
    getPedidosAdmin,
} from "../../services/api";

import searchIcon from "../../assets/search.png";
import trashIcon from "../../assets/trash.png";

const ESTADOS = [
    { value: "TODOS", label: "Todos los estados" },
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "EN_PREPARACION", label: "En Preparación" },
    { value: "LISTO", label: "Listo" },
    { value: "ENTREGADO", label: "Entregado" },
    { value: "FACTURADO", label: "Facturado" },
    { value: "CANCELADO", label: "Cancelado" },
];

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO", {
        maximumFractionDigits: 0,
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "--/--/---- --:--";

    const fechaPedido = new Date(fecha);

    if (Number.isNaN(fechaPedido.getTime())) {
        return "--/--/---- --:--";
    }

    return fechaPedido.toLocaleString("es-CO", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatearEstado(estado) {
    const estados = {
        PENDIENTE: "Pendiente",
        EN_PREPARACION: "En Preparación",
        LISTO: "Listo",
        ENTREGADO: "Entregado",
        FACTURADO: "Facturado",
        CANCELADO: "Cancelado",
    };

    return estados[estado] || estado || "";
}

function obtenerClaseEstado(estado) {
    switch (estado) {
        case "PENDIENTE":
            return "admin-status admin-status-pending";
        case "EN_PREPARACION":
            return "admin-status admin-status-preparing";
        case "LISTO":
            return "admin-status admin-status-ready";
        case "FACTURADO":
            return "admin-status admin-status-billed";
        case "CANCELADO":
            return "admin-status admin-status-cancelled";
        default:
            return "admin-status";
    }
}

function obtenerMesa(pedido) {
    return pedido.numero_mesa || pedido.id_mesa;
}

export default function DashboardAdmin({ usuario, onCerrarSesion }) {
    const [pedidos, setPedidos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("TODOS");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pedidoDetalle, setPedidoDetalle] = useState(null);
    const [detalleLoading, setDetalleLoading] = useState(false);
    const [toast, setToast] = useState("");

    const rangoFechasInvalido = useMemo(() => {
        if (!fechaDesde || !fechaHasta) return false;
        return new Date(fechaDesde) > new Date(fechaHasta);
    }, [fechaDesde, fechaHasta]);

    const cargarPedidos = useCallback(async () => {
        if (rangoFechasInvalido) {
            setPedidos([]);
            setError("");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await getPedidosAdmin({
                criterio: busqueda,
                estado,
                fechaDesde,
                fechaHasta,
            });

            setPedidos(data);
        } catch (error) {
            console.error(error);
            setPedidos([]);
            setError(error.message || "No se pudieron cargar los pedidos.");
        } finally {
            setLoading(false);
        }
    }, [busqueda, estado, fechaDesde, fechaHasta, rangoFechasInvalido]);

    useEffect(() => {
        const timer = setTimeout(() => {
            cargarPedidos();
        }, 300);

        return () => clearTimeout(timer);
    }, [cargarPedidos]);

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast("");
        }, 2500);

        return () => clearTimeout(timer);
    }, [toast]);

    async function verDetallePedido(idPedido) {
        try {
            setDetalleLoading(true);
            setError("");

            const data = await consultarPedido(idPedido);
            setPedidoDetalle(data);
        } catch (error) {
            console.error(error);
            setError(error.message || "No se pudo consultar el detalle del pedido.");
        } finally {
            setDetalleLoading(false);
        }
    }

    async function eliminarPedidoAdmin(idPedido) {
        const confirmar = window.confirm("¿Deseas eliminar este pedido?");

        if (!confirmar) return;

        try {
            setError("");
            await eliminarPedido(idPedido);
            setToast("Pedido eliminado correctamente");
            await cargarPedidos();
        } catch (error) {
            console.error(error);
            setError(error.message || "No se pudo eliminar el pedido.");
        }
    }

    function limpiarFechas() {
        setFechaDesde("");
        setFechaHasta("");
    }

    function cerrarDetalle() {
        setPedidoDetalle(null);
    }

    function manejarReporte() {
        setToast("La generación de reportes se implementará en la HU9");
    }

    const sinResultados =
        !loading &&
        !error &&
        !rangoFechasInvalido &&
        pedidos.length === 0;

    return (
        <div className="dashboard-shell admin-shell">
            <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

            {toast && (
                <div className="pedido-eliminado-toast" role="status" aria-live="polite">
                    <span className="pedido-eliminado-toast-icon">✓</span>
                    <span>{toast}</span>
                </div>
            )}

            <main className="admin-page">
                <header className="admin-page-header">
                    <div className="admin-title-row">
                        <span className="admin-title-icon">▥</span>

                        <div>
                            <h1>Panel de Administrador</h1>
                            <p>Consulta y gestiona todos los pedidos del sistema</p>
                        </div>
                    </div>
                </header>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <div>
                            <h2>Consulta de Pedidos</h2>
                            <p>Filtra y consulta todos los pedidos realizados</p>
                        </div>
                    </div>

                    <section className="admin-toolbar">
                        <div className="admin-toolbar-left">
                            <label className="admin-search">
                                <img src={searchIcon} alt="" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(event) => setBusqueda(event.target.value)}
                                    placeholder="Buscar por pedido, mesa o mesero..."
                                />
                            </label>

                            <div className="admin-date-row">
                                <label className="admin-date-field">
                                    <span>Desde</span>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(event) => setFechaDesde(event.target.value)}
                                    />
                                </label>

                                <label className="admin-date-field">
                                    <span>Hasta</span>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(event) => setFechaHasta(event.target.value)}
                                    />
                                </label>

                                {(fechaDesde || fechaHasta) && (
                                    <button
                                        type="button"
                                        className="admin-clear-dates"
                                        onClick={limpiarFechas}
                                    >
                                        Limpiar fechas
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="admin-toolbar-right">
                            <button
                                type="button"
                                className="admin-report-button"
                                onClick={manejarReporte}
                            >
                                <span className="admin-report-button-icon">▣</span>
                                <span>Generar Reporte</span>
                            </button>

                            <select
                                className="admin-status-select"
                                value={estado}
                                onChange={(event) => setEstado(event.target.value)}
                            >
                                {ESTADOS.map((estadoItem) => (
                                    <option key={estadoItem.value} value={estadoItem.value}>
                                        {estadoItem.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {rangoFechasInvalido && (
                        <div className="admin-error-box" role="alert">
                            <span>!</span>
                            <strong>El rango de fechas no es válido.</strong>
                        </div>
                    )}

                    {!rangoFechasInvalido && error && (
                        <p className="error-text admin-error-text">{error}</p>
                    )}

                    {!rangoFechasInvalido && loading && (
                        <section className="admin-empty-state">
                            <p>Cargando pedidos...</p>
                        </section>
                    )}

                    {sinResultados && (
                        <section className="admin-empty-state">
                            <div className="admin-empty-icon">▥</div>
                            <p>No se encontraron pedidos</p>
                        </section>
                    )}

                    {!loading && !error && !rangoFechasInvalido && pedidos.length > 0 && (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Pedido</th>
                                        <th>Mesa</th>
                                        <th>Mesero</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                        <th>Fecha</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pedidos.map((pedido) => (
                                        <tr key={pedido.id_pedido}>
                                            <td>{pedido.numero_pedido}</td>
                                            <td>Mesa {obtenerMesa(pedido)}</td>
                                            <td>{pedido.mesero || "Sin mesero"}</td>
                                            <td>
                                                <span className={obtenerClaseEstado(pedido.estado)}>
                                                    {formatearEstado(pedido.estado)}
                                                </span>
                                            </td>
                                            <td className="admin-total">
                                                $ {formatearPrecio(pedido.total)}
                                            </td>
                                            <td>{formatearFecha(pedido.fecha_hora_creacion)}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        type="button"
                                                        className="admin-detail-button"
                                                        onClick={() => verDetallePedido(pedido.id_pedido)}
                                                        disabled={detalleLoading}
                                                    >
                                                        Ver Detalle
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-delete-button"
                                                        onClick={() => eliminarPedidoAdmin(pedido.id_pedido)}
                                                        aria-label="Eliminar pedido"
                                                    >
                                                        <img src={trashIcon} alt="" />
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

            {pedidoDetalle && (
                <div className="admin-modal-backdrop" role="presentation">
                    <section className="admin-detail-modal" role="dialog" aria-modal="true">
                        <div className="admin-detail-header">
                            <div>
                                <h2>Detalle del Pedido</h2>
                                <p>{pedidoDetalle.numero_pedido}</p>
                            </div>

                            <button type="button" onClick={cerrarDetalle}>
                                ×
                            </button>
                        </div>

                        <div className="admin-detail-info">
                            <p>
                                <strong>Mesa:</strong> Mesa {obtenerMesa(pedidoDetalle)}
                            </p>
                            <p>
                                <strong>Mesero:</strong> {pedidoDetalle.mesero || "Sin mesero"}
                            </p>
                            <p>
                                <strong>Estado:</strong> {formatearEstado(pedidoDetalle.estado)}
                            </p>
                            <p>
                                <strong>Fecha:</strong> {formatearFecha(pedidoDetalle.fecha_hora_creacion)}
                            </p>
                        </div>

                        <div className="admin-detail-items">
                            <h3>Productos</h3>

                            {(pedidoDetalle.items || []).map((item, index) => (
                                <article
                                    key={`${item.id_producto}-${index}`}
                                    className="admin-detail-item"
                                >
                                    <div>
                                        <strong>
                                            {item.cantidad} × {item.nombre_producto}
                                        </strong>

                                        {item.observacion_item && (
                                            <p>Nota: {item.observacion_item}</p>
                                        )}
                                    </div>

                                    <span>$ {formatearPrecio(item.subtotal)}</span>
                                </article>
                            ))}
                        </div>

                        <div className="admin-detail-total">
                            <span>Total</span>
                            <strong>$ {formatearPrecio(pedidoDetalle.total)}</strong>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}