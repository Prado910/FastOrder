export default function MesaCard({ mesa, onSeleccionar }) {
    return (
        <button
            type="button"
            className="card mesa-card-button"
            onClick={() => onSeleccionar(mesa)}
        >
            <span className="mesa-badge">Mesa {mesa.numero_mesa}</span>
            <h2 className="mesa-title">{mesa.capacidad} personas</h2>
            <p className="mesa-text">Estado: {mesa.estado}</p>
            <span className="mesa-action">Seleccionar</span>
        </button>
    );
}