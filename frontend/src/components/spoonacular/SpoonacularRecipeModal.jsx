// src/components/spoonacular/SpoonacularRecipeModal.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchRecipe } from "../../api/spoonacular";
import FavoriteButton from "../ui/FavoriteButton";
import MacrosDonutChart from "../profile/MacrosDonutChart";

export default function SpoonacularRecipeModal({ recipeId, onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchRecipe(recipeId);
        if (active) setRecipe(data);
      } catch (err) {
        console.error("Error cargando receta", err);
        if (active) setError("No se pudo cargar la receta.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [recipeId]);

  const macros = useMemo(() => {
    if (!recipe?.macros) return null;

    return {
      proteinas_g: recipe.macros.protein,
      grasas_g: recipe.macros.fats,
      carbohidratos_g: recipe.macros.carbs,
      calorias: recipe.macros.calories,
    };
  }, [recipe]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="recipe-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <p className="eyebrow">Receta Spoonacular</p>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="recipe-modal-body">
            <p className="page-loading">Cargando receta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="recipe-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <p className="eyebrow">Receta Spoonacular</p>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="recipe-modal-body">
            <p className="page-error">{error || "Receta no disponible"}</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = recipe.analyzedInstructions?.[0]?.steps || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="recipe-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Receta Spoonacular</p>
            <h2>{recipe.title}</h2>
            <p className="page-subtitle">
              Tiempo: {recipe.readyInMinutes} min · Porciones: {recipe.servings}
            </p>
          </div>
          <div className="modal-header-actions">
            <FavoriteButton recipeId={recipe.id} origin="spoonacular" compact />
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="recipe-modal-body">
          {recipe.image && (
            <div className="recipe-image-container">
              <img src={recipe.image} alt={recipe.title} className="recipe-image" />
            </div>
          )}

          <div className="recipe-info-grid">
            <div className="recipe-left-col">
              <div className="recipe-time-box">
                <h3>Tiempo</h3>
                <p>{recipe.readyInMinutes} min</p>
              </div>

              {macros && (
                <div className="recipe-macros-box">
                  <div className="recipe-macros-header">
                    <div>
                      <h3>Calorías</h3>
                      <p className="page-subtitle">{macros.calorias} kcal</p>
                    </div>
                  </div>
                  <MacrosDonutChart macros={macros} />
                </div>
              )}
            </div>

            <div className="recipe-ingredients-box">
              <h3>Ingredientes</h3>
              <ul>
                {recipe.extendedIngredients?.map((ing, index) => (
                  <li key={`${ing.id || ing.original}-${index}`}>{ing.original}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="recipe-steps-box">
            <h3>Pasos</h3>
            {steps.length === 0 ? (
              <p className="page-subtitle">No hay instrucciones.</p>
            ) : (
              <ol>
                {steps.map((step, index) => (
                  <li key={`${step.number || "step"}-${index}`}>{step.step}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
