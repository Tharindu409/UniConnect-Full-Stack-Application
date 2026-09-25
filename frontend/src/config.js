const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://uniconnect-full-stack-application.onrender.com");

export default API_BASE_URL;