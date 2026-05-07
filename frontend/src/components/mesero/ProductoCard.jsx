export default function ProductoCard({ producto, onAgregar }) {
    const noDisponible = producto.disponible !== "S";

    return (
        <article className={`producto-card ${noDisponible ? "producto-card-disabled" : ""}`}>
            <div>
                <div className="producto-card-header">
                    <h3 className="producto-title">{producto.nombre}</h3>

                    {noDisponible && (
                        <span className="producto-badge-no-disponible">
                            No disponible
                        </span>
                    )}
                </div>

                <p className="producto-price">
                    ${Number(producto.precio).toLocaleString("es-CO")}
                </p>

                {producto.descripcion && (
                    <p className="producto-description">{producto.descripcion}</p>
                )}
            </div>

            <button
                type="button"
                className="producto-add-button"
                onClick={() => onAgregar(producto)}
                disabled={noDisponible}
            >
                {noDisponible ? "No disponible" : "+ Agregar"}
            </button>
        </article>
    );
}