export default function ProductoCard({ producto, onAgregar }) {
    return (
        <div className="card">
            <h3 className="producto-title">{producto.nombre}</h3>
            <p className="producto-description">
                {producto.descripcion || "Sin descripción"}
            </p>
            <p className="producto-price">${Number(producto.precio).toFixed(2)}</p>

            <button
                type="button"
                className="btn btn-block"
                onClick={() => onAgregar(producto)}
            >
                Agregar
            </button>
        </div>
    );
}