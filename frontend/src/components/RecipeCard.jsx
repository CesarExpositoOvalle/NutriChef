import { useMemo } from "react";
import {
  deriveMacrosFromNutrition,
  hasPositiveMacro,
  normalizeMacros,
} from "../api/spoonacular";
import FavoriteButton from "./ui/FavoriteButton";
import "../styles/recipeCard.css";

export default function RecipeCard({ recipe, onClick }) {
     const macros = useMemo(() => {
    const existing = normalizeMacros(recipe?.macros);
    const computed = normalizeMacros(recipe?.computedMacros);
    const derived = deriveMacrosFromNutrition(recipe?.nutrition);

    return (
      (hasPositiveMacro(existing) && existing) ||
      (hasPositiveMacro(computed) && computed) ||
      derived ||
      existing ||
      computed
    );
  }, [recipe]);

  const hasMacros = !!macros;
  const macrosDisplay = macros || {
    calories: 0,
    protein: 0,
    fats: 0,
    carbs: 0,
  };

  return (
    <div className="my-dish-card recipe-card" onClick={onClick}>
      <div className="favorite-pill">Spoonacular</div>

      <div className="favorite-heart" onClick={(e) => e.stopPropagation()}>
        <FavoriteButton recipeId={recipe.id} origin="spoonacular" compact />
      </div>

      <div className="my-dish-image">
        {recipe.image && <img src={recipe.image} alt={recipe.title} />}
      </div>

      <div className="my-dish-footer">{recipe.title}</div>

      {hasMacros && (
        <div className="my-dish-hover">
          <div className="my-icon">
            🔥
            <span>{macrosDisplay.calories ?? 0} kcal</span>
          </div>
          <div className="my-icon">
            🍗
            <span>{macrosDisplay.protein ?? 0} g</span>
          </div>
          <div className="my-icon">
            🧈
            <span>{macrosDisplay.fats ?? 0} g</span>
          </div>
          <div className="my-icon">
            🥬
            <span>{macrosDisplay.carbs ?? 0} g</span>
          </div>
        </div>
      )}
    </div>
  );
}
