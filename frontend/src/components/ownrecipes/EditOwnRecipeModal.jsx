// src/components/ownrecipes/EditOwnRecipeModal.jsx
import { useEffect, useState } from "react";
import { getOwnRecipe, updateOwnRecipe } from "../../api/ownRecipes";

export default function EditOwnRecipeModal({ recipeId, onClose, onSaved }) {
  const [values, setValues] = useState(null);

  useEffect(() => {
    getOwnRecipe(recipeId).then((r) => {
      setValues({
        title: r.title,
        description: r.description,
        kcal: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fats: r.fats,
        time: r.time,
        ingredients: r.ingredients.map(i => ({
          nombre: i.nombre,
          cantidad: i.cantidad
        })),
        steps: r.steps.map(s => s.descripcion),
        image: null,
      });
    });
  }, [recipeId]);

  if (!values) return null;

  function set(field, val) {
    setValues({ ...values, [field]: val });
  }

  async function save() {
    const form = new FormData();

    form.append("id", recipeId);
    form.append("title", values.title);
    form.append("description", values.description);
    form.append("kcal", values.kcal);
    form.append("protein", values.protein);
    form.append("carbs", values.carbs);
    form.append("fats", values.fats);
    form.append("time", values.time);

    form.append("ingredients", JSON.stringify(values.ingredients));
    form.append("steps", JSON.stringify(values.steps));

    if (values.image instanceof File) {
      form.append("image", values.image);
    }

    await updateOwnRecipe(form);
    onSaved();
  }

  return (
    <div className="modal-overlay">
      <div className="create-recipe-modal">

      
        <div className="create-recipe-header">
          <h2>Editar receta</h2>
          <button onClick={onClose}>×</button>
        </div>

    
        <div className="create-recipe-body">

          <label>Imagen (opcional)</label>
          <input type="file" onChange={(e) => set("image", e.target.files[0])} />

          <label>Título</label>
          <input value={values.title} onChange={(e) => set("title", e.target.value)} />

          <label>Descripción</label>
          <textarea value={values.description} onChange={(e) => set("description", e.target.value)} />

          <label>Calorías</label>
          <input value={values.kcal} onChange={(e) => set("kcal", e.target.value)} />

          <label>Proteínas</label>
          <input value={values.protein} onChange={(e) => set("protein", e.target.value)} />

          <label>Carbohidratos</label>
          <input value={values.carbs} onChange={(e) => set("carbs", e.target.value)} />

          <label>Grasas</label>
          <input value={values.fats} onChange={(e) => set("fats", e.target.value)} />

          <label>Tiempo (min)</label>
          <input value={values.time} onChange={(e) => set("time", e.target.value)} />

          
          <h3>Ingredientes</h3>
          {values.ingredients.map((ing, i) => (
            <div key={i} className="ingredient-row">
              <input
                placeholder="Nombre"
                value={ing.nombre}
                onChange={(e) => {
                  const arr = [...values.ingredients];
                  arr[i].nombre = e.target.value;
                  set("ingredients", arr);
                }}
              />
              <input
                placeholder="Cantidad"
                value={ing.cantidad}
                onChange={(e) => {
                  const arr = [...values.ingredients];
                  arr[i].cantidad = e.target.value;
                  set("ingredients", arr);
                }}
              />
            </div>
          ))}

          <button
            className="add-ingredient-btn"
            onClick={() =>
              set("ingredients", [...values.ingredients, { nombre: "", cantidad: "" }])
            }
          >
            Añadir ingrediente
          </button>

        
          <h3>Pasos</h3>
          {values.steps.map((step, i) => (
            <textarea
              key={i}
              value={step}
              onChange={(e) => {
                const arr = [...values.steps];
                arr[i] = e.target.value;
                set("steps", arr);
              }}
            />
          ))}

          <button
            className="add-ingredient-btn"
            onClick={() => set("steps", [...values.steps, ""])}
          >
            Añadir paso
          </button>

       
          <div className="create-recipe-footer">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </div>

        </div>
      </div>
    </div>
  );
}
