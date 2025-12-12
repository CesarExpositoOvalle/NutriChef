// src/api/admin.js
import axios from "./axios";

export async function fetchAdminUsers() {
  const { data } = await axios.get("/api/admin/users.php", { withCredentials: true });
  return data;
}

export async function updateAdminUser(payload) {
  const { data } = await axios.put("/api/admin/users.php", payload, { withCredentials: true });
  return data;
}

export async function deleteAdminUser(id) {
  const { data } = await axios.delete(`/api/admin/users.php?id=${id}`, { withCredentials: true });
  return data;
}
