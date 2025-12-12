// src/components/DishForm.jsx
import { useState } from "react";
import { createOwnRecipe } from "../../api/ownRecipes";

export default function DishForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [imageFile, setImageFile] = useState(null);

  async function submit(e) {
    e.preventDefault();

    const ingredients = ingredientsText.split("\n").map(s => s.trim()).filter(Boolean);
    const steps = stepsText.split("\n").map(s => s.trim()).filter(Boolean);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("ingredients", JSON.stringify(ingredients));
    fd.append("steps", JSON.stringify(steps));
    fd.append("kcal", kcal);
    fd.append("protein", protein);
    fd.append("carbs", carbs);
    fd.append("fats", fats);
    if (imageFile) fd.append("image", imageFile);

    const res = await createOwnRecipe(fd);
    if (onCreated) onCreated(res.id);
  }

  return (
    <form className="form-large" onSubmit={submit}>
      <h3>Crear receta propia</h3>

      <input className="input" value={title}
        onChange={(e) => setTitle(e.target.value)} placeholder="Título" />

      <textarea className="textarea" value={description}
        onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />

      <textarea className="textarea" value={ingredientsText}
        onChange={(e) => setIngredientsText(e.target.value)}
        placeholder="Ingredientes (uno por línea)" />

      <textarea className="textarea" value={stepsText}
        onChange={(e) => setStepsText(e.target.value)}
        placeholder="Pasos (uno por línea)" />

      <div className="macros-row">
        <input className="input" type="number" value={kcal}
          onChange={(e) => setKcal(e.target.value)} placeholder="Kcal" />

        <input className="input" type="number" value={protein}
          onChange={(e) => setProtein(e.target.value)} placeholder="Proteína (g)" />

        <input className="input" type="number" value={carbs}
          onChange={(e) => setCarbs(e.target.value)} placeholder="Carbohidratos (g)" />

        <input className="input" type="number" value={fats}
          onChange={(e) => setFats(e.target.value)} placeholder="Grasas (g)" />
      </div>

      <input type="file" className="input-file" accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0] || null)} />

      <button className="btn-primary">Guardar receta</button>
    </form>
  );
}
