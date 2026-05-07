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

const PASOS = [
    "PENDIENTE",
    "EN_PREPARACION",
    "LISTO",
    "ENTREGADO",
    "FACTURADO",
];

export default function SeguimientoPedido({ pedido, onVolver }) {
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

                            return (
                                <div
                                    key={paso}
                                    className={`progress-step ${activo ? "progress-step-active" : ""}`}
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
        </main>
    );
}