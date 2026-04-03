import HeaderMesero from "../../components/mesero/HeaderMesero";

import orderIcon from "../../assets/order.png";
import orderWhiteIcon from "../../assets/orderWhite.png";
import searchIcon from "../../assets/search.png";

export default function DashboardMesero({ onNuevoPedido, onCerrarSesion }) {
    return (
        <div className="dashboard-shell">
            <HeaderMesero onCerrarSesion={onCerrarSesion} />

            <main className="page-container dashboard-page">
                <section className="dashboard-hero">
                    <div>
                        <h1 className="page-title dashboard-title">Bienvenido, Carlos Méndez</h1>
                        <p className="page-subtitle dashboard-subtitle">
                            Gestiona tus pedidos de forma eficiente
                        </p>
                    </div>
                </section>

                <section className="dashboard-metrics">
                    <article className="metric-card metric-card-danger">
                        <div>
                            <p className="metric-label">Pedidos Activos</p>
                            <h2 className="metric-value">0</h2>
                        </div>
                        <img src={orderWhiteIcon} alt="" className="metric-icon-img" />
                    </article>

                    <article className="metric-card metric-card-warning">
                        <div>
                            <p className="metric-label">Total Hoy</p>
                            <h2 className="metric-value">0</h2>
                        </div>
                        <img src={orderWhiteIcon} alt="" className="metric-icon-img" />
                    </article>

                    <article className="metric-card metric-card-success">
                        <div>
                            <p className="metric-label">Completados</p>
                            <h2 className="metric-value">0</h2>
                        </div>
                        <img src={orderWhiteIcon} alt="" className="metric-icon-img" />
                    </article>
                </section>

                <section className="card dashboard-cta-card">
                    <button
                        type="button"
                        className="btn btn-primary btn-cta"
                        onClick={onNuevoPedido}
                    >
                        +&nbsp;&nbsp;Nuevo Pedido
                    </button>
                </section>

                <section className="card active-orders-card">
                    <div className="section-header active-orders-header">
                        <div>
                            <h2 className="section-title">Pedidos Activos</h2>
                            <p className="page-subtitle">Gestiona tus pedidos en curso</p>
                        </div>
                    </div>

                    <div className="search-input-wrap">
                        <img src={searchIcon} alt="" className="search-input-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por mesa o número de pedido..."
                            className="search-input search-input-with-icon"
                            disabled
                        />
                    </div>

                    <div className="empty-state empty-state-large">
                        <img src={orderIcon} alt="" className="metric-icon-img" />
                        <p>No hay pedidos activos</p>
                    </div>
                </section>
            </main>
        </div>
    );
}