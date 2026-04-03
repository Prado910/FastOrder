export default function HeaderMesero({ nombre = "Carlos Méndez", rol = "Mesero", onCerrarSesion }) {
    return (
        <header className="app-header">
            <div>
                <p className="brand">Luna Roja</p>
                <p className="user-text">
                    {nombre} - {rol}
                </p>
            </div>

            <button type="button" className="btn">
                Cerrar Sesión
            </button>
        </header>
    );
}