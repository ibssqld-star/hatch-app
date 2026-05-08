import React, { useState, useEffect } from 'react';
import { LogOut, Plus, ShoppingBag, Check, X, FileText } from 'lucide-react';

const T = {
  bg:'#050b14', surface:'#0d1825', card:'#14233a', border:'rgba(255,255,255,0.06)',
  text:'#e8ecf3', textDim:'#c4cad8', muted:'#8a96b0', teal:'#00E5B4', blue:'#00BFFF',
  amber:'#FFB020', red:'#FF5470', green:'#7FE787', purple:'#8B7CF8',
};
const STORAGE_PREFIX = 'hatch_';
const ANIMALS = [
  { id:'dog', name:'Dog', emoji:'🐕' }, { id:'cat', name:'Cat', emoji:'🐈' },
  { id:'rabbit', name:'Rabbit', emoji:'🐰' }, { id:'dragon', name:'Dragon', emoji:'🐉' },
  { id:'phoenix', name:'Phoenix', emoji:'🔥' }, { id:'unicorn', name:'Unicorn', emoji:'🦄' },
  { id:'sehreh', name:'Sehreh', emoji:'😈' },
];
const COLORS = [
  { hex:'#00E5B4', name:'Mint' }, { hex:'#FF6B9D', name:'Rose' }, { hex:'#FFB020', name:'Sun' },
  { hex:'#8B7CF8', name:'Lilac' }, { hex:'#00BFFF', name:'Sky' }, { hex:'#FF5470', name:'Coral' },
  { hex:'#7FE787', name:'Fern' },
];
const SHOP_ITEMS = [
  { id:'toy_ball', name:'Bouncy Ball', emoji:'⚽', cost:10 },
  { id:'food_treat', name:'Special Treat', emoji:'🍪', cost:15 },
  { id:'bed_cozy', name:'Cozy Bed', emoji:'🛏️', cost:25 },
  { id:'hat_crown', name:'Crown', emoji:'👑', cost:30 },
  { id:'toy_fish', name:'Fish Toy', emoji:'🐟', cost:12 },
  { id:'collar_bling', name:'Bling Collar', emoji:'✨', cost:20 },
];
const GOAL_CATS = [
  { value:'health',   label:'💪 Health',   color:'#7FE787' },
  { value:'skills',   label:'🛠️ Skills',   color:'#00BFFF' },
  { value:'social',   label:'🤝 Social',   color:'#FF6B9D' },
  { value:'activity', label:'🏃 Activity', color:'#FFB020' },
  { value:'learning', label:'📚 Learning', color:'#8B7CF8' },
];

async function sGet(key) {
  try { if (window.storage) { const v = await window.storage.get(STORAGE_PREFIX + key); return v ? JSON.parse(v.value) : null; } } catch (e) {}
  try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key)); } catch (e) { return null; }
}
async function sSet(key, data) {
  try { if (window.storage) { await window.storage.set(STORAGE_PREFIX + key, JSON.stringify(data)); return true; } } catch (e) {}
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); return true; } catch (e) { return false; }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function ago(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60)+'m ago';
  if (s < 86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}

function Msg({ text, type='error' }) {
  if (!text) return null;
  const cols = { error:[T.red,'rgba(255,84,112,0.12)'], success:[T.teal,'rgba(0,229,180,0.12)'], info:[T.blue,'rgba(0,191,255,0.12)'] };
  const [c, bg] = cols[type] || cols.error;
  return <div style={{ background:bg, border:`1px solid ${c}`, borderRadius:8, padding:'10px 14px', marginBottom:14, color:c, fontFamily:'DM Sans', fontSize:13 }}>{text}</div>;
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

function PetPickerScreen({ onComplete }) {
  const [petType, setPetType] = useState('dog');
  const [petColor, setPetColor] = useState('#00E5B4');
  const [petName, setPetName] = useState('');
  const [err, setErr] = useState('');
  const animal = ANIMALS.find(a => a.id===petType);
  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:T.surface, borderRadius:24, padding:40, maxWidth:500, width:'100%', border:`1px solid ${T.border}` }}>
        <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:T.text, marginBottom:6, textAlign:'center' }}>Welcome Support Worker!</h1>
        <p style={{ textAlign:'center', color:T.muted, marginBottom:28, fontSize:13 }}>Pick your companion</p>
        <div style={{ background:T.card, border:`2px solid ${petColor}`, borderRadius:16, padding:28, marginBottom:24, textAlign:'center' }}>
          <div style={{ fontSize:72, marginBottom:10 }}>{animal?.emoji}</div>
          <div style={{ color:T.text, fontSize:18, fontWeight:700 }}>{petName || 'Unnamed'}</div>
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
            {COLORS.map(c => <button key={c.hex} onClick={() => setPetColor(c.hex)} style={{ width:36, height:36, borderRadius:8, background:c.hex, border: petColor===c.hex ? `3px solid ${T.text}` : `1px solid ${T.border}`, cursor:'pointer' }} />)}
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ color:T.textDim, fontSize:11, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Pet Name</label>
          <input value={petName} onChange={e => { setPetName(e.target.value); setErr(''); }} placeholder="e.g., Max"
            style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${err ? T.red : T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13, boxSizing:'border-box' }} />
          {err && <div style={{ color:T.red, fontSize:12, marginTop:6 }}>{err}</div>}
        </div>
        <Btn onClick={() => { if (!petName.trim()) { setErr('Please name your pet!'); return; } onComplete({ petType, petColor, petName:petName.trim() }); }} style={{ width:'100%', justifyContent:'center' }}>Get Started</Btn>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onFirstLogin }) {
  const [un, setUn] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState(null);
  const [step, setStep] = useState('username'); // 'username' | 'new' | 'existing'
  const [foundUser, setFoundUser] = useState(null);
  const [busy, setBusy] = useState(false);

  async function lookupUser() {
    setMsg(null);
    if (!un.trim()) return;
    setBusy(true);
    const u = await sGet('user:' + un.trim());
    setBusy(false);
    if (!u) return setMsg({ text: 'Username not found — check with your manager', type: 'error' });
    if (u.role !== 'sw') return setMsg({ text: 'Not an SW account', type: 'error' });
    setFoundUser(u);
    setStep(u.password ? 'existing' : 'new');
  }

  async function doLogin() {
    setMsg(null);
    if (!foundUser) return;
    if (foundUser.password === pw) return onLogin(foundUser);
    setMsg({ text: 'Incorrect password', type: 'error' });
  }

  async function doCreatePassword() {
    setMsg(null);
    if (pw.length < 6) return setMsg({ text: 'Password must be at least 6 characters', type: 'error' });
    if (pw !== confirm) return setMsg({ text: 'Passwords do not match', type: 'error' });
    // re-fetch from storage to be safe
    setBusy(true);
    const u = await sGet('user:' + un.trim());
    setBusy(false);
    if (!u) return setMsg({ text: 'Account not found — please go back and try again', type: 'error' });
    onFirstLogin(u, pw);
  }

  function goBack() { setStep('username'); setPw(''); setConfirm(''); setMsg(null); setFoundUser(null); }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 24, padding: 40, maxWidth: 400, width: '100%', border: `1px solid ${T.border}` }}>

        {step === 'username' && (
          <>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, color: T.text, marginBottom: 4, textAlign: 'center' }}>🤝 Hatch SW</h1>
            <p style={{ textAlign: 'center', color: T.muted, marginBottom: 24, fontSize: 13 }}>Support Worker</p>
            <Msg text={msg?.text} type={msg?.type} />
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Username</label>
              <input value={un} onChange={e => setUn(e.target.value)} onKeyPress={e => e.key === 'Enter' && lookupUser()}
                placeholder="your.username" disabled={busy}
                style={{ width: '100%', padding: '11px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontFamily: 'DM Sans', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <Btn onClick={lookupUser} disabled={!un.trim() || busy} style={{ width: '100%', justifyContent: 'center' }}>
              {busy ? '⏳ Looking up...' : 'Next →'}
            </Btn>
          </>
        )}

        {step === 'existing' && (
          <>
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: T.teal, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, padding: 0, marginBottom: 16 }}>← Back</button>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 4 }}>Welcome back!</h2>
            <p style={{ color: T.muted, marginBottom: 24, fontSize: 13 }}>@{un}</p>
            <Msg text={msg?.text} type={msg?.type} />
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Password</label>
              <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && doLogin()} placeholder="••••••••"
                style={{ width: '100%', padding: '11px 40px 11px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontFamily: 'DM Sans', fontSize: 13, boxSizing: 'border-box' }} />
              <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: 32, background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 15 }}>{show ? '👁️' : '👁️‍🗨️'}</button>
            </div>
            <Btn onClick={doLogin} disabled={!pw.trim()} style={{ width: '100%', justifyContent: 'center' }}>Login</Btn>
          </>
        )}

        {step === 'new' && (
          <>
            <button onClick={goBack} style={{ background: 'none', border: 'none', color: T.teal, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, padding: 0, marginBottom: 16 }}>← Back</button>
            <div style={{ background: `${T.teal}15`, border: `1px solid ${T.teal}40`, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ color: T.teal, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>👋 First time? Create your password</div>
              <div style={{ color: T.textDim, fontSize: 12 }}>Welcome @{un}! Set a password to secure your account.</div>
            </div>
            <Msg text={msg?.text} type={msg?.type} />
            <div style={{ marginBottom: 14, position: 'relative' }}>
              <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Create Password</label>
              <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
                placeholder="At least 6 characters"
                style={{ width: '100%', padding: '11px 40px 11px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontFamily: 'DM Sans', fontSize: 13, boxSizing: 'border-box' }} />
              <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: 32, background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 15 }}>{show ? '👁️' : '👁️‍🗨️'}</button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && doCreatePassword()} placeholder="••••••••"
                style={{ width: '100%', padding: '11px 12px', background: T.card, border: `1px solid ${confirm && confirm !== pw ? T.red : T.border}`, borderRadius: 10, color: T.text, fontFamily: 'DM Sans', fontSize: 13, boxSizing: 'border-box' }} />
              {confirm && confirm !== pw && <div style={{ color: T.red, fontSize: 11, marginTop: 4 }}>Passwords don't match</div>}
            </div>
            <Btn onClick={doCreatePassword} disabled={!pw.trim() || !confirm.trim() || busy} style={{ width: '100%', justifyContent: 'center' }}>
              {busy ? '⏳ Setting up...' : 'Create Password & Continue →'}
            </Btn>
          </>
        )}

      </div>
    </div>
  );
}

function CreateGoalModal({ teen, swUsername, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('skills');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    const goal = {
      id: uid(), teenUsername: teen.username, title: title.trim(), category: cat,
      steps: steps.split('\n').map(s => s.trim()).filter(Boolean),
      status: 'pending', createdBy: 'sw', createdByUsername: swUsername,
      createdAt: Date.now(), activatedAt: null,
      completionRequestedAt: null, completedAt: null, notes: [],
    };
    const goals = await sGet('goals:' + teen.username) || [];
    await sSet('goals:' + teen.username, [...goals, goal]);
    setBusy(false);
    setMsg({ text:'✅ Submitted — waiting for manager approval', type:'success' });
    onCreated?.();
    setTimeout(onClose, 1800);
  }

  const catColor = GOAL_CATS.find(c => c.value===cat)?.color || T.teal;
  const stepList = steps.split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.surface, borderRadius:16, padding:24, maxWidth:460, width:'100%', border:`1px solid ${T.border}`, maxHeight:'90vh', overflowY:'auto' }}>
        <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:'0 0 4px' }}>New Goal for {teen.petName||teen.username}</h2>
        <p style={{ color:T.amber, fontSize:12, marginBottom:16 }}>⚠️ SW goals need manager approval before the teen sees them</p>
        <Msg text={msg?.text} type={msg?.type} />
        <div style={{ marginBottom:12 }}>
          <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>Goal Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Complete homework independently" disabled={busy}
            style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13, boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:8 }}>Category</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {GOAL_CATS.map(c => (
              <button key={c.value} onClick={() => setCat(c.value)} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${cat===c.value ? c.color : T.border}`, background: cat===c.value ? `${c.color}22` : T.card, color: cat===c.value ? c.color : T.muted, fontFamily:'DM Sans', fontWeight:600, fontSize:12, cursor:'pointer' }}>{c.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ color:T.textDim, fontSize:12, display:'block', marginBottom:6 }}>Steps <span style={{ color:T.muted, fontWeight:400 }}>(one per line, optional)</span></label>
          <textarea value={steps} onChange={e => setSteps(e.target.value)} placeholder={'Step 1: Get started\nStep 2: Check in\nStep 3: Done!'} disabled={busy}
            style={{ width:'100%', padding:'11px 12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontFamily:'DM Sans', fontSize:13, boxSizing:'border-box', resize:'vertical', minHeight:90 }} />
          {stepList.length > 0 && (
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
              {stepList.map((s,i) => (
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
          <Btn onClick={create} disabled={!title.trim()||busy} style={{ flex:1, justifyContent:'center' }}>{busy ? '⏳' : 'Submit for Approval'}</Btn>
        </div>
      </div>
    </div>
  );
}

function ShopModal({ user, onClose }) {
  const [tickets, setTickets] = useState(user.tickets||0);
  const [inv, setInv] = useState(user.petInventory||[]);
  const [msg, setMsg] = useState(null);

  async function buy(item) {
    if (tickets < item.cost) { setMsg({ text:'Not enough tickets!', type:'error' }); return; }
    const t = tickets - item.cost; const i = [...inv, { ...item, boughtAt:Date.now() }];
    await sSet('user:' + user.username, { ...user, tickets:t, petInventory:i });
    setTickets(t); setInv(i); setMsg({ text:`✅ Bought ${item.name}!`, type:'success' });
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.surface, borderRadius:16, padding:24, maxWidth:460, width:'100%', border:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ color:T.text, fontFamily:'Syne', fontWeight:800, margin:0 }}>🛍️ Pet Shop</h2>
          <div style={{ background:`${T.amber}22`, color:T.amber, padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700 }}>🎟 {tickets}</div>
        </div>
        <Msg text={msg?.text} type={msg?.type} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {SHOP_ITEMS.map(item => {
            const owned = inv.filter(i => i.id===item.id).length;
            const can = tickets >= item.cost;
            return (
              <div key={item.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:6, textAlign:'center' }}>
                <div style={{ fontSize:32 }}>{item.emoji}</div>
                <div style={{ color:T.text, fontWeight:700, fontSize:13 }}>{item.name}</div>
                {owned > 0 && <div style={{ color:T.teal, fontSize:10 }}>Owned: {owned}</div>}
                <Btn onClick={() => buy(item)} disabled={!can} color={can ? T.teal : 'rgba(255,255,255,0.06)'} fg={can ? '#0d1825' : T.muted} style={{ justifyContent:'center' }} sm>🎟 {item.cost}</Btn>
              </div>
            );
          })}
        </div>
        <Btn onClick={onClose} color={T.card} fg={T.text} style={{ width:'100%', justifyContent:'center', marginTop:16, border:`1px solid ${T.border}` }}>Close</Btn>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [teens, setTeens] = useState([]);
  const [selectedTeen, setSelectedTeen] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [msg, setMsg] = useState(null);

  async function loadTeens() {
    const all = await sGet('allTeens') || [];
    // support both legacy assignedSW (single) and new assignedSWs (array)
    setTeens(all.filter(t => {
      const swList = t.assignedSWs || (t.assignedSW ? [t.assignedSW] : []);
      return swList.includes(user.username);
    }));
  }

  async function loadGoals(teen) {
    const g = await sGet('goals:' + teen.username) || [];
    const now = Date.now(); let changed = false;
    const processed = g.map(goal => {
      if (goal.status==='pending_completion' && goal.completionRequestedAt && (now-goal.completionRequestedAt) > 86400000) {
        changed = true; return { ...goal, status:'completed', completedAt:now };
      }
      return goal;
    });
    if (changed) await sSet('goals:' + teen.username, processed);
    setGoals(processed);
  }

  useEffect(() => { loadTeens(); }, []);

  async function selectTeen(teen) { setSelectedTeen(teen); setMsg(null); await loadGoals(teen); }

  async function approveCompletion(goal) {
    const updated = goals.map(g => g.id===goal.id ? { ...g, status:'completed', completedAt:Date.now() } : g);
    await sSet('goals:' + selectedTeen.username, updated);
    const teen = await sGet('user:' + selectedTeen.username);
    if (teen) await sSet('user:' + selectedTeen.username, { ...teen, tickets:(teen.tickets||0)+5 });
    setGoals(updated);
    setMsg({ text:`✅ Approved! ${selectedTeen.petName||selectedTeen.username} gets 5 tickets!`, type:'success' });
    setTimeout(() => setMsg(null), 3000);
  }

  async function addNote(goal) {
    if (!noteText.trim()) return;
    const updated = goals.map(g => g.id===goal.id ? { ...g, notes:[...(g.notes||[]), { text:noteText.trim(), author:user.username, timestamp:Date.now() }] } : g);
    await sSet('goals:' + selectedTeen.username, updated);
    setGoals(updated); setNoteText(''); setNoteTarget(null);
    setMsg({ text:'✅ Note added', type:'success' });
    setTimeout(() => setMsg(null), 2000);
  }

  const animal = ANIMALS.find(a => a.id===user.petType);
  const SM_COLOR = { pending:T.amber, active:T.teal, pending_completion:T.blue, completed:T.green, rejected:T.red };
  const SM_ICON  = { pending:'⏳', active:'✅', pending_completion:'🔔', completed:'🏆', rejected:'❌' };
  const SM_LABEL = { pending:'Pending mgr approval', active:'Active', pending_completion:'Needs approval', completed:'Completed', rejected:'Rejected' };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, padding:20 }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:40, background:T.surface, borderRadius:12, width:52, height:52, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${T.border}` }}>{animal?.emoji || '🤝'}</div>
            <div>
              <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:22, color:T.text, margin:0 }}>SW Dashboard</h1>
              <div style={{ color:T.muted, fontSize:12 }}>{user.petName ? `${user.petName} · ` : ''}{user.username}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ background:`${T.amber}22`, color:T.amber, padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:700 }}>🎟 {user.tickets||0}</div>
            <Btn onClick={() => setShowShop(true)} color={T.purple} fg="#fff"><ShoppingBag size={14} /> Shop</Btn>
            <Btn onClick={onLogout} color={T.red} fg="#fff"><LogOut size={14} /> Logout</Btn>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selectedTeen ? '220px 1fr' : '1fr', gap:16 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:16 }}>
            <h2 style={{ color:T.text, fontFamily:'Syne', fontSize:16, fontWeight:700, margin:'0 0 12px' }}>My Teens</h2>
            {teens.length === 0 ? (
              <div style={{ color:T.muted, fontSize:13, textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>👥</div>
                <div>No teens assigned yet</div>
                <div style={{ fontSize:11, marginTop:4 }}>Ask your manager to assign teens to you</div>
              </div>
            ) : teens.map(teen => {
              const a = ANIMALS.find(x => x.id===teen.petType);
              return (
                <button key={teen.username} onClick={() => selectTeen(teen)} style={{
                  background: selectedTeen?.username===teen.username ? `${T.teal}22` : T.card,
                  border: selectedTeen?.username===teen.username ? `1px solid ${T.teal}` : `1px solid ${T.border}`,
                  borderRadius:10, padding:12, textAlign:'left', cursor:'pointer', width:'100%',
                  display:'flex', alignItems:'center', gap:10, marginBottom:8,
                }}>
                  <span style={{ fontSize:24 }}>{a?.emoji || '👤'}</span>
                  <div>
                    <div style={{ color:T.text, fontFamily:'DM Sans', fontSize:13, fontWeight:600 }}>{teen.petName || '(no pet yet)'}</div>
                    <div style={{ color:T.muted, fontSize:11 }}>@{teen.username}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTeen && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <h2 style={{ color:T.text, fontFamily:'Syne', fontSize:20, fontWeight:800, margin:0 }}>
                    {ANIMALS.find(a=>a.id===selectedTeen.petType)?.emoji || '👤'} {selectedTeen.petName || selectedTeen.username}
                  </h2>
                  <div style={{ color:T.muted, fontSize:12 }}>@{selectedTeen.username} · 🎟 {selectedTeen.tickets||0} tickets</div>
                </div>
                <Btn onClick={() => setShowGoalModal(true)}><Plus size={14} /> New Goal</Btn>
              </div>

              {msg && <Msg text={msg.text} type={msg.type} />}

              {goals.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 20px', color:T.muted }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
                  <div>No goals yet — create the first one!</div>
                </div>
              ) : goals.map(goal => {
                const catMeta = GOAL_CATS.find(c => c.value===goal.category);
                return (
                  <div key={goal.id} style={{ background:T.card, border:`1px solid ${goal.status==='pending_completion' ? T.blue : T.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ color:T.text, fontWeight:700, fontSize:14, marginBottom:4 }}>{SM_ICON[goal.status]} {goal.title}</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <span style={{ background:`${SM_COLOR[goal.status]}22`, color:SM_COLOR[goal.status], padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{SM_LABEL[goal.status]}</span>
                          {catMeta && <span style={{ background:`${catMeta.color}22`, color:catMeta.color, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{catMeta.label}</span>}
                          <span style={{ color:T.muted, fontSize:10 }}>by @{goal.createdByUsername} · {ago(goal.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {goal.steps?.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        {goal.steps.map((s,i) => (
                          <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                            <div style={{ width:18, height:18, borderRadius:'50%', background:`${T.teal}22`, border:`1px solid ${T.teal}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.teal, fontSize:9, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                            <span style={{ color:T.textDim, fontSize:12 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {goal.notes?.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        {goal.notes.map((n,i) => (
                          <div key={i} style={{ background:T.surface, borderRadius:8, padding:'8px 10px', marginBottom:4 }}>
                            <div style={{ color:T.text, fontSize:12 }}>{n.text}</div>
                            <div style={{ color:T.muted, fontSize:10, marginTop:3 }}>@{n.author} · {ago(n.timestamp)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                      {goal.status==='pending' && <div style={{ color:T.amber, fontSize:12, fontStyle:'italic', padding:'4px 0' }}>Waiting for manager to approve…</div>}
                      {goal.status==='pending_completion' && (
                        <Btn onClick={() => approveCompletion(goal)} color={T.green} fg="#0d1825" sm><Check size={12} /> Approve Completion (+5 tickets)</Btn>
                      )}
                      {goal.status !== 'completed' && goal.status !== 'rejected' && (
                        noteTarget===goal.id ? (
                          <div style={{ display:'flex', gap:6, flex:1, minWidth:200 }}>
                            <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyPress={e => e.key==='Enter' && addNote(goal)} placeholder="Add a note..."
                              style={{ flex:1, padding:'6px 10px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontFamily:'DM Sans', fontSize:12 }} />
                            <Btn onClick={() => addNote(goal)} disabled={!noteText.trim()} sm><FileText size={12} /></Btn>
                            <Btn onClick={() => setNoteTarget(null)} color={T.card} fg={T.muted} style={{ border:`1px solid ${T.border}` }} sm><X size={12} /></Btn>
                          </div>
                        ) : (
                          <Btn onClick={() => setNoteTarget(goal.id)} color={T.surface} fg={T.teal} style={{ border:`1px solid ${T.teal}40` }} sm>
                            <FileText size={12} /> Note {goal.notes?.length > 0 ? `(${goal.notes.length})` : ''}
                          </Btn>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showGoalModal && selectedTeen && <CreateGoalModal teen={selectedTeen} swUsername={user.username} onClose={() => setShowGoalModal(false)} onCreated={() => loadGoals(selectedTeen)} />}
      {showShop && <ShopModal user={user} onClose={() => setShowShop(false)} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try { const s = await sGet('lastSession:sw'); if (s?.username) { const u = await sGet('user:' + s.username); if (u) setUser(u); } } catch (e) {}
      finally { setLoading(false); }
    }
    restore();
  }, []);

  function handleFirstLogin(u, pw) { setPending({ user:u, password:pw }); setShowPetPicker(true); setLoading(false); }

  async function handlePetPickerComplete(petData) {
    const sw = { ...pending.user, password:pending.password, ...petData, tickets:0, petInventory:[] };
    await sSet('user:' + sw.username, sw);
    await sSet('lastSession:sw', { username:sw.username });
    setUser(sw); setShowPetPicker(false);
  }

  async function handleLogin(u) { await sSet('lastSession:sw', { username:u.username }); setUser(u); }
  async function handleLogout() { await sSet('lastSession:sw', null); setUser(null); }

  if (loading) return <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color:T.teal, fontFamily:'DM Sans' }}>Loading...</div></div>;
  if (showPetPicker) return <PetPickerScreen onComplete={handlePetPickerComplete} />;
  if (!user) return <LoginScreen onLogin={handleLogin} onFirstLogin={handleFirstLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
