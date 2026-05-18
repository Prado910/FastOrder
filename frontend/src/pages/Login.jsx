import { useState } from "react";

import { login } from "../services/api";
import logoIcon from "../assets/moon.png";

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [clave, setClave] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function cargarUsuarioPrueba(usuario) {
        setUsername(usuario);
        setClave("password");
        setError("");
    }

    async function manejarSubmit(event) {
        event.preventDefault();

        if (!username.trim() || !clave.trim()) {
            setError("Debe ingresar usuario y contraseña.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const usuarioAutenticado = await login({
                username: username.trim(),
                clave,
            });

            onLogin(usuarioAutenticado);
        } catch (error) {
            setError(error.message || "No se pudo iniciar sesión.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand">
                    <img src={logoIcon} alt="Luna Roja" className="login-logo" />
                    <h1>Luna Roja</h1>
                </div>

                <p className="login-system-name">Sistema de Gestión de Pedidos</p>
                <p className="login-instructions">Ingrese sus credenciales para continuar</p>

                <form className="login-form" onSubmit={manejarSubmit}>
                    <label className="login-field">
                        <span>Usuario</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Ingrese su usuario"
                            autoComplete="username"
                        />
                    </label>

                    <label className="login-field">
                        <span>Contraseña</span>
                        <input
                            type="password"
                            value={clave}
                            onChange={(event) => setClave(event.target.value)}
                            placeholder="Ingrese su contraseña"
                            autoComplete="current-password"
                        />
                    </label>

                    {error && <p className="error-text login-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-block login-submit"
                        disabled={loading}
                    >
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                <div className="login-test-users">
                    <strong>Usuarios de prueba:</strong>

                    <button
                        type="button"
                        onClick={() => cargarUsuarioPrueba("mesero1")}
                    >
                        • mesero1 - Mesero
                    </button>

                    <button
                        type="button"
                        onClick={() => cargarUsuarioPrueba("cocina1")}
                    >
                        • cocina1 - Cocina
                    </button>

                    <button
                        type="button"
                        onClick={() => cargarUsuarioPrueba("caja1")}
                    >
                        • caja1 - Caja
                    </button>

                    <p>Contraseña: password</p>
                </div>
            </section>
        </main>
    );
}