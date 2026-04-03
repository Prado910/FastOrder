import { useMemo, useState } from "react";
import { crearPedido } from "../../services/api";
import HeaderMesero from "../../components/mesero/HeaderMesero";

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

export default function ResumenPedido({
    mesaSeleccionada,
    itemsPedido,
    setItemsPedido,
    onVolverAlMenu,
    onPedidoConfirmado,
    onCerrarSesion,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Calcula el total actual del pedido a partir de los subtotales de cada ítem
    const totalPedido = useMemo(() => {
        return itemsPedido.reduce((acc, item) => acc + Number(item.subtotal), 0);
    }, [itemsPedido]);

    function eliminarItem(indexAEliminar) {
        setItemsPedido((prev) => prev.filter((_, index) => index !== indexAEliminar));
    }

    async function confirmarPedido() {
        // No se permite confirmar un pedido vacío
        if (itemsPedido.length === 0) {
            setError("Debes agregar al menos un producto antes de confirmar.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Se adapta la estructura del pedido del frontend al formato esperado por la API
            const payload = {
                id_mesa: mesaSeleccionada.id_mesa,
                id_usuario_mesero: 1, // Temporal para Sprint 1; luego debe salir de la sesión del usuario autenticado
                items: itemsPedido.map((item) => ({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    observacion_item: item.observacion_item || null,
                })),
            };

            const pedidoCreado = await crearPedido(payload);
            // Notifica al componente padre que el pedido ya fue confirmado correctamente
            onPedidoConfirmado(pedidoCreado);
        } catch (err) {
            setError(err?.message || "No se pudo confirmar el pedido.");
        } finally {
            setLoading(false);
        }
    }

    if (!mesaSeleccionada) {
        return <p className="page-container">Primero debes seleccionar una mesa.</p>;
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero onCerrarSesion={onCerrarSesion} />

            <main className="page-container">
                <button
                    type="button"
                    onClick={onVolverAlMenu}
                    className="back-link resumen-back-link"
                    disabled={loading}
                >
                    ← Volver al menú
                </button>

                <section className="resumen-card">
                    <div className="resumen-header">
                        <div>
                            <h1 className="resumen-title">Resumen del Pedido</h1>
                            <p className="resumen-subtitle">
                                Mesa {mesaSeleccionada.numero_mesa}
                            </p>
                        </div>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <div className="resumen-items">
                        {itemsPedido.length === 0 ? (
                            <div className="empty-state resumen-empty-state">
                                <p>No hay productos agregados todavía.</p>
                            </div>
                        ) : (
                            itemsPedido.map((item, index) => (
                                <article
                                    key={`${item.id_producto}-${index}`}
                                    className="resumen-item-card"
                                >
                                    <div className="resumen-item-main">
                                        <h3 className="resumen-item-name">
                                            {item.nombre_producto}
                                        </h3>

                                        <p className="resumen-item-meta">
                                            Cantidad: {item.cantidad} × $
                                            {formatearPrecio(item.precio_unitario)}
                                        </p>

                                        {item.observacion_item && (
                                            <p className="resumen-item-note">
                                                Notas: {item.observacion_item}
                                            </p>
                                        )}

                                        <p className="resumen-item-subtotal">
                                            ${formatearPrecio(item.subtotal)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="resumen-delete-btn"
                                        onClick={() => eliminarItem(index)}
                                        disabled={loading}
                                        aria-label={`Eliminar ${item.nombre_producto}`}
                                        title="Eliminar producto"
                                    >
                                        🗑
                                    </button>
                                </article>
                            ))
                        )}
                    </div>

                    <div className="resumen-totales">
                        <div className="resumen-total-row">
                            <span>Subtotal:</span>
                            <span>${formatearPrecio(totalPedido)}</span>
                        </div>

                        <div className="resumen-total-row resumen-total-final">
                            <span>Total:</span>
                            <span>${formatearPrecio(totalPedido)}</span>
                        </div>
                    </div>

                    <div className="resumen-actions">
                        <button
                            type="button"
                            className="btn resumen-edit-btn"
                            onClick={onVolverAlMenu}
                            disabled={loading}
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary resumen-confirm-btn"
                            onClick={confirmarPedido}
                            disabled={loading || itemsPedido.length === 0}
                        >
                            {loading ? "Confirmando..." : "Confirmar Pedido"}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}