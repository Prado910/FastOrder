export default function PedidoConfirmado({ pedido, onNuevoPedido }) {
    if (!pedido) {
        return <p>No hay información del pedido para mostrar.</p>;
    }

    return (
        <div className="page-container narrow">
            <div className="card">
                <h1 className="page-title title-md mb-8">Pedido registrado con éxito</h1>

                <p className="page-subtitle mb-24">
                    El pedido ya quedó guardado en la base de datos.
                </p>

                <div className="mb-24">
                    <p>
                        <strong>Número de pedido:</strong> {pedido.numero_pedido}
                    </p>
                    <p>
                        <strong>Mesa:</strong> {pedido.id_mesa}
                    </p>
                    <p>
                        <strong>Estado:</strong> {pedido.estado}
                    </p>
                    <p>
                        <strong>Total:</strong> ${Number(pedido.total).toFixed(2)}
                    </p>
                </div>

                <h2 className="section-title title-sm">Detalle</h2>

                <ul className="item-list">
                    {pedido.items.map((item, index) => (
                        <li key={`${item.id_producto}-${index}`} className="item-row">
                            <div>
                                <strong>{item.nombre_producto}</strong>
                                <div>
                                    {item.cantidad} × ${Number(item.precio_unitario).toFixed(2)}
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

                <button
                    type="button"
                    className="btn btn-primary mt-24"
                    onClick={onNuevoPedido}
                >
                    Crear otro pedido
                </button>
            </div>
        </div>
    );
}