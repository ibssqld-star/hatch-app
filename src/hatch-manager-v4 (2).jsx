import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Users, User, Trash2, Edit2, Check, X, ChevronRight, ShoppingBag, ClipboardList, FileText } from 'lucide-react';

const T = {
  bg: '#050b14', surface: '#0d1825', card: '#14233a',
  border: 'rgba(255,255,255,0.06)', text: '#e8ecf3', textDim: '#c4cad8',
  muted: '#8a96b0', teal: '#00E5B4', blue: '#00BFFF',
  amber: '#FFB020', red: '#FF5470', green: '#7FE787', purple: '#8B7CF8',
};
const STORAGE_PREFIX = 'hatch_';
const ANIMALS = [
  { id: 'dog', name: 'Dog', emoji: '🐕' }, { id: 'cat', name: 'Cat', emoji: '🐈' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰' }, { id: 'dragon', name: 'Dragon', emoji: '🐉' },
  { id: 'phoenix', name: 'Phoenix', emoji: '🔥' }, { id: 'unicorn', name: 'Unicorn', emoji: '🦄' },
  { id: 'sehreh', name: 'Sehreh', emoji: '😈' },
];
const COLORS = [
  { hex: '#00E5B4', name: 'Mint' }, { hex: '#FF6B9D', name: 'Rose' },
  { hex: '#FFB020', name: 'Sun' }, { hex: '#8B7CF8', name: 'Lilac' },
  { hex: '#00BFFF', name: 'Sky' }, { hex: '#FF5470', name: 'Coral' },
  { hex: '#7FE787', name: 'Fern' },
];
const SHOP_ITEMS = [
  { id: 'ball', name: 'Bouncy Ball', emoji: '🎾', cost: 5 },
  { id: 'bone', name: 'Chew Bone', emoji: '🦴', cost: 5 },
  { id: 'bow', name: 'Ribbon Bow', emoji: '🎀', cost: 8 },
  { id: 'crown', name: 'Gold Crown', emoji: '👑', cost: 15 },
  { id: 'star', name: 'Star Badge', emoji: '⭐', cost: 10 },
  { id: 'cake', name: 'Birthday Cake', emoji: '🎂', cost: 12 },
];
const GOAL_CATS = [
  { value: 'health', label: '💪 Health', color: '#7FE787' },
  { value: 'skills', label: '🛠️ Skills', color: '#00BFFF' },
  { value: 'social', label: '🤝 Social', color: '#FF6B9D' },
  { value: 'activity', label: '🏃 Activity', color: '#FFB020' },
  { value: 'learning', label: '📚 Learning', color: '#8B7CF8' },
];

async function sGet(key) {
  try { if (window.storage) { const v = await window.storage.get(STORAGE_PREFIX + key); return v ? JSON.parse(v.value) : null; } } catch (e) {}
  try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key)); } catch (e) { return null; }
}
async function sSet(key, data) {
  try { if (window.storage) { await window.storage.set(STORAGE_PREFIX + key, JSON.stringify(data)); return true; } } catch (e) {}
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); return true; } catch (e) { return false; }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function ago(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

// ── shared UI ──────────────────────────────────────────────────────────────────
function Msg({ text, type = 'error' }) {
  if (!text) return null;
  const cols = { error: [T.red,'rgba(255,84,112,0.12)'], success: [T.teal,'rgba(0,229,180,0.12)'], info: [T.blue,'rgba(0,191,255,0.12)'] };
  const [c, bg] = cols[type] || cols.error;
  return <div style={{ background: bg, border: `1px solid ${c}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: c, fontFamily: 'DM Sans', fontSize: 13 }}>{text}</div>;
}
function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.surface, borderRadius:16, padding:24, maxWidth:480, width:'100%', border:`1px solid ${T.border}`, maxHeight:'90vh', overflowY:'auto' }}>
        {children}
      </div>
    </div>
  );
}
function Btn({ children, onClick, disabled, color=T.teal, fg='#0d1825', style={}, sm }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? 'rgba(255,255,255,0.06)' : color,
      color: disabled ? T.muted : fg, border:'none', borderRadius:8,
      padding: sm ? '6px 12px' : '10px 18px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:'DM Sans', fontWeight:700, fontSize: sm ? 12 : 13,
      display:'inline-flex', alignItems:'center', gap:5, ...style,
    }}>{children}</button>
  );
}
function Field({ label, value, onChange, placeholder, type='text', disabled }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13, boxSizing:'border-box', opacity: disabled ? 0.5 : 1 }} />
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onFirstLogin }) {
  const [su, setSu] = useState(false);
  const [un, setUn] = useState(''); const [em, setEm] = useState('');
  const [pw, setPw] = useState(''); const [cf, setCf] = useState('');
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  function switchTab(v) { setSu(v); setUn(''); setEm(''); setPw(''); setCf(''); setMsg(null); }

  async function doLogin() {
    setMsg(null);
    const u = await sGet('user:' + un.trim());
    if (!u) return setMsg({ text:'User not found', type:'error' });
    if (u.role !== 'manager') return setMsg({ text:'Not a manager account', type:'error' });
    if (!u.password) return onFirstLogin(u, pw);
    if (u.password === pw) return onLogin(u);
    setMsg({ text:'Invalid password', type:'error' });
  }

  async function doSignUp() {
    setMsg(null);
    if (!un.trim() || !em.trim() || !pw.trim()) return setMsg({ text:'Please fill in all fields', type:'error' });
    if (pw !== cf) return setMsg({ text:'Passwords do not match', type:'error' });
    if (pw.length < 6) return setMsg({ text:'Password must be at least 6 characters', type:'error' });
    setBusy(true);
    if (await sGet('user:' + un.trim())) { setBusy(false); return setMsg({ text:'Username already taken', type:'error' }); }
    const m = { username:un.trim(), email:em.trim(), password:pw.trim(), role:'manager', createdAt:Date.now(), petName:null, petType:null, petColor:null, tickets:20, petInventory:[] };
    await sSet('user:' + m.username, m);
    const all = await sGet('allManagers') || [];
    await sSet('allManagers', [...all, m]);
    setBusy(false);
    onFirstLogin(m, pw.trim());
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:T.surface, borderRadius:24, padding:40, maxWidth:400, width:'100%', border:`1px solid ${T.border}` }}>
        <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:30, color:T.text, marginBottom:4, textAlign:'center' }}>🐾 Hatch Manager</h1>
        <p style={{ textAlign:'center', color:T.muted, marginBottom:24, fontSize:13 }}>Oversee · Approve · Support</p>
        <div style={{ display:'flex', gap:6, marginBottom:24, background:T.card, padding:4, borderRadius:8 }}>
          {['Login','Sign Up'].map((l, i) => {
            const active = su === (i===1);
            return <button key={l} onClick={() => switchTab(i===1)} disabled={busy} style={{ flex:1, padding:'9px', background: active ? T.teal : 'transparent', color: active ? '#0d1825' : T.text, border:'none', borderRadius:6, fontFamily:'DM Sans', fontWeight:700, fontSize:12, cursor: busy ? 'not-allowed' : 'pointer' }}>{l}</button>;
          })}
        </div>
        <Msg text={msg?.text} type={msg?.type} />
        <Field label="Username" value={un} onChange={setUn} placeholder="your.username" disabled={busy} />
        {su && <Field label="Email" value={em} onChange={setEm} placeholder="you@example.com" type="email" disabled={busy} />}
        <div style={{ marginBottom: su ? 12 : 24, position:'relative' }}>
          <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>Password</label>
          <input type={show?'text':'password'} value={pw} onChange={e => setPw(e.target.value)}
            onKeyPress={e => !su && e.key==='Enter' && doLogin()} placeholder="••••••••" disabled={busy}
            style={{ width:'100%', padding:'11px 40px 11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13, boxSizing:'border-box' }} />
          <button onClick={() => setShow(!show)} style={{ position:'absolute', right:10, top:32, background:'none', border:'none', color:T.muted, cursor:'pointer', fontSize:15 }}>{show?'👁️':'👁️‍🗨️'}</button>
        </div>
        {su && <Field label="Confirm Password" value={cf} onChange={setCf} placeholder="••••••••" type="password" disabled={busy} />}
        <Btn onClick={su ? doSignUp : doLogin} disabled={busy || !un.trim() || !pw.trim()} style={{ width:'100%', justifyContent:'center' }}>
          {busy ? '⏳ Working...' : su ? 'Create Account' : 'Login'}
        </Btn>
      </div>
    </div>
  );
}

// ── Pet Picker ─────────────────────────────────────────────────────────────────
function PetPickerScreen({ user, password, onComplete }) {
  const [petType, setPetType] = useState('dog');
  const [petColor, setPetColor] = useState('#00E5B4');
  const [petName, setPetName] = useState('');
  const [err, setErr] = useState('');

  async function finish() {
    if (!petName.trim()) { setErr('Please name your pet!'); return; }
    const u = { ...user, petType, petColor, petName:petName.trim(), password, lastLogin:Date.now() };
    await sSet('user:' + user.username, u);
    onComplete(u);
  }
  const animal = ANIMALS.find(a => a.id === petType);
  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:T.surface, borderRadius:24, padding:40, maxWidth:500, width:'100%', border:`1px solid ${T.border}` }}>
        <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:T.text, marginBottom:6, textAlign:'center' }}>Pick Your Pet 🐾</h1>
        <p style={{ textAlign:'center', color:T.muted, marginBottom:28, fontSize:13 }}>Your companion while you manage the team</p>
        <div style={{ background:T.card, border:`2px solid ${petColor}`, borderRadius:16, padding:28, marginBottom:24, textAlign:'center' }}>
          <div style={{ fontSize:72, marginBottom:10 }}>{animal?.emoji}</div>
          <div style={{ color:T.text, fontSize:18, fontWeight:700 }}>{petName || 'Unnamed'}</div>
          <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>{animal?.name}</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={{ color:T.textDim, fontSize:11, display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>Pet Type</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {ANIMALS.map(a => (
              <button key={a.id} onClick={() => setPetType(a.id)} style={{ background: petType===a.id ? `${T.teal}22` : T.card, border: petType===a.id ? `2px solid ${T.teal}` : `1px solid ${T.border}`, borderRadius:10, padding:12, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:28 }}>{a.emoji}</span>
                <span style={{ color:T.text, fontSize:9, fontWeight:600 }}>{a.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={{ color:T.textDim, fontSize:11, display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>Colour</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {COLORS.map(c => <button key={c.hex} onClick={() => setPetColor(c.hex)} title={c.name} style={{ width:36, height:36, borderRadius:8, background:c.hex, border: petColor===c.hex ? `3px solid ${T.text}` : `1px solid ${T.border}`, cursor:'pointer' }} />)}
          </div>
        </div>
        <Field label="Pet Name" value={petName} onChange={v => { setPetName(v); setErr(''); }} placeholder="e.g., Blaze" />
        {err && <div style={{ color:T.red, fontSize:12, marginBottom:12 }}>{err}</div>}
        <Btn onClick={finish} disabled={!petName.trim()} style={{ width:'100%', justifyContent:'center' }}>Let's Go! 🚀</Btn>
      </div>
    </div>
  );
}

// ── Create / Edit User ─────────────────────────────────────────────────────────
function CreateUserModal({ type, onClose, onCreated }) {
  const [un, setUn] = useState(''); const [em, setEm] = useState('');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);

  async function create() {
    setMsg(null);
    if (!un.trim() || !em.trim()) return;
    if (type === 'sw') {
      if (!pw.trim()) return setMsg({ text: 'Please set a password for this SW', type: 'error' });
      if (pw.length < 6) return setMsg({ text: 'Password must be at least 6 characters', type: 'error' });
      if (pw !== pw2) return setMsg({ text: 'Passwords do not match', type: 'error' });
    }
    if (type === 'teen') {
      if (!pw.trim()) return setMsg({ text: 'Please set a 4-digit PIN for this teen', type: 'error' });
      if (!/^\d{4}$/.test(pw)) return setMsg({ text: 'PIN must be exactly 4 digits', type: 'error' });
    }
    setBusy(true);
    if (await sGet('user:' + un.trim())) { setMsg({ text:'Username already taken', type:'error' }); setBusy(false); return; }
    const u = {
      username: un.trim().toLowerCase(), email: em.trim(),
      role: type,
      password: type === 'sw' ? pw.trim() : null,
      pin: type === 'teen' ? pw.trim() : null,
      createdAt: Date.now(), createdBy: 'manager',
      petName: null, petType: null, petColor: null,
      tickets: 0, petInventory: [], assignedSWs: [],
      // teen app fields — initialised so the teen app works on first login
      ...(type === 'teen' ? {
        hatched: false, bondLevel: 0, totalInteractions: 0,
        xp: 0, goals: [], friendPets: [], sensoryProfile: null,
        soundOn: true, activePetGoal: null, petGoalHistory: [],
      } : {}),
    };
    await sSet('user:' + u.username, u);
    if (type === 'teen') { const all = await sGet('allTeens') || []; await sSet('allTeens', [...all, u]); }
    else { const all = await sGet('allSWs') || []; await sSet('allSWs', [...all, u]); }
    setBusy(false);
    setMsg({ text: `✅ ${un} created! ${type === 'sw' ? 'They can log in with that password.' : 'They can log in with that PIN.'}`, type: 'success' });
    onCreated?.();
    setTimeout(onClose, 2000);
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:'0 0 4px' }}>New {type==='teen'?'Teen':'Support Worker'}</h2>
      <p style={{ color:T.muted, fontSize:12, marginBottom:16 }}>
        {type === 'sw' ? 'Set their login password — they can log straight in.' : 'Set their 4-digit PIN — they can log straight in.'}
      </p>
      <Msg text={msg?.text} type={msg?.type} />
      <Field label="Username" value={un} onChange={setUn} placeholder="e.g., alex.j" disabled={busy} />
      <Field label="Email" value={em} onChange={setEm} placeholder="name@example.com" type="email" disabled={busy} />
      {type === 'sw' && <>
        <Field label="Password" value={pw} onChange={setPw} placeholder="At least 6 characters" type="password" disabled={busy} />
        <Field label="Confirm Password" value={pw2} onChange={setPw2} placeholder="••••••••" type="password" disabled={busy} />
      </>}
      {type === 'teen' && (
        <div style={{ marginBottom:12 }}>
          <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>4-Digit PIN</label>
          <input value={pw} onChange={e => setPw(e.target.value.replace(/\D/g,'').slice(0,4))}
            placeholder="e.g., 1234" inputMode="numeric" maxLength={4} disabled={busy}
            style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:18, letterSpacing:8, textAlign:'center', boxSizing:'border-box', opacity: busy ? 0.5 : 1 }} />
          <div style={{ color:T.muted, fontSize:11, marginTop:6 }}>Teen uses this PIN to log into the Hatch app</div>
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <Btn onClick={onClose} color={T.card} fg={T.text} style={{ flex:1, justifyContent:'center', border:`1px solid ${T.border}` }}>Cancel</Btn>
        <Btn onClick={create} disabled={!un.trim() || !em.trim() || busy} style={{ flex:1, justifyContent:'center' }}>{busy ? '⏳' : 'Create'}</Btn>
      </div>
    </Overlay>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [em, setEm] = useState(user.email || '');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);

  async function save() {
    if (!em.trim()) return;
    setBusy(true);
    const updated = { ...user, email:em.trim() };
    await sSet('user:' + user.username, updated);
    const k = user.role === 'teen' ? 'allTeens' : 'allSWs';
    const all = await sGet(k) || [];
    await sSet(k, all.map(u => u.username === user.username ? updated : u));
    setBusy(false);
    setMsg({ text:'✅ Saved!', type:'success' });
    onSaved?.();
    setTimeout(onClose, 1200);
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:'0 0 4px' }}>Edit @{user.username}</h2>
      <Msg text={msg?.text} type={msg?.type} />
      <div style={{ marginBottom:12 }}>
        <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>Username</label>
        <div style={{ padding:'11px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:10, color:T.muted, fontSize:13, fontFamily:'DM Sans' }}>{user.username} <span style={{ fontSize:11 }}>(can't change)</span></div>
      </div>
      <Field label="Email" value={em} onChange={setEm} placeholder="name@example.com" type="email" disabled={busy} />
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <Btn onClick={onClose} color={T.card} fg={T.text} style={{ flex:1, justifyContent:'center', border:`1px solid ${T.border}` }}>Cancel</Btn>
        <Btn onClick={save} disabled={!em.trim() || busy} style={{ flex:1, justifyContent:'center' }}>{busy ? '⏳' : 'Save'}</Btn>
      </div>
    </Overlay>
  );
}

// ── Create Goal (matches SW app: title + category + steps) ────────────────────
function CreateGoalModal({ teens, managerUsername, onClose, onCreated }) {
  const [teen, setTeen] = useState(teens[0]?.username || '');
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('skills');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);

  async function create() {
    if (!teen || !title.trim()) return;
    setBusy(true);
    const goal = {
      id: uid(), teenUsername: teen, title: title.trim(), category: cat,
      steps: steps.split('\n').map(s => s.trim()).filter(Boolean),
      status: 'active', createdBy: 'manager', createdByUsername: managerUsername,
      createdAt: Date.now(), activatedAt: Date.now(),
      completionRequestedAt: null, completedAt: null, notes: [],
    };
    const goals = await sGet('goals:' + teen) || [];
    await sSet('goals:' + teen, [...goals, goal]);
    setBusy(false);
    setMsg({ text:'✅ Goal created and active!', type:'success' });
    onCreated?.();
    setTimeout(onClose, 1400);
  }

  const catColor = GOAL_CATS.find(c => c.value === cat)?.color || T.teal;
  const stepList = steps.split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:'0 0 4px' }}>
        Create Goal {teens.length===1 ? `for ${teens[0].petName || teens[0].username}` : ''}
      </h2>
      <p style={{ color:T.muted, fontSize:12, marginBottom:16 }}>Manager goals go active immediately ✅</p>
      <Msg text={msg?.text} type={msg?.type} />

      {teens.length > 1 && (
        <div style={{ marginBottom:12 }}>
          <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>Teen</label>
          <select value={teen} onChange={e => setTeen(e.target.value)} style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13 }}>
            {teens.map(t => <option key={t.username} value={t.username}>{t.petName ? `${t.petName} (@${t.username})` : t.username}</option>)}
          </select>
        </div>
      )}

      <Field label="Goal Title" value={title} onChange={setTitle} placeholder="e.g., Walk to the shops independently" disabled={busy} />

      <div style={{ marginBottom:12 }}>
        <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:8 }}>Category</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {GOAL_CATS.map(c => (
            <button key={c.value} onClick={() => setCat(c.value)} style={{
              padding:'6px 12px', borderRadius:20,
              border:`1px solid ${cat===c.value ? c.color : T.border}`,
              background: cat===c.value ? `${c.color}22` : T.card,
              color: cat===c.value ? c.color : T.muted,
              fontFamily:'DM Sans', fontWeight:600, fontSize:12, cursor:'pointer',
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>Steps <span style={{ color:T.muted, fontWeight:400 }}>(one per line, optional)</span></label>
        <textarea value={steps} onChange={e => setSteps(e.target.value)}
          placeholder={"Step 1: Get ready\nStep 2: Head out\nStep 3: Come back and check in"} disabled={busy}
          style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13, boxSizing:'border-box', resize:'vertical', minHeight:90 }} />
        {stepList.length > 0 && (
          <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
            {stepList.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:`${catColor}22`, border:`1px solid ${catColor}`, display:'flex', alignItems:'center', justifyContent:'center', color:catColor, fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                <span style={{ color:T.textDim, fontSize:12 }}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <Btn onClick={onClose} color={T.card} fg={T.text} style={{ flex:1, justifyContent:'center', border:`1px solid ${T.border}` }}>Cancel</Btn>
        <Btn onClick={create} disabled={!teen || !title.trim() || busy} style={{ flex:1, justifyContent:'center' }}>
          {busy ? '⏳' : '+ Create Goal'}
        </Btn>
      </div>
    </Overlay>
  );
}

// ── Goal Detail ────────────────────────────────────────────────────────────────
function GoalDetailModal({ goal, managerUsername, onClose, onUpdated }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);

  const SM = {
    pending:            { label:'⏳ Pending Approval', color:T.amber },
    active:             { label:'✅ Active',            color:T.teal },
    pending_completion: { label:'🔔 Needs Approval',   color:T.blue },
    completed:          { label:'🏆 Completed',         color:T.green },
    rejected:           { label:'❌ Rejected',           color:T.red },
  };
  const sm = SM[goal.status] || { label:goal.status, color:T.muted };
  const catMeta = GOAL_CATS.find(c => c.value === goal.category);

  async function addNote() {
    if (!note.trim()) return; setBusy(true);
    const goals = await sGet('goals:' + goal.teenUsername) || [];
    await sSet('goals:' + goal.teenUsername, goals.map(g => g.id===goal.id ? { ...g, notes:[...(g.notes||[]), { text:note.trim(), author:managerUsername, timestamp:Date.now() }] } : g));
    setBusy(false); setNote('');
    setMsg({ text:'✅ Note added', type:'success' }); onUpdated?.();
    setTimeout(() => setMsg(null), 2000);
  }

  async function approveGoal() {
    setBusy(true);
    const goals = await sGet('goals:' + goal.teenUsername) || [];
    await sSet('goals:' + goal.teenUsername, goals.map(g => g.id===goal.id ? { ...g, status:'active', activatedAt:Date.now() } : g));
    const mgr = await sGet('user:' + managerUsername);
    if (mgr) await sSet('user:' + managerUsername, { ...mgr, tickets:(mgr.tickets||0)+2 });
    setBusy(false); setMsg({ text:'✅ Goal approved! +2 tickets', type:'success' }); onUpdated?.();
    setTimeout(onClose, 1500);
  }

  async function rejectGoal() {
    setBusy(true);
    const goals = await sGet('goals:' + goal.teenUsername) || [];
    await sSet('goals:' + goal.teenUsername, goals.map(g => g.id===goal.id ? { ...g, status:'rejected', rejectedAt:Date.now() } : g));
    setBusy(false); onUpdated?.(); onClose();
  }

  async function approveCompletion() {
    setBusy(true);
    const goals = await sGet('goals:' + goal.teenUsername) || [];
    await sSet('goals:' + goal.teenUsername, goals.map(g => g.id===goal.id ? { ...g, status:'completed', completedAt:Date.now() } : g));
    const teen = await sGet('user:' + goal.teenUsername);
    if (teen) await sSet('user:' + goal.teenUsername, { ...teen, tickets:(teen.tickets||0)+5 });
    const mgr = await sGet('user:' + managerUsername);
    if (mgr) await sSet('user:' + managerUsername, { ...mgr, tickets:(mgr.tickets||0)+2 });
    setBusy(false); setMsg({ text:'🏆 Approved! Teen gets 5 tickets. +2 for you!', type:'success' }); onUpdated?.();
    setTimeout(onClose, 2000);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1, marginRight:12 }}>
          <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:'0 0 8px', fontSize:18 }}>{goal.title}</h2>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ background:`${sm.color}22`, color:sm.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{sm.label}</span>
            {catMeta && <span style={{ background:`${catMeta.color}22`, color:catMeta.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{catMeta.label}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:T.muted, cursor:'pointer' }}><X size={18} /></button>
      </div>
      <div style={{ color:T.muted, fontSize:11, marginBottom:16 }}>Teen: @{goal.teenUsername} · By: @{goal.createdByUsername} · {ago(goal.createdAt)}</div>

      {goal.steps?.length > 0 && (
        <div style={{ background:T.card, borderRadius:10, padding:12, marginBottom:16 }}>
          <div style={{ color:T.textDim, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Steps</div>
          {goal.steps.map((s, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:`${T.teal}22`, border:`1px solid ${T.teal}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.teal, fontSize:10, fontWeight:700, flexShrink:0, marginTop:1 }}>{i+1}</div>
              <span style={{ color:T.textDim, fontSize:13 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {goal.status==='pending' && (
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <Btn onClick={rejectGoal} disabled={busy} color={T.red} fg="#fff" style={{ flex:1, justifyContent:'center' }}><X size={14} /> Reject</Btn>
          <Btn onClick={approveGoal} disabled={busy} style={{ flex:1, justifyContent:'center' }}><Check size={14} /> Approve</Btn>
        </div>
      )}
      {goal.status==='pending_completion' && (
        <div style={{ background:`${T.blue}15`, border:`1px solid ${T.blue}`, borderRadius:10, padding:14, marginBottom:16 }}>
          <div style={{ color:T.blue, fontSize:13, fontWeight:700, marginBottom:10 }}>🔔 Teen marked this done — approve?</div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn onClick={rejectGoal} disabled={busy} color={T.red} fg="#fff" style={{ flex:1, justifyContent:'center' }} sm><X size={12} /> Reject</Btn>
            <Btn onClick={approveCompletion} disabled={busy} style={{ flex:1, justifyContent:'center' }} sm><Check size={12} /> Approve (+5 tickets)</Btn>
          </div>
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <div style={{ color:T.textDim, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Progress Notes ({goal.notes?.length||0})</div>
        {goal.notes?.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12, maxHeight:160, overflowY:'auto' }}>
            {goal.notes.map((n,i) => (
              <div key={i} style={{ background:T.card, borderRadius:8, padding:'10px 12px' }}>
                <div style={{ color:T.text, fontSize:13, lineHeight:1.4, marginBottom:4 }}>{n.text}</div>
                <div style={{ color:T.muted, fontSize:11 }}>@{n.author} · {ago(n.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
        {!goal.notes?.length && <div style={{ color:T.muted, fontSize:12, marginBottom:12 }}>No notes yet</div>}
        <Msg text={msg?.text} type={msg?.type} />
        {goal.status !== 'completed' && (
          <div style={{ display:'flex', gap:8 }}>
            <input value={note} onChange={e => setNote(e.target.value)} onKeyPress={e => e.key==='Enter' && addNote()}
              placeholder="Add a progress note..." disabled={busy}
              style={{ flex:1, padding:'9px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontFamily:'DM Sans', fontSize:13 }} />
            <Btn onClick={addNote} disabled={!note.trim()||busy}><FileText size={14} /></Btn>
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ── Shop ───────────────────────────────────────────────────────────────────────
function ShopModal({ user, onClose, onPurchased }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
  const inv = user.petInventory || [];

  async function buy(item) {
    if ((user.tickets||0) < item.cost) { setMsg({ text:'Not enough tickets!', type:'error' }); return; }
    setBusy(true);
    const u = { ...user, tickets:(user.tickets||0)-item.cost, petInventory:[...inv, { ...item, boughtAt:Date.now() }] };
    await sSet('user:' + user.username, u);
    setBusy(false);
    setMsg({ text:`✅ Bought ${item.name}!`, type:'success' });
    onPurchased?.(u);
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:0 }}>🛍️ Pet Shop</h2>
        <div style={{ background:`${T.amber}22`, color:T.amber, padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700 }}>🎟 {user.tickets||0}</div>
      </div>
      <Msg text={msg?.text} type={msg?.type} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {SHOP_ITEMS.map(item => {
          const owned = inv.filter(i => i.id===item.id).length;
          const can = (user.tickets||0) >= item.cost;
          return (
            <div key={item.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ fontSize:32, textAlign:'center' }}>{item.emoji}</div>
              <div style={{ color:T.text, fontWeight:700, fontSize:13, textAlign:'center' }}>{item.name}</div>
              {owned > 0 && <div style={{ color:T.teal, fontSize:10, textAlign:'center' }}>Owned: {owned}</div>}
              <Btn onClick={() => buy(item)} disabled={!can||busy} color={can ? T.teal : 'rgba(255,255,255,0.06)'} fg={can ? '#0d1825' : T.muted} style={{ justifyContent:'center', marginTop:2 }} sm>🎟 {item.cost}</Btn>
            </div>
          );
        })}
      </div>
      <Btn onClick={onClose} color={T.card} fg={T.text} style={{ width:'100%', justifyContent:'center', marginTop:16, border:`1px solid ${T.border}` }}>Close</Btn>
    </Overlay>
  );
}

// ── User Card ──────────────────────────────────────────────────────────────────
function UserCard({ u, sws, showAssign, onEdit, onDelete, onViewGoals, goalCount, onAssignSW }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [addingSW, setAddingSW] = useState(false);
  const animal = ANIMALS.find(a => a.id === u.petType);
  // support legacy single assignedSW field
  const assignedSWs = u.assignedSWs || (u.assignedSW ? [u.assignedSW] : []);
  const assignedSWObjs = assignedSWs.map(un => sws.find(s => s.username === un)).filter(Boolean);
  const unassignedSWs = sws.filter(s => !assignedSWs.includes(s.username));

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ fontSize:36, width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center', background:T.surface, borderRadius:12 }}>
            {animal?.emoji || '👤'}
          </div>
          <div>
            <div style={{ color:T.text, fontWeight:700, fontSize:14 }}>{u.petName || <span style={{ color:T.muted, fontWeight:400, fontSize:12 }}>No pet yet</span>}</div>
            <div style={{ color:T.muted, fontSize:11 }}>@{u.username}</div>
            <div style={{ color:T.muted, fontSize:10 }}>{u.email}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
          <div style={{ background:`${T.amber}22`, color:T.amber, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>🎟 {u.tickets||0}</div>
          {!u.password && <div style={{ background:`${T.purple}22`, color:T.purple, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>Setup pending</div>}
        </div>
      </div>

      {/* SW assignment (teens only) — supports multiple */}
      {showAssign && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: (addingSW || unassignedSWs.length > 0) ? 6 : 0 }}>
            {assignedSWObjs.map(sw => (
              <div key={sw.username} style={{ display:'flex', alignItems:'center', gap:4, background:`${T.teal}18`, border:`1px solid ${T.teal}50`, borderRadius:20, padding:'3px 8px 3px 6px' }}>
                <span style={{ fontSize:14 }}>{ANIMALS.find(a=>a.id===sw.petType)?.emoji || '🤝'}</span>
                <span style={{ color:T.teal, fontSize:11, fontWeight:700 }}>@{sw.username}</span>
                <button onClick={() => onAssignSW(u, sw.username, true)} style={{ background:'none', border:'none', color:T.teal, cursor:'pointer', padding:0, lineHeight:1, marginLeft:2 }}><X size={11} /></button>
              </div>
            ))}
            {sws.length > 0 && !addingSW && (
              <button onClick={() => setAddingSW(true)} style={{ background:'none', border:`1px dashed ${T.border}`, borderRadius:20, padding:'3px 10px', cursor:'pointer', color:T.muted, fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                <Plus size={11} /> {assignedSWObjs.length === 0 ? 'Assign SW' : 'Add SW'}
              </button>
            )}
            {sws.length === 0 && assignedSWObjs.length === 0 && (
              <span style={{ color:T.muted, fontSize:11 }}>No SWs in system yet</span>
            )}
          </div>
          {addingSW && (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <select defaultValue="" onChange={e => { if (e.target.value) { onAssignSW(u, e.target.value, false); setAddingSW(false); } }}
                style={{ flex:1, padding:'6px 8px', background:T.surface, border:`1px solid ${T.teal}`, borderRadius:8, color:T.text, fontFamily:'DM Sans', fontSize:12 }}>
                <option value="">— pick a support worker —</option>
                {unassignedSWs.length > 0
                  ? unassignedSWs.map(s => <option key={s.username} value={s.username}>@{s.username}{s.petName ? ` (${s.petName})` : ''}</option>)
                  : <option disabled value="">All SWs already assigned ✓</option>
                }
              </select>
              <button onClick={() => setAddingSW(false)} style={{ background:'none', border:'none', color:T.muted, cursor:'pointer' }}><X size={14} /></button>
            </div>
          )}
        </div>
      )}

      {confirmDel ? (
        <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}40`, borderRadius:10, padding:12 }}>
          <div style={{ color:T.red, fontSize:12, marginBottom:10 }}>Delete @{u.username}? This cannot be undone.</div>
          <div style={{ display:'flex', gap:6 }}>
            <Btn onClick={() => setConfirmDel(false)} color={T.card} fg={T.text} style={{ flex:1, justifyContent:'center', border:`1px solid ${T.border}` }} sm>Cancel</Btn>
            <Btn onClick={() => onDelete(u)} color={T.red} fg="#fff" style={{ flex:1, justifyContent:'center' }} sm><Trash2 size={12} /> Delete</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', gap:6 }}>
          {showAssign && (
            <Btn onClick={() => onViewGoals(u)} color={T.surface} fg={T.teal} style={{ flex:1, justifyContent:'center', border:`1px solid ${T.teal}40` }} sm>
              <ClipboardList size={12} /> Goals {goalCount > 0 ? `(${goalCount})` : ''}
            </Btn>
          )}
          <Btn onClick={() => onEdit(u)} color={T.blue} fg="#0d1825" sm><Edit2 size={12} /></Btn>
          <Btn onClick={() => setConfirmDel(true)} color={T.red} fg="#fff" sm><Trash2 size={12} /></Btn>
        </div>
      )}
    </div>
  );
}

// ── Teen Goals Panel ───────────────────────────────────────────────────────────
function TeenGoalsPanel({ teen, managerUsername, onBack, onGoalUpdated }) {
  const [goals, setGoals] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  async function load() {
    const g = await sGet('goals:' + teen.username) || [];
    const now = Date.now(); let changed = false;
    const processed = g.map(goal => {
      if (goal.status==='pending_completion' && goal.completionRequestedAt && (now - goal.completionRequestedAt) > 86400000) {
        changed = true;
        return { ...goal, status:'completed', completedAt:now };
      }
      return goal;
    });
    if (changed) await sSet('goals:' + teen.username, processed);
    setGoals(processed);
  }
  useEffect(() => { load(); }, []);

  const byStatus = {
    pending_completion: goals.filter(g => g.status==='pending_completion'),
    pending:  goals.filter(g => g.status==='pending'),
    active:   goals.filter(g => g.status==='active'),
    completed: goals.filter(g => g.status==='completed'),
    rejected: goals.filter(g => g.status==='rejected'),
  };
  const SM_COLOR = { pending:T.amber, active:T.teal, pending_completion:T.blue, completed:T.green, rejected:T.red };
  const SM_ICON  = { pending:'⏳', active:'✅', pending_completion:'🔔', completed:'🏆', rejected:'❌' };

  const GoalRow = ({ goal }) => (
    <div onClick={() => setSelectedGoal(goal)} style={{
      background:T.surface, border:`1px solid ${goal.status==='pending_completion' ? T.blue : T.border}`,
      borderRadius:10, padding:'12px 14px', cursor:'pointer',
      display:'flex', justifyContent:'space-between', alignItems:'center',
    }}>
      <div>
        <div style={{ color:T.text, fontSize:13, fontWeight:600, marginBottom:3 }}>{SM_ICON[goal.status]} {goal.title}</div>
        <div style={{ color:T.muted, fontSize:11 }}>@{goal.createdByUsername} · {goal.notes?.length||0} notes · {ago(goal.createdAt)}</div>
      </div>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <span style={{ color:SM_COLOR[goal.status], fontSize:10, fontWeight:700 }}>{goal.status.replace('_',' ')}</span>
        <ChevronRight size={14} color={T.muted} />
      </div>
    </div>
  );

  const Section = ({ title, items, color }) => items.length===0 ? null : (
    <div style={{ marginBottom:16 }}>
      <div style={{ color:color||T.muted, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{title} ({items.length})</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>{items.map(g => <GoalRow key={g.id} goal={g} />)}</div>
    </div>
  );

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <button onClick={onBack} style={{ background:'none', border:'none', color:T.teal, cursor:'pointer', fontFamily:'DM Sans', fontSize:13, padding:0, marginBottom:4 }}>← Back</button>
          <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, fontSize:20, margin:0 }}>
            {ANIMALS.find(a=>a.id===teen.petType)?.emoji || '👤'} {teen.petName || teen.username}'s Goals
          </h2>
        </div>
        <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> New Goal</Btn>
      </div>

      {goals.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
          <div>No goals yet — create the first one!</div>
        </div>
      )}

      <Section title="🔔 Needs Approval" items={byStatus.pending_completion} color={T.blue} />
      <Section title="⏳ Pending (SW goals)" items={byStatus.pending} color={T.amber} />
      <Section title="✅ Active" items={byStatus.active} color={T.teal} />
      <Section title="🏆 Completed" items={byStatus.completed} color={T.green} />
      <Section title="❌ Rejected" items={byStatus.rejected} color={T.red} />

      {showCreate && <CreateGoalModal teens={[teen]} managerUsername={managerUsername} onClose={() => setShowCreate(false)} onCreated={load} />}
      {selectedGoal && (
        <GoalDetailModal
          goal={goals.find(g => g.id===selectedGoal.id) || selectedGoal}
          managerUsername={managerUsername}
          onClose={() => { setSelectedGoal(null); load(); }}
          onUpdated={load}
        />
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ user: init, onLogout }) {
  const [user, setUser] = useState(init);
  const [tab, setTab] = useState('teens');
  const [teens, setTeens] = useState([]);
  const [sws, setSWs] = useState([]);
  const [goalCounts, setGoalCounts] = useState({});
  const [pendingCount, setPendingCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState('teen');
  const [editUser, setEditUser] = useState(null);
  const [viewTeen, setViewTeen] = useState(null);
  const [showShop, setShowShop] = useState(false);

  async function load() {
    const t = await sGet('allTeens') || [];
    const s = await sGet('allSWs') || [];
    setTeens(t); setSWs(s);
    let pending = 0; const counts = {};
    for (const teen of t) {
      const goals = await sGet('goals:' + teen.username) || [];
      counts[teen.username] = goals.length;
      pending += goals.filter(g => g.status==='pending' || g.status==='pending_completion').length;
    }
    setGoalCounts(counts); setPendingCount(pending);
    const fresh = await sGet('user:' + user.username);
    if (fresh) setUser(fresh);
  }
  useEffect(() => { load(); }, []);

  async function deleteUser(u) {
    await sSet('user:' + u.username, null);
    const k = u.role==='teen' ? 'allTeens' : 'allSWs';
    const all = await sGet(k) || [];
    await sSet(k, all.filter(x => x.username !== u.username));
    load();
  }

  async function assignSW(teen, swUsername, remove = false) {
    const current = teen.assignedSWs || (teen.assignedSW ? [teen.assignedSW] : []);
    const next = remove
      ? current.filter(s => s !== swUsername)
      : current.includes(swUsername) ? current : [...current, swUsername];
    const updated = { ...teen, assignedSWs: next, assignedSW: null };
    await sSet('user:' + teen.username, updated);
    const allTeens = await sGet('allTeens') || [];
    await sSet('allTeens', allTeens.map(t => t.username===teen.username ? updated : t));
    load();
  }

  const animal = ANIMALS.find(a => a.id===user.petType);

  if (viewTeen) return (
    <div style={{ minHeight:'100vh', background:T.bg, padding:20 }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <TeenGoalsPanel teen={viewTeen} managerUsername={user.username} onBack={() => { setViewTeen(null); load(); }} onGoalUpdated={load} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:T.bg, padding:20 }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:48, background:T.surface, borderRadius:14, width:60, height:60, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${T.border}` }}>
              {animal?.emoji || '🐾'}
            </div>
            <div>
              <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:T.text, margin:0 }}>Hatch Manager</h1>
              <div style={{ color:T.muted, fontSize:12 }}>{user.petName ? `${user.petName} · ` : ''}{user.username}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ background:`${T.amber}22`, color:T.amber, padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:700 }}>🎟 {user.tickets||0}</div>
            <Btn onClick={() => setShowShop(true)} color={T.purple} fg="#fff"><ShoppingBag size={14} /> Shop</Btn>
            <Btn onClick={onLogout} color={T.red} fg="#fff"><LogOut size={14} /> Logout</Btn>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Teens', value:teens.length, color:T.teal, icon:'👥' },
            { label:'Support Workers', value:sws.length, color:T.blue, icon:'🤝' },
            { label:'Pending Actions', value:pendingCount, color:pendingCount>0 ? T.amber : T.muted, icon:'🔔' },
            { label:'Your Tickets', value:user.tickets||0, color:T.amber, icon:'🎟' },
          ].map(s => (
            <div key={s.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ color:s.color, fontSize:26, fontWeight:800, fontFamily:'Syne' }}>{s.value}</div>
              <div style={{ color:T.muted, fontSize:11, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {[
            { key:'teens', label:'Teens', icon:<Users size={15}/>, count:teens.length },
            { key:'sws',   label:'Support Workers', icon:<User size={15}/>, count:sws.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: tab===t.key ? T.teal : T.surface, color: tab===t.key ? '#0d1825' : T.text,
              border:`1px solid ${tab===t.key ? T.teal : T.border}`, borderRadius:8, padding:'9px 18px',
              cursor:'pointer', fontFamily:'DM Sans', fontWeight:600, fontSize:13,
              display:'flex', alignItems:'center', gap:6,
            }}>{t.icon} {t.label} ({t.count})</button>
          ))}
        </div>

        {/* List */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ color:T.text, fontFamily:'Syne', fontWeight:700, fontSize:16, margin:0 }}>
              {tab==='teens' ? '👥 Teens' : '🤝 Support Workers'}
            </h3>
            <Btn onClick={() => { setCreateType(tab==='teens' ? 'teen' : 'sw'); setShowCreate(true); }}>
              <Plus size={14} /> New {tab==='teens' ? 'Teen' : 'SW'}
            </Btn>
          </div>

          {(tab==='teens' ? teens : sws).length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{tab==='teens' ? '👥' : '🤝'}</div>
              <div>No {tab==='teens' ? 'teens' : 'support workers'} yet</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {(tab==='teens' ? teens : sws).map(u => (
                <UserCard
                  key={u.username}
                  u={u}
                  sws={sws}
                  showAssign={tab === 'teens'}
                  onEdit={setEditUser}
                  onDelete={deleteUser}
                  onViewGoals={setViewTeen}
                  goalCount={goalCounts[u.username]||0}
                  onAssignSW={assignSW}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateUserModal type={createType} onClose={() => setShowCreate(false)} onCreated={load} />}
      {editUser   && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={load} />}
      {showShop   && <ShopModal user={user} onClose={() => { setShowShop(false); load(); }} onPurchased={setUser} />}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const s = await sGet('lastSession:manager');
        if (s?.username) { const u = await sGet('user:' + s.username); if (u) setUser(u); }
      } catch (e) {}
      finally { setLoading(false); }
    }
    restore();
  }, []);

  function handleFirstLogin(newUser, password) {
    setShowPetPicker(true);
    setUser({ ...newUser, _firstLogin:true, _password:password });
    setLoading(false);
  }

  async function handlePetPickerComplete(u) {
    await sSet('user:' + u.username, u);
    await sSet('lastSession:manager', { username:u.username });
    setUser(u); setShowPetPicker(false);
  }

  async function handleLogin(u) {
    await sSet('lastSession:manager', { username:u.username });
    setUser(u);
  }

  async function handleLogout() {
    await sSet('lastSession:manager', null);
    setUser(null);
  }

  if (loading) return <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color:T.teal, fontFamily:'DM Sans' }}>Loading...</div></div>;
  if (!user) return <LoginScreen onLogin={handleLogin} onFirstLogin={handleFirstLogin} />;
  if (showPetPicker) return <PetPickerScreen user={user} password={user._password} onComplete={handlePetPickerComplete} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
