// src/pages/MyDishes.jsx
import { useEffect, useState } from "react";
import { listOwnRecipes } from "../api/ownRecipes";
import "../styles/pages/MyDishes.css";

import CreateOwnRecipeModal from "../components/ownrecipes/CreateOwnRecipeModal";
import OwnRecipeModal from "../components/ownrecipes/OwnRecipeModal";
import EditOwnRecipeModal from "../components/ownrecipes/EditOwnRecipeModal";

export default function MyDishes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    const data = await listOwnRecipes();
    setRecipes(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="my-dishes-page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">Tus creaciones</p>
          <h1 className="page-title">Mis Recetas</h1>
          <p className="page-subtitle">Organiza tus platos caseros y mantén a la mano sus macros.</p>
        </div>
      </div>

      <div className="recipe-grid">

      
        <div className="create-card" onClick={() => setShowCreateModal(true)}>
          <div className="plus">+</div>
          Crear nueva receta
        </div>

       
        {!loading &&
          recipes.map((r) => (
            <div
              key={r.id}
              className="my-dish-card"
              onClick={() => setSelectedRecipe(r.id)}
            >
              <div className="my-dish-image">
                {r.image && <img src={r.image} />}
              </div>

          
              <div className="my-dish-footer">{r.title}</div>

          
              <div className="my-dish-hover">
                <div className="my-icon">
                  🔥
                  <span>{r.calories} kcal</span>
                </div>

                <div className="my-icon">
                  🍗
                  <span>{r.protein} g</span>
                </div>

                <div className="my-icon">
                  🧈
                  <span>{r.fats} g</span>
                </div>

                <div className="my-icon">
                  🥬
                  <span>{r.carbs} g</span>
                </div>
              </div>
            </div>
          ))
        }

        {loading && <p>Cargando...</p>}
      </div>

     
      {selectedRecipe && (
        <OwnRecipeModal
          recipeId={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onDeleted={() => {
            setSelectedRecipe(null);
            load();
          }}
          onEdit={(id) => {
            setSelectedRecipe(null);
            setEditingId(id);
          }}
        />
      )}

   
      {showCreateModal && (
        <CreateOwnRecipeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            load();
          }}
        />
      )}

    
      {editingId && (
        <EditOwnRecipeModal
          recipeId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            load();
          }}
        />
      )}
    </div>
  );
}
