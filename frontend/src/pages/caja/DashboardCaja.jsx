import { useEffect, useMemo, useState } from "react";

import HeaderMesero from "../../components/mesero/HeaderMesero";
import {
    crearFactura,
    getFacturas,
    getPedidosCaja,
} from "../../services/api";

function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-CO");
}

function formatearFechaHora(fecha) {
    if (!fecha) return "--/--/---- --:--";

    const fechaBase = new Date(fecha);

    if (Number.isNaN(fechaBase.getTime())) {
        return "--/--/---- --:--";
    }

    const fechaFormateada = fechaBase.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
    });

    const horaFormateada = fechaBase.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    return `${fechaFormateada} ${horaFormateada}`;
}

function formatearFecha(fecha) {
    if (!fecha) return "--/--/----";

    const fechaBase = new Date(fecha);

    if (Number.isNaN(fechaBase.getTime())) {
        return "--/--/----";
    }

    return fechaBase.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
    });
}

function formatearHora(fecha) {
    if (!fecha) return "--:--";

    const fechaBase = new Date(fecha);

    if (Number.isNaN(fechaBase.getTime())) {
        return "--:--";
    }

    return fechaBase.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function esDeHoy(fecha) {
    if (!fecha) return false;

    const fechaBase = new Date(fecha);
    const hoy = new Date();

    if (Number.isNaN(fechaBase.getTime())) {
        return false;
    }

    return (
        fechaBase.getFullYear() === hoy.getFullYear() &&
        fechaBase.getMonth() === hoy.getMonth() &&
        fechaBase.getDate() === hoy.getDate()
    );
}

function obtenerMesa(pedido) {
    return pedido.numero_mesa || pedido.id_mesa;
}

function formatearEstado(estado) {
    if (!estado) return "";

    return estado
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (letra) => letra.toUpperCase());
}

const MAX_TOTAL_FACTURA = 99999999.99;
const MENSAJE_PROPINA_INVALIDA = "Valor invalido para agregar a la propina";
const MENSAJE_PROPINA_GRANDE = "La propina es demasiado grande";

function validarPropina(valorTexto, pedido) {
    const texto = String(valorTexto ?? "").trim();

    if (texto === "") {
        return "";
    }

    if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
        return MENSAJE_PROPINA_INVALIDA;
    }

    const valor = Number(texto);

    if (!Number.isFinite(valor) || valor < 0) {
        return MENSAJE_PROPINA_INVALIDA;
    }

    const subtotal = Number(pedido?.total || 0);

    if (subtotal + valor > MAX_TOTAL_FACTURA) {
        return MENSAJE_PROPINA_GRANDE;
    }

    return "";
}

export default function DashboardCaja({ usuario, onCerrarSesion }) {
    const [pedidosCaja, setPedidosCaja] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [pedidoPropina, setPedidoPropina] = useState(null);
    const [facturaGenerada, setFacturaGenerada] = useState(null);
    const [propinasPorPedido, setPropinasPorPedido] = useState({});
    const [busqueda, setBusqueda] = useState("");
    const [montoPropina, setMontoPropina] = useState("");
    const [popupPropinaInvalida, setPopupPropinaInvalida] = useState("");
    const [toastPropina, setToastPropina] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingFactura, setLoadingFactura] = useState(false);
    const [error, setError] = useState("");


    async function cargarDatos() {
        try {
            setLoading(true);
            setError("");

            const [pedidosListos, facturasGeneradas] = await Promise.all([
                getPedidosCaja(),
                getFacturas(),
            ]);

            setPedidosCaja(pedidosListos);
            setFacturas(facturasGeneradas);
        } catch (error) {
            console.error(error);
            setPedidosCaja([]);
            setFacturas([]);
            setError("No se pudieron cargar los datos de caja.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarDatos();
    }, []);

    function obtenerPropinaPedido(pedido) {
        if (!pedido) return 0;
        return Number(propinasPorPedido[pedido.id_pedido] || 0);
    }

    function obtenerTotalConPropina(pedido) {
        return Number(pedido.total || 0) + obtenerPropinaPedido(pedido);
    }

    function mostrarToastPropina() {
        setToastPropina("Propina agregada correctamente");

        setTimeout(() => {
            setToastPropina("");
        }, 2500);
    }

    function abrirModalPropina(pedido) {
        const propinaActual = obtenerPropinaPedido(pedido);

        setPedidoPropina(pedido);
        setMontoPropina(propinaActual ? String(propinaActual) : "");
        setErrorPropina("");
    }

    function cerrarModalPropina() {
        setPedidoPropina(null);
        setMontoPropina("");
        setPopupPropinaInvalida("");
    }

    function guardarPropina() {
        const mensajeError = validarPropina(montoPropina, pedidoPropina);

        if (mensajeError) {
            setPopupPropinaInvalida(mensajeError);

            setTimeout(() => {
                setPopupPropinaInvalida("");
            }, 3000);

            return;
        }

        const valor = Number(montoPropina || 0);

        setPropinasPorPedido((propinasActuales) => ({
            ...propinasActuales,
            [pedidoPropina.id_pedido]: valor,
        }));

        cerrarModalPropina();
        mostrarToastPropina();
    }

    async function facturarPedido(pedido) {
        const propinaPedido = obtenerPropinaPedido(pedido);

        if (Number(pedido.total || 0) + propinaPedido > MAX_TOTAL_FACTURA) {
            setError(MENSAJE_PROPINA_GRANDE);
            return;
        }

        try {
            setLoadingFactura(true);
            setError("");

            const factura = await crearFactura({
                id_pedido: pedido.id_pedido,
                id_usuario_cajero: usuario.id_usuario,
                propina: propinaPedido,
            });

            setFacturaGenerada(factura);
            setPedidoSeleccionado(null);
            setPedidoPropina(null);

            await cargarDatos();
        } catch (error) {
            console.error(error);
            setError(error.message || "No se pudo generar la factura.");
        } finally {
            setLoadingFactura(false);
        }
    }

    const pedidosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) {
            return pedidosCaja;
        }

        return pedidosCaja.filter((pedido) => {
            const numeroPedido = String(pedido.numero_pedido || "").toLowerCase();
            const mesa = String(obtenerMesa(pedido) || "").toLowerCase();
            const textoMesa = `mesa ${mesa}`;
            const estado = String(pedido.estado || "").toLowerCase();
            const mesero = String(pedido.mesero || "").toLowerCase();

            return (
                numeroPedido.includes(texto) ||
                mesa.includes(texto) ||
                textoMesa.includes(texto) ||
                estado.includes(texto) ||
                mesero.includes(texto)
            );
        });
    }, [pedidosCaja, busqueda]);

    const facturasHoy = useMemo(() => {
        return facturas.filter((factura) => esDeHoy(factura.fecha_hora_factura));
    }, [facturas]);

    const totalPendiente = useMemo(() => {
        return pedidosCaja.reduce(
            (total, pedido) => total + obtenerTotalConPropina(pedido),
            0
        );
    }, [pedidosCaja, propinasPorPedido]);

    const totalDia = useMemo(() => {
        return facturasHoy.reduce(
            (total, factura) => total + Number(factura.total || 0),
            0
        );
    }, [facturasHoy]);

    const busquedaActiva = busqueda.trim().length > 0;
    const sinResultados = busquedaActiva && pedidosFiltrados.length === 0;

    if (facturaGenerada) {
        return (
            <div className="dashboard-shell">
                <HeaderMesero
                    usuario={usuario}
                    onCerrarSesion={onCerrarSesion}
                />

                <main className="invoice-success-page">
                    <section className="invoice-success-message">
                        <div className="invoice-success-check">✓</div>
                        <h1>¡Factura generada con éxito!</h1>
                    </section>

                    <section className="invoice-generated-card">
                        <header className="invoice-generated-hero">
                            <div className="invoice-generated-icon">▤</div>

                            <div>
                                <h2>Factura {facturaGenerada.numero_factura}</h2>
                                <p>{formatearFecha(facturaGenerada.fecha_hora_factura)}</p>
                            </div>
                        </header>

                        <div className="invoice-generated-body">
                            <section className="invoice-generated-info">
                                <div>
                                    <p>Pedido</p>
                                    <strong>{facturaGenerada.numero_pedido}</strong>
                                </div>

                                <div>
                                    <p>Mesa</p>
                                    <strong>{facturaGenerada.numero_mesa}</strong>
                                </div>

                                <div>
                                    <p>Atendido por</p>
                                    <strong>{facturaGenerada.mesero || "No registrado"}</strong>
                                </div>

                                <div>
                                    <p>Hora</p>
                                    <strong>{formatearHora(facturaGenerada.fecha_hora_factura)}</strong>
                                </div>
                            </section>

                            <section className="invoice-generated-summary">
                                <h3>Resumen de Compra</h3>

                                {(facturaGenerada.items || []).map((item) => (
                                    <div
                                        key={`${facturaGenerada.id_factura}-${item.id_producto}`}
                                        className="invoice-generated-line"
                                    >
                                        <span>
                                            {item.cantidad}x {item.nombre_producto}
                                        </span>

                                        <strong>
                                            $ {formatearPrecio(item.subtotal)}
                                        </strong>
                                    </div>
                                ))}

                                {Number(facturaGenerada.propina || 0) > 0 && (
                                    <div className="invoice-generated-line invoice-generated-tip-line">
                                        <span>Propina</span>
                                        <strong>
                                            $ {formatearPrecio(facturaGenerada.propina)}
                                        </strong>
                                    </div>
                                )}
                            </section>

                            <section className="invoice-generated-total">
                                <h3>Total:</h3>
                                <strong>$ {formatearPrecio(facturaGenerada.total)}</strong>
                            </section>

                            <section className="invoice-generated-status">
                                <strong>Estado actualizado a: Facturado</strong>
                                <p>
                                    La mesa {facturaGenerada.numero_mesa} ha sido liberada
                                </p>
                            </section>

                            <section className="invoice-generated-actions">
                                <button
                                    type="button"
                                    className="btn invoice-print-button"
                                    onClick={() => window.print()}
                                >
                                    ⎙ Imprimir
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary invoice-back-panel-button"
                                    onClick={() => setFacturaGenerada(null)}
                                >
                                    Volver al Panel
                                </button>
                            </section>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    if (pedidoSeleccionado) {
        const propinaDetalle = obtenerPropinaPedido(pedidoSeleccionado);
        const totalDetalle = obtenerTotalConPropina(pedidoSeleccionado);

        return (
            <div className="dashboard-shell">
                <HeaderMesero
                    usuario={usuario}
                    onCerrarSesion={onCerrarSesion}
                />

                <main className="cashier-detail-page">
                    <button
                        type="button"
                        className="cashier-back-button"
                        onClick={() => setPedidoSeleccionado(null)}
                    >
                        ← Volver
                    </button>

                    {error && <p className="error-text">{error}</p>}

                    <section className="invoice-detail-card">
                        <header className="invoice-detail-hero">
                            <div className="invoice-detail-icon">▤</div>

                            <div>
                                <h1>Detalle de Factura</h1>
                                <p>Pedido {pedidoSeleccionado.numero_pedido}</p>
                            </div>
                        </header>

                        <div className="invoice-detail-body">
                            <section className="invoice-info-grid">
                                <div>
                                    <p>Mesa</p>
                                    <strong>{obtenerMesa(pedidoSeleccionado)}</strong>
                                </div>

                                <div>
                                    <p>Atendido por</p>
                                    <strong>{pedidoSeleccionado.mesero || "No registrado"}</strong>
                                </div>

                                <div>
                                    <p>Fecha y Hora</p>
                                    <strong>
                                        {formatearFechaHora(pedidoSeleccionado.fecha_hora_creacion)}
                                    </strong>
                                </div>

                                <div>
                                    <p>Estado</p>
                                    <strong>{String(pedidoSeleccionado.estado || "").toLowerCase()}</strong>
                                </div>
                            </section>

                            <section className="invoice-products-section">
                                <h2>Productos</h2>

                                <div className="invoice-products-list">
                                    {(pedidoSeleccionado.items || []).map((item) => (
                                        <article
                                            key={`${item.id_producto}-${item.nombre_producto}`}
                                            className="invoice-product-row"
                                        >
                                            <div>
                                                <strong>{item.nombre_producto}</strong>
                                                <p>
                                                    {item.cantidad} × ${formatearPrecio(item.precio_unitario)}
                                                </p>

                                                {item.observacion_item && (
                                                    <p className="invoice-product-note">
                                                        Nota: {item.observacion_item}
                                                    </p>
                                                )}
                                            </div>

                                            <span>$ {formatearPrecio(item.subtotal)}</span>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="invoice-breakdown">
                                <div>
                                    <span>Subtotal:</span>
                                    <strong>$ {formatearPrecio(pedidoSeleccionado.total)}</strong>
                                </div>

                                {propinaDetalle > 0 && (
                                    <div className="invoice-tip-breakdown">
                                        <span>Propina:</span>
                                        <strong>$ {formatearPrecio(propinaDetalle)}</strong>
                                    </div>
                                )}
                            </section>

                            <section className="invoice-total-row">
                                <h2>Total:</h2>
                                <strong>$ {formatearPrecio(totalDetalle)}</strong>
                            </section>

                            <section className="invoice-detail-actions">
                                <button
                                    type="button"
                                    className="btn invoice-secondary-button"
                                    onClick={() => setPedidoSeleccionado(null)}
                                >
                                    Volver
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary invoice-primary-button"
                                    onClick={() => facturarPedido(pedidoSeleccionado)}
                                    disabled={loadingFactura}
                                >
                                    {loadingFactura ? "Facturando..." : "Facturar"}
                                </button>
                            </section>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <HeaderMesero
                usuario={usuario}
                onCerrarSesion={onCerrarSesion}
            />

            {popupPropinaInvalida && (
                <div className="cashier-invalid-top-toast">
                    <span>!</span>
                    <p>{popupPropinaInvalida}</p>
                </div>
            )}

            {toastPropina && (
                <div className="cashier-top-toast">
                    <span>✓</span>
                    <p>{toastPropina}</p>
                </div>
            )}

            <main className="cashier-page">
                <section className="cashier-title-block">
                    <div className="cashier-title-icon">$</div>

                    <div>
                        <h1>Panel de Caja</h1>
                        <p>Gestiona las facturas y pagos</p>
                    </div>
                </section>

                <section className="cashier-summary-grid">
                    <article className="cashier-summary-card cashier-summary-pending">
                        <p>Pendientes por Facturar</p>
                        <strong>{pedidosCaja.length}</strong>
                        <span>$ {formatearPrecio(totalPendiente)}</span>
                    </article>

                    <article className="cashier-summary-card cashier-summary-today">
                        <p>Facturados Hoy</p>
                        <strong>{facturasHoy.length}</strong>
                        <span>$ {formatearPrecio(totalDia)}</span>
                    </article>

                    <article className="cashier-summary-card cashier-summary-total">
                        <p>Total del Día</p>
                        <strong>$ {formatearPrecio(totalDia)}</strong>
                    </article>
                </section>

                <section className="cashier-orders-card">
                    <div className="cashier-card-header">
                        <h2>Pedidos Pendientes por Facturar</h2>
                        <p>Selecciona un pedido para generar la factura</p>
                    </div>

                    <div className="cashier-search-wrap">
                        <span className="cashier-search-icon">⌕</span>

                        <input
                            type="text"
                            className="cashier-search-input"
                            placeholder="Buscar por número de pedido, mesa o estado..."
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                        />

                        {busquedaActiva && (
                            <button
                                type="button"
                                className="cashier-search-clear"
                                onClick={() => setBusqueda("")}
                                aria-label="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {loading && (
                        <section className="cashier-empty-state">
                            <p>Cargando pedidos...</p>
                        </section>
                    )}

                    {!loading && error && (
                        <p className="error-text">{error}</p>
                    )}

                    {!loading && !error && sinResultados && (
                        <section className="cashier-empty-state cashier-empty-search">
                            <div className="cashier-empty-icon">⌕</div>
                            <p>
                                No se encontraron pedidos asociados al criterio ingresado
                            </p>
                        </section>
                    )}

                    {!loading && !error && !sinResultados && pedidosFiltrados.length === 0 && (
                        <section className="cashier-empty-state">
                            <p>No hay pedidos pendientes por facturar</p>
                        </section>
                    )}

                    {!loading && !error && !sinResultados && pedidosFiltrados.length > 0 && (
                        <div className="cashier-table-wrap">
                            <table className="cashier-table">
                                <thead>
                                    <tr>
                                        <th>Pedido</th>
                                        <th>Mesa</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pedidosFiltrados.map((pedido) => {
                                        const propina = obtenerPropinaPedido(pedido);
                                        const totalConPropina = obtenerTotalConPropina(pedido);

                                        return (
                                            <tr key={pedido.id_pedido}>
                                                <td>{pedido.numero_pedido}</td>
                                                <td>Mesa {obtenerMesa(pedido)}</td>
                                                <td>
                                                    <span className="cashier-status-ready">
                                                        {formatearEstado(pedido.estado)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>
                                                        $ {formatearPrecio(totalConPropina)}
                                                    </strong>

                                                    {propina > 0 && (
                                                        <small className="cashier-tip-note">
                                                            Incluye propina: $ {formatearPrecio(propina)}
                                                        </small>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="cashier-actions">
                                                        <button
                                                            type="button"
                                                            className="cashier-detail-button"
                                                            onClick={() => setPedidoSeleccionado(pedido)}
                                                        >
                                                            Ver Detalle
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="cashier-tip-button"
                                                            onClick={() => abrirModalPropina(pedido)}
                                                        >
                                                            ⓢ Propina
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="cashier-invoice-button"
                                                            onClick={() => facturarPedido(pedido)}
                                                            disabled={loadingFactura}
                                                        >
                                                            Generar Factura
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {pedidoPropina && (
                <div className="cashier-modal-backdrop">
                    <section className="cashier-tip-modal">
                        <button
                            type="button"
                            className="cashier-tip-modal-close"
                            onClick={cerrarModalPropina}
                            aria-label="Cerrar"
                        >
                            ×
                        </button>

                        <header className="cashier-tip-modal-header">
                            <span>$</span>

                            <div>
                                <h2>Agregar Propina</h2>
                                <p>Ingresa el monto de la propina para este pedido</p>
                            </div>
                        </header>

                        <label className="cashier-tip-label">
                            Monto de la Propina (COP)

                            <input
                                type="number"
                                min="0"
                                max={MAX_TOTAL_FACTURA}
                                step="100"
                                value={montoPropina}
                                onChange={(event) => {
                                    const nuevoValor = event.target.value;
                                    setMontoPropina(nuevoValor);
                                    setPopupPropinaInvalida(validarPropina(nuevoValor, pedidoPropina));
                                }}
                                placeholder="2000"
                            />
                        </label>

                        <p className="cashier-tip-helper">
                            Ingresa el valor en pesos colombianos
                        </p>

                        {popupPropinaInvalida && (
                            <p className="cashier-tip-error">
                                {popupPropinaInvalida}
                            </p>
                        )}

                        <section className="cashier-tip-detail">
                            <p>Detalle del pedido:</p>
                            <strong>{pedidoPropina.numero_pedido}</strong>
                            <span>
                                Subtotal: $ {formatearPrecio(pedidoPropina.total)}
                            </span>
                            <strong className="cashier-tip-new">
                                Nueva propina: $ {formatearPrecio(Number(montoPropina || 0))}
                            </strong>
                            <strong className="cashier-tip-new">
                                Nuevo total: $ {formatearPrecio(
                                    Number(pedidoPropina.total || 0) + Number(montoPropina || 0)
                                )}
                            </strong>
                        </section>

                        <footer className="cashier-tip-modal-actions">
                            <button
                                type="button"
                                className="btn"
                                onClick={cerrarModalPropina}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={guardarPropina}
                                disabled={!!validarPropina(montoPropina, pedidoPropina)}
                            >
                                Agregar Propina
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </div>
    );
}