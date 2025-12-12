import { useState } from "react";
import { updateProfile } from "../../api/profile";

export default function CompleteProfileModal({ user, onClose, onUpdated }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    edad: user.edad || "",
    genero: user.genero || "male",
    altura_cm: user.altura_cm || "",
    peso_kg: user.peso_kg || "",
    actividad: user.actividad || "moderado",
    objetivo: user.objetivo || "mantener",
  });

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function validateStep1() {
    if (!form.edad || Number(form.edad) <= 0) {
      return "Introduce una edad válida.";
    }
    if (!form.altura_cm || Number(form.altura_cm) <= 0) {
      return "Introduce una altura válida.";
    }
    if (!form.peso_kg || Number(form.peso_kg) <= 0) {
      return "Introduce un peso válido.";
    }
    return null;
  }

  function validateStep2() {
    if (!form.genero) return "Selecciona un género.";
    if (!form.actividad) return "Selecciona un nivel de actividad.";
    if (!form.objetivo) return "Selecciona un objetivo.";
    return null;
  }

  async function save() {
    const e1 = validateStep1();
    if (e1) {
      setError(e1);
      setStep(1);
      return;
    }
    const e2 = validateStep2();
    if (e2) {
      setError(e2);
      setStep(2);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateProfile({
        edad: Number(form.edad),
        altura_cm: Number(form.altura_cm),
        peso_kg: Number(form.peso_kg),
        actividad: form.actividad,
        objetivo: form.objetivo,
        genero: form.genero,
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("Error guardando perfil:", err);
      setError("Error al guardar los datos. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card filled-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">¡Bienvenido!</p>
            <h3>Completa tu información</h3>
            <p className="modal-subtitle">Usamos estos datos para calcular tus calorías y macros diarios.</p>
          </div>
        </div>

  
        <div className="steps-indicator">
          <span className={step === 1 ? "step active" : "step"}>1</span>
          <span className={step === 2 ? "step active" : "step"}>2</span>
        </div>

        {error && <p className="modal-error">{error}</p>}

        {step === 1 && (
          <div className="modal-body grid-cols">
            <div>
              <label>Edad</label>
              <input
                type="number"
                placeholder="Edad"
                value={form.edad}
                onChange={(e) => update({ edad: e.target.value })}
              />
            </div>

            <div>
              <label>Altura (cm)</label>
              <input
                type="number"
                placeholder="Altura (cm)"
                value={form.altura_cm}
                onChange={(e) => update({ altura_cm: e.target.value })}
              />
            </div>

            <div>
              <label>Peso (kg)</label>
              <input
                type="number"
                placeholder="Peso (kg)"
                value={form.peso_kg}
                onChange={(e) => update({ peso_kg: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-body grid-cols">
            <div>
              <label>Género</label>
              <select
                value={form.genero}
                onChange={(e) => update({ genero: e.target.value })}
              >
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </div>

            <div>
              <label>Actividad</label>
              <select
                value={form.actividad}
                onChange={(e) => update({ actividad: e.target.value })}
              >
                <option value="sedentario">Sedentario</option>
                <option value="ligero">Ligero</option>
                <option value="moderado">Moderado</option>
                <option value="intenso">Intenso</option>
                <option value="muy_intenso">Muy intenso</option>
              </select>
            </div>

            <div>
              <label>Objetivo</label>
              <select
                value={form.objetivo}
                onChange={(e) => update({ objetivo: e.target.value })}
              >
                <option value="bajar_peso">Bajar peso</option>
                <option value="mantener">Mantener</option>
                <option value="ganar_musculo">Ganar músculo</option>
              </select>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Omitir
          </button>

          {step === 1 && (
            <button
              className="btn-primary"
              onClick={() => {
                const err = validateStep1();
                if (err) {
                  setError(err);
                } else {
                  setError(null);
                  setStep(2);
                }
              }}
              disabled={saving}
            >
              Siguiente
            </button>
          )}

          {step === 2 && (
            <button
              className="btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
