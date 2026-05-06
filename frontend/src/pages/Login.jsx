import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await api.post("/auth/login", { username, password });
    setToken(res.data.access_token);
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-green-400 font-mono flex flex-col gap-4 w-80">
        <h1 className="text-2xl text-center">H4CKR</h1>
        <input className="bg-black border border-green-500 p-2 text-green-400"
          placeholder="username" onChange={(e) => setUsername(e.target.value)} />
        <input className="bg-black border border-green-500 p-2 text-green-400"
          type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}
          className="border border-green-500 p-2 hover:bg-green-500 hover:text-black transition">
          LOGIN
        </button>
      </div>
    </div>
  );
}