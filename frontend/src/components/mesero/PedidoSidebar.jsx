export default function PedidoSidebar({
    mesaSeleccionada,
    itemsPedido,
    totalPedido,
    onContinuarResumen,
}) {
    if (!mesaSeleccionada) {
        return <p>No hay una mesa seleccionada.</p>;
    }

    return (
        <aside className="sidebar-card">
            <h2>Pedido actual</h2>
            <p>Mesa {mesaSeleccionada.numero_mesa}</p>

            {itemsPedido.length === 0 ? (
                <p>No has agregado productos todavía.</p>
            ) : (
                <ul className="item-list">
                    {itemsPedido.map((item, index) => (
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
            )}

            <hr />
            <p className="total-text">Total: ${totalPedido.toFixed(2)}</p>

            <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={onContinuarResumen}
                disabled={itemsPedido.length === 0}
            >
                Revisar pedido
            </button>
        </aside>
    );
}