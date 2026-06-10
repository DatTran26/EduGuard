import { useEffect, useState } from "react";
import axiosClient from "./api/axiosClient";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/test")
      .then((res) => setData(res.data))
      .catch((err) => {
        const message =
          err.response?.data?.message ??
          err.response?.statusText ??
          err.message;
        const hint =
          err.code === "ERR_NETWORK" || message.includes("Network Error")
            ? " — Kiểm tra backend: cd backend/EduGuard.Api && dotnet run"
            : "";
        setError(message + hint);
      })
      .finally(() => setLoading(false));
      console.log(import.meta.env.VITE_API_BASE_URL);

  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>EduGuard</h1>
      {loading && <p>Đang gọi API...</p>}
      {error && <p style={{ color: "red" }}>Lỗi: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      
    </div>
  );
}

export default App;