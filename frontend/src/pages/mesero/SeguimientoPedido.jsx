import { useState } from "react";

import { eliminarPedido } from "../../services/api";
import trashIcon from "../../assets/trash.png";

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

function formatearEstado(estado) {
    if (!estado) return "";

    return estado
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (l) => l.toUpperCase());
}

function contarProductos(items = []) {
    return items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}

const PASOS = [
    "PENDIENTE",
    "EN_PREPARACION",
    "LISTO",
    "ENTREGADO",
    "FACTURADO",
];

export default function SeguimientoPedido({ pedido, onVolver, onPedidoEliminado }) {
    const [mostrarModal, setMostrarModal] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [error, setError] = useState("");

    if (!pedido) {
        return (
            <main className="page-container">
                <button type="button" className="back-link" onClick={onVolver}>
                    ← Volver
                </button>
                <p>No hay pedido seleccionado.</p>
            </main>
        );
    }

    const pasoActual = Math.max(PASOS.indexOf(pedido.estado), 0);
    const puedeEliminar = pedido.estado === "PENDIENTE";
    const cantidadProductos = contarProductos(pedido.items);

    async function confirmarEliminacion() {
        try {
            setEliminando(true);
            setError("");

            await eliminarPedido(pedido.id_pedido);
            setMostrarModal(false);

            if (onPedidoEliminado) {
                onPedidoEliminado();
            } else {
                onVolver();
            }
        } catch (error) {
            console.error(error);
            setError(error.message || "No se pudo eliminar el pedido.");
        } finally {
            setEliminando(false);
        }
    }

    return (
        <main className="page-container seguimiento-page">
            <button type="button" className="back-link" onClick={onVolver}>
                ← Volver
            </button>

            <section className="card seguimiento-card">
                <div className="seguimiento-header">
                    <h2 className="section-title">Seguimiento del Pedido</h2>
                    <span className="status-pill">{formatearEstado(pedido.estado)}</span>
                </div>

                <p className="pedido-encontrado-msg">Pedido encontrado</p>

                <div className="pedido-detail-summary">
                    <div>
                        <p className="text-muted">Número de Pedido</p>
                        <strong>{pedido.numero_pedido}</strong>
                    </div>

                    <div>
                        <p className="text-muted">Mesa</p>
                        <strong>{pedido.id_mesa}</strong>
                    </div>

                    <div>
                        <p className="text-muted">Hora de Creación</p>
                        <strong>{formatearHora(pedido.fecha_hora_creacion)}</strong>
                    </div>

                    <div>
                        <p className="text-muted">Total</p>
                        <strong className="price-strong">$ {formatearPrecio(pedido.total)}</strong>
                    </div>
                </div>

                {error && <p className="error-text seguimiento-error">{error}</p>}

                {puedeEliminar && (
                    <button
                        type="button"
                        className="btn btn-danger btn-block seguimiento-delete-btn"
                        onClick={() => setMostrarModal(true)}
                        disabled={eliminando}
                    >
                        <img src={trashIcon} alt="" className="seguimiento-delete-icon" />
                        Eliminar Pedido
                    </button>
                )}

                <div className="progress-section">
                    <h3>Progreso del Pedido</h3>

                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${((pasoActual + 1) / PASOS.length) * 100}%` }}
                        />
                    </div>

                    <div className="progress-steps">
                        {PASOS.map((paso, index) => {
                            const activo = index === pasoActual;
                            const completado = index < pasoActual;

                            return (
                                <div
                                    key={paso}
                                    className={`progress-step ${activo ? "progress-step-active" : ""} ${completado ? "progress-step-completed" : ""}`}
                                >
                                    <div className="progress-step-number">{index + 1}</div>
                                    <span>{formatearEstado(paso)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="products-section">
                    <h3>Productos del Pedido</h3>

                    <ul className="item-list">
                        {(pedido.items || []).map((item, index) => (
                            <li key={`${item.id_producto}-${index}`} className="item-row pedido-detail-item">
                                <div>
                                    <strong>{item.nombre_producto}</strong>
                                    <div>
                                        {item.cantidad} × $ {formatearPrecio(item.precio_unitario)}
                                    </div>
                                    {item.observacion_item && (
                                        <div className="item-note">Nota: {item.observacion_item}</div>
                                    )}
                                </div>

                                <div className="price-strong">
                                    $ {formatearPrecio(item.subtotal)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {mostrarModal && (
                <div className="modal-overlay" role="presentation">
                    <div className="modal-card eliminar-pedido-modal" role="dialog" aria-modal="true">
                        <h2 className="modal-title">¿Eliminar este pedido?</h2>

                        <p className="modal-description">
                            Esta acción eliminará el pedido <strong>{pedido.numero_pedido}</strong> de la mesa {pedido.id_mesa}. Esta acción no se puede deshacer.
                        </p>

                        <div className="delete-order-details">
                            <p className="text-muted">Detalles del pedido:</p>
                            <p><strong>Total:</strong> $ {formatearPrecio(pedido.total)}</p>
                            <p>{cantidadProductos} producto{cantidadProductos !== 1 ? "s" : ""}</p>
                            <p><strong>Estado:</strong> {formatearEstado(pedido.estado)}</p>
                        </div>

                        {error && <p className="error-text seguimiento-error">{error}</p>}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setMostrarModal(false)}
                                disabled={eliminando}
                            >
                                Volver
                            </button>

                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={confirmarEliminacion}
                                disabled={eliminando}
                            >
                                {eliminando ? "Eliminando..." : "Eliminar Pedido"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
