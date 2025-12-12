import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages/Login.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const resp = await login(email, password);

    if (!resp.success) {
      setError(resp.message);
      return;
    }

    if (resp.user?.requirePasswordChange) {
      alert("Por seguridad, debes actualizar tu contraseña antes de continuar.");
    }

    navigate("/profile", { state: { forcePasswordChange: !!resp.user?.requirePasswordChange } });
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar sesión</h2>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn-primary">Entrar</button>
        </form>

        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
        </p>
      </div>
    </div>
  );
}
