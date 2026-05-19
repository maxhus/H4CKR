import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/login";
import Game from "./pages/game";
import Leaderboard from "./pages/leaderboard";
import Profile from "./pages/profile";
import Admin from "./pages/admin";

// ─── Guard route privée ───────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.userId);
  return userId ? <>{children}</> : <Navigate to="/" replace />;
}

// ─── Guard route admin ────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);
  if (!userId) return <Navigate to="/" replace />;
  if (role !== "admin") return <Navigate to="/game" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Privées */}
        <Route path="/game" element={
          <PrivateRoute><Game /></PrivateRoute>
        } />
        <Route path="/leaderboard" element={
          <PrivateRoute><Leaderboard /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}