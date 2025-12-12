import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/pages/Register.css";

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(patch) {
    setForm((old) => ({ ...old, ...patch }));
  }

  async function submit(e) {
    console.log("SUBMIT EJECUTADO");

    e.preventDefault(); // <--- IMPORTANTE

    setError(null);

    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);

      const resp = await register({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        password2: form.password2,
      });

      if (!resp.success) {
        setError(resp.message);
        return;
      }

      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Crear cuenta</h2>
        <p className="auth-subtitle">Únete para guardar tus recetas y registrar tu progreso.</p>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={e => update({ nombre: e.target.value })}
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={e => update({ email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={e => update({ password: e.target.value })}
          />

          <input
            type="password"
            placeholder="Repetir contraseña"
            value={form.password2}
            onChange={e => update({ password2: e.target.value })}
          />

          <button className="btn-primary" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
