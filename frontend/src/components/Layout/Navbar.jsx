// src/components/Layout/Navbar.jsx
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Nutrichef
      </Link>

      <nav className="navbar-right">
        {user ? (
          <>
            <span className="navbar-username">Hola, {user.nombre}</span>
            <button className="navbar-button" onClick={logout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Entrar</Link>
            <Link to="/register" className="navbar-link">Registrarse</Link>
          </>
        )}
      </nav>
    </header>
  );
}
