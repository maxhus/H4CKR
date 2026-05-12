import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, { username, password });
      const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
      setAuth(res.data.access_token, res.data.user_id, username, payload.role ?? "player");
      navigate("/game");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-green-400 font-mono flex flex-col gap-4 w-80">
        <h1 className="text-3xl text-center tracking-widest mb-4">H4CKR</h1>

        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 p-2 border transition ${mode === "login" ? "bg-green-500 text-black border-green-500" : "border-green-500 hover:bg-green-900"}`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 p-2 border transition ${mode === "register" ? "bg-green-500 text-black border-green-500" : "border-green-500 hover:bg-green-900"}`}
          >
            REGISTER
          </button>
        </div>

        <input
          className="bg-black border border-green-500 p-2 text-green-400 outline-none"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="bg-black border border-green-500 p-2 text-green-400 outline-none"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="border border-green-500 p-2 hover:bg-green-500 hover:text-black transition disabled:opacity-50"
        >
          {loading ? "..." : mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
        </button>
      </div>
    </div>
  );
}
