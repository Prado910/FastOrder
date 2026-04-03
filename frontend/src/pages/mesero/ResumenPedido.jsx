import { useMemo, useState } from "react";
import { crearPedido } from "../../services/api";

export default function ResumenPedido({
    mesaSeleccionada,
    itemsPedido,
    onVolverAlMenu,
    onEditarMesa,
    onPedidoConfirmado,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Calcula el total actual del pedido a partir de los subtotales de cada ítem
    const totalPedido = useMemo(() => {
        return itemsPedido.reduce((acc, item) => acc + Number(item.subtotal), 0);
    }, [itemsPedido]);

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
        <div className="page-container">
            <header className="section-header">
                <button
                    type="button"
                    onClick={onVolverAlMenu}
                    className="btn"
                    disabled={loading}
                >
                    Volver al menú
                </button>

                <div>
                    <h1 className="page-title title-md">Resumen del Pedido</h1>
                    <p className="page-subtitle">Mesa {mesaSeleccionada.numero_mesa}</p>
                </div>
            </header>

            {error && <p className="error-text">{error}</p>}

            <div className="page-grid">
                <section className="card">
                    <h2 className="section-title">Productos del pedido</h2>

                    {itemsPedido.length === 0 ? (
                        <p>No hay productos agregados todavía.</p>
                    ) : (
                        <ul className="item-list">
                            {itemsPedido.map((item, index) => (
                                <li key={`${item.id_producto}-${index}`} className="item-row">
                                    <div>
                                        <strong>{item.nombre_producto}</strong>
                                        <div>
                                            Cantidad: {item.cantidad} × ${Number(item.precio_unitario).toFixed(2)}
                                        </div>
                                        {item.observacion_item && (
                                            <div className="item-note">Nota: {item.observacion_item}</div>
                                        )}
                                    </div>
                                    <div className="price-strong">
                                        ${Number(item.subtotal).toFixed(2)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <aside className="sidebar-card">
                    <h2 className="section-title">Resumen</h2>
                    <p>
                        <strong>Mesa:</strong> {mesaSeleccionada.numero_mesa}
                    </p>
                    <p>
                        <strong>Productos:</strong> {itemsPedido.length}
                    </p>
                    <hr />
                    <p className="total-text">Total: ${totalPedido.toFixed(2)}</p>

                    <div className="actions-column">
                        <button
                            type="button"
                            className="btn"
                            onClick={onEditarMesa}
                            disabled={loading}
                        >
                            Editar mesa
                        </button>

                        <button
                            type="button"
                            className="btn"
                            onClick={onVolverAlMenu}
                            disabled={loading}
                        >
                            Editar pedido
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={confirmarPedido}
                            disabled={loading || itemsPedido.length === 0}
                        >
                            {loading ? "Confirmando..." : "Confirmar Pedido"}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}