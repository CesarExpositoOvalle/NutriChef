// src/api/favorites.js
import axios from "./axios";

export async function toggleFavorite(id, origin = "spoonacular") {
  const body = new FormData();
  body.append("id", id);
  body.append("origin", origin);
  const { data } = await axios.post("/api/favorites/toggle.php", body);
  return data;
}

export async function listFavorites() {
  const { data } = await axios.get("/api/favorites/list.php");
  return data;
}
