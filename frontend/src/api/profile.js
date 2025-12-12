// src/api/profile.js
import axios from "./axios";

export async function fetchProfileData() {
  const { data } = await axios.get("/api/profile/data.php", {
    withCredentials: true,
  });
  return data;
}

export async function updateProfile(payload) {
  const { data } = await axios.post("/api/profile/update.php", payload, {
    withCredentials: true,
  });
  return data;
}

export async function fetchWeightHistory() {
  const { data } = await axios.get("/api/profile/weight_history.php", {
    withCredentials: true,
  });
  return data;
}

export async function addWeightEntry(peso_kg) {
  const { data } = await axios.post(
    "/api/profile/weight_add.php",
    { peso_kg },
    { withCredentials: true }
  );
  return data;
}

export async function updateAccount(formData) {
  const { data } = await axios.post("/api/profile/account.php", formData, {
    withCredentials: true,
    headers: formData instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });

  return data;
}