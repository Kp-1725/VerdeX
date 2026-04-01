import axios from "axios";
import { STORAGE_KEY } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return config;
});

export async function registerUser(payload) {
  const response = await api.post("/register", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await api.post("/login", payload);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get("/me");
  return response.data;
}

export async function createProductMetadata(payload) {
  const response = await api.post("/api/products", payload);
  return response.data;
}

export async function addProductStageMetadata(productId, payload) {
  const response = await api.patch(`/api/products/${productId}/stage`, payload);
  return response.data;
}

export async function getProductMetadata(productId) {
  const response = await api.get(`/api/products/${productId}`);
  return response.data;
}

export async function fetchMyProducts() {
  const response = await api.get("/api/products/mine");
  return response.data;
}

export async function deleteMyProductMetadata(productId) {
  const response = await api.delete(`/api/products/${productId}`);
  return response.data;
}
