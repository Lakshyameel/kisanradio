import axios from "axios";

/**
 * Base API URL resolver:
 * - Uses VITE_API_URL if configured (e.g. "/api/v1" behind a reverse proxy or Vite dev proxy).
 * - Defaults to "/api/v1" so reverse proxies (nginx/Caddy/Vite) route /api seamlessly without exposing internal ports.
 */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim();
  }

  return "/api/v1";
}

const baseURL = getApiBaseUrl();

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // Timeout after 8 seconds so fallback data kicks in quickly
  timeout: 8000,
});

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kv_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;