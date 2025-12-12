import { useState } from "react";
import { fetchRecipes } from "../api/spoonacular";

export default function useRecipesPagination() {
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadMore(query = "") {
    if (loading) return;

    setLoading(true);
    const data = await fetchRecipes(query, page);

    setRecipes((prev) => [...prev, ...data.results]);
    setPage((p) => p + 1);
    setLoading(false);
  }

  return { recipes, loadMore, loading };
}
