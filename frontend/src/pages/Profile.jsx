// src/pages/Profile.jsx
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchProfileData,
  updateProfile,
  fetchWeightHistory,
  updateAccount,
} from "../api/profile";
import "../styles/pages/Profile.css";

import MacrosDonutChart from "../components/profile/MacrosDonutChart";
import CompleteProfileModal from "../components/profile/CompleteProfileModal";
import WeightProgressChart from "../components/profile/WeightProgressChart";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user: authUser, setUser: setAuthUser } = useContext(AuthContext);
  const location = useLocation();
  const [forcePasswordChange, setForcePasswordChange] = useState(
    !!location.state?.forcePasswordChange
  );
  const UPLOAD_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/uploads/`;

  const [user, setUser] = useState(null);
  const [calcs, setCalcs] = useState(null);
  const [history, setHistory] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [quickWeight, setQuickWeight] = useState("");

  const [accountForm, setAccountForm] = useState({
    nombre: "",
    email: "",
    current_password: "",
    new_password: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState(null);

  async function load() {
    try {
      setError(null);

      const data = await fetchProfileData();
      if (!data.success) {
        setError(data.message || "Error cargando el perfil");
        return;
      }

      const normalizedUser = {
        ...data.user,
        requiere_cambio_password: !!data.user.requiere_cambio_password,
      };

      setUser(normalizedUser);
      setCalcs(data.calculos);

      if (setAuthUser) {
        setAuthUser((prev) =>
          prev
            ? {
                ...prev,
                rol: normalizedUser.rol ?? prev.rol,
                requirePasswordChange:
                  normalizedUser.requiere_cambio_password ?? prev.requirePasswordChange,
              }
            : prev
        );
      }

      setForcePasswordChange((prev) => prev && normalizedUser.requiere_cambio_password);

      setAccountForm((prev) => ({
        ...prev,
        nombre: data.user.nombre_usuario || authUser?.nombre || "",
        email: data.user.correo || authUser?.email || "",
        current_password: "",
        new_password: "",
      }));

      const avatarPath = data.user.avatar_url ? `${UPLOAD_BASE}${data.user.avatar_url}` : null;
      setAvatarPreview(avatarPath);
      setAvatarFile(null);

      const u = data.user;
      const missing =
        u.edad == null ||
        u.altura_cm == null ||
        u.peso_kg == null ||
        !u.actividad ||
        !u.objetivo ||
        !u.genero;

      setShowModal(missing);

      const weightRes = await fetchWeightHistory();
      if (weightRes.success && Array.isArray(weightRes.history)) {
        setHistory(weightRes.history);
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el perfil");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(field, value) {
    setUser((old) => ({ ...old, [field]: value }));
  }

  function handleAccountChange(field, value) {
    setAccountForm((old) => ({ ...old, [field]: value }));
  }

  function handleAvatarChange(file) {
    setAvatarFile(file || null);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else if (user?.avatar_url) {
      setAvatarPreview(`${UPLOAD_BASE}${user.avatar_url}`);
    } else {
      setAvatarPreview(null);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateProfile({
        edad: user.edad,
        altura_cm: user.altura_cm,
        peso_kg: user.peso_kg,
        actividad: user.actividad,
        objetivo: user.objetivo,
        genero: user.genero,
      });

      await load();
    } catch (e) {
      console.error(e);
      setError("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleAccountSave(e) {
    e.preventDefault();
    setAccountSaving(true);
    setAccountMessage(null);

    try {
      const formData = new FormData();
      formData.append("nombre", accountForm.nombre);
      formData.append("email", accountForm.email);
      if (accountForm.current_password) formData.append("current_password", accountForm.current_password);
      if (accountForm.new_password) formData.append("new_password", accountForm.new_password);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await updateAccount(formData);

      if (!res.success) {
        setAccountMessage(res.message || "No se pudo actualizar la cuenta");
      } else {
        const avatarPath = res.user.avatar ? `${UPLOAD_BASE}${res.user.avatar}` : avatarPreview;
        setAvatarPreview(avatarPath);
        setAccountMessage(res.message || "Datos de cuenta actualizados");
        setUser((prev) =>
          prev
            ? {
                ...prev,
                nombre_usuario: res.user.nombre ?? prev.nombre_usuario,
                correo: res.user.email ?? prev.correo,
                avatar_url: res.user.avatar ?? prev.avatar_url,
                requiere_cambio_password:
                  res.user.requirePasswordChange ?? prev.requiere_cambio_password,
              }
            : prev
        );
        if (setAuthUser) {
          setAuthUser((prev) => {
            const base = prev || {};
            return {
              ...base,
              ...res.user,
              avatar: avatarPath,
              requirePasswordChange:
                res.user.requirePasswordChange ?? base.requirePasswordChange,
            };
          });
        }
        if (res.user.requirePasswordChange === false) {
          setForcePasswordChange(false);
        }
        await load();
      }
    } catch (e) {
      console.error(e);
      setAccountMessage("No se pudo actualizar la cuenta");
    } finally {
      setAccountSaving(false);
      setAccountForm((old) => ({ ...old, current_password: "", new_password: "" }));
    }
  }

  async function handleQuickWeight(e) {
    e.preventDefault();
    if (!quickWeight || !user) return;

    try {
      await updateProfile({
        edad: user.edad,
        altura_cm: user.altura_cm,
        peso_kg: quickWeight,
        actividad: user.actividad,
        objetivo: user.objetivo,
        genero: user.genero,
      });

      setQuickWeight("");
      await load();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el peso.");
    }
  }

  if (error) return <p className="main-content">{error}</p>;
  if (!user || !calcs) return <p className="main-content">Cargando...</p>;

  const macros = calcs.macros || {};
  const requiresPasswordChange = Boolean(
    forcePasswordChange ||
      authUser?.requirePasswordChange ||
      user?.requiere_cambio_password
  );

  return (
    <div className="main-content profile-layout">
      <h2 className="page-title">Perfil</h2>

      <div className="profile-grid">
        <div className="profile-card account-card">
          <div className="account-header">
            <div className="avatar-large">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <span className="avatar-placeholder">👤</span>
              )}
              <input
                type="file"
                accept="image/*"
                aria-label="Cambiar foto"
                onChange={(e) => handleAvatarChange(e.target.files[0])}
              />
            </div>

            <div>
              <p className="eyebrow">Tu cuenta</p>
              <h3>{accountForm.nombre || "Usuario nuevo"}</h3>
              <p className="profile-sub">{accountForm.email || "Añade tu correo"}</p>
            </div>
          </div>

          {requiresPasswordChange && (
            <div className="password-warning">
              Tu cuenta necesita que actualices la contraseña por seguridad. Introduce tu
              contraseña actual y define una nueva para continuar.
            </div>
          )}

          {accountMessage && <p className="form-note">{accountMessage}</p>}

          <form className="account-form" onSubmit={handleAccountSave}>
            <div className="form-row">
              <label>Nombre</label>
              <input
                value={accountForm.nombre}
                onChange={(e) => handleAccountChange("nombre", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Correo</label>
              <input
                type="email"
                value={accountForm.email}
                onChange={(e) => handleAccountChange("email", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Contraseña actual</label>
              <input
                type="password"
                placeholder="Necesaria si cambias la contraseña"
                value={accountForm.current_password}
                onChange={(e) => handleAccountChange("current_password", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Déjalo vacío para mantenerla"
                value={accountForm.new_password}
                onChange={(e) => handleAccountChange("new_password", e.target.value)}
              />
            </div>

            <button className="btn-primary" disabled={accountSaving}>
              {accountSaving ? "Guardando..." : "Guardar cuenta"}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h3>Nutrición recomendada</h3>

          <p>
            <strong>BMR:</strong> {calcs.bmr} kcal
          </p>
          <p>
            <strong>TDEE:</strong> {calcs.tdee} kcal
          </p>
          <p>
            <strong>Calorías objetivo:</strong> {calcs.calorias_objetivo} kcal/día
          </p>

          <MacrosDonutChart macros={macros} />
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h3>Información corporal</h3>
          <p className="profile-sub">Completa tus métricas para ajustar calorías y macros.</p>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-row">
              <label>Edad</label>
              <input
                type="number"
                value={user.edad ?? ""}
                onChange={(e) => handleChange("edad", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Género</label>
              <select
                value={user.genero || ""}
                onChange={(e) => handleChange("genero", e.target.value)}
              >
                <option value="">No especificado</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </div>

            <div className="form-row">
              <label>Altura (cm)</label>
              <input
                type="number"
                value={user.altura_cm ?? ""}
                onChange={(e) => handleChange("altura_cm", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={user.peso_kg ?? ""}
                onChange={(e) => handleChange("peso_kg", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Actividad</label>
              <select
                value={user.actividad || "moderado"}
                onChange={(e) => handleChange("actividad", e.target.value)}
              >
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
                value={user.objetivo || "mantener"}
                onChange={(e) => handleChange("objetivo", e.target.value)}
              >
                <option value="bajar_peso">Bajar peso</option>
                <option value="mantener">Mantener</option>
                <option value="ganar_musculo">Ganar músculo</option>
              </select>
            </div>

            <button className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h3>Historial de peso</h3>

          <form className="quick-weight-form" onSubmit={handleQuickWeight}>
            <input
              type="number"
              step="0.1"
              placeholder="Nuevo peso (kg)"
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
            />
            <button className="btn-secondary">Guardar peso</button>
          </form>

          {history.length === 0 ? (
            <p>No hay registros aún.</p>
          ) : (
            <ul className="history-list">
              {history.map((h, i) => (
                <li key={i}>
                  {h.fecha}: {h.peso_kg} kg
                </li>
              ))}
            </ul>
          )}
        </div>

        <WeightProgressChart history={history} />
      </div>

      {showModal && (
        <CompleteProfileModal
          user={user}
          onClose={() => setShowModal(false)}
          onUpdated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
