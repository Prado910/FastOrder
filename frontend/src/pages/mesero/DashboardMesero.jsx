import HeaderMesero from "../../components/mesero/HeaderMesero";

export default function DashboardMesero({ onNuevoPedido }) {
    return (
        <div className="page-container">
            <HeaderMesero />

            <section className="page-hero">
                <div>
                    <h1 className="page-title">Bienvenido, Carlos Méndez</h1>
                    <p className="page-subtitle">Gestiona tus pedidos de forma eficiente</p>
                </div>

                <button type="button" className="btn btn-primary" onClick={onNuevoPedido}>
                    Nuevo Pedido
                </button>
            </section>

            <section className="grid-auto mb-24">
                <article className="metric-card">
                    <p className="metric-label">Pedidos Activos</p>
                    <h2 className="metric-value">0</h2>
                </article>

                <article className="metric-card">
                    <p className="metric-label">Total Hoy</p>
                    <h2 className="metric-value">0</h2>
                </article>

                <article className="metric-card">
                    <p className="metric-label">Completados</p>
                    <h2 className="metric-value">0</h2>
                </article>
            </section>

            <section className="card">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Pedidos Activos</h2>
                        <p className="page-subtitle">Gestiona tus pedidos en curso</p>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Buscar por mesa o número de pedido..."
                    className="search-input"
                    disabled
                />

                <div className="empty-state">
                    <p>No hay pedidos activos</p>
                </div>
            </section>
        </div>
    );
}