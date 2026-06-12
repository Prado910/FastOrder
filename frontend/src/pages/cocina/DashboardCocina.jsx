import { useCallback, useEffect, useMemo, useState } from "react";

import HeaderMesero from "../../components/mesero/HeaderMesero";
import {
    actualizarEstadoPedido,
    getPedidosCocina,
} from "../../services/api";

const ESTADOS_COCINA = {
    PENDIENTE: "Pendientes",
    EN_PREPARACION: "En Preparación",
    LISTO: "Listos",
};

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
    return ESTADOS_COCINA[estado] || estado || "";
}

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

function obtenerMesa(pedido) {
    return pedido.numero_mesa || pedido.id_mesa;
}

function contarProductos(items = []) {
    return items.reduce((total, item) => total + Number(item.cantidad || 0), 0);
}

function obtenerPrimerProducto(items = []) {
    if (!items.length) return "Sin productos";

    const primero = items[0];
    return `${primero.cantidad}x ${primero.nombre_producto}`;
}

const LIMITE_NOTA_COCINA = 120;

function normalizarNota(nota) {
    return String(nota || "").trim();
}

function debeTruncarNota(nota) {
    return normalizarNota(nota).length > LIMITE_NOTA_COCINA;
}

function obtenerNotaVisible(nota, expandida) {
    const texto = normalizarNota(nota);

    if (!debeTruncarNota(texto) || expandida) {
        return texto;
    }

    return `${texto.slice(0, LIMITE_NOTA_COCINA).trim()}...`;
}

function obtenerClaseEstado(estado) {
    if (estado === "PENDIENTE") return "kitchen-status kitchen-status-pending";
    if (estado === "EN_PREPARACION") return "kitchen-status kitchen-status-preparing";
    return "kitchen-status kitchen-status-ready";
}

export default function DashboardCocina({ usuario, onCerrarSesion }) {
    const [pedidos, setPedidos] = useState([]);
    const [estadoActivo, setEstadoActivo] = useState("PENDIENTE");
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [toastCambioEstado, setToastCambioEstado] = useState(null);
    const [notasExpandidas, setNotasExpandidas] = useState({});


    const cargarPedidos = useCallback(async () => {
        try {
            setError("");

            const data = await getPedidosCocina();
            setPedidos(data);

            setPedidoSeleccionado((pedidoActual) => {
                if (!pedidoActual) {
                    return null;
                }

                const pedidoActualizado = data.find(
                    (pedido) => pedido.id_pedido === pedidoActual.id_pedido
                );

                return pedidoActualizado || null;
            });
        } catch (error) {
            console.error(error);
            setPedidos([]);
            setError("No se pudieron cargar los pedidos de cocina.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarPedidos();

        const intervalo = setInterval(() => {
            cargarPedidos();
        }, 15000);

        return () => clearInterval(intervalo);
    }, [cargarPedidos]);

    useEffect(() => {
        if (!toastCambioEstado) return;

        const timer = setTimeout(() => {
            setToastCambioEstado(null);
        }, 2500);

        return () => clearTimeout(timer);
    }, [toastCambioEstado]);

    const pedidosPorEstado = useMemo(() => {
        return {
            PENDIENTE: pedidos.filter((pedido) => pedido.estado === "PENDIENTE"),
            EN_PREPARACION: pedidos.filter((pedido) => pedido.estado === "EN_PREPARACION"),
            LISTO: pedidos.filter((pedido) => pedido.estado === "LISTO"),
        };
    }, [pedidos]);

    const pedidosVisibles = pedidosPorEstado[estadoActivo] || [];

    function seleccionarEstado(estado) {
        setEstadoActivo(estado);
        setMensaje("");
    }

    function seleccionarPedido(pedido) {
        setPedidoSeleccionado(pedido);
        setNotasExpandidas({});
        setMensaje("");
    }

    function volverAlPanel() {
        setPedidoSeleccionado(null);
        setNotasExpandidas({});
        setMensaje("");
        setError("");
    }

    function obtenerSiguienteEstadoPedido(pedido) {
        if (!pedido) return null;

        if (pedido.estado === "PENDIENTE") {
            return "EN_PREPARACION";
        }

        if (pedido.estado === "EN_PREPARACION") {
            return "LISTO";
        }

        return null;
    }

    function obtenerTextoBotonAccion(pedido) {
        if (!pedido) return "";

        if (pedido.estado === "PENDIENTE") {
            return "Marcar en Preparación";
        }

        if (pedido.estado === "EN_PREPARACION") {
            return "Marcar como Listo";
        }

        return "";
    }

    function obtenerMensajeCambioEstado(nuevoEstado) {
        if (nuevoEstado === "EN_PREPARACION") {
            return "Pedido marcado como En Preparación";
        }

        if (nuevoEstado === "LISTO") {
            return "Pedido marcado como Listo";
        }

        return "Estado del pedido actualizado";
    }

    function alternarNotaProducto(notaKey) {
        setNotasExpandidas((notasActuales) => ({
            ...notasActuales,
            [notaKey]: !notasActuales[notaKey],
        }));
    }

    async function cambiarEstadoPedido(pedidoBase = pedidoSeleccionado) {
        if (!pedidoBase) {
            setMensaje("Debe seleccionar un pedido para consultar el detalle");
            return;
        }

        const nuevoEstado = obtenerSiguienteEstadoPedido(pedidoBase);

        if (!nuevoEstado) {
            return;
        }

        try {
            setActualizando(true);
            setMensaje("");

            const pedidoActualizado = await actualizarEstadoPedido(
                pedidoBase.id_pedido,
                nuevoEstado
            );

            setPedidos((pedidosActuales) =>
                pedidosActuales.map((pedido) =>
                    pedido.id_pedido === pedidoActualizado.id_pedido
                        ? pedidoActualizado
                        : pedido
                )
            );

            setPedidoSeleccionado((pedidoActual) => {
                if (!pedidoActual) {
                    return null;
                }

                return pedidoActual.id_pedido === pedidoActualizado.id_pedido
                    ? pedidoActualizado
                    : pedidoActual;
            });

            setEstadoActivo(pedidoActualizado.estado);

            setToastCambioEstado({
                id: Date.now(),
                mensaje: obtenerMensajeCambioEstado(nuevoEstado),
            });
        } catch (error) {
            console.error(error);

            const mensajeError =
                error.message || "No se pudo actualizar el estado del pedido.";

            const esVistaDesactualizada =
                mensajeError.toLowerCase().includes("otra sesión") ||
                mensajeError.toLowerCase().includes("actualiza el listado") ||
                mensajeError.toLowerCase().includes("ya se encuentra en estado");

            if (esVistaDesactualizada) {
                await cargarPedidos();

                setEstadoActivo(nuevoEstado);

                setMensaje(
                    "El pedido ya fue actualizado desde otra sesión. Se refrescó el listado y ahora puedes ver el estado actual."
                );

                setToastCambioEstado({
                    id: Date.now(),
                    mensaje: "Pedido actualizado desde otra sesión",
                });

                return;
            }

            setMensaje(mensajeError);
        } finally {
            setActualizando(false);
        }
    }

    function cambiarEstadoDesdeTarjeta(event, pedido) {
        event.stopPropagation();
        cambiarEstadoPedido(pedido);
    }

    function obtenerClaseBotonAccion(pedido) {
        if (!pedido) return "kitchen-action-button";

        if (pedido.estado === "PENDIENTE") {
            return "kitchen-action-button kitchen-action-button-blue";
        }

        if (pedido.estado === "EN_PREPARACION") {
            return "kitchen-action-button kitchen-action-button-green";
        }

        return "kitchen-action-button";
    }

    if (pedidoSeleccionado) {
        const puedeActualizar = ["PENDIENTE", "EN_PREPARACION"].includes(
            pedidoSeleccionado.estado
        );

        return (
            <div className="dashboard-shell">
                <HeaderMesero
                    usuario={usuario}
                    onCerrarSesion={onCerrarSesion}
                />

                {toastCambioEstado && (
                    <div className="cocina-estado-toast" role="status" aria-live="polite">
                        <span className="cocina-estado-toast-icon">✓</span>
                        <span>{toastCambioEstado.mensaje}</span>
                    </div>
                )}

                <main className="kitchen-page kitchen-detail-page">
                    <button
                        type="button"
                        className="kitchen-back-button"
                        onClick={volverAlPanel}
                    >
                        ← Volver
                    </button>

                    <section className="kitchen-detail-card">
                        <div className="kitchen-detail-header">
                            <h1>Detalle del Pedido</h1>

                            <span className={obtenerClaseEstado(pedidoSeleccionado.estado)}>
                                {formatearEstado(pedidoSeleccionado.estado)}
                            </span>
                        </div>

                        <div className="kitchen-detail-info">
                            <div>
                                <p>Número de Pedido</p>
                                <strong>{pedidoSeleccionado.numero_pedido}</strong>
                            </div>

                            <div>
                                <p>Mesa</p>
                                <strong>{obtenerMesa(pedidoSeleccionado)}</strong>
                            </div>

                            <div>
                                <p>Mesero</p>
                                <strong>{pedidoSeleccionado.mesero || "No registrado"}</strong>
                            </div>

                            <div>
                                <p>Hora</p>
                                <strong>◷ {formatearHora(pedidoSeleccionado.fecha_hora_creacion)}</strong>
                            </div>
                        </div>

                        {mensaje && (
                            <p className="kitchen-message kitchen-message-detail">
                                {mensaje}
                            </p>
                        )}

                        <h2 className="kitchen-products-title">Productos</h2>

                        <div className="kitchen-products-list">
                            {pedidoSeleccionado.items.map((item, index) => {
                                const notaKey = `${pedidoSeleccionado.id_pedido}-${item.id_producto}-${index}`;
                                const notaExpandida = !!notasExpandidas[notaKey];

                                return (
                                    <article
                                        key={notaKey}
                                        className="kitchen-product-row"
                                    >
                                        <div className="kitchen-product-main">
                                            <strong className="kitchen-product-name">
                                                {item.cantidad}x {item.nombre_producto}
                                            </strong>

                                            {item.observacion_item && (
                                                <div className="kitchen-product-note-wrap">
                                                    <p className="kitchen-product-note">
                                                        <span className="kitchen-product-note-label">
                                                            Nota:
                                                        </span>{" "}
                                                        {obtenerNotaVisible(
                                                            item.observacion_item,
                                                            notaExpandida
                                                        )}
                                                    </p>

                                                    {debeTruncarNota(item.observacion_item) && (
                                                        <button
                                                            type="button"
                                                            className="kitchen-note-toggle"
                                                            onClick={() => alternarNotaProducto(notaKey)}
                                                        >
                                                            {notaExpandida ? "Ver menos" : "Ver más"}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <span className="kitchen-product-price">
                                            $ {formatearPrecio(item.subtotal)}
                                        </span>
                                    </article>
                                );
                            })}
                        </div>

                        {puedeActualizar && (
                            <button
                                type="button"
                                className={obtenerClaseBotonAccion(pedidoSeleccionado)}
                                onClick={() => cambiarEstadoPedido()}
                                disabled={actualizando}
                            >
                                {actualizando
                                    ? "Actualizando..."
                                    : obtenerTextoBotonAccion(pedidoSeleccionado)}
                            </button>
                        )}
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

            {toastCambioEstado && (
                <div className="cocina-estado-toast" role="status" aria-live="polite">
                    <span className="cocina-estado-toast-icon">✓</span>
                    <span>{toastCambioEstado.mensaje}</span>
                </div>
            )}

            <main className="kitchen-page">
                <section className="kitchen-title-block">
                    <div className="kitchen-title-icon">♨</div>

                    <div>
                        <h1>Panel de Cocina</h1>
                        <p>Gestiona los pedidos entrantes</p>
                    </div>
                </section>

                <section className="kitchen-summary-grid">
                    <article className="kitchen-summary-card kitchen-summary-pending">
                        <p>Pendientes</p>
                        <strong>{pedidosPorEstado.PENDIENTE.length}</strong>
                    </article>

                    <article className="kitchen-summary-card kitchen-summary-preparing">
                        <p>En Preparación</p>
                        <strong>{pedidosPorEstado.EN_PREPARACION.length}</strong>
                    </article>

                    <article className="kitchen-summary-card kitchen-summary-ready">
                        <p>Listos</p>
                        <strong>{pedidosPorEstado.LISTO.length}</strong>
                    </article>
                </section>

                <section className="kitchen-tabs">
                    {Object.entries(ESTADOS_COCINA).map(([estado, label]) => (
                        <button
                            key={estado}
                            type="button"
                            className={
                                estadoActivo === estado
                                    ? "kitchen-tab kitchen-tab-active"
                                    : "kitchen-tab"
                            }
                            onClick={() => seleccionarEstado(estado)}
                        >
                            {label} ({pedidosPorEstado[estado].length})
                        </button>
                    ))}
                </section>

                {loading && (
                    <p className="loading-text">Cargando pedidos de cocina...</p>
                )}

                {!loading && error && (
                    <p className="error-text">{error}</p>
                )}

                {!loading && !error && mensaje && (
                    <p className="kitchen-message">{mensaje}</p>
                )}

                {!loading && !error && pedidosVisibles.length === 0 && (
                    <section className="kitchen-empty-state">
                        <div className="kitchen-empty-icon">♨</div>
                        <p>No hay pedidos pendientes</p>
                    </section>
                )}

                {!loading && !error && pedidosVisibles.length > 0 && (
                    <section className="kitchen-orders-grid">
                        {pedidosVisibles.map((pedido) => (
                            <article
                                key={pedido.id_pedido}
                                className="kitchen-order-card"
                                role="button"
                                tabIndex={0}
                                onClick={() => seleccionarPedido(pedido)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        seleccionarPedido(pedido);
                                    }
                                }}
                            >
                                <div className="kitchen-order-top">
                                    <p>Pedido {pedido.numero_pedido}</p>

                                    <span className={obtenerClaseEstado(pedido.estado)}>
                                        {formatearEstado(pedido.estado)}
                                    </span>
                                </div>

                                <h2>Mesa {obtenerMesa(pedido)}</h2>

                                <p className="kitchen-order-product">
                                    {obtenerPrimerProducto(pedido.items)}
                                </p>

                                <div className="kitchen-order-footer">
                                    <span>◷ {formatearHora(pedido.fecha_hora_creacion)}</span>
                                    <span>{contarProductos(pedido.items)} productos</span>
                                </div>

                                {obtenerSiguienteEstadoPedido(pedido) && (
                                    <button
                                        type="button"
                                        className={obtenerClaseBotonAccion(pedido)}
                                        onClick={(event) => cambiarEstadoDesdeTarjeta(event, pedido)}
                                        disabled={actualizando}
                                    >
                                        {actualizando
                                            ? "Actualizando..."
                                            : obtenerTextoBotonAccion(pedido)}
                                    </button>
                                )}
                            </article>
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
}