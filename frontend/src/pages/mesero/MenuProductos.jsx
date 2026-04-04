import { useEffect, useMemo, useState } from "react";
import { getProductos } from "../../services/api";
import HeaderMesero from "../../components/mesero/HeaderMesero";
import ProductoCard from "../../components/mesero/ProductoCard";
import shoppingCartWhiteIcon from "../../assets/shopping-cart-white.png";

const CATEGORIAS = ["ENTRADAS", "HAMBURGUESAS", "BEBIDAS", "ALTERNOS"];

function formatearCategoria(nombre) {
    if (!nombre) return "";
    return nombre.charAt(0) + nombre.slice(1).toLowerCase();
}

function obtenerCategoriaProducto(producto) {
    return String(producto.categoria || producto.nombre_categoria || "")
        .trim()
        .toUpperCase();
}

export default function MenuProductos({
    mesaSeleccionada,
    itemsPedido,
    setItemsPedido,
    onVolver,
    onContinuarResumen,
    onCerrarSesion,
}) {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [observacion, setObservacion] = useState("");
    const [categoriaActiva, setCategoriaActiva] = useState("ENTRADAS");

    useEffect(() => {
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

        return productos.filter((producto) => {
            const coincideBusqueda =
                !texto ||
                `${producto.nombre} ${producto.descripcion || ""}`
                    .toLowerCase()
                    .includes(texto);

            const categoriaProducto = obtenerCategoriaProducto(producto);
            const coincideCategoria =
                !categoriaActiva || categoriaProducto === categoriaActiva;

            return coincideBusqueda && coincideCategoria;
        });
    }, [productos, busqueda, categoriaActiva]);

    function abrirPersonalizacion(producto) {
        if (producto.disponible !== "S") return;

        setProductoSeleccionado(producto);
        setCantidad(1);
        setObservacion("");
    }

    function cerrarPersonalizacion() {
        setProductoSeleccionado(null);
        setCantidad(1);
        setObservacion("");
    }

    function agregarAlPedido() {
        if (!productoSeleccionado) return;

        const cantidadValida = Number(cantidad);
        if (!Number.isInteger(cantidadValida) || cantidadValida < 1) return;

        const subtotal = Number(productoSeleccionado.precio) * cantidadValida;

        const nuevoItem = {
            id_producto: productoSeleccionado.id_producto,
            nombre_producto: productoSeleccionado.nombre,
            precio_unitario: Number(productoSeleccionado.precio),
            cantidad: cantidadValida,
            subtotal,
            observacion_item: observacion.trim(),
        };

        setItemsPedido((prev) => [...prev, nuevoItem]);
        cerrarPersonalizacion();
    }

    if (!mesaSeleccionada) {
        return <p className="page-container">Primero debes seleccionar una mesa.</p>;
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero onCerrarSesion={onCerrarSesion} />

            <main className="page-container">
                <header className="menu-header">
                    <button type="button" onClick={onVolver} className="back-link">
                        ← Volver
                    </button>

                    <div className="menu-header-copy">
                        <h1 className="page-title title-md">Menú de Productos</h1>
                        <p className="page-subtitle">
                            Mesa {mesaSeleccionada.numero_mesa} - Selecciona los productos del pedido
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary menu-order-button"
                        onClick={onContinuarResumen}
                        disabled={itemsPedido.length === 0}
                    >
                        <img src={shoppingCartWhiteIcon} alt="" className="menu-order-icon" />
                        <span>Ver Pedido ({itemsPedido.length})</span>
                    </button>
                </header>

                <div className="search-input-wrap">
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="menu-tabs">
                    {CATEGORIAS.map((categoria) => (
                        <button
                            key={categoria}
                            type="button"
                            className={categoriaActiva === categoria ? "menu-tab active" : "menu-tab"}
                            onClick={() => setCategoriaActiva(categoria)}
                        >
                            {formatearCategoria(categoria)}
                        </button>
                    ))}
                </div>

                {loading && <p>Cargando productos...</p>}
                {error && <p className="error-text">{error}</p>}

                {!loading && !error && productosFiltrados.length === 0 && (
                    <div className="empty-state">
                        <p>No se encontraron productos para esta categoría o búsqueda.</p>
                    </div>
                )}

                {!loading && !error && productosFiltrados.length > 0 && (
                    <section className="productos-grid">
                        {productosFiltrados.map((producto) => (
                            <ProductoCard
                                key={producto.id_producto}
                                producto={producto}
                                onAgregar={abrirPersonalizacion}
                            />
                        ))}
                    </section>
                )}
            </main>

            {productoSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2 className="section-title">Personalizar Producto</h2>

                        <p>
                            <strong>{productoSeleccionado.nombre}</strong>
                        </p>

                        <p className="text-muted">
                            ${Number(productoSeleccionado.precio).toLocaleString("es-CO")}
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
                            {(
                                Number(productoSeleccionado.precio) * Number(cantidad || 0)
                            ).toLocaleString("es-CO")}
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