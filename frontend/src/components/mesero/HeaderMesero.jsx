import logoIcon from "../../assets/moon.png";
import logoutIcon from "../../assets/logout.png";

function formatearRol(rol) {
    if (!rol) return "";

    return rol
        .toLowerCase()
        .replace(/^\w/, (letra) => letra.toUpperCase());
}

export default function HeaderMesero({
    usuario,
    nombre = "Usuario",
    rol = "mesero",
    onCerrarSesion,
}) {
    const nombreUsuario = usuario
        ? `${usuario.nombre} ${usuario.apellido}`
        : nombre;

    const rolUsuario = usuario?.rol || rol;

    return (
        <header className="app-header">
            <div className="header-brand-group">
                <img src={logoIcon} alt="Luna Roja" className="brand-logo" />

                <div>
                    <p className="brand">Luna Roja</p>
                    <p className="user-text">
                        {nombreUsuario} - {formatearRol(rolUsuario)}
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