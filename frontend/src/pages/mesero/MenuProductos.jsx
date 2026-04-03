import { useEffect, useMemo, useState } from "react";
import { getProductos } from "../../services/api";
import ProductoCard from "../../components/mesero/ProductoCard";
import PedidoSidebar from "../../components/mesero/PedidoSidebar";

export default function MenuProductos({
    mesaSeleccionada,
    itemsPedido,
    setItemsPedido,
    onVolver,
    onContinuarResumen,
}) {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [observacion, setObservacion] = useState("");

    useEffect(() => {
        // Carga los productos disponibles al abrir la vista
        async function cargarProductos() {
            try {
                setLoading(true);
                setError("");
                const data = await getProductos();
                setProductos(data);
            } catch (err) {
                setError(err?.message || "No se pudieron cargar los productos.");
            } finally {
                setLoading(false);
            }
        }

        cargarProductos();
    }, []);

    const productosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return productos;

        // Filtra por nombre y descripción para facilitar la búsqueda en el menú
        return productos.filter((producto) =>
            `${producto.nombre} ${producto.descripcion || ""}`
                .toLowerCase()
                .includes(texto)
        );
    }, [productos, busqueda]);

    const totalPedido = useMemo(() => {
        // Calcula el total acumulado del pedido actual
        return itemsPedido.reduce((acc, item) => acc + Number(item.subtotal), 0);
    }, [itemsPedido]);

    function abrirPersonalizacion(producto) {
        // Abre el modal y reinicia la personalización del producto seleccionado
        setProductoSeleccionado(producto);
        setCantidad(1);
        setObservacion("");
    }

    function agregarAlPedido() {
        if (!productoSeleccionado) return;

        const cantidadValida = Number(cantidad);
        if (!Number.isInteger(cantidadValida) || cantidadValida < 1) {
            return;
        }

        const subtotal = Number(productoSeleccionado.precio) * cantidadValida;

        const nuevoItem = {
            id_producto: productoSeleccionado.id_producto,
            nombre_producto: productoSeleccionado.nombre,
            precio_unitario: Number(productoSeleccionado.precio),
            cantidad: cantidadValida,
            subtotal,
            observacion_item: observacion.trim(),
        };

        // Agrega el producto al pedido actual y cierra el modal
        setItemsPedido((prev) => [...prev, nuevoItem]);
        setProductoSeleccionado(null);
        setCantidad(1);
        setObservacion("");
    }

    if (!mesaSeleccionada) {
        return <p className="page-container">Primero debes seleccionar una mesa.</p>;
    }

    return (
        <div className="page-container">
            <div className="page-grid">
                <div>
                    <header className="section-header">
                        <button type="button" onClick={onVolver} className="btn">
                            Volver
                        </button>

                        <div>
                            <h1 className="page-title title-md">Menú de Productos</h1>
                            <p className="page-subtitle">
                                Mesa {mesaSeleccionada.numero_mesa} - Selecciona los productos del
                                pedido
                            </p>
                        </div>
                    </header>

                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="search-input"
                    />

                    {loading && <p>Cargando productos...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!loading && !error && productosFiltrados.length === 0 && (
                        <div className="empty-state">
                            <p>No se encontraron productos con esa búsqueda.</p>
                        </div>
                    )}

                    {!loading && !error && productosFiltrados.length > 0 && (
                        <div className="grid-auto">
                            {productosFiltrados.map((producto) => (
                                <ProductoCard
                                    key={producto.id_producto}
                                    producto={producto}
                                    onAgregar={abrirPersonalizacion}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <PedidoSidebar
                    mesaSeleccionada={mesaSeleccionada}
                    itemsPedido={itemsPedido}
                    totalPedido={totalPedido}
                    onContinuarResumen={onContinuarResumen}
                />
            </div>

            {productoSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2 className="section-title">Personalizar Producto</h2>

                        <p>
                            <strong>{productoSeleccionado.nombre}</strong>
                        </p>
                        <p className="text-muted">
                            ${Number(productoSeleccionado.precio).toFixed(2)}
                        </p>

                        <label className="field-label">
                            Cantidad
                            <input
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(Number(e.target.value))}
                                className="input"
                            />
                        </label>

                        <label className="field-label">
                            Observaciones
                            <textarea
                                placeholder="Ej: sin sal, término medio, etc."
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                rows="4"
                                className="textarea"
                            />
                        </label>

                        <p className="total-text">
                            Subtotal: $
                            {(Number(productoSeleccionado.precio) * Number(cantidad)).toFixed(2)}
                        </p>

                        <div className="modal-actions">
                            <button type="button" className="btn" onClick={cerrarPersonalizacion}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={agregarAlPedido}
                            >
                                Agregar al pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}