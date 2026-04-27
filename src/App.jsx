import { useState, useRef, useEffect } from "react";
import { Home, CheckSquare, FolderKanban, Dumbbell, BookOpen, Calendar, Plane, Shirt, Plus, X, ChevronLeft, ChevronRight, Upload, Check } from "lucide-react";
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
    .task-complete{animation:taskSlide .5s ease-out forwards}
    @keyframes taskSlide{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(40px)}}
    .swipe-item{position:relative;overflow:hidden;border-radius:16px}
    .swipe-content{transition:transform 0.2s ease}
    .delete-reveal{position:absolute;right:0;top:0;bottom:0;display:flex;align-items:center;padding:0 20px;background:#EF4444;color:white;font-weight:700;font-size:13px;border-radius:0 16px 16px 0;cursor:pointer}
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
const fmt = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "";
const currentSeason = () => new Date().getMonth() >= 6 ? "cft" : "pft";

/* ═══════════ PRIORITY SYSTEM ═══════════ */
const PRIORITY = {
  1: { symbol:"▲▲▲", label:"Critical",   color:"#EF4444" },
  2: { symbol:"▲▲",  label:"Important",  color:"#F59E0B" },
  3: { symbol:"▲",   label:"Nice to do", color:"#94A3B8" },
};
function PriorityBadge({ p }) {
  const { symbol, color } = PRIORITY[p] || PRIORITY[2];
  return <span style={{ color, fontSize:11, fontWeight:700, letterSpacing:-1 }}>{symbol}</span>;
}
function taskSort(a, b) { return a.priority - b.priority; }

/* ═══════════ TRIP EMOJI ═══════════ */
const TRIP_EMOJI = ["✈️","🗺️","🏖️","🏔️","🌆","🌍","🚢","🏕️","🎡","🗼","🎭","🌅"];
function tripEmoji(dest) {
  const h = [...(dest||"")].reduce((a,c) => a + c.charCodeAt(0), 0);
  return TRIP_EMOJI[h % TRIP_EMOJI.length];
}

/* ═══════════ INSPO TAGS ═══════════ */
const TAG_OPTIONS = {
  season:  ["spring","summer","fall","winter"],
  weather: ["warm","cool","cold","rainy"],
  fancy:   ["casual","smart casual","business","formal"],
};

/* ═══════════ DEFAULT PACKING LIST ═══════════ */
const DEFAULT_PACKING = ["Passport","Toiletries","Jewelry","Makeup","Underwear","Kindle","Chargers"];

/* ═══════════ UI ATOMS ═══════════ */
const Surface = ({ children, onClick, style={} }) => (
  <div onClick={onClick} style={{ backgroundColor:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:16, cursor:onClick?"pointer":"default", ...style }}>
    {children}
  </div>
);
const PageTitle = ({ children, icon }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:20, paddingBottom:8 }}>
    {icon}
    <h1 style={{ color:C.tx, fontFamily:C.fontH, fontSize:20, fontWeight:800 }}>{children}</h1>
  </div>
);
const SectionLabel = ({ children }) => (
  <p style={{ color:C.txS, fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>{children}</p>
);
const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", backgroundColor:active?C.ac:C.bgSoft, color:active?"#fff":C.txM }}>{children}</button>
);
const Tabs = ({ options, active, onChange }) => (
  <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
    {options.map(([v,label]) => <Pill key={v} active={active===v} onClick={()=>onChange(v)}>{label}</Pill>)}
  </div>
);
function Input({ style={}, ...props }) {
  return <input {...props} style={{ backgroundColor:C.bgSoft, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", color:C.tx, outline:"none", width:"100%", fontFamily:C.fontB, ...style }} />;
}
function TextArea({ style={}, ...props }) {
  return <textarea {...props} style={{ backgroundColor:C.bgSoft, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", color:C.tx, outline:"none", width:"100%", resize:"none", fontFamily:C.fontB, ...style }} />;
}
function Btn({ children, onClick, variant="primary", small, style={} }) {
  const v = { primary:{backgroundColor:C.ac,color:"#fff"}, ghost:{backgroundColor:C.bgSoft,color:C.txM}, danger:{backgroundColor:"#FEE2E2",color:"#DC2626"} };
  return <button onClick={onClick} style={{ ...v[variant], padding:small?"8px 14px":"11px 20px", fontSize:small?12:14, fontWeight:700, borderRadius:12, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontFamily:C.fontB, ...style }}>{children}</button>;
}

/* ═══════════ SWIPE TO DELETE ═══════════ */
function SwipeToDelete({ onDelete, children }) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(null);
  const THRESHOLD = 80;
  const onTouchStart = e => { startX.current = e.touches[0].clientX; };
  const onTouchMove  = e => { if(startX.current===null) return; const dx=e.touches[0].clientX-startX.current; if(dx<0) setOffset(Math.max(dx,-(THRESHOLD+20))); };
  const onTouchEnd   = () => { setOffset(offset<-THRESHOLD?-THRESHOLD:0); startX.current=null; };
  return (
    <div className="swipe-item">
      <div className="delete-reveal" onClick={onDelete}>Delete</div>
      <div className="swipe-content" style={{ transform:`translateX(${offset}px)` }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>{children}</div>
    </div>
  );
}

/* ═══════════ TODAY VIEW ═══════════ */
function TodayView({ state, go }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const { tasks, workouts, pft } = state;
  const topTasks = tasks.filter(t=>t.status==="todo").sort(taskSort).slice(0,3);
  const todayW = workouts.find(w=>w.date===todayStr());
  const monthW = workouts.filter(w=>{ const d=new Date(w.date),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length;
  const lastPFT = pft[0];
  const season = currentSeason();
  const catName = type => state.workoutCats?.find(c=>c.id===type)?.name||type;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-in">
      <div style={{paddingTop:20,paddingBottom:8}}>
        <p style={{color:C.txS,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>{dateStr}</p>
        <h1 style={{color:C.tx,fontFamily:C.fontH,fontSize:24,fontWeight:800,marginTop:4}}>Good morning</h1>
      </div>

      {topTasks.length>0&&(
        <Surface>
          <SectionLabel>Top Tasks</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {topTasks.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <PriorityBadge p={t.priority}/>
                <p style={{color:C.tx,fontSize:13,fontWeight:600,flex:1}}>{t.title}</p>
                <span style={{backgroundColor:C.bgSoft,color:C.txS,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999}}>{t.context}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>go("tasks")} style={{color:C.ac,fontSize:12,fontWeight:700,marginTop:14,background:"none",border:"none",cursor:"pointer"}}>All tasks →</button>
        </Surface>
      )}

      <Surface onClick={()=>go("fitness","workouts")} style={{cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,backgroundColor:todayW?"#ECFDF5":C.bgSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Dumbbell size={16} style={{color:todayW?"#059669":C.txS}}/>
            </div>
            {todayW
              ?<div><p style={{color:C.tx,fontSize:13,fontWeight:700}}>{catName(todayW.type)} — {todayW.duration_minutes} min ✓</p><p style={{color:C.txS,fontSize:11}}>{monthW} workouts this month</p></div>
              :<div><p style={{color:C.txM,fontSize:13,fontWeight:600}}>No workout yet today</p><p style={{color:C.txS,fontSize:11}}>{monthW} this month</p></div>}
          </div>
          <ChevronRight size={16} style={{color:C.txS}}/>
        </div>
      </Surface>

      {lastPFT&&(
        <Surface onClick={()=>go("fitness",season==="pft"?"pft":"cft")} style={{cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{color:C.txS,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em"}}>{season.toUpperCase()} · Last score</p>
              <p style={{color:C.tx,fontSize:13,fontWeight:700,marginTop:2}}>{lastPFT.score??"—"} pts</p>
            </div>
            <ChevronRight size={16} style={{color:C.txS}}/>
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
  const [context, setContext] = useState(categories[0]||"home");
  const [priority, setPriority] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [showOpt, setShowOpt] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [completing, setCompleting] = useState(null);

  const active = tasks.filter(t=>t.status==="todo"&&(ctx==="all"||t.context===ctx)).sort(taskSort);
  const done = tasks.filter(t=>t.status==="done");

  async function add() {
    if(!title.trim()) return;
    const d=await db.insertTask({title,context,priority,due_date:dueDate||null,status:"todo"});
    if(d) setState(s=>({...s,tasks:[d,...s.tasks]}));
    setTitle(""); setDueDate(""); setShowOpt(false);
  }
  function complete(id) {
    setCompleting(id);
    if(navigator.vibrate) navigator.vibrate([30,20,50]);
    setTimeout(async()=>{ await db.updateTask(id,{status:"done"}); setState(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,status:"done"}:t)})); setCompleting(null); },550);
  }
  async function del(id) { await db.deleteTask(id); setState(s=>({...s,tasks:s.tasks.filter(t=>t.id!==id)})); }
  async function addCat() {
    const name=newCat.trim(); if(!name||categories.includes(name)) return;
    await db.addTaskCategory(name); setState(s=>({...s,categories:[...s.categories,name]})); setNewCat(""); setShowNewCat(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}} className="fade-in">
      <PageTitle icon={<CheckSquare size={20} style={{color:C.ac}}/>}>Tasks</PageTitle>

      {/* Priority Legend */}
      <Surface style={{padding:"12px 16px"}}>
        <SectionLabel>Priority Guide</SectionLabel>
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          {[1,2,3].map(p=>(
            <div key={p} style={{display:"flex",alignItems:"center",gap:8}}>
              <PriorityBadge p={p}/><span style={{color:C.txM,fontSize:12,fontWeight:600}}>{PRIORITY[p].label}</span>
            </div>
          ))}
        </div>
      </Surface>

      {/* New Task */}
      <Surface>
        <SectionLabel>New Task</SectionLabel>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Input placeholder="Task title…" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}/>
          <div>
            <p style={{color:C.txS,fontSize:11,fontWeight:700,marginBottom:8}}>Priority</p>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3].map(p=>(
                <button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,backgroundColor:priority===p?C.ac:C.bgSoft}}>
                  <span style={{fontSize:12,letterSpacing:-1,color:priority===p?"#fff":PRIORITY[p].color}}>{PRIORITY[p].symbol}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {categories.map(c=><Pill key={c} active={context===c} onClick={()=>setContext(c)}>{c}</Pill>)}
            <button onClick={()=>setShowNewCat(true)} style={{color:C.ac,fontSize:12,fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>+ category</button>
          </div>
          {showNewCat&&<div style={{display:"flex",gap:8}}><Input placeholder="New category…" value={newCat} onChange={e=>setNewCat(e.target.value)} style={{flex:1}}/><Btn onClick={addCat} small>Add</Btn></div>}
          <button onClick={()=>setShowOpt(!showOpt)} style={{color:C.ac,fontSize:12,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>{showOpt?"▲ hide options":"+ due date"}</button>
          {showOpt&&<Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>}
          <Btn onClick={add}><Plus size={16}/>Add Task</Btn>
        </div>
      </Surface>

      {/* Filter */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {["all",...categories].map(c=><Pill key={c} active={ctx===c} onClick={()=>setCtx(c)}>{c==="all"?"All":c}</Pill>)}
      </div>

      {/* Active */}
      {active.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <SectionLabel>Active · sorted by priority</SectionLabel>
          {active.map(t=>(
            <div key={t.id} className={completing===t.id?"task-complete":""}>
              <Surface style={{padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>complete(t.id)} style={{width:26,height:26,borderRadius:999,border:`2px solid ${completing===t.id?"#22C55E":C.border}`,backgroundColor:completing===t.id?"#22C55E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                    {completing===t.id&&<Check size={13} color="#fff" strokeWidth={3}/>}
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:C.tx,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</p>
                    {t.due_date&&<p style={{color:C.txS,fontSize:11,marginTop:2}}>Due {fmt(t.due_date)}</p>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <PriorityBadge p={t.priority}/>
                    <span style={{backgroundColor:C.bgSoft,color:C.txS,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999}}>{t.context}</span>
                    <button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={13} style={{color:C.txS}}/></button>
                  </div>
                </div>
              </Surface>
            </div>
          ))}
        </div>
      )}

      {/* Done */}
      {done.length>0&&(
        <div>
          <SectionLabel>Completed ({done.length})</SectionLabel>
          {done.slice(0,5).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",opacity:0.5}}>
              <div style={{width:18,height:18,borderRadius:999,backgroundColor:"#22C55E",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={10} color="#fff" strokeWidth={3}/></div>
              <p style={{color:C.txM,fontSize:13,textDecoration:"line-through"}}>{t.title}</p>
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
  const [name,setName]=useState(""); const [desc,setDesc]=useState(""); const [sel,setSel]=useState(null);
  async function add() { if(!name.trim()) return; const d=await db.insertProject({name,description:desc,status:"active"}); if(d) setState(s=>({...s,projects:[d,...s.projects]})); setName(""); setDesc(""); }
  async function del(id) { await db.deleteProject(id); setState(s=>({...s,projects:s.projects.filter(p=>p.id!==id)})); }
  const proj=sel?projects.find(p=>p.id===sel):null;
  const projTasks=proj?tasks.filter(t=>t.project_id===proj.id):[];
  if(proj) return (
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-in">
      <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:20,paddingBottom:8}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer"}}><ChevronLeft size={20} style={{color:C.ac}}/></button>
        <h1 style={{color:C.tx,fontFamily:C.fontH,fontSize:20,fontWeight:800}}>{proj.name}</h1>
      </div>
      {proj.description&&<p style={{color:C.txM,fontSize:13}}>{proj.description}</p>}
      <SectionLabel>Tasks</SectionLabel>
      {projTasks.length===0?<p style={{color:C.txS,fontSize:13}}>No tasks linked.</p>
        :projTasks.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}><PriorityBadge p={t.priority}/><p style={{color:C.tx,fontSize:13}}>{t.title}</p></div>)}
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}} className="fade-in">
      <PageTitle icon={<FolderKanban size={20} style={{color:C.ac}}/>}>Projects</PageTitle>
      <Surface>
        <SectionLabel>New Project</SectionLabel>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Input placeholder="Project name…" value={name} onChange={e=>setName(e.target.value)}/>
          <Input placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)}/>
          <Btn onClick={add}><Plus size={16}/>Add</Btn>
        </div>
      </Surface>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {projects.map(p=>(
          <Surface key={p.id} style={{padding:"13px 16px",cursor:"pointer"}} onClick={()=>setSel(p.id)}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><p style={{color:C.tx,fontSize:13,fontWeight:700}}>{p.name}</p>{p.description&&<p style={{color:C.txS,fontSize:11,marginTop:2}}>{p.description}</p>}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <ChevronRight size={16} style={{color:C.txS}}/>
                <button onClick={e=>{e.stopPropagation();del(p.id);}} style={{background:"none",border:"none",cursor:"pointer"}}><X size={13} style={{color:C.txS}}/></button>
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
    <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-in">
      <PageTitle icon={<Dumbbell size={20} style={{color:C.ac}}/>}>Fitness</PageTitle>
      <Tabs options={[["workouts","Workouts"],["pft",`PFT${season==="pft"?" ●":""}`],["cft",`CFT${season==="cft"?" ●":""}`]]} active={sub} onChange={setSub}/>
      {sub==="workouts"?<WorkoutsTab state={state} setState={setState}/>:sub==="pft"?<PFTTab state={state} setState={setState}/>:<CFTTab state={state} setState={setState}/>}
    </div>
  );
}

function WorkoutsTab({ state, setState }) {
  const { workouts, workoutCats } = state;
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({date:todayStr(),type:workoutCats[0]?.id||"",duration_minutes:"",notes:""});
  const catColor=type=>workoutCats.find(c=>c.id===type)?.color||C.ac;
  const catName=type=>workoutCats.find(c=>c.id===type)?.name||type;

  async function save() {
    if(!form.type||!form.duration_minutes) return;
    const d=await db.insertWorkout({...form,duration_minutes:Number(form.duration_minutes)});
    if(d) setState(s=>({...s,workouts:[d,...s.workouts]}));
    setShow(false); setForm({date:todayStr(),type:workoutCats[0]?.id||"",duration_minutes:"",notes:""});
  }
  async function del(id) { await db.deleteWorkout(id); setState(s=>({...s,workouts:s.workouts.filter(w=>w.id!==id)})); }

  const streak=(()=>{ const s=[...workouts].sort((a,b)=>b.date.localeCompare(a.date)); let c=0,p=null; for(const w of s){if(!p){c=1;p=w.date;continue;}if(Math.round((new Date(p)-new Date(w.date))/86400000)===1){c++;p=w.date;}else break;} return c; })();
  const mo=workouts.filter(w=>{const d=new Date(w.date),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).length;
  const dateMap={}; workouts.forEach(w=>{if(!dateMap[w.date])dateMap[w.date]=w;});

  const heatmap=(()=>{
    const today=new Date(); today.setHours(0,0,0,0);
    const start=new Date(today); start.setDate(start.getDate()-12*7+1);
    while(start.getDay()!==1) start.setDate(start.getDate()-1);
    const grid=[]; let wk=[];
    for(let d=new Date(start);d<=today;d.setDate(d.getDate()+1)){
      const ds=d.toISOString().split("T")[0]; const w=dateMap[ds];
      wk.push({d:ds,has:!!w,color:w?catColor(w.type):"transparent"});
      if(wk.length===7){grid.push(wk);wk=[];}
    }
    if(wk.length) grid.push(wk);
    return grid;
  })();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:10}}>
        {[{l:"day streak",v:streak},{l:"this month",v:mo},{l:"all time",v:workouts.length}].map(s=>(
          <Surface key={s.l} style={{flex:1,textAlign:"center",padding:14}}>
            <p style={{color:C.ac,fontSize:22,fontWeight:800}}>{s.v}</p>
            <p style={{color:C.txS,fontSize:11,marginTop:4}}>{s.l}</p>
          </Surface>
        ))}
      </div>
      <Surface>
        <SectionLabel>Last 12 weeks</SectionLabel>
        <div style={{display:"flex",gap:3,overflowX:"auto"}}>
          {heatmap.map((wk,wi)=>(
            <div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>
              {wk.map(({d,has,color})=>(
                <div key={d} style={{width:14,height:14,borderRadius:3,backgroundColor:has?color:C.bgSoft,border:`1px solid ${C.border}`,flexShrink:0}}/>
              ))}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:10}}>
          {workoutCats.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:10,height:10,borderRadius:2,backgroundColor:c.color}}/>
              <span style={{color:C.txS,fontSize:10,fontWeight:600}}>{c.name}</span>
            </div>
          ))}
        </div>
      </Surface>
      <Btn onClick={()=>setShow(!show)}><Plus size={16}/>{show?"Cancel":"Log Workout"}</Btn>
      {show&&<Surface><div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{backgroundColor:C.bgSoft,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.tx,width:"100%",fontSize:16}}>
          {workoutCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Input type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={e=>setForm(f=>({...f,duration_minutes:e.target.value}))}/>
        <Input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
        <Btn onClick={save}>Save</Btn>
      </div></Surface>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {workouts.slice(0,10).map(w=>(
          <Surface key={w.id} style={{padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:4,height:36,borderRadius:99,backgroundColor:catColor(w.type),flexShrink:0}}/>
              <div style={{flex:1}}><p style={{color:C.tx,fontSize:13,fontWeight:700}}>{catName(w.type)}</p><p style={{color:C.txS,fontSize:11}}>{fmt(w.date)} · {w.duration_minutes} min</p></div>
              <button onClick={()=>del(w.id)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={13} style={{color:C.txS}}/></button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function PFTTab({ state, setState }) {
  const { pft } = state;
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({date:todayStr(),pullups:"",plank:"",run_time:""});
  function score(pu,plank,run) {
    const puSc=Math.min(100,Math.round((Number(pu)/11)*100));
    const [pm,ps]=(plank||"").split(":").map(Number);
    const plankSc=Math.min(100,Math.round(((pm||0)*60+(ps||0))/127*100));
    const [rm,rs]=(run||"").split(":").map(Number);
    const runSc=Math.min(100,Math.max(0,Math.round(((1800-((rm||0)*60+(rs||0)))/420)*100)));
    return Math.round((puSc+plankSc+runSc)/3);
  }
  async function save() {
    if(!form.pullups||!form.plank||!form.run_time) return;
    const d=await db.insertPFT({...form,score:score(form.pullups,form.plank,form.run_time),age_at_test:22});
    if(d) setState(s=>({...s,pft:[d,...s.pft]}));
    setShow(false); setForm({date:todayStr(),pullups:"",plank:"",run_time:""});
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Surface style={{backgroundColor:C.acSoft,border:"none"}}>
        <p style={{color:C.ac,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>Female · Jan–Jun</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center"}}>
          <div><p style={{color:C.txM,fontSize:11}}>Pull-ups</p><p style={{color:C.tx,fontSize:11,fontWeight:700,marginTop:2}}>Max 11</p></div>
          <div><p style={{color:C.txM,fontSize:11}}>Plank</p><p style={{color:C.tx,fontSize:11,fontWeight:700,marginTop:2}}>2:07 = 100</p></div>
          <div><p style={{color:C.txM,fontSize:11}}>3-mi run</p><p style={{color:C.tx,fontSize:11,fontWeight:700,marginTop:2}}>21:00 = 100</p></div>
        </div>
      </Surface>
      <Btn onClick={()=>setShow(!show)}><Plus size={16}/>{show?"Cancel":"Log PFT"}</Btn>
      {show&&<Surface><div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        <Input type="number" placeholder="Pull-ups" value={form.pullups} onChange={e=>setForm(f=>({...f,pullups:e.target.value}))}/>
        <Input placeholder="Plank (mm:ss)" value={form.plank} onChange={e=>setForm(f=>({...f,plank:e.target.value}))}/>
        <Input placeholder="3-mile run (mm:ss)" value={form.run_time} onChange={e=>setForm(f=>({...f,run_time:e.target.value}))}/>
        <Btn onClick={save}>Save</Btn>
      </div></Surface>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {pft.map(e=>(
          <Surface key={e.id} style={{padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><p style={{color:C.tx,fontSize:13,fontWeight:700}}>{e.score} pts</p><p style={{color:C.txS,fontSize:11,marginTop:2}}>{fmt(e.date)}</p></div>
              <p style={{color:C.txM,fontSize:11}}>{e.pullups} pu · {e.plank} plank · {e.run_time} run</p>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function CFTTab({ state, setState }) {
  const { cft } = state;
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({date:todayStr(),mvc:"",acl:"",muf:""});
  async function save() {
    if(!form.mvc||!form.acl||!form.muf) return;
    const d=await db.insertCFT(form); if(d) setState(s=>({...s,cft:[d,...s.cft]}));
    setShow(false); setForm({date:todayStr(),mvc:"",acl:"",muf:""});
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Surface style={{backgroundColor:C.acSoft,border:"none"}}>
        <p style={{color:C.ac,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>Jul–Dec</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center"}}>
          <div><p style={{color:C.txM,fontSize:11}}>MVC</p><p style={{color:C.tx,fontSize:11,fontWeight:700,marginTop:2}}>Movement to Contact</p></div>
          <div><p style={{color:C.txM,fontSize:11}}>ACL</p><p style={{color:C.tx,fontSize:11,fontWeight:700,marginTop:2}}>Ammo Can Lifts</p></div>
          <div><p style={{color:C.txM,fontSize:11}}>MUF</p><p style={{color:C.tx,fontSize:11,fontWeight:700,marginTop:2}}>Maneuver Under Fire</p></div>
        </div>
      </Surface>
      <Btn onClick={()=>setShow(!show)}><Plus size={16}/>{show?"Cancel":"Log CFT"}</Btn>
      {show&&<Surface><div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        <Input placeholder="MVC time (mm:ss)" value={form.mvc} onChange={e=>setForm(f=>({...f,mvc:e.target.value}))}/>
        <Input type="number" placeholder="ACL reps" value={form.acl} onChange={e=>setForm(f=>({...f,acl:e.target.value}))}/>
        <Input placeholder="MUF time (mm:ss)" value={form.muf} onChange={e=>setForm(f=>({...f,muf:e.target.value}))}/>
        <Btn onClick={save}>Save</Btn>
      </div></Surface>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {cft.map(e=>(
          <Surface key={e.id} style={{padding:"12px 16px"}}>
            <p style={{color:C.tx,fontSize:13,fontWeight:700}}>{fmt(e.date)}</p>
            <p style={{color:C.txS,fontSize:11,marginTop:2}}>MVC {e.mvc} · ACL {e.acl} · MUF {e.muf}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ BOOKS VIEW ═══════════ */
function BooksView({ state, setState }) {
  const { books, bookCategories } = state;
  const [tab,setTab]=useState("to_read");
  const [title,setTitle]=useState(""); const [author,setAuthor]=useState(""); const [selCats,setSelCats]=useState([]);
  const [newCat,setNewCat]=useState(""); const [showCat,setShowCat]=useState(false);
  const [rating,setRating]=useState(0); const [notes,setNotes]=useState("");
  const list=books.filter(b=>b.status===tab);
  function toggleCat(c){setSelCats(s=>s.includes(c)?s.filter(x=>x!==c):[...s,c]);}
  async function add(){
    if(!title.trim()) return;
    const d=await db.insertBook({title,author,status:tab,rating:tab==="read"?rating:null,categories:selCats,notes});
    if(d) setState(s=>({...s,books:[d,...s.books]}));
    setTitle(""); setAuthor(""); setSelCats([]); setRating(0); setNotes("");
  }
  async function markRead(id){await db.updateBook(id,{status:"read"});setState(s=>({...s,books:s.books.map(b=>b.id===id?{...b,status:"read"}:b)}));}
  async function markUnread(id){await db.updateBook(id,{status:"to_read"});setState(s=>({...s,books:s.books.map(b=>b.id===id?{...b,status:"to_read"}:b)}));}
  async function del(id){await db.deleteBook(id);setState(s=>({...s,books:s.books.filter(b=>b.id!==id)}));}
  async function addCat(){
    const name=newCat.trim(); if(!name||bookCategories.includes(name)) return;
    await db.addBookCategory(name); setState(s=>({...s,bookCategories:[...s.bookCategories,name]})); setNewCat(""); setShowCat(false);
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}} className="fade-in">
      <PageTitle icon={<BookOpen size={20} style={{color:C.ac}}/>}>Books</PageTitle>
      <Tabs options={[["to_read","To Read"],["read","Read"]]} active={tab} onChange={setTab}/>
      <Surface>
        <SectionLabel>Add Book</SectionLabel>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Input placeholder="Title…" value={title} onChange={e=>setTitle(e.target.value)}/>
          <Input placeholder="Author (optional)" value={author} onChange={e=>setAuthor(e.target.value)}/>
          {tab==="to_read"&&<>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {bookCategories.map(c=><Pill key={c} active={selCats.includes(c)} onClick={()=>toggleCat(c)}>{c}</Pill>)}
              <button onClick={()=>setShowCat(true)} style={{color:C.ac,fontSize:12,fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>+ tag</button>
            </div>
            {showCat&&<div style={{display:"flex",gap:8}}><Input placeholder="New tag…" value={newCat} onChange={e=>setNewCat(e.target.value)} style={{flex:1}}/><Btn onClick={addCat} small>Add</Btn></div>}
          </>}
          {tab==="read"&&<>
            <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRating(n)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:n<=rating?"#F59E0B":"#CBD5E1"}}>{n<=rating?"★":"☆"}</button>)}</div>
            <TextArea rows={2} placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </>}
          <Btn onClick={add}><Plus size={16}/>Add</Btn>
        </div>
      </Surface>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {list.map(b=>(
          <Surface key={b.id} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:C.tx,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</p>
                {b.author&&<p style={{color:C.txS,fontSize:11,marginTop:2}}>{b.author}</p>}
                {b.categories?.length>0&&<div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>{b.categories.map(c=><span key={c} style={{backgroundColor:C.acSoft,color:C.ac,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999}}>{c}</span>)}</div>}
                {b.rating&&<p style={{fontSize:14,marginTop:4}}>{"★".repeat(b.rating)}<span style={{color:"#CBD5E1"}}>{"☆".repeat(5-b.rating)}</span></p>}
                {b.notes&&<p style={{color:C.txM,fontSize:11,marginTop:4,fontStyle:"italic"}}>{b.notes}</p>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end",flexShrink:0}}>
                <button onClick={()=>del(b.id)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={13} style={{color:C.txS}}/></button>
                <button onClick={()=>tab==="to_read"?markRead(b.id):markUnread(b.id)} style={{backgroundColor:C.acSoft,color:C.ac,fontSize:11,fontWeight:700,padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer"}}>{tab==="to_read"?"Mark Read":"Unread"}</button>
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
  const [curr,setCurr]=useState(new Date());
  const y=curr.getFullYear(),m=curr.getMonth(),today=new Date();
  const f=new Date(y,m,1).getDay(),d=new Date(y,m+1,0).getDate();
  const cells=[...Array(f).fill(null),...Array.from({length:d},(_,i)=>i+1)];
  const isT=x=>x===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}} className="fade-in">
      <PageTitle icon={<Calendar size={20} style={{color:C.ac}}/>}>Calendar</PageTitle>
      <Surface>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <button onClick={()=>setCurr(new Date(y,m-1,1))} style={{background:"none",border:"none",cursor:"pointer"}}><ChevronLeft size={20} style={{color:C.txM}}/></button>
          <p style={{color:C.tx,fontFamily:C.fontH,fontSize:14,fontWeight:800}}>{curr.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</p>
          <button onClick={()=>setCurr(new Date(y,m+1,1))} style={{background:"none",border:"none",cursor:"pointer"}}><ChevronRight size={20} style={{color:C.txM}}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:8}}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(x=><p key={x} style={{textAlign:"center",color:C.txS,fontSize:11,fontWeight:700}}>{x}</p>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px 0"}}>
          {cells.map((x,i)=>(
            <div key={i} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,fontSize:13,backgroundColor:x&&isT(x)?C.ac:"transparent",color:x&&isT(x)?"#fff":x?C.txM:"transparent",fontWeight:x&&isT(x)?800:400}}>{x||""}</div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

/* ═══════════ TRIPS VIEW ═══════════ */
function TripsView({ state, setState }) {
  const { trips, checklist } = state;
  const [sel,setSel]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({destination:"",start_date:"",end_date:"",notes:""});
  const [tab,setTab]=useState("planning");
  const [newItem,setNewItem]=useState("");

  const trip=sel?trips.find(t=>t.id===sel):null;
  const planning=trip?checklist.filter(c=>c.trip_id===trip.id&&c.list==="planning"):[];
  const packing=trip?checklist.filter(c=>c.trip_id===trip.id&&c.list==="packing"):[];

  async function saveTrip(){
    if(!form.destination) return;
    const id=Date.now();
    const planDefaults=[
      {id:id+1,trip_id:id,title:"Flights booked",completed:false,list:"planning"},
      {id:id+2,trip_id:id,title:"Accommodations booked",completed:false,list:"planning"},
    ];
    const packDefaults=DEFAULT_PACKING.map((title,i)=>({id:id+10+i,trip_id:id,title,completed:false,list:"packing"}));
    setState(s=>({...s,trips:[...s.trips,{...form,id,status:"planning",activity_ideas:"",outfit_ideas:""}],checklist:[...s.checklist,...planDefaults,...packDefaults]}));
    setShowAdd(false); setForm({destination:"",start_date:"",end_date:"",notes:""});
  }
  async function deleteTrip(id){
    await db.deleteTrip(id);
    setState(s=>({...s,trips:s.trips.filter(t=>t.id!==id),checklist:s.checklist.filter(c=>c.trip_id!==id)}));
  }
  function updateTripField(field,value){setState(s=>({...s,trips:s.trips.map(t=>t.id===sel?{...t,[field]:value}:t)}));}
  function addItem(){if(!newItem.trim()||!sel)return;setState(s=>({...s,checklist:[...s.checklist,{id:Date.now(),trip_id:sel,title:newItem,completed:false,list:tab}]}));setNewItem("");}
  function toggle(id){setState(s=>({...s,checklist:s.checklist.map(c=>c.id===id?{...c,completed:!c.completed}:c)}));}
  function delItem(id){setState(s=>({...s,checklist:s.checklist.filter(c=>c.id!==id)}));}

  if(trip){
    const cl=tab==="planning"?planning:packing;
    const done=cl.filter(c=>c.completed).length;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}} className="fade-in">
        <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:20,paddingBottom:8}}>
          <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer"}}><ChevronLeft size={20} style={{color:C.ac}}/></button>
          <h1 style={{color:C.tx,fontFamily:C.fontH,fontSize:20,fontWeight:800}}>{tripEmoji(trip.destination)} {trip.destination}</h1>
        </div>
        {(trip.start_date||trip.end_date)&&<p style={{color:C.txM,fontSize:13}}>{fmt(trip.start_date)} – {fmt(trip.end_date)}</p>}

        <Tabs options={[["planning","Planning"],["packing","Packing"]]} active={tab} onChange={setTab}/>

        {/* Activity & Outfit ideas — Planning tab only */}
        {tab==="planning"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <p style={{color:C.txS,fontSize:11,fontWeight:700,marginBottom:6}}>Activity Ideas</p>
              <TextArea rows={3} placeholder="Things to do, see, eat…" value={trip.activity_ideas||""} onChange={e=>updateTripField("activity_ideas",e.target.value)}/>
            </div>
            <div>
              <p style={{color:C.txS,fontSize:11,fontWeight:700,marginBottom:6}}>Outfit Ideas</p>
              <TextArea rows={3} placeholder="What to wear, vibes, occasions…" value={trip.outfit_ideas||""} onChange={e=>updateTripField("outfit_ideas",e.target.value)}/>
            </div>
          </div>
        )}

        <SectionLabel>{done}/{cl.length} complete</SectionLabel>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {cl.map(item=>(
            <Surface key={item.id} style={{padding:"12px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>toggle(item.id)} style={{width:22,height:22,borderRadius:999,border:`2px solid ${item.completed?"#22C55E":C.border}`,backgroundColor:item.completed?"#22C55E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  {item.completed&&<Check size={11} color="#fff" strokeWidth={3}/>}
                </button>
                <p style={{flex:1,fontSize:13,fontWeight:600,color:item.completed?C.txS:C.tx,textDecoration:item.completed?"line-through":"none"}}>{item.title}</p>
                <button onClick={()=>delItem(item.id)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={13} style={{color:C.txS}}/></button>
              </div>
            </Surface>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <Input placeholder="Add item…" value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} style={{flex:1}}/>
          <Btn onClick={addItem} small><Plus size={14}/></Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}} className="fade-in">
      <PageTitle icon={<Plane size={20} style={{color:C.ac}}/>}>Trips</PageTitle>
      <Btn onClick={()=>setShowAdd(!showAdd)}><Plus size={16}/>{showAdd?"Cancel":"New Trip"}</Btn>
      {showAdd&&<Surface><div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Input placeholder="Destination" value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))}/>
        <div style={{display:"flex",gap:8}}>
          <Input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} style={{flex:1}}/>
          <Input type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} style={{flex:1}}/>
        </div>
        <TextArea rows={2} placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
        <Btn onClick={saveTrip}>Save Trip</Btn>
      </div></Surface>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {trips.map(t=>{
          const cl=checklist.filter(c=>c.trip_id===t.id);
          const done=cl.filter(c=>c.completed).length;
          return (
            <SwipeToDelete key={t.id} onDelete={()=>deleteTrip(t.id)}>
              <Surface style={{cursor:"pointer"}} onClick={()=>setSel(t.id)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{color:C.tx,fontSize:13,fontWeight:700}}>{tripEmoji(t.destination)} {t.destination}</p>
                    <p style={{color:C.txS,fontSize:11,marginTop:2}}>{fmt(t.start_date)} – {fmt(t.end_date)}</p>
                    {cl.length>0&&<p style={{color:C.ac,fontSize:11,fontWeight:700,marginTop:4}}>{done}/{cl.length} items</p>}
                  </div>
                  <ChevronRight size={16} style={{color:C.txS}}/>
                </div>
              </Surface>
            </SwipeToDelete>
          );
        })}
      </div>
      {trips.length===0&&<p style={{color:C.txS,fontSize:13,textAlign:"center",padding:"32px 0"}}>No trips yet. Add one above.</p>}
    </div>
  );
}

/* ═══════════ CLOTHING — WARDROBE TAB ═══════════ */
function WardrobeTab({ state, setState }) {
  const { clothing } = state;
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",category:"",color:"",notes:"",photo:""});
  const fileRef=useRef();
  async function add(){if(!form.name.trim())return;const d=await db.insertClothing(form);if(d)setState(s=>({...s,clothing:[d,...s.clothing]}));setForm({name:"",category:"",color:"",notes:"",photo:""});setShowAdd(false);}
  async function del(id){await db.deleteClothing(id);setState(s=>({...s,clothing:s.clothing.filter(c=>c.id!==id)}));}
  function handlePhoto(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setForm(fm=>({...fm,photo:ev.target.result}));r.readAsDataURL(f);}
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Btn onClick={()=>setShowAdd(!showAdd)}><Plus size={16}/>{showAdd?"Cancel":"Add Item"}</Btn>
      {showAdd&&<Surface><div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Input placeholder="Item name…" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
        <Input placeholder="Category (tops, shoes, etc.)" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}/>
        <Input placeholder="Color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))}/>
        <Input placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
        {form.photo?<img src={form.photo} style={{width:"100%",height:160,objectFit:"cover",borderRadius:12}}/>
          :<button onClick={()=>fileRef.current.click()} style={{width:"100%",height:96,borderRadius:12,border:`2px dashed ${C.border}`,backgroundColor:"transparent",color:C.txS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:13}}><Upload size={16}/> Add photo</button>}
        <Btn onClick={add}>Save</Btn>
      </div></Surface>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {clothing.map(item=>(
          <Surface key={item.id} style={{padding:12}}>
            {item.photo&&<img src={item.photo} style={{width:"100%",height:112,objectFit:"cover",borderRadius:10,marginBottom:8}}/>}
            <p style={{color:C.tx,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</p>
            {item.category&&<p style={{color:C.txS,fontSize:11,marginTop:2}}>{item.category}</p>}
            {item.color&&<p style={{color:C.txS,fontSize:11}}>{item.color}</p>}
            <button onClick={()=>del(item.id)} style={{background:"none",border:"none",cursor:"pointer",marginTop:8}}><X size={12} style={{color:C.txS}}/></button>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ CLOTHING — INSPO TAB ═══════════ */
function InspoTab({ state, setState }) {
  const { inspo } = state;
  const [showAdd,setShowAdd]=useState(false);
  const [photo,setPhoto]=useState(null);
  const [note,setNote]=useState("");
  const [tags,setTags]=useState({season:[],weather:[],fancy:[]});
  const [filter,setFilter]=useState(null);
  const [viewing,setViewing]=useState(null);
  const fileRef=useRef();

  function handleFile(f){if(!f)return;const r=new FileReader();r.onload=e=>setPhoto(e.target.result);r.readAsDataURL(f);}
  function togTag(cat,val){setTags(t=>({...t,[cat]:t[cat].includes(val)?t[cat].filter(x=>x!==val):[...t[cat],val]}));}
  async function save(){
    if(!photo) return;
    const d=await db.insertInspo({photo,note,...tags});
    const item=d||{id:Date.now(),photo,note,...tags};
    setState(s=>({...s,inspo:[item,...s.inspo]}));
    setPhoto(null); setNote(""); setTags({season:[],weather:[],fancy:[]}); setShowAdd(false);
  }
  async function del(id){
    await db.deleteInspo(id);
    setState(s=>({...s,inspo:s.inspo.filter(x=>x.id!==id)}));
    setViewing(null);
  }
  const filtered=filter?inspo.filter(i=>i[filter.cat]?.includes(filter.val)):inspo;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Filter strip */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.entries(TAG_OPTIONS).map(([cat,vals])=>(
          <div key={cat} style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{color:C.txS,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",width:52,flexShrink:0}}>{cat}</span>
            {vals.map(v=>(
              <Pill key={v} active={filter?.cat===cat&&filter?.val===v} onClick={()=>setFilter(filter?.cat===cat&&filter?.val===v?null:{cat,val:v})}>{v}</Pill>
            ))}
          </div>
        ))}
      </div>

      <Btn onClick={()=>setShowAdd(!showAdd)}><Upload size={16}/>{showAdd?"Cancel":"Upload Inspo"}</Btn>

      {showAdd&&<Surface><div style={{display:"flex",flexDirection:"column",gap:10}}>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        {photo?<img src={photo} style={{width:"100%",height:180,objectFit:"cover",borderRadius:12}}/>
          :<button onClick={()=>fileRef.current.click()} style={{width:"100%",height:120,borderRadius:12,border:`2px dashed ${C.border}`,backgroundColor:"transparent",color:C.txS,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:13}}><Upload size={16}/> Choose photo</button>}
        <Input placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/>
        {Object.entries(TAG_OPTIONS).map(([cat,vals])=>(
          <div key={cat}>
            <p style={{color:C.txS,fontSize:11,fontWeight:700,marginBottom:6,textTransform:"capitalize"}}>{cat}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{vals.map(v=><Pill key={v} active={tags[cat].includes(v)} onClick={()=>togTag(cat,v)}>{v}</Pill>)}</div>
          </div>
        ))}
        <Btn onClick={save}>Save</Btn>
      </div></Surface>}

      {/* Gallery */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {filtered.map(i=>(
          <div key={i.id} style={{position:"relative",borderRadius:14,overflow:"hidden",cursor:"pointer"}} onClick={()=>setViewing(i)}>
            <img src={i.photo} style={{width:"100%",height:160,objectFit:"cover"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"6px 8px",background:"linear-gradient(transparent,rgba(0,0,0,0.5))"}}>
              {[...(i.season||[]),...(i.fancy||[])].slice(0,2).map(t=>(
                <span key={t} style={{color:"white",fontSize:9,fontWeight:700,backgroundColor:"rgba(255,255,255,0.2)",borderRadius:99,padding:"1px 6px",marginRight:4}}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {viewing&&(
        <div onClick={()=>setViewing(null)} style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.88)",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <img src={viewing.photo} style={{maxWidth:"100%",maxHeight:"68vh",borderRadius:16,objectFit:"contain"}}/>
          {viewing.note&&<p style={{color:"white",marginTop:12,fontSize:13}}>{viewing.note}</p>}
          <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap",justifyContent:"center"}}>
            {[...(viewing.season||[]),...(viewing.weather||[]),...(viewing.fancy||[])].map(t=>(
              <span key={t} style={{color:"white",fontSize:11,fontWeight:700,backgroundColor:"rgba(255,255,255,0.2)",borderRadius:99,padding:"3px 10px"}}>{t}</span>
            ))}
          </div>
          <button onClick={e=>{e.stopPropagation();del(viewing.id);}} style={{marginTop:16,backgroundColor:"#EF4444",color:"white",border:"none",borderRadius:10,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Delete</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════ CLOTHING VIEW ═══════════ */
function ClothingView({ state, setState }) {
  const [tab,setTab]=useState("wardrobe");
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}} className="fade-in">
      <PageTitle icon={<Shirt size={20} style={{color:C.ac}}/>}>Clothing</PageTitle>
      <Tabs options={[["wardrobe","Wardrobe"],["inspo","Inspo"]]} active={tab} onChange={setTab}/>
      {tab==="wardrobe"?<WardrobeTab state={state} setState={setState}/>:<InspoTab state={state} setState={setState}/>}
    </div>
  );
}

/* ═══════════ MORE OVERLAY ═══════════ */
function MoreOverlay({ go, close, themeKey, setThemeKey }) {
  const items=[{id:"calendar",label:"Calendar",emoji:"⊡"},{id:"trips",label:"Trips",emoji:"✈️"},{id:"clothing",label:"Clothing",emoji:"◈"},{id:"books",label:"Books",emoji:"◆"}];
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end"}} onClick={close}>
      <div style={{width:"100%",backgroundColor:C.card,borderRadius:"24px 24px 0 0",padding:"24px 24px",paddingBottom:"calc(24px + env(safe-area-inset-bottom))"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:99,backgroundColor:C.border,margin:"0 auto 20px"}}/>
        {items.map(i=>(
          <button key={i.id} onClick={()=>{go(i.id);close();}} style={{width:"100%",display:"flex",alignItems:"center",gap:16,padding:"14px 12px",borderRadius:16,border:"none",backgroundColor:"transparent",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:24}}>{i.emoji}</span>
            <span style={{fontSize:16,fontWeight:600,color:C.tx,fontFamily:C.fontB}}>{i.label}</span>
          </button>
        ))}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}>
          <p style={{color:C.txS,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>Theme</p>
          <div style={{display:"flex",gap:8}}>
            {Object.entries(themes).map(([k,t])=>(
              <button key={k} onClick={()=>setThemeKey(k)} style={{flex:1,padding:"10px 0",borderRadius:12,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",backgroundColor:themeKey===k?t.ac:C.bgSoft,color:themeKey===k?"#fff":C.txM,fontFamily:C.fontB}}>{t.name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ MAIN APP ═══════════ */
export default function LifeOS() {
  const [view,setView]=useState("today");
  const [fitSub,setFitSub]=useState("workouts");
  const [showMore,setShowMore]=useState(false);
  const [state,setState]=useState(null);
  const [themeKey,setThemeKey]=useState("calm");
  const [loading,setLoading]=useState(true);

  Object.assign(C, themes[themeKey]);

  useEffect(()=>{ db.loadAll().then(data=>{setState(data);setLoading(false);}).catch(()=>setLoading(false)); },[]);

  function go(dest,sub){setView(dest);if(sub)setFitSub(sub);setShowMore(false);}

  const NAV=[
    {id:"today",   label:"Today",    Icon:Home},
    {id:"tasks",   label:"Tasks",    Icon:CheckSquare},
    {id:"projects",label:"Projects", Icon:FolderKanban},
    {id:"fitness", label:"Fitness",  Icon:Dumbbell},
    {id:"books",   label:"Books",    Icon:BookOpen},
  ];

  function renderView(){
    if(!state) return null;
    switch(view){
      case "today":    return <TodayView state={state} go={go}/>;
      case "tasks":    return <TasksView state={state} setState={setState}/>;
      case "projects": return <ProjectsView state={state} setState={setState}/>;
      case "fitness":  return <FitnessView state={state} setState={setState} sub={fitSub} setSub={setFitSub}/>;
      case "books":    return <BooksView state={state} setState={setState}/>;
      case "calendar": return <CalendarView/>;
      case "trips":    return <TripsView state={state} setState={setState}/>;
      case "clothing": return <ClothingView state={state} setState={setState}/>;
      default: return null;
    }
  }

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",backgroundColor:C.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:32,height:32,border:`2px solid ${C.border}`,borderTopColor:C.ac,borderRadius:999,animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{color:C.txM,fontSize:13,fontWeight:600}}>Loading…</p>
      </div>
    </div>
  );

  return (
    <>
      <FontStyles/>
      <style>{`body,input,select,textarea,button{font-family:${C.fontB}}`}</style>
      <div style={{backgroundColor:C.bg,minHeight:"100vh",color:C.tx}}>

        {/* Desktop */}
        <div style={{display:"none"}} id="desktop">
          <style>{`@media(min-width:768px){#desktop{display:flex!important;height:100vh;overflow:hidden}}`}</style>
          <div style={{width:220,backgroundColor:C.side,display:"flex",flexDirection:"column",padding:"24px 12px",flexShrink:0}}>
            <div style={{padding:"0 12px",marginBottom:32}}>
              <p style={{color:"rgba(255,255,255,0.35)",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.2em"}}>Life OS</p>
              <p style={{color:"#fff",fontFamily:C.fontH,fontSize:16,fontWeight:800,marginTop:4}}>Command Center</p>
            </div>
            <nav style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {[...NAV,{id:"calendar",label:"Calendar",Icon:Calendar},{id:"trips",label:"Trips",Icon:Plane},{id:"clothing",label:"Clothing",Icon:Shirt}].map(n=>{
                const active=view===n.id;
                return <button key={n.id} onClick={()=>go(n.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",textAlign:"left",backgroundColor:active?C.sideAc:"transparent",color:active?"#fff":C.sideTxt,fontFamily:C.fontB}}><n.Icon size={17}/>{n.label}</button>;
              })}
            </nav>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:16}}>
              <div style={{display:"flex",gap:6}}>
                {Object.entries(themes).map(([k,t])=>(
                  <button key={k} onClick={()=>setThemeKey(k)} style={{flex:1,padding:"8px 0",borderRadius:10,fontSize:10,fontWeight:700,border:"none",cursor:"pointer",backgroundColor:themeKey===k?t.ac:"rgba(255,255,255,0.06)",color:themeKey===k?"#fff":C.sideTxt,fontFamily:C.fontB}}>{t.name}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",backgroundColor:C.bg}}>
            <div style={{maxWidth:680,margin:"0 auto",padding:"28px 32px 64px"}}>{renderView()}</div>
          </div>
        </div>

        {/* Mobile */}
        <div id="mobile">
          <style>{`@media(min-width:768px){#mobile{display:none!important}}`}</style>
          <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
            <div style={{flex:1,overflowY:"auto",padding:"0 16px 112px"}}>{renderView()}</div>
            <div style={{position:"fixed",bottom:0,left:0,right:0,backgroundColor:C.card,borderTop:`1px solid ${C.border}`,paddingBottom:"env(safe-area-inset-bottom)",zIndex:40}}>
              <div style={{display:"flex"}}>
                {NAV.map(n=>{
                  const active=view===n.id;
                  return <button key={n.id} onClick={()=>go(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0 8px",gap:2,border:"none",backgroundColor:"transparent",cursor:"pointer"}}>
                    <n.Icon size={20} style={{color:active?C.ac:C.txS}}/>
                    <span style={{fontSize:10,fontWeight:600,color:active?C.ac:C.txS}}>{n.label}</span>
                  </button>;
                })}
                <button onClick={()=>setShowMore(true)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0 8px",gap:2,border:"none",backgroundColor:"transparent",cursor:"pointer"}}>
                  <span style={{fontSize:18,lineHeight:1,color:["calendar","trips","clothing","books"].includes(view)?C.ac:C.txS}}>···</span>
                  <span style={{fontSize:10,fontWeight:600,color:["calendar","trips","clothing","books"].includes(view)?C.ac:C.txS}}>More</span>
                </button>
              </div>
            </div>
            {showMore&&<MoreOverlay go={go} close={()=>setShowMore(false)} themeKey={themeKey} setThemeKey={setThemeKey}/>}
          </div>
        </div>
      </div>
    </>
  );
}
