// src/pages/Recipe.jsx
import { useNavigate, useParams } from "react-router-dom";
import SpoonacularRecipeModal from "../components/spoonacular/SpoonacularRecipeModal";

export default function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();

  function closeModal() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/dishes");
    }
  }

  return (
    <SpoonacularRecipeModal
      recipeId={id}
      onClose={closeModal}
    />
  );
}
