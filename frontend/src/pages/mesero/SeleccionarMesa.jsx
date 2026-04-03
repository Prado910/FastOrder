import { useEffect, useState } from "react";
import { getMesasDisponibles } from "../../services/api";
import MesaCard from "../../components/mesero/MesaCard";

export default function SeleccionarMesa({ onMesaSeleccionada }) {
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Carga las mesas disponibles al abrir la vista
        async function cargarMesas() {
            try {
                setLoading(true);
                setError("");
                const data = await getMesasDisponibles();
                setMesas(data);
            } catch (err) {
                setError(err?.message || "No se pudieron cargar las mesas.");
            } finally {
                setLoading(false);
            }
        }

        cargarMesas();
    }, []);

    if (loading) {
        return <p className="page-container narrow">Cargando mesas disponibles...</p>;
    }

    if (error) {
        return <p className="page-container narrow error-text">{error}</p>;
    }

    return (
        <div className="page-container narrow">
            <header className="section-header">
                <div>
                    <h1 className="page-title title-md">Seleccionar Mesa</h1>
                    <p className="page-subtitle">
                        Elige una mesa disponible para el pedido
                    </p>
                </div>
            </header>

            {mesas.length === 0 ? (
                <div className="empty-state">
                    <p>No hay mesas disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid-auto">
                    {mesas.map((mesa) => (
                        <MesaCard
                            key={mesa.id_mesa}
                            mesa={mesa}
                            onSeleccionar={onMesaSeleccionada}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}