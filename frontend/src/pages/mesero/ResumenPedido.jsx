import { useMemo, useState } from "react";
import { crearPedido } from "../../services/api";
import HeaderMesero from "../../components/mesero/HeaderMesero";

import shoppingCartIcon from "../../assets/shopping-cart.png";
import trashIcon from "../../assets/trash.png";

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

export default function ResumenPedido({
    usuario,
    mesaSeleccionada,
    itemsPedido,
    setItemsPedido,
    onVolverAlMenu,
    onEditarMesa,
    onPedidoConfirmado,
    onCerrarSesion,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mesaNoDisponible, setMesaNoDisponible] = useState(false);

    const totalPedido = useMemo(() => {
        return itemsPedido.reduce((acc, item) => acc + Number(item.subtotal), 0);
    }, [itemsPedido]);

    function eliminarItem(indexAEliminar) {
        setItemsPedido((prev) => prev.filter((_, index) => index !== indexAEliminar));
    }

    async function confirmarPedido() {
        if (itemsPedido.length === 0) {
            setError("Debe agregar al menos un producto al pedido.");
            return;
        }

        if (!usuario?.id_usuario) {
            setError("No hay un mesero autenticado.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = {
                id_mesa: mesaSeleccionada.id_mesa,
                id_usuario_mesero: usuario.id_usuario,
                items: itemsPedido.map((item) => ({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    observacion_item: item.observacion_item || null,
                })),
            };

            const pedidoCreado = await crearPedido(payload);
            onPedidoConfirmado(pedidoCreado);
        } catch (err) {
            const mensaje = err?.message || "No se pudo confirmar el pedido.";

            if (mensaje.toLowerCase().includes("mesa no está libre")) {
                setMesaNoDisponible(true);
                setError(
                    "La mesa seleccionada ya fue ocupada por otro pedido. Elige una mesa diferente para continuar."
                );
                return;
            }

            setError(mensaje);
        } finally {
            setLoading(false);
        }
    }

    if (!mesaSeleccionada) {
        return <p className="page-container">Primero debes seleccionar una mesa.</p>;
    }

    if (itemsPedido.length === 0) {
        return (
            <div className="dashboard-shell">
                <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

                <main className="page-container resumen-page">
                    <button
                        type="button"
                        onClick={onVolverAlMenu}
                        className="back-link resumen-back-link"
                    >
                        ← Volver al menú
                    </button>

                    <section className="resumen-card resumen-empty-card-prototype">
                        <div className="resumen-header">
                            <div className="resumen-title-row">
                                <img
                                    src={shoppingCartIcon}
                                    alt=""
                                    className="resumen-title-icon"
                                />
                                <h1 className="resumen-title">Resumen del Pedido</h1>
                            </div>

                            <p className="resumen-subtitle">
                                Mesa {mesaSeleccionada.numero_mesa}
                            </p>
                        </div>

                        <div className="resumen-empty-content">
                            <img
                                src={shoppingCartIcon}
                                alt=""
                                className="resumen-empty-cart-icon"
                            />

                            <p>No hay productos en el pedido</p>

                            <button
                                type="button"
                                className="btn btn-primary resumen-add-products-btn"
                                onClick={onVolverAlMenu}
                            >
                                Agregar Productos
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

            <main className="page-container resumen-page">
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
                            <div className="resumen-title-row">
                                <img
                                    src={shoppingCartIcon}
                                    alt=""
                                    className="resumen-title-icon"
                                />
                                <h1 className="resumen-title">Resumen del Pedido</h1>
                            </div>

                            <p className="resumen-subtitle">
                                Mesa {mesaSeleccionada.numero_mesa}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className={mesaNoDisponible ? "resumen-warning-box" : ""}>
                            <p className="error-text">
                                {error}
                            </p>

                            {mesaNoDisponible && (
                                <button
                                    type="button"
                                    className="btn btn-primary resumen-change-table-btn"
                                    onClick={onEditarMesa}
                                >
                                    Elegir otra mesa
                                </button>
                            )}
                        </div>
                    )}

                    <div className="resumen-items">
                        {itemsPedido.map((item, index) => (
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
                                        <div className="item-note">
                                            <span>Notas: </span>
                                            <span>{item.observacion_item}</span>
                                        </div>
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
                                    <img
                                        src={trashIcon}
                                        alt=""
                                        className="resumen-delete-icon"
                                    />
                                </button>
                            </article>
                        ))}
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
                            disabled={loading || mesaNoDisponible}
                        >
                            {loading ? "Confirmando." : "Confirmar Pedido"}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}