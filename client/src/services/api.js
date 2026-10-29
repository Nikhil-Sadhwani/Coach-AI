import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080/api",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 20000,
});

export default api;