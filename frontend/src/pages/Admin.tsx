import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuthStore } from "../store/authStore";
 
// ─── Types ───────────────────────────────────────────────────
 
interface Level {
  id: number; chapter: number; position: number; type: string;
  title: string | null; description: string | null;
  artifact_url: string | null; points: number; solution_hash: string;
}
interface Hint { id: number; level_id: number; position: number; content: string; malus: number; }
interface User { id: number; username: string; role: string; }
interface Stats {
  level_id: number; title: string; type: string;
  total_attempts: number; success_attempts: number;
  completions: number; success_rate: number;
}
 
type Tab = "levels" | "hints" | "users" | "stats";
 
const TYPES = ["base64", "cesar", "rot13", "hex", "regex", "json", "exif", "http", "binaire"];
 
// ─── Composant principal ──────────────────────────────────────
 
export default function Admin() {
  const [tab, setTab] = useState<Tab>("levels");
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
 
  useEffect(() => {
    if (role !== "admin") { navigate("/game"); }
  }, [role, navigate]);
 
  const handleLogout = () => { logout(); navigate("/"); };
 
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl tracking-widest">H4CKR — ADMIN</h1>
        <div className="flex gap-4 text-sm">
          <button onClick={() => navigate("/game")} className="hover:underline">← GAME</button>
          <button onClick={handleLogout} className="text-red-500 hover:underline">LOGOUT</button>
        </div>
      </div>
 
      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-green-900 pb-2">
        {(["levels", "hints", "users", "stats"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1 text-sm border transition ${tab === t ? "bg-green-500 text-black border-green-500" : "border-green-800 hover:border-green-500"}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
 
      {tab === "levels" && <LevelsTab />}
      {tab === "hints" && <HintsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  );
}
 
// ─── Onglet Niveaux ───────────────────────────────────────────
 
function LevelsTab() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [editing, setEditing] = useState<Level | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState("");
 
  const load = () => api.get("/admin/levels").then((r) => setLevels(r.data));
  useEffect(() => { load(); }, []);
 
  const startEdit = (l: Level) => { setEditing(l); setForm({ ...l, solution: "" }); setCreating(false); };
  const startCreate = () => { setCreating(true); setEditing(null); setForm({ chapter: 1, position: 1, type: "base64", title: "", description: "", artifact_url: "", solution: "", points: 100 }); };
 
  const save = async () => {
    try {
      if (creating) {
        await api.post("/admin/levels", form);
        setMsg("Niveau créé ✓");
      } else if (editing) {
        await api.put(`/admin/levels/${editing.id}`, form);
        setMsg("Niveau modifié ✓");
      }
      setCreating(false); setEditing(null); load();
    } catch { setMsg("Erreur"); }
  };
 
  const del = async (id: number) => {
    if (!confirm("Supprimer ce niveau et toutes ses données ?")) return;
    await api.delete(`/admin/levels/${id}`);
    load();
  };
 
  const F = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
 
  return (
    <div className="flex gap-6">
      {/* Liste */}
      <div className="flex-1">
        <div className="flex justify-between mb-3">
          <span className="text-xs text-green-600">{levels.length} NIVEAUX</span>
          <button onClick={startCreate} className="text-xs border border-green-500 px-3 py-1 hover:bg-green-500 hover:text-black transition">+ NOUVEAU</button>
        </div>
        <div className="flex flex-col gap-1">
          {levels.map((l) => (
            <div key={l.id} className={`border p-3 flex justify-between items-center cursor-pointer transition ${editing?.id === l.id ? "border-green-500 bg-green-950" : "border-green-900 hover:border-green-700"}`}>
              <div onClick={() => startEdit(l)}>
                <span className="text-xs text-green-600 mr-2">{l.chapter}-{l.position}</span>
                <span className="text-sm">{l.title || "Sans titre"}</span>
                <span className="text-xs text-green-700 ml-2">[{l.type}]</span>
                <span className="text-xs text-green-700 ml-2">{l.points}pts</span>
              </div>
              <button onClick={() => del(l.id)} className="text-red-600 text-xs hover:text-red-400 ml-4">✕</button>
            </div>
          ))}
        </div>
      </div>
 
      {/* Formulaire */}
      {(editing || creating) && (
        <div className="w-96 border border-green-800 p-4 flex flex-col gap-3">
          <p className="text-sm text-green-600">{creating ? "NOUVEAU NIVEAU" : `MODIFIER #${editing?.id}`}</p>
          {msg && <p className="text-xs text-yellow-400">{msg}</p>}
 
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-green-600">CHAPITRE</label>
              <input type="number" value={form.chapter} onChange={F("chapter")} className="bg-black border border-green-800 p-1 text-sm outline-none" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-green-600">POSITION</label>
              <input type="number" value={form.position} onChange={F("position")} className="bg-black border border-green-800 p-1 text-sm outline-none" />
            </div>
          </div>
 
          <div className="flex flex-col gap-1">
            <label className="text-xs text-green-600">TYPE</label>
            <select value={form.type} onChange={F("type")} className="bg-black border border-green-800 p-1 text-sm outline-none text-green-400">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
 
          <div className="flex flex-col gap-1">
            <label className="text-xs text-green-600">TITRE</label>
            <input value={form.title || ""} onChange={F("title")} className="bg-black border border-green-800 p-1 text-sm outline-none" />
          </div>
 
          <div className="flex flex-col gap-1">
            <label className="text-xs text-green-600">DESCRIPTION</label>
            <textarea value={form.description || ""} onChange={F("description")} rows={3} className="bg-black border border-green-800 p-1 text-sm outline-none resize-none" />
          </div>
 
          <div className="flex flex-col gap-1">
            <label className="text-xs text-green-600">ARTIFACT URL</label>
            <input value={form.artifact_url || ""} onChange={F("artifact_url")} className="bg-black border border-green-800 p-1 text-sm outline-none" />
          </div>
 
          <div className="flex flex-col gap-1">
            <label className="text-xs text-green-600">SOLUTION (en clair){editing ? " — laisser vide pour ne pas changer" : ""}</label>
            <input value={form.solution || ""} onChange={F("solution")} className="bg-black border border-green-800 p-1 text-sm outline-none" />
          </div>
 
          <div className="flex flex-col gap-1">
            <label className="text-xs text-green-600">POINTS</label>
            <input type="number" value={form.points} onChange={F("points")} className="bg-black border border-green-800 p-1 text-sm outline-none" />
          </div>
 
          <div className="flex gap-2 mt-2">
            <button onClick={save} className="flex-1 border border-green-500 p-1 text-sm hover:bg-green-500 hover:text-black transition">SAUVEGARDER</button>
            <button onClick={() => { setEditing(null); setCreating(false); setMsg(""); }} className="flex-1 border border-green-900 p-1 text-sm hover:border-green-700 transition">ANNULER</button>
          </div>
        </div>
      )}
    </div>
  );
}
 
// ─── Onglet Indices ───────────────────────────────────────────
 
function HintsTab() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [form, setForm] = useState({ position: 1, content: "", malus: 10 });
  const [editingHint, setEditingHint] = useState<Hint | null>(null);
  const [msg, setMsg] = useState("");
 
  useEffect(() => { api.get("/admin/levels").then((r) => setLevels(r.data)); }, []);
 
  const loadHints = (l: Level) => {
    setSelectedLevel(l);
    api.get(`/admin/levels/${l.id}/hints`).then((r) => setHints(r.data));
    setEditingHint(null);
  };
 
  const saveHint = async () => {
    try {
      if (editingHint) {
        await api.put(`/admin/hints/${editingHint.id}`, { content: form.content, malus: form.malus });
        setMsg("Indice modifié ✓");
      } else if (selectedLevel) {
        await api.post(`/admin/levels/${selectedLevel.id}/hints`, form);
        setMsg("Indice créé ✓");
      }
      setEditingHint(null);
      setForm({ position: hints.length + 2, content: "", malus: 10 });
      if (selectedLevel) loadHints(selectedLevel);
    } catch { setMsg("Erreur"); }
  };
 
  const delHint = async (id: number) => {
    await api.delete(`/admin/hints/${id}`);
    if (selectedLevel) loadHints(selectedLevel);
  };
 
  return (
    <div className="flex gap-6">
      {/* Liste niveaux */}
      <div className="w-48 flex flex-col gap-1">
        <p className="text-xs text-green-600 mb-2">CHOISIR UN NIVEAU</p>
        {levels.map((l) => (
          <button key={l.id} onClick={() => loadHints(l)}
            className={`border px-2 py-1 text-xs text-left transition ${selectedLevel?.id === l.id ? "bg-green-500 text-black border-green-500" : "border-green-900 hover:border-green-500"}`}>
            {l.chapter}-{l.position} {l.title ? `— ${l.title.substring(0, 12)}` : ""}
          </button>
        ))}
      </div>
 
      {/* Indices du niveau */}
      {selectedLevel && (
        <div className="flex-1">
          <p className="text-xs text-green-600 mb-3">INDICES — {selectedLevel.title}</p>
          <div className="flex flex-col gap-2 mb-4">
            {hints.map((h) => (
              <div key={h.id} className="border border-green-900 p-3 flex justify-between items-start">
                <div>
                  <span className="text-xs text-yellow-600 mr-2">#{h.position}</span>
                  <span className="text-xs text-red-600 mr-2">-{h.malus}pts</span>
                  <p className="text-sm mt-1">{h.content}</p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => { setEditingHint(h); setForm({ position: h.position, content: h.content, malus: h.malus }); }} className="text-xs text-green-600 hover:underline">EDIT</button>
                  <button onClick={() => delHint(h.id)} className="text-xs text-red-600 hover:underline">✕</button>
                </div>
              </div>
            ))}
          </div>
 
          {/* Formulaire indice */}
          <div className="border border-green-800 p-4 flex flex-col gap-3">
            <p className="text-xs text-green-600">{editingHint ? "MODIFIER L'INDICE" : "NOUVEL INDICE"}</p>
            {msg && <p className="text-xs text-yellow-400">{msg}</p>}
            {!editingHint && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-green-600">POSITION</label>
                <input type="number" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: +e.target.value }))} className="bg-black border border-green-800 p-1 text-sm outline-none w-20" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-600">CONTENU</label>
              <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={2} className="bg-black border border-green-800 p-1 text-sm outline-none resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-green-600">MALUS (pts)</label>
              <input type="number" value={form.malus} onChange={(e) => setForm((f) => ({ ...f, malus: +e.target.value }))} className="bg-black border border-green-800 p-1 text-sm outline-none w-24" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveHint} className="flex-1 border border-green-500 p-1 text-sm hover:bg-green-500 hover:text-black transition">SAUVEGARDER</button>
              {editingHint && <button onClick={() => { setEditingHint(null); setMsg(""); }} className="flex-1 border border-green-900 p-1 text-sm hover:border-green-700 transition">ANNULER</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
// ─── Onglet Utilisateurs ──────────────────────────────────────
 
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const currentId = useAuthStore((s) => s.userId);
 
  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);
 
  const toggleRole = async (u: User) => {
    const newRole = u.role === "admin" ? "player" : "admin";
    await api.put(`/admin/users/${u.id}/role?role=${newRole}`);
    load();
  };
 
  const del = async (id: number) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await api.delete(`/admin/users/${id}`);
    load();
  };
 
  return (
    <div>
      <p className="text-xs text-green-600 mb-3">{users.length} UTILISATEURS</p>
      <div className="flex flex-col gap-1">
        {users.map((u) => (
          <div key={u.id} className="border border-green-900 p-3 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <span className="text-xs text-green-700">#{u.id}</span>
              <span className="text-sm">{u.username}</span>
              <span className={`text-xs border px-2 py-0.5 ${u.role === "admin" ? "border-yellow-600 text-yellow-600" : "border-green-800 text-green-700"}`}>{u.role}</span>
            </div>
            <div className="flex gap-3">
              {u.id !== currentId && (
                <>
                  <button onClick={() => toggleRole(u)} className="text-xs text-yellow-600 hover:underline">
                    {u.role === "admin" ? "→ PLAYER" : "→ ADMIN"}
                  </button>
                  <button onClick={() => del(u.id)} className="text-xs text-red-600 hover:underline">✕</button>
                </>
              )}
              {u.id === currentId && <span className="text-xs text-green-700">← vous</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
// ─── Onglet Stats ─────────────────────────────────────────────
 
function StatsTab() {
  const [stats, setStats] = useState<Stats[]>([]);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);
 
  return (
    <div>
      <p className="text-xs text-green-600 mb-3">STATISTIQUES PAR NIVEAU</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-xs text-green-600 border-b border-green-900">
            <th className="text-left py-2">NIVEAU</th>
            <th className="text-left py-2">TYPE</th>
            <th className="text-right py-2">TENTATIVES</th>
            <th className="text-right py-2">SUCCÈS</th>
            <th className="text-right py-2">COMPLÉTIONS</th>
            <th className="text-right py-2">TAUX</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.level_id} className="border-b border-green-950 hover:bg-green-950 transition">
              <td className="py-2">{s.title}</td>
              <td className="py-2 text-green-600 text-xs">{s.type}</td>
              <td className="py-2 text-right">{s.total_attempts}</td>
              <td className="py-2 text-right text-green-400">{s.success_attempts}</td>
              <td className="py-2 text-right">{s.completions}</td>
              <td className={`py-2 text-right ${s.success_rate >= 50 ? "text-green-400" : "text-red-400"}`}>
                {s.success_rate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}