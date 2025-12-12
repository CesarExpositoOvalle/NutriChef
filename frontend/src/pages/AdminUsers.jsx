// src/pages/AdminUsers.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { deleteAdminUser, fetchAdminUsers, updateAdminUser } from "../api/admin";
import "../styles/pages/AdminUsers.css";

const emptyForm = {
  nombre_usuario: "",
  correo: "",
  rol: "usuario",
  edad: "",
  altura_cm: "",
  peso_kg: "",
  actividad: "",
  objetivo: "",
  genero: "",
};

export default function AdminUsers() {
  const { user: authUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminUsers();
      if (!res.success) {
        setError(res.message || "No se pudieron cargar los usuarios");
      } else {
        setUsers(res.users || []);
      }
    } catch (e) {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user) {
    setSelectedId(user.id);
    setForm({
      nombre_usuario: user.nombre_usuario || "",
      correo: user.correo || "",
      rol: user.rol || "usuario",
      edad: user.edad ?? "",
      altura_cm: user.altura_cm ?? "",
      peso_kg: user.peso_kg ?? "",
      actividad: user.actividad || "",
      objetivo: user.objetivo || "",
      genero: user.genero || "",
    });
    setMessage(null);
    setError(null);
  }

  function cancelEdit() {
    setSelectedId(null);
    setForm(emptyForm);
    setMessage(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await updateAdminUser({ ...form, id: selectedId });
      if (!res.success) {
        setError(res.message || "No se pudo actualizar el usuario");
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedId ? { ...u, ...res.user } : u))
        );
        setMessage("Usuario actualizado correctamente");
      }
    } catch (e) {
      setError("No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;

    setError(null);
    setMessage(null);

    try {
      const res = await deleteAdminUser(id);
      if (!res.success) {
        setError(res.message || "No se pudo eliminar el usuario");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (selectedId === id) cancelEdit();
    } catch (e) {
      setError("No se pudo eliminar el usuario");
    }
  }

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedId),
    [selectedId, users]
  );

  return (
    <div className="main-content admin-users">
      <div className="admin-users__header">
        <h2 className="page-title">Gestión de usuarios</h2>
        <p className="admin-users__lead">
          Solo los administradores pueden acceder a esta página. Desde aquí puedes
          revisar, editar y eliminar cuentas sin modificar contraseñas.
        </p>
        <div className="admin-users__chips">
          <span className="chip chip--info">Total: {users.length}</span>
          {authUser && <span className="chip chip--success">Sesión: {authUser.email}</span>}
        </div>
      </div>

      {error && <div className="admin-users__alert admin-users__alert--error">{error}</div>}
      {message && <div className="admin-users__alert admin-users__alert--success">{message}</div>}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="admin-users__grid">
          <div className="admin-users__list">
            <div className="admin-users__list-header">
              <h3>Listado</h3>
              <p>Selecciona un usuario para editar sus datos.</p>
            </div>
            <div className="admin-users__table-wrapper">
              <table className="admin-users__table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={selectedId === u.id ? "is-active" : ""}>
                      <td>
                        <button className="link-btn" onClick={() => startEdit(u)}>
                          {u.nombre_usuario}
                        </button>
                      </td>
                      <td>{u.correo}</td>
                      <td>
                        <span className={`badge ${u.rol === "admin" ? "badge--admin" : ""}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td>
                        {u.requiere_cambio_password ? (
                          <span className="badge badge--warn">Cambia contraseña</span>
                        ) : (
                          <span className="badge">Ok</span>
                        )}
                      </td>
                      <td className="actions">
                        <button className="btn-link" onClick={() => startEdit(u)}>
                          Editar
                        </button>
                        <button
                          className="btn-link btn-link--danger"
                          onClick={() => handleDelete(u.id)}
                          disabled={authUser?.id === u.id}
                          title={authUser?.id === u.id ? "No puedes eliminar tu propia sesión" : "Eliminar usuario"}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-users__editor">
            <h3>Editar usuario</h3>
            {!selectedUser ? (
              <p>Elige un usuario del listado para modificar sus datos.</p>
            ) : (
              <form className="admin-users__form" onSubmit={handleSave}>
                <div className="form-row">
                  <label>Nombre</label>
                  <input
                    value={form.nombre_usuario}
                    onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <label>Edad</label>
                    <input
                      type="number"
                      value={form.edad}
                      onChange={(e) => setForm({ ...form, edad: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      value={form.altura_cm}
                      onChange={(e) => setForm({ ...form, altura_cm: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.peso_kg}
                      onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <label>Actividad</label>
                    <select
                      value={form.actividad}
                      onChange={(e) => setForm({ ...form, actividad: e.target.value })}
                    >
                      <option value="">Sin especificar</option>
                      <option value="sedentario">Sedentario</option>
                      <option value="ligero">Ligero</option>
                      <option value="moderado">Moderado</option>
                      <option value="intenso">Intenso</option>
                      <option value="muy_intenso">Muy intenso</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Objetivo</label>
                    <select
                      value={form.objetivo}
                      onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                    >
                      <option value="">Sin especificar</option>
                      <option value="bajar_peso">Bajar peso</option>
                      <option value="mantener">Mantener</option>
                      <option value="ganar_musculo">Ganar músculo</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Género</label>
                    <select
                      value={form.genero}
                      onChange={(e) => setForm({ ...form, genero: e.target.value })}
                    >
                      <option value="">Sin especificar</option>
                      <option value="male">Hombre</option>
                      <option value="female">Mujer</option>
                    </select>
                  </div>
                </div>

                <div className="admin-users__form-actions">
                  <button className="btn-primary" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>
                    Cancelar
                  </button>
                </div>

                <p className="admin-users__hint">
                  No se puede cambiar la contraseña desde esta pantalla. Pide al usuario que la
                  actualice desde su perfil.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
