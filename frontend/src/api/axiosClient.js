import axios from "axios";
import { clearStoredTokens, clearStoredUser, getStoredAccessToken } from "../utils/tokenStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Hàm này dùng để gắn access token vào mọi request khi mình đã đăng nhập.
function attachAccessToken(config) {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

// Hàm này xử lý trường hợp token hết hạn để đưa app quay về màn đăng nhập.
function handleUnauthorizedError(error) {
  if (error.response?.status === 401) {
    clearStoredTokens();
    clearStoredUser();
    window.location.assign("/login");
  }

  return Promise.reject(error);
}

axiosClient.interceptors.request.use(attachAccessToken, Promise.reject);
axiosClient.interceptors.response.use((response) => response, handleUnauthorizedError);

export default axiosClient;
