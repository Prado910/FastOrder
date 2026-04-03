export default function ProductoCard({ producto, onAgregar }) {
    return (
        <article className="producto-card">
            <div>
                <h3 className="producto-title">{producto.nombre}</h3>
                <p className="producto-price">
                    ${Number(producto.precio).toLocaleString("es-CO")}
                </p>
            </div>

            <button
                type="button"
                className="producto-add-button"
                onClick={() => onAgregar(producto)}
            >
                + Agregar
            </button>
        </article>
    );
}