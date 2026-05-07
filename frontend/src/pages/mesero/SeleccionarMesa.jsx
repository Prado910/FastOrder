import { useEffect, useState } from "react";
import HeaderMesero from "../../components/mesero/HeaderMesero";
import MesaCard from "../../components/mesero/MesaCard";

import { getMesas } from "../../services/api";
import backIcon from "../../assets/back.png";

export default function SeleccionarMesa({
    usuario,
    onMesaSeleccionada,
    onVolver,
    onCerrarSesion,
}) {
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Carga las mesas al montar el componente
        async function cargarMesas() {
            try {
                setLoading(true);
                setError("");
                const data = await getMesas();
                setMesas(data);
            } catch (err) {
                setError(err?.message || "No se pudieron cargar las mesas.");
            } finally {
                setLoading(false);
            }
        }

        cargarMesas();
    }, []);

    return (
        <div className="dashboard-shell">
            <HeaderMesero usuario={usuario} onCerrarSesion={onCerrarSesion} />

            <main className="page-container dashboard-page">
                <header className="mesas-page-header">
                    <button
                        type="button"
                        className="back-link"
                        onClick={onVolver}
                    >
                        <img src={backIcon} alt="" className="back-link-icon" />
                        <span>Volver</span>
                    </button>

                    <div>
                        <h1 className="page-title title-md">Seleccionar Mesa</h1>
                        <p className="page-subtitle">
                            Elige una mesa para el pedido
                        </p>
                    </div>
                </header>

                {loading && (
                    <p className="loading-text">Cargando mesas...</p>
                )}

                {!loading && error && (
                    <p className="error-text">{error}</p>
                )}

                {!loading && !error && mesas.length === 0 && (
                    <div className="card empty-state mesas-empty-state">
                        <p>No hay mesas disponibles en este momento.</p>
                    </div>
                )}

                {!loading && !error && mesas.length > 0 && (
                    <section className="mesas-grid">
                        {mesas.map((mesa) => (
                            <MesaCard
                                key={mesa.id_mesa}
                                mesa={mesa}
                                onSeleccionar={onMesaSeleccionada}
                            />
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
}