import { useState, useRef, useEffect } from "react";
import { Home, CheckSquare, FolderKanban, Dumbbell, BookOpen, Calendar, Plane, Shirt, MoreHorizontal, Plus, X, ChevronLeft, ChevronRight, Upload, Tag, Settings } from "lucide-react";
import * as db from "./db";

/* ═══════════ FONTS ═══════════ */
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
    .fade-in{animation:fadeIn .3s ease-out}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .hover-lift{transition:transform .15s ease,box-shadow .15s ease}
    .hover-lift:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.08)}
    .hover-lift:active{transform:translateY(0)}
  `}</style>
);

/* ═══════════ THEMES ═══════════ */
const themes = {
  calm: { name: "Calm", desc: "Clean · modern · cool", fontH: "'Plus Jakarta Sans',sans-serif", fontB: "'Plus Jakarta Sans',sans-serif", ac: "#0891B2", acSoft: "#ECFEFF", acMid: "#A5F3FC", acDark: "#155E75", bg: "#F8FAFC", bgSoft: "#F1F5F9", side: "#0F172A", sideHov: "#1E293B", sideAc: "#0891B2", sideTxt: "rgba(255,255,255,0.45)", sideTxtAc: "#FFFFFF", card: "#FFFFFF", border: "#E2E8F0", tx: "#0F172A", txM: "#64748B", txS: "#94A3B8" },
  editorial: { name: "Editorial", desc: "Serif · warm · refined", fontH: "'Playfair Display',serif", fontB: "'Source Sans 3',sans-serif", ac: "#B45309", acSoft: "#FFFBEB", acMid: "#FDE68A", acDark: "#78350F", bg: "#FAF8F5", bgSoft: "#F5F0E8", side: "#3A2E27", sideHov: "#4A3A31", sideAc: "#B45309", sideTxt: "rgba(255,245,230,0.5)", sideTxtAc: "#FFFFFF", card: "#FFFFFF", border: "#E8DDC9", tx: "#1C1917", txM: "#78716C", txS: "#A8A29E" },
  sharp: { name: "Sharp", desc: "Techy · precise · bold", fontH: "'Space Grotesk',sans-serif", fontB: "'Inter',sans-serif", ac: "#2563EB", acSoft: "#EFF6FF", acMid: "#BFDBFE", acDark: "#1E3A8A", bg: "#FAFAFA", bgSoft: "#F4F4F5", side: "#FAFAFA", sideHov: "#F4F4F5", sideAc: "#2563EB", sideTxt: "#71717A", sideTxtAc: "#09090B", card: "#FFFFFF", border: "#E4E4E7", tx: "#09090B", txM: "#52525B", txS: "#A1A1AA" },
};
const C = { ...themes.calm };

/* ═══════════ HELPERS ═══════════ */
const PFT_DATE = new Date("2026-06-15");
const CFT_DATE = new Date("2026-10-15");
function daysUntil(d) { const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0); return Math.ceil((x - t) / 86400000); }
function fmt(d) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmtTime(s) { if (!s && s !== 0) return "—"; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function currentSeason() { return new Date().getMonth() < 6 ? "pft" : "cft"; }

function bracket(age) { if (age <= 25) return 0; if (age <= 30) return 1; if (age <= 35) return 2; if (age <= 40) return 3; if (age <= 45) return 4; if (age <= 50) return 5; return 6; }
const FP = [[1, 11], [1, 10], [1, 9], [1, 8], [1, 7], [1, 6], [1, 5]];
const FK = [[63, 210], [63, 205], [63, 200], [63, 195], [63, 190], [63, 185], [63, 180]];
const FR = [[1260, 1860], [1320, 1920], [1380, 1980], [1440, 2040], [1500, 2100], [1560, 2160], [1620, 2220]];
function sPU(r, a) { const [lo, hi] = FP[bracket(a)]; if (r < lo) return 0; if (r >= hi) return 100; return Math.round(40 + ((r - lo) / (hi - lo)) * 60); }
function sPL(s, a) { const [lo, hi] = FK[bracket(a)]; if (s < lo) return 0; if (s >= hi) return 100; return Math.round(40 + ((s - lo) / (hi - lo)) * 60); }
function sRN(s, a) { const [f, sl] = FR[bracket(a)]; if (s <= f) return 100; if (s > sl) return 0; return Math.round(40 + ((sl - s) / (sl - f)) * 60); }
const CM = [[206, 310], [211, 320], [216, 330], [221, 340], [226, 350], [231, 360], [236, 370]];
const CA = [[6, 91], [6, 85], [6, 80], [6, 75], [6, 70], [6, 65], [6, 60]];
const CF_T = [[173, 300], [178, 310], [183, 320], [188, 330], [193, 340], [198, 350], [203, 360]];
function sMTC(s, a) { const [f, sl] = CM[bracket(a)]; if (s <= f) return 100; if (s > sl) return 0; return Math.round(40 + ((sl - s) / (sl - f)) * 60); }
function sACL(r, a) { const [lo, hi] = CA[bracket(a)]; if (r < lo) return 0; if (r >= hi) return 100; return Math.round(40 + ((r - lo) / (hi - lo)) * 60); }
function sMANUF(s, a) { const [f, sl] = CF_T[bracket(a)]; if (s <= f) return 100; if (s > sl) return 0; return Math.round(40 + ((sl - s) / (sl - f)) * 60); }

const PCOLORS = { 1: "#EF4444", 2: "#F59E0B", 3: "#CBD5E1" };
function taskSort(a, b) { const aD = a.due_date ? daysUntil(a.due_date) : 999, bD = b.due_date ? daysUntil(b.due_date) : 999; if ((aD < 0) !== (bD < 0)) return aD < 0 ? -1 : 1; if (aD === 0 && bD !== 0) return -1; if (bD === 0 && aD !== 0) return 1; if ((a.priority || 2) !== (b.priority || 2)) return (a.priority || 2) - (b.priority || 2); return aD - bD; }
const CHIP_PAL = [{ bg: "#EFF6FF", c: "#1D4ED8" }, { bg: "#FFF7ED", c: "#C2410C" }, { bg: "#F0FDF4", c: "#15803D" }, { bg: "#FDF2F8", c: "#BE185D" }, { bg: "#F5F3FF", c: "#7C3AED" }, { bg: "#FEF9C3", c: "#854D0E" }, { bg: "#ECFDF5", c: "#059669" }, { bg: "#E0F2FE", c: "#0369A1" }];
function chipS(cat) { const b = { home: CHIP_PAL[0], out: CHIP_PAL[1], anywhere: CHIP_PAL[2] }; if (b[cat]) return b[cat]; let h = 0; for (const c of cat) h = (h * 31 + c.charCodeAt(0)) >>> 0; return CHIP_PAL[h % CHIP_PAL.length]; }
function tripEmoji(d) { const l = d.toLowerCase(); if (l.includes("new york") || l.includes("nyc")) return "🗽"; if (l.includes("paris")) return "🗼"; if (l.includes("tokyo")) return "🗾"; if (l.includes("beach") || l.includes("cancun") || l.includes("miami") || l.includes("cabo") || l.includes("hawaii")) return "🏖️"; if (l.includes("ski") || l.includes("aspen")) return "🏔️"; if (l.includes("rome") || l.includes("italy")) return "🇮🇹"; if (l.includes("vegas")) return "🎰"; if (l.includes("london")) return "🇬🇧"; const em = ["✈️", "🌍", "🧳", "🗺️", "🌴"]; let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0; return em[h % em.length]; }
function dueTag(t) { if (!t.due_date) return null; const d = daysUntil(t.due_date); if (d < 0) return { text: `${Math.abs(d)}d overdue`, color: "#EF4444", bg: "#FEF2F2" }; if (d === 0) return { text: "Today", color: "#D97706", bg: "#FFFBEB" }; if (d === 1) return { text: "Tomorrow", color: "#D97706", bg: "#FFFBEB" }; return { text: fmt(t.due_date), color: C.txS, bg: "transparent" }; }
const COLOR_OPTS = ["#22C55E", "#8B5CF6", "#F97316", "#3B82F6", "#EF4444", "#EC4899", "#14B8A6", "#F59E0B", "#6366F1", "#06B6D4"];

/* ═══════════ EMPTY STATE ═══════════ */
const EMPTY = {
  user: { age: 22, settingsId: null },
  categories: ["home", "out", "anywhere"],
  workoutCats: [{ id: "run", name: "Run", color: "#22C55E" }, { id: "strength", name: "Strength", color: "#8B5CF6" }, { id: "hiit", name: "HIIT", color: "#F97316" }],
  tasks: [], projects: [], workouts: [], pft: [], cft: [], trips: [], checklist: [], clothing: [], inspo: [], books: [],
  bookCategories: ["fiction", "non-fiction"],
};

/* ═══════════ UI PRIMITIVES ═══════════ */
function Surface({ children, className = "", onClick, accent }) {
  return <div onClick={onClick} className={`rounded-2xl p-5 ${onClick ? "cursor-pointer hover-lift" : ""} ${className}`} style={{ backgroundColor: C.card, borderLeft: accent ? `3px solid ${C.ac}` : "none", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}>{children}</div>;
}
function Stat({ value, label, color, size = "lg" }) {
  const sz = size === "xl" ? "text-5xl" : size === "lg" ? "text-3xl" : "text-xl";
  return <div><p className={`${sz} font-extrabold tracking-tight`} style={{ color: color || C.ac, fontFamily: C.fontH }}>{value}</p><p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: C.txS }}>{label}</p></div>;
}
function Bar({ value, max, h = 6, color }) { const p = max > 0 ? Math.min(100, (value / max) * 100) : 0; return <div className="w-full rounded-full overflow-hidden" style={{ height: h, backgroundColor: C.bgSoft }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, backgroundColor: color || C.ac }} /></div>; }
function Chip({ label, cat }) { const s = chipS(cat || label); return <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize inline-block" style={{ backgroundColor: s.bg, color: s.c }}>{label}</span>; }
function Btn({ children, onClick, full, ghost, small, disabled }) {
  return <button onClick={onClick} disabled={disabled} className={`font-bold rounded-xl transition-all active:scale-[0.97] inline-flex items-center justify-center gap-2 ${full ? "w-full" : ""} ${small ? "text-xs px-4 py-2.5 min-h-[36px]" : "text-sm px-5 py-3 min-h-[44px]"}`} style={ghost ? { color: C.ac, backgroundColor: C.acSoft } : { backgroundColor: disabled ? C.txS : C.ac, color: "#fff" }}>{children}</button>;
}
function Inp({ label, ...p }) {
  return <div>{label && <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.txS }}>{label}</label>}<input {...p} className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ backgroundColor: C.bgSoft, border: "2px solid transparent", color: C.tx }} onFocus={e => e.target.style.borderColor = C.ac} onBlur={e => e.target.style.borderColor = "transparent"} /></div>;
}
function Sel({ label, children, ...p }) {
  return <div>{label && <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.txS }}>{label}</label>}<select {...p} className="w-full text-sm rounded-xl px-4 py-3 outline-none" style={{ backgroundColor: C.bgSoft, border: "2px solid transparent", color: C.tx }}>{children}</select></div>;
}
function SectionLabel({ children, action, onAction }) {
  return <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-extrabold uppercase tracking-[0.15em]" style={{ color: C.txS }}>{children}</p>{action && <button onClick={onAction} className="text-xs font-bold flex items-center gap-1" style={{ color: C.ac }}>{action}</button>}</div>;
}
function PageTitle({ children, icon }) {
  return <div className="flex items-center gap-3 mb-5 pt-2">{icon && <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.acSoft }}>{icon}</div>}<h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: C.fontH, color: C.tx }}>{children}</h1></div>;
}
function Check({ on, onClick }) {
  return <button onClick={onClick} className="w-[22px] h-[22px] rounded-lg flex-shrink-0 flex items-center justify-center transition-all" style={{ backgroundColor: on ? C.ac : "transparent", border: `2px solid ${on ? C.ac : C.border}` }}>{on && <span className="text-white text-[10px] font-bold">✓</span>}</button>;
}
function TabBar({ tabs, active, onChange }) {
  return <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: C.bgSoft }}>{tabs.map(([k, l]) => <button key={k} onClick={() => onChange(k)} className="flex-1 text-sm py-2.5 rounded-xl font-bold transition-all" style={active === k ? { backgroundColor: C.card, color: C.ac, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } : { color: C.txS }}>{l}</button>)}</div>;
}
function Pill({ label, count, active, onClick, dashed }) {
  return <button onClick={onClick} className="text-xs font-bold px-3.5 py-2 rounded-xl transition-all capitalize inline-flex items-center gap-1.5" style={dashed ? { color: C.ac, border: `1.5px dashed ${C.ac}`, backgroundColor: "transparent" } : active ? { backgroundColor: C.ac, color: "#fff" } : { backgroundColor: C.bgSoft, color: C.txM }}>{label}{count !== undefined && count !== null ? ` ${count}` : ""}</button>;
}
function ColorDot({ color, active, onClick, size = 20 }) {
  return <button onClick={onClick} className="rounded-full transition-all flex-shrink-0" style={{ width: size, height: size, backgroundColor: color, outline: active ? `2.5px solid ${C.tx}` : "none", outlineOffset: "2px" }} />;
}
function Stars({ rating, onRate }) {
  return <div className="flex gap-1 mt-2">{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => onRate(n)} className="text-lg leading-none" style={{ color: n <= (rating || 0) ? "#F59E0B" : C.border }}>{n <= (rating || 0) ? "★" : "☆"}</button>)}</div>;
}
function ScoreBar({ label, raw, score }) {
  const sc = score >= 80 ? "#059669" : score >= 60 ? C.ac : score >= 40 ? "#D97706" : "#EF4444";
  return <div className="py-3" style={{ borderBottom: `1px solid ${C.bgSoft}` }}><div className="flex justify-between items-baseline mb-2"><div><span className="text-sm font-bold" style={{ color: C.tx }}>{label}</span><span className="text-xs ml-2" style={{ color: C.txS }}>{raw}</span></div><span className="text-lg font-extrabold" style={{ color: sc, fontFamily: C.fontH }}>{score}</span></div><Bar value={score} max={100} h={6} color={sc} /></div>;
}

/* ═══════════ TODAY ═══════════ */
function TodayView({ state, go }) {
  const { tasks, workouts, pft, cft, clothing, user, workoutCats } = state;
  const season = currentSeason(); const testDate = season === "pft" ? PFT_DATE : CFT_DATE; const days = daysUntil(testDate);
  const open = tasks.filter(t => t.status === "todo").sort(taskSort); const focus = open.slice(0, 4);
  const hasW = workouts.some(w => w.date === todayStr()); const todayW = workouts.find(w => w.date === todayStr());
  const urgent = clothing.filter(c => c.type === "need_to_return" && !c.done && c.deadline && daysUntil(c.deadline) <= 7 && daysUntil(c.deadline) >= 0);
  const now = new Date(); const hour = now.getHours(); const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  let latestScore = null;
  if (season === "pft" && pft[0]) { const e = pft[0]; latestScore = sPU(e.pullups, user.age) + sPL(e.plank_s, user.age) + sRN(e.run_s, user.age); }
  if (season === "cft" && cft[0]) { const e = cft[0]; latestScore = sMTC(e.mtc_s, user.age) + sACL(e.acl, user.age) + sMANUF(e.manuf_s, user.age); }
  const streak = (() => { const s = [...workouts].sort((a, b) => b.date.localeCompare(a.date)); let c = 0, p = null; for (const w of s) { if (!p) { c = 1; p = w.date; continue; } if (Math.round((new Date(p) - new Date(w.date)) / 86400000) === 1) { c++; p = w.date; } else break; } return c; })();
  const monthW = workouts.filter(w => { const d = new Date(w.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const catName = (id) => workoutCats.find(c => c.id === id)?.name || id;

  return (
    <div className="space-y-5 fade-in">
      <div className="pt-2"><p className="text-sm font-medium" style={{ color: C.txS }}>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="text-3xl font-extrabold mt-1 tracking-tight" style={{ fontFamily: C.fontH, color: C.tx }}>{greeting}</h1></div>
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl p-4 cursor-pointer hover-lift" onClick={() => go("fitness", season)} style={{ backgroundColor: C.acSoft }}><div className="flex items-center justify-between"><Stat value={days} label={`${season.toUpperCase()} days`} size="md" />{latestScore && <p className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: C.card, color: C.ac }}>{latestScore}/300</p>}</div></div>
        <div className="flex-1 rounded-2xl p-4" style={{ backgroundColor: streak >= 2 ? "#FFF7ED" : C.bgSoft }}><Stat value={streak >= 2 ? `${streak}🔥` : monthW} label={streak >= 2 ? "day streak" : "workouts this mo"} size="md" color={streak >= 2 ? "#EA580C" : C.txM} /></div>
      </div>
      {urgent.map(item => <div key={item.id} onClick={() => go("clothing")} className="rounded-xl px-4 py-3 cursor-pointer flex items-center gap-3 hover-lift" style={{ backgroundColor: "#FEF2F2", borderLeft: "3px solid #EF4444" }}><span className="text-lg">⚠️</span><div className="flex-1"><p className="text-sm font-bold" style={{ color: "#991B1B" }}>Return {item.title}</p><p className="text-xs" style={{ color: "#B91C1C" }}>{daysUntil(item.deadline)}d left</p></div></div>)}
      <div>
        <SectionLabel action="All tasks →" onAction={() => go("tasks")}>Today's Focus</SectionLabel>
        {focus.length === 0 ? <p className="text-sm py-6 text-center" style={{ color: C.txS }}>Nothing due — nice work ✓</p>
          : <div className="space-y-2">{focus.map(t => { const du = dueTag(t); return <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3 hover-lift" style={{ backgroundColor: C.card, borderLeft: `3px solid ${PCOLORS[t.priority || 2]}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}><div className="flex-1 min-w-0"><p className="text-sm font-semibold" style={{ color: C.tx }}>{t.title}</p><div className="flex items-center gap-2 mt-1.5"><Chip label={t.context} cat={t.context} />{du && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ color: du.color, backgroundColor: du.bg }}>{du.text}</span>}</div></div></div>; })}</div>}
      </div>
      <Surface accent onClick={() => go("fitness", "workouts")}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Dumbbell size={20} style={{ color: C.ac }} />{hasW ? <div><p className="text-sm font-bold" style={{ color: C.tx }}>{catName(todayW.type)} — {todayW.duration_minutes} min ✓</p><p className="text-xs" style={{ color: C.txS }}>{monthW} workouts this month</p></div> : <div><p className="text-sm font-semibold" style={{ color: C.txM }}>No workout yet today</p><p className="text-xs" style={{ color: C.txS }}>{monthW} this month</p></div>}</div><ChevronRight size={16} style={{ color: C.txS }} /></div></Surface>
    </div>
  );
}

/* ═══════════ TASKS ═══════════ */
function TasksView({ state, setState }) {
  const { tasks, categories } = state;
  const [ctx, setCtx] = useState("all"); const [title, setTitle] = useState(""); const [context, setContext] = useState(categories[0]); const [priority, setPriority] = useState(2); const [dueDate, setDueDate] = useState(""); const [showOpt, setShowOpt] = useState(false); const [newCat, setNewCat] = useState(""); const [showNewCat, setShowNewCat] = useState(false);
  const active = tasks.filter(t => t.status === "todo" && (ctx === "all" || t.context === ctx)).sort(taskSort);
  const done = tasks.filter(t => t.status === "done");

  async function add() { if (!title.trim()) return; const d = await db.insertTask({ title, context, priority, due_date: dueDate || null, status: "todo" }); if (d) setState(s => ({ ...s, tasks: [d, ...s.tasks] })); setTitle(""); setDueDate(""); setShowOpt(false); }
  async function complete(id) { await db.updateTask(id, { status: "done" }); setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status: "done" } : t) })); }
  async function del(id) { await db.deleteTask(id); setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) })); }
  async function addCat() { const c = newCat.trim().toLowerCase(); if (!c || categories.includes(c)) return; await db.addTaskCategory(c); setState(s => ({ ...s, categories: [...s.categories, c] })); setContext(c); setNewCat(""); setShowNewCat(false); }

  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<CheckSquare size={20} style={{ color: C.ac }} />}>Tasks</PageTitle>
      <div className="flex gap-2 flex-wrap"><Pill label="All" count={tasks.filter(t => t.status === "todo").length} active={ctx === "all"} onClick={() => setCtx("all")} />{categories.map(c => <Pill key={c} label={c} count={tasks.filter(t => t.status === "todo" && t.context === c).length} active={ctx === c} onClick={() => setCtx(c)} />)}<Pill label="+ Category" dashed onClick={() => setShowNewCat(!showNewCat)} /></div>
      {showNewCat && <div className="flex gap-2"><input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCat()} placeholder="Category name…" autoFocus className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><Btn onClick={addCat} small>Add</Btn></div>}
      <Surface><div className="flex gap-2"><input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="What needs to get done?" className="flex-1 text-sm rounded-xl px-4 py-3 outline-none font-medium" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><Btn onClick={add} small>Add</Btn></div><button onClick={() => setShowOpt(!showOpt)} className="text-xs font-bold mt-3 inline-flex items-center gap-1" style={{ color: C.txS }}>{showOpt ? <X size={12} /> : <Plus size={12} />} {showOpt ? "Hide" : "Options"}</button>{showOpt && <div className="grid grid-cols-3 gap-2 mt-3"><Sel label="Category" value={context} onChange={e => setContext(e.target.value)}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</Sel><Sel label="Priority" value={priority} onChange={e => setPriority(Number(e.target.value))}><option value={1}>P1</option><option value={2}>P2</option><option value={3}>P3</option></Sel><Inp label="Due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>}</Surface>
      <div className="space-y-2">{active.length === 0 && <p className="text-sm text-center py-10" style={{ color: C.txS }}>Nothing here</p>}{active.map(t => { const du = dueTag(t); return <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3.5 hover-lift" style={{ backgroundColor: C.card, borderLeft: `3px solid ${PCOLORS[t.priority || 2]}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}><Check on={false} onClick={() => complete(t.id)} /><div className="flex-1 min-w-0"><p className="text-sm font-medium" style={{ color: C.tx }}>{t.title}</p><div className="flex items-center gap-2 mt-1.5"><Chip label={t.context} cat={t.context} />{du && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ color: du.color, backgroundColor: du.bg }}>{du.text}</span>}</div></div><button onClick={() => del(t.id)}><X size={16} style={{ color: C.txS }} /></button></div>; })}</div>
      {done.length > 0 && <div><SectionLabel>Done ({done.length})</SectionLabel><div className="space-y-1">{done.slice(0, 5).map(t => <div key={t.id} className="flex items-center gap-3 px-4 py-2 opacity-40"><Check on={true} onClick={() => {}} /><span className="text-sm line-through" style={{ color: C.txM }}>{t.title}</span></div>)}</div></div>}
    </div>
  );
}

/* ═══════════ PROJECTS ═══════════ */
function ProjectsView({ state, setState }) {
  const { projects, tasks } = state; const [sel, setSel] = useState(null); const [showAdd, setShowAdd] = useState(false); const [form, setForm] = useState({ title: "", notes: "" }); const [taskIn, setTaskIn] = useState(""); const [taskDue, setTaskDue] = useState(""); const [taskP, setTaskP] = useState(2);
  const proj = sel ? projects.find(p => p.id === sel) : null;

  async function saveP() { if (!form.title) return; const d = await db.insertProject(form); if (d) setState(s => ({ ...s, projects: [d, ...s.projects] })); setShowAdd(false); setForm({ title: "", notes: "" }); }
  async function addTask() { if (!taskIn.trim() || !sel) return; const d = await db.insertTask({ title: taskIn, context: "anywhere", priority: taskP, due_date: taskDue || null, project_id: sel }); if (d) setState(s => ({ ...s, tasks: [...s.tasks, d] })); setTaskIn(""); setTaskDue(""); }
  async function compTask(id) { await db.updateTask(id, { status: "done" }); setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status: "done" } : t) })); }
  async function updateNotes(v) { await db.updateProject(sel, { notes: v }); setState(s => ({ ...s, projects: s.projects.map(p => p.id === sel ? { ...p, notes: v, updated_at: todayStr() } : p) })); }

  if (proj) {
    const pt = tasks.filter(t => t.project_id === proj.id).sort(taskSort); const todo = pt.filter(t => t.status === "todo"); const dn = pt.filter(t => t.status === "done");
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center gap-3 pt-2"><button onClick={() => setSel(null)}><ChevronLeft size={20} style={{ color: C.txS }} /></button><h1 className="text-xl font-extrabold" style={{ fontFamily: C.fontH, color: C.tx }}>{proj.title}</h1></div>
        <Surface><SectionLabel>Notes</SectionLabel><textarea defaultValue={proj.notes} onBlur={e => updateNotes(e.target.value)} rows={5} className="w-full text-sm outline-none resize-none leading-relaxed" style={{ color: C.txM, backgroundColor: "transparent" }} /></Surface>
        <div><SectionLabel>Tasks · {todo.length} open</SectionLabel>{pt.length > 0 && <div className="mb-4"><Bar value={dn.length} max={pt.length} h={5} /></div>}<div className="space-y-2 mb-4">{todo.map(t => { const du = dueTag(t); return <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: C.bgSoft, borderLeft: `3px solid ${PCOLORS[t.priority || 2]}` }}><Check on={false} onClick={() => compTask(t.id)} /><div className="flex-1"><p className="text-sm" style={{ color: C.tx }}>{t.title}</p>{du && <p className="text-[11px] font-bold mt-1" style={{ color: du.color }}>{du.text}</p>}</div></div>; })}{dn.map(t => <div key={t.id} className="flex items-center gap-3 px-4 py-2 opacity-40"><Check on={true} onClick={() => {}} /><span className="text-sm line-through" style={{ color: C.txM }}>{t.title}</span></div>)}</div><div className="space-y-3"><input value={taskIn} onChange={e => setTaskIn(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Add task…" className="w-full text-sm rounded-xl px-4 py-3 outline-none" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><div className="flex gap-2"><Sel value={taskP} onChange={e => setTaskP(Number(e.target.value))}><option value={1}>P1</option><option value={2}>P2</option><option value={3}>P3</option></Sel><input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="flex-1 text-sm rounded-xl px-4 py-3 outline-none" style={{ backgroundColor: C.bgSoft, color: C.tx }} /></div><Btn onClick={addTask} full ghost small>+ Add Task</Btn></div></div>
      </div>);
  }
  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between"><PageTitle icon={<FolderKanban size={20} style={{ color: C.ac }} />}>Projects</PageTitle><Btn onClick={() => setShowAdd(!showAdd)} small ghost>New</Btn></div>
      {showAdd && <Surface className="space-y-3"><Inp label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><Inp label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><Btn onClick={saveP} full>Create</Btn></Surface>}
      <div className="space-y-3">{projects.map(p => { const all = tasks.filter(t => t.project_id === p.id); const dn = all.filter(t => t.status === "done"); const uc = all.filter(t => t.status === "todo" && t.due_date && daysUntil(t.due_date) <= 7).length; return <Surface key={p.id} onClick={() => setSel(p.id)} accent><p className="text-base font-bold" style={{ color: C.tx, fontFamily: C.fontH }}>{p.title}</p><p className="text-xs mt-1" style={{ color: C.txS }}>Updated {p.updated_at}</p>{all.length > 0 && <div className="mt-3"><Bar value={dn.length} max={all.length} h={4} /><div className="flex justify-between mt-1.5 text-xs" style={{ color: C.txS }}><span>{dn.length}/{all.length}</span>{uc > 0 && <span className="font-bold" style={{ color: "#D97706" }}>{uc} due soon</span>}</div></div>}</Surface>; })}</div>
    </div>
  );
}

/* ═══════════ FITNESS ═══════════ */
function FitnessView({ state, setState, sub, setSub }) {
  return <div className="space-y-5 fade-in"><PageTitle icon={<Dumbbell size={20} style={{ color: C.ac }} />}>Fitness</PageTitle><TabBar tabs={[["workouts", "Workouts"], ["pft", `PFT${currentSeason() === "pft" ? " ●" : ""}`], ["cft", `CFT${currentSeason() === "cft" ? " ●" : ""}`]]} active={sub} onChange={setSub} />{sub === "workouts" ? <WorkoutsTab state={state} setState={setState} /> : sub === "pft" ? <PFTTab state={state} setState={setState} /> : <CFTTab state={state} setState={setState} />}</div>;
}

function WorkoutsTab({ state, setState }) {
  const { workouts, workoutCats } = state; const [show, setShow] = useState(false); const [form, setForm] = useState({ date: todayStr(), type: workoutCats[0]?.id || "", duration_minutes: "", notes: "" }); const [showCatMgr, setShowCatMgr] = useState(false); const [newCatName, setNewCatName] = useState(""); const [newCatColor, setNewCatColor] = useState("#3B82F6");
  const catColor = (type) => workoutCats.find(c => c.id === type)?.color || C.ac;
  const catName = (type) => workoutCats.find(c => c.id === type)?.name || type;

  async function save() { if (!form.type || !form.duration_minutes) return; const d = await db.insertWorkout({ date: form.date, type: form.type, duration_minutes: Number(form.duration_minutes), notes: form.notes }); if (d) setState(s => ({ ...s, workouts: [d, ...s.workouts] })); setShow(false); setForm({ date: todayStr(), type: workoutCats[0]?.id || "", duration_minutes: "", notes: "" }); }
  async function addCat() { const name = newCatName.trim(); if (!name) return; const id = name.toLowerCase().replace(/\s+/g, "_"); if (workoutCats.some(c => c.id === id)) return; await db.insertWorkoutCat({ id, name, color: newCatColor }); setState(s => ({ ...s, workoutCats: [...s.workoutCats, { id, name, color: newCatColor }] })); setNewCatName(""); }
  async function updateColor(slug, color) { await db.updateWorkoutCatColor(slug, color); setState(s => ({ ...s, workoutCats: s.workoutCats.map(c => c.id === slug ? { ...c, color } : c) })); }
  async function delCat(slug) { if (workoutCats.length <= 1) return; await db.deleteWorkoutCat(slug); setState(s => ({ ...s, workoutCats: s.workoutCats.filter(c => c.id !== slug) })); }

  const streak = (() => { const s = [...workouts].sort((a, b) => b.date.localeCompare(a.date)); let c = 0, p = null; for (const w of s) { if (!p) { c = 1; p = w.date; continue; } if (Math.round((new Date(p) - new Date(w.date)) / 86400000) === 1) { c++; p = w.date; } else break; } return c; })();
  const mo = workouts.filter(w => { const d = new Date(w.date), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  const dateMap = {}; workouts.forEach(w => { if (!dateMap[w.date]) dateMap[w.date] = w; });
  const heatmap = (() => { const today = new Date(); today.setHours(0, 0, 0, 0); const start = new Date(today); start.setDate(start.getDate() - 12 * 7 + 1); while (start.getDay() !== 1) start.setDate(start.getDate() - 1); const grid = []; let wk = []; for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) { const ds = d.toISOString().split("T")[0]; const w = dateMap[ds]; wk.push({ d: ds, has: !!w, color: w ? catColor(w.type) : null, today: ds === todayStr(), future: d > today }); if (wk.length === 7) { grid.push(wk); wk = []; } } if (wk.length) { while (wk.length < 7) wk.push({ d: "", has: false, color: null, today: false, future: true }); grid.push(wk); } return grid; })();

  return (
    <div className="space-y-5">
      <div className="flex gap-3">{[{ v: streak, l: "Streak", c: streak >= 2 ? "#EA580C" : C.txM, e: streak >= 2 ? "🔥" : "" }, { v: mo, l: "This month" }, { v: workouts.length, l: "All time" }].map(({ v, l, c, e }) => <div key={l} className="flex-1 rounded-2xl p-4 text-center" style={{ backgroundColor: C.bgSoft }}><p className="text-2xl font-extrabold" style={{ color: c || C.ac, fontFamily: C.fontH }}>{v}{e}</p><p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: C.txS }}>{l}</p></div>)}</div>
      <Surface><SectionLabel>12-Week Activity</SectionLabel><div className="flex gap-[4px]"><div className="flex flex-col gap-[4px] mr-1">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} className="h-[18px] flex items-center"><span className="text-[10px] font-bold" style={{ color: C.txS }}>{d}</span></div>)}</div><div className="flex-1 overflow-x-auto"><div className="flex gap-[4px]" style={{ minWidth: heatmap.length * 22 }}>{heatmap.map((wk, wi) => <div key={wi} className="flex flex-col gap-[4px]">{wk.map((day, di) => <div key={di} className="w-[18px] h-[18px] rounded" style={{ backgroundColor: day.future || !day.d ? "transparent" : day.has ? day.color : C.border, outline: day.today ? `2.5px solid ${C.tx}` : "none", outlineOffset: "-1px" }} />)}</div>)}</div></div></div><div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3" style={{ borderTop: `1px solid ${C.bgSoft}` }}>{workoutCats.map(cat => <div key={cat.id} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} /><span className="text-[11px] font-semibold" style={{ color: C.txM }}>{cat.name}</span></div>)}<div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: C.border }} /><span className="text-[11px] font-semibold" style={{ color: C.txS }}>Rest</span></div></div></Surface>
      <div className="flex gap-2"><Btn onClick={() => { setShow(!show); setShowCatMgr(false); }} full><Plus size={16} /> Log Workout</Btn><Btn onClick={() => { setShowCatMgr(!showCatMgr); setShow(false); }} ghost small><Settings size={14} /></Btn></div>
      {showCatMgr && <Surface className="space-y-5"><SectionLabel>Workout Categories</SectionLabel><div className="space-y-4">{workoutCats.map(cat => <div key={cat.id} className="space-y-2"><div className="flex items-center gap-3"><div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} /><span className="text-sm font-bold flex-1" style={{ color: C.tx }}>{cat.name}</span>{workoutCats.length > 1 && <button onClick={() => delCat(cat.id)}><X size={14} style={{ color: C.txS }} /></button>}</div><div className="flex gap-2 pl-7">{COLOR_OPTS.map(co => <ColorDot key={co} color={co} active={cat.color === co} onClick={() => updateColor(cat.id, co)} size={22} />)}</div></div>)}</div><div className="pt-4" style={{ borderTop: `1px solid ${C.bgSoft}` }}><SectionLabel>Add New</SectionLabel><input value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCat()} placeholder="e.g. Yoga…" className="w-full text-sm rounded-xl px-4 py-3 outline-none mb-3" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><div className="flex gap-2 mb-3 flex-wrap">{COLOR_OPTS.map(co => <ColorDot key={co} color={co} active={newCatColor === co} onClick={() => setNewCatColor(co)} size={24} />)}</div><Btn onClick={addCat} full ghost small>Add Category</Btn></div></Surface>}
      {show && <Surface className="space-y-4"><Inp label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /><div><label className="block text-[11px] font-bold mb-2 uppercase tracking-wider" style={{ color: C.txS }}>Category</label><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(workoutCats.length, 3)}, 1fr)` }}>{workoutCats.map(cat => <button key={cat.id} onClick={() => setForm({ ...form, type: cat.id })} className="text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2" style={form.type === cat.id ? { backgroundColor: cat.color, color: "#fff" } : { backgroundColor: C.bgSoft, color: C.txM }}><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: form.type === cat.id ? "rgba(255,255,255,0.5)" : cat.color }} />{cat.name}</button>)}</div></div><Inp label="Duration (min)" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /><Inp label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><Btn onClick={save} full>Save</Btn></Surface>}
      <SectionLabel>Recent</SectionLabel>
      <div className="space-y-2">{workouts.slice(0, 8).map(w => <div key={w.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: C.bgSoft }}><div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: catColor(w.type) }} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-semibold" style={{ color: C.tx }}>{catName(w.type)}</p><span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: catColor(w.type) + "18", color: catColor(w.type) }}>{w.duration_minutes} min</span></div><p className="text-xs mt-0.5" style={{ color: C.txS }}>{w.date}{w.notes ? ` · ${w.notes}` : ""}</p></div></div>)}</div>
    </div>
  );
}

function PFTTab({ state, setState }) {
  const { pft, user } = state; const days = daysUntil(PFT_DATE); const [show, setShow] = useState(false); const [form, setForm] = useState({ date: todayStr(), pullups: "", plank_m: "", plank_s: "", run_m: "", run_s: "" });
  async function save() { const ps = Number(form.plank_m) * 60 + Number(form.plank_s); const rs = Number(form.run_m) * 60 + Number(form.run_s); const d = await db.insertPFT({ date: form.date, pullups: Number(form.pullups), plank_s: ps, run_s: rs }); if (d) setState(s => ({ ...s, pft: [d, ...s.pft] })); setShow(false); }
  const latest = pft[0]; const ls = latest ? { p: sPU(latest.pullups, user.age), k: sPL(latest.plank_s, user.age), r: sRN(latest.run_s, user.age) } : null; const total = ls ? ls.p + ls.k + ls.r : 0; const bk = ["17-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51+"][bracket(user.age)];
  async function setAge(age) { await db.updateAge(user.settingsId, Number(age)); setState(s => ({ ...s, user: { ...s.user, age: Number(age) } })); }

  return (
    <div className="space-y-5">
      <Surface><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.txS }}>PFT · Jan – Jun · Female</p><div className="flex items-center gap-3 mb-1"><span className="text-xs font-semibold" style={{ color: C.txM }}>Age</span><input type="number" value={user.age} onChange={e => setAge(e.target.value)} className="text-sm font-bold w-14 rounded-lg px-2 py-1.5 outline-none text-center" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><span className="text-xs" style={{ color: C.txS }}>({bk})</span></div><p className="text-xs mt-1" style={{ color: C.txS }}>{days} days to test · Jun 15</p></div>{ls && <Stat value={total} label="/300" size="xl" color={total >= 240 ? "#059669" : total >= 180 ? C.ac : "#D97706"} />}</div></Surface>
      {ls && <Surface><ScoreBar label="Pull-ups" raw={`${latest.pullups} reps`} score={ls.p} /><ScoreBar label="Plank" raw={fmtTime(latest.plank_s)} score={ls.k} /><ScoreBar label="3-Mile Run" raw={fmtTime(latest.run_s)} score={ls.r} /></Surface>}
      <Btn onClick={() => setShow(!show)} full ghost><Plus size={16} /> Log PFT</Btn>
      {show && <Surface className="space-y-4"><Inp label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /><Inp label="Pull-ups" type="number" placeholder="e.g. 8" value={form.pullups} onChange={e => setForm({ ...form, pullups: e.target.value })} /><div><label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.txS }}>Plank (min : sec)</label><div className="grid grid-cols-2 gap-2"><Inp placeholder="min" type="number" value={form.plank_m} onChange={e => setForm({ ...form, plank_m: e.target.value })} /><Inp placeholder="sec" type="number" value={form.plank_s} onChange={e => setForm({ ...form, plank_s: e.target.value })} /></div></div><div><label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.txS }}>3-Mile Run (min : sec)</label><div className="grid grid-cols-2 gap-2"><Inp placeholder="min" type="number" value={form.run_m} onChange={e => setForm({ ...form, run_m: e.target.value })} /><Inp placeholder="sec" type="number" value={form.run_s} onChange={e => setForm({ ...form, run_s: e.target.value })} /></div></div><Btn onClick={save} full>Save</Btn></Surface>}
      {pft.length > 1 && <div><SectionLabel>History</SectionLabel><div className="space-y-1">{pft.map((e, i) => { const s = sPU(e.pullups, user.age) + sPL(e.plank_s, user.age) + sRN(e.run_s, user.age); const prev = pft[i + 1]; const d = prev ? s - (sPU(prev.pullups, user.age) + sPL(prev.plank_s, user.age) + sRN(prev.run_s, user.age)) : null; return <div key={e.id} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.bgSoft}` }}><div><p className="text-xs font-bold" style={{ color: C.txS }}>{e.date}</p><p className="text-sm mt-0.5" style={{ color: C.tx }}>{e.pullups} pull-ups · {fmtTime(e.plank_s)} plank · {fmtTime(e.run_s)} run</p></div><div className="text-right"><p className="text-xl font-extrabold" style={{ color: C.ac, fontFamily: C.fontH }}>{s}</p>{d !== null && <p className="text-xs font-bold" style={{ color: d >= 0 ? "#059669" : "#EF4444" }}>{d > 0 ? "+" : ""}{d}</p>}</div></div>; })}</div></div>}
    </div>
  );
}

function CFTTab({ state, setState }) {
  const { cft, user } = state; const days = daysUntil(CFT_DATE); const [show, setShow] = useState(false); const [form, setForm] = useState({ date: todayStr(), mtc_m: "", mtc_s: "", acl: "", manuf_m: "", manuf_s: "" });
  async function save() { const d = await db.insertCFT({ date: form.date, mtc_s: Number(form.mtc_m) * 60 + Number(form.mtc_s), acl: Number(form.acl), manuf_s: Number(form.manuf_m) * 60 + Number(form.manuf_s) }); if (d) setState(s => ({ ...s, cft: [d, ...s.cft] })); setShow(false); }
  const latest = cft[0]; const ls = latest ? { m: sMTC(latest.mtc_s, user.age), a: sACL(latest.acl, user.age), f: sMANUF(latest.manuf_s, user.age) } : null; const total = ls ? ls.m + ls.a + ls.f : 0;

  return (
    <div className="space-y-5">
      <Surface><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.txS }}>CFT · Jul – Dec · Female</p><p className="text-xs" style={{ color: C.txS }}>{days} days · Oct 15</p></div>{ls && <Stat value={total} label="/300" size="xl" />}</div>{ls && <div className="mt-5"><ScoreBar label="Movement to Contact" raw={fmtTime(latest.mtc_s)} score={ls.m} /><ScoreBar label="Ammo Can Lifts" raw={`${latest.acl} reps`} score={ls.a} /><ScoreBar label="Maneuver Under Fire" raw={fmtTime(latest.manuf_s)} score={ls.f} /></div>}{!ls && <p className="text-sm text-center py-6 mt-2" style={{ color: C.txS }}>No CFT entries yet</p>}</Surface>
      <Btn onClick={() => setShow(!show)} full ghost><Plus size={16} /> Log CFT</Btn>
      {show && <Surface className="space-y-4"><Inp label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /><div><label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.txS }}>MTC (min : sec)</label><div className="grid grid-cols-2 gap-2"><Inp placeholder="min" type="number" value={form.mtc_m} onChange={e => setForm({ ...form, mtc_m: e.target.value })} /><Inp placeholder="sec" type="number" value={form.mtc_s} onChange={e => setForm({ ...form, mtc_s: e.target.value })} /></div></div><Inp label="Ammo Can Lifts" type="number" value={form.acl} onChange={e => setForm({ ...form, acl: e.target.value })} /><div><label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.txS }}>MANUF (min : sec)</label><div className="grid grid-cols-2 gap-2"><Inp placeholder="min" type="number" value={form.manuf_m} onChange={e => setForm({ ...form, manuf_m: e.target.value })} /><Inp placeholder="sec" type="number" value={form.manuf_s} onChange={e => setForm({ ...form, manuf_s: e.target.value })} /></div></div><Btn onClick={save} full>Save</Btn></Surface>}
    </div>
  );
}

/* ═══════════ BOOKS ═══════════ */
function BooksView({ state, setState }) {
  const { books, bookCategories } = state; const [tab, setTab] = useState("to_read"); const [showAdd, setShowAdd] = useState(false); const [form, setForm] = useState({ title: "", author: "", categories: [], notes: "" }); const [filter, setFilter] = useState(null); const [newCat, setNewCat] = useState(""); const [showNewCat, setShowNewCat] = useState(false);
  const list = books.filter(b => b.status === tab); const filtered = filter ? list.filter(b => b.categories?.includes(filter)) : list;

  async function add() { if (!form.title.trim()) return; const d = await db.insertBook({ ...form, status: tab }); if (d) setState(s => ({ ...s, books: [d, ...s.books] })); setShowAdd(false); setForm({ title: "", author: "", categories: [], notes: "" }); }
  async function markRead(id) { await db.updateBook(id, { status: "read" }); setState(s => ({ ...s, books: s.books.map(b => b.id === id ? { ...b, status: "read" } : b) })); }
  async function markUnread(id) { await db.updateBook(id, { status: "to_read" }); setState(s => ({ ...s, books: s.books.map(b => b.id === id ? { ...b, status: "to_read" } : b) })); }
  async function del(id) { await db.deleteBook(id); setState(s => ({ ...s, books: s.books.filter(b => b.id !== id) })); }
  async function rate(id, r) { await db.updateBook(id, { rating: r }); setState(s => ({ ...s, books: s.books.map(b => b.id === id ? { ...b, rating: r } : b) })); }
  function togCat(c) { setForm(f => ({ ...f, categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c] })); }
  async function addBookCat() { const c = newCat.trim().toLowerCase(); if (!c || bookCategories.includes(c)) return; await db.addBookCategory(c); setState(s => ({ ...s, bookCategories: [...s.bookCategories, c] })); setNewCat(""); setShowNewCat(false); }

  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<BookOpen size={20} style={{ color: C.ac }} />}>Books</PageTitle>
      <TabBar tabs={[["to_read", `To Read (${books.filter(b => b.status === "to_read").length})`], ["read", `Read (${books.filter(b => b.status === "read").length})`]]} active={tab} onChange={k => { setTab(k); setFilter(null); }} />
      <div className="flex gap-2 flex-wrap"><Pill label="All" active={!filter} onClick={() => setFilter(null)} />{bookCategories.map(c => <Pill key={c} label={c} count={list.filter(b => b.categories?.includes(c)).length} active={filter === c} onClick={() => setFilter(filter === c ? null : c)} />)}<Pill label="+ Tag" dashed onClick={() => setShowNewCat(!showNewCat)} /></div>
      {showNewCat && <div className="flex gap-2"><input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addBookCat()} placeholder="Tag name…" autoFocus className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><Btn onClick={addBookCat} small>Add</Btn></div>}
      <Btn onClick={() => setShowAdd(!showAdd)} full ghost><Plus size={16} /> Add Book</Btn>
      {showAdd && <Surface className="space-y-4"><Inp label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><Inp label="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /><div><SectionLabel>Tags</SectionLabel><div className="flex flex-wrap gap-2">{bookCategories.map(c => <Pill key={c} label={c} active={form.categories.includes(c)} onClick={() => togCat(c)} />)}</div></div><Inp label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><Btn onClick={add} full>Save</Btn></Surface>}
      <div className="space-y-3">{filtered.length === 0 && <p className="text-sm text-center py-10" style={{ color: C.txS }}>{tab === "to_read" ? "Reading list is empty" : "No books read yet"}</p>}{filtered.map(b => <Surface key={b.id}><div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><p className="text-sm font-bold" style={{ color: C.tx }}>{b.title}</p>{b.author && <p className="text-xs mt-0.5" style={{ color: C.txM }}>{b.author}</p>}<div className="flex flex-wrap gap-1.5 mt-2">{(b.categories || []).map(c => <Chip key={c} label={c} cat={c} />)}</div>{b.notes && <p className="text-xs mt-2 italic" style={{ color: C.txS }}>{b.notes}</p>}{tab === "read" && <Stars rating={b.rating} onRate={r => rate(b.id, r)} />}</div><div className="flex flex-col gap-1.5 flex-shrink-0"><button onClick={() => tab === "to_read" ? markRead(b.id) : markUnread(b.id)} className="text-xs font-bold px-3 py-2 rounded-xl" style={{ backgroundColor: C.acSoft, color: C.ac }}>{tab === "to_read" ? "Read ✓" : "Unread"}</button><button onClick={() => del(b.id)} className="text-xs px-3 py-1 text-center" style={{ color: C.txS }}>Delete</button></div></div></Surface>)}</div>
    </div>
  );
}

/* ═══════════ CALENDAR ═══════════ */
function CalendarView() {
  const [curr, setCurr] = useState(new Date(2026, 3, 1)); const y = curr.getFullYear(), m = curr.getMonth(); const today = new Date(); const f = new Date(y, m, 1).getDay(), d = new Date(y, m + 1, 0).getDate(); const mn = curr.toLocaleDateString("en-US", { month: "long", year: "numeric" }); const cells = [...Array(f).fill(null), ...Array.from({ length: d }, (_, i) => i + 1)]; const isPFT = (x) => y === 2026 && m === 5 && x === 15; const isT = (x) => x === today.getDate() && m === today.getMonth() && y === today.getFullYear();
  return (
    <div className="space-y-5 fade-in"><PageTitle icon={<Calendar size={20} style={{ color: C.ac }} />}>Calendar</PageTitle><Surface><div className="flex items-center justify-between mb-5"><button onClick={() => setCurr(new Date(y, m - 1, 1))}><ChevronLeft size={20} style={{ color: C.txM }} /></button><p className="text-sm font-extrabold" style={{ color: C.tx, fontFamily: C.fontH }}>{mn}</p><button onClick={() => setCurr(new Date(y, m + 1, 1))}><ChevronRight size={20} style={{ color: C.txM }} /></button></div><div className="grid grid-cols-7 mb-2">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(x => <p key={x} className="text-center text-[11px] font-bold" style={{ color: C.txS }}>{x}</p>)}</div><div className="grid grid-cols-7 gap-y-1">{cells.map((x, i) => <div key={i} className="aspect-square flex items-center justify-center rounded-xl text-sm" style={!x ? {} : isT(x) ? { backgroundColor: C.ac, color: "#fff", fontWeight: 800 } : isPFT(x) ? { border: `2px solid ${C.ac}`, color: C.ac, fontWeight: 700 } : { color: C.txM }}>{x}</div>)}</div></Surface><div className="rounded-2xl p-6 text-center" style={{ backgroundColor: C.bgSoft }}><Calendar size={24} style={{ color: C.txS, margin: "0 auto 8px" }} /><p className="text-sm font-semibold" style={{ color: C.txM }}>Google Calendar coming soon</p></div></div>
  );
}

/* ═══════════ TRIPS ═══════════ */
function TripsView({ state, setState }) {
  const { trips, checklist } = state; const [sel, setSel] = useState(null); const [showAdd, setShowAdd] = useState(false); const [form, setForm] = useState({ destination: "", start_date: "", end_date: "", notes: "" }); const [tab, setTab] = useState("planning"); const [newItem, setNewItem] = useState("");
  const trip = sel ? trips.find(t => t.id === sel) : null;
  const planning = trip ? checklist.filter(c => c.trip_id === trip.id && c.list === "planning") : [];
  const packing = trip ? checklist.filter(c => c.trip_id === trip.id && c.list === "packing") : [];

  async function saveTrip() { if (!form.destination) return; const t = await db.insertTrip(form); if (!t) return; const c1 = await db.insertChecklistItem({ trip_id: t.id, title: "Flights booked", list: "planning" }); const c2 = await db.insertChecklistItem({ trip_id: t.id, title: "Accommodations booked", list: "planning" }); setState(s => ({ ...s, trips: [...s.trips, t], checklist: [...s.checklist, c1, c2].filter(Boolean) })); setShowAdd(false); setForm({ destination: "", start_date: "", end_date: "", notes: "" }); }
  async function addItem() { if (!newItem.trim() || !sel) return; const d = await db.insertChecklistItem({ trip_id: sel, title: newItem, list: tab }); if (d) setState(s => ({ ...s, checklist: [...s.checklist, d] })); setNewItem(""); }
  async function toggle(id) { const item = checklist.find(c => c.id === id); await db.updateChecklistItem(id, { completed: !item.completed }); setState(s => ({ ...s, checklist: s.checklist.map(c => c.id === id ? { ...c, completed: !c.completed } : c) })); }
  async function delItem(id) { await db.deleteChecklistItem(id); setState(s => ({ ...s, checklist: s.checklist.filter(c => c.id !== id) })); }
  async function updateF(f, v) { await db.updateTrip(sel, { [f]: v }); setState(s => ({ ...s, trips: s.trips.map(t => t.id === sel ? { ...t, [f]: v } : t) })); }

  if (trip) {
    const cl = tab === "planning" ? planning : packing; const dn = cl.filter(i => i.completed).length;
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center gap-3 pt-2"><button onClick={() => setSel(null)}><ChevronLeft size={20} style={{ color: C.txS }} /></button><div><h1 className="text-xl font-extrabold" style={{ fontFamily: C.fontH, color: C.tx }}>{tripEmoji(trip.destination)} {trip.destination}</h1><p className="text-xs mt-0.5" style={{ color: C.txS }}>{fmt(trip.start_date)} – {fmt(trip.end_date)} · {daysUntil(trip.start_date)}d away</p></div></div>
        <TabBar tabs={[["planning", `Planning (${planning.filter(p => !p.completed).length})`], ["packing", `Packing (${packing.filter(p => !p.completed).length})`]]} active={tab} onChange={setTab} />
        <Surface><div className="flex justify-between mb-3"><SectionLabel>{tab === "planning" ? "Checklist" : "Packing"}</SectionLabel><span className="text-xs font-bold" style={{ color: C.txS }}>{dn}/{cl.length}</span></div>{cl.length > 0 && <div className="mb-4"><Bar value={dn} max={cl.length} h={4} /></div>}<div className="space-y-3 mb-4">{cl.map(item => <div key={item.id} className="flex items-center gap-3"><Check on={item.completed} onClick={() => toggle(item.id)} /><span className="text-sm flex-1" style={{ color: item.completed ? C.txS : C.tx, textDecoration: item.completed ? "line-through" : "none" }}>{item.title}</span><button onClick={() => delItem(item.id)}><X size={14} style={{ color: C.txS }} /></button></div>)}</div><div className="flex gap-2"><input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder={`Add ${tab} item…`} className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none" style={{ backgroundColor: C.bgSoft, color: C.tx }} /><Btn onClick={addItem} small ghost>+</Btn></div></Surface>
        <Surface><SectionLabel>Activity Ideas</SectionLabel><textarea defaultValue={trip.activity_ideas} onBlur={e => updateF("activity_ideas", e.target.value)} rows={4} placeholder="Spots, restaurants…" className="w-full text-sm outline-none resize-none leading-relaxed" style={{ color: C.txM, backgroundColor: "transparent" }} /></Surface>
        <Surface><SectionLabel>Outfit Ideas</SectionLabel><textarea defaultValue={trip.outfit_ideas} onBlur={e => updateF("outfit_ideas", e.target.value)} rows={4} placeholder="What to wear…" className="w-full text-sm outline-none resize-none leading-relaxed" style={{ color: C.txM, backgroundColor: "transparent" }} /></Surface>
      </div>);
  }
  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between"><PageTitle icon={<Plane size={20} style={{ color: C.ac }} />}>Trips</PageTitle><Btn onClick={() => setShowAdd(!showAdd)} small ghost>New</Btn></div>
      {showAdd && <Surface className="space-y-4"><Inp label="Destination" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /><div className="grid grid-cols-2 gap-2"><Inp label="Depart" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /><Inp label="Return" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div><Btn onClick={saveTrip} full>Add Trip</Btn></Surface>}
      <div className="space-y-3">{trips.length === 0 && <p className="text-sm text-center py-10" style={{ color: C.txS }}>No trips yet</p>}{trips.map(t => { const its = checklist.filter(c => c.trip_id === t.id && c.list === "planning"); const dn = its.filter(i => i.completed).length; const d = daysUntil(t.start_date); return <Surface key={t.id} onClick={() => setSel(t.id)}><div className="flex items-start justify-between"><div><p className="text-lg font-bold" style={{ color: C.tx, fontFamily: C.fontH }}>{tripEmoji(t.destination)} {t.destination}</p><p className="text-xs mt-1" style={{ color: C.txS }}>{fmt(t.start_date)} – {fmt(t.end_date)}</p></div><Stat value={d} label="days" size="md" /></div>{its.length > 0 && <div className="mt-3"><Bar value={dn} max={its.length} h={4} /><p className="text-xs mt-1.5" style={{ color: C.txS }}>{dn}/{its.length} planned</p></div>}</Surface>; })}</div>
    </div>
  );
}

/* ═══════════ CLOTHING ═══════════ */
function ClothingView({ state, setState }) {
  const { clothing } = state; const [tab, setTab] = useState("outfit_idea"); const [showAdd, setShowAdd] = useState(false); const [form, setForm] = useState({ title: "", notes: "", price: "", url: "", deadline: "", photo: null }); const fileRef = useRef(null);
  function handleFile(file, cb) { if (!file) return; const r = new FileReader(); r.onload = e => cb(e.target.result); r.readAsDataURL(file); }
  async function add() { if (tab === "inspo" || !form.title.trim()) return; const d = await db.insertClothing({ type: tab, ...form, price: form.price ? Number(form.price) : null }); if (d) setState(s => ({ ...s, clothing: [d, ...s.clothing] })); setShowAdd(false); setForm({ title: "", notes: "", price: "", url: "", deadline: "", photo: null }); }
  async function markDone(id) { await db.updateClothing(id, { done: true }); setState(s => ({ ...s, clothing: s.clothing.map(c => c.id === id ? { ...c, done: true } : c) })); }
  async function del(id) { await db.deleteClothing(id); setState(s => ({ ...s, clothing: s.clothing.filter(c => c.id !== id) })); }
  const aL = { outfit_idea: "Archive", want_to_buy: "Bought ✓", need_to_return: "Returned ✓" };

  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<Shirt size={20} style={{ color: C.ac }} />}>Clothing</PageTitle>
      <TabBar tabs={[["outfit_idea", "Outfits"], ["want_to_buy", "Buy"], ["need_to_return", "Returns"], ["inspo", "Inspo"]]} active={tab} onChange={setTab} />
      {tab === "inspo" ? <InspoView state={state} setState={setState} /> : <>
        <Btn onClick={() => setShowAdd(!showAdd)} full ghost><Plus size={16} /> Add</Btn>
        {showAdd && <Surface className="space-y-4"><Inp label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><Inp label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />{tab === "want_to_buy" && <><Inp label="Price ($)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /><Inp label="Link" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></>}{tab === "need_to_return" && <Inp label="Deadline" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />}{tab === "outfit_idea" && <div><SectionLabel>Photo</SectionLabel><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0], d => setForm(f => ({ ...f, photo: d })))} />{form.photo ? <div className="relative"><img src={form.photo} alt="" className="rounded-xl max-h-48 w-full object-cover" /><button onClick={() => setForm(f => ({ ...f, photo: null }))} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"><X size={14} /></button></div> : <button onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: C.bgSoft, color: C.txM }}><Upload size={16} /> Upload</button>}</div>}<Btn onClick={add} full>Save</Btn></Surface>}
        <div className="space-y-3">{clothing.filter(c => c.type === tab && !c.done).length === 0 && <p className="text-sm text-center py-10" style={{ color: C.txS }}>Nothing here</p>}{clothing.filter(c => c.type === tab && !c.done).map(item => { const urg = item.deadline && daysUntil(item.deadline) <= 3; return <Surface key={item.id} accent={urg}><div className="flex gap-3">{item.photo && <img src={item.photo} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}<div className="flex-1 min-w-0"><p className="text-sm font-bold" style={{ color: C.tx }}>{item.title}</p>{item.notes && <p className="text-xs mt-0.5" style={{ color: C.txM }}>{item.notes}</p>}{item.price && <p className="text-xs mt-0.5 font-semibold" style={{ color: C.txS }}>~${item.price}</p>}{item.deadline && <p className="text-xs font-bold mt-1" style={{ color: urg ? "#EF4444" : "#D97706" }}>Due {fmt(item.deadline)} · {daysUntil(item.deadline)}d</p>}</div><div className="flex flex-col gap-1.5 flex-shrink-0"><button onClick={() => markDone(item.id)} className="text-xs font-bold px-3 py-2 rounded-xl" style={{ backgroundColor: C.acSoft, color: C.ac }}>{aL[tab]}</button><button onClick={() => del(item.id)} className="text-xs px-3 py-1 text-center" style={{ color: C.txS }}>Delete</button></div></div></Surface>; })}</div>
      </>}
    </div>
  );
}

/* ═══════════ INSPO ═══════════ */
const TAG_OPT = { season: ["spring", "summer", "fall", "winter"], weather: ["warm", "cool", "cold", "rainy"], fancy: ["casual", "smart casual", "business", "formal"] };
function InspoView({ state, setState }) {
  const { inspo } = state; const [showAdd, setShowAdd] = useState(false); const [photo, setPhoto] = useState(null); const [note, setNote] = useState(""); const [tags, setTags] = useState({ season: [], weather: [], fancy: [] }); const [filter, setFilter] = useState(null); const [viewing, setViewing] = useState(null); const fileRef = useRef(null);
  function handleFile(f) { if (!f) return; const r = new FileReader(); r.onload = e => setPhoto(e.target.result); r.readAsDataURL(f); }
  function togTag(c, v) { setTags(t => ({ ...t, [c]: t[c].includes(v) ? t[c].filter(x => x !== v) : [...t[c], v] })); }
  async function save() { if (!photo) return; const d = await db.insertInspo({ photo, note, ...tags }); if (d) setState(s => ({ ...s, inspo: [d, ...(s.inspo || [])] })); setPhoto(null); setNote(""); setTags({ season: [], weather: [], fancy: [] }); setShowAdd(false); }
  async function del(id) { await db.deleteInspo(id); setState(s => ({ ...s, inspo: s.inspo.filter(x => x.id !== id) })); setViewing(null); }
  const items = filter ? inspo.filter(i => i[filter.cat]?.includes(filter.val)) : inspo;

  return (
    <div className="space-y-5">
      <Btn onClick={() => setShowAdd(!showAdd)} full ghost><Upload size={16} /> Upload Inspo</Btn>
      {showAdd && <Surface className="space-y-4"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />{photo ? <div className="relative"><img src={photo} alt="" className="rounded-xl max-h-64 w-full object-cover" /><button onClick={() => setPhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"><X size={14} /></button></div> : <button onClick={() => fileRef.current?.click()} className="w-full py-14 rounded-xl text-sm font-semibold flex flex-col items-center gap-2" style={{ backgroundColor: C.bgSoft, color: C.txM }}><Upload size={20} />Tap to upload</button>}<Inp label="Note" value={note} onChange={e => setNote(e.target.value)} />{Object.entries(TAG_OPT).map(([cat, vals]) => <div key={cat}><SectionLabel>{cat}</SectionLabel><div className="flex flex-wrap gap-2">{vals.map(v => <Pill key={v} label={v} active={tags[cat].includes(v)} onClick={() => togTag(cat, v)} />)}</div></div>)}<Btn onClick={save} full disabled={!photo}>Save</Btn></Surface>}
      {inspo.length > 0 && <div className="flex flex-wrap gap-2"><Pill label="All" active={!filter} onClick={() => setFilter(null)} />{Object.entries(TAG_OPT).flatMap(([cat, vals]) => vals.map(v => { const n = inspo.filter(i => i[cat]?.includes(v)).length; if (!n) return null; return <Pill key={`${cat}-${v}`} label={`${v} ${n}`} active={filter?.cat === cat && filter?.val === v} onClick={() => setFilter(filter?.cat === cat && filter?.val === v ? null : { cat, val: v })} />; }))}</div>}
      {items.length === 0 ? <p className="text-sm text-center py-10" style={{ color: C.txS }}>No inspo yet</p> : <div className="grid grid-cols-2 gap-2">{items.map(item => <button key={item.id} onClick={() => setViewing(item)} className="relative aspect-[3/4] rounded-xl overflow-hidden"><img src={item.photo} alt="" className="w-full h-full object-cover" />{[...(item.season || []), ...(item.weather || []), ...(item.fancy || [])].length > 0 && <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent"><div className="flex flex-wrap gap-1">{[...(item.season || []), ...(item.weather || []), ...(item.fancy || [])].slice(0, 3).map((t, i) => <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 text-slate-800 capitalize">{t}</span>)}</div></div>}</button>)}</div>}
      {viewing && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}><div className="max-w-md w-full space-y-3" onClick={e => e.stopPropagation()}><img src={viewing.photo} alt="" className="w-full rounded-2xl" />{viewing.note && <p className="text-white text-sm">{viewing.note}</p>}<div className="flex flex-wrap gap-1.5">{[...(viewing.season || []), ...(viewing.weather || []), ...(viewing.fancy || [])].map((t, i) => <span key={i} className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white capitalize">{t}</span>)}</div><div className="flex gap-2"><button onClick={() => setViewing(null)} className="flex-1 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold">Close</button><button onClick={() => del(viewing.id)} className="py-2.5 px-4 rounded-xl bg-red-500 text-white text-sm font-bold">Delete</button></div></div></div>}
    </div>
  );
}

/* ═══════════ MAIN ═══════════ */
export default function App() {
  const [view, setView] = useState("today");
  const [fitSub, setFitSub] = useState("workouts");
  const [showMore, setShowMore] = useState(false);
  const [state, setState] = useState(EMPTY);
  const [themeKey, setThemeKey] = useState("calm");
  const [loading, setLoading] = useState(true);

  Object.assign(C, themes[themeKey]);

  useEffect(() => {
    db.loadAll().then(data => { setState(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function go(dest, sub) { setView(dest); if (sub) setFitSub(sub); setShowMore(false); }

  const NAV = [
    { id: "today", label: "Today", Icon: Home },
    { id: "tasks", label: "Tasks", Icon: CheckSquare },
    { id: "projects", label: "Projects", Icon: FolderKanban },
    { id: "fitness", label: "Fitness", Icon: Dumbbell },
    { id: "books", label: "Books", Icon: BookOpen },
    { id: "calendar", label: "Calendar", Icon: Calendar },
    { id: "trips", label: "Trips", Icon: Plane },
    { id: "clothing", label: "Clothing", Icon: Shirt },
  ];

  function renderView() {
    switch (view) {
      case "today": return <TodayView state={state} go={go} />;
      case "tasks": return <TasksView state={state} setState={setState} />;
      case "projects": return <ProjectsView state={state} setState={setState} />;
      case "fitness": return <FitnessView state={state} setState={setState} sub={fitSub} setSub={setFitSub} />;
      case "books": return <BooksView state={state} setState={setState} />;
      case "calendar": return <CalendarView />;
      case "trips": return <TripsView state={state} setState={setState} />;
      case "clothing": return <ClothingView state={state} setState={setState} />;
      default: return null;
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.bg }}>
      <div className="text-center"><div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: C.border, borderTopColor: C.ac }} /><p className="text-sm font-semibold" style={{ color: C.txM }}>Loading Life OS…</p></div>
    </div>
  );

  return (
    <>
      <FontStyles />
      <style>{`body,input,select,textarea,button{font-family:${C.fontB}}`}</style>
      <div style={{ backgroundColor: C.bg, minHeight: "100vh", fontFamily: C.fontB, color: C.tx }}>
        <div className="hidden md:flex h-screen overflow-hidden">
          <div className="w-[220px] flex flex-col py-6 px-3 flex-shrink-0" style={{ backgroundColor: C.side, borderRight: themeKey === "sharp" ? `1px solid ${C.border}` : "none" }}>
            <div className="px-3 mb-8"><p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: themeKey === "sharp" ? C.txS : "rgba(255,255,255,0.35)" }}>Life OS</p><p className="text-base font-extrabold mt-1" style={{ color: themeKey === "sharp" ? C.tx : "#fff", fontFamily: C.fontH }}>Command Center</p></div>
            <nav className="space-y-0.5 flex-1">{NAV.map(n => { const active = view === n.id; return <button key={n.id} onClick={() => go(n.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left" style={active ? { backgroundColor: C.sideAc, color: "#fff" } : { color: C.sideTxt, backgroundColor: "transparent" }}><n.Icon size={18} /><span>{n.label}</span></button>; })}</nav>
            <div className="px-2 pt-4" style={{ borderTop: `1px solid ${themeKey === "sharp" ? C.border : "rgba(255,255,255,0.08)"}` }}><div className="flex gap-1.5">{Object.entries(themes).map(([k, t]) => <button key={k} onClick={() => setThemeKey(k)} className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all" style={themeKey === k ? { backgroundColor: t.ac, color: "#fff" } : { backgroundColor: themeKey === "sharp" ? C.bgSoft : "rgba(255,255,255,0.06)", color: themeKey === "sharp" ? C.txM : "rgba(255,255,255,0.5)" }}>{t.name}</button>)}</div></div>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: C.bg }}><div className="max-w-2xl mx-auto px-8 py-6 pb-16">{renderView()}</div></div>
        </div>
        <div className="md:hidden min-h-screen flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2">{renderView()}</div>
          <div className="fixed bottom-0 left-0 right-0 z-40" style={{ backgroundColor: C.card, borderTop: `1px solid ${C.border}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="flex">{NAV.slice(0, 5).map(n => { const active = view === n.id; return <button key={n.id} onClick={() => go(n.id)} className="flex-1 flex flex-col items-center py-2.5 gap-1 relative">{active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full" style={{ backgroundColor: C.ac }} />}<n.Icon size={20} strokeWidth={active ? 2.5 : 1.5} style={{ color: active ? C.ac : C.txS }} /><span className="text-[10px] font-bold" style={{ color: active ? C.ac : C.txS }}>{n.label}</span></button>; })}<button onClick={() => setShowMore(true)} className="flex-1 flex flex-col items-center py-2.5 gap-1 relative">{["calendar", "trips", "clothing"].includes(view) && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full" style={{ backgroundColor: C.ac }} />}<MoreHorizontal size={20} strokeWidth={1.5} style={{ color: ["calendar", "trips", "clothing"].includes(view) ? C.ac : C.txS }} /><span className="text-[10px] font-bold" style={{ color: ["calendar", "trips", "clothing"].includes(view) ? C.ac : C.txS }}>More</span></button></div>
          </div>
          {showMore && <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowMore(false)}><div className="w-full rounded-t-3xl p-6 space-y-1 shadow-2xl" onClick={e => e.stopPropagation()} style={{ backgroundColor: C.card }}><div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: C.border }} />{[{ id: "calendar", label: "Calendar", Icon: Calendar }, { id: "trips", label: "Trips", Icon: Plane }, { id: "clothing", label: "Clothing", Icon: Shirt }].map(i => <button key={i.id} onClick={() => { go(i.id); setShowMore(false); }} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left" style={{ backgroundColor: view === i.id ? C.acSoft : "transparent" }}><i.Icon size={22} style={{ color: view === i.id ? C.ac : C.txM }} /><span className="text-base font-semibold" style={{ color: view === i.id ? C.ac : C.tx }}>{i.label}</span></button>)}<div className="pt-4 mt-3" style={{ borderTop: `1px solid ${C.border}` }}><p className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{ color: C.txS }}>Theme</p><div className="flex gap-2">{Object.entries(themes).map(([k, t]) => <button key={k} onClick={() => setThemeKey(k)} className="flex-1 py-3 rounded-xl text-xs font-bold transition-all" style={themeKey === k ? { backgroundColor: t.ac, color: "#fff" } : { backgroundColor: C.bgSoft, color: C.txM }}>{t.name}</button>)}</div></div></div></div>}
        </div>
      </div>
    </>
  );
}
