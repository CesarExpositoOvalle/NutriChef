import axios from "./axios";

export async function createMenu(payload) {
  const { data } = await axios.post("/api/menus/create.php", payload, {
    withCredentials: true,
  });
  return data;
}

export async function listMenus() {
  const { data } = await axios.get("/api/menus/list.php", { withCredentials: true });
  return data.menus || [];
}

export async function getMenu(id) {
  const { data } = await axios.get(`/api/menus/detail.php?id=${id}`, {
    withCredentials: true,
  });
  return data.menu;
}

export async function createWeeklyPlan(payload) {
  const { data } = await axios.post("/api/menus/weekly_create.php", payload, {
    withCredentials: true,
  });
  return data;
}

export async function listWeeklyPlans() {
  const { data } = await axios.get("/api/menus/weekly_list.php", { withCredentials: true });
  return data.plans || [];
}
