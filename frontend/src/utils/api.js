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

export async function fetchNextProductId() {
  const response = await api.get("/api/products/next-id");
  return response.data;
}

export async function fetchShelfProducts() {
  const response = await api.get("/api/products/shelf");
  return response.data;
}

export async function archiveMyProductMetadata(productId) {
  const response = await api.delete(`/api/products/${productId}`);
  return response.data;
}

export const deleteMyProductMetadata = archiveMyProductMetadata;

export async function updateMyFarmerProfile(payload) {
  const response = await api.patch("/api/farmers/me/profile", payload);
  return response.data;
}

export async function fetchFarmers(params = {}) {
  const response = await api.get("/api/farmers", { params });
  return response.data;
}

export async function fetchFarmerById(farmerId) {
  const response = await api.get(`/api/farmers/${farmerId}`);
  return response.data;
}

export async function createTradeRequest(payload) {
  const response = await api.post("/api/requests", payload);
  return response.data;
}

export async function fetchMyTradeRequests() {
  const response = await api.get("/api/requests/mine");
  return response.data;
}

export async function updateTradeRequestStatus(requestId, payload) {
  const response = await api.patch(
    `/api/requests/${requestId}/status`,
    payload,
  );
  return response.data;
}

export async function sendTradeRequestMessage(requestId, payload) {
  const response = await api.post(
    `/api/requests/${requestId}/messages`,
    payload,
  );
  return response.data;
}
