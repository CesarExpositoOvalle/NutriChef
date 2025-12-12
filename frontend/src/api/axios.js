// src/api/axios.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export default instance;
