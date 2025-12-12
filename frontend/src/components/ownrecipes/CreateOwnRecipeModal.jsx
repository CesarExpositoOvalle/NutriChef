// src/components/ownrecipes/CreateOwnRecipeModal.jsx
import { useState } from "react";
import { createOwnRecipe } from "../../api/ownRecipes";

export default function CreateOwnRecipeModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [time, setTime] = useState(""); 
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [ingredients, setIngredients] = useState([{ nombre: "", cantidad: "" }]);
  const [steps, setSteps] = useState([""]); 
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function addIngredient() {
    setIngredients([...ingredients, { nombre: "", cantidad: "" }]);
  }

  function handleIngredientChange(i, field, value) {
    const copy = [...ingredients];
    copy[i][field] = value;
    setIngredients(copy);
  }

  function addStep() {
    setSteps([...steps, ""]);
  }

  function handleStepChange(i, value) {
    const copy = [...steps];
    copy[i] = value;
    setSteps(copy);
  }

  function handleImageChange(file) {
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }

  async function submit() {
    if (saving) return;
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El título es obligatorio");
      return;
    }

    setSaving(true);

    const cleanedIngredients = ingredients
      .map((ing) => ({
        nombre: ing.nombre?.trim() || "",
        cantidad: ing.cantidad?.trim() || "",
      }))
      .filter((ing) => ing.nombre && ing.cantidad);

    const cleanedSteps = steps.map((s) => s.trim()).filter(Boolean);

    const form = new FormData();
    form.append("title", trimmedTitle);
    form.append("description", desc.trim());
    form.append("calories", calories);
    form.append("protein", protein);
    form.append("carbs", carbs);
    form.append("fats", fats);
    form.append("time", time);
    if (image) form.append("image", image);

    form.append("ingredients", JSON.stringify(cleanedIngredients));
    form.append("steps", JSON.stringify(cleanedSteps));

    try {
      const res = await createOwnRecipe(form);
      if (res?.success) {
        onCreated?.();
      } else {
        setError(res?.error || "No se pudo crear la receta. Inténtalo de nuevo.");
      }
    } catch (e) {
      setError("Hubo un problema al guardar la receta. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="create-recipe-modal">

        
        <div className="create-recipe-header">
          Crear receta
          <button onClick={onClose}>×</button>
        </div>

       
        <div className="create-recipe-body">

          {error && <div className="form-error">{error}</div>}

          <div className="two-col">
            <div>
              <label>Imagen</label>
              <div className="upload-tile">
                {imagePreview ? (
                  <img src={imagePreview} alt="Previsualización" className="upload-preview" />
                ) : (
                  <span className="upload-placeholder">Sube una imagen atractiva</span>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} />
              </div>
            </div>

            <div>
              <label>Nombre de la receta</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Tortilla de patatas" />

              <label>Descripción</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe la receta..." />
            </div>
          </div>

          <div className="metric-grid">
            <div>
              <label>Kcal</label>
              <input value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>

            <div>
              <label>Proteínas (g)</label>
              <input value={protein} onChange={(e) => setProtein(e.target.value)} />
            </div>

            <div>
              <label>Carbohidratos (g)</label>
              <input value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </div>

            <div>
              <label>Grasas (g)</label>
              <input value={fats} onChange={(e) => setFats(e.target.value)} />
            </div>

            <div>
              <label>Tiempo de preparación (min)</label>
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Ej: 20" />
            </div>
          </div>

          <div>
            <label>Ingredientes</label>

            {ingredients.map((ing, i) => (
              <div className="ingredient-row" key={i}>
                <input
                  placeholder="Ingrediente"
                  value={ing.nombre}
                  onChange={(e) => handleIngredientChange(i, "nombre", e.target.value)}
                />
                <input
                  placeholder="Cantidad"
                  value={ing.cantidad}
                  onChange={(e) => handleIngredientChange(i, "cantidad", e.target.value)}
                />
              </div>
            ))}

            <button className="add-ingredient-btn" onClick={addIngredient}>
              + Añadir ingrediente
            </button>
          </div>

          <div>
            <label>Pasos</label>
            {steps.map((s, i) => (
              <textarea
                key={i}
                placeholder={`Paso ${i + 1}`}
                value={s}
                onChange={(e) => handleStepChange(i, e.target.value)}
              />
            ))}
            <button className="add-ingredient-btn" onClick={addStep}>
              + Añadir paso
            </button>
          </div>

        </div>

  
        <div className="create-recipe-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
