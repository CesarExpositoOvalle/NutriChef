// src/pages/Favorites.jsx
import { useEffect, useMemo, useState } from "react";
import { listFavorites } from "../api/favorites";
import { fetchRecipe } from "../api/spoonacular";
import { getOwnRecipe } from "../api/ownRecipes";
import OwnRecipeModal from "../components/ownrecipes/OwnRecipeModal";
import SpoonacularRecipeModal from "../components/spoonacular/SpoonacularRecipeModal";
import FavoriteButton from "../components/ui/FavoriteButton";
import "../styles/pages/Favorites.css";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasFavorites = useMemo(() => Array.isArray(favorites) && favorites.length > 0, [favorites]);

  async function loadFavorites() {
    try {
      setLoading(true);
      const data = await listFavorites();
      const raw = Array.isArray(data?.favorites) ? data.favorites : data;

      if (!Array.isArray(raw)) {
        setError("No se pudieron cargar los favoritos.");
        setFavorites([]);
        return;
      }

      const detailed = await Promise.all(
        raw.map(async (fav) => {
          const origin = fav.origen ?? fav.origin ?? "spoonacular";
          const id = Number(fav.id_receta);

          try {
            if (origin === "own") {
              const recipe = await getOwnRecipe(id);
              return {
                id,
                origin,
                title: recipe.title,
                image: recipe.image,
                subtitle: `${recipe.time} min · ${recipe.calories} kcal`,
                macros: {
                  calories: recipe.calories,
                  protein: recipe.protein,
                  fats: recipe.fats,
                  carbs: recipe.carbs,
                },
              };
            }

            const recipe = await fetchRecipe(id);
            const macros = recipe.macros || null;

            return {
              id,
              origin,
              title: recipe.title,
              image: recipe.image,
              subtitle: `${recipe.readyInMinutes} min · ${recipe.servings} porciones`,
              macros,
            };
          } catch (err) {
            console.error("Error cargando favorito", err);
            return null;
          }
        })
      );

      setFavorites(detailed.filter(Boolean));
      setError(null);
    } catch (err) {
      console.error("Favorites fetch error:", err);
      setError("Error cargando favoritos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  function openFavorite(fav) {
    setSelected(fav);
  }

  function handleToggle(added) {
    if (!added) {
      loadFavorites();
    }
  }

  if (error) return <p className="page-error">{error}</p>;

  return (
    <div className="favorites-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tus recetas guardadas</p>
          <h1 className="page-title">Favoritos</h1>
          <p className="page-subtitle">Revisa rápidamente todas las recetas que más te gustan.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-card">Cargando favoritos...</div>
      ) : !hasFavorites ? (
        <div className="empty-card">No tienes recetas favoritas todavía.</div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div
              key={`${fav.origin}-${fav.id}`}
              className="my-dish-card favorite-card"
              onClick={() => openFavorite(fav)}
            >
              <div className="favorite-pill">{fav.origin === "own" ? "Personal" : "Spoonacular"}</div>

              <div className="favorite-heart" onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  recipeId={fav.id}
                  origin={fav.origin}
                  compact
                  onToggle={handleToggle}
                />
              </div>

              <div className="my-dish-image">
                {fav.image ? <img src={fav.image} alt={fav.title} /> : <span className="recipe-placeholder">🍽️</span>}
              </div>

              <div className="my-dish-footer">{fav.title}</div>

              {fav.macros && (
                <div className="my-dish-hover">
                  <div className="my-icon">
                    🔥
                    <span>{fav.macros.calories} kcal</span>
                  </div>
                  <div className="my-icon">
                    🍗
                    <span>{fav.macros.protein} g</span>
                  </div>
                  <div className="my-icon">
                    🧈
                    <span>{fav.macros.fats} g</span>
                  </div>
                  <div className="my-icon">
                    🥬
                    <span>{fav.macros.carbs} g</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected?.origin === "own" && (
        <OwnRecipeModal
          recipeId={selected.id}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            loadFavorites();
          }}
          onEdit={() => setSelected(null)}
        />
      )}

      {selected?.origin !== "own" && selected && (
        <SpoonacularRecipeModal
          recipeId={selected.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
