import { useState, useRef, useEffect } from "react";
import { Home, CheckSquare, FolderKanban, Dumbbell, BookOpen, Calendar, Plane, Shirt, Plus, X, ChevronLeft, ChevronRight, Upload, Tag, Check } from "lucide-react";
import * as db from "./db";

/* ═══════════ FONTS ═══════════ */
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{-webkit-font-smoothing:antialiased}
    input,textarea,select{font-size:16px !important}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
    .fade-in{animation:fadeIn .3s ease-out}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .check-flash{animation:checkFlash .55s ease-out forwards}
    @keyframes checkFlash{0%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(1.15)}70%{opacity:0.7;transform:scale(0.95)}100%{opacity:0;transform:scale(0.8)}}
    .task-complete{animation:taskSlide .5s ease-out forwards}
    @keyframes taskSlide{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(40px)}}
    .swipe-item{position:relative;overflow:hidden}
    .swipe-content{transition:transform 0.2s ease}
    .delete-bg{position:absolute;right:0;top:0;bottom:0;display:flex;align-items:center;padding:0 20px;background:#EF4444;color:white;font-weight:700;font-size:13px;border-radius:0 16px 16px 0}
  `}</style>
);

/* ═══════════ THEMES ═══════════ */
const themes = {
  calm: {
    name:"Calm", fontH:"'Plus Jakarta Sans',sans-serif", fontB:"'Plus Jakarta Sans',sans-serif",
    ac:"#0E7490", acSoft:"#CFFAFE",
    bg:"#F7F8FA", bgSoft:"#F1F5F9",
    side:"#0F172A", sideAc:"#0E7490", sideTxt:"rgba(255,255,255,0.5)",
    card:"#FFFFFF", border:"#E8ECF0",
    tx:"#0F172A", txM:"#64748B", txS:"#94A3B8",
  },
  editorial: {
    name:"Editorial", fontH:"'Playfair Display',serif", fontB:"'Source Sans 3',sans-serif",
    ac:"#9F3D1E", acSoft:"#FBE8E0",
    bg:"#F5EDE0", bgSoft:"#EDE2CE",
    side:"#3A2E27", sideAc:"#9F3D1E", sideTxt:"rgba(255,245,230,0.55)",
    card:"#FFFDFA", border:"#E8DDC9",
    tx:"#2A2019", txM:"#6B5D52", txS:"#A09082",
  },
  sharp: {
    name:"Sharp", fontH:"'Space Grotesk',sans-serif", fontB:"'Inter',sans-serif",
    ac:"#6366F1", acSoft:"#EEF2FF",
    bg:"#FAFAFA", bgSoft:"#F4F4F5",
    side:"#FAFAFA", sideAc:"#EEF2FF", sideTxt:"#71717A",
    card:"#FFFFFF", border:"#E4E4E7",
    tx:"#18181B", txM:"#52525B", txS:"#A1A1AA",
  },
};

const C = { ...themes.calm };

/* ═══════════ HELPERS ═══════════ */
const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const currentSeason = () => { const m = new Date().getMonth(); return m >= 6 ? "cft" : "pft"; };

function taskSort(a, b) { return a.priority - b.priority; }

/* ═══════════ PRIORITY SYMBOLS ═══════════ */
const PRIORITY_LABELS = {
  1: { symbol: "▲▲▲", label: "Critical", color: "#EF4444" },
  2: { symbol: "▲▲",  label: "Important", color: "#F59E0B" },
  3: { symbol: "▲",   label: "Nice to do", color: "#94A3B8" },
};
function PriorityBadge({ p, size = "sm" }) {
  const { symbol, color } = PRIORITY_LABELS[p] || PRIORITY_LABELS[2];
  return (
    <span style={{ color, fontSize: size === "sm" ? 11 : 13, fontWeight: 700, letterSpacing: -1 }}>{symbol}</span>
  );
}

/* ═══════════ TRIP EMOJIS ═══════════ */
const TRIP_EMOJI = ["✈️","🗺️","🏖️","🏔️","🌆","🌍","🚢","🏕️","🎡","🗼","🎭","🌅"];
function tripEmoji(dest) {
  const h = [...(dest||"")].reduce((a,c) => a + c.charCodeAt(0), 0);
  return TRIP_EMOJI[h % TRIP_EMOJI.length];
}

/* ═══════════ UI ATOMS ═══════════ */
const Surface = ({ children, className = "", onClick, style = {} }) => (
  <div onClick={onClick} className={`rounded-2xl p-5 ${className}`}
    style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, ...style }}>{children}</div>
);
const PageTitle = ({ children, icon }) => (
  <div className="flex items-center gap-2 mb-1 pt-5 pb-2">
    {icon}
    <h1 className="text-xl font-extrabold" style={{ color: C.tx, fontFamily: C.fontH }}>{children}</h1>
  </div>
);
const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3" style={{ color: C.txS }}>{children}</p>
);
const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
    style={active ? { backgroundColor: C.ac, color: "#fff" } : { backgroundColor: C.bgSoft, color: C.txM }}>
    {children}
  </button>
);
const Tabs = ({ options, active, onChange }) => (
  <div className="flex gap-2 mb-5 flex-wrap">
    {options.map(([v, label]) => <Pill key={v} active={active === v} onClick={() => onChange(v)}>{label}</Pill>)}
  </div>
);
function Input({ ...props }) {
  return <input {...props} style={{ backgroundColor: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", color: C.tx, outline: "none", width: "100%", ...props.style }} />;
}
function TextArea({ ...props }) {
  return <textarea {...props} style={{ backgroundColor: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", color: C.tx, outline: "none", width: "100%", resize: "none", ...props.style }} />;
}
function Btn({ children, onClick, variant = "primary", small, style = {} }) {
  const base = { borderRadius: 12, fontWeight: 700, cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...style };
  const variants = {
    primary: { backgroundColor: C.ac, color: "#fff", padding: small ? "8px 16px" : "12px 20px", fontSize: small ? 12 : 14 },
    ghost: { backgroundColor: C.bgSoft, color: C.txM, padding: small ? "8px 14px" : "11px 18px", fontSize: small ? 12 : 14 },
    danger: { backgroundColor: "#FEE2E2", color: "#DC2626", padding: small ? "8px 14px" : "11px 18px", fontSize: small ? 12 : 14 },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

/* ═══════════ SWIPE-TO-DELETE WRAPPER ═══════════ */
function SwipeToDelete({ onDelete, children }) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(null);
  const THRESHOLD = 80;

  function onTouchStart(e) { startX.current = e.touches[0].clientX; }
  function onTouchMove(e) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -THRESHOLD - 20));
  }
  function onTouchEnd() {
    if (offset < -THRESHOLD) {
      setOffset(-THRESHOLD);
    } else {
      setOffset(0);
    }
    startX.current = null;
  }

  return (
    <div className="swipe-item" style={{ borderRadius: 16 }}>
      <div className="delete-bg" style={{ borderRadius: "0 16px 16px 0" }} onClick={onDelete}>Delete</div>
      <div className="swipe-content" style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════ TODAY VIEW ═══════════ */
function TodayView({ state, go }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const { tasks, workouts, pft } = state;
  const topTasks = tasks.filter(t => t.status === "todo").sort(taskSort).slice(0, 3);
  const todayW = workouts.find(w => w.date === todayStr());
  const monthW = workouts.filter(w => { const d = new Date(w.date), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  const lastPFT = pft[0];
  const season = currentSeason();
  const seasonLabel = season === "pft" ? "PFT" : "CFT";
  const catName = (type) => state.workoutCats?.find(c => c.id === type)?.name || type;

  return (
    <div className="space-y-4 fade-in">
      <div className="pt-5 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.txS }}>{dateStr}</p>
        <h1 className="text-2xl font-extrabold mt-1" style={{ color: C.tx, fontFamily: C.fontH }}>Good morning</h1>
      </div>

      {topTasks.length > 0 && (
        <Surface>
          <SectionLabel>Top Tasks</SectionLabel>
          <div className="space-y-3">
            {topTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <PriorityBadge p={t.priority} />
                <p className="text-sm font-semibold flex-1" style={{ color: C.tx }}>{t.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.bgSoft, color: C.txS }}>{t.context}</span>
              </div>
            ))}
          </div>
          <button onClick={() => go("tasks")} className="mt-4 text-xs font-bold" style={{ color: C.ac }}>All tasks →</button>
        </Surface>
      )}

      <Surface onClick={() => go("fitness", "workouts")} style={{ cursor: "pointer" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: todayW ? "#ECFDF5" : C.bgSoft }}>
              <Dumbbell size={16} style={{ color: todayW ? "#059669" : C.txS }} />
            </div>
            {todayW
              ? <div><p className="text-sm font-bold" style={{ color: C.tx }}>{catName(todayW.type)} — {todayW.duration_minutes} min ✓</p><p className="text-xs" style={{ color: C.txS }}>{monthW} workouts this month</p></div>
              : <div><p className="text-sm font-semibold" style={{ color: C.txM }}>No workout yet today</p><p className="text-xs" style={{ color: C.txS }}>{monthW} this month</p></div>
            }
          </div>
          <ChevronRight size={16} style={{ color: C.txS }} />
        </div>
      </Surface>

      {lastPFT && (
        <Surface onClick={() => go("fitness", season === "pft" ? "pft" : "cft")} style={{ cursor: "pointer" }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.txS }}>{seasonLabel} · Last score</span>
              <p className="text-sm font-bold mt-0.5" style={{ color: C.tx }}>{lastPFT.score ?? "—"} pts</p>
            </div>
            <ChevronRight size={16} style={{ color: C.txS }} />
          </div>
        </Surface>
      )}
    </div>
  );
}

/* ═══════════ TASKS VIEW ═══════════ */
function TasksView({ state, setState }) {
  const { tasks, categories } = state;
  const [ctx, setCtx] = useState("all");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState(categories[0] || "home");
  const [priority, setPriority] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [showOpt, setShowOpt] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [completing, setCompleting] = useState(null);

  const active = tasks.filter(t => t.status === "todo" && (ctx === "all" || t.context === ctx)).sort(taskSort);
  const done = tasks.filter(t => t.status === "done");

  async function add() {
    if (!title.trim()) return;
    const d = await db.insertTask({ title, context, priority, due_date: dueDate || null, status: "todo" });
    if (d) setState(s => ({ ...s, tasks: [d, ...s.tasks] }));
    setTitle(""); setDueDate(""); setShowOpt(false);
  }

  function complete(id) {
    setCompleting(id);
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    setTimeout(async () => {
      await db.updateTask(id, { status: "done" });
      setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status: "done" } : t) }));
      setCompleting(null);
    }, 550);
  }

  async function del(id) {
    await db.deleteTask(id);
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  }

  async function addCat() {
    const name = newCat.trim();
    if (!name || categories.includes(name)) return;
    await db.addTaskCategory(name);
    setState(s => ({ ...s, categories: [...s.categories, name] }));
    setNewCat(""); setShowNewCat(false);
  }

  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<CheckSquare size={20} style={{ color: C.ac }} />}>Tasks</PageTitle>

      {/* Priority Legend */}
      <Surface style={{ padding: "12px 16px" }}>
        <SectionLabel>Priority Guide</SectionLabel>
        <div className="flex gap-4 flex-wrap">
          {[1, 2, 3].map(p => (
            <div key={p} className="flex items-center gap-2">
              <PriorityBadge p={p} />
              <span className="text-xs font-semibold" style={{ color: C.txM }}>{PRIORITY_LABELS[p].label}</span>
            </div>
          ))}
        </div>
      </Surface>

      {/* Add Task */}
      <Surface>
        <SectionLabel>New Task</SectionLabel>
        <div className="space-y-3">
          <Input placeholder="Task title…" value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()} />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs font-bold mb-1.5" style={{ color: C.txS }}>Priority</p>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className="flex-1 py-2 rounded-xl text-center transition-all"
                    style={priority === p ? { backgroundColor: C.ac, color: "#fff" } : { backgroundColor: C.bgSoft, color: C.txM }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: -1, color: priority === p ? "#fff" : PRIORITY_LABELS[p].color }}>
                      {PRIORITY_LABELS[p].symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[...categories, "+ new"].map(c => (
              <Pill key={c} active={c !== "+ new" && context === c}
                onClick={() => c === "+ new" ? setShowNewCat(true) : setContext(c)}>{c}</Pill>
            ))}
          </div>
          {showNewCat && (
            <div className="flex gap-2">
              <Input placeholder="New category…" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ flex: 1 }} />
              <Btn onClick={addCat} small>Add</Btn>
            </div>
          )}
          <button onClick={() => setShowOpt(!showOpt)} className="text-xs font-bold" style={{ color: C.ac }}>
            {showOpt ? "Hide options" : "+ Due date"}
          </button>
          {showOpt && <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />}
          <Btn onClick={add}><Plus size={16} />Add Task</Btn>
        </div>
      </Surface>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...categories].map(c => <Pill key={c} active={ctx === c} onClick={() => setCtx(c)}>{c === "all" ? "All" : c}</Pill>)}
      </div>

      {/* Active Tasks */}
      {active.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Active · sorted by priority</SectionLabel>
          {active.map(t => (
            <div key={t.id} className={completing === t.id ? "task-complete" : ""}>
              <Surface style={{ padding: "14px 16px" }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => complete(t.id)}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={completing === t.id
                      ? { borderColor: "#22C55E", backgroundColor: "#22C55E", animation: "checkFlash 0.55s ease-out" }
                      : { borderColor: C.border, backgroundColor: "transparent" }}>
                    {completing === t.id && <Check size={14} color="#fff" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.tx }}>{t.title}</p>
                    {t.due_date && <p className="text-xs mt-0.5" style={{ color: C.txS }}>Due {fmt(t.due_date)}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge p={t.priority} />
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.bgSoft, color: C.txS }}>{t.context}</span>
                    <button onClick={() => del(t.id)}><X size={14} style={{ color: C.txS }} /></button>
                  </div>
                </div>
              </Surface>
            </div>
          ))}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Completed ({done.length})</SectionLabel>
          {done.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center gap-3 px-1 py-2 opacity-50">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#22C55E" }}>
                <Check size={11} color="#fff" strokeWidth={3} />
              </div>
              <p className="text-sm line-through" style={{ color: C.txM }}>{t.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ PROJECTS VIEW ═══════════ */
function ProjectsView({ state, setState }) {
  const { projects, tasks } = state;
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [sel, setSel] = useState(null);
  async function add() { if (!name.trim()) return; const d = await db.insertProject({ name, description: desc, status: "active" }); if (d) setState(s => ({ ...s, projects: [d, ...s.projects] })); setName(""); setDesc(""); }
  async function del(id) { await db.deleteProject(id); setState(s => ({ ...s, projects: s.projects.filter(p => p.id !== id) })); }
  const proj = sel ? projects.find(p => p.id === sel) : null;
  const projTasks = proj ? tasks.filter(t => t.project_id === proj.id) : [];
  if (proj) return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center gap-3 pt-5 pb-2">
        <button onClick={() => setSel(null)}><ChevronLeft size={20} style={{ color: C.ac }} /></button>
        <h1 className="text-xl font-extrabold" style={{ color: C.tx, fontFamily: C.fontH }}>{proj.name}</h1>
      </div>
      {proj.description && <p className="text-sm" style={{ color: C.txM }}>{proj.description}</p>}
      <SectionLabel>Tasks</SectionLabel>
      {projTasks.length === 0 ? <p className="text-sm" style={{ color: C.txS }}>No tasks linked.</p>
        : projTasks.map(t => <div key={t.id} className="flex items-center gap-2 py-2"><PriorityBadge p={t.priority} /><p className="text-sm" style={{ color: C.tx }}>{t.title}</p></div>)}
    </div>
  );
  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<FolderKanban size={20} style={{ color: C.ac }} />}>Projects</PageTitle>
      <Surface>
        <SectionLabel>New Project</SectionLabel>
        <div className="space-y-3">
          <Input placeholder="Project name…" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <Btn onClick={add}><Plus size={16} />Add</Btn>
        </div>
      </Surface>
      <div className="space-y-2">
        {projects.map(p => (
          <Surface key={p.id} style={{ cursor: "pointer", padding: "14px 16px" }} onClick={() => setSel(p.id)}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-bold" style={{ color: C.tx }}>{p.name}</p>{p.description && <p className="text-xs mt-0.5" style={{ color: C.txS }}>{p.description}</p>}</div>
              <div className="flex items-center gap-2">
                <ChevronRight size={16} style={{ color: C.txS }} />
                <button onClick={e => { e.stopPropagation(); del(p.id); }}><X size={14} style={{ color: C.txS }} /></button>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ FITNESS VIEW ═══════════ */
function FitnessView({ state, setState, sub, setSub }) {
  const season = currentSeason();
  return (
    <div className="space-y-4 fade-in">
      <PageTitle icon={<Dumbbell size={20} style={{ color: C.ac }} />}>Fitness</PageTitle>
      <Tabs options={[["workouts","Workouts"],["pft",`PFT${season==="pft"?" ●":""}`],["cft",`CFT${season==="cft"?" ●":""}`]]} active={sub} onChange={setSub} />
      {sub === "workouts" ? <WorkoutsTab state={state} setState={setState} />
        : sub === "pft" ? <PFTTab state={state} setState={setState} />
        : <CFTTab state={state} setState={setState} />}
    </div>
  );
}

function WorkoutsTab({ state, setState }) {
  const { workouts, workoutCats } = state;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), type: workoutCats[0]?.id || "", duration_minutes: "", notes: "" });
  const catColor = (type) => workoutCats.find(c => c.id === type)?.color || C.ac;
  const catName = (type) => workoutCats.find(c => c.id === type)?.name || type;

  async function save() {
    if (!form.type || !form.duration_minutes) return;
    const d = await db.insertWorkout({ ...form, duration_minutes: Number(form.duration_minutes) });
    if (d) setState(s => ({ ...s, workouts: [d, ...s.workouts] }));
    setShow(false); setForm({ date: todayStr(), type: workoutCats[0]?.id || "", duration_minutes: "", notes: "" });
  }
  async function del(id) { await db.deleteWorkout(id); setState(s => ({ ...s, workouts: s.workouts.filter(w => w.id !== id) })); }

  const streak = (() => { const s = [...workouts].sort((a,b)=>b.date.localeCompare(a.date)); let c=0,p=null; for(const w of s){if(!p){c=1;p=w.date;continue;}if(Math.round((new Date(p)-new Date(w.date))/86400000)===1){c++;p=w.date;}else break;} return c; })();
  const mo = workouts.filter(w => { const d=new Date(w.date),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length;
  const dateMap = {}; workouts.forEach(w => { if (!dateMap[w.date]) dateMap[w.date] = w; });

  const heatmap = (() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const start = new Date(today); start.setDate(start.getDate()-12*7+1);
    while(start.getDay()!==1) start.setDate(start.getDate()-1);
    const grid=[]; let wk=[];
    for(let d=new Date(start);d<=today;d.setDate(d.getDate()+1)){
      const ds=d.toISOString().split("T")[0]; const w=dateMap[ds];
      wk.push({d:ds,has:!!w,color:w?catColor(w.type):"transparent",future:d>today});
      if(wk.length===7){grid.push(wk);wk=[];}
    }
    if(wk.length) grid.push(wk);
    return grid;
  })();

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Surface style={{flex:1,textAlign:"center",padding:"14px"}}><p className="text-2xl font-extrabold" style={{color:C.ac}}>{streak}</p><p className="text-xs mt-1" style={{color:C.txS}}>day streak</p></Surface>
        <Surface style={{flex:1,textAlign:"center",padding:"14px"}}><p className="text-2xl font-extrabold" style={{color:C.ac}}>{mo}</p><p className="text-xs mt-1" style={{color:C.txS}}>this month</p></Surface>
        <Surface style={{flex:1,textAlign:"center",padding:"14px"}}><p className="text-2xl font-extrabold" style={{color:C.ac}}>{workouts.length}</p><p className="text-xs mt-1" style={{color:C.txS}}>all time</p></Surface>
      </div>
      <Surface>
        <SectionLabel>Last 12 weeks</SectionLabel>
        <div className="flex gap-0.5 overflow-x-auto">
          {heatmap.map((wk,wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {wk.map(({d,has,color,future}) => (
                <div key={d} className="w-4 h-4 rounded-sm flex-shrink-0" title={d}
                  style={{backgroundColor:future?"transparent":has?color:C.bgSoft,border:future?"none":`1px solid ${C.border}`,opacity:future?0:1}} />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3 flex-wrap">
          {workoutCats.map(c => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:c.color}} />
              <span className="text-[10px] font-semibold" style={{color:C.txS}}>{c.name}</span>
            </div>
          ))}
        </div>
      </Surface>
      <Btn onClick={() => setShow(!show)}><Plus size={16} />{show ? "Cancel" : "Log Workout"}</Btn>
      {show && (
        <Surface>
          <div className="space-y-3">
            <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
              style={{backgroundColor:C.bgSoft,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.tx,width:"100%"}}>
              {workoutCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={e=>setForm(f=>({...f,duration_minutes:e.target.value}))} />
            <Input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            <Btn onClick={save}>Save</Btn>
          </div>
        </Surface>
      )}
      <div className="space-y-2">
        {workouts.slice(0,10).map(w => (
          <Surface key={w.id} style={{padding:"12px 16px"}}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full flex-shrink-0" style={{backgroundColor:catColor(w.type)}} />
              <div className="flex-1"><p className="text-sm font-bold" style={{color:C.tx}}>{catName(w.type)}</p><p className="text-xs" style={{color:C.txS}}>{fmt(w.date)} · {w.duration_minutes} min</p></div>
              <button onClick={()=>del(w.id)}><X size={14} style={{color:C.txS}} /></button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function PFTTab({ state, setState }) {
  const { pft, user } = state;
  const age = user?.age || 22;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), pullups: "", plank: "", run_time: "" });

  function scoreF(pu,plank,run){
    const puSc=Math.min(100,Math.round((Number(pu)/11)*100));
    const [pm,ps]=(plank||"").split(":").map(Number);
    const plankSecs=(pm||0)*60+(ps||0);
    const plankSc=Math.min(100,Math.round((plankSecs/127)*100));
    const [rm,rs]=(run||"").split(":").map(Number);
    const runSecs=(rm||0)*60+(rs||0);
    const runSc=Math.min(100,Math.max(0,Math.round(((1800-runSecs)/420)*100)));
    return Math.round((puSc+plankSc+runSc)/3);
  }

  async function save() {
    if(!form.pullups||!form.plank||!form.run_time) return;
    const score=scoreF(form.pullups,form.plank,form.run_time);
    const d=await db.insertPFT({...form,score,age_at_test:age});
    if(d) setState(s=>({...s,pft:[d,...s.pft]}));
    setShow(false); setForm({date:todayStr(),pullups:"",plank:"",run_time:""});
  }

  return (
    <div className="space-y-4">
      <Surface style={{backgroundColor:C.acSoft,border:"none"}}>
        <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{color:C.ac}}>Female · Jan–Jun</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xs" style={{color:C.txM}}>Pull-ups</p><p className="text-xs font-bold mt-0.5" style={{color:C.tx}}>Max 11</p></div>
          <div><p className="text-xs" style={{color:C.txM}}>Plank</p><p className="text-xs font-bold mt-0.5" style={{color:C.tx}}>2:07 = 100pts</p></div>
          <div><p className="text-xs" style={{color:C.txM}}>3-mi run</p><p className="text-xs font-bold mt-0.5" style={{color:C.tx}}>21:00 = 100pts</p></div>
        </div>
      </Surface>
      <Btn onClick={()=>setShow(!show)}><Plus size={16}/>{show?"Cancel":"Log PFT"}</Btn>
      {show&&<Surface><div className="space-y-3">
        <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        <Input type="number" placeholder="Pull-ups" value={form.pullups} onChange={e=>setForm(f=>({...f,pullups:e.target.value}))} />
        <Input placeholder="Plank (mm:ss)" value={form.plank} onChange={e=>setForm(f=>({...f,plank:e.target.value}))} />
        <Input placeholder="3-mile run (mm:ss)" value={form.run_time} onChange={e=>setForm(f=>({...f,run_time:e.target.value}))} />
        <Btn onClick={save}>Save</Btn>
      </div></Surface>}
      <div className="space-y-2">
        {pft.map(e=>(
          <Surface key={e.id} style={{padding:"12px 16px"}}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-bold" style={{color:C.tx}}>{e.score} pts</p><p className="text-xs mt-0.5" style={{color:C.txS}}>{fmt(e.date)} · {e.pullups} pu · {e.plank} plank · {e.run_time} run</p></div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function CFTTab({ state, setState }) {
  const { cft } = state;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), mvc: "", acl: "", muf: "" });

  async function save() {
    if(!form.mvc||!form.acl||!form.muf) return;
    const d=await db.insertCFT(form);
    if(d) setState(s=>({...s,cft:[d,...s.cft]}));
    setShow(false); setForm({date:todayStr(),mvc:"",acl:"",muf:""});
  }

  return (
    <div className="space-y-4">
      <Surface style={{backgroundColor:C.acSoft,border:"none"}}>
        <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{color:C.ac}}>Jul–Dec</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xs" style={{color:C.txM}}>MVC</p><p className="text-xs font-bold mt-0.5" style={{color:C.tx}}>Movement to Contact</p></div>
          <div><p className="text-xs" style={{color:C.txM}}>ACL</p><p className="text-xs font-bold mt-0.5" style={{color:C.tx}}>Ammo Can Lifts</p></div>
          <div><p className="text-xs" style={{color:C.txM}}>MUF</p><p className="text-xs font-bold mt-0.5" style={{color:C.tx}}>Maneuver Under Fire</p></div>
        </div>
      </Surface>
      <Btn onClick={()=>setShow(!show)}><Plus size={16}/>{show?"Cancel":"Log CFT"}</Btn>
      {show&&<Surface><div className="space-y-3">
        <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        <Input placeholder="MVC time (mm:ss)" value={form.mvc} onChange={e=>setForm(f=>({...f,mvc:e.target.value}))} />
        <Input type="number" placeholder="ACL reps" value={form.acl} onChange={e=>setForm(f=>({...f,acl:e.target.value}))} />
        <Input placeholder="MUF time (mm:ss)" value={form.muf} onChange={e=>setForm(f=>({...f,muf:e.target.value}))} />
        <Btn onClick={save}>Save</Btn>
      </div></Surface>}
      <div className="space-y-2">
        {cft.map(e=>(
          <Surface key={e.id} style={{padding:"12px 16px"}}>
            <p className="text-sm font-bold" style={{color:C.tx}}>{fmt(e.date)}</p>
            <p className="text-xs mt-0.5" style={{color:C.txS}}>MVC {e.mvc} · ACL {e.acl} · MUF {e.muf}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ BOOKS VIEW ═══════════ */
function BooksView({ state, setState }) {
  const { books, bookCategories } = state;
  const [tab, setTab] = useState("to_read");
  const [title, setTitle] = useState(""); const [author, setAuthor] = useState(""); const [selCats, setSelCats] = useState([]);
  const [newCat, setNewCat] = useState(""); const [showCat, setShowCat] = useState(false);
  const [rating, setRating] = useState(0); const [notes, setNotes] = useState("");

  const list = books.filter(b => b.status === tab);
  function toggleCat(c) { setSelCats(s => s.includes(c) ? s.filter(x=>x!==c) : [...s,c]); }

  async function add() {
    if(!title.trim()) return;
    const d = await db.insertBook({ title, author, status: tab, rating: tab==="read"?rating:null, categories: selCats, notes });
    if(d) setState(s=>({...s,books:[d,...s.books]}));
    setTitle(""); setAuthor(""); setSelCats([]); setRating(0); setNotes("");
  }
  async function markRead(id) { await db.updateBook(id,{status:"read"}); setState(s=>({...s,books:s.books.map(b=>b.id===id?{...b,status:"read"}:b)})); }
  async function markUnread(id) { await db.updateBook(id,{status:"to_read"}); setState(s=>({...s,books:s.books.map(b=>b.id===id?{...b,status:"to_read"}:b)})); }
  async function del(id) { await db.deleteBook(id); setState(s=>({...s,books:s.books.filter(b=>b.id!==id)})); }
  async function addCat() { const name=newCat.trim(); if(!name||bookCategories.includes(name)) return; await db.addBookCategory(name); setState(s=>({...s,bookCategories:[...s.bookCategories,name]})); setNewCat(""); setShowCat(false); }

  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<BookOpen size={20} style={{color:C.ac}}/>}>Books</PageTitle>
      <Tabs options={[["to_read","To Read"],["read","Read"]]} active={tab} onChange={setTab} />
      <Surface>
        <SectionLabel>Add Book</SectionLabel>
        <div className="space-y-3">
          <Input placeholder="Title…" value={title} onChange={e=>setTitle(e.target.value)} />
          <Input placeholder="Author (optional)" value={author} onChange={e=>setAuthor(e.target.value)} />
          {tab === "to_read" && (
            <>
              <div className="flex gap-2 flex-wrap">
                {bookCategories.map(c=><Pill key={c} active={selCats.includes(c)} onClick={()=>toggleCat(c)}>{c}</Pill>)}
                <button onClick={()=>setShowCat(true)} className="text-xs font-bold" style={{color:C.ac}}>+ tag</button>
              </div>
              {showCat&&<div className="flex gap-2"><Input placeholder="New tag…" value={newCat} onChange={e=>setNewCat(e.target.value)} style={{flex:1}}/><Btn onClick={addCat} small>Add</Btn></div>}
            </>
          )}
          {tab === "read" && (
            <>
              <div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRating(n)} className="text-xl">{n<=rating?"★":"☆"}</button>)}</div>
              <TextArea rows={2} placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
            </>
          )}
          <Btn onClick={add}><Plus size={16}/>Add</Btn>
        </div>
      </Surface>
      <div className="space-y-2">
        {list.map(b=>(
          <Surface key={b.id} style={{padding:"14px 16px"}}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{color:C.tx}}>{b.title}</p>
                {b.author&&<p className="text-xs mt-0.5" style={{color:C.txS}}>{b.author}</p>}
                {b.categories?.length>0&&<div className="flex gap-1 mt-2 flex-wrap">{b.categories.map(c=><span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:C.acSoft,color:C.ac}}>{c}</span>)}</div>}
                {b.rating&&<p className="text-sm mt-1">{"★".repeat(b.rating)}{"☆".repeat(5-b.rating)}</p>}
                {b.notes&&<p className="text-xs mt-1 italic" style={{color:C.txM}}>{b.notes}</p>}
              </div>
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                <button onClick={()=>del(b.id)}><X size={14} style={{color:C.txS}}/></button>
                <button onClick={()=>tab==="to_read"?markRead(b.id):markUnread(b.id)} className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{backgroundColor:C.acSoft,color:C.ac}}>{tab==="to_read"?"Mark Read":"Unread"}</button>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ CALENDAR VIEW ═══════════ */
function CalendarView() {
  const [curr, setCurr] = useState(new Date()); const y=curr.getFullYear(),m=curr.getMonth(); const today=new Date(); const f=new Date(y,m,1).getDay(),d=new Date(y,m+1,0).getDate(); const mn=curr.toLocaleDateString("en-US",{month:"long",year:"numeric"}); const cells=[...Array(f).fill(null),...Array.from({length:d},(_,i)=>i+1)];
  const isPFT=(x)=>{const now=new Date();return m===5&&x===15&&y===now.getFullYear();};
  const isT=(x)=>x===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<Calendar size={20} style={{color:C.ac}}/>}>Calendar</PageTitle>
      <Surface>
        <div className="flex items-center justify-between mb-5">
          <button onClick={()=>setCurr(new Date(y,m-1,1))}><ChevronLeft size={20} style={{color:C.txM}}/></button>
          <p className="text-sm font-extrabold" style={{color:C.tx,fontFamily:C.fontH}}>{mn}</p>
          <button onClick={()=>setCurr(new Date(y,m+1,1))}><ChevronRight size={20} style={{color:C.txM}}/></button>
        </div>
        <div className="grid grid-cols-7 mb-2">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(x=><p key={x} className="text-center text-[11px] font-bold" style={{color:C.txS}}>{x}</p>)}</div>
        <div className="grid grid-cols-7 gap-y-1">{cells.map((x,i)=><div key={i} className="aspect-square flex items-center justify-center rounded-xl text-sm" style={!x?{}:isT(x)?{backgroundColor:C.ac,color:"#fff",fontWeight:800}:isPFT(x)?{border:`2px solid ${C.ac}`,color:C.ac,fontWeight:700}:{color:C.txM}}>{x}</div>)}</div>
      </Surface>
      <div className="rounded-2xl p-6 text-center" style={{backgroundColor:C.bgSoft}}>
        <Calendar size={24} style={{color:C.txS,margin:"0 auto 8px"}}/>
        <p className="text-sm font-semibold" style={{color:C.txM}}>Google Calendar coming soon</p>
      </div>
    </div>
  );
}

/* ═══════════ TRIPS VIEW ═══════════ */
const DEFAULT_PACKING = ["Passport","Toiletries","Jewelry","Makeup","Underwear","Kindle","Chargers"];

function TripsView({ state, setState }) {
  const { trips, checklist } = state;
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ destination:"", start_date:"", end_date:"", notes:"" });
  const [tab, setTab] = useState("planning");
  const [newItem, setNewItem] = useState("");

  const trip = sel ? trips.find(t => t.id === sel) : null;
  const planning = trip ? checklist.filter(c => c.trip_id===trip.id && c.list==="planning") : [];
  const packing  = trip ? checklist.filter(c => c.trip_id===trip.id && c.list==="packing")  : [];

  async function saveTrip() {
    if(!form.destination) return;
    const id = Date.now();
    // planning defaults
    const planDefaults = [
      {id:id+1,trip_id:id,title:"Flights booked",completed:false,list:"planning"},
      {id:id+2,trip_id:id,title:"Accommodations booked",completed:false,list:"planning"},
    ];
    // packing defaults
    const packDefaults = DEFAULT_PACKING.map((title,i)=>({id:id+10+i,trip_id:id,title,completed:false,list:"packing"}));
    setState(s=>({...s,
      trips:[...s.trips,{...form,id,status:"planning"}],
      checklist:[...s.checklist,...planDefaults,...packDefaults]
    }));
    setShowAdd(false); setForm({destination:"",start_date:"",end_date:"",notes:""});
  }

  async function deleteTrip(id) {
    await db.deleteTrip(id);
    setState(s=>({...s,trips:s.trips.filter(t=>t.id!==id),checklist:s.checklist.filter(c=>c.trip_id!==id)}));
  }

  function addItem() {
    if(!newItem.trim()||!sel) return;
    const item = {id:Date.now(),trip_id:sel,title:newItem,completed:false,list:tab};
    setState(s=>({...s,checklist:[...s.checklist,item]}));
    setNewItem("");
  }
  function toggle(id) { setState(s=>({...s,checklist:s.checklist.map(c=>c.id===id?{...c,completed:!c.completed}:c)})); }
  function delItem(id) { setState(s=>({...s,checklist:s.checklist.filter(c=>c.id!==id)})); }

  // Trip detail view
  if (trip) {
    const cl = tab==="planning" ? planning : packing;
    const done = cl.filter(c=>c.completed).length;
    return (
      <div className="space-y-4 fade-in">
        <div className="flex items-center gap-3 pt-5 pb-2">
          <button onClick={()=>setSel(null)}><ChevronLeft size={20} style={{color:C.ac}}/></button>
          <h1 className="text-xl font-extrabold" style={{color:C.tx,fontFamily:C.fontH}}>{tripEmoji(trip.destination)} {trip.destination}</h1>
        </div>
        {(trip.start_date||trip.end_date)&&<p className="text-sm" style={{color:C.txM}}>{fmt(trip.start_date)} – {fmt(trip.end_date)}</p>}
        <Tabs options={[["planning","Planning"],["packing","Packing"]]} active={tab} onChange={setTab} />
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>{done}/{cl.length} complete</SectionLabel>
        </div>
        <div className="space-y-2">
          {cl.map(item=>(
            <Surface key={item.id} style={{padding:"12px 16px"}}>
              <div className="flex items-center gap-3">
                <button onClick={()=>toggle(item.id)} className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={item.completed?{borderColor:"#22C55E",backgroundColor:"#22C55E"}:{borderColor:C.border}}>
                  {item.completed&&<Check size={10} color="#fff" strokeWidth={3}/>}
                </button>
                <p className="flex-1 text-sm font-semibold" style={{color:item.completed?C.txS:C.tx,textDecoration:item.completed?"line-through":"none"}}>{item.title}</p>
                <button onClick={()=>delItem(item.id)}><X size={14} style={{color:C.txS}}/></button>
              </div>
            </Surface>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add item…" value={newItem} onChange={e=>setNewItem(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addItem()} style={{flex:1}} />
          <Btn onClick={addItem} small><Plus size={14}/></Btn>
        </div>
      </div>
    );
  }

  // Trip list
  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<Plane size={20} style={{color:C.ac}}/>}>Trips</PageTitle>
      <Btn onClick={()=>setShowAdd(!showAdd)}><Plus size={16}/>{showAdd?"Cancel":"New Trip"}</Btn>
      {showAdd&&(
        <Surface>
          <div className="space-y-3">
            <Input placeholder="Destination" value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} />
            <div className="flex gap-2">
              <Input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} style={{flex:1}} />
              <Input type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} style={{flex:1}} />
            </div>
            <TextArea rows={2} placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            <Btn onClick={saveTrip}>Save Trip</Btn>
          </div>
        </Surface>
      )}
      <div className="space-y-2">
        {trips.map(t=>{
          const cl=checklist.filter(c=>c.trip_id===t.id);
          const done=cl.filter(c=>c.completed).length;
          return (
            <SwipeToDelete key={t.id} onDelete={()=>deleteTrip(t.id)}>
              <Surface style={{cursor:"pointer"}} onClick={()=>setSel(t.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{color:C.tx}}>{tripEmoji(t.destination)} {t.destination}</p>
                    <p className="text-xs mt-0.5" style={{color:C.txS}}>{fmt(t.start_date)} – {fmt(t.end_date)}</p>
                    {cl.length>0&&<p className="text-xs mt-1 font-semibold" style={{color:C.ac}}>{done}/{cl.length} items</p>}
                  </div>
                  <ChevronRight size={16} style={{color:C.txS}}/>
                </div>
              </Surface>
            </SwipeToDelete>
          );
        })}
      </div>
      {trips.length===0&&<p className="text-sm text-center py-8" style={{color:C.txS}}>No trips yet. Add one above.</p>}
    </div>
  );
}

/* ═══════════ CLOTHING VIEW ═══════════ */
function ClothingView({ state, setState }) {
  const { clothing, inspo } = state;
  const [tab, setTab] = useState("wardrobe");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", category:"", color:"", notes:"", photo:"" });
  const fileRef = useRef();

  async function add() {
    if(!form.name.trim()) return;
    const d=await db.insertClothing(form);
    if(d) setState(s=>({...s,clothing:[d,...s.clothing]}));
    setForm({name:"",category:"",color:"",notes:"",photo:""}); setShowAdd(false);
  }
  async function del(id) { await db.deleteClothing(id); setState(s=>({...s,clothing:s.clothing.filter(c=>c.id!==id)})); }
  function handlePhoto(e) { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setForm(fm=>({...fm,photo:ev.target.result})); r.readAsDataURL(f); }

  async function addInspo(e) { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=async ev=>{ const d=await db.insertInspo({photo:ev.target.result,note:""}); if(d) setState(s=>({...s,inspo:[d,...s.inspo]})); }; r.readAsDataURL(f); }
  async function delInspo(id) { await db.deleteInspo(id); setState(s=>({...s,inspo:s.inspo.filter(i=>i.id!==id)})); }
  const inspoRef=useRef();

  return (
    <div className="space-y-5 fade-in">
      <PageTitle icon={<Shirt size={20} style={{color:C.ac}}/>}>Clothing</PageTitle>
      <Tabs options={[["wardrobe","Wardrobe"],["inspo","Inspo"]]} active={tab} onChange={setTab} />
      {tab==="wardrobe"&&(
        <>
          <Btn onClick={()=>setShowAdd(!showAdd)}><Plus size={16}/>{showAdd?"Cancel":"Add Item"}</Btn>
          {showAdd&&<Surface><div className="space-y-3">
            <Input placeholder="Item name…" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <Input placeholder="Category (e.g. tops, shoes)" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} />
            <Input placeholder="Color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} />
            <Input placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            {form.photo?<img src={form.photo} className="w-full h-40 object-cover rounded-xl"/>
              :<button onClick={()=>fileRef.current.click()} className="w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center gap-2" style={{borderColor:C.border,color:C.txS}}><Upload size={16}/>Add photo</button>}
            <Btn onClick={add}>Save</Btn>
          </div></Surface>}
          <div className="grid grid-cols-2 gap-3">
            {clothing.map(item=>(
              <Surface key={item.id} style={{padding:12}}>
                {item.photo&&<img src={item.photo} className="w-full h-28 object-cover rounded-xl mb-2"/>}
                <p className="text-sm font-bold truncate" style={{color:C.tx}}>{item.name}</p>
                {item.category&&<p className="text-xs" style={{color:C.txS}}>{item.category}</p>}
                {item.color&&<p className="text-xs" style={{color:C.txS}}>{item.color}</p>}
                <button onClick={()=>del(item.id)} className="mt-2"><X size={12} style={{color:C.txS}}/></button>
              </Surface>
            ))}
          </div>
        </>
      )}
      {tab==="inspo"&&(
        <>
          <input ref={inspoRef} type="file" accept="image/*" className="hidden" onChange={addInspo} />
          <Btn onClick={()=>inspoRef.current.click()}><Upload size={16}/>Upload Inspo</Btn>
          <div className="grid grid-cols-2 gap-3">
            {inspo.map(i=>(
              <div key={i.id} className="relative rounded-2xl overflow-hidden">
                <img src={i.photo} className="w-full h-40 object-cover"/>
                <button onClick={()=>delInspo(i.id)} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor:"rgba(0,0,0,0.5)"}}><X size={12} color="#fff"/></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════ MORE OVERLAY (mobile) ═══════════ */
function MoreOverlay({ go, close, themeKey, setThemeKey }) {
  const items = [
    { id:"calendar", label:"Calendar", icon:"⊡" },
    { id:"trips", label:"Trips", icon:"✈️" },
    { id:"clothing", label:"Clothing", icon:"◈" },
    { id:"books", label:"Books", icon:"◆" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={close}>
      <div className="w-full rounded-t-3xl p-6 space-y-1" style={{backgroundColor:C.card,paddingBottom:"env(safe-area-inset-bottom)"}} onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{backgroundColor:C.border}}/>
        {items.map(i=>(
          <button key={i.id} onClick={()=>{go(i.id);close();}} className="w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl text-left" style={{backgroundColor:"transparent"}}>
            <span className="text-2xl">{i.icon}</span>
            <span className="text-base font-semibold" style={{color:C.tx}}>{i.label}</span>
          </button>
        ))}
        <div className="pt-4 mt-2" style={{borderTop:`1px solid ${C.border}`}}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{color:C.txS}}>Theme</p>
          <div className="flex gap-2">
            {Object.entries(themes).map(([k,t])=>(
              <button key={k} onClick={()=>setThemeKey(k)} className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                style={themeKey===k?{backgroundColor:t.ac,color:"#fff"}:{backgroundColor:C.bgSoft,color:C.txM}}>{t.name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ MAIN APP ═══════════ */
export default function LifeOS() {
  const [view, setView] = useState("today");
  const [fitSub, setFitSub] = useState("workouts");
  const [showMore, setShowMore] = useState(false);
  const [state, setState] = useState(null);
  const [themeKey, setThemeKey] = useState("calm");
  const [loading, setLoading] = useState(true);

  Object.assign(C, themes[themeKey]);

  useEffect(() => {
    db.loadAll().then(data => { setState(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function go(dest, sub) { setView(dest); if(sub) setFitSub(sub); setShowMore(false); }

  const NAV = [
    { id:"today",   label:"Today",   Icon: Home },
    { id:"tasks",   label:"Tasks",   Icon: CheckSquare },
    { id:"projects",label:"Projects",Icon: FolderKanban },
    { id:"fitness", label:"Fitness", Icon: Dumbbell },
    { id:"books",   label:"Books",   Icon: BookOpen },
  ];

  function renderView() {
    if(!state) return null;
    switch(view) {
      case "today":    return <TodayView state={state} go={go} />;
      case "tasks":    return <TasksView state={state} setState={setState} />;
      case "projects": return <ProjectsView state={state} setState={setState} />;
      case "fitness":  return <FitnessView state={state} setState={setState} sub={fitSub} setSub={setFitSub} />;
      case "books":    return <BooksView state={state} setState={setState} />;
      case "calendar": return <CalendarView />;
      case "trips":    return <TripsView state={state} setState={setState} />;
      case "clothing": return <ClothingView state={state} setState={setState} />;
      default:         return null;
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{backgroundColor:C.bg}}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{borderColor:C.border,borderTopColor:C.ac}}/>
        <p className="text-sm font-semibold" style={{color:C.txM}}>Loading…</p>
      </div>
    </div>
  );

  return (
    <>
      <FontStyles/>
      <style>{`body,input,select,textarea,button{font-family:${C.fontB}}`}</style>
      <div style={{backgroundColor:C.bg,minHeight:"100vh",fontFamily:C.fontB,color:C.tx}}>

        {/* Desktop sidebar */}
        <div className="hidden md:flex h-screen overflow-hidden">
          <div className="w-[220px] flex flex-col py-6 px-3 flex-shrink-0"
            style={{backgroundColor:C.side,borderRight:themeKey==="sharp"?`1px solid ${C.border}`:"none"}}>
            <div className="px-3 mb-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
                style={{color:themeKey==="sharp"?C.txS:"rgba(255,255,255,0.35)"}}>Life OS</p>
              <p className="text-base font-extrabold mt-1"
                style={{color:themeKey==="sharp"?C.tx:"#fff",fontFamily:C.fontH}}>Command Center</p>
            </div>
            <nav className="space-y-0.5 flex-1">
              {[...NAV,{id:"calendar",label:"Calendar",Icon:Calendar},{id:"trips",label:"Trips",Icon:Plane},{id:"clothing",label:"Clothing",Icon:Shirt}].map(n=>{
                const active=view===n.id;
                return (
                  <button key={n.id} onClick={()=>go(n.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                    style={active?{backgroundColor:C.sideAc,color:"#fff"}:{color:C.sideTxt,backgroundColor:"transparent"}}>
                    <n.Icon size={18}/><span>{n.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="px-2 pt-4" style={{borderTop:`1px solid ${themeKey==="sharp"?C.border:"rgba(255,255,255,0.08)"}`}}>
              <div className="flex gap-1.5">
                {Object.entries(themes).map(([k,t])=>(
                  <button key={k} onClick={()=>setThemeKey(k)} className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
                    style={themeKey===k?{backgroundColor:t.ac,color:"#fff"}:{backgroundColor:themeKey==="sharp"?C.bgSoft:"rgba(255,255,255,0.06)",color:C.sideTxt}}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" style={{backgroundColor:C.bg}}>
            <div className="max-w-2xl mx-auto px-8 py-7 pb-16">{renderView()}</div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden min-h-screen flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pb-28">{renderView()}</div>
          <div className="fixed bottom-0 left-0 right-0 z-40"
            style={{backgroundColor:C.card,borderTop:`1px solid ${C.border}`,paddingBottom:"env(safe-area-inset-bottom)"}}>
            <div className="flex">
              {NAV.map(n=>{
                const active=view===n.id;
                return (
                  <button key={n.id} onClick={()=>go(n.id)}
                    className="flex-1 flex flex-col items-center py-3 gap-0.5">
                    <n.Icon size={20} style={{color:active?C.ac:C.txS}}/>
                    <span className="text-[10px] font-semibold" style={{color:active?C.ac:C.txS}}>{n.label}</span>
                  </button>
                );
              })}
              <button onClick={()=>setShowMore(true)} className="flex-1 flex flex-col items-center py-3 gap-0.5">
                <span className="text-lg leading-none" style={{color:["calendar","trips","clothing","books"].includes(view)?C.ac:C.txS}}>···</span>
                <span className="text-[10px] font-semibold" style={{color:["calendar","trips","clothing","books"].includes(view)?C.ac:C.txS}}>More</span>
              </button>
            </div>
          </div>
          {showMore&&<MoreOverlay go={go} close={()=>setShowMore(false)} themeKey={themeKey} setThemeKey={setThemeKey}/>}
        </div>
      </div>
    </>
  );
}
