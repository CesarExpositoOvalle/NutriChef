// src/components/Layout/Sidebar.jsx
import { useContext, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiBookOpen,
  FiChevronLeft,
  FiGrid,
  FiCalendar,
  FiHeart,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import Logo from "/src/assets/logo/logo_nutrichef_transparente.png";


export default function Sidebar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `${apiBase}/uploads/${user.avatar}`
    : null;

  const navItems = useMemo(
    () => [
      { to: "/", label: "Inicio", icon: <FiHome />, show: true },
      {
        to: "/dishes",
        label: "Recetas Spoonacular",
        icon: <FiBookOpen />,
        show: true,
      },
      { to: "/my-dishes", label: "Mis Recetas", icon: <FiGrid />, show: !!user },
      { to: "/menus/daily", label: "Menús diarios", icon: <FiCalendar />, show: !!user },
      { to: "/menus/weekly", label: "Menús semanales", icon: <FiGrid />, show: !!user },
      { to: "/favorites", label: "Favoritos", icon: <FiHeart />, show: !!user },
    ],
    [user]
  );

  function closeProfileMenu() {
    setProfileOpen(false);
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <FiChevronLeft className={`collapse-icon ${collapsed ? "rotated" : ""}`} />

          
          <img
            src={Logo}
            alt="Nutrichef Logo"
            className={`sidebar-logo ${collapsed ? "small" : ""}`}
          />

          
          {!collapsed && <span className="brand">Nutrichef</span>}
        </button>

        <nav className="sidebar-links">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""} ${collapsed ? "compact" : ""}`
                }
              >
                <span className="sidebar-icon" aria-hidden>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div
          className={`theme-chip ${collapsed ? "compact" : ""}`}
          role="button"
          tabIndex={0}
          onClick={toggleTheme}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleTheme();
            }
          }}
        >
          {!collapsed && <span className="theme-chip__label">Modo {theme === "light" ? "claro" : "oscuro"}</span>}
          <span className={`theme-chip__pill ${theme}`}>{theme === "light" ? "" : ""}</span>
        </div>

        <div className={`profile-block ${collapsed ? "compact" : ""} ${profileOpen ? "open" : ""}`}>
          <button
            className="profile-header"
            type="button"
          onClick={() => setProfileOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={profileOpen}
        >
          <div className="avatar" aria-hidden>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : <FiUser />}
          </div>
          {!collapsed && (
            <div>
              <p className="profile-label">Perfil</p>
                <p className="profile-name">{user ? user.nombre : "Invitado"}</p>
              </div>
            )}
          </button>

          {profileOpen && (
            <div className={`profile-menu ${collapsed ? "compact" : ""}`}>
              {user ? (
                <>
                  <NavLink to="/profile" className="profile-link" onClick={closeProfileMenu}>
                    <FiUser /> {!collapsed && <span>Ver perfil</span>}
                  </NavLink>
                  {user?.rol === "admin" && (
                    <NavLink
                      to="/admin/users"
                      className="profile-link"
                      onClick={closeProfileMenu}
                    >
                      <FiUsers /> {!collapsed && <span>Gestionar usuarios</span>}
                    </NavLink>
                  )}
                  <button
                    className="profile-link"
                    type="button"
                    onClick={() => {
                      logout();
                      closeProfileMenu();
                    }}
                  >
                    <FiLogOut /> {!collapsed && <span>Cerrar sesión</span>}
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="profile-link" onClick={closeProfileMenu}>
                    <FiLogIn /> {!collapsed && <span>Iniciar sesión</span>}
                  </NavLink>
                  <NavLink to="/register" className="profile-link" onClick={closeProfileMenu}>
                    <FiUser /> {!collapsed && <span>Registrarse</span>}
                  </NavLink>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
