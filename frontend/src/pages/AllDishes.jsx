// src/pages/AllDishes.jsx

import { useEffect, useState } from "react";
import { fetchRecipes } from "../api/spoonacular";
import RecipeCard from "../components/RecipeCard";
import SearchBar from "../components/SearchBar";
import SpoonacularRecipeModal from "../components/spoonacular/SpoonacularRecipeModal";
import "../styles/pages/AllDishes.css";

export default function AllDishes() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [error, setError] = useState(null);

  async function load(pageToLoad = 1, reset = false, force = false) {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchRecipes(query, pageToLoad, 8, force);

      if (reset) {
        setRecipes(data.results);
      } else {
        setRecipes((prev) => [...prev, ...data.results]);
      }

    } catch (err) {
      console.error("Error al cargar recetas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Busca primero en caché antes de spamear la API
    load(1, true, false);
    setPage(1);
  }, [query]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, false, false);
  }

  function refreshRecipes() {
    // Fuerza ignorar cache y pedir recetas nuevas manualmente
    setPage(1);
    load(1, true, true);
  }

  return (
    <div className="all-dishes-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Recetas Spoonacular</p>
          <h1 className="page-title">Todas las Recetas</h1>
        </div>

        <button className="refresh-btn" onClick={refreshRecipes}>
          Refrescar Recetas
        </button>
      </div>

      <SearchBar onSearch={setQuery} />

      {error && <p className="error-message">{error}</p>}

      <div className="recipes-grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => setSelectedRecipe(recipe.id)}
          />
        ))}
      </div>

      {recipes.length === 0 && !loading && !error && (
        <p className="no-results">No se encontraron recetas.</p>
      )}

      <div className="load-more-container">
        {loading ? (
          <p className="loading-text">Cargando...</p>
        ) : (
          recipes.length > 0 && (
            <button className="load-more-btn" onClick={loadMore}>
              Cargar más
            </button>
          )
        )}
      </div>

      {selectedRecipe && (
        <SpoonacularRecipeModal
          recipeId={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
