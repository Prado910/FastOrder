import { useEffect, useMemo, useState } from "react";
import { getProductos } from "../../services/api";
import HeaderMesero from "../../components/mesero/HeaderMesero";
import ProductoCard from "../../components/mesero/ProductoCard";
import shoppingCartWhiteIcon from "../../assets/shopping-cart-white.png";

const CATEGORIAS = ["ENTRADAS", "HAMBURGUESAS", "BEBIDAS", "ALTERNOS"];
const OBSERVACION_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-]*$/;
const MAX_LONGITUD_NOTA = 250;
const MENSAJE_NOTA_LARGA = "La nota es demasiado larga.";

function formatearCategoria(nombre) {
    if (!nombre) return "";
    return nombre.charAt(0) + nombre.slice(1).toLowerCase();
}

function obtenerCategoriaProducto(producto) {
    return String(producto.categoria || producto.nombre_categoria || "")
        .trim()
        .toUpperCase();
}

function validarNotaProducto(valor) {
    const nota = valor.trim();

    if (nota.length > MAX_LONGITUD_NOTA) {
        return MENSAJE_NOTA_LARGA;
    }

    if (nota && !OBSERVACION_REGEX.test(nota)) {
        return "La nota contiene caracteres no permitidos. Usa solo letras, números y signos básicos.";
    }

    return "";
}

function normalizarCantidad(valor) {
    return String(valor ?? "").trim().replace(/\s+/g, "");
}

function validarCantidadProducto(valor) {
    const texto = normalizarCantidad(valor);

    if (!texto) {
        return "Debes ingresar una cantidad.";
    }

    if (texto.includes(",") || texto.includes(".")) {
        return "La cantidad debe ser entera.";
    }

    if (!/^\d+$/.test(texto)) {
        return "La cantidad debe contener solo números enteros.";
    }

    const numero = Number(texto);

    if (numero <= 0) {
        return "La cantidad debe ser mayor que cero.";
    }

    if (numero > 99) {
        return "La cantidad no puede ser mayor que 99.";
    }

    return "";
}

function convertirCantidad(valor) {
    return Number(normalizarCantidad(valor));
}

export default function MenuProductos({
    usuario,
    mesaSeleccionada,
    itemsPedido,
    setItemsPedido,
    onVolver,
    onContinuarResumen,
    onCerrarSesion,
    mostrarToastMesa,
    onOcultarToastMesa,
}) {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState("1");
    const [observacion, setObservacion] = useState("");
    const [categoriaActiva, setCategoriaActiva] = useState("ENTRADAS");
    const [errorCantidad, setErrorCantidad] = useState("");
    const [errorObservacion, setErrorObservacion] = useState("");
    const [productoAgregadoToast, setProductoAgregadoToast] = useState(null);

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

    useEffect(() => {
        if (!productoAgregadoToast) return;

        const timer = setTimeout(() => {
            setProductoAgregadoToast(null);
        }, 2500);

        return () => clearTimeout(timer);
    }, [productoAgregadoToast]);

    useEffect(() => {
        if (!mostrarToastMesa) return;

        const timer = setTimeout(() => {
            onOcultarToastMesa?.();
        }, 2500);

        return () => clearTimeout(timer);
    }, [mostrarToastMesa, onOcultarToastMesa]);

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
        setCantidad("1");
        setObservacion("");
        setErrorCantidad("");
        setErrorObservacion("");
    }

    function cerrarPersonalizacion() {
        setProductoSeleccionado(null);
        setCantidad("1");
        setObservacion("");
        setErrorCantidad("");
        setErrorObservacion("");
    }

    function agregarAlPedido() {
        if (!productoSeleccionado) return;

        const notaLimpia = observacion.trim();
        const errorNota = validarNotaProducto(observacion);

        if (errorNota) {
            setErrorObservacion(errorNota);
            return;
        }

        setErrorObservacion("");

        const errorCantidadActual = validarCantidadProducto(cantidad);

        if (errorCantidadActual) {
            setErrorCantidad(errorCantidadActual);
            return;
        }

        const cantidadValida = convertirCantidad(cantidad);

        setErrorCantidad("");

        const subtotal = Number(productoSeleccionado.precio) * cantidadValida;

        const nuevoItem = {
            id_producto: productoSeleccionado.id_producto,
            nombre_producto: productoSeleccionado.nombre,
            precio_unitario: Number(productoSeleccionado.precio),
            cantidad: cantidadValida,
            subtotal,
            observacion_item: notaLimpia || null,
        };

        setItemsPedido((prev) => [...prev, nuevoItem]);
        setProductoAgregadoToast(productoSeleccionado.nombre);
        cerrarPersonalizacion();
    }

    if (!mesaSeleccionada) {
        return <p className="page-container">Primero debes seleccionar una mesa.</p>;
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

            {productoAgregadoToast && (
                <div className="producto-toast" role="status" aria-live="polite">
                    <span className="producto-toast-icon">✓</span>
                    <span>{productoAgregadoToast} agregado al pedido</span>
                </div>
            )}

            {mostrarToastMesa && mesaSeleccionada && (
                <div className="mesa-toast" role="status" aria-live="polite">
                    <span className="mesa-toast-icon">✓</span>
                    <span>Mesa {mesaSeleccionada.numero_mesa} seleccionada</span>
                </div>
            )}

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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={cantidad}
                                onChange={(e) => {
                                    const nuevoValor = e.target.value;
                                    setCantidad(nuevoValor);
                                    setErrorCantidad(validarCantidadProducto(nuevoValor));
                                }}
                                className="input"
                            />
                        </label>

                        {errorCantidad && (
                            <p className="error-text">{errorCantidad}</p>
                        )}

                        <label className="field-label">
                            Nota especial
                            <textarea
                                placeholder="Ej. sin cebolla, término medio, etc."
                                value={observacion}
                                onChange={(e) => {
                                    const nuevoValor = e.target.value;
                                    setObservacion(nuevoValor);
                                    setErrorObservacion(validarNotaProducto(nuevoValor));
                                }}
                                rows="4"
                                className="textarea"
                            />
                            <p className="note-counter">
                                {observacion.length}/{MAX_LONGITUD_NOTA}
                            </p>
                        </label>

                        {errorObservacion && (
                            <p className="error-text">{errorObservacion}</p>
                        )}

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
                                className="btn btn-primary modal-add-btn"
                                onClick={agregarAlPedido}
                                disabled={
                                    Boolean(validarCantidadProducto(cantidad)) ||
                                    !!validarNotaProducto(observacion)
                                }
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