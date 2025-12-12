import axios from "./axios";

const UPLOAD_BASE = "http://localhost:8000/uploads/";

export async function createOwnRecipe(formData) {
  const { data } = await axios.post("/api/own_recipes/create.php", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listOwnRecipes() {
  const { data } = await axios.get("/api/own_recipes/list.php");
  return data.recipes.map((r) => ({
    id: Number(r.id),
    title: r.titulo,
    calories: Number(r.calorias),
    protein: Number(r.proteinas),
    carbs: Number(r.carbohidratos),
    fats: Number(r.grasas),
    image: r.imagen_url || null,
  }));
}

export async function getOwnRecipe(id) {
  const { data } = await axios.get(`/api/own_recipes/get.php?id=${id}`);

  return {
    id: Number(data.recipe.id),
    title: data.recipe.titulo,
    description: data.recipe.descripcion,
    time: Number(data.recipe.tiempo_preparacion),
    image: data.recipe.imagen_url
      ? UPLOAD_BASE + data.recipe.imagen_url
      : null,
    calories: Number(data.recipe.calorias),
    protein: Number(data.recipe.proteinas),
    carbs: Number(data.recipe.carbohidratos),
    fats: Number(data.recipe.grasas),
    ingredients: data.ingredients,
    steps: data.steps,
  };
}

export async function deleteOwnRecipe(id) {
  const form = new FormData();
  form.append("id", id);
  const { data } = await axios.post("/api/own_recipes/delete.php", form);
  return data.deleted;
}

export async function updateOwnRecipe(formData) {
  const { data } = await axios.post("/api/own_recipes/update.php", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
