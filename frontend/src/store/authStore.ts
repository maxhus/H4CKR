import { create } from "zustand";
 
export interface AuthState {
  token: string | null;
  userId: number | null;
  username: string | null;
  role: string | null;
  setAuth: (token: string, userId: number, username: string, role: string) => void;
  logout: () => void;
}
 
export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  userId: localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : null,
  username: localStorage.getItem("username"),
  role: localStorage.getItem("role"),
 
  setAuth: (token, userId, username, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", String(userId));
    localStorage.setItem("username", username);
    localStorage.setItem("role", role);
    set({ token, userId, username, role });
  },
 
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    set({ token: null, userId: null, username: null, role: null });
  },
}));
 