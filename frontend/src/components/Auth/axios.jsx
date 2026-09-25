import axios from "axios";

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://mern-uniconnect-webapp.onrender.com/api";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
