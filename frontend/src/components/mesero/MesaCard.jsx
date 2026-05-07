import groupIcon from "../../assets/group.png";

export default function MesaCard({ mesa, onSeleccionar }) {
    const ocupada = mesa.estado !== "LIBRE";

    return (
        <button
            type="button"
            className={`mesa-card ${ocupada ? "mesa-card-disabled" : ""}`}
            onClick={() => !ocupada && onSeleccionar(mesa)}
            disabled={ocupada}
        >
            <div className={`mesa-number-circle ${ocupada ? "mesa-number-circle-disabled" : ""}`}>
                {mesa.numero_mesa}
            </div>

            <h2 className={`mesa-name ${ocupada ? "mesa-name-disabled" : ""}`}>
                Mesa {mesa.numero_mesa}
            </h2>

            <div className={`mesa-capacity ${ocupada ? "mesa-capacity-disabled" : ""}`}>
                <img src={groupIcon} alt="" className="mesa-capacity-icon" />
                <span>{mesa.capacidad} personas</span>
            </div>

            <span className={`mesa-status-badge ${ocupada ? "mesa-status-ocupada" : "mesa-status-libre"}`}>
                {ocupada ? "Ocupada" : "Libre"}
            </span>
        </button>
    );
}