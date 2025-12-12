// src/components/ownrecipes/OwnRecipeModal.jsx
import { useEffect, useState } from "react";
import { getOwnRecipe, deleteOwnRecipe } from "../../api/ownRecipes";
import MacrosDonutChart from "../profile/MacrosDonutChart";
import FavoriteButton from "../ui/FavoriteButton";

export default function OwnRecipeModal({ recipeId, onClose, onDeleted, onEdit }) {
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    getOwnRecipe(recipeId).then(setRecipe);
  }, [recipeId]);

  async function handleDelete() {
    if (!confirm("¿Eliminar receta?")) return;
    await deleteOwnRecipe(recipeId);
    onDeleted();
  }

  if (!recipe) return null;

  return (
    <div className="modal-overlay">
      <div className="recipe-modal-card">

        
        <div className="modal-header">
          <h2>{recipe.title}</h2>
          <div className="modal-header-actions">
            <FavoriteButton recipeId={recipeId} origin="own" compact />
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="recipe-modal-body">

          
          <div className="recipe-image-container">
            <img src={recipe.image} className="recipe-image" />
          </div>

          
          <p className="recipe-description">{recipe.description}</p>

         
          <div className="recipe-info-grid">

            
            <div className="recipe-left-col">

              <div className="recipe-time-box">
                <h3>Tiempo</h3>
                <p>{recipe.time} min</p>
              </div>

              <div className="recipe-macros-box">
                <MacrosDonutChart
                  macros={{
                    proteinas_g: recipe.protein,
                    grasas_g: recipe.fats,
                    carbohidratos_g: recipe.carbs,
                  }}
                />
              </div>
            </div>

           
            <div className="recipe-ingredients-box">
              <h3>Ingredientes</h3>
              <ul>
                {recipe.ingredients.map((i, idx) => (
                  <li key={idx}>{i.nombre} — {i.cantidad}</li>
                ))}
              </ul>
            </div>

          </div>

       
          <div className="recipe-steps-box">
            <h3>Pasos</h3>
            <ol>
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s.descripcion}</li>
              ))}
            </ol>
          </div>

       
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn-primary" onClick={() => onEdit(recipe.id)}>
              Editar
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              Eliminar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
