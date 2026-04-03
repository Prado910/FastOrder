import logoIcon from "../../assets/moon.png";
import logoutIcon from "../../assets/logout.png";

export default function HeaderMesero({ nombre = "Carlos Méndez", rol = "mesero", onCerrarSesion }) {
    return (
        <header className="app-header">
            <div className="header-brand-group">
                <img src={logoIcon} alt="Luna Roja" className="brand-logo" />

                <div>
                    <p className="brand">Luna Roja</p>
                    <p className="user-text">
                        {nombre} - {rol}
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="header-logout"
                onClick={onCerrarSesion}
            >
                <img src={logoutIcon} alt="" className="logout-icon" />
                <span>Cerrar Sesión</span>
            </button>
        </header>
    );
}