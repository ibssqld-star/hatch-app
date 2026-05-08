import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import {
  Plus, ChevronLeft, Check, X, Heart, Sparkles, Cookie, Gamepad2,
  Target, Users, Home as HomeIcon, ChevronRight, Lock,
  Trophy, Trash2, Ticket, Edit3, Volume2, VolumeX, ShoppingBag, Shirt, Coins, BookOpen
} from "lucide-react";
import * as Tone from "tone";

// ────────────────────────────────────────────────────────────────────────────
// THEME
// ────────────────────────────────────────────────────────────────────────────
const T = {
  bg: '#050b14',
  surface: '#0d1825',
  surfaceAlt: '#0f1c2e',
  card: '#14233a',
  cardHover: '#1a2c47',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#e8ecf3',
  textDim: '#c4cad8',
  muted: '#8a96b0',
  subtle: '#5a6378',
  teal: '#00E5B4',
  blue: '#00BFFF',
  amber: '#FFB020',
  pink: '#FF6B9D',
  purple: '#8B7CF8',
  red: '#FF5470',
  green: '#7FE787',
};

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────
const STORAGE_PREFIX = 'hatch_';
const STEP_TICKETS = 1;
const GOAL_COMPLETE_BONUS_TICKETS = 3;
const STEP_XP = 20;
const GOAL_COMPLETE_XP = 100;

// ── Surprise reward thresholds (variable ratio schedule) ──
const SURPRISE_RARE_CHANCE = 0.05;
const SURPRISE_BONUS_CHANCE = 0.20;


// ── Shop item categories ──────────────────────────────────────────────────────
const SHOP_CATEGORIES = [
  { id: 'all',       label: 'All',         emoji: '🛍️' },
  { id: 'hat',       label: 'Hats',        emoji: '🎩' },
  { id: 'accessory', label: 'Accessories', emoji: '💍' },
  { id: 'effect',    label: 'Effects',     emoji: '✨' },
];

// ── Shop items — SVG renders are in the pet's 200×200 viewBox ────────────────
// c = the item's chosen colour (not the pet's colour)
const ITEM_COLORS = [
  { hex: '#FF6B9D', name: 'Rose' },
  { hex: '#00E5B4', name: 'Mint' },
  { hex: '#FFB020', name: 'Sun' },
  { hex: '#8B7CF8', name: 'Lilac' },
  { hex: '#00BFFF', name: 'Sky' },
  { hex: '#FF5470', name: 'Coral' },
  { hex: '#7FE787', name: 'Fern' },
  { hex: '#FFFFFF', name: 'Snow' },
  { hex: '#1a0a2e', name: 'Midnight' },
  { hex: '#FFD700', name: 'Gold' },
];

function normalizeInventory(inv) {
  if (!inv) return [];
  return inv.map(i => typeof i === 'string' ? { id: i, color: ITEM_COLORS[0].hex } : i);
}
function normalizeEquipped(eq) {
  if (!eq) return {};
  const out = {};
  for (const [slot, val] of Object.entries(eq)) {
    if (!val) { out[slot] = null; continue; }
    out[slot] = typeof val === 'string' ? { id: val, color: ITEM_COLORS[0].hex } : val;
  }
  return out;
}

const SHOP_ITEMS = [
  // ─── HATS ──────────────────────────────────────────────────────────────
  {
    id: 'party_hat', name: 'Party Hat', category: 'hat', emoji: '🎉',
    cost: 5, desc: 'Every step is a celebration!',
    defaultColor: '#FF6B9D',
    render: (c) => (
      <g>
        <ellipse cx="100" cy="53" rx="28" ry="7" fill={c} opacity="0.4" />
        <path d="M 72 53 L 100 5 L 128 53 Z" fill={c} />
        <path d="M 78 44 Q 100 38 122 44" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
        <path d="M 83 32 Q 100 27 117 32" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round" />
        <circle cx="100" cy="7" r="7" fill="#FFB020" />
        <circle cx="100" cy="7" r="4" fill="#fff" opacity="0.55" />
        <text x="86" y="48" fontSize="9" fill="#fff" opacity="0.8">★</text>
        <text x="108" y="40" fontSize="8" fill="#fff" opacity="0.7">★</text>
      </g>
    ),
  },
  {
    id: 'witch_hat', name: 'Witch Hat', category: 'hat', emoji: '🧙',
    cost: 8, desc: 'Mysterious and magical.',
    defaultColor: '#8B7CF8',
    render: (c) => (
      <g>
        <ellipse cx="100" cy="53" rx="40" ry="10" fill="#1a0a2e" />
        <path d="M 72 53 L 100 3 L 128 53 Z" fill="#1a0a2e" />
        <rect x="90" y="44" width="20" height="10" rx="2" fill="#2a1040" />
        <rect x="93" y="46" width="14" height="6" rx="1" fill={c} opacity="0.85" />
        <text x="91" y="30" fontSize="8" fill={c} opacity="0.7">✦</text>
        <text x="104" y="22" fontSize="6" fill={c} opacity="0.6">✦</text>
        <ellipse cx="100" cy="51" rx="36" ry="6" fill={c} opacity="0.2" />
      </g>
    ),
  },
  {
    id: 'crown', name: 'Golden Crown', category: 'hat', emoji: '👑',
    cost: 15, desc: 'Royalty earned, never given.',
    defaultColor: '#FFB020',
    render: (c) => (
      <g>
        <path d="M 68 56 L 68 38 L 82 51 L 100 30 L 118 51 L 132 38 L 132 56 Z" fill={c} />
        <path d="M 68 56 L 132 56 L 132 63 L 68 63 Z" fill={c} opacity="0.7" />
        <circle cx="100" cy="38" r="6" fill="#fff" opacity="0.9" />
        <circle cx="100" cy="38" r="3.5" fill={c} opacity="0.6" />
        <circle cx="78" cy="50" r="4" fill="#fff" opacity="0.85" />
        <circle cx="122" cy="50" r="4" fill="#fff" opacity="0.85" />
        <path d="M 74 43 Q 84 39 80 47" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'flower_crown', name: 'Flower Crown', category: 'hat', emoji: '🌸',
    cost: 6, desc: 'Blooming with joy!',
    defaultColor: '#FF6B9D',
    render: (c) => (
      <g>
        <path d="M 62 52 Q 100 41 138 52" stroke="#4a8020" strokeWidth="4" fill="none" strokeLinecap="round" />
        {[68,82,100,118,132].map((x,i) => (
          <g key={i}>
            <circle cx={x} cy={50} r="8" fill={c} opacity={0.7+i*0.06} />
            <circle cx={x} cy={50} r="4" fill="#fff" opacity="0.65" />
          </g>
        ))}
        <ellipse cx="74" cy="57" rx="6" ry="3" fill="#5a9020" transform="rotate(-20 74 57)" opacity="0.75" />
        <ellipse cx="126" cy="57" rx="6" ry="3" fill="#5a9020" transform="rotate(20 126 57)" opacity="0.75" />
      </g>
    ),
  },
  {
    id: 'top_hat', name: 'Top Hat', category: 'hat', emoji: '🎩',
    cost: 8, desc: 'Fancy and distinguished.',
    defaultColor: '#00E5B4',
    render: (c) => (
      <g>
        <ellipse cx="100" cy="53" rx="34" ry="8" fill="#111122" />
        <rect x="74" y="18" width="52" height="36" rx="4" fill="#111122" />
        <rect x="76" y="20" width="48" height="32" rx="3" fill="#0a0a18" />
        <rect x="74" y="44" width="52" height="8" rx="2" fill={c} opacity="0.8" />
        <path d="M 80 26 Q 86 22 83 30" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round" />
      </g>
    ),
  },
  // ─── ACCESSORIES ───────────────────────────────────────────────────────
  {
    id: 'bow_tie', name: 'Bow Tie', category: 'accessory', emoji: '🎀',
    cost: 4, desc: 'Dapper and charming.',
    defaultColor: '#FF6B9D',
    render: (c) => (
      <g>
        <path d="M 74 116 Q 96 108 100 116 Q 96 124 74 116 Z" fill={c} opacity="0.9" />
        <path d="M 126 116 Q 104 108 100 116 Q 104 124 126 116 Z" fill={c} opacity="0.9" />
        <circle cx="100" cy="116" r="6" fill={c} opacity="0.7" />
        <circle cx="100" cy="116" r="3" fill="#fff" opacity="0.55" />
        <path d="M 80 113 Q 90 110 97 113" stroke="#fff" strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M 120 113 Q 110 110 103 113" stroke="#fff" strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'star_collar', name: 'Star Collar', category: 'accessory', emoji: '⭐',
    cost: 5, desc: 'Shine bright always!',
    defaultColor: '#FFB020',
    render: (c) => (
      <g>
        <path d="M 62 113 Q 100 106 138 113" stroke={c} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.85" />
        {[72,86,100,114,128].map((x,i) => (
          <text key={i} x={x} y="116" fontSize="10" fill="#fff" textAnchor="middle" opacity="0.9">★</text>
        ))}
      </g>
    ),
  },
  {
    id: 'scarf', name: 'Cozy Scarf', category: 'accessory', emoji: '🧣',
    cost: 5, desc: 'Warm and snuggly!',
    defaultColor: '#8B7CF8',
    render: (c) => (
      <g>
        <path d="M 58 112 Q 100 104 142 112 Q 140 122 100 120 Q 60 118 58 112 Z" fill={c} />
        <path d="M 60 116 Q 100 110 140 116" stroke="#fff" strokeWidth="2" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M 128 118 Q 134 134 130 148" stroke={c} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 128 118 Q 134 134 130 148" stroke="#fff" strokeWidth="2" fill="none" opacity="0.2" strokeLinecap="round" />
        {[0,3,6,9].map(i => (
          <line key={i} x1={124+i} y1="145" x2={122+i} y2="154" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
        ))}
      </g>
    ),
  },
  {
    id: 'sunglasses', name: 'Cool Shades', category: 'accessory', emoji: '😎',
    cost: 6, desc: 'Too cool for school.',
    defaultColor: '#1a0a2e',
    render: (c) => (
      <g>
        <rect x="65" y="68" width="28" height="18" rx="8" fill={c} opacity="0.92" />
        <rect x="107" y="68" width="28" height="18" rx="8" fill={c} opacity="0.92" />
        <line x1="93" y1="76" x2="107" y2="76" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
        <line x1="65" y1="76" x2="54" y2="74" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <line x1="135" y1="76" x2="146" y2="74" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <path d="M 71 72 Q 77 70 74 76" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M 113 72 Q 119 70 116 76" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'cape', name: 'Hero Cape', category: 'accessory', emoji: '🦸',
    cost: 10, desc: 'Every goal is heroic.',
    defaultColor: '#00BFFF',
    render: (c) => (
      <g>
        <path d="M 60 110 Q 58 158 70 186 Q 100 196 130 186 Q 142 158 140 110 Q 120 118 100 114 Q 80 118 60 110 Z" fill={c} opacity="0.85" />
        <path d="M 68 114 Q 68 154 77 180 Q 100 190 123 180 Q 132 154 132 114 Q 116 120 100 117 Q 84 120 68 114 Z" fill="#0d1825" opacity="0.42" />
        <circle cx="100" cy="112" r="6" fill="#FFB020" />
        <circle cx="100" cy="112" r="3.5" fill="#ffd060" opacity="0.8" />
        <path d="M 72 150 Q 100 144 128 150" stroke={c} strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
      </g>
    ),
  },
  // ─── EFFECTS ───────────────────────────────────────────────────────────
  {
    id: 'sparkle_aura', name: 'Sparkle Aura', category: 'effect', emoji: '✨',
    cost: 8, desc: 'Dazzle the whole world!',
    defaultColor: '#FFB020',
    render: (c) => (
      <g>
        {[{x:28,y:62,s:13,d:0},{x:172,y:57,s:11,d:0.3},{x:20,y:132,s:10,d:0.6},
          {x:178,y:127,s:12,d:0.9},{x:40,y:182,s:10,d:0.4},{x:158,y:177,s:11,d:0.7},
          {x:90,y:20,s:10,d:0.2},{x:115,y:18,s:8,d:0.8}].map((sp,i) => (
          <text key={i} x={sp.x} y={sp.y} fontSize={sp.s} fill={c} textAnchor="middle"
            opacity="0.75" style={{ animation: `sleepZ ${1.2+sp.d*1.4}s ease-in-out infinite` }}>✦</text>
        ))}
      </g>
    ),
  },
  {
    id: 'heart_aura', name: 'Love Hearts', category: 'effect', emoji: '💕',
    cost: 6, desc: 'Spread the love!',
    defaultColor: '#FF6B9D',
    render: (c) => (
      <g>
        {[{x:30,y:82,s:12,d:0},{x:168,y:77,s:10,d:0.4},{x:22,y:147,s:13,d:0.8},
          {x:176,y:142,s:11,d:0.2},{x:60,y:22,s:10,d:0.6},{x:138,y:20,s:12,d:1.0}].map((h,i) => (
          <text key={i} x={h.x} y={h.y} fontSize={h.s} fill={c} textAnchor="middle"
            opacity="0.8" style={{ animation: `sleepZ ${1.4+h.d*1.2}s ease-in-out infinite` }}>♥</text>
        ))}
      </g>
    ),
  },
  {
    id: 'dark_smoke', name: 'Shadow Smoke', category: 'effect', emoji: '🌑',
    cost: 8, desc: 'Mysterious dark energy.',
    defaultColor: '#8B7CF8',
    render: (c) => (
      <g opacity="0.6">
        {[{cx:28,cy:122,rx:22,ry:13},{cx:172,cy:117,rx:20,ry:11},{cx:22,cy:162,rx:18,ry:10},
          {cx:176,cy:160,rx:19,ry:10},{cx:48,cy:182,rx:15,ry:8},{cx:152,cy:180,rx:16,ry:8}].map((s,i) => (
          <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={c} opacity="0.6"
            style={{ animation: `sleepZ ${1.6+(i*0.3)}s ease-in-out infinite` }} />
        ))}
      </g>
    ),
  },
  {
    id: 'rainbow_glow', name: 'Rainbow Glow', category: 'effect', emoji: '🌈',
    cost: 10, desc: 'All the colours of you!',
    defaultColor: '#FF5555',
    render: (c) => (
      <g>
        {['#FF5555','#FFB020','#FFE030','#50E060','#30C0FF','#9050FF'].map((rc,i) => (
          <circle key={i} cx="100" cy="100" r={104-i*7} fill="none" stroke={rc}
            strokeWidth="4" opacity="0.28" />
        ))}
      </g>
    ),
  },
];
const RARE_SURPRISES = [
  { msg: (pet) => `✨ ${pet} did something magical!`, extra: 2 },
  { msg: (pet) => `🌟 ${pet} found a hidden star!`, extra: 2 },
  { msg: (pet) => `🎁 A mystery gift appeared!`, extra: 2 },
  { msg: (pet) => `⚡ ${pet} levelled up their energy!`, extra: 2 },
];

const BONUS_SURPRISES = [
  { msg: () => `🎉 Bonus ticket! Keep going!`, extra: 1 },
  { msg: (pet) => `💛 ${pet} is extra happy!`, extra: 1 },
  { msg: () => `⭐ Lucky step — bonus ticket!`, extra: 1 },
  { msg: (pet) => `🐾 ${pet} noticed your effort!`, extra: 1 },
];

function rollSurprise(petName) {
  const r = Math.random();
  if (r < SURPRISE_RARE_CHANCE) {
    const pick = RARE_SURPRISES[Math.floor(Math.random() * RARE_SURPRISES.length)];
    return { type: 'rare', msg: pick.msg(petName), extra: pick.extra };
  }
  if (r < SURPRISE_BONUS_CHANCE) {
    const pick = BONUS_SURPRISES[Math.floor(Math.random() * BONUS_SURPRISES.length)];
    return { type: 'bonus', msg: pick.msg(petName), extra: pick.extra };
  }
  return null;
}

// ── Pet mood based on recent goal activity ──
function getPetMood(user) {
  if (!user.hatched) return 'awake';
  const last = user.lastStepCompletedAt;
  if (!last) {
    return (user.tickets || 0) > 0 ? 'awake' : 'sleep';
  }
  const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
  if (daysSince < 1) return 'happy';
  if (daysSince < 3) return 'awake';
  return 'sleep'; // gentle: "misses you"
}

function getPetStatusText(user) {
  if (!user.hatched) return `${user.petName} is in their egg`;
  const last = user.lastStepCompletedAt;
  const daysSince = last ? (Date.now() - last) / (1000 * 60 * 60 * 24) : Infinity;
  if (daysSince < 1) return `${user.petName} is glowing! ✨`;
  if (daysSince < 3) return `${user.petName} is ready!`;
  if (daysSince < 5) return `${user.petName} misses you 💛`;
  return `${user.petName} is waiting for you…`;
}

const COMMON_OBSTACLES = [
  { id: 'sensory', label: 'Too loud / too bright', emoji: '🔊' },
  { id: 'social', label: 'Too many people around', emoji: '👥' },
  { id: 'transport', label: 'Getting there', emoji: '🚗' },
  { id: 'energy', label: 'Low energy day', emoji: '🪫' },
  { id: 'time', label: 'Not enough time', emoji: '⏰' },
  { id: 'unsure', label: 'Not sure what to do first', emoji: '🤔' },
  { id: 'nervous', label: 'Feeling nervous', emoji: '😰' },
  { id: 'change', label: 'Plans changing last minute', emoji: '🔄' },
];

const ANIMALS = [
  { id: 'dog', name: 'Dog', emoji: '🐕', kind: 'real' },
  { id: 'cat', name: 'Cat', emoji: '🐈', kind: 'real' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', kind: 'real' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', kind: 'fantasy' },
  { id: 'phoenix', name: 'Phoenix', emoji: '🔥', kind: 'fantasy' },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', kind: 'fantasy' },
  { id: 'mystery', name: 'Mystery', emoji: '❓', kind: 'mystery' },
];

const REAL_ANIMALS = ANIMALS.filter(a => a.id !== 'mystery');

function resolveMystery() {
  const type = REAL_ANIMALS[Math.floor(Math.random() * REAL_ANIMALS.length)].id;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)].hex;
  return { type, color };
}

const COLORS = [
  { hex: '#00E5B4', name: 'Mint' },
  { hex: '#FF6B9D', name: 'Rose' },
  { hex: '#FFB020', name: 'Sun' },
  { hex: '#8B7CF8', name: 'Lilac' },
  { hex: '#00BFFF', name: 'Sky' },
  { hex: '#FF5470', name: 'Coral' },
  { hex: '#7FE787', name: 'Fern' },
  { hex: '#FFC857', name: 'Honey' },
];

const INTERACTIONS = [
  { id: 'treat', label: 'Treat', icon: Cookie, color: T.amber, msg: 'munching!' },
  { id: 'cuddle', label: 'Cuddle', icon: Heart, color: T.pink, msg: 'so happy!' },
  { id: 'play', label: 'Play', icon: Gamepad2, color: T.blue, msg: 'wheee!' },
  { id: 'groom', label: 'Groom', icon: Sparkles, color: T.purple, msg: 'sparkly!' },
];

// ── PET GOAL CATALOGUE ── curated, mirrors teen life-skills categories ──────
const PET_GOALS = [
  {
    id: 'pg_crumbs',
    emoji: '🧹',
    title: 'cleaned up their crumbs',
    narrative: (n) => `${n} finished their snack and then cleaned up every last crumb — without being asked.`,
    prompt: (n) => `Give ${n} a treat for being so tidy!`,
    preferred: 'treat',
    color: T.amber,
  },
  {
    id: 'pg_bedtime',
    emoji: '💤',
    title: 'went to bed on time',
    narrative: (n) => `${n} was tired and went straight to bed when it was time — no fussing, no delays. Just like that.`,
    prompt: (n) => `${n} deserves a cuddle before they sleep.`,
    preferred: 'cuddle',
    color: T.blue,
  },
  {
    id: 'pg_teeth',
    emoji: '🪥',
    title: 'brushed their teeth',
    narrative: (n) => `${n} brushed their little teeth all by themselves today — didn't need reminding even once!`,
    prompt: (n) => `${n} did great — show them with a groom!`,
    preferred: 'groom',
    color: T.teal,
  },
  {
    id: 'pg_wash',
    emoji: '🚿',
    title: 'had a wash without any fuss',
    narrative: (n) => `${n} had their wash today and didn't complain once. Absolute legend.`,
    prompt: (n) => `${n} earned some play time for that!`,
    preferred: 'play',
    color: T.purple,
  },
  {
    id: 'pg_toys',
    emoji: '🧦',
    title: 'put their toys away',
    narrative: (n) => `${n} finished playing and tidied everything up — every single toy back in its place.`,
    prompt: (n) => `Give ${n} a treat for being so responsible!`,
    preferred: 'treat',
    color: T.teal,
  },
  {
    id: 'pg_food',
    emoji: '🥦',
    title: 'tried a new food',
    narrative: (n) => `${n} tried something new at dinner. A little nervous at first — but they did it anyway.`,
    prompt: (n) => `Give ${n} some extra love for being brave!`,
    preferred: 'cuddle',
    color: '#7FE787',
  },
  {
    id: 'pg_cuddle_ask',
    emoji: '🫂',
    title: 'asked for a cuddle when overwhelmed',
    narrative: (n) => `${n} was feeling a lot — and instead of shutting down, they came and asked for a cuddle. That took real courage.`,
    prompt: (n) => `${n} asked for help. Give them that cuddle — they earned it.`,
    preferred: 'cuddle',
    color: T.pink,
  },
];

function formatTickets(t) {
  if (!t || t <= 0) return '0 tickets';
  const whole = Math.floor(t);
  const hasHalf = t - whole >= 0.4;
  if (whole === 0 && hasHalf) return '½ ticket';
  if (!hasHalf) return `${whole} ${whole === 1 ? 'ticket' : 'tickets'}`;
  return `${whole}½ tickets`;
}

const SENSORY_DIMENSIONS = [
  { id: 'lights',      emoji: '💡', label: 'Bright lights',          obstacleLabel: 'Bright lights' },
  { id: 'noise',       emoji: '🔊', label: 'Loud noise',             obstacleLabel: 'Too loud' },
  { id: 'crowds',      emoji: '👥', label: 'Lots of people',         obstacleLabel: 'Too many people around' },
  { id: 'textures',    emoji: '🧶', label: 'Clothes and textures',   obstacleLabel: 'Itchy / uncomfortable clothes' },
  { id: 'transitions', emoji: '🔄', label: 'Plans changing',         obstacleLabel: 'Plans changing last minute' },
  { id: 'energy',      emoji: '🪫', label: 'Energy through the day', obstacleLabel: 'Low energy day' },
];

const SENSORY_RATINGS = [
  { id: 'fine',   label: 'Pretty okay',  emoji: '👍', color: T.teal  },
  { id: 'tricky', label: 'A bit tricky', emoji: '🤔', color: T.amber },
  { id: 'hard',   label: 'Really hard',  emoji: '😣', color: T.red   },
];

const UNIVERSAL_OBSTACLES = [
  { id: 'transport', label: 'Getting there',           emoji: '🚗' },
  { id: 'time',      label: 'Not enough time',         emoji: '⏰' },
  { id: 'unsure',    label: 'Not sure what to do first', emoji: '🤔' },
  { id: 'nervous',   label: 'Feeling nervous',         emoji: '😰' },
];

const WHY_ANCHORS = [
  { id: 'special_interest', emoji: '🎮', label: 'It connects to something I love' },
  { id: 'person',           emoji: '👤', label: 'Someone I care about' },
  { id: 'routine',          emoji: '🔄', label: "It's part of my routine" },
  { id: 'thing',            emoji: '🎯', label: 'I want this thing or to go to this place' },
  { id: 'mastery',          emoji: '💪', label: 'I just want to know I can' },
  { id: 'free_text',        emoji: '✏️', label: 'Something else' },
];

const GOAL_CATEGORIES = [
  { id: 'emotional',  emoji: '😊', label: 'Emotional',     sub: 'Big feelings, calming down' },
  { id: 'home_care',  emoji: '🧹', label: 'Home & self-care', sub: 'Cleaning, dishes, hygiene' },
  { id: 'cooking',    emoji: '🍳', label: 'Cooking & food', sub: 'Meals, kitchen, food choices' },
  { id: 'social',     emoji: '👥', label: 'Social',         sub: 'Friends, family, conversations' },
  { id: 'community',  emoji: '🚗', label: 'Out & about',    sub: 'Shops, transport, appointments' },
  { id: 'school_work',emoji: '💼', label: 'School & work',  sub: 'Study, jobs, routines' },
  { id: 'body',       emoji: '💪', label: 'Body & movement', sub: 'Sleep, exercise, energy' },
  { id: 'other',      emoji: '🎯', label: 'Something else', sub: "Doesn't quite fit" },
];

const PREDICTABILITY_FIELDS = [
  { key: 'when',    emoji: '🕐', label: 'When',     placeholder: 'e.g. after dinner, 9am Saturday' },
  { key: 'where',   emoji: '📍', label: 'Where',    placeholder: 'e.g. kitchen at home' },
  { key: 'who',     emoji: '👤', label: 'Who with', placeholder: 'e.g. alone, with mum, with Tui' },
  { key: 'howLong', emoji: '⏱️', label: 'How long', placeholder: 'e.g. 5 minutes, about 15 mins' },
];

function getPersonalizedObstacles(user) {
  const ratings = user?.sensoryProfile?.ratings || {};
  const personalized = [];
  for (const dim of SENSORY_DIMENSIONS) {
    const r = ratings[dim.id];
    if (r === 'hard' || r === 'tricky') {
      personalized.push({
        id: 'sens_' + dim.id,
        label: dim.obstacleLabel,
        emoji: dim.emoji,
        priority: r === 'hard' ? 0 : 1,
      });
    }
  }
  if (personalized.length === 0) return COMMON_OBSTACLES;
  personalized.sort((a, b) => a.priority - b.priority);
  return [...personalized, ...UNIVERSAL_OBSTACLES];
}

// ────────────────────────────────────────────────────────────────────────────
// STORAGE
// ────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://xwmvocuwjniitkwcfjkp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXZvY3V3am5paXRrd2NmamtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDA3NDMsImV4cCI6MjA5MzcxNjc0M30.7957DOcu_yKxo9ot-TZOo5MNHfbgQYiv4WMLf17Bj2Y';
const SB_HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

async function storageGet(key) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/hatch_data?key=eq.${encodeURIComponent(STORAGE_PREFIX + key)}&select=value`, { headers: SB_HEADERS });
    const rows = await res.json();
    return rows.length > 0 ? rows[0].value : null;
  } catch (e) {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key)); } catch (e2) { return null; }
  }
}
async function storageSet(key, value) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/hatch_data`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: STORAGE_PREFIX + key, value: value }),
    });
    return true;
  } catch (e) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); return true; } catch (e2) { return false; }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PET COMPONENTS — sticker style with stubby beans, half-lidded loaf eyes, scary variant
// All render in a 200×200 viewBox.
// Mood: 'awake' (default standing) | 'happy' (eyes closed in joy) | 'sleep' (loaf pose)
// Variant: 'cute' (full-color) | 'dark' (scary blood-red/black with glowing red eyes)
// ────────────────────────────────────────────────────────────────────────────

const STROKE = '#0d1825';
const DARK_BODY = '#1a0810';
const DARK_BELLY = '#3a1015';
const DARK_DARKER = '#0a0408';
const RED_GLOW = '#FF1010';
const FANG = '#fff';
const TOE_BEAN = '#FFC0D8';

// Helper: pick body color based on variant
function bodyFill(color, variant) {
  return variant === 'dark' ? DARK_BODY : color;
}
function bellyFill(color, variant) {
  return variant === 'dark' ? DARK_BELLY : color;
}

// Helper: standing-pose eyes (big round black eyes / happy ^^ / dark glow slit)
function StandingEyes({ cx, cy, mood, variant }) {
  if (mood === 'happy') {
    return (
      <>
        <path d={`M ${cx-7} ${cy+2} Q ${cx} ${cy-5} ${cx+7} ${cy+2}`} stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (variant === 'dark') {
    return (
      <>
        <ellipse cx={cx} cy={cy} rx="6" ry="8" fill={DARK_DARKER} stroke={RED_GLOW} strokeWidth="1.5" />
        <ellipse cx={cx} cy={cy} rx="1.6" ry="6.5" fill={RED_GLOW} style={{ filter: `drop-shadow(0 0 3px ${RED_GLOW})`, animation: 'eyeFlicker 4s infinite' }} />
        <circle cx={cx-1} cy={cy-3} r="0.8" fill="#fff" />
      </>
    );
  }
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="6" ry="8" fill={STROKE} />
      <circle cx={cx+2} cy={cy-2} r="2.2" fill="#fff" />
      <circle cx={cx-2} cy={cy+3} r="1" fill="#fff" />
    </>
  );
}

// Helper: half-lidded loaf eyes (peaceful sleeping/lonely)
function LoafEyes({ cx, cy, variant }) {
  if (variant === 'dark') {
    return (
      <path d={`M ${cx-6} ${cy} Q ${cx} ${cy+3} ${cx+6} ${cy}`}
        stroke={RED_GLOW} strokeWidth="2.4" fill="none" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 2px ${RED_GLOW})`, animation: 'eyeFlicker 4s infinite' }} />
    );
  }
  return (
    <>
      <path d={`M ${cx-6} ${cy} Q ${cx} ${cy+3} ${cx+6} ${cy}`} stroke={STROKE} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d={`M ${cx-5} ${cy-2} Q ${cx} ${cy-3} ${cx+5} ${cy-2}`} stroke={STROKE} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

// Helper: stubby bean leg with toe beans
function BeanLeg({ cx, cy, w = 10, h = 11, color, variant }) {
  const fill = bodyFill(color, variant);
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={w} ry={h} fill={fill} stroke={STROKE} strokeWidth="2.5" />
      <ellipse cx={cx} cy={cy + h - 2} rx={w-2} ry="2.5" fill={STROKE} />
      {variant === 'cute' && (
        <>
          <circle cx={cx-3} cy={cy + h - 3} r="1" fill={TOE_BEAN} />
          <circle cx={cx} cy={cy + h - 2.5} r="1" fill={TOE_BEAN} />
          <circle cx={cx+3} cy={cy + h - 3} r="1" fill={TOE_BEAN} />
        </>
      )}
      {variant === 'dark' && (
        <>
          <path d={`M ${cx-4} ${cy + h - 1} L ${cx-5} ${cy + h + 3}`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M ${cx} ${cy + h - 1} L ${cx} ${cy + h + 3}`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M ${cx+4} ${cy + h - 1} L ${cx+5} ${cy + h + 3}`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </>
  );
}

// Helper: front loaf paw (flat, just paw bottom visible)
function LoafPaw({ cx, cy, color, variant }) {
  const fill = bodyFill(color, variant);
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="9" ry="4" fill={fill} stroke={STROKE} strokeWidth="2.5" />
      {variant === 'cute' && (
        <>
          <circle cx={cx-4} cy={cy+1} r="0.9" fill={TOE_BEAN} />
          <circle cx={cx} cy={cy+1.5} r="0.9" fill={TOE_BEAN} />
          <circle cx={cx+4} cy={cy+1} r="0.9" fill={TOE_BEAN} />
        </>
      )}
      {variant === 'dark' && (
        <>
          <path d={`M ${cx-4} ${cy+3} L ${cx-5} ${cy+6}`} stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M ${cx} ${cy+3} L ${cx} ${cy+6}`} stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M ${cx+4} ${cy+3} L ${cx+5} ${cy+6}`} stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  );
}

// Helper: cheek blush
function CheekBlush({ cx, cy, r = 4, opacity = 0.45, variant, color }) {
  if (variant === 'dark') {
    return <path d={`M ${cx-3} ${cy} Q ${cx} ${cy-2} ${cx+3} ${cy} Q ${cx} ${cy+2} ${cx-3} ${cy} Z`} fill="#5a1020" opacity="0.7" />;
  }
  return <circle cx={cx} cy={cy} r={r} fill="#FF6B9D" opacity={opacity} />;
}

// Helper: spiked collar with skull tag (dark variant only)
function SpikedCollar({ cx, cy, w = 32 }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={w} ry="3.5" fill="#3a1015" stroke={STROKE} strokeWidth="1.8" />
      {Array.from({ length: 5 }).map((_, i) => {
        const x = cx - w * 0.7 + i * (w * 0.35);
        return <path key={i} d={`M ${x-2} ${cy} L ${x} ${cy-7} L ${x+2} ${cy} Z`} fill="#888" stroke={STROKE} strokeWidth="1" />;
      })}
      <circle cx={cx} cy={cy+5} r="3" fill="#888" stroke={STROKE} strokeWidth="1.2" />
      <circle cx={cx-1} cy={cy+4} r="0.6" fill={STROKE} />
      <circle cx={cx+1} cy={cy+4} r="0.6" fill={STROKE} />
    </>
  );
}

// Helper: scary mouth with two fangs
function FangMouth({ cx, cy }) {
  return (
    <>
      <path d={`M ${cx-7} ${cy} Q ${cx} ${cy+8} ${cx+7} ${cy} L ${cx+5} ${cy+4} L ${cx+2} ${cy+2} L ${cx} ${cy+5} L ${cx-2} ${cy+2} L ${cx-5} ${cy+4} Z`} fill={DARK_DARKER} />
      <path d={`M ${cx-4} ${cy+1} L ${cx-3} ${cy+5} L ${cx-2} ${cy+1} Z`} fill={FANG} />
      <path d={`M ${cx+2} ${cy+1} L ${cx+3} ${cy+5} L ${cx+4} ${cy+1} Z`} fill={FANG} />
    </>
  );
}

// Helper: cute pink triangle nose
function PinkNose({ cx, cy, dark = false }) {
  const fill = dark ? DARK_DARKER : '#FF6B9D';
  return <path d={`M ${cx-3} ${cy} L ${cx} ${cy-2.5} L ${cx+3} ${cy} Z`} fill={fill} stroke={STROKE} strokeWidth="1.2" strokeLinejoin="round" />;
}

// Helper: smoke wisp behind dark pet
function SmokeWisp({ cx, cy }) {
  return (
    <ellipse cx={cx} cy={cy} rx="4" ry="8" fill="rgba(80,30,30,0.4)" opacity="0.5" />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DOG — floppy ears, snout w/ tongue, fast wagging tail
// ────────────────────────────────────────────────────────────────────────────
function Dog({ color, mood = 'awake', chewing = false, variant = 'cute', wingFlap = false }) {
  const fill = bodyFill(color, variant);
  const isLoaf = mood === 'sleep';
  const isDark = variant === 'dark';

  if (isLoaf) {
    return (
      <g>
        {/* Smoke for dark */}
        {isDark && <SmokeWisp cx={50} cy={130} />}
        {/* Slow lazy tail */}
        <g style={{ transformOrigin: '155px 145px', animation: 'tailLazyWag 4s ease-in-out infinite' }}>
          <path d={`M 155 145 Q 178 147 184 132`} stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M 155 145 Q 178 147 184 132`} stroke={fill} strokeWidth="8" fill="none" strokeLinecap="round" />
          {!isDark && <circle cx="184" cy="133" r="4" fill={color} stroke={STROKE} strokeWidth="1.5" />}
        </g>
        <g style={{ transformOrigin: '100px 130px', animation: 'loafBreathe 4.5s ease-in-out infinite' }}>
          {/* Loaf body — trapezoid */}
          <path d={`M 40 188 L 44 145 Q 46 115 70 105 Q 100 96 130 105 Q 154 115 156 145 L 160 188 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          {/* Belly highlight */}
          <ellipse cx="100" cy="160" rx="22" ry="14" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.32} />
          {isDark && <line x1="88" y1="155" x2="112" y2="155" stroke="#000" strokeWidth="0.6" opacity="0.5" />}
          {isDark && <line x1="88" y1="165" x2="112" y2="165" stroke="#000" strokeWidth="0.6" opacity="0.5" />}
          {/* Front paws */}
          <LoafPaw cx={82} cy={188} color={color} variant={variant} />
          <LoafPaw cx={118} cy={188} color={color} variant={variant} />
          {/* Floppy droopy ears */}
          <path d={`M 56 88 Q 50 115 56 138 Q 64 145 72 138 Q 74 110 70 86 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M 144 88 Q 150 115 144 138 Q 136 145 128 138 Q 126 110 130 86 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          {isDark && <path d={`M 53 100 L 57 105 L 52 110`} fill={DARK_DARKER} />}
          {/* Head — low and forward */}
          <path d={`M 60 120 Q 58 92 80 86 Q 100 81 120 86 Q 142 92 140 120 Q 137 138 100 140 Q 63 138 60 120 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          {isDark && <line x1="118" y1="92" x2="130" y2="115" stroke="#5a1020" strokeWidth="1.2" strokeLinecap="round" />}
          {/* Half-lidded eyes */}
          <LoafEyes cx={80} cy={113} variant={variant} />
          <LoafEyes cx={120} cy={113} variant={variant} />
          {/* Snout */}
          <ellipse cx="100" cy="125" rx="13" ry="9" fill={isDark ? DARK_DARKER : '#fff'} opacity={isDark ? 1 : 0.4} stroke={STROKE} strokeWidth="2" />
          <ellipse cx="100" cy="120" rx="4" ry="2.5" fill={STROKE} />
          {/* Mouth */}
          <path d={`M 92 130 Q 100 135 108 130`} stroke={STROKE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {isDark && <path d={`M 96 132 L 98 138 L 100 132 Z`} fill={FANG} />}
          {/* Cheeks */}
          {!isDark && (
            <>
              <CheekBlush cx={68} cy={120} variant={variant} />
              <CheekBlush cx={132} cy={120} variant={variant} />
            </>
          )}
          {isDark && <SpikedCollar cx={100} cy={138} w={26} />}
        </g>
      </g>
    );
  }

  // STANDING POSE
  return (
    <g>
      {isDark && <SmokeWisp cx={50} cy={70} />}
      {/* Wagging tail */}
      <g style={{ transformOrigin: '148px 130px', animation: chewing ? 'none' : 'tailWagDog 0.6s ease-in-out infinite' }}>
        <path d={`M 148 130 Q 172 118 180 95`} stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M 148 130 Q 172 118 180 95`} stroke={fill} strokeWidth="8" fill="none" strokeLinecap="round" />
        {!isDark && <circle cx="180" cy="96" r="4" fill={color} stroke={STROKE} strokeWidth="1.5" />}
        {isDark && <path d={`M 175 92 L 184 86 L 184 102 Z`} fill={fill} stroke={STROKE} strokeWidth="1.5" />}
      </g>
      {/* Body */}
      <ellipse cx="100" cy="135" rx="40" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <ellipse cx="100" cy="148" rx="24" ry="14" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.32} />
      {isDark && (
        <>
          <line x1="86" y1="135" x2="114" y2="135" stroke="#000" strokeWidth="0.5" opacity="0.45" />
          <line x1="86" y1="145" x2="114" y2="145" stroke="#000" strokeWidth="0.5" opacity="0.45" />
        </>
      )}
      {/* Stubby legs */}
      <BeanLeg cx={72} cy={172} w={9} h={11} color={color} variant={variant} />
      <BeanLeg cx={92} cy={176} w={8} h={10} color={color} variant={variant} />
      <BeanLeg cx={108} cy={176} w={8} h={10} color={color} variant={variant} />
      <BeanLeg cx={128} cy={172} w={9} h={11} color={color} variant={variant} />
      {/* Floppy ears */}
      <path d={`M 60 60 Q 52 78 56 100 Q 64 110 74 105 Q 78 82 72 62 Z`}
        fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
      <path d={`M 140 60 Q 148 78 144 100 Q 136 110 126 105 Q 122 82 128 62 Z`}
        fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
      {isDark && <path d={`M 56 78 L 60 84 L 55 90`} fill={DARK_DARKER} />}
      {!isDark && (
        <>
          <path d={`M 64 70 Q 62 88 67 100 Q 70 88 70 72 Z`} fill="#FF8FB0" opacity="0.6" />
          <path d={`M 136 70 Q 138 88 133 100 Q 130 88 130 72 Z`} fill="#FF8FB0" opacity="0.6" />
        </>
      )}
      {/* Head */}
      <circle cx="100" cy="80" r="38" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      {isDark && <line x1="118" y1="58" x2="132" y2="80" stroke="#5a1020" strokeWidth="1.5" strokeLinecap="round" />}
      {/* Eyes */}
      <StandingEyes cx={84} cy={75} mood={mood} variant={variant} />
      <StandingEyes cx={116} cy={75} mood={mood} variant={variant} />
      {/* Snout */}
      {chewing ? (
        <g style={{ animation: 'chewJaw 0.25s ease-in-out infinite', transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="15" ry="11" fill={STROKE} />
          <ellipse cx="100" cy="102" rx="13" ry="8" fill="#8B1a1a" />
          <rect x="92" y="96" width="7" height="6" rx="2" fill="#f0f0e0" />
          <rect x="101" y="96" width="7" height="6" rx="2" fill="#f0f0e0" />
        </g>
      ) : (
        <>
          <ellipse cx="100" cy="100" rx="15" ry="11" fill={isDark ? DARK_DARKER : '#fff'} opacity={isDark ? 1 : 0.5} stroke={STROKE} strokeWidth="2.2" />
          <ellipse cx="100" cy="93" rx="5" ry="3.5" fill={STROKE} />
          {!isDark && (
            <>
              <path d={`M 90 104 Q 100 113 110 104`} stroke={STROKE} strokeWidth="2" fill="none" strokeLinecap="round" />
              {mood === 'happy' && <ellipse cx="100" cy="110" rx="3.5" ry="2.5" fill="#FF6B9D" />}
            </>
          )}
          {isDark && (
            <>
              <FangMouth cx={100} cy={106} />
            </>
          )}
        </>
      )}
      {/* Cheeks */}
      {!isDark && (
        <>
          <CheekBlush cx={66} cy={92} variant={variant} />
          <CheekBlush cx={134} cy={92} variant={variant} />
        </>
      )}
      {/* Dark collar */}
      {isDark && !chewing && <SpikedCollar cx={100} cy={120} w={28} />}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CAT — pointed ears, slim S-tail (swishes), whiskers, half-lidded loaf face
// ────────────────────────────────────────────────────────────────────────────
function Cat({ color, mood = 'awake', chewing = false, variant = 'cute', wingFlap = false }) {
  const fill = bodyFill(color, variant);
  const isLoaf = mood === 'sleep';
  const isDark = variant === 'dark';
  const tailTipColor = isDark ? '#5a1020' : color;

  if (isLoaf) {
    return (
      <g>
        {isDark && <SmokeWisp cx={50} cy={130} />}
        {/* Swishing tail */}
        <g style={{ transformOrigin: '156px 165px', animation: 'tailSwishCat 4s ease-in-out infinite' }}>
          <path d={`M 156 165 Q 184 167 188 152 Q 190 142 184 138`}
            stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M 156 165 Q 184 167 188 152 Q 190 142 184 138`}
            stroke={fill} strokeWidth="8" fill="none" strokeLinecap="round" />
          {!isDark && <circle cx="184" cy="139" r="4" fill="#fff" opacity="0.5" />}
          {isDark && <path d={`M 178 134 L 188 124 L 188 144 Z`} fill={fill} stroke={STROKE} strokeWidth="1.2" />}
        </g>
        <g style={{ transformOrigin: '100px 130px', animation: 'loafBreathe 4.5s ease-in-out infinite' }}>
          {/* Loaf body */}
          <path d={`M 40 188 L 44 145 Q 46 115 70 105 Q 100 96 130 105 Q 154 115 156 145 L 160 188 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <ellipse cx="100" cy="160" rx="22" ry="14" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.32} />
          {isDark && (
            <>
              <path d={`M 60 140 Q 65 148 62 156`} stroke={DARK_DARKER} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
              <path d={`M 140 140 Q 135 148 138 156`} stroke={DARK_DARKER} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
            </>
          )}
          <LoafPaw cx={82} cy={188} color={color} variant={variant} />
          <LoafPaw cx={118} cy={188} color={color} variant={variant} />
          {/* Pointed ears */}
          <path d={`M 64 90 L 72 60 L 88 88 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M 136 90 L 128 60 L 112 88 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          {!isDark && (
            <>
              <path d={`M 70 84 L 73 70 L 82 84 Z`} fill="#FF8FB0" />
              <path d={`M 130 84 L 127 70 L 118 84 Z`} fill="#FF8FB0" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 70 84 L 73 70 L 82 84 Z`} fill="#5a1020" />
              <path d={`M 130 84 L 127 70 L 118 84 Z`} fill="#5a1020" />
              <path d={`M 64 70 L 70 73 L 64 78`} fill={DARK_DARKER} />
              <circle cx="124" cy="68" r="2" fill="none" stroke="#888" strokeWidth="1.2" />
            </>
          )}
          {/* Head */}
          <path d={`M 60 120 Q 58 92 80 86 Q 100 81 120 86 Q 142 92 140 120 Q 137 138 100 140 Q 63 138 60 120 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          {isDark && <line x1="118" y1="92" x2="132" y2="115" stroke="#5a1020" strokeWidth="1.2" strokeLinecap="round" />}
          <LoafEyes cx={80} cy={113} variant={variant} />
          <LoafEyes cx={120} cy={113} variant={variant} />
          <PinkNose cx={100} cy={124} dark={isDark} />
          <path d={`M 100 126 L 100 129`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          {!isDark && (
            <>
              <path d={`M 100 129 Q 96 132 92 131`} stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d={`M 100 129 Q 104 132 108 131`} stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {isDark && <path d={`M 96 132 L 98 138 L 100 132 Z`} fill={FANG} />}
          {/* Whiskers */}
          <line x1="68" y1="124" x2="56" y2="123" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="68" y1="128" x2="55" y2="129" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="132" y1="124" x2={isDark ? "140" : "144"} y2="123" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="132" y1="128" x2={isDark ? "140" : "145"} y2="129" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          {!isDark && (
            <>
              <CheekBlush cx={68} cy={120} variant={variant} />
              <CheekBlush cx={132} cy={120} variant={variant} />
            </>
          )}
        </g>
      </g>
    );
  }

  // STANDING POSE
  return (
    <g>
      {isDark && <SmokeWisp cx={50} cy={70} />}
      {/* S-curve swishing tail */}
      <g style={{ transformOrigin: '148px 135px', animation: chewing ? 'none' : 'tailSwishCat 3s ease-in-out infinite' }}>
        <path d={`M 148 135 Q 178 130 184 105 Q 186 88 174 85 Q 168 86 172 92`}
          stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M 148 135 Q 178 130 184 105 Q 186 88 174 85 Q 168 86 172 92`}
          stroke={fill} strokeWidth="8" fill="none" strokeLinecap="round" />
        {!isDark && <circle cx="174" cy="86" r="4" fill="#fff" opacity="0.4" />}
        {isDark && <path d={`M 168 80 L 178 73 L 178 92 Z`} fill={fill} stroke={STROKE} strokeWidth="1.2" />}
      </g>
      <ellipse cx="100" cy="135" rx="38" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <ellipse cx="100" cy="148" rx="22" ry="13" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.32} />
      {isDark && (
        <>
          <path d={`M 70 130 Q 76 138 72 146`} stroke={DARK_DARKER} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d={`M 130 130 Q 124 138 128 146`} stroke={DARK_DARKER} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}
      <BeanLeg cx={74} cy={172} w={8} h={11} color={color} variant={variant} />
      <BeanLeg cx={126} cy={172} w={8} h={11} color={color} variant={variant} />
      <BeanLeg cx={92} cy={176} w={7} h={10} color={color} variant={variant} />
      <BeanLeg cx={108} cy={176} w={7} h={10} color={color} variant={variant} />
      {/* Pointed ears */}
      <path d={`M 64 60 L 76 22 L 92 60 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M 136 60 L 124 22 L 108 60 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      {!isDark && (
        <>
          <path d={`M 70 53 L 76 32 L 84 53 Z`} fill="#FF8FB0" />
          <path d={`M 130 53 L 124 32 L 116 53 Z`} fill="#FF8FB0" />
        </>
      )}
      {isDark && (
        <>
          <path d={`M 70 53 L 76 32 L 84 53 Z`} fill="#5a1020" />
          <path d={`M 130 53 L 124 32 L 116 53 Z`} fill="#5a1020" />
          <path d={`M 62 38 L 68 42 L 62 48`} fill={DARK_DARKER} />
          <circle cx="120" cy="38" r="2" fill="none" stroke="#888" strokeWidth="1.2" />
        </>
      )}
      {/* Head */}
      <path d={`M 100 40 Q 64 46 60 78 Q 60 105 78 110 Q 100 115 122 110 Q 140 105 140 78 Q 136 46 100 40 Z`}
        fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
      {isDark && <line x1="118" y1="56" x2="135" y2="80" strokeStrokeWidth="1.5" stroke="#5a1020" strokeWidth="1.5" strokeLinecap="round" />}
      <StandingEyes cx={84} cy={75} mood={mood} variant={variant} />
      <StandingEyes cx={116} cy={75} mood={mood} variant={variant} />
      {/* Cat features */}
      {!chewing && (
        <>
          <PinkNose cx={100} cy={97} dark={isDark} />
          <path d={`M 100 99 L 100 102`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          {!isDark && (
            <>
              <path d={`M 100 102 Q 94 106 88 104`} stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d={`M 100 102 Q 106 106 112 104`} stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {isDark && <FangMouth cx={100} cy={104} />}
          {/* Whiskers */}
          <line x1="68" y1="98" x2="50" y2="96" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="68" y1="103" x2="48" y2="104" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="132" y1="98" x2={isDark ? "144" : "150"} y2="96" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="132" y1="103" x2={isDark ? "144" : "152"} y2="104" stroke={STROKE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
        </>
      )}
      {chewing && (
        <g style={{ animation: 'chewJaw 0.25s ease-in-out infinite', transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="13" ry="9" fill={STROKE} />
          <ellipse cx="100" cy="102" rx="11" ry="6" fill="#8B1a1a" />
        </g>
      )}
      {!isDark && (
        <>
          <CheekBlush cx={66} cy={88} variant={variant} />
          <CheekBlush cx={134} cy={88} variant={variant} />
        </>
      )}
      {isDark && !chewing && <SpikedCollar cx={100} cy={117} w={28} />}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// RABBIT — long upright ears, fluffy bobtail, twitchy nose, buck teeth (or fangs)
// ────────────────────────────────────────────────────────────────────────────
function Rabbit({ color, mood = 'awake', chewing = false, variant = 'cute', wingFlap = false }) {
  const fill = bodyFill(color, variant);
  const isLoaf = mood === 'sleep';
  const isDark = variant === 'dark';
  const tailFill = isDark ? DARK_BELLY : '#fff';

  if (isLoaf) {
    return (
      <g>
        {isDark && <SmokeWisp cx={50} cy={130} />}
        <g style={{ transformOrigin: '100px 130px', animation: 'loafBreathe 4.5s ease-in-out infinite' }}>
          {/* Bobtail */}
          <circle cx="156" cy="170" r="9" fill={tailFill} stroke={STROKE} strokeWidth="2.5" />
          {/* Loaf body */}
          <path d={`M 40 188 L 44 145 Q 46 115 70 105 Q 100 96 130 105 Q 154 115 156 145 L 160 188 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <ellipse cx="100" cy="160" rx="22" ry="14" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.32} />
          <LoafPaw cx={82} cy={188} color={color} variant={variant} />
          <LoafPaw cx={118} cy={188} color={color} variant={variant} />
          {/* Long ear UP -- left -->
          <path d={`M 70 86 Q 64 30 76 18 Q 88 18 86 86 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Right ear FLOPPED sideways */}
          <path d={`M 122 88 Q 148 76 162 60 Q 162 52 152 56 Q 134 70 114 86 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          {!isDark && (
            <>
              <path d={`M 73 80 Q 68 35 75 26 Q 82 35 82 80 Z`} fill="#FFC0D8" />
              <path d={`M 132 86 Q 145 76 155 62 Q 148 64 138 76 Z`} fill="#FFC0D8" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 73 80 Q 68 35 75 26 Q 82 35 82 80 Z`} fill="#5a1020" />
              <path d={`M 132 86 Q 145 76 155 62 Q 148 64 138 76 Z`} fill="#5a1020" />
              <path d={`M 65 40 L 70 45 L 65 50`} fill={DARK_DARKER} />
            </>
          )}
          {/* Head */}
          <path d={`M 60 120 Q 58 92 80 86 Q 100 81 120 86 Q 142 92 140 120 Q 137 138 100 140 Q 63 138 60 120 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <LoafEyes cx={80} cy={113} variant={variant} />
          <LoafEyes cx={120} cy={113} variant={variant} />
          {/* Twitchy nose */}
          <g style={{ animation: 'noseTwitch 4s ease-in-out infinite', transformOrigin: '100px 124px' }}>
            <ellipse cx="100" cy="124" rx="4" ry="2.8" fill={isDark ? DARK_DARKER : '#FF1480'} stroke={STROKE} strokeWidth="1.2" />
            <line x1="100" y1="126" x2="100" y2="130" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          </g>
          {/* Buck teeth or fangs */}
          {!isDark && (
            <>
              <rect x="97" y="130" width="3" height="5" fill="#fff" stroke={STROKE} strokeWidth="0.8" />
              <rect x="100" y="130" width="3" height="5" fill="#fff" stroke={STROKE} strokeWidth="0.8" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 96 132 L 98 138 L 100 132 Z`} fill={FANG} />
              <path d={`M 100 132 L 102 138 L 104 132 Z`} fill={FANG} />
            </>
          )}
        </g>
      </g>
    );
  }

  // STANDING POSE
  return (
    <g>
      {isDark && <SmokeWisp cx={50} cy={70} />}
      <ellipse cx="100" cy="135" rx="40" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <ellipse cx="100" cy="148" rx="24" ry="13" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.4} />
      {/* Bobtail */}
      <circle cx="146" cy="142" r="9" fill={tailFill} stroke={STROKE} strokeWidth="2.5" />
      {/* Big back feet */}
      <ellipse cx="78" cy="180" rx="14" ry="7" fill={fill} stroke={STROKE} strokeWidth="2.5" />
      <ellipse cx="122" cy="180" rx="14" ry="7" fill={fill} stroke={STROKE} strokeWidth="2.5" />
      {variant === 'cute' && (
        <>
          <circle cx="70" cy="183" r="1.4" fill={STROKE} />
          <circle cx="78" cy="184" r="1.4" fill={STROKE} />
          <circle cx="86" cy="183" r="1.4" fill={STROKE} />
          <circle cx="114" cy="183" r="1.4" fill={STROKE} />
          <circle cx="122" cy="184" r="1.4" fill={STROKE} />
          <circle cx="130" cy="183" r="1.4" fill={STROKE} />
        </>
      )}
      {/* Front paws */}
      <ellipse cx="92" cy="172" rx="6" ry="9" fill={fill} stroke={STROKE} strokeWidth="2.5" />
      <ellipse cx="108" cy="172" rx="6" ry="9" fill={fill} stroke={STROKE} strokeWidth="2.5" />
      {/* Long upright ears */}
      <path d={`M 78 60 Q 72 12 82 4 Q 94 4 92 60 Z`}
        fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
      <path d={`M 122 60 Q 128 12 118 4 Q 106 4 108 60 Z`}
        fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
      {!isDark && (
        <>
          <path d={`M 81 54 Q 76 18 84 12 Q 88 18 88 54 Z`} fill="#FFC0D8" />
          <path d={`M 119 54 Q 124 18 116 12 Q 112 18 112 54 Z`} fill="#FFC0D8" />
        </>
      )}
      {isDark && (
        <>
          <path d={`M 81 54 Q 76 18 84 12 Q 88 18 88 54 Z`} fill="#5a1020" />
          <path d={`M 119 54 Q 124 18 116 12 Q 112 18 112 54 Z`} fill="#5a1020" />
          <path d={`M 73 24 L 78 28 L 73 32`} fill={DARK_DARKER} />
        </>
      )}
      {/* Head */}
      <circle cx="100" cy="80" r="36" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <StandingEyes cx={84} cy={75} mood={mood} variant={variant} />
      <StandingEyes cx={116} cy={75} mood={mood} variant={variant} />
      {!chewing && (
        <>
          <g style={{ animation: 'noseTwitch 4s ease-in-out infinite', transformOrigin: '100px 96px' }}>
            <ellipse cx="100" cy="96" rx="5" ry="3" fill={isDark ? DARK_DARKER : '#FFC0D8'} stroke={STROKE} strokeWidth="1.5" />
            <line x1="100" y1="99" x2="100" y2="105" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
          </g>
          {!isDark && (
            <>
              <rect x="96" y="105" width="3.5" height="6" fill="#fff" stroke={STROKE} strokeWidth="1.2" />
              <rect x="100.5" y="105" width="3.5" height="6" fill="#fff" stroke={STROKE} strokeWidth="1.2" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 95 106 L 97 112 L 99 106 Z`} fill={FANG} />
              <path d={`M 101 106 L 103 112 L 105 106 Z`} fill={FANG} />
            </>
          )}
        </>
      )}
      {chewing && (
        <g style={{ animation: 'chewJaw 0.25s ease-in-out infinite', transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="13" ry="9" fill={STROKE} />
          <ellipse cx="100" cy="102" rx="11" ry="6" fill="#8B1a1a" />
        </g>
      )}
      {!isDark && (
        <>
          <CheekBlush cx={68} cy={92} variant={variant} />
          <CheekBlush cx={132} cy={92} variant={variant} />
        </>
      )}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DRAGON — wings, twisted horns (dark), back spikes, scaled belly, smoke
// ────────────────────────────────────────────────────────────────────────────
function Dragon({ color, mood = 'awake', chewing = false, variant = 'cute', wingFlap = false }) {
  const fill = bodyFill(color, variant);
  const isLoaf = mood === 'sleep';
  const isDark = variant === 'dark';
  const wingFill = isDark ? DARK_DARKER : '#0d1825';
  const wingFillLight = isDark ? '#1a0810' : color;

  if (isLoaf) {
    return (
      <g>
        {isDark && <SmokeWisp cx={50} cy={130} />}
        {/* Slow tail with spike */}
        <g style={{ transformOrigin: '156px 165px', animation: 'tailSwishCat 5s ease-in-out infinite' }}>
          <path d={`M 156 165 Q 184 167 188 152 Q 190 142 184 138`}
            stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M 156 165 Q 184 167 188 152 Q 190 142 184 138`}
            stroke={fill} strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d={`M 178 134 L 188 124 L 188 144 Z`} fill={fill} stroke={STROKE} strokeWidth="1.5" />
        </g>
        <g style={{ transformOrigin: '100px 130px', animation: 'loafBreathe 4.5s ease-in-out infinite' }}>
          {/* Folded wings */}
          <path d={`M 42 145 Q 30 125 28 100 Q 38 110 46 125 Q 50 138 46 145 Z`}
            fill={wingFillLight} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" opacity="0.85" />
          <path d={`M 158 145 Q 170 125 172 100 Q 162 110 154 125 Q 150 138 154 145 Z`}
            fill={wingFillLight} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" opacity="0.85" />
          {/* Loaf body */}
          <path d={`M 40 188 L 44 145 Q 46 115 70 105 Q 100 96 130 105 Q 154 115 156 145 L 160 188 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <ellipse cx="100" cy="160" rx="22" ry="14" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.45} />
          {!isDark && <line x1="84" y1="155" x2="116" y2="155" stroke={STROKE} strokeWidth="0.6" opacity="0.4" />}
          {isDark && (
            <>
              <line x1="84" y1="155" x2="116" y2="155" stroke="#000" strokeWidth="0.7" opacity="0.5" />
              <path d={`M 92 158 L 94 165 L 92 172`} stroke={RED_GLOW} strokeWidth="1" fill="none" opacity="0.6" />
            </>
          )}
          {/* Tiny back spikes */}
          <path d={`M 88 108 L 90 102 L 92 108 Z`} fill={isDark ? DARK_DARKER : color} stroke={STROKE} strokeWidth="1.5" />
          <path d={`M 100 105 L 102 98 L 104 105 Z`} fill={isDark ? DARK_DARKER : color} stroke={STROKE} strokeWidth="1.5" />
          <path d={`M 112 108 L 114 102 L 116 108 Z`} fill={isDark ? DARK_DARKER : color} stroke={STROKE} strokeWidth="1.5" />
          <LoafPaw cx={82} cy={188} color={color} variant={variant} />
          <LoafPaw cx={118} cy={188} color={color} variant={variant} />
          {/* Horns */}
          {!isDark && (
            <>
              <path d={`M 72 86 L 67 60 L 84 84 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
              <path d={`M 128 86 L 133 60 L 116 84 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 72 86 L 65 58 Q 60 65 68 70 L 84 84 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
              <path d={`M 128 86 L 135 58 Q 140 65 132 70 L 116 84 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
            </>
          )}
          {/* Head */}
          <path d={`M 60 120 Q 58 92 80 86 Q 100 81 120 86 Q 142 92 140 120 Q 137 138 100 140 Q 63 138 60 120 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <LoafEyes cx={80} cy={113} variant={variant} />
          <LoafEyes cx={120} cy={113} variant={variant} />
          <ellipse cx="100" cy="125" rx="13" ry="9" fill={isDark ? DARK_DARKER : '#fff'} opacity={isDark ? 1 : 0.5} stroke={STROKE} strokeWidth="2" />
          <ellipse cx="95" cy="121" rx="2" ry="1.5" fill={STROKE} />
          <ellipse cx="105" cy="121" rx="2" ry="1.5" fill={STROKE} />
          {/* Smoke/ember puffs */}
          <circle cx="93" cy="116" r="1.4" fill={isDark ? '#FF6B20' : '#fff'} opacity="0.5" />
          <circle cx="107" cy="116" r="1.4" fill={isDark ? '#FF6B20' : '#fff'} opacity="0.5" />
        </g>
      </g>
    );
  }

  // STANDING POSE
  return (
    <g>
      {isDark && <SmokeWisp cx={50} cy={70} />}
      {/* Tail with spike */}
      <g style={{ transformOrigin: '148px 135px', animation: chewing ? 'none' : 'tailSwishCat 3s ease-in-out infinite' }}>
        <path d={`M 148 135 Q 178 130 184 105 Q 186 92 178 88`}
          stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M 148 135 Q 178 130 184 105 Q 186 92 178 88`}
          stroke={fill} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d={`M 174 86 L 184 76 L 184 96 Z`} fill={fill} stroke={STROKE} strokeWidth="1.5" />
      </g>
      {/* Wings flapping */}
      <g style={{ transformOrigin: '70px 105px', animation: chewing ? 'none' : 'wingFlapV2 1.8s ease-in-out infinite' }}>
        <path d={`M 70 105 Q 38 78 30 50 Q 50 60 64 80 Q 72 92 70 105 Z`}
          fill={wingFillLight} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <g style={{ transformOrigin: '130px 105px', animation: chewing ? 'none' : 'wingFlapV2 1.8s ease-in-out infinite' }}>
        <path d={`M 130 105 Q 162 78 170 50 Q 150 60 136 80 Q 128 92 130 105 Z`}
          fill={wingFillLight} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <ellipse cx="100" cy="135" rx="40" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <ellipse cx="100" cy="148" rx="24" ry="13" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.45} />
      <line x1="84" y1="135" x2="116" y2="135" stroke={STROKE} strokeWidth="0.7" opacity="0.4" />
      <line x1="84" y1="145" x2="116" y2="145" stroke={STROKE} strokeWidth="0.7" opacity="0.4" />
      {isDark && <path d={`M 92 138 L 94 145 L 92 152`} stroke={RED_GLOW} strokeWidth="1" fill="none" opacity="0.6" />}
      {/* Back spikes */}
      <path d={`M 80 108 L 82 96 L 86 108 Z`} fill={isDark ? DARK_DARKER : color} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      <path d={`M 96 102 L 100 88 L 104 102 Z`} fill={isDark ? DARK_DARKER : color} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      <path d={`M 114 108 L 118 96 L 120 108 Z`} fill={isDark ? DARK_DARKER : color} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      <BeanLeg cx={74} cy={172} w={9} h={11} color={color} variant={variant} />
      <BeanLeg cx={126} cy={172} w={9} h={11} color={color} variant={variant} />
      <BeanLeg cx={92} cy={176} w={8} h={10} color={color} variant={variant} />
      <BeanLeg cx={108} cy={176} w={8} h={10} color={color} variant={variant} />
      {/* Horns */}
      {!isDark && (
        <>
          <path d={`M 72 56 L 66 28 L 84 54 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M 128 56 L 134 28 L 116 54 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
      {isDark && (
        <>
          <path d={`M 72 56 L 64 26 Q 58 32 66 38 L 84 54 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M 128 56 L 136 26 Q 142 32 134 38 L 116 54 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
      {/* Head */}
      <circle cx="100" cy="80" r="38" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      {isDark && <line x1="68" y1="62" x2="84" y2="88" stroke="#5a1020" strokeWidth="1.5" strokeLinecap="round" />}
      <StandingEyes cx={84} cy={75} mood={mood} variant={variant} />
      <StandingEyes cx={116} cy={75} mood={mood} variant={variant} />
      {/* Snout w/ smoke */}
      {!chewing && (
        <>
          <ellipse cx="100" cy="100" rx="15" ry="11" fill={isDark ? DARK_DARKER : '#fff'} opacity={isDark ? 1 : 0.5} stroke={STROKE} strokeWidth="2.2" />
          <ellipse cx="94" cy="95" rx="2" ry="1.5" fill={STROKE} />
          <ellipse cx="106" cy="95" rx="2" ry="1.5" fill={STROKE} />
          {!isDark && <path d={`M 90 104 Q 100 113 110 104`} stroke={STROKE} strokeWidth="2" fill="none" strokeLinecap="round" />}
          {isDark && <FangMouth cx={100} cy={106} />}
          <circle cx="92" cy="88" r="2" fill={isDark ? '#FF6B20' : '#fff'} opacity="0.55" />
          <circle cx="108" cy="88" r="2" fill={isDark ? '#FF6B20' : '#fff'} opacity="0.55" />
        </>
      )}
      {chewing && (
        <g style={{ animation: 'chewJaw 0.25s ease-in-out infinite', transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="15" ry="11" fill={STROKE} />
          <ellipse cx="100" cy="102" rx="13" ry="8" fill="#8B1a1a" />
        </g>
      )}
      {!isDark && (
        <>
          <CheekBlush cx={66} cy={92} variant={variant} />
          <CheekBlush cx={134} cy={92} variant={variant} />
        </>
      )}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PHOENIX — flame crest, fiery wings, beak, embers
// ────────────────────────────────────────────────────────────────────────────
function Phoenix({ color, mood = 'awake', chewing = false, variant = 'cute', wingFlap = false }) {
  const fill = bodyFill(color, variant);
  const isLoaf = mood === 'sleep';
  const isDark = variant === 'dark';
  const flameOuter = isDark ? DARK_DARKER : color;
  const flameInner = isDark ? RED_GLOW : '#FFD040';

  if (isLoaf) {
    return (
      <g>
        {isDark && <SmokeWisp cx={50} cy={130} />}
        <g style={{ transformOrigin: '156px 165px', animation: 'tailSwishCat 5s ease-in-out infinite' }}>
          <path d={`M 156 165 Q 178 152 184 132`} fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M 162 158 Q 174 148 180 134`} fill={flameInner} opacity="0.7" />
        </g>
        <g style={{ transformOrigin: '100px 130px', animation: 'loafBreathe 4.5s ease-in-out infinite' }}>
          {/* Folded wings */}
          <path d={`M 42 145 Q 30 125 28 100 Q 38 110 46 125 Q 50 138 46 145 Z`}
            fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" opacity="0.95" />
          <path d={`M 158 145 Q 170 125 172 100 Q 162 110 154 125 Q 150 138 154 145 Z`}
            fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" opacity="0.95" />
          {/* Body */}
          <path d={`M 40 188 L 44 145 Q 46 115 70 105 Q 100 96 130 105 Q 154 115 156 145 L 160 188 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <ellipse cx="100" cy="160" rx="22" ry="14" fill={isDark ? '#3a0205' : flameInner} opacity={isDark ? 0.7 : 0.4} />
          {/* Bird legs */}
          <ellipse cx="86" cy="188" rx="5" ry="5" fill={isDark ? DARK_BELLY : '#FFB020'} stroke={STROKE} strokeWidth="2" />
          <ellipse cx="114" cy="188" rx="5" ry="5" fill={isDark ? DARK_BELLY : '#FFB020'} stroke={STROKE} strokeWidth="2" />
          {/* Flame crest dimmer */}
          <g style={{ transformOrigin: '100px 90px', animation: 'flameLick 2s ease-in-out infinite' }}>
            <path d={`M 88 92 Q 84 76 92 68 Q 96 76 96 64 Q 100 76 104 64 Q 108 76 116 68 Q 116 76 112 92 Z`}
              fill={flameOuter} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" opacity={isDark ? 0.95 : 1} />
            <path d={`M 92 86 Q 96 76 100 72 Q 104 76 108 86 Z`} fill={flameInner} opacity={isDark ? 0.55 : 0.85} />
          </g>
          {/* Head */}
          <path d={`M 60 120 Q 58 92 80 86 Q 100 81 120 86 Q 142 92 140 120 Q 137 138 100 140 Q 63 138 60 120 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <LoafEyes cx={80} cy={113} variant={variant} />
          <LoafEyes cx={120} cy={113} variant={variant} />
          {/* Beak */}
          <path d={`M 94 124 L 100 134 L 106 124 L 104 122 L 96 122 Z`} fill={isDark ? DARK_DARKER : '#FFB020'} stroke={STROKE} strokeWidth="1.8" strokeLinejoin="round" />
          {!isDark && (
            <>
              <CheekBlush cx={68} cy={120} variant={variant} />
              <CheekBlush cx={132} cy={120} variant={variant} />
            </>
          )}
        </g>
      </g>
    );
  }

  // STANDING
  return (
    <g>
      {isDark && <SmokeWisp cx={50} cy={70} />}
      {/* Flaming tail */}
      <g style={{ transformOrigin: '148px 135px', animation: chewing ? 'none' : 'tailSwishCat 2s ease-in-out infinite' }}>
        <path d={`M 148 135 Q 174 118 184 92`} fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M 156 128 Q 172 114 180 96`} fill={flameInner} opacity="0.8" />
      </g>
      {/* Flame wings */}
      <g style={{ transformOrigin: '70px 105px', animation: chewing ? 'none' : 'wingFlapV2 1.5s ease-in-out infinite' }}>
        <path d={`M 70 105 Q 30 78 22 50 Q 38 58 54 78 L 46 64 Q 60 80 64 96 L 60 86 Q 70 96 70 105 Z`}
          fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M 50 78 Q 56 92 62 100`} fill={flameInner} opacity="0.7" />
      </g>
      <g style={{ transformOrigin: '130px 105px', animation: chewing ? 'none' : 'wingFlapV2 1.5s ease-in-out infinite' }}>
        <path d={`M 130 105 Q 170 78 178 50 Q 162 58 146 78 L 154 64 Q 140 80 136 96 L 140 86 Q 130 96 130 105 Z`}
          fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M 150 78 Q 144 92 138 100`} fill={flameInner} opacity="0.7" />
      </g>
      <ellipse cx="100" cy="135" rx="38" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <ellipse cx="100" cy="148" rx="22" ry="13" fill={isDark ? '#3a0205' : flameInner} opacity={isDark ? 0.7 : 0.45} />
      {/* Bird legs */}
      <ellipse cx="86" cy="178" rx="5" ry="9" fill={isDark ? DARK_BELLY : '#FFB020'} stroke={STROKE} strokeWidth="2.5" />
      <ellipse cx="114" cy="178" rx="5" ry="9" fill={isDark ? DARK_BELLY : '#FFB020'} stroke={STROKE} strokeWidth="2.5" />
      <path d={`M 81 188 L 79 192 M 86 188 L 86 193 M 91 188 L 93 192`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M 109 188 L 107 192 M 114 188 L 114 193 M 119 188 L 121 192`} stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
      {/* Flame crest */}
      <g style={{ transformOrigin: '100px 50px', animation: chewing ? 'none' : 'flameLick 0.8s ease-in-out infinite' }}>
        <path d={`M 84 60 Q 78 36 90 24 Q 94 36 100 18 Q 106 36 110 24 Q 122 36 116 60 Z`}
          fill={flameOuter} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M 90 50 Q 94 32 100 28 Q 106 32 110 50 Z`} fill={flameInner} opacity={isDark ? 0.65 : 0.9} />
      </g>
      {/* Head */}
      <circle cx="100" cy="80" r="36" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <StandingEyes cx={84} cy={75} mood={mood} variant={variant} />
      <StandingEyes cx={116} cy={75} mood={mood} variant={variant} />
      {/* Beak */}
      {!chewing && (
        <path d={`M 92 100 L 100 114 L 108 100 L 105 97 L 95 97 Z`} fill={isDark ? DARK_DARKER : '#FFB020'} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      )}
      {chewing && (
        <g style={{ animation: 'chewJaw 0.25s ease-in-out infinite', transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="13" ry="9" fill={STROKE} />
          <ellipse cx="100" cy="102" rx="11" ry="6" fill="#8B1a1a" />
        </g>
      )}
      {/* Embers */}
      <circle cx="22" cy="120" r="1.5" fill={flameInner} opacity="0.7" />
      <circle cx="178" cy="100" r="2" fill={flameOuter} opacity="0.6" />
      <circle cx="32" cy="40" r="1.2" fill={flameInner} opacity="0.8" />
      {!isDark && (
        <>
          <CheekBlush cx={66} cy={92} variant={variant} />
          <CheekBlush cx={134} cy={92} variant={variant} />
        </>
      )}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// UNICORN — glowing horn (twisted dark), rainbow/violet mane, hooves, sparkles
// ────────────────────────────────────────────────────────────────────────────
function Unicorn({ color, mood = 'awake', chewing = false, variant = 'cute', wingFlap = false }) {
  const fill = bodyFill(color, variant);
  const isLoaf = mood === 'sleep';
  const isDark = variant === 'dark';

  if (isLoaf) {
    return (
      <g>
        {isDark && <SmokeWisp cx={50} cy={130} />}
        <g style={{ transformOrigin: '156px 165px', animation: 'tailSwishCat 5s ease-in-out infinite' }}>
          {!isDark && (
            <>
              <path d={`M 156 165 Q 174 162 180 154`} stroke="#FF6B9D" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d={`M 156 167 Q 174 164 180 158`} stroke="#FFB020" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d={`M 156 169 Q 172 168 178 162`} stroke="#8B7CF8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 156 165 Q 174 162 180 154`} stroke="#5a1020" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d={`M 156 167 Q 174 164 180 158`} stroke="#1a0810" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d={`M 156 169 Q 172 168 178 162`} stroke={DARK_DARKER} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          )}
        </g>
        <g style={{ transformOrigin: '100px 130px', animation: 'loafBreathe 4.5s ease-in-out infinite' }}>
          <path d={`M 40 188 L 44 145 Q 46 115 70 105 Q 100 96 130 105 Q 154 115 156 145 L 160 188 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <ellipse cx="100" cy="160" rx="22" ry="14" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.45} />
          {/* Mane bits */}
          {!isDark && (
            <>
              <path d={`M 56 122 Q 50 145 60 158`} stroke="#FF6B9D" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.9" />
              <path d={`M 60 118 Q 54 142 64 154`} stroke="#FFB020" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
            </>
          )}
          {isDark && (
            <>
              <path d={`M 56 122 Q 50 145 60 158`} stroke="#5a1020" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.9" />
              <path d={`M 60 118 Q 54 142 64 154`} stroke="#1a0810" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
            </>
          )}
          <LoafPaw cx={82} cy={188} color={color} variant={variant} />
          <LoafPaw cx={118} cy={188} color={color} variant={variant} />
          {/* Ears */}
          <path d={`M 76 90 L 70 72 L 88 88 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M 124 90 L 130 72 L 112 88 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Horn */}
          {!isDark && (
            <g style={{ animation: 'hornGlow 5s ease-in-out infinite' }}>
              <path d={`M 96 76 L 100 56 L 104 76 Z`} fill="#FFD700" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
              <line x1="97" y1="70" x2="103" y2="70" stroke={STROKE} strokeWidth="0.9" />
              <line x1="98" y1="64" x2="102" y2="64" stroke={STROKE} strokeWidth="0.9" />
            </g>
          )}
          {isDark && (
            <g style={{ animation: 'hornGlowDark 5s ease-in-out infinite' }}>
              <path d={`M 96 76 L 98 54 Q 102 58 99 64 Q 104 67 101 70 L 104 76 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
              <line x1="97" y1="68" x2="103" y2="68" stroke={RED_GLOW} strokeWidth="0.8" opacity="0.6" />
            </g>
          )}
          {/* Head */}
          <path d={`M 60 120 Q 58 92 80 86 Q 100 81 120 86 Q 142 92 140 120 Q 137 138 100 140 Q 63 138 60 120 Z`}
            fill={fill} stroke={STROKE} strokeWidth="2.8" strokeLinejoin="round" />
          <LoafEyes cx={80} cy={113} variant={variant} />
          <LoafEyes cx={120} cy={113} variant={variant} />
          {/* Muzzle */}
          <ellipse cx="100" cy="125" rx="11" ry="7" fill={isDark ? DARK_DARKER : '#fff'} opacity={isDark ? 1 : 0.5} stroke={STROKE} strokeWidth="2" />
          <ellipse cx="96" cy="123" rx="1.5" ry="1" fill={STROKE} />
          <ellipse cx="104" cy="123" rx="1.5" ry="1" fill={STROKE} />
          {!isDark && <path d={`M 94 128 Q 100 132 106 128`} stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />}
          {isDark && <path d={`M 96 128 L 98 134 L 100 128 Z`} fill={FANG} />}
          {!isDark && (
            <>
              <CheekBlush cx={68} cy={120} variant={variant} />
              <CheekBlush cx={132} cy={120} variant={variant} />
            </>
          )}
        </g>
      </g>
    );
  }

  // STANDING
  return (
    <g>
      {isDark && <SmokeWisp cx={50} cy={70} />}
      {/* Rainbow tail */}
      <g style={{ transformOrigin: '148px 135px', animation: chewing ? 'none' : 'tailSwishCat 2.5s ease-in-out infinite' }}>
        {!isDark && (
          <>
            <path d={`M 148 135 Q 178 130 182 105`} stroke="#FF6B9D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M 148 137 Q 176 134 180 110`} stroke="#FFB020" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M 148 139 Q 174 138 178 116`} stroke="#7FE787" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M 148 141 Q 172 142 176 122`} stroke="#8B7CF8" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
        {isDark && (
          <>
            <path d={`M 148 135 Q 178 130 182 105`} stroke="#5a1020" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M 148 137 Q 176 134 180 110`} stroke="#1a0810" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M 148 139 Q 174 138 178 116`} stroke={DARK_DARKER} strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
      <ellipse cx="100" cy="135" rx="38" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <ellipse cx="100" cy="148" rx="22" ry="13" fill={isDark ? DARK_BELLY : '#fff'} opacity={isDark ? 0.65 : 0.5} />
      {/* Hooves -- ellipse legs with darker bottoms -->
      <BeanLeg cx={74} cy={172} w={8} h={11} color={color} variant={variant} />
      <BeanLeg cx={92} cy={176} w={7} h={10} color={color} variant={variant} />
      <BeanLeg cx={108} cy={176} w={7} h={10} color={color} variant={variant} />
      <BeanLeg cx={126} cy={172} w={8} h={11} color={color} variant={variant} />
      {/* Mane */}
      {!isDark && (
        <>
          <path d={`M 64 76 Q 60 100 70 122 Q 80 102 76 78 Z`} fill="#FF6B9D" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M 70 70 Q 64 96 74 116 Q 84 98 80 74 Z`} fill="#FFB020" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </>
      )}
      {isDark && (
        <>
          <path d={`M 64 76 Q 60 100 70 122 Q 80 102 76 78 Z`} fill="#5a1020" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M 70 70 Q 64 96 74 116 Q 84 98 80 74 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </>
      )}
      {/* Ears */}
      <path d={`M 84 56 L 78 38 L 92 54 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M 116 56 L 122 38 L 108 54 Z`} fill={fill} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Horn */}
      {!isDark && (
        <g style={{ animation: 'hornGlow 3s ease-in-out infinite' }}>
          <path d={`M 96 36 L 100 8 L 104 36 Z`} fill="#FFD700" stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="97" y1="28" x2="103" y2="28" stroke={STROKE} strokeWidth="1" />
          <line x1="98" y1="20" x2="102" y2="20" stroke={STROKE} strokeWidth="1" />
        </g>
      )}
      {isDark && (
        <g style={{ animation: 'hornGlowDark 3s ease-in-out infinite' }}>
          <path d={`M 96 36 L 98 8 Q 104 14 100 22 Q 106 26 102 30 L 104 36 Z`} fill={DARK_DARKER} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="97" y1="28" x2="103" y2="28" stroke={RED_GLOW} strokeWidth="0.9" opacity="0.6" />
          <line x1="98" y1="20" x2="102" y2="20" stroke={RED_GLOW} strokeWidth="0.9" opacity="0.6" />
        </g>
      )}
      {/* Head */}
      <ellipse cx="100" cy="80" rx="36" ry="32" fill={fill} stroke={STROKE} strokeWidth="2.8" />
      <StandingEyes cx={84} cy={75} mood={mood} variant={variant} />
      <StandingEyes cx={116} cy={75} mood={mood} variant={variant} />
      {/* Muzzle */}
      {!chewing && (
        <>
          <ellipse cx="100" cy="100" rx="13" ry="9" fill={isDark ? DARK_DARKER : '#fff'} opacity={isDark ? 1 : 0.55} stroke={STROKE} strokeWidth="2" />
          <ellipse cx="95" cy="98" rx="1.5" ry="1" fill={STROKE} />
          <ellipse cx="105" cy="98" rx="1.5" ry="1" fill={STROKE} />
          {!isDark && <path d={`M 92 105 Q 100 110 108 105`} stroke={STROKE} strokeWidth="1.8" fill="none" strokeLinecap="round" />}
          {isDark && <FangMouth cx={100} cy={106} />}
        </>
      )}
      {chewing && (
        <g style={{ animation: 'chewJaw 0.25s ease-in-out infinite', transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="13" ry="9" fill={STROKE} />
          <ellipse cx="100" cy="102" rx="11" ry="6" fill="#8B1a1a" />
        </g>
      )}
      {/* Sparkles */}
      {!isDark && (
        <>
          <text x="30" y="50" fontSize="11" fill="#FFD700" opacity="0.8">✦</text>
          <text x="160" y="60" fontSize="9" fill="#FF6B9D" opacity="0.7">✦</text>
        </>
      )}
      {isDark && (
        <>
          <text x="30" y="50" fontSize="11" fill={RED_GLOW} opacity="0.7">✦</text>
          <text x="160" y="60" fontSize="9" fill={RED_GLOW} opacity="0.6">✧</text>
        </>
      )}
      {!isDark && (
        <>
          <CheekBlush cx={66} cy={92} variant={variant} />
          <CheekBlush cx={134} cy={92} variant={variant} />
        </>
      )}
    </g>
  );
}

const ANIMAL_COMPONENTS = { dog: Dog, cat: Cat, rabbit: Rabbit, dragon: Dragon, phoenix: Phoenix, unicorn: Unicorn };


function AnimalPet({ type = 'dog', color = T.teal, mood = 'awake', size = 200, chewing = false, variant = 'cute', wingFlap = false, equipped = {} }) {
  const Component = ANIMAL_COMPONENTS[type] || Dog;
  const glowColor = variant === 'dark' ? '#FF1010' : color;
  const equippedItems = Object.values(equipped || {}).filter(Boolean).map(slot => {
    const entry = typeof slot === 'string' ? { id: slot, color: ITEM_COLORS[0].hex } : slot;
    const item = SHOP_ITEMS.find(i => i.id === entry.id);
    return item ? { item, color: entry.color } : null;
  }).filter(Boolean);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <div style={{
        position: 'absolute', inset: -20,
        background: `radial-gradient(circle, ${glowColor}33 0%, transparent 65%)`,
        filter: 'blur(20px)',
        animation: 'petGlow 3s ease-in-out infinite',
      }} />
      <svg viewBox="0 0 200 200" width={size} height={size} style={{
        position: 'relative',
        animation: mood === 'sleep' ? 'petSleep 4s ease-in-out infinite' : 'petBob 3s ease-in-out infinite',
      }}>
        <ellipse cx="100" cy="196" rx="52" ry="6" fill="rgba(0,0,0,0.3)" />
        <Component color={color} mood={mood} chewing={chewing} variant={variant} wingFlap={wingFlap} />
        {equippedItems.map(({item, color: ic}) => <g key={item.id}>{item.render(ic)}</g>)}
      </svg>
      {mood === 'sleep' && (
        <div style={{
          position: 'absolute', top: '15%', right: '15%',
          fontSize: 18, color: T.muted,
          fontFamily: 'Syne', fontWeight: 700,
          animation: 'sleepZ 3s ease-in-out infinite',
        }}>z</div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PET MOUTH ANCHOR POINTS (in 200×200 pet viewBox coords) — for treat scene
// ────────────────────────────────────────────────────────────────────────────
const MOUTH_POINTS = {
  dog:     { x: 100, y: 106 },
  cat:     { x: 100, y: 104 },
  rabbit:  { x: 100, y: 108 },
  dragon:  { x: 100, y: 106 },
  phoenix: { x: 100, y: 110 },
  unicorn: { x: 100, y: 106 },
};

// ────────────────────────────────────────────────────────────────────────────
// AUDIO MODULE — lazy-init Tone.js synths, all sfx wrapped in try/catch
// ────────────────────────────────────────────────────────────────────────────
let _audioReady = false;
let _audioInitFailed = false;
const _synths = {};

async function ensureAudio() {
  if (_audioReady || _audioInitFailed) return _audioReady;
  try {
    await Tone.start();
    _synths.master = new Tone.Volume(-6).toDestination();
    _synths.munch = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 2 }).connect(_synths.master);
    _synths.humPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 1.6, decay: 0.3, sustain: 0.7, release: 1.2 },
    }).connect(_synths.master);
    _synths.bell = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.6 },
    }).connect(_synths.master);
    _synths.boing = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 },
    }).connect(_synths.master);
    _synths.scrub = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      volume: -28,
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.4, release: 0.2 },
    }).connect(_synths.master);
    _synths.scrubActive = false;
    _audioReady = true;
  } catch (e) {
    _audioInitFailed = true;
    _audioReady = false;
  }
  return _audioReady;
}

function setAudioMuted(muted) {
  if (!_synths.master) return;
  try { _synths.master.mute = muted; } catch {}
}

const sfx = {
  munch() {
    if (!_audioReady) return;
    try { _synths.munch.triggerAttackRelease('C2', '16n'); } catch {}
  },
  yum() {
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.bell.triggerAttackRelease('C5', '8n', now);
      _synths.bell.triggerAttackRelease('E5', '8n', now + 0.08);
      _synths.bell.triggerAttackRelease('G5', '8n', now + 0.16);
    } catch {}
  },
  humStart() {
    if (!_audioReady) return;
    try { _synths.humPad.triggerAttack(['C4', 'E4', 'G4']); } catch {}
  },
  humStop() {
    if (!_audioReady) return;
    try { _synths.humPad.releaseAll(); } catch {}
  },
  cuddleDone() {
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.bell.triggerAttackRelease('G5', '4n', now);
      _synths.bell.triggerAttackRelease('B5', '4n', now + 0.1);
      _synths.bell.triggerAttackRelease('D6', '2n', now + 0.2);
    } catch {}
  },
  boing() {
    if (!_audioReady) return;
    try {
      _synths.boing.frequency.setValueAtTime(180, Tone.now());
      _synths.boing.frequency.exponentialRampToValueAtTime(440, Tone.now() + 0.2);
      _synths.boing.triggerAttackRelease('A3', '8n');
    } catch {}
  },
  thud() {
    if (!_audioReady) return;
    try { _synths.munch.triggerAttackRelease('A1', '32n'); } catch {}
  },
  fetchHappy() {
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.bell.triggerAttackRelease('E5', '8n', now);
      _synths.bell.triggerAttackRelease('G5', '8n', now + 0.08);
      _synths.bell.triggerAttackRelease('C6', '4n', now + 0.16);
    } catch {}
  },
  scrubStart() {
    if (!_audioReady || _synths.scrubActive) return;
    try {
      _synths.scrub.triggerAttack();
      _synths.scrubActive = true;
    } catch {}
  },
  scrubStop() {
    if (!_audioReady || !_synths.scrubActive) return;
    try {
      _synths.scrub.triggerRelease();
      _synths.scrubActive = false;
    } catch {}
  },
  bubblePop() {
    if (!_audioReady) return;
    try { _synths.bell.triggerAttackRelease('B5', '32n'); } catch {}
  },
  sparkle() {
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.bell.triggerAttackRelease('C6', '16n', now);
      _synths.bell.triggerAttackRelease('E6', '16n', now + 0.06);
      _synths.bell.triggerAttackRelease('G6', '16n', now + 0.12);
      _synths.bell.triggerAttackRelease('C7', '8n', now + 0.18);
    } catch {}
  },
  // ─── Hatching sequence ────────────────────────────────────────────────────
  hatchWobble() {
    // low rocking thuds, evokes egg shifting on its base
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.munch.triggerAttackRelease('A1', '16n', now);
      _synths.munch.triggerAttackRelease('G1', '16n', now + 0.4);
      _synths.munch.triggerAttackRelease('A1', '16n', now + 0.8);
    } catch {}
  },
  hatchCrack() {
    // sharp crack — low body + high click
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.munch.triggerAttackRelease('C2', '32n', now);
      _synths.bell.triggerAttackRelease('A6', '64n', now + 0.015);
    } catch {}
  },
  hatchGlow() {
    // sustained shimmering pad swelling under the action
    if (!_audioReady) return;
    try { _synths.humPad.triggerAttackRelease(['E4', 'G4', 'B4', 'E5'], '2n'); } catch {}
  },
  hatchShatter() {
    // big break — multiple layered cracks + descending shimmer
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.munch.triggerAttackRelease('A1', '8n',  now);
      _synths.munch.triggerAttackRelease('D2', '16n', now + 0.05);
      _synths.bell.triggerAttackRelease('B5', '32n', now + 0.04);
      _synths.bell.triggerAttackRelease('G5', '32n', now + 0.12);
      _synths.bell.triggerAttackRelease('E5', '16n', now + 0.22);
    } catch {}
  },
  hatchReveal() {
    // triumphant ascending bell arpeggio — pet is born!
    if (!_audioReady) return;
    try {
      const now = Tone.now();
      _synths.bell.triggerAttackRelease('C5', '8n', now);
      _synths.bell.triggerAttackRelease('E5', '8n', now + 0.10);
      _synths.bell.triggerAttackRelease('G5', '8n', now + 0.20);
      _synths.bell.triggerAttackRelease('C6', '8n', now + 0.30);
      _synths.bell.triggerAttackRelease('E6', '4n', now + 0.42);
      _synths.bell.triggerAttackRelease('G6', '2n', now + 0.55);
    } catch {}
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COOKIE & BALL SVGs (treat scene + play scene props)
// ────────────────────────────────────────────────────────────────────────────
function CookieSVG({ size = 56 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="42" fill="#c89060" />
      <circle cx="50" cy="50" r="42" fill="url(#cookieShade)" />
      <defs>
        <radialGradient id="cookieShade" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#e8a878" />
          <stop offset="100%" stopColor="#a06840" />
        </radialGradient>
      </defs>
      <circle cx="35" cy="38" r="5" fill="#3a2010" />
      <circle cx="62" cy="42" r="4.5" fill="#3a2010" />
      <circle cx="44" cy="58" r="5.5" fill="#3a2010" />
      <circle cx="65" cy="62" r="4" fill="#3a2010" />
      <circle cx="38" cy="70" r="3.5" fill="#3a2010" />
    </svg>
  );
}

function BallSVG({ size = 50, color = '#FF6B9D' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id={`ballShade_${color.replace('#','')}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="40%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="92" rx="28" ry="4" fill="rgba(0,0,0,0.25)" />
      <circle cx="50" cy="50" r="42" fill={color} />
      <circle cx="50" cy="50" r="42" fill={`url(#ballShade_${color.replace('#','')})`} />
      <path d="M 12 50 Q 50 35 88 50" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
      <path d="M 12 50 Q 50 65 88 50" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
    </svg>
  );
}

// Yarn ball for cats
function YarnBallSVG({ size = 50, color = '#8B7CF8' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <ellipse cx="50" cy="92" rx="28" ry="4" fill="rgba(0,0,0,0.25)" />
      <circle cx="50" cy="50" r="42" fill={color} />
      <path d="M 14 40 Q 50 18 86 40" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" fill="none" />
      <path d="M 10 58 Q 50 36 90 58" stroke="rgba(0,0,0,0.18)" strokeWidth="2.5" fill="none" />
      <path d="M 14 72 Q 50 58 86 72" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" />
      <path d="M 28 14 Q 16 50 28 86" stroke="rgba(0,0,0,0.14)" strokeWidth="2" fill="none" />
      <path d="M 72 14 Q 84 50 72 86" stroke="rgba(0,0,0,0.14)" strokeWidth="2" fill="none" />
      {/* loose yarn end */}
      <path d="M 76 22 Q 90 15 94 28 Q 100 42 88 46" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
// Carrot for rabbits
function CarrotSVG({ size = 50 }) {
  return (
    <svg viewBox="0 0 60 100" width={size * 0.6} height={size}>
      <ellipse cx="30" cy="97" rx="14" ry="3" fill="rgba(0,0,0,0.25)" />
      <path d="M 17 18 Q 15 58 25 90 Q 30 97 35 90 Q 45 58 43 18 Z" fill="#FF7A20" />
      <path d="M 17 18 Q 30 24 43 18 Q 39 30 30 35 Q 21 30 17 18 Z" fill="#FF9940" />
      <path d="M 30 18 Q 16 6 8 0 Q 20 13 28 20" fill="#5a8a20" />
      <path d="M 30 18 Q 30 3 30 -2 Q 32 9 32 20" fill="#4a7a10" />
      <path d="M 30 18 Q 44 6 52 0 Q 40 13 32 20" fill="#5a8a20" />
      <line x1="23" y1="34" x2="37" y2="34" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <line x1="22" y1="50" x2="38" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="23" y1="66" x2="37" y2="66" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </svg>
  );
}
// Crystal gem for dragons
function GemSVG({ size = 50, color = '#00BFFF' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="gemShineGrad" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="50%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="95" rx="22" ry="4" fill="rgba(0,0,0,0.3)" />
      <polygon points="50,6 86,34 76,88 24,88 14,34" fill={color} />
      <polygon points="50,6 86,34 76,88 24,88 14,34" fill="url(#gemShineGrad)" />
      <line x1="50" y1="6" x2="24" y2="88" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="50" y1="6" x2="76" y2="88" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="14" y1="34" x2="86" y2="34" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
      <text x="40" y="30" fontSize="14" fill="#fff" opacity="0.85">✦</text>
    </svg>
  );
}
// Feather for phoenixes
function FeatherSVG({ size = 50, color = '#FFB020' }) {
  return (
    <svg viewBox="0 0 60 100" width={size * 0.6} height={size}>
      <ellipse cx="20" cy="96" rx="12" ry="3" fill="rgba(0,0,0,0.2)" />
      <path d="M 20 93 Q 22 60 30 24 Q 35 8 40 5" stroke="#d4a878" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 30 24 Q 17 30 11 46 Q 9 56 14 66 Q 18 72 22 73 Q 28 68 30 59 Q 32 49 30 38 Q 30 31 30 24 Z" fill={color} opacity="0.9" />
      <path d="M 30 24 Q 43 30 49 46 Q 51 56 46 66 Q 42 72 38 73 Q 32 68 30 59 Q 28 49 30 38 Q 30 31 30 24 Z" fill={color} opacity="0.72" />
      <path d="M 30 24 Q 22 36 18 52 Q 17 62 20 70" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
// Glowing star for unicorns
function StarToySVG({ size = 50, color = '#8B7CF8' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="starSheen" cx="0.4" cy="0.35" r="0.6">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="95" rx="24" ry="4" fill="rgba(0,0,0,0.25)" />
      <polygon points="50,8 61,36 92,36 68,55 77,83 50,65 23,83 32,55 8,36 39,36" fill={color} />
      <polygon points="50,8 61,36 92,36 68,55 77,83 50,65 23,83 32,55 8,36 39,36" fill="url(#starSheen)" />
      <text x="38" y="58" fontSize="18" fill="#fff" opacity="0.55">✦</text>
    </svg>
  );
}

const TOY_BY_ANIMAL = {
  dog:     { Toy: BallSVG,     color: '#FF6B9D', hint: 'drag & throw', counter: n => `${n}/2 fetches` },
  cat:     { Toy: YarnBallSVG, color: '#8B7CF8', hint: 'flick the yarn', counter: n => `${n}/2 pounces` },
  rabbit:  { Toy: CarrotSVG,   color: '#FF7A20', hint: 'toss the carrot', counter: n => `${n}/2 hops` },
  dragon:  { Toy: GemSVG,      color: '#00BFFF', hint: 'throw the gem', counter: n => `${n}/2 swoops` },
  phoenix: { Toy: FeatherSVG,  color: '#FFB020', hint: 'toss the feather', counter: n => `${n}/2 dives` },
  unicorn: { Toy: StarToySVG,  color: '#8B7CF8', hint: 'throw the star', counter: n => `${n}/2 prances` },
};

// ── Animal-specific treats ──────────────────────────────────────────────────
function BoneSVG({ size = 56 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <ellipse cx="50" cy="93" rx="24" ry="4" fill="rgba(0,0,0,0.25)" />
      <rect x="28" y="43" width="44" height="14" rx="7" fill="#e8dcc8" />
      <circle cx="22" cy="40" r="11" fill="#e8dcc8" /><circle cx="22" cy="60" r="11" fill="#e8dcc8" />
      <circle cx="78" cy="40" r="11" fill="#e8dcc8" /><circle cx="78" cy="60" r="11" fill="#e8dcc8" />
      <ellipse cx="36" cy="46" rx="6" ry="4" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}
function FishSVG({ size = 56 }) {
  return (
    <svg viewBox="0 0 130 80" width={size} height={size * 0.62}>
      <ellipse cx="58" cy="40" rx="40" ry="24" fill="#7cb9e8" />
      <path d="M 95 40 L 122 16 L 122 64 Z" fill="#5a9ad0" />
      <circle cx="30" cy="35" r="7" fill="#1a2a38" /><circle cx="28" cy="33" r="2.5" fill="#fff" opacity="0.8" />
      <path d="M 16 44 Q 21 49 26 44" stroke="#1a2a38" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 52 26 Q 62 34 52 42" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
      <path d="M 64 24 Q 74 34 64 44" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" />
      <ellipse cx="47" cy="31" rx="9" ry="4" fill="rgba(255,255,255,0.38)" />
    </svg>
  );
}
function BerrySVG({ size = 56 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <ellipse cx="50" cy="95" rx="22" ry="4" fill="rgba(0,0,0,0.25)" />
      <path d="M 50 18 Q 52 28 50 35" stroke="#4a8020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 50 21 Q 40 14 36 7" stroke="#4a8020" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="62" r="23" fill="#c84060" />
      <circle cx="32" cy="53" r="17" fill="#d84870" /><circle cx="68" cy="53" r="17" fill="#d84870" />
      <circle cx="50" cy="43" r="15" fill="#e85878" />
      <circle cx="44" cy="39" r="6" fill="rgba(255,255,255,0.4)" />
      <circle cx="30" cy="49" r="4" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}
function AppleSVG({ size = 56 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <ellipse cx="50" cy="94" rx="22" ry="4" fill="rgba(0,0,0,0.25)" />
      <path d="M 50 18 Q 55 10 62 8" stroke="#3a6010" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 52 14 Q 58 8 64 12" stroke="#5a8030" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="60" rx="32" ry="34" fill="#e83060" />
      <path d="M 50 26 Q 18 28 18 60 Q 18 86 50 90 Q 82 86 82 60 Q 82 28 50 26 Z" fill="#f04070" />
      <ellipse cx="38" cy="40" rx="10" ry="14" fill="rgba(255,255,255,0.22)" transform="rotate(-20 38 40)" />
      <path d="M 50 26 Q 46 40 48 55" stroke="rgba(0,0,0,0.12)" strokeWidth="2" fill="none" />
    </svg>
  );
}

const TREAT_BY_ANIMAL = {
  dog:     { Treat: BoneSVG,    label: 'bone',       dragHint: 'Drag a bone to their mouth' },
  cat:     { Treat: FishSVG,    label: 'fish',        dragHint: 'Drag a fish to their mouth' },
  rabbit:  { Treat: CarrotSVG,  label: 'carrot',     dragHint: 'Drag a carrot to their mouth' },
  dragon:  { Treat: GemSVG,     label: 'gem',         dragHint: 'Drag a gem to their mouth' },
  phoenix: { Treat: BerrySVG,   label: 'berries',    dragHint: 'Drag some berries to their mouth' },
  unicorn: { Treat: AppleSVG,   label: 'apple',      dragHint: 'Drag an apple to their mouth' },
};

const ACTIVITY_BY_ANIMAL = {
  dog:     { label: 'Walk',    emoji: '🦮', bg: 'park_day',  bgDark: 'dark_forest',
             speed: 2.8,  yAmp: 0,  yFreq: 0,    hopStyle: false, pauseStyle: false, rainbowTrail: false,
             trail: T.amber,   tapSyms: ['🦴','🐾','⭐'],  petGoal: 'pg_bedtime' },
  cat:     { label: 'Explore', emoji: '🐈', bg: 'garden',    bgDark: 'midnight_alley',
             speed: 1.5,  yAmp: 0,  yFreq: 0,    hopStyle: false, pauseStyle: true,  rainbowTrail: false,
             trail: T.purple,  tapSyms: ['✨','💫','🌟'],  petGoal: 'pg_toys' },
  rabbit:  { label: 'Hop',     emoji: '🐰', bg: 'meadow',    bgDark: 'shadow_cave',
             speed: 2.4,  yAmp: 40, yFreq: 0,    hopStyle: true,  pauseStyle: false, rainbowTrail: false,
             trail: T.pink,    tapSyms: ['🥕','🌸','🌿'],  petGoal: 'pg_bedtime' },
  dragon:  { label: 'Fly',     emoji: '🐉', bg: 'sky',       bgDark: 'stormy_sky',
             speed: 1.8,  yAmp: 50, yFreq: 2800, hopStyle: false, pauseStyle: false, rainbowTrail: false,
             trail: T.blue,    tapSyms: ['🔥','💥','⚡'],  petGoal: 'pg_bedtime' },
  phoenix: { label: 'Soar',    emoji: '🔥', bg: 'fire_sky',  bgDark: 'volcanic_sky',
             speed: 2.3,  yAmp: 55, yFreq: 2400, hopStyle: false, pauseStyle: false, rainbowTrail: false,
             trail: '#FF8020',  tapSyms: ['🔥','✨','💫'], petGoal: 'pg_bedtime' },
  unicorn: { label: 'Gallop',  emoji: '🦄', bg: 'rainbow',   bgDark: 'shadow_realm',
             speed: 2.5,  yAmp: 12, yFreq: 600,  hopStyle: false, pauseStyle: false, rainbowTrail: true,
             trail: T.pink,    tapSyms: ['⭐','🌈','💫'],  petGoal: 'pg_bedtime' },
};


// ────────────────────────────────────────────────────────────────────────────
function Egg({ color = T.teal, cracks = 0, size = 200, mystery = false }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <div style={{
        position: 'absolute', inset: -10,
        background: `radial-gradient(circle, ${mystery ? T.purple : color}22 0%, transparent 65%)`,
        filter: 'blur(15px)',
        animation: 'petGlow 2.5s ease-in-out infinite',
      }} />
      <svg viewBox="0 0 200 200" width={size} height={size} style={{
        position: 'relative',
        animation: 'eggWobble 4s ease-in-out infinite',
      }}>
        <defs>
          <radialGradient id="eggGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#f8f0e0" />
            <stop offset="60%" stopColor="#e8dcc0" />
            <stop offset="100%" stopColor="#c0a878" />
          </radialGradient>
          <radialGradient id="mysteryEggGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#2a1a3e" />
            <stop offset="60%" stopColor="#1a0f2e" />
            <stop offset="100%" stopColor="#0d0820" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="180" rx="45" ry="5" fill="rgba(0,0,0,0.3)" />
        <path
          d="M 100 25 C 60 25, 40 90, 40 140 C 40 170, 65 185, 100 185 C 135 185, 160 170, 160 140 C 160 90, 140 25, 100 25 Z"
          fill={mystery ? 'url(#mysteryEggGrad)' : 'url(#eggGrad)'}
        />
        {mystery ? (
          <>
            <text x="100" y="122" textAnchor="middle" fontSize="52" fill={T.purple} opacity="0.85" fontFamily="Syne" fontWeight="800">?</text>
            <circle cx="68" cy="78" r="3" fill={T.purple} opacity="0.3" />
            <circle cx="130" cy="100" r="2.5" fill={T.pink} opacity="0.3" />
            <circle cx="85" cy="148" r="3.5" fill={T.blue} opacity="0.3" />
          </>
        ) : (
          <>
            <circle cx="75" cy="80" r="3" fill={color} opacity="0.4" />
            <circle cx="125" cy="100" r="2.5" fill={color} opacity="0.4" />
            <circle cx="90" cy="130" r="3.5" fill={color} opacity="0.4" />
            <circle cx="115" cy="155" r="2" fill={color} opacity="0.4" />
            <circle cx="65" cy="120" r="2" fill={color} opacity="0.4" />
            {cracks >= 1 && <path d="M 80 80 L 95 95 L 88 105 L 100 115" stroke="#6b5a3a" strokeWidth="2" fill="none" strokeLinecap="round" />}
            {cracks >= 2 && <path d="M 100 115 L 115 110 L 110 125 L 125 130" stroke="#6b5a3a" strokeWidth="2" fill="none" strokeLinecap="round" />}
            {cracks >= 3 && <path d="M 70 100 L 60 110 M 130 90 L 140 100 M 90 145 L 105 160" stroke="#6b5a3a" strokeWidth="2" fill="none" strokeLinecap="round" />}
          </>
        )}
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// INTERACTION BURST (legacy — kept in case re-used as a quick cue)
// ────────────────────────────────────────────────────────────────────────────
function InteractionBurst({ icon: Icon, color, msg }) {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'burstFade 1.6s ease-out forwards',
      }}>
        <div style={{
          background: color, color: '#0d1825',
          width: 64, height: 64, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 40px ${color}`,
        }}>
          <Icon size={32} strokeWidth={2.5} />
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
        pointerEvents: 'none',
        animation: 'msgFloat 2s ease-out forwards',
      }}>
        <span style={{
          background: color, color: '#0d1825',
          padding: '6px 14px', borderRadius: 20,
          fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans',
          boxShadow: `0 4px 20px ${color}66`,
        }}>{msg}</span>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BACKDROPS — rooms and places the pet inhabits
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// ROOM BACKGROUNDS — pet hangs out in its home based on time of day
// ────────────────────────────────────────────────────────────────────────────

function LoungeRoomBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 280"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}>
      <defs>
        <linearGradient id="loungeWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1428" />
          <stop offset="100%" stopColor="#221830" />
        </linearGradient>
        <linearGradient id="loungeFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1208" />
          <stop offset="100%" stopColor="#120a04" />
        </linearGradient>
        <linearGradient id="couchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2244" />
          <stop offset="100%" stopColor="#1a1430" />
        </linearGradient>
        <radialGradient id="tvGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Wall */}
      <rect width="400" height="200" fill="url(#loungeWall)" />
      {/* Floor — wooden */}
      <rect y="200" width="400" height="80" fill="url(#loungeFloor)" />
      <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {/* Floor planks */}
      {[55, 120, 190, 260, 330].map(x => (
        <line key={x} x1={x} y1="200" x2={x - 6} y2="280" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}

      {/* TV on wall */}
      <rect x="140" y="25" width="130" height="82" rx="4" fill="#0a0a14" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      {/* TV glow */}
      <rect x="142" y="27" width="126" height="78" rx="3" fill="#00BFFF" opacity="0.12" />
      <circle cx="205" cy="115" r="50" fill="url(#tvGlow)" />
      {/* TV stand */}
      <rect x="192" y="107" width="26" height="6" fill="#1a1428" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="198" y="112" width="14" height="5" fill="#1a1428" />

      {/* Bookshelf on left wall */}
      <rect x="14" y="40" width="68" height="120" rx="3" fill="#2a1e0e" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {[68, 95, 122].map(y => (
        <line key={y} x1="14" y1={y} x2="82" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Books */}
      {[
        { x: 16, y: 44, w: 8, h: 22, c: '#8B7CF8' },
        { x: 25, y: 48, w: 7, h: 18, c: '#00E5B4' },
        { x: 33, y: 44, w: 9, h: 22, c: '#FF6B9D' },
        { x: 43, y: 50, w: 7, h: 16, c: '#FFB020' },
        { x: 51, y: 46, w: 8, h: 20, c: '#00BFFF' },
        { x: 60, y: 44, w: 10, h: 22, c: '#8B7CF8' },
        { x: 16, y: 72, w: 8, h: 20, c: '#FFB020' },
        { x: 25, y: 70, w: 7, h: 22, c: '#00E5B4' },
        { x: 33, y: 73, w: 9, h: 19, c: '#FF6B9D' },
        { x: 43, y: 72, w: 8, h: 20, c: '#00BFFF' },
        { x: 52, y: 69, w: 7, h: 23, c: '#8B7CF8' },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} opacity="0.7" rx="1" />
      ))}

      {/* Rug */}
      <ellipse cx="200" cy="232" rx="150" ry="28" fill="#2a2244" opacity="0.6" />
      <ellipse cx="200" cy="232" rx="120" ry="20" fill="#332855" opacity="0.4" />
      {/* Rug pattern */}
      <ellipse cx="200" cy="232" rx="80" ry="12" fill="none" stroke="#8B7CF8" strokeWidth="1" opacity="0.25" />

      {/* Couch */}
      <rect x="60" y="200" width="290" height="56" rx="8" fill="url(#couchGrad)" stroke="#3a2e55" strokeWidth="2" />
      {/* Couch back cushion */}
      <rect x="60" y="185" width="290" height="22" rx="5" fill="#221a38" stroke="#3a2e55" strokeWidth="1.5" />
      {/* Couch arms */}
      <rect x="54" y="192" width="20" height="36" rx="5" fill="#2a2244" stroke="#3a2e55" strokeWidth="1.5" />
      <rect x="336" y="192" width="20" height="36" rx="5" fill="#2a2244" stroke="#3a2e55" strokeWidth="1.5" />
      {/* Couch cushions */}
      <line x1="200" y1="203" x2="200" y2="255" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      {/* Throw pillows */}
      <rect x="80" y="192" width="28" height="22" rx="6" fill="#8B7CF8" opacity="0.55" />
      <rect x="303" y="192" width="28" height="22" rx="6" fill="#FF6B9D" opacity="0.45" />

      {/* Plant in corner */}
      <rect x="360" y="175" width="24" height="28" rx="3" fill="#3a2a1a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <ellipse cx="364" cy="175" rx="12" ry="22" fill="#1a4a20" opacity="0.85" />
      <ellipse cx="376" cy="165" rx="10" ry="18" fill="#225528" opacity="0.8" />
      <ellipse cx="370" cy="158" rx="8" ry="14" fill="#1a4a20" opacity="0.85" />
    </svg>
  );
}

function KitchenHangBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 280"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}>
      <defs>
        <linearGradient id="kitchenWallBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1410" />
          <stop offset="100%" stopColor="#221a14" />
        </linearGradient>
        <linearGradient id="kitchenBenchBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2018" />
          <stop offset="100%" stopColor="#1a1410" />
        </linearGradient>
        <radialGradient id="morningLight" cx="0.2" cy="0.1" r="0.7">
          <stop offset="0%" stopColor="#FFE0A0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFE0A0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Morning light */}
      <rect width="400" height="280" fill="url(#morningLight)" />

      {/* Wall */}
      <rect width="400" height="200" fill="url(#kitchenWallBg)" />
      {/* Floor */}
      <rect y="200" width="400" height="80" fill="#1a1008" />
      <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Window left — morning sun */}
      <rect x="20" y="28" width="82" height="96" rx="4" fill="#A8D8FF" opacity="0.15" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <line x1="61" y1="28" x2="61" y2="124" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="20" y1="76" x2="102" y2="76" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Sun */}
      <circle cx="45" cy="50" r="12" fill="#FFD040" opacity="0.4" />
      <circle cx="45" cy="50" r="8" fill="#FFE080" opacity="0.6" />

      {/* Upper cabinets */}
      <rect x="150" y="20" width="230" height="65" rx="3" fill="#2a1e10" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <line x1="265" y1="20" x2="265" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Handles */}
      <rect x="248" y="50" width="12" height="3" rx="1.5" fill="#FFB020" opacity="0.5" />
      <rect x="298" y="50" width="12" height="3" rx="1.5" fill="#FFB020" opacity="0.5" />

      {/* Counter */}
      <rect x="0" y="175" width="400" height="18" rx="0" fill="#3a2e20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Lower cabinets */}
      <rect x="0" y="193" width="400" height="50" fill="#2a2018" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {[80, 160, 240, 320].map(x => (
        <line key={x} x1={x} y1="193" x2={x} y2="243" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Cabinet handles */}
      {[40, 120, 200, 280, 360].map(x => (
        <rect key={x} x={x - 5} y={214} width={10} height={2} rx={1} fill="#FFB020" opacity="0.35" />
      ))}

      {/* Sink on right */}
      <rect x="300" y="160" width="90" height="20" rx="2" fill="#aaa" stroke="#444" strokeWidth="1.5" />
      <rect x="306" y="165" width="78" height="12" fill="#444" rx="1" />
      {/* Tap */}
      <rect x="340" y="148" width="4" height="14" fill="#999" />
      <rect x="336" y="146" width="12" height="5" rx="2" fill="#999" />

      {/* Pot on stove */}
      <ellipse cx="230" cy="178" rx="18" ry="5" fill="#333" stroke="#222" strokeWidth="1.5" />
      <path d="M 212 164 L 248 164 L 248 178 L 212 178 Z" fill="#444" stroke="#333" strokeWidth="1.5" />
      <rect x="244" y="168" width="10" height="3" rx="1" fill="#2a1e10" />
      {/* Steam */}
      <path d="M 225 156 Q 222 148 225 140" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 233 154 Q 236 146 233 138" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Fruit bowl on counter */}
      <ellipse cx="90" cy="176" rx="20" ry="5" fill="#2a2018" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="82" cy="172" r="5" fill="#FF4444" opacity="0.8" />
      <circle cx="90" cy="170" r="6" fill="#FFB020" opacity="0.8" />
      <circle cx="98" cy="173" r="4" fill="#7FE787" opacity="0.8" />
    </svg>
  );
}

// Which room to show based on hour of day
function getRoomBg(hour, petVariant) {
  if (hour >= 22 || hour < 6)  return 'bedroom';   // late night / early morning
  if (hour >= 6 && hour < 11)  return 'kitchen';   // morning
  return 'lounge';                                   // daytime / evening
}

// ────────────────────────────────────────────────────────────────────────────
// PET-SPECIFIC GAMES
// ────────────────────────────────────────────────────────────────────────────

const PET_GAMES = {
  cat: [
    { id: 'hide_seek',   emoji: '🙈', label: 'Hide & Seek',   desc: 'Where is the cat hiding?' },
    { id: 'laser_chase', emoji: '🔴', label: 'Chase the Dot', desc: 'Tap the laser dot before it moves!' },
  ],
  dog: [
    { id: 'fetch',       emoji: '🎾', label: 'Fetch!',        desc: 'Throw the ball — catch it when it comes back!' },
    { id: 'trick_train', emoji: '🐾', label: 'Trick Training', desc: 'Can you follow the trick sequence?' },
  ],
  rabbit: [
    { id: 'binky',       emoji: '⬆️', label: 'Binky Bounce',  desc: 'Tap in rhythm with the bunny!' },
    { id: 'carrot_hunt', emoji: '🥕', label: 'Carrot Hunt',   desc: 'Find the hidden carrots!' },
  ],
  dragon: [
    { id: 'fire_target', emoji: '🎯', label: 'Fire Target',   desc: 'Hit the targets with fire breath!' },
    { id: 'treasure',    emoji: '💎', label: 'Treasure Match', desc: 'Match the treasure pairs!' },
  ],
  phoenix: [
    { id: 'flame_dance', emoji: '🔥', label: 'Flame Dance',   desc: 'Follow the flame pattern!' },
    { id: 'rebirth',     emoji: '✨', label: 'Rising',         desc: 'Tap the sparks as the phoenix rises!' },
  ],
  unicorn: [
    { id: 'rainbow',     emoji: '🌈', label: 'Rainbow Trail', desc: 'Follow the unicorn trail!' },
    { id: 'sparkle',     emoji: '⭐', label: 'Sparkle Sort',   desc: 'Match the sparkle colours!' },
  ],
};

// ─── CAT: HIDE AND SEEK ──────────────────────────────────────────────────────
function GameCatHideSeek({ user, onDone }) {
  const petColor = user.petColor || T.teal;
  const petVariant = user.petVariant || 'cute';
  const [round, setRound]         = useState(0);
  const [score, setScore]         = useState(0);
  const [hiding, setHiding]       = useState(null);   // index 0-3 where cat is
  const [found, setFound]         = useState(false);
  const [wrong, setWrong]         = useState(null);   // index of wrong tap
  const [countdown, setCountdown] = useState(3);      // countdown before hiding
  const [phase, setPhase]         = useState('intro'); // intro | hiding | seek | found | done

  const SPOTS = [
    { label: 'Behind the sofa',  x: 12,  y: 52, w: 76, h: 62, hint: '🛋️' },
    { label: 'Under the table',  x: 112, y: 52, w: 76, h: 62, hint: '🪑' },
    { label: 'In the box',       x: 212, y: 52, w: 76, h: 62, hint: '📦' },
    { label: 'Behind the plant', x: 312, y: 52, w: 76, h: 62, hint: '🪴' },
  ];
  const TOTAL_ROUNDS = 3;

  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => {
        setHiding(Math.floor(Math.random() * 4));
        setPhase('hiding');
        setCountdown(3);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'hiding') {
      if (countdown > 0) {
        const t = setTimeout(() => setCountdown(c => c - 1), 800);
        return () => clearTimeout(t);
      } else {
        setPhase('seek');
      }
    }
  }, [phase, countdown]);

  function tap(i) {
    if (phase !== 'seek') return;
    if (i === hiding) {
      setFound(true);
      setScore(s => s + 1);
      setPhase('found');
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          setPhase('done');
        } else {
          setRound(r => r + 1);
          setFound(false);
          setWrong(null);
          setHiding(Math.floor(Math.random() * 4));
          setPhase('hiding');
          setCountdown(3);
        }
      }, 1400);
    } else {
      setWrong(i);
      setTimeout(() => setWrong(null), 700);
    }
  }

  if (phase === 'done') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 95, background: '#050b14',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'sceneIn 0.4s ease-out', gap: 12,
      }}>
        {Array.from({length: 10}).map((_,i) => (
          <div key={i} style={{
            position: 'absolute', top:'35%', left:`${8+i*8}%`,
            width: 8, height: 12,
            background: [T.teal,T.amber,T.pink,T.blue,T.purple][i%5],
            borderRadius: 2, animation: `confetti ${1.2+(i%4)*0.2}s ease-out forwards`,
          }} />
        ))}
        <AnimalPet type="cat" color={petColor} mood="happy" size={180} variant={petVariant} />
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text, textAlign: 'center' }}>
          {score === TOTAL_ROUNDS ? '🎉 Found every time!' : `Found ${score}/${TOTAL_ROUNDS}!`}
        </div>
        <div style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', textAlign: 'center' }}>
          {score === TOTAL_ROUNDS ? `${user.petName} can't hide from you!` : `${user.petName} is sneaky — keep practising!`}
        </div>
        <button onClick={() => onDone(score)} style={{
          marginTop: 16, background: T.teal, color: '#0d1825', border: 'none',
          borderRadius: 16, padding: '16px 36px',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 16, cursor: 'pointer',
        }}>
          {score === TOTAL_ROUNDS ? '+ 3 tickets 🎟️' : '+ 1 ticket 🎟️'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95, background: '#050b14',
      display: 'flex', flexDirection: 'column', animation: 'sceneIn 0.4s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <button onClick={() => onDone(0)} style={{
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
          borderRadius: 12, padding: '8px 14px', cursor: 'pointer', color: T.textDim,
          fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
        }}>Exit</button>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: T.muted }}>
          🙈 Hide & Seek · Round {round + 1}/{TOTAL_ROUNDS}
        </div>
        <div style={{
          background: `${T.amber}22`, border: `1px solid ${T.amber}55`, borderRadius: 12,
          padding: '6px 12px', color: T.amber, fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
        }}>
          {score} 🎟️
        </div>
      </div>

      {/* Scene — room with hiding spots */}
      <div style={{ flex: 1, position: 'relative', margin: '8px 16px' }}>
        {/* Room bg */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden',
          background: '#0d1825',
        }}>
          <LoungeRoomBg />
        </div>

        {/* Status overlay */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(5,11,20,0.88)', border: `1px solid ${T.border}`,
          borderRadius: 16, padding: '10px 20px', zIndex: 4, textAlign: 'center',
          backdropFilter: 'blur(6px)',
        }}>
          {phase === 'intro' && (
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: T.text }}>
              {user.petName} is going to hide... 👀
            </div>
          )}
          {phase === 'hiding' && (
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: petColor }}>
              Close your eyes! {countdown > 0 ? countdown : '...'}
            </div>
          )}
          {phase === 'seek' && (
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: T.text }}>
              Where is {user.petName} hiding? 🔍
            </div>
          )}
          {phase === 'found' && (
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: T.teal, animation: 'textPop 0.4s ease-out' }}>
              Found! 🎉
            </div>
          )}
        </div>

        {/* Hiding spots */}
        {SPOTS.map((spot, i) => {
          const isHere = found && hiding === i;
          const isWrong = wrong === i;
          const showCat = (phase === 'hiding' || phase === 'intro') && hiding === i;
          return (
            <div key={i} onClick={() => tap(i)} style={{
              position: 'absolute',
              left: `${spot.x / 4}%`, top: `${spot.y / 2.8}%`,
              width: `${spot.w / 4}%`, height: `${spot.h / 2.8}%`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: phase === 'seek' ? 'pointer' : 'default',
              borderRadius: 12,
              background: isHere ? `${T.teal}22` : isWrong ? `${T.red}22` : 'rgba(255,255,255,0.04)',
              border: isHere ? `2px solid ${T.teal}` : isWrong ? `2px solid ${T.red}` : '2px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
              zIndex: 3,
            }}>
              <div style={{ fontSize: 32 }}>{spot.hint}</div>
              <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'DM Sans', fontWeight: 600, marginTop: 4, textAlign: 'center' }}>
                {spot.label}
              </div>
              {isHere && (
                <div style={{ marginTop: 6, animation: 'textPop 0.4s ease-out' }}>
                  <AnimalPet type="cat" color={petColor} mood="happy" size={56} variant={petVariant} />
                </div>
              )}
              {isWrong && (
                <div style={{ fontSize: 20, marginTop: 4 }}>😅</div>
              )}
              {showCat && phase === 'hiding' && (
                <div style={{ fontSize: 22, marginTop: 4, animation: 'sceneIn 0.3s ease-out' }}>
                  <AnimalPet type="cat" color={petColor} mood="awake" size={44} variant={petVariant} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div style={{ padding: '12px 20px 24px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ color: T.textDim, fontSize: 12, fontFamily: 'DM Sans' }}>
          {phase === 'seek' ? 'Tap a hiding spot' : phase === 'found' ? 'Nice work! Next round coming...' : ''}
        </div>
      </div>
    </div>
  );
}

// ─── DOG: FETCH ──────────────────────────────────────────────────────────────
function GameDogFetch({ user, onDone }) {
  const petColor = user.petColor || T.teal;
  const petVariant = user.petVariant || 'cute';
  const [phase, setPhase] = useState('throw');  // throw | flying | fetch | catch | done
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [ballX, setBallX] = useState(50);   // % across screen
  const [ballY, setBallY] = useState(50);
  const [targetX, setTargetX] = useState(70);
  const [missed, setMissed]   = useState(false);
  const TOTAL = 4;

  function throwBall(e) {
    if (phase !== 'throw') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left) / rect.width * 100;
    const y = ((e.touches?.[0]?.clientY ?? e.clientY) - rect.top) / rect.height * 100;
    setBallX(x); setBallY(y);
    setTargetX(20 + Math.random() * 60);
    setPhase('flying');
    setTimeout(() => setPhase('fetch'), 800);
    setTimeout(() => setPhase('catch'), 1800);
  }

  function catchBall(e) {
    if (phase !== 'catch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left) / rect.width * 100;
    const dist = Math.abs(x - 50);
    if (dist < 20) {
      setScore(s => s + 1);
      setMissed(false);
    } else {
      setMissed(true);
    }
    if (round + 1 >= TOTAL) {
      setPhase('done');
    } else {
      setRound(r => r + 1);
      setPhase('throw');
    }
  }

  if (phase === 'done') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 95, background: '#050b14',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'sceneIn 0.4s ease-out', gap: 12,
      }}>
        <AnimalPet type="dog" color={petColor} mood="happy" size={180} variant={petVariant} />
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text, textAlign: 'center' }}>
          {score >= 3 ? '🎾 Great catch!' : `Caught ${score}/${TOTAL}!`}
        </div>
        <div style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', textAlign: 'center' }}>
          {score >= TOTAL ? `${user.petName} had the BEST time!` : `${user.petName} loved running anyway!`}
        </div>
        <button onClick={() => onDone(score)} style={{
          marginTop: 16, background: T.teal, color: '#0d1825', border: 'none',
          borderRadius: 16, padding: '16px 36px',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 16, cursor: 'pointer',
        }}>
          {score >= TOTAL ? '+ 3 tickets 🎟️' : '+ 1 ticket 🎟️'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95, background: '#050b14',
      display: 'flex', flexDirection: 'column', animation: 'sceneIn 0.4s ease-out',
    }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={() => onDone(0)} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '8px 14px', cursor: 'pointer', color: T.textDim, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600 }}>Exit</button>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: T.muted }}>🎾 Fetch · Round {round+1}/{TOTAL}</div>
        <div style={{ background: `${T.amber}22`, border: `1px solid ${T.amber}55`, borderRadius: 12, padding: '6px 12px', color: T.amber, fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{score} 🎟️</div>
      </div>

      <div style={{ flex: 1, position: 'relative', margin: '8px 16px', borderRadius: 20, overflow: 'hidden', background: '#0d1825', cursor: phase === 'throw' ? 'crosshair' : 'default' }}
           onClick={phase === 'throw' ? throwBall : phase === 'catch' ? catchBall : undefined}
           onTouchEnd={phase === 'throw' ? throwBall : phase === 'catch' ? catchBall : undefined}>
        <LoungeRoomBg />

        {/* Dog */}
        <div style={{
          position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 3,
          animation: phase === 'fetch' ? 'trickRollOver 0.8s ease-in-out' : 'petBob 3s ease-in-out infinite',
        }}>
          <AnimalPet type="dog" color={petColor} mood={phase === 'fetch' ? 'happy' : 'awake'} size={120} variant={petVariant} />
        </div>

        {/* Ball */}
        {(phase === 'flying' || phase === 'catch') && (
          <div style={{
            position: 'absolute', zIndex: 4, fontSize: 32,
            left: phase === 'flying' ? `${targetX}%` : '48%',
            top: phase === 'flying' ? '20%' : '15%',
            transform: 'translateX(-50%)',
            transition: phase === 'flying' ? 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          }}>🎾</div>
        )}

        {/* Instruction */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(5,11,20,0.88)', borderRadius: 16, padding: '10px 24px', zIndex: 5,
          color: T.text, fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
          backdropFilter: 'blur(6px)',
        }}>
          {phase === 'throw' && 'Tap anywhere to throw the ball 🎾'}
          {phase === 'flying' && `${user.petName} is chasing it!`}
          {phase === 'fetch' && `${user.petName} fetched it! Get ready to catch...`}
          {phase === 'catch' && 'Tap to catch it! ⚡'}
          {missed && ' (missed that one!)'}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

// ─── GAMES LAUNCHER ──────────────────────────────────────────────────────────
function PetGamesScreen({ user, onClose, onEarnTickets }) {
  const [activeGame, setActiveGame] = useState(null);
  const petGames = PET_GAMES[user.petType] || PET_GAMES.cat;
  const petColor = user.petColor || T.teal;
  const isDark = (user.petVariant || 'cute') === 'dark';

  function launchGame(gameId) {
    setActiveGame(gameId);
  }

  function finishGame(score) {
    const tickets = score >= 3 ? 3 : score >= 1 ? 1 : 0;
    if (tickets > 0 && onEarnTickets) onEarnTickets(tickets);
    setActiveGame(null);
  }

  // Route to specific game
  if (activeGame === 'hide_seek') return <GameCatHideSeek user={user} onDone={finishGame} />;
  if (activeGame === 'fetch') return <GameDogFetch user={user} onDone={finishGame} />;
  // Other games — coming soon placeholder
  if (activeGame) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: '#050b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28, animation: 'sceneIn 0.4s ease-out' }}>
        <AnimalPet type={user.petType} color={petColor} mood="happy" size={160} variant={user.petVariant || 'cute'} />
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: T.text, textAlign: 'center' }}>Coming soon! 🎮</div>
        <div style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', textAlign: 'center', maxWidth: 260 }}>
          {user.petName} is practising this one. Check back soon!
        </div>
        <button onClick={() => setActiveGame(null)} style={{ background: T.teal, color: '#0d1825', border: 'none', borderRadius: 14, padding: '14px 32px', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer' }}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 88, background: '#050b14', display: 'flex', flexDirection: 'column', animation: 'sceneIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '8px 14px', cursor: 'pointer', color: T.textDim, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600 }}>← Back</button>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: T.text }}>🎮 {user.petName}'s Games</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Pet */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
        <AnimalPet type={user.petType} color={petColor} mood="happy" size={140} variant={user.petVariant || 'cute'} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px' }}>
        <div style={{ color: T.textDim, fontSize: 13, fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 20 }}>
          {user.petName} loves these games. Play together to earn tickets!
        </div>

        {petGames.map(game => (
          <button key={game.id} onClick={() => launchGame(game.id)} style={{
            width: '100%', marginBottom: 12,
            background: T.card, border: `1.5px solid ${T.border}`,
            borderRadius: 18, padding: '18px 20px',
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 40, flexShrink: 0 }}>{game.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 4 }}>{game.label}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: T.textDim }}>{game.desc}</div>
            </div>
            <div style={{ color: T.teal, fontSize: 20 }}>›</div>
          </button>
        ))}

        {/* Teaser for other species games */}
        <div style={{ background: T.surface, borderRadius: 14, padding: 16, marginTop: 8, textAlign: 'center' }}>
          <div style={{ color: T.muted, fontSize: 12, fontFamily: 'DM Sans', marginBottom: 6 }}>More games on the way for</div>
          <div style={{ fontSize: 22, letterSpacing: 8 }}>🐶 🐱 🐰 🐉 🔥 🦄</div>
        </div>
      </div>
    </div>
  );
}


function BedroomBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 280"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}>
      <defs>
        <linearGradient id="bedroomWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#160f24" />
          <stop offset="100%" stopColor="#23172e" />
        </linearGradient>
        <linearGradient id="bedroomFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0f1f" />
          <stop offset="100%" stopColor="#0a050e" />
        </linearGradient>
        <radialGradient id="lampGlow_bg" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#ffb020" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow_bg" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#dde6ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#dde6ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="218" fill="url(#bedroomWall)" />
      <rect y="218" width="400" height="62" fill="url(#bedroomFloor)" />
      <line x1="0" y1="218" x2="400" y2="218" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Window with moon */}
      <circle cx="335" cy="58" r="44" fill="url(#moonGlow_bg)" />
      <rect x="295" y="22" width="80" height="92" rx="3"
            fill="#0a0612" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      <rect x="296" y="23" width="78" height="90" rx="2.5" fill="#0d1230" opacity="0.55" />
      <circle cx="335" cy="58" r="13" fill="#f4ecd0" />
      <circle cx="340" cy="54" r="9.5" fill="#0d1230" opacity="0.4" />
      <line x1="335" y1="22" x2="335" y2="114" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />
      <line x1="295" y1="68" x2="375" y2="68" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />
      <circle cx="305" cy="40" r="0.9" fill="#fff" opacity="0.9" />
      <circle cx="312" cy="84" r="0.7" fill="#fff" opacity="0.7" />
      <circle cx="365" cy="98" r="0.8" fill="#fff" opacity="0.85" />
      <circle cx="358" cy="35" r="0.5" fill="#fff" opacity="0.6" />

      {/* Lamp on left */}
      <circle cx="50" cy="178" r="80" fill="url(#lampGlow_bg)" />
      <ellipse cx="50" cy="222" rx="14" ry="3" fill="#150a1a" />
      <rect x="48.5" y="168" width="3" height="54" fill="#28182f" />
      <path d="M 38 162 L 62 162 L 58 144 L 42 144 Z" fill="#ffb020" opacity="0.55" />
      <path d="M 38 162 L 62 162 L 60 159 L 40 159 Z" fill="#ffb020" />

      {/* Pet cushion / round bed */}
      <ellipse cx="200" cy="252" rx="118" ry="18" fill="#28162e" opacity="0.7" />
      <ellipse cx="200" cy="244" rx="100" ry="12" fill="#3a2348" opacity="0.75" />
      <ellipse cx="200" cy="240" rx="78" ry="6" fill="#4a3056" opacity="0.55" />
    </svg>
  );
}

function OutdoorBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="duskSky_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#08091a" />
          <stop offset="28%" stopColor="#1c1438" />
          <stop offset="55%" stopColor="#3d2348" />
          <stop offset="78%" stopColor="#7a3a4e" />
          <stop offset="92%" stopColor="#b85e44" />
          <stop offset="100%" stopColor="#1f2818" />
        </linearGradient>
        <radialGradient id="sunGlow_bg" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#ffd078" stopOpacity="0.85" />
          <stop offset="50%"  stopColor="#ff9050" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ff9050" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="700" fill="url(#duskSky_bg)" />

      <circle cx="60"  cy="50"  r="0.9" fill="#fff" opacity="0.85" />
      <circle cx="220" cy="80"  r="0.7" fill="#fff" opacity="0.6" />
      <circle cx="350" cy="42"  r="0.8" fill="#fff" opacity="0.75" />
      <circle cx="155" cy="115" r="0.5" fill="#fff" opacity="0.4" />
      <circle cx="305" cy="148" r="0.6" fill="#fff" opacity="0.5" />
      <circle cx="100" cy="178" r="0.4" fill="#fff" opacity="0.35" />

      <ellipse cx="120" cy="160" rx="55" ry="11" fill="#fff" opacity="0.08" />
      <ellipse cx="290" cy="220" rx="65" ry="13" fill="#fff" opacity="0.1" />
      <ellipse cx="40"  cy="280" rx="40" ry="8"  fill="#fff" opacity="0.06" />

      <circle cx="100" cy="600" r="135" fill="url(#sunGlow_bg)" />
      <circle cx="100" cy="610" r="32"  fill="#ffd078" opacity="0.92" />
      <circle cx="100" cy="608" r="22"  fill="#fff5d4" opacity="0.65" />

      <path d="M 0 580 Q 80 552 160 568 T 320 562 Q 360 558 400 566 L 400 700 L 0 700 Z"
            fill="#13101e" opacity="0.85" />
      <path d="M 0 612 Q 100 595 200 608 T 400 600 L 400 700 L 0 700 Z"
            fill="#0a0810" opacity="0.92" />

      <g fill="#2a4030" opacity="0.55">
        <path d="M 18 700 L 16 658 L 20 700 Z" />
        <path d="M 50 700 L 47 668 L 53 700 Z" />
        <path d="M 88 700 L 85 652 L 91 700 Z" />
        <path d="M 130 700 L 127 663 L 133 700 Z" />
        <path d="M 175 700 L 172 658 L 178 700 Z" />
        <path d="M 218 700 L 215 670 L 221 700 Z" />
        <path d="M 258 700 L 255 654 L 261 700 Z" />
        <path d="M 305 700 L 302 664 L 308 700 Z" />
        <path d="M 348 700 L 345 658 L 351 700 Z" />
        <path d="M 385 700 L 383 670 L 387 700 Z" />
      </g>
      <g fill="#1a2820" opacity="0.6">
        <path d="M 35 700 L 33 678 L 37 700 Z" />
        <path d="M 75 700 L 73 680 L 77 700 Z" />
        <path d="M 115 700 L 113 682 L 117 700 Z" />
        <path d="M 158 700 L 156 678 L 160 700 Z" />
        <path d="M 200 700 L 198 680 L 202 700 Z" />
        <path d="M 240 700 L 238 678 L 242 700 Z" />
        <path d="M 285 700 L 283 680 L 287 700 Z" />
        <path d="M 328 700 L 326 678 L 330 700 Z" />
        <path d="M 370 700 L 368 680 L 372 700 Z" />
      </g>
    </svg>
  );
}

// Sky background for flying animals (dragon, phoenix)
function SkyBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#06091f" />
          <stop offset="35%" stopColor="#141845" />
          <stop offset="65%" stopColor="#221438" />
          <stop offset="100%" stopColor="#160d24" />
        </linearGradient>
        <radialGradient id="moonGlowSky" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#dde6ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#dde6ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#skyNight)" />
      {/* Moon */}
      <circle cx="320" cy="80" r="50" fill="url(#moonGlowSky)" />
      <circle cx="320" cy="80" r="22" fill="#f0ecd8" />
      <circle cx="328" cy="74" r="15" fill="#141845" opacity="0.45" />
      {/* Stars */}
      {[{x:40,y:40},{x:90,y:20},{x:160,y:55},{x:230,y:30},{x:280,y:65},{x:60,y:110},{x:140,y:95},{x:200,y:140},{x:350,y:140},{x:380,y:55},{x:30,y:180},{x:110,y:160}].map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={0.7+(i%3)*0.5} fill="#fff" opacity={0.4+(i%4)*0.14} />
      ))}
      {/* Wispy clouds */}
      <ellipse cx="80"  cy="200" rx="65" ry="18" fill="rgba(255,255,255,0.05)" />
      <ellipse cx="280" cy="280" rx="80" ry="22" fill="rgba(255,255,255,0.04)" />
      <ellipse cx="150" cy="350" rx="55" ry="16" fill="rgba(255,255,255,0.04)" />
      {/* Ground silhouette */}
      <path d="M 0 580 Q 80 555 160 572 T 320 562 Q 360 558 400 568 L 400 700 L 0 700 Z"
            fill="#130c20" opacity="0.95" />
      <path d="M 0 620 Q 100 605 200 615 T 400 608 L 400 700 L 0 700 Z"
            fill="#0a0710" />
    </svg>
  );
}

// ── DOG: bright sunny park with path, trees and bench ──────────────────────
function ParkDayBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="pdSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2e8fd8" />
          <stop offset="55%"  stopColor="#70bef0" />
          <stop offset="100%" stopColor="#b4ddf8" />
        </linearGradient>
        <radialGradient id="pdSun" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#fff9d0" stopOpacity="0.98" />
          <stop offset="35%"  stopColor="#ffe060" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffe060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pdGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#58b830" />
          <stop offset="100%" stopColor="#286018" />
        </linearGradient>
        <linearGradient id="pdPath" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d4c898" />
          <stop offset="100%" stopColor="#b0a078" />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#pdSky)" />
      {/* Sun glow + disc */}
      <circle cx="340" cy="72" r="90" fill="url(#pdSun)" />
      <circle cx="340" cy="72" r="30" fill="#fff9d0" opacity="0.96" />
      {/* Clouds */}
      <ellipse cx="80"  cy="100" rx="58" ry="22" fill="#fff" opacity="0.94" />
      <ellipse cx="52"  cy="112" rx="32" ry="19" fill="#fff" opacity="0.92" />
      <ellipse cx="110" cy="110" rx="36" ry="17" fill="#fff" opacity="0.92" />
      <ellipse cx="230" cy="65"  rx="50" ry="18" fill="#fff" opacity="0.88" />
      <ellipse cx="208" cy="75"  rx="30" ry="15" fill="#fff" opacity="0.85" />
      <ellipse cx="256" cy="73"  rx="32" ry="15" fill="#fff" opacity="0.85" />
      {/* Far hill */}
      <path d="M -20 400 Q 80 360 180 385 T 380 370 Q 420 365 450 378 L 450 700 L -20 700 Z"
            fill="#60c038" opacity="0.55" />
      {/* Ground */}
      <path d="M -20 490 Q 80 468 180 485 T 360 472 Q 405 468 450 478 L 450 700 L -20 700 Z"
            fill="url(#pdGrass)" />
      {/* Winding path */}
      <path d="M 150 700 Q 162 610 165 490 Q 168 415 202 388 Q 236 362 242 285"
            stroke="url(#pdPath)" strokeWidth="52" fill="none" strokeLinecap="round" />
      <path d="M 150 700 Q 162 610 165 490 Q 168 415 202 388 Q 236 362 242 285"
            stroke="#c8b888" strokeWidth="46" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M 158 650 Q 163 590 165 530" stroke="#c0b090" strokeWidth="2"
            fill="none" strokeDasharray="10 10" opacity="0.5" />
      {/* Tree left */}
      <rect x="34"  y="410" width="14" height="80" rx="5" fill="#5a3818" />
      <circle cx="41"  cy="398" r="44" fill="#266818" />
      <circle cx="41"  cy="398" r="40" fill="#329030" />
      <ellipse cx="26" cy="382" rx="20" ry="15" fill="#40a038" opacity="0.7" />
      {/* Tree right */}
      <rect x="330" y="418" width="13" height="72" rx="5" fill="#5a3818" />
      <circle cx="337" cy="406" r="40" fill="#266818" />
      <circle cx="337" cy="406" r="36" fill="#329030" />
      <ellipse cx="352" cy="390" rx="18" ry="13" fill="#40a038" opacity="0.7" />
      {/* Small tree far right */}
      <rect x="372" y="435" width="10" height="55" rx="4" fill="#5a3818" />
      <circle cx="377" cy="426" r="30" fill="#2e8028" />
      {/* Park bench */}
      <rect x="54"  y="496" width="62" height="8"  rx="3" fill="#9a7840" />
      <rect x="54"  y="488" width="62" height="7"  rx="2" fill="#7a5828" />
      <rect x="56"  y="504" width="6"  height="18" rx="2" fill="#7a5828" />
      <rect x="104" y="504" width="6"  height="18" rx="2" fill="#7a5828" />
      {/* Flowers */}
      {[{x:90,y:498,c:'#ff5090'},{x:116,y:508,c:'#FFD060'},{x:310,y:492,c:'#ff5090'},
        {x:348,y:500,c:'#FFB020'},{x:378,y:494,c:'#e060ff'},{x:200,y:506,c:'#ff5090'}].map((f,i) => (
        <g key={i}>
          <circle cx={f.x}   cy={f.y}   r="5.5" fill={f.c} opacity="0.9" />
          <circle cx={f.x}   cy={f.y}   r="2.5" fill="#fff" opacity="0.78" />
        </g>
      ))}
    </svg>
  );
}

// ── CAT: twilight garden with stone wall, glowing window, fireflies ────────
function GardenBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#180e34" />
          <stop offset="38%"  stopColor="#2c1848" />
          <stop offset="68%"  stopColor="#481a50" />
          <stop offset="100%" stopColor="#240f28" />
        </linearGradient>
        <radialGradient id="moonG" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#f0e8c8" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#f0e8c8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="windowGlow" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#ffd070" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd070" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#gardenSky)" />
      {/* Stars */}
      {[{x:28,y:38},{x:72,y:22},{x:138,y:52},{x:198,y:28},{x:258,y:60},{x:58,y:108},
        {x:142,y:92},{x:208,y:138},{x:355,y:135},{x:385,y:52},{x:32,y:176},{x:112,y:155},
        {x:330,y:80},{x:175,y:72},{x:295,y:45}].map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={0.6+(i%3)*0.5} fill="#fff" opacity={0.4+(i%5)*0.12} />
      ))}
      {/* Moon + glow */}
      <circle cx="285" cy="75" r="48" fill="url(#moonG)" />
      <circle cx="285" cy="75" r="23" fill="#f8f0d8" />
      <circle cx="292" cy="70" r="16" fill="#2c1848" opacity="0.42" />
      {/* Stone wall */}
      <rect x="0"   y="298" width="400" height="68" fill="#2e2838" />
      {[0,42,84,126,168,210,252,294,336,378].map((x,i) => (
        <rect key={i} x={x+1} y={300} width={40} height={30} rx="1"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {[21,63,105,147,189,231,273,315,357].map((x,i) => (
        <rect key={i} x={x+1} y={330} width={40} height={34} rx="1"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      <line x1="0" y1="298" x2="400" y2="298" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="0" y1="366" x2="400" y2="366" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      {/* Glowing window */}
      <circle cx="72" cy="260" r="40" fill="url(#windowGlow)" />
      <rect x="52" y="242" width="40" height="38" rx="2" fill="#ffd070" opacity="0.32" />
      <rect x="52" y="242" width="40" height="38" rx="2" fill="none" stroke="#4a3828" strokeWidth="3" />
      <line x1="72"  y1="242" x2="72"  y2="280" stroke="#4a3828" strokeWidth="2" />
      <line x1="52"  y1="261" x2="92"  y2="261" stroke="#4a3828" strokeWidth="2" />
      {/* Garden gate */}
      <rect x="178" y="225" width="9" height="75" rx="3" fill="#241c30" />
      <rect x="214" y="225" width="9" height="75" rx="3" fill="#241c30" />
      <path d="M 178 232 Q 201 216 223 232" stroke="#241c30" strokeWidth="5" fill="none" />
      <rect x="183" y="258" width="39" height="5" rx="2" fill="#241c30" />
      {/* Dense bushes */}
      <ellipse cx="42"  cy="458" rx="58" ry="40" fill="#162e18" />
      <ellipse cx="16"  cy="448" rx="34" ry="30" fill="#1a3620" />
      <ellipse cx="80"  cy="446" rx="40" ry="32" fill="#1e3e1c" />
      <ellipse cx="358" cy="456" rx="56" ry="38" fill="#162e18" />
      <ellipse cx="334" cy="444" rx="40" ry="30" fill="#1a3620" />
      <ellipse cx="385" cy="450" rx="32" ry="28" fill="#1e3e1c" />
      {/* Ground */}
      <rect y="480" width="400" height="220" fill="#0c1608" />
      <path d="M -20 480 Q 80 470 200 478 T 430 472 L 430 490 L -20 490 Z" fill="#182010" />
      {/* Fireflies */}
      {[{x:108,y:418},{x:196,y:382},{x:158,y:440},{x:248,y:400},{x:298,y:428},{x:220,y:455}].map((f,i) => (
        <circle key={i} cx={f.x} cy={f.y} r="2.5" fill="#b0ff60"
          style={{ animation: `sleepZ ${1.8+i*0.35}s ease-in-out infinite` }} opacity="0.7" />
      ))}
    </svg>
  );
}

// ── RABBIT: sunny meadow with flowers and carrot tops ──────────────────────
function MeadowBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="meadowSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4abeea" />
          <stop offset="55%"  stopColor="#88d8f8" />
          <stop offset="100%" stopColor="#c0eef8" />
        </linearGradient>
        <radialGradient id="meadowSun" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#fff8e0" stopOpacity="0.96" />
          <stop offset="35%"  stopColor="#ffe060" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#ffe060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="meadowFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#68c840" />
          <stop offset="100%" stopColor="#3a8820" />
        </linearGradient>
        <linearGradient id="meadowNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#50b828" />
          <stop offset="100%" stopColor="#2a6818" />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#meadowSky)" />
      {/* Sun */}
      <circle cx="58"  cy="62" r="78" fill="url(#meadowSun)" />
      <circle cx="58"  cy="62" r="28" fill="#fff8d0" opacity="0.96" />
      {/* Clouds */}
      <ellipse cx="185" cy="88"  rx="68" ry="24" fill="#fff" opacity="0.96" />
      <ellipse cx="158" cy="98"  rx="40" ry="20" fill="#fff" opacity="0.93" />
      <ellipse cx="212" cy="97"  rx="44" ry="20" fill="#fff" opacity="0.93" />
      <ellipse cx="325" cy="118" rx="52" ry="19" fill="#fff" opacity="0.9" />
      <ellipse cx="304" cy="129" rx="32" ry="16" fill="#fff" opacity="0.87" />
      <ellipse cx="350" cy="128" rx="34" ry="16" fill="#fff" opacity="0.87" />
      {/* Hills */}
      <path d="M -20 430 Q 70 392 170 418 T 360 402 Q 406 396 450 410 L 450 700 L -20 700 Z"
            fill="url(#meadowFar)" opacity="0.6" />
      <path d="M -20 492 Q 85 468 185 488 T 365 474 Q 410 470 450 480 L 450 700 L -20 700 Z"
            fill="url(#meadowNear)" />
      {/* Flowers */}
      {[{x:34, y:500,c:'#ff4080'},{x:62, y:510,c:'#FFD060'},{x:90, y:498,c:'#ff80c8'},
        {x:118,y:512,c:'#ff4080'},{x:152,y:504,c:'#d040ff'},
        {x:308,y:496,c:'#FFD060'},{x:340,y:508,c:'#ff4080'},{x:368,y:498,c:'#ff80c8'},
        {x:392,y:506,c:'#d040ff'},{x:200,y:508,c:'#FFD060'},{x:248,y:500,c:'#ff4080'},
        {x:278,y:510,c:'#50d8ff'}].map((f,i) => (
        <g key={i}>
          <line x1={f.x} y1={f.y+7}  x2={f.x} y2={f.y+18} stroke="#388018" strokeWidth="2.2" />
          <circle cx={f.x-5} cy={f.y+2}   r="5.5" fill={f.c} opacity="0.94" />
          <circle cx={f.x+5} cy={f.y+2}   r="5.5" fill={f.c} opacity="0.94" />
          <circle cx={f.x}   cy={f.y-4.5} r="5.5" fill={f.c} opacity="0.94" />
          <circle cx={f.x}   cy={f.y+7}   r="5.5" fill={f.c} opacity="0.94" />
          <circle cx={f.x}   cy={f.y+2}   r="3.5" fill="#fff" opacity="0.85" />
        </g>
      ))}
      {/* Carrot tops peeking from ground */}
      {[{x:228,y:492},{x:264,y:502}].map((c,i) => (
        <g key={i}>
          <path d={`M${c.x} ${c.y} Q${c.x-4} ${c.y-12} ${c.x-7} ${c.y-22}`}
            stroke="#3a8018" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M${c.x} ${c.y} Q${c.x+3} ${c.y-10} ${c.x+6} ${c.y-18}`}
            stroke="#3a8018" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={`M${c.x} ${c.y} Q${c.x} ${c.y-14} ${c.x+1} ${c.y-24}`}
            stroke="#4a9020" strokeWidth="2"   fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// ── PHOENIX: blazing fire sky with volcano silhouettes and embers ──────────
function FireSkyBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="fireSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#160820" />
          <stop offset="18%"  stopColor="#4a1020" />
          <stop offset="42%"  stopColor="#8a2018" />
          <stop offset="62%"  stopColor="#cc5010" />
          <stop offset="78%"  stopColor="#e87020" />
          <stop offset="90%"  stopColor="#f8a040" />
          <stop offset="100%" stopColor="#180808" />
        </linearGradient>
        <radialGradient id="fireSunGlow" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#fff0a0" stopOpacity="0.97" />
          <stop offset="28%"  stopColor="#ff9020" stopOpacity="0.68" />
          <stop offset="65%"  stopColor="#ff6010" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ff4000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#fireSky)" />
      {/* Blazing sun low on horizon */}
      <circle cx="200" cy="545" r="160" fill="url(#fireSunGlow)" />
      <circle cx="200" cy="545" r="48" fill="#fff8d0" opacity="0.97" />
      <circle cx="200" cy="545" r="36" fill="#fffce8" />
      {/* Dark storm clouds top */}
      <path d="M -20 78 Q 50 50 118 74 T 248 60 Q 308 46 368 70 T 440 56 L 440 145 L -20 145 Z"
            fill="#280810" opacity="0.88" />
      <path d="M -20 112 Q 58 86 130 108 T 272 92 Q 318 80 388 102 T 440 88 L 440 158 L -20 158 Z"
            fill="#360c1a" opacity="0.78" />
      <path d="M 0 145 Q 65 128 138 144 T 280 132 Q 344 122 400 138"
            fill="none" stroke="#cc5020" strokeWidth="2.5" opacity="0.68" />
      {/* Mid fire clouds */}
      <path d="M -20 248 Q 62 220 142 240 T 306 225 Q 358 215 440 232 L 440 295 L -20 295 Z"
            fill="#6a1808" opacity="0.55" />
      <path d="M 0 260 Q 82 244 162 256 T 322 246 Q 374 238 400 250"
            fill="none" stroke="#ff7020" strokeWidth="2" opacity="0.52" />
      {/* Volcano silhouettes */}
      <path d="M -20 490 L 55 328 L 135 450 L 192 295 L 265 418 L 345 315 L 420 468 L 430 700 L -20 700 Z"
            fill="#080408" />
      {/* Lava glow at base */}
      <path d="M 50 490 Q 90 476 130 488 Q 160 476 195 488 Q 230 474 270 486 Q 305 472 345 484"
            stroke="#ff6018" strokeWidth="4" fill="none" opacity="0.4" strokeLinecap="round" />
      {/* Floating embers */}
      {[{x:76,y:178},{x:148,y:138},{x:238,y:198},{x:318,y:158},{x:362,y:218},
        {x:108,y:248},{x:285,y:168},{x:175,y:188}].map((e,i) => (
        <circle key={i} cx={e.x} cy={e.y} r={1.5+(i%3)*0.8} fill="#ff9040"
          style={{ animation: `sleepZ ${1.4+i*0.28}s ease-in-out infinite` }} opacity="0.82" />
      ))}
    </svg>
  );
}

// ── UNICORN: magical rainbow meadow with arching rainbow and sparkles ──────
function RainbowMeadowBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="rbSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2878d8" />
          <stop offset="55%"  stopColor="#60b0f0" />
          <stop offset="100%" stopColor="#aad8f8" />
        </linearGradient>
        <radialGradient id="rbSun" cx="0.5" cy="0.5">
          <stop offset="0%"   stopColor="#fff8e0" stopOpacity="0.97" />
          <stop offset="40%"  stopColor="#ffd060" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rbGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#52b830" />
          <stop offset="100%" stopColor="#287018" />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#rbSky)" />
      {/* Sun */}
      <circle cx="345" cy="58" r="72" fill="url(#rbSun)" />
      <circle cx="345" cy="58" r="26" fill="#fff8d0" opacity="0.96" />
      {/* Rainbow arc */}
      {[{r:185,sw:9,c:'#ff2020',op:0.68},{r:172,sw:9,c:'#ff8000',op:0.68},{r:159,sw:9,c:'#ffe000',op:0.7},
        {r:146,sw:9,c:'#38d018',op:0.68},{r:133,sw:9,c:'#1890f8',op:0.68},{r:120,sw:9,c:'#8038e8',op:0.65}
      ].map((rb,i) => (
        <path key={i}
          d={`M ${200-rb.r} 360 A ${rb.r} ${rb.r} 0 0 1 ${200+rb.r} 360`}
          fill="none" stroke={rb.c} strokeWidth={rb.sw} opacity={rb.op} strokeLinecap="round" />
      ))}
      {/* Fluffy clouds */}
      <ellipse cx="72"  cy="134" rx="56" ry="21" fill="#fff" opacity="0.94" />
      <ellipse cx="48"  cy="144" rx="33" ry="18" fill="#fff" opacity="0.91" />
      <ellipse cx="98"  cy="143" rx="36" ry="18" fill="#fff" opacity="0.91" />
      <ellipse cx="282" cy="112" rx="46" ry="17" fill="#fff" opacity="0.88" />
      <ellipse cx="263" cy="122" rx="28" ry="14" fill="#fff" opacity="0.84" />
      <ellipse cx="305" cy="121" rx="30" ry="14" fill="#fff" opacity="0.84" />
      {/* Magic sparkles in sky */}
      {[{x:120,y:82,c:'#ff88cc'},{x:185,y:62,c:'#ffd060'},{x:55,y:72,c:'#88d0ff'},
        {x:226,y:97,c:'#c088ff'},{x:262,y:72,c:'#88ff98'}].map((s,i) => (
        <text key={i} x={s.x} y={s.y} fontSize={10+i%3*3} fill={s.c} opacity="0.65" textAnchor="middle"
          style={{ animation: `sleepZ ${1.6+i*0.38}s ease-in-out infinite` }}>✦</text>
      ))}
      {/* Hills */}
      <path d="M -20 450 Q 82 416 185 440 T 375 424 Q 420 418 450 430 L 450 700 L -20 700 Z"
            fill="#4ab028" opacity="0.6" />
      {/* Ground */}
      <path d="M -20 492 Q 82 470 185 488 T 362 474 Q 408 470 450 480 L 450 700 L -20 700 Z"
            fill="url(#rbGrass)" />
      {/* Sparkle flowers */}
      {[{x:38, y:500,c:'#ff60a0'},{x:68, y:510,c:'#FFD060'},{x:108,y:498,c:'#80e0ff'},
        {x:148,y:512,c:'#ff60a0'},{x:302,y:496,c:'#FFD060'},{x:338,y:506,c:'#a060ff'},
        {x:368,y:498,c:'#ff60a0'},{x:200,y:508,c:'#a060ff'},{x:254,y:500,c:'#FFD060'}].map((f,i) => (
        <text key={i} x={f.x} y={f.y} fontSize="16" fill={f.c} opacity="0.9" textAnchor="middle">✿</text>
      ))}
      {/* Floating magic sparkles near ground */}
      {[{x:88,y:396},{x:196,y:374},{x:308,y:388},{x:152,y:416},{x:258,y:406}].map((s,i) => (
        <text key={i} x={s.x} y={s.y} fontSize="13"
          fill={['#ff88cc','#ffd060','#88d0ff','#c088ff','#88ff98'][i]}
          opacity="0.72" textAnchor="middle"
          style={{ animation: `sleepZ ${1.5+i*0.38}s ease-in-out infinite` }}>✦</text>
      ))}
    </svg>
  );
}

// ── DARK BACKGROUNDS — one per animal dark variant ─────────────────────────

// DOG DARK: foggy haunted forest, blood-red moon, twisted trees
function DarkForestBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="dfSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060008" />
          <stop offset="50%" stopColor="#150a0f" />
          <stop offset="100%" stopColor="#0a0505" />
        </linearGradient>
        <radialGradient id="dfMoon" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#ff2020" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ff2020" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dfFog" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#220a10" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#220a10" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#dfSky)" />
      <circle cx="300" cy="80" r="70" fill="url(#dfMoon)" />
      <circle cx="300" cy="80" r="26" fill="#8b0000" opacity="0.9" />
      <circle cx="308" cy="74" r="18" fill="#0a0508" opacity="0.45" />
      {[{x:40,y:35},{x:82,y:18},{x:148,y:50},{x:218,y:28},{x:258,y:60},{x:58,y:105},{x:132,y:90},{x:192,y:130},{x:360,y:140}].map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={0.6+(i%3)*0.5} fill={i%3===0 ? '#ff4040' : '#ffcccc'} opacity={0.3+(i%4)*0.1} />
      ))}
      <ellipse cx="200" cy="500" rx="280" ry="60" fill="url(#dfFog)" />
      <ellipse cx="100" cy="560" rx="180" ry="40" fill="url(#dfFog)" opacity="0.7" />
      <path d="M -20 490 Q 80 468 180 485 T 360 472 Q 405 468 450 478 L 450 700 L -20 700 Z" fill="#0a0508" />
      <path d="M 40 490 Q 36 440 32 380 Q 28 340 20 300" stroke="#1a0810" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M 32 380 Q 14 360 4 340" stroke="#1a0810" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 38 420 Q 58 400 68 378" stroke="#1a0810" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M 360 492 Q 364 442 370 380 Q 376 340 382 296" stroke="#1a0810" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M 370 380 Q 388 356 396 334" stroke="#1a0810" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 364 420 Q 344 400 334 376" stroke="#1a0810" strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="72" cy="430" rx="3" ry="2" fill="#ff2020" opacity="0.7" />
      <ellipse cx="80" cy="430" rx="3" ry="2" fill="#ff2020" opacity="0.7" />
      <ellipse cx="320" cy="444" rx="3" ry="2" fill="#ff6000" opacity="0.6" />
      <ellipse cx="328" cy="444" rx="3" ry="2" fill="#ff6000" opacity="0.6" />
    </svg>
  );
}

// CAT DARK: midnight cobblestone alley, rain, glowing red eyes
function MidnightAlleyBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="maSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04020a" />
          <stop offset="100%" stopColor="#120818" />
        </linearGradient>
        <linearGradient id="maGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0f20" />
          <stop offset="100%" stopColor="#0a060e" />
        </linearGradient>
        <radialGradient id="maLamp" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#8b00ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b00ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#maSky)" />
      {Array.from({length: 22}, (_, i) => (
        <g key={i}>
          <rect x="-5" y={40+i*26} width="60" height="22" rx="2" fill={i%2===0 ? '#1a0a1e' : '#150818'} stroke="#0a0410" strokeWidth="1" />
          <rect x="345" y={40+i*26} width="65" height="22" rx="2" fill={i%2===0 ? '#1a0a1e' : '#150818'} stroke="#0a0410" strokeWidth="1" />
        </g>
      ))}
      <circle cx="60" cy="220" r="80" fill="url(#maLamp)" />
      <circle cx="60" cy="200" r="8" fill="#cc80ff" opacity="0.8" />
      <rect x="490" y="490" width="415" height="210" fill="url(#maGround)" />
      {Array.from({length: 18}, (_, i) => (
        <g key={i}>
          <ellipse cx={22+i*22} cy={510+((i*7)%30)} rx="9" ry="6" fill="#180e22" stroke="#0a0410" strokeWidth="1" opacity="0.7" />
          <ellipse cx={11+i*22} cy={540+((i*5)%28)} rx="9" ry="6" fill="#200a28" stroke="#0a0410" strokeWidth="1" opacity="0.6" />
        </g>
      ))}
      <path d="M -5 490 L 415 490 L 415 700 L -5 700 Z" fill="url(#maGround)" />
      {[{x:22,y:395},{x:378,y:408},{x:195,y:420}].map((e,i) => (
        <g key={i}>
          <ellipse cx={e.x} cy={e.y} rx="3.5" ry="2.5" fill="#ff2020" opacity="0.75" />
          <ellipse cx={e.x+11} cy={e.y} rx="3.5" ry="2.5" fill="#ff2020" opacity="0.75" />
        </g>
      ))}
      {Array.from({length: 24}, (_, i) => (
        <line key={i} x1={10+i*17} y1={50+i*8} x2={8+i*17} y2={90+i*8}
          stroke="#4a2060" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
      ))}
    </svg>
  );
}

// RABBIT DARK: underground shadow cave, glowing crystals
function ShadowCaveBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="scBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04020e" />
          <stop offset="60%" stopColor="#0a0520" />
          <stop offset="100%" stopColor="#150a2a" />
        </linearGradient>
        <radialGradient id="scCrystal1" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#8b00ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8b00ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="scCrystal2" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#ff0060" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff0060" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#scBg)" />
      {[{x:30,h:80},{x:70,h:50},{x:120,h:110},{x:170,h:65},{x:220,h:95},{x:270,h:55},{x:320,h:85},{x:370,h:70}].map((s,i) => (
        <path key={i} d={`M ${s.x-10} 0 L ${s.x} ${s.h} L ${s.x+10} 0`} fill="#1a0a28" opacity="0.9" />
      ))}
      <circle cx="60" cy="400" r="60" fill="url(#scCrystal1)" />
      <path d="M 48 430 L 55 380 L 60 370 L 65 380 L 72 430 Z" fill="#5500cc" opacity="0.8" />
      <path d="M 38 440 L 44 400 L 48 392 L 52 400 L 58 440 Z" fill="#7700ee" opacity="0.7" />
      <circle cx="340" cy="420" r="55" fill="url(#scCrystal2)" />
      <path d="M 328 450 L 335 400 L 340 390 L 345 400 L 352 450 Z" fill="#aa0050" opacity="0.8" />
      <path d="M 316 460 L 322 415 L 326 406 L 330 415 L 336 460 Z" fill="#cc0060" opacity="0.7" />
      <path d="M -20 490 Q 80 468 180 485 T 360 472 Q 405 468 450 478 L 450 700 L -20 700 Z" fill="#120820" />
      {[{x:90,y:495,c:'#8b00ff'},{x:200,y:502,c:'#ff0060'},{x:290,y:492,c:'#8b00ff'}].map((m,i) => (
        <g key={i}>
          <ellipse cx={m.x} cy={m.y+8} rx="10" ry="4" fill={m.c} opacity="0.3" />
          <path d={`M ${m.x-7} ${m.y} Q ${m.x} ${m.y-14} ${m.x+7} ${m.y}`} fill={m.c} opacity="0.7" />
          <rect x={m.x-2} y={m.y} width="4" height="10" rx="1" fill={m.c} opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

// DRAGON DARK: stormy lightning sky, crackling purple lightning
function StormySkyBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050508" />
          <stop offset="40%" stopColor="#0a0a18" />
          <stop offset="100%" stopColor="#181020" />
        </linearGradient>
        <radialGradient id="stFlash" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#6020ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6020ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#stSky)" />
      {[{cx:100,cy:100,rx:90,ry:40},{cx:280,cy:80,rx:110,ry:45},{cx:200,cy:150,rx:80,ry:35},
        {cx:60,cy:180,rx:70,ry:30},{cx:340,cy:170,rx:75,ry:32},{cx:200,cy:220,rx:100,ry:38}].map((c,i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={`hsl(250,20%,${8+i%3*3}%)`} opacity="0.95" />
      ))}
      <path d="M 80 160 L 64 240 L 78 240 L 58 340 L 72 340 L 46 440" stroke="#a060ff" strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round" />
      <path d="M 80 160 L 64 240 L 78 240 L 58 340 L 72 340 L 46 440" stroke="#fff" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
      <circle cx="62" cy="300" r="60" fill="url(#stFlash)" />
      <path d="M 330 140 L 350 220 L 336 220 L 358 320 L 342 320 L 366 420" stroke="#8040ee" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
      <path d="M -20 490 L 60 380 L 130 460 L 200 340 L 270 450 L 340 370 L 420 460 L 420 700 L -20 700 Z" fill="#0a0810" />
      <path d="M -20 530 Q 100 508 200 520 T 420 510 L 420 700 L -20 700 Z" fill="#060508" />
    </svg>
  );
}

// PHOENIX DARK: volcanic hellscape, lava rivers, ash sky
function VolcanicSkyBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="volSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080204" />
          <stop offset="40%" stopColor="#1a0408" />
          <stop offset="75%" stopColor="#2a0808" />
          <stop offset="100%" stopColor="#3a1008" />
        </linearGradient>
        <linearGradient id="volLava" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6000" />
          <stop offset="100%" stopColor="#8b1a00" />
        </linearGradient>
        <radialGradient id="volGlow" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#ff4000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ff4000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#volSky)" />
      {Array.from({length: 20}, (_, i) => (
        <circle key={i} cx={10+i*20} cy={30+i*12} r={1+(i%3)*0.5} fill="#442020" opacity={0.3+(i%3)*0.15} />
      ))}
      <path d="M 120 490 L 200 260 L 280 490 Z" fill="#1a0808" />
      <path d="M 165 330 L 200 260 L 235 330 Z" fill="#2a0808" />
      <circle cx="200" cy="262" r="80" fill="url(#volGlow)" />
      <ellipse cx="200" cy="268" rx="28" ry="12" fill="#ff4000" opacity="0.8" />
      <path d="M 200 280 Q 190 340 178 420 Q 170 460 165 490" stroke="url(#volLava)" strokeWidth="6" fill="none" opacity="0.75" strokeLinecap="round" />
      <path d="M 200 290 Q 212 348 222 420 Q 230 462 235 490" stroke="url(#volLava)" strokeWidth="5" fill="none" opacity="0.65" strokeLinecap="round" />
      <path d="M -20 490 L 60 462 L 120 490 L 200 460 L 280 490 L 340 465 L 420 485 L 420 700 L -20 700 Z" fill="#180808" />
      <ellipse cx="80" cy="530" rx="45" ry="14" fill="#cc3000" opacity="0.7" />
      <ellipse cx="80" cy="528" rx="35" ry="9" fill="#ff5000" opacity="0.6" />
      <ellipse cx="320" cy="540" rx="40" ry="12" fill="#cc3000" opacity="0.65" />
      {[{x:140,y:200},{x:260,y:180},{x:90,y:310},{x:310,y:290},{x:200,y:150}].map((e,i) => (
        <circle key={i} cx={e.x} cy={e.y} r="2.5" fill="#ff6020" opacity={0.4+(i%3)*0.2}
          style={{ animation: `sleepZ ${1.4+i*0.4}s ease-in-out infinite` }} />
      ))}
    </svg>
  );
}

// UNICORN DARK: shadow realm, void, corrupted rainbow, floating crystals
function ShadowRealmBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="srBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#02000a" />
          <stop offset="50%" stopColor="#080218" />
          <stop offset="100%" stopColor="#100820" />
        </linearGradient>
        <radialGradient id="srNebula" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#3a006a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3a006a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="srNebula2" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#001a3a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#001a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#srBg)" />
      <ellipse cx="100" cy="200" rx="150" ry="100" fill="url(#srNebula)" />
      <ellipse cx="300" cy="280" rx="120" ry="80" fill="url(#srNebula2)" />
      {[{r:185,c:'#4a0040'},{r:170,c:'#200038'},{r:155,c:'#001a30'},{r:140,c:'#002a10'},{r:125,c:'#200020'},{r:110,c:'#300040'}].map((rb,i) => (
        <path key={i} d={`M ${200-rb.r} 380 A ${rb.r} ${rb.r} 0 0 1 ${200+rb.r} 380`}
          fill="none" stroke={rb.c} strokeWidth="7" opacity="0.6" strokeLinecap="round" />
      ))}
      {[{x:60,y:200},{x:340,y:180},{x:160,y:120},{x:260,y:140},{x:110,y:320},{x:290,y:300}].map((c,i) => (
        <g key={i} style={{ animation: `sleepZ ${1.6+i*0.35}s ease-in-out infinite` }}>
          <path d={`M ${c.x} ${c.y-18} L ${c.x-8} ${c.y} L ${c.x} ${c.y+8} L ${c.x+8} ${c.y} Z`}
            fill={i%2===0 ? '#2a0050' : '#001840'} opacity="0.85" />
          <path d={`M ${c.x} ${c.y-18} L ${c.x-8} ${c.y} L ${c.x} ${c.y+8} L ${c.x+8} ${c.y} Z`}
            fill="none" stroke={i%2===0 ? '#8b00ff' : '#0060ff'} strokeWidth="1" opacity="0.5" />
        </g>
      ))}
      <path d="M -20 490 Q 80 468 180 485 T 360 472 Q 405 468 450 478 L 450 700 L -20 700 Z" fill="#080218" />
      {[{x:60,y:380},{x:160,y:400},{x:240,y:370},{x:340,y:390}].map((s,i) => (
        <text key={i} x={s.x} y={s.y} fontSize="14" fill={i%2===0 ? '#8b00ff' : '#0060ff'}
          opacity="0.5" textAnchor="middle"
          style={{ animation: `sleepZ ${1.4+i*0.4}s ease-in-out infinite` }}>✦</text>
      ))}
    </svg>
  );
}


function LoungeBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="loungeWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1f1828" />
          <stop offset="100%" stopColor="#2c2034" />
        </linearGradient>
        <linearGradient id="loungeFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1a1018" />
          <stop offset="100%" stopColor="#0a0608" />
        </linearGradient>
        <radialGradient id="loungeLampGlow" cx="0.5" cy="0.5">
          <stop offset="0%"  stopColor="#ffb060" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffb060" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="loungeWindowGlow" cx="0.5" cy="0.5">
          <stop offset="0%"  stopColor="#dde6ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#dde6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="couchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#5a3a4a" />
          <stop offset="100%" stopColor="#3a2030" />
        </linearGradient>
        <radialGradient id="rugGrad" cx="0.5" cy="0.5">
          <stop offset="0%"  stopColor="#7a3848" />
          <stop offset="100%" stopColor="#3a1a25" />
        </radialGradient>
      </defs>

      <rect width="400" height="500" fill="url(#loungeWall)" />
      <rect y="500" width="400" height="200" fill="url(#loungeFloor)" />
      <line x1="0" y1="500" x2="400" y2="500" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Picture frame on left wall */}
      <rect x="40" y="80" width="80" height="100" rx="2" fill="#0a0610" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <rect x="45" y="85" width="70" height="90" fill="#3a2848" />
      <circle cx="80" cy="115" r="16" fill="#ff8a60" opacity="0.55" />
      <path d="M 50 165 Q 80 145 110 165" stroke="#7fa050" strokeWidth="3" fill="none" opacity="0.7" />

      {/* Window with curtains on right */}
      <circle cx="310" cy="120" r="55" fill="url(#loungeWindowGlow)" />
      <rect x="265" y="60" width="90" height="120" rx="3" fill="#0a0612" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
      <rect x="266" y="61" width="88" height="118" rx="2.5" fill="#1a2438" opacity="0.7" />
      <line x1="310" y1="60" x2="310" y2="180" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
      <line x1="265" y1="120" x2="355" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
      <path d="M 263 60 Q 257 100 261 180" stroke="#a87850" strokeWidth="4" fill="none" opacity="0.8" />
      <path d="M 357 60 Q 363 100 359 180" stroke="#a87850" strokeWidth="4" fill="none" opacity="0.8" />

      {/* Pendant lamp glow centered */}
      <circle cx="200" cy="240" r="120" fill="url(#loungeLampGlow)" />
      <line x1="200" y1="0" x2="200" y2="218" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <path d="M 178 218 L 222 218 L 215 198 L 185 198 Z" fill="#3a2840" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <ellipse cx="200" cy="200" rx="20" ry="5" fill="#ffb060" opacity="0.55" />

      {/* Plant on right side floor */}
      <ellipse cx="358" cy="510" rx="22" ry="4" fill="#000" opacity="0.4" />
      <path d="M 340 508 L 376 508 L 370 478 L 346 478 Z" fill="#5a3a30" />
      <line x1="346" y1="488" x2="370" y2="488" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      <path d="M 348 478 Q 340 458 335 438 Q 350 446 350 470" fill="#3a6048" />
      <path d="M 358 478 Q 372 452 366 428 Q 376 442 366 472" fill="#4a7058" />
      <path d="M 368 478 Q 380 458 388 442 Q 380 466 374 476" fill="#3a6048" />

      {/* Rug under couch */}
      <ellipse cx="200" cy="630" rx="180" ry="28" fill="url(#rugGrad)" opacity="0.7" />
      <ellipse cx="200" cy="630" rx="160" ry="22" fill="none" stroke="#a05060" strokeWidth="1.5" opacity="0.4" />

      {/* Couch silhouette */}
      <path d="M 50 540 Q 50 478 92 478 L 308 478 Q 350 478 350 540 L 350 600 Q 350 620 332 620 L 68 620 Q 50 620 50 600 Z"
            fill="url(#couchGrad)" />
      {/* Couch back ridge */}
      <path d="M 50 478 Q 50 470 92 470 L 308 470 Q 350 470 350 478"
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Cushions */}
      <ellipse cx="120" cy="510" rx="38" ry="20" fill="#6a4a5a" opacity="0.55" />
      <ellipse cx="200" cy="500" rx="42" ry="22" fill="#6a4a5a" opacity="0.55" />
      <ellipse cx="280" cy="510" rx="38" ry="20" fill="#6a4a5a" opacity="0.55" />
      {/* Couch arm shadows */}
      <ellipse cx="60" cy="555" rx="14" ry="35" fill="#000" opacity="0.3" />
      <ellipse cx="340" cy="555" rx="14" ry="35" fill="#000" opacity="0.3" />

      {/* Floor lamp glow on far left */}
      <radialGradient id="loungeFloorLampGlow" cx="0.5" cy="0.5">
        <stop offset="0%"  stopColor="#ffb060" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#ffb060" stopOpacity="0" />
      </radialGradient>
      <circle cx="35" cy="600" r="80" fill="url(#loungeFloorLampGlow)" />
    </svg>
  );
}

function KitchenBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="kitchenWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1a1f2a" />
          <stop offset="100%" stopColor="#252b3a" />
        </linearGradient>
        <linearGradient id="kitchenCounter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3e4658" />
          <stop offset="100%" stopColor="#2a3148" />
        </linearGradient>
        <linearGradient id="kitchenCab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#2a303f" />
          <stop offset="100%" stopColor="#1a1f2a" />
        </linearGradient>
        <linearGradient id="kitchenFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#0d1218" />
          <stop offset="100%" stopColor="#050810" />
        </linearGradient>
        <radialGradient id="kitchenLight" cx="0.5" cy="0.5">
          <stop offset="0%"  stopColor="#ffd078" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffd078" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="380" fill="url(#kitchenWall)" />

      {/* Upper cabinets (3 across) */}
      <rect x="20"  y="60" width="115" height="120" rx="4" fill="url(#kitchenCab)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <rect x="142" y="60" width="115" height="120" rx="4" fill="url(#kitchenCab)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <rect x="265" y="60" width="115" height="120" rx="4" fill="url(#kitchenCab)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      {/* cabinet handles */}
      <rect x="76"  y="115" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.3)" />
      <rect x="198" y="115" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.3)" />
      <rect x="320" y="115" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.3)" />

      {/* Pendant light over counter */}
      <line x1="200" y1="0" x2="200" y2="240" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M 175 240 L 225 240 L 215 270 L 185 270 Z" fill="#1a1218" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <ellipse cx="200" cy="270" rx="20" ry="4" fill="#ffd078" opacity="0.85" />
      <circle cx="200" cy="320" r="140" fill="url(#kitchenLight)" />

      {/* Tile backsplash band — simplified subway tiles */}
      <rect x="0" y="200" width="400" height="180" fill="#1f2530" />
      {/* row 1 */}
      <rect x="6"   y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="58"  y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="110" y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="162" y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="214" y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="266" y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="318" y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="370" y="210" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {/* row 2 — offset */}
      <rect x="-20" y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="32"  y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="84"  y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="136" y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="188" y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="240" y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="292" y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="344" y="242" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {/* row 3 */}
      <rect x="6"   y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="58"  y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="110" y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="162" y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="214" y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="266" y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="318" y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <rect x="370" y="274" width="48" height="28" fill="#252b38" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      {/* Counter top (where treats sit) */}
      <rect x="0" y="380" width="400" height="48" fill="url(#kitchenCounter)" />
      <line x1="0" y1="380" x2="400" y2="380" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <line x1="0" y1="428" x2="400" y2="428" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />

      {/* Lower cabinets */}
      <rect x="0" y="428" width="400" height="195" fill="#1a1f2a" />
      <rect x="20"  y="442" width="115" height="170" rx="4" fill="url(#kitchenCab)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="142" y="442" width="115" height="170" rx="4" fill="url(#kitchenCab)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="265" y="442" width="115" height="170" rx="4" fill="url(#kitchenCab)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="76"  y="520" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.3)" />
      <rect x="198" y="520" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.3)" />
      <rect x="320" y="520" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.3)" />

      {/* Floor */}
      <rect y="623" width="400" height="77" fill="url(#kitchenFloor)" />
      <line x1="0" y1="623" x2="400" y2="623" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BATHROOM BG — bathtub with water for groom scene
// ────────────────────────────────────────────────────────────────────────────
function BathroomBg() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         viewBox="0 0 400 700"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="bathroomWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#1e2438" />
        </linearGradient>
        <linearGradient id="tubOuter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdd6e0" />
          <stop offset="100%" stopColor="#a8b8c8" />
        </linearGradient>
        <linearGradient id="tubInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2530" />
          <stop offset="100%" stopColor="#121b22" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ec9e8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1a7fa0" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="waterSheen" cx="0.3" cy="0.2" r="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bathroomFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141820" />
          <stop offset="100%" stopColor="#080b10" />
        </linearGradient>
      </defs>

      {/* Wall */}
      <rect width="400" height="700" fill="url(#bathroomWall)" />

      {/* Subtle wall tiles */}
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => (
          <rect key={`bt${r}-${c}`} x={c * 50 - 4} y={r * 50} width={46} height={46}
            fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" rx="1" />
        ))
      )}

      {/* Shelf above tub */}
      <rect x="260" y="148" width="120" height="10" rx="3" fill="#2a3040" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {/* Shampoo bottle 1 */}
      <rect x="268" y="118" width="18" height="30" rx="4" fill="#8B7CF8" opacity="0.9" />
      <rect x="273" y="112" width="8" height="8" rx="2" fill="#6a5cd8" opacity="0.9" />
      {/* Shampoo bottle 2 */}
      <rect x="292" y="122" width="14" height="26" rx="3" fill="#FF6B9D" opacity="0.85" />
      <rect x="296" y="118" width="6" height="6" rx="1.5" fill="#e0507a" opacity="0.9" />
      {/* Small jar */}
      <ellipse cx="316" cy="148" rx="10" ry="7" fill="#00E5B4" opacity="0.7" />
      <rect x="306" y="130" width="20" height="18" rx="3" fill="#00C89a" opacity="0.7" />

      {/* Floor */}
      <rect y="590" width="400" height="110" fill="url(#bathroomFloor)" />
      <line x1="0" y1="590" x2="400" y2="590" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      {/* Floor tiles */}
      <line x1="0" y1="620" x2="400" y2="620" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="0" y1="650" x2="400" y2="650" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {[50,100,150,200,250,300,350].map(x => (
        <line key={x} x1={x} y1="590" x2={x} y2="700" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* ── BATHTUB ── */}
      {/* Outer tub shell */}
      <path d="M 10 330 Q 10 280 55 280 L 345 280 Q 390 280 390 330 L 390 555 Q 390 580 345 580 L 55 580 Q 10 580 10 555 Z"
        fill="url(#tubOuter)" />
      {/* Inner cavity */}
      <path d="M 32 338 Q 32 300 68 300 L 332 300 Q 368 300 368 338 L 368 554 Q 368 570 332 570 L 68 570 Q 32 570 32 554 Z"
        fill="url(#tubInner)" />

      {/* ── WATER ── */}
      <path d="M 32 460 L 368 460 L 368 554 Q 368 570 332 570 L 68 570 Q 32 570 32 554 Z"
        fill="url(#waterGrad)" />
      {/* Water sheen overlay */}
      <path d="M 32 460 L 368 460 L 368 475 Q 200 462 32 475 Z"
        fill="url(#waterSheen)" />
      {/* Animated water surface line */}
      <path d="M 32 460 Q 130 452 200 460 Q 270 468 368 460"
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"
        style={{ animation: 'tubWater 2.5s ease-in-out infinite', transformOrigin: 'center 460px' }} />

      {/* Tub rim top highlight */}
      <path d="M 10 280 Q 10 274 55 274 L 345 274 Q 390 274 390 280"
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Taps on rim */}
      <rect x="170" y="268" width="16" height="14" rx="3" fill="#b8c8d8" />
      <ellipse cx="178" cy="266" rx="8" ry="4" fill="#9aaaba" />
      <rect x="214" y="268" width="16" height="14" rx="3" fill="#c8b0b0" />
      <ellipse cx="222" cy="266" rx="8" ry="4" fill="#b09898" />

      {/* ── BATH PRODUCTS on left tub rim ── */}
      {/* Shampoo bottle — tall, teal */}
      <rect x="38" y="244" width="20" height="36" rx="5" fill="#00C89a" opacity="0.92" />
      <rect x="43" y="238" width="10" height="8" rx="2" fill="#00a07a" opacity="0.95" />
      <rect x="41" y="256" width="14" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
      <rect x="41" y="262" width="10" height="1.5" rx="1" fill="rgba(255,255,255,0.2)" />
      <ellipse cx="48" cy="278" rx="7" ry="2.5" fill="rgba(0,0,0,0.15)" />

      {/* Conditioner bottle — shorter, pink/rose */}
      <rect x="62" y="252" width="18" height="28" rx="5" fill="#FF6B9D" opacity="0.9" />
      <rect x="66" y="246" width="10" height="8" rx="2" fill="#e05080" opacity="0.95" />
      <rect x="65" y="264" width="12" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
      <ellipse cx="71" cy="278" rx="6" ry="2" fill="rgba(0,0,0,0.15)" />

      {/* Soap bar — cream/white rectangle with bubbles on top */}
      <rect x="84" y="262" width="30" height="18" rx="5" fill="#f0e8d8" opacity="0.95" />
      <path d="M 89 262 Q 99 256 109 262" fill="#e0d8c8" opacity="0.8" />
      {/* soap shine */}
      <ellipse cx="91" cy="267" rx="4" ry="2.5" fill="rgba(255,255,255,0.55)" />
      {/* tiny soap bubbles */}
      <circle cx="86" cy="259" r="2.5" fill="rgba(255,255,255,0.5)" stroke="rgba(200,200,255,0.4)" strokeWidth="0.8" />
      <circle cx="93" cy="256" r="2" fill="rgba(255,255,255,0.45)" stroke="rgba(200,200,255,0.35)" strokeWidth="0.8" />
      <circle cx="100" cy="255" r="2.5" fill="rgba(255,255,255,0.5)" stroke="rgba(200,200,255,0.4)" strokeWidth="0.8" />
      <ellipse cx="99" cy="278" rx="9" ry="2" fill="rgba(0,0,0,0.1)" />

      {/* Rubber duck in tub */}
      <ellipse cx="316" cy="456" rx="16" ry="10" fill="#FFB020" />
      <circle cx="316" cy="447" r="11" fill="#FFD060" />
      <ellipse cx="323" cy="444" rx="5" ry="3.5" fill="#FF8820" />
      <circle cx="320" cy="442" r="2" fill="#1a1a1a" />
      <circle cx="320.8" cy="441.2" r="0.7" fill="#fff" opacity="0.8" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// VACUUM SVG — little robot vacuum that cleans crumbs
// ────────────────────────────────────────────────────────────────────────────
function VacuumSVG({ size = 80 }) {
  return (
    <svg viewBox="0 0 120 60" width={size} height={size * 0.5}>
      {/* Body */}
      <ellipse cx="60" cy="30" rx="50" ry="22" fill="#2a3a4a" />
      <ellipse cx="60" cy="30" rx="48" ry="20" fill="#1a2a38" />
      {/* Top dome */}
      <ellipse cx="60" cy="20" rx="30" ry="12" fill="#3a4a5a" />
      {/* Sensor eye */}
      <circle cx="60" cy="18" r="5" fill="#00E5B4" opacity="0.9" />
      <circle cx="60" cy="18" r="3" fill="#00bfa0" />
      <circle cx="61" cy="17" r="1.2" fill="#fff" opacity="0.7" />
      {/* Status light */}
      <circle cx="80" cy="22" r="3" fill="#00E5B4" opacity="0.8" />
      {/* Intake mouth at bottom */}
      <path d="M 20 48 Q 60 52 100 48" fill="none" stroke="#4a6a7a" strokeWidth="3" strokeLinecap="round" />
      {/* Wheels */}
      <ellipse cx="28" cy="50" rx="12" ry="6" fill="#0a1418" />
      <ellipse cx="92" cy="50" rx="12" ry="6" fill="#0a1418" />
      <ellipse cx="28" cy="50" rx="8" ry="4" fill="#1a2428" />
      <ellipse cx="92" cy="50" rx="8" ry="4" fill="#1a2428" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SPARKLE BURST (used at scene end)
// ────────────────────────────────────────────────────────────────────────────
function SparkleBurst({ color = T.teal, count = 12 }) {
  const sparkles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist = 60 + Math.random() * 30;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: Math.random() * 0.2,
      };
    });
  }, [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {sparkles.map(s => (
        <div key={s.id} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 10, height: 10, borderRadius: '50%',
          background: color, boxShadow: `0 0 12px ${color}`,
          '--dx': `${s.dx}px`, '--dy': `${s.dy}px`,
          animation: `sparkleFly 1.1s ease-out ${s.delay}s forwards`,
        }} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// INTERACTION SCENE WRAPPER — header (mute, close), routes to scene by type
// ────────────────────────────────────────────────────────────────────────────
function InteractionScene({ user, setUser, type, onComplete, onCancel }) {
  const [muted, setMuted] = useState(user.soundOn === false);

  useEffect(() => {
    ensureAudio().then(() => { setAudioMuted(muted); });
  }, []);
  useEffect(() => { setAudioMuted(muted); }, [muted]);

  async function toggleMute() {
    const next = !muted;
    setMuted(next);
    const updated = { ...user, soundOn: !next };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
  }

  const actDef = ACTIVITY_BY_ANIMAL[user.petType] || ACTIVITY_BY_ANIMAL.dog;
  const sceneTitles = {
    treat: 'Treat time',
    cuddle: 'Cuddle time',
    play: 'Play time',
    groom: 'Groom time',
    activity: `${actDef.label} time`,
  };

  const SceneComponent = {
    treat: TreatScene,
    cuddle: CuddleScene,
    play: PlayScene,
    groom: GroomScene,
    activity: ActivityScene,
  }[type];

  if (!SceneComponent) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg, zIndex: 60,
      display: 'flex', flexDirection: 'column',
      animation: 'sceneIn 0.3s ease-out',
    }}>
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
      }}>
        <button onClick={onCancel} style={iconBtnLg} aria-label="Back">
          <ChevronLeft size={24} color={T.text} />
        </button>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
          color: T.text, letterSpacing: '-0.2px',
        }}>{sceneTitles[type]}</div>
        <button onClick={toggleMute} style={iconBtnLg} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX size={20} color={T.muted} /> : <Volume2 size={20} color={T.text} />}
        </button>
      </div>
      <SceneComponent user={user} onComplete={onComplete} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TREAT SCENE — drag cookies to the pet's mouth; crumbs fall, vacuum cleans up
// ────────────────────────────────────────────────────────────────────────────
function TreatScene({ user, onComplete }) {
  const TOTAL = 3;
  const stageRef = useRef(null);
  const [cookies, setCookies] = useState(() => Array.from({ length: TOTAL }, (_, i) => ({
    id: i, eaten: false, x: 0, y: 0, dragging: false,
  })));
  const [eatenCount, setEatenCount] = useState(0);
  const [chewing, setChewing] = useState(false);
  const [done, setDone] = useState(false);
  const [crumbs, setCrumbs] = useState([]);
  const [showVacuum, setShowVacuum] = useState(false);
  const [vacuumDone, setVacuumDone] = useState(false);
  const [showVacuumMsg, setShowVacuumMsg] = useState(false);
  const crumbIdRef = useRef(0);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activeIdRef = useRef(null);

  function getMouthScreenPos() {
    if (!stageRef.current) return { x: 0, y: 0 };
    const rect = stageRef.current.getBoundingClientRect();
    const petCenterX = rect.width / 2;
    const petCenterY = rect.height * 0.42;
    const mouth = MOUTH_POINTS[user.petType] || MOUTH_POINTS.dog;
    const petSize = 220;
    const scale = petSize / 200;
    return {
      x: petCenterX,
      y: petCenterY + (mouth.y - 100) * scale,
    };
  }

  function spawnCrumbs(mouthX, mouthY) {
    const count = 5 + Math.floor(Math.random() * 3);
    const newCrumbs = Array.from({ length: count }, () => {
      const id = crumbIdRef.current++;
      const cx = (Math.random() - 0.5) * 120;
      const cy = 60 + Math.random() * 80;
      const cr = (Math.random() - 0.5) * 180;
      return { id, x: mouthX + (Math.random() - 0.5) * 20, y: mouthY, cx, cy, cr, fading: false };
    });
    setCrumbs(cs => [...cs, ...newCrumbs]);
  }

  function startDrag(id, clientX, clientY) {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    activeIdRef.current = id;
    setCookies(cs => cs.map(c => c.id === id ? {
      ...c, dragging: true,
      x: clientX - rect.left,
      y: clientY - rect.top,
    } : c));
  }

  function moveDrag(clientX, clientY) {
    if (activeIdRef.current === null || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const id = activeIdRef.current;
    setCookies(cs => cs.map(c => c.id === id ? {
      ...c, x: clientX - rect.left, y: clientY - rect.top,
    } : c));
  }

  function endDrag() {
    if (activeIdRef.current === null) return;
    const id = activeIdRef.current;
    activeIdRef.current = null;
    setCookies(cs => {
      const c = cs.find(x => x.id === id);
      if (!c) return cs;
      const mouth = getMouthScreenPos();
      const dx = c.x - mouth.x;
      const dy = c.y - mouth.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        sfx.munch();
        setChewing(true);
        setTimeout(() => setChewing(false), 600);
        // spawn crumbs from mouth
        spawnCrumbs(mouth.x, mouth.y);
        setEatenCount(n => {
          const next = n + 1;
          if (next >= TOTAL) {
            setTimeout(() => sfx.yum(), 200);
            setTimeout(() => setDone(true), 700);
            // vacuum rolls in after cookies done
            setTimeout(() => setShowVacuum(true), 1100);
            setTimeout(() => {
              setCrumbs(cs => cs.map(c => ({ ...c, fading: true })));
            }, 2200);
            setTimeout(() => setShowVacuumMsg(true), 3500);
            setTimeout(() => {
              setVacuumDone(true);
              onComplete();
            }, 5200);
          }
          return next;
        });
        return cs.map(x => x.id === id ? { ...x, eaten: true, dragging: false } : x);
      }
      return cs.map(x => x.id === id ? { ...x, dragging: false } : x);
    });
  }

  useEffect(() => {
    function onMove(e) {
      const t = e.touches ? e.touches[0] : e;
      moveDrag(t.clientX, t.clientY);
    }
    function onUp() { endDrag(); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const stageW = stageRef.current?.getBoundingClientRect().width || 400;
  const treatDef = TREAT_BY_ANIMAL[user.petType] || TREAT_BY_ANIMAL.dog;
  const TreatComponent = treatDef.Treat;

  return (
    <div ref={stageRef} style={{
      ...sceneStageStyle,
      background: `radial-gradient(circle at 50% 30%, ${user.petColor}1f 0%, ${T.bg} 70%)`,
    }}>
      <KitchenBg />

      {/* Crumbs on the floor */}
      {crumbs.map(crumb => (
        <div key={crumb.id} style={{
          position: 'absolute',
          left: crumb.x,
          top: crumb.y,
          width: 7, height: 5, borderRadius: '40%',
          background: `#${['c89060','a06840','e8a878','8a5030'][crumb.id % 4]}`,
          '--cx': `${crumb.cx}px`,
          '--cy': `${crumb.cy}px`,
          '--cr': `${crumb.cr}deg`,
          animation: crumb.fading
            ? `crumbFade 0.5s ease-in forwards`
            : `crumbFall 0.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      ))}

      {/* Vacuum cleaner rolling across */}
      {showVacuum && !vacuumDone && (
        <div style={{
          position: 'absolute',
          bottom: 75,
          left: 0,
          '--vx-start': '-100px',
          '--vx-end': `${stageW + 100}px`,
          animation: `vacuumSlide 3.2s cubic-bezier(0.4,0,0.2,1) forwards`,
          pointerEvents: 'none',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <VacuumSVG size={80} />
          {/* Suction particles */}
          {[0,1,2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              bottom: -4 + i * 4,
              left: 6 + i * 8,
              width: 4, height: 4, borderRadius: '50%',
              background: T.teal, opacity: 0.7,
              animation: `bubbleRise 0.5s ease-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      )}

      <div style={{
        position: 'absolute', top: '42%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: chewing ? 'chewBob 0.6s ease-out' : 'none',
        transformOrigin: 'center bottom',
        zIndex: 4,
      }}>
        <AnimalPet type={user.petType} color={user.petColor}
                   mood={done ? 'happy' : 'awake'} size={220} chewing={chewing}
                   variant={user.petVariant || 'cute'} />
      </div>

      {!done && eatenCount < TOTAL && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 14,
          padding: '14px 20px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${T.border}`,
          borderRadius: 22,
          backdropFilter: 'blur(8px)',
          zIndex: 6,
        }}>
          {cookies.map(c => c.eaten ? null : (
            <div key={c.id}
              onMouseDown={(e) => startDrag(c.id, e.clientX, e.clientY)}
              onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag(c.id, t.clientX, t.clientY); }}
              style={{
                position: c.dragging ? 'fixed' : 'relative',
                left: c.dragging ? (stageRef.current?.getBoundingClientRect().left || 0) + c.x - 28 : 'auto',
                top: c.dragging ? (stageRef.current?.getBoundingClientRect().top || 0) + c.y - 28 : 'auto',
                cursor: 'grab', touchAction: 'none', userSelect: 'none',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                transform: c.dragging ? 'scale(1.15)' : 'scale(1)',
                transition: c.dragging ? 'none' : 'transform 0.15s',
                zIndex: c.dragging ? 70 : 1,
              }}>
              <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TreatComponent size={52} color={T.amber} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!done && (
        <div style={{
          position: 'absolute', top: 16, left: 0, right: 0,
          textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: 'DM Sans',
          pointerEvents: 'none',
        }}>
          {eatenCount === 0 ? treatDef.dragHint : `${eatenCount}/${TOTAL} ${treatDef.label}s`}
        </div>
      )}

      {done && !showVacuum && <SparkleBurst color={T.amber} />}

      {/* Vacuum praise message */}
      {showVacuumMsg && (
        <div style={{
          position: 'absolute', bottom: 140, left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${T.amber}, #e8900a)`,
          color: '#0d1825', borderRadius: 18,
          padding: '14px 22px',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 16,
          textAlign: 'center', whiteSpace: 'nowrap',
          boxShadow: `0 8px 28px ${T.amber}55`,
          animation: 'shakeIn 0.4s ease-out',
          zIndex: 10, pointerEvents: 'none',
        }}>
          Well done {user.petName}! 🧹<br />
          <span style={{ fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600 }}>
            You vacuumed your mess up!
          </span>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CUDDLE SCENE — long-press to fill the heart meter
// ────────────────────────────────────────────────────────────────────────────
function CuddleScene({ user, onComplete }) {
  const HOLD_MS = 4500;
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const [hearts, setHearts] = useState([]);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(null);
  const heartIdRef = useRef(0);
  const heartIntervalRef = useRef(null);

  function startHold() {
    if (done) return;
    setHolding(true);
    startTimeRef.current = Date.now();
    sfx.humStart();
    heartIntervalRef.current = setInterval(() => {
      const id = heartIdRef.current++;
      const drift = (Math.random() - 0.5) * 80;
      setHearts(hs => [...hs, { id, drift }]);
      setTimeout(() => setHearts(hs => hs.filter(h => h.id !== id)), 1500);
    }, 280);
    function tick() {
      const elapsed = Date.now() - startTimeRef.current;
      const total = accumulatedRef.current + elapsed;
      const p = Math.min(1, total / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        accumulatedRef.current = HOLD_MS;
        setProgress(1);
        setDone(true);
        endHold(true);
        sfx.cuddleDone();
        setTimeout(() => onComplete(), 1400);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  function endHold(completed) {
    if (!holding && !completed) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (heartIntervalRef.current) {
      clearInterval(heartIntervalRef.current);
      heartIntervalRef.current = null;
    }
    sfx.humStop();
    if (!completed) {
      const elapsed = Date.now() - startTimeRef.current;
      accumulatedRef.current = Math.min(HOLD_MS, accumulatedRef.current + elapsed);
    }
    setHolding(false);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (heartIntervalRef.current) clearInterval(heartIntervalRef.current);
      sfx.humStop();
    };
  }, []);

  return (
    <div style={{
      ...sceneStageStyle,
      background: `radial-gradient(circle at 50% 35%, ${T.pink}22 0%, ${T.bg} 70%)`,
    }}>
      <LoungeBg />
      <div
        onMouseDown={startHold}
        onMouseUp={() => endHold(false)}
        onMouseLeave={() => endHold(false)}
        onTouchStart={(e) => { e.preventDefault(); startHold(); }}
        onTouchEnd={() => endHold(false)}
        style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: holding ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none',
        }}
      >
        {/* Pulse ring while holding */}
        {holding && (
          <div style={{
            position: 'absolute', inset: -30,
            borderRadius: '50%',
            border: `2px solid ${T.pink}66`,
            animation: 'pulseRing 1.4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
        <AnimalPet type={user.petType} color={user.petColor}
                   mood={done ? 'happy' : holding ? 'happy' : 'awake'} size={220}
                   variant={user.petVariant || 'cute'} />
      </div>

      {/* Floating hearts */}
      {hearts.map(h => (
        <div key={h.id} style={{
          position: 'absolute', top: '30%', left: '50%',
          color: T.pink, fontSize: 24,
          '--drift': `${h.drift}px`,
          animation: 'cuddleHeart 1.5s ease-out forwards',
          pointerEvents: 'none',
        }}>♥</div>
      ))}

      {!done && (
        <div style={{
          position: 'absolute', top: 20, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
        }}>
          <Heart size={16} color={T.pink} fill={T.pink} />
          <div style={{
            width: 140, height: 6, borderRadius: 3,
            background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: T.pink, transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}

      {!done && (
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0,
          textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: 'DM Sans',
          pointerEvents: 'none',
        }}>
          {holding ? 'keep holding...' : 'press and hold to cuddle'}
        </div>
      )}

      {done && <SparkleBurst color={T.pink} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PLAY SCENE — drag the ball, throw it, pet fetches
// ────────────────────────────────────────────────────────────────────────────
function PlayScene({ user, onComplete }) {
  const TOTAL = 2;
  const stageRef = useRef(null);
  const homeRef = useRef({ pet: { x: 0, y: 0 }, ball: { x: 0, y: 0 } });
  const sizeRef = useRef({ w: 0, h: 0 });

  const [petPos, setPetPosState] = useState({ x: 0, y: 0 });
  const [ballPos, setBallPosState] = useState({ x: 0, y: 0 });
  const [petFlip, setPetFlip] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | dragging | flying | running | bringing | done
  const [fetches, setFetches] = useState(0);
  const [done, setDone] = useState(false);

  const petPosRef = useRef({ x: 0, y: 0 });
  const ballPosRef = useRef({ x: 0, y: 0 });
  const phaseRef = useRef('idle');
  const fetchesRef = useRef(0);
  const dragHistoryRef = useRef([]);
  const tweenIdRef = useRef(0);

  function setPet(p) { petPosRef.current = p; setPetPosState(p); }
  function setBall(p) { ballPosRef.current = p; setBallPosState(p); }
  function changePhase(p) { phaseRef.current = p; setPhase(p); }

  useLayoutEffect(() => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    sizeRef.current = { w: rect.width, h: rect.height };
    const home = {
      pet: { x: rect.width / 2, y: rect.height * 0.32 },
      ball: { x: rect.width / 2, y: rect.height - 110 },
    };
    homeRef.current = home;
    setPet(home.pet);
    setBall(home.ball);
  }, []);

  function tween(target, durationMs, prop, onDone) {
    const id = ++tweenIdRef.current;
    const startTime = performance.now();
    const start = prop === 'ball' ? { ...ballPosRef.current } : { ...petPosRef.current };
    function frame(now) {
      if (id !== tweenIdRef.current) return;
      const t = Math.min(1, (now - startTime) / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
      };
      if (prop === 'ball') setBall(cur);
      else setPet(cur);
      if (t < 1) requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    requestAnimationFrame(frame);
  }

  function startDrag(clientX, clientY) {
    if (phaseRef.current !== 'idle' || done) return;
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const bx = ballPosRef.current.x, by = ballPosRef.current.y;
    const dx = x - bx, dy = y - by;
    if (Math.sqrt(dx * dx + dy * dy) > 50) return;
    changePhase('dragging');
    dragHistoryRef.current = [{ x, y, t: performance.now() }];
    setBall({ x, y });
  }
  function moveDrag(clientX, clientY) {
    if (phaseRef.current !== 'dragging' || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const now = performance.now();
    dragHistoryRef.current.push({ x, y, t: now });
    dragHistoryRef.current = dragHistoryRef.current.filter(h => now - h.t < 140);
    setBall({ x, y });
  }
  function endDrag() {
    if (phaseRef.current !== 'dragging') return;
    const hist = dragHistoryRef.current;
    if (hist.length < 2) {
      changePhase('idle');
      tween(homeRef.current.ball, 250, 'ball');
      return;
    }
    const first = hist[0], last = hist[hist.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.15) {
      changePhase('idle');
      tween(homeRef.current.ball, 250, 'ball');
      return;
    }
    changePhase('flying');
    sfx.boing();
    const flightTime = 700;
    const target = {
      x: Math.max(40, Math.min(sizeRef.current.w - 40, last.x + vx * flightTime * 0.32)),
      y: Math.max(40, Math.min(sizeRef.current.h - 40, last.y + vy * flightTime * 0.32)),
    };
    tween(target, flightTime, 'ball', () => {
      sfx.thud();
      changePhase('running');
      setPetFlip(target.x < petPosRef.current.x);
      tween({ x: target.x, y: target.y }, 800, 'pet', () => {
        changePhase('bringing');
        setPetFlip(homeRef.current.pet.x < petPosRef.current.x);
        tween(homeRef.current.pet, 850, 'pet', () => {
          fetchesRef.current += 1;
          setFetches(fetchesRef.current);
          if (fetchesRef.current >= TOTAL) {
            sfx.fetchHappy();
            changePhase('done');
            setDone(true);
            setTimeout(() => onComplete(), 1500);
          } else {
            tween(homeRef.current.ball, 400, 'ball');
            changePhase('idle');
          }
        });
        tween(homeRef.current.ball, 850, 'ball');
      });
    });
  }

  useEffect(() => {
    function onMove(e) {
      const t = e.touches ? e.touches[0] : e;
      moveDrag(t.clientX, t.clientY);
    }
    function onUp() { endDrag(); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const showHint = phase === 'idle' && fetches === 0;
  const toyDef = TOY_BY_ANIMAL[user.petType] || TOY_BY_ANIMAL.dog;
  const { Toy: ToyComponent, color: toyColor } = toyDef;

  // Use each animal's own outdoor background
  const PLAY_BG_MAP = {
    park_day:       ParkDayBg,
    garden:         GardenBg,
    meadow:         MeadowBg,
    sky:            SkyBg,
    fire_sky:       FireSkyBg,
    rainbow:        RainbowMeadowBg,
    dark_forest:    DarkForestBg,
    midnight_alley: MidnightAlleyBg,
    shadow_cave:    ShadowCaveBg,
    stormy_sky:     StormySkyBg,
    volcanic_sky:   VolcanicSkyBg,
    shadow_realm:   ShadowRealmBg,
  };
  const actBg = (() => {
    const a = ACTIVITY_BY_ANIMAL[user.petType] || ACTIVITY_BY_ANIMAL.dog;
    const dark = (user.petVariant || 'cute') === 'dark';
    return dark ? (a.bgDark || a.bg) : a.bg;
  })();
  const PlayBgComponent = PLAY_BG_MAP[actBg] || OutdoorBg;

  return (
    <div ref={stageRef} style={sceneStageStyle}>
      <PlayBgComponent />

      <div style={{
        position: 'absolute', left: petPos.x, top: petPos.y,
        transform: `translate(-50%, -50%) scaleX(${petFlip ? -1 : 1})`,
        transition: 'transform 0.2s ease-out',
        pointerEvents: 'none',
      }}>
        <AnimalPet type={user.petType} color={user.petColor}
                   mood={phase === 'done' ? 'happy' : 'awake'} size={170}
                   variant={user.petVariant || 'cute'} />
      </div>

      <div
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
        style={{
          position: 'absolute', left: ballPos.x, top: ballPos.y,
          transform: 'translate(-50%, -50%)',
          touchAction: 'none', userSelect: 'none',
          cursor: phase === 'idle' ? 'grab' : (phase === 'dragging' ? 'grabbing' : 'default'),
          pointerEvents: (phase === 'idle' || phase === 'dragging') ? 'auto' : 'none',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
        }}>
        <ToyComponent size={50} color={toyColor} />
      </div>

      {showHint && (
        <div style={{
          position: 'absolute', left: ballPos.x, top: ballPos.y - 50,
          transform: 'translate(-50%, 0)',
          background: 'rgba(255,255,255,0.08)',
          border: `1px solid ${T.border}`,
          borderRadius: 14, padding: '6px 12px',
          color: T.text, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600,
          backdropFilter: 'blur(6px)',
          animation: 'gentleNudge 1.6s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          {toyDef.hint}
        </div>
      )}

      {!done && (
        <div style={{
          position: 'absolute', top: 16, left: 0, right: 0,
          textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: 'DM Sans',
          pointerEvents: 'none',
        }}>
          {toyDef.counter(fetches)}
        </div>
      )}

      {done && <SparkleBurst color={toyColor} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// GROOM SCENE — 4-step bath routine in a real bathtub
// ────────────────────────────────────────────────────────────────────────────
const GROOM_STEPS = [
  { label: 'Wash hair',  detail: 'shampoo',       emoji: '🧴', color: '#00C89a', scrubsNeeded: 8 },
  { label: 'Wash hair',  detail: 'conditioner',   emoji: '🧴', color: '#FF6B9D', scrubsNeeded: 8 },
  { label: 'Wash body',  detail: 'with soap',     emoji: '🧼', color: '#8B7CF8', scrubsNeeded: 10 },
  { label: 'Rinse',      detail: 'whole body',    emoji: '💧', color: '#00BFFF', scrubsNeeded: 10 },
];

function GroomScene({ user, onComplete }) {
  const stageRef = useRef(null);
  const [groomStep, setGroomStep] = useState(0);
  const [scrubs, setScrubs] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [stepFlash, setStepFlash] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [splashes, setSplashes] = useState([]);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [done, setDone] = useState(false);

  const lastDirRef = useRef(0);
  const dirAccumRef = useRef(0);
  const lastXRef = useRef(0);
  const lastBubbleRef = useRef(0);
  const bubbleIdRef = useRef(0);
  const splashIdRef = useRef(0);
  const scrubsRef = useRef(0);
  const groomStepRef = useRef(0);

  const currentStep = GROOM_STEPS[groomStep];

  function advanceStep() {
    setStepFlash(true);
    sfx.sparkle();
    setTimeout(() => {
      setStepFlash(false);
      const next = groomStepRef.current + 1;
      if (next >= GROOM_STEPS.length) {
        setDone(true);
        setTimeout(() => onComplete(), 1600);
      } else {
        groomStepRef.current = next;
        setGroomStep(next);
        scrubsRef.current = 0;
        setScrubs(0);
      }
    }, 900);
  }

  function startScrub(clientX, clientY) {
    if (done || stepFlash) return;
    setScrubbing(true);
    if (stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      setPos({ x: clientX - rect.left, y: clientY - rect.top });
    }
    lastXRef.current = clientX;
    dirAccumRef.current = 0;
    lastDirRef.current = 0;
    sfx.scrubStart();
  }

  function moveScrub(clientX, clientY) {
    if (!scrubbing || !stageRef.current || done || stepFlash) return;
    const rect = stageRef.current.getBoundingClientRect();
    setPos({ x: clientX - rect.left, y: clientY - rect.top });

    const dx = clientX - lastXRef.current;
    lastXRef.current = clientX;
    if (Math.abs(dx) < 0.5) return;
    const dir = dx > 0 ? 1 : -1;

    if (dir !== lastDirRef.current && lastDirRef.current !== 0) {
      if (dirAccumRef.current > 25) {
        scrubsRef.current += 1;
        setScrubs(scrubsRef.current);
        const target = GROOM_STEPS[groomStepRef.current].scrubsNeeded;
        if (scrubsRef.current >= target) {
          setScrubbing(false);
          sfx.scrubStop();
          advanceStep();
        }
      }
      dirAccumRef.current = 0;
    }
    dirAccumRef.current += Math.abs(dx);
    lastDirRef.current = dir;

    const now = performance.now();
    if (now - lastBubbleRef.current > 90) {
      const id = bubbleIdRef.current++;
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = (Math.random() - 0.5) * 20;
      setBubbles(bs => [...bs, {
        id, x: clientX - rect.left + offsetX, y: clientY - rect.top + offsetY,
        color: groomStepRef.current === 3
          ? 'rgba(78,201,232,0.85)'
          : 'rgba(255,255,255,0.85)',
      }]);
      sfx.bubblePop();
      setTimeout(() => setBubbles(bs => bs.filter(b => b.id !== id)), 1100);
      lastBubbleRef.current = now;

      if (id % 2 === 0) {
        const sid = splashIdRef.current++;
        const sx = (Math.random() - 0.5) * 50;
        const sy = -(20 + Math.random() * 30);
        setSplashes(ss => [...ss, {
          sid, x: clientX - rect.left + (Math.random()-0.5)*20,
          y: clientY - rect.top, sx, sy,
          color: groomStepRef.current === 3 ? 'rgba(78,201,232,0.9)' : GROOM_STEPS[groomStepRef.current].color + 'bb',
        }]);
        setTimeout(() => setSplashes(ss => ss.filter(s => s.sid !== sid)), 700);
      }
    }
  }

  function endScrub() {
    setScrubbing(false);
    sfx.scrubStop();
  }

  useEffect(() => {
    function onMove(e) { const t = e.touches ? e.touches[0] : e; moveScrub(t.clientX, t.clientY); }
    function onUp() { endScrub(); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      sfx.scrubStop();
    };
  });

  const pct = Math.min(1, scrubs / (currentStep?.scrubsNeeded || 1)) * 100;

  return (
    <div ref={stageRef}
      onMouseDown={(e) => startScrub(e.clientX, e.clientY)}
      onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startScrub(t.clientX, t.clientY); }}
      style={{
        ...sceneStageStyle,
        background: `radial-gradient(circle at 50% 40%, #4ec9e822 0%, ${T.bg} 70%)`,
        cursor: (scrubbing && !stepFlash) ? 'none' : 'grab',
        touchAction: 'none', userSelect: 'none',
      }}>
      <BathroomBg />

      {/* ── 4-step tracker at top ── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)',
        border: `1px solid ${T.border}`,
        borderRadius: 24, padding: '8px 14px',
        zIndex: 8, pointerEvents: 'none',
      }}>
        {GROOM_STEPS.map((s, i) => {
          const isActive = i === groomStep && !done;
          const isDone = i < groomStep || done;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: isDone ? 22 : (isActive ? 22 : 18),
                height: isDone ? 22 : (isActive ? 22 : 18),
                borderRadius: '50%',
                background: isDone ? s.color : (isActive ? `${s.color}33` : 'rgba(255,255,255,0.08)'),
                border: `2px solid ${isDone ? s.color : (isActive ? s.color : 'rgba(255,255,255,0.2)')}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
                transition: 'all 0.3s',
                boxShadow: isActive ? `0 0 10px ${s.color}66` : 'none',
              }}>
                {isDone ? <Check size={11} color="#0d1825" strokeWidth={3} /> : (
                  <span style={{ fontSize: 8, color: isActive ? s.color : T.subtle, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              {i < GROOM_STEPS.length - 1 && (
                <div style={{ width: 14, height: 2, borderRadius: 1, background: i < groomStep ? GROOM_STEPS[i].color : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Pet in the bathtub */}
      <div style={{
        position: 'absolute', top: '52%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 3,
      }}>
        <AnimalPet type={user.petType} color={user.petColor}
                   mood={done ? 'happy' : (scrubbing ? 'happy' : 'awake')} size={200}
                   variant={user.petVariant || 'cute'} />
      </div>

      {/* Water surface */}
      <div style={{
        position: 'absolute', top: '67%', left: '5%', right: '5%', height: 18,
        background: 'linear-gradient(to bottom, rgba(78,201,232,0.55), rgba(26,127,160,0.35))',
        borderRadius: 4, pointerEvents: 'none', zIndex: 4,
        animation: 'tubWater 2.5s ease-in-out infinite',
      }} />

      {/* Bubbles */}
      {bubbles.map(b => (
        <div key={b.id} style={{
          position: 'absolute', left: b.x, top: b.y,
          width: 18, height: 18, borderRadius: '50%',
          background: b.color === 'rgba(78,201,232,0.85)'
            ? 'radial-gradient(circle at 35% 30%, rgba(78,201,232,0.8), rgba(26,127,180,0.3) 60%, transparent)'
            : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(180,200,255,0.3) 60%, transparent)',
          border: '1px solid rgba(255,255,255,0.4)',
          animation: 'bubbleRise 1.1s ease-out forwards',
          pointerEvents: 'none', zIndex: 5,
        }} />
      ))}

      {/* Water splashes */}
      {splashes.map(s => (
        <div key={s.sid} style={{
          position: 'absolute', left: s.x, top: s.y,
          width: 8, height: 8, borderRadius: '50%',
          background: s.color,
          '--sx': `${s.sx}px`, '--sy': `${s.sy}px`,
          animation: 'waterSplash 0.7s ease-out forwards',
          pointerEvents: 'none', zIndex: 5,
        }} />
      ))}

      {/* Sponge cursor */}
      {scrubbing && !done && !stepFlash && (
        <div style={{
          position: 'absolute', left: pos.x, top: pos.y,
          width: 44, height: 44, borderRadius: 10,
          background: currentStep.color, opacity: 0.65,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 20px ${currentStep.color}66`,
          pointerEvents: 'none', zIndex: 6,
        }} />
      )}

      {/* Current step label + progress bar */}
      {!done && !stepFlash && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%',
          transform: 'translateX(-50%)',
          minWidth: 220,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
          border: `1px solid ${currentStep.color}44`,
          borderRadius: 18, padding: '12px 16px',
          zIndex: 7, pointerEvents: 'none', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{currentStep.emoji}</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: T.text, lineHeight: 1.1 }}>
                Step {groomStep + 1} — {currentStep.label}
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: currentStep.color, fontWeight: 600 }}>
                {currentStep.detail}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: currentStep.color, borderRadius: 3, transition: 'width 0.2s' }} />
          </div>
          {scrubs === 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: T.muted, fontFamily: 'DM Sans' }}>
              scrub side-to-side to wash
            </div>
          )}
        </div>
      )}

      {/* Step complete flash */}
      {stepFlash && !done && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${GROOM_STEPS[groomStep > 0 ? groomStep - 1 : 0].color}, ${GROOM_STEPS[groomStep > 0 ? groomStep - 1 : 0].color}cc)`,
          color: '#0d1825', borderRadius: 18,
          padding: '14px 22px',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 15,
          textAlign: 'center',
          boxShadow: `0 8px 24px ${GROOM_STEPS[groomStep > 0 ? groomStep - 1 : 0].color}55`,
          animation: 'shakeIn 0.35s ease-out',
          zIndex: 10, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          ✓ Step {groomStep} done!{groomStep < GROOM_STEPS.length ? ` Next: ${GROOM_STEPS[groomStep]?.label}` : ''}
        </div>
      )}

      {done && <SparkleBurst color={T.purple} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ACTIVITY SCENE — unique movement physics, glowing trails, themed tap effects
// ────────────────────────────────────────────────────────────────────────────
function ActivityScene({ user, onComplete }) {
  const act = ACTIVITY_BY_ANIMAL[user.petType] || ACTIVITY_BY_ANIMAL.dog;
  const TARGET = 10;
  const stageRef = useRef(null);
  const [cheers, setCheers]       = useState(0);
  const [done, setDone]           = useState(false);
  const [petX, setPetX]           = useState(180);
  const [petY, setPetY]           = useState(0);
  const [petFlip, setPetFlip]     = useState(false);
  const [trails, setTrails]       = useState([]);
  const [tapEffects, setTapEffects] = useState([]);
  const [cheerBursts, setCheerBursts] = useState([]);
  const [halfwayFlash, setHalfwayFlash] = useState(false);
  const [isFlying, setIsFlying]   = useState(false);
  const [speedLines, setSpeedLines] = useState([]);

  const petXRef      = useRef(180);
  const petYRef      = useRef(0);
  const flipRef      = useRef(false);
  const cheersRef    = useRef(0);
  const stageWRef    = useRef(360);
  const stageHRef    = useRef(600);
  const animRef      = useRef(null);
  const tapIdRef     = useRef(0);
  const trailIdRef   = useRef(0);
  const frameRef     = useRef(0);
  const timeRef      = useRef(0);
  const distRef      = useRef(0);
  const pauseRef     = useRef(0);
  const boostRef     = useRef(0);
  const rainbowRef   = useRef(0);
  const burstIdRef   = useRef(0);
  const lineIdRef    = useRef(0);

  const RAINBOW = [T.pink, T.amber, '#7FE787', T.blue, T.purple, T.teal];
  const BASE_Y_FRAC = act.bg === 'sky' ? 0.35 : 0.44;
  const hasWings = ['dragon', 'phoenix'].includes(user.petType);

  useLayoutEffect(() => {
    if (stageRef.current) {
      const r = stageRef.current.getBoundingClientRect();
      stageWRef.current = r.width;
      stageHRef.current = r.height;
      petXRef.current   = r.width / 2;
      petYRef.current   = r.height * BASE_Y_FRAC;
      setPetX(r.width / 2);
      setPetY(r.height * BASE_Y_FRAC);
    }

    let lastTS = performance.now();
    function tick(ts) {
      const dt    = Math.min(ts - lastTS, 32);
      lastTS      = ts;
      timeRef.current  += dt;
      frameRef.current += 1;

      const w       = stageWRef.current;
      const h       = stageHRef.current;
      const baseY   = h * BASE_Y_FRAC;

      // ── speed ──
      let spd = act.speed;
      if (boostRef.current > 0)  { spd *= 2.0; boostRef.current--; }

      // ── cat: random pauses + pounce bursts ──
      if (act.pauseStyle) {
        if (pauseRef.current > 0) {
          spd = 0;
          pauseRef.current--;
          if (pauseRef.current === 0) boostRef.current = 22; // burst after pause
        } else if (Math.random() < 0.004) {
          pauseRef.current = 35 + Math.floor(Math.random() * 45);
        }
      }

      // ── X ──
      if (spd > 0) {
        petXRef.current += flipRef.current ? -spd : spd;
        distRef.current += spd;
        if (petXRef.current > w - 65) { flipRef.current = true;  setPetFlip(true);  }
        if (petXRef.current < 65)      { flipRef.current = false; setPetFlip(false); }
      }
      setPetX(petXRef.current);

      // ── Y ──
      let newY = baseY;
      if (act.hopStyle) {
        // Rabbit: parabolic hops
        const hopCycle = 88;
        const phase = (distRef.current % hopCycle) / hopCycle;
        newY = baseY - Math.sin(Math.max(0, Math.min(1, phase)) * Math.PI) * act.yAmp;
      } else if (act.yAmp > 0 && act.yFreq > 0) {
        // Dragon / phoenix / unicorn: sinusoidal
        newY = baseY + Math.sin((timeRef.current / act.yFreq) * Math.PI * 2) * act.yAmp;
      } else {
        // Dog / cat: tiny walk bob
        newY = baseY + Math.sin(distRef.current / 18) * 3.5;
      }
      petYRef.current = newY;
      setPetY(newY);

      // ── Flying state for wing animation ──
      const flyingThreshold = baseY - 18;
      if (hasWings) setIsFlying(newY < flyingThreshold);

      // ── Speed lines when boosting ──
      if (boostRef.current > 8 && frameRef.current % 4 === 0) {
        const lid = lineIdRef.current++;
        setSpeedLines(ls => [...ls.slice(-6), { id: lid, x: petXRef.current, y: petYRef.current, flip: flipRef.current }]);
        setTimeout(() => setSpeedLines(ls => ls.filter(l => l.id !== lid)), 280);
      }

      // ── Glowing trail every 3 frames ──
      if (frameRef.current % 3 === 0) {
        const id  = trailIdRef.current++;
        const col = act.rainbowTrail
          ? RAINBOW[rainbowRef.current++ % RAINBOW.length]
          : act.trail;
        const sz  = 7 + Math.random() * 6;
        setTrails(ts => {
          const next = [...ts.slice(-15), { id, x: petXRef.current, y: petYRef.current, color: col, sz, fade: false }];
          return next;
        });
        setTimeout(() => {
          setTrails(ts => ts.map(t => t.id === id ? { ...t, fade: true } : t));
          setTimeout(() => setTrails(ts => ts.filter(t => t.id !== id)), 180);
        }, 320);
      }

      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  function handleTap(e) {
    if (done) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const src  = e.touches ? e.touches[0] : e;
    const tapX = src.clientX - rect.left;
    const tapY = src.clientY - rect.top;

    cheersRef.current += 1;
    const n = cheersRef.current;
    setCheers(n);
    boostRef.current = 16;

    // Cheer burst ring at pet position
    const bid = burstIdRef.current++;
    setCheerBursts(bs => [...bs, { id: bid, x: petXRef.current, y: petYRef.current, color: act.trail }]);
    setTimeout(() => setCheerBursts(bs => bs.filter(b => b.id !== bid)), 700);

    // Themed emoji pops at the tap position
    const id  = tapIdRef.current++;
    const sym = act.tapSyms[id % act.tapSyms.length];
    setTapEffects(es => [...es, { id, x: tapX, y: tapY, sym }]);
    setTimeout(() => setTapEffects(es => es.filter(e => e.id !== id)), 950);

    // Halfway celebration
    if (n === 5) {
      setHalfwayFlash(true);
      setTimeout(() => setHalfwayFlash(false), 1800);
    }

    sfx.bubblePop();

    if (n >= TARGET) {
      cancelAnimationFrame(animRef.current);
      setDone(true);
      sfx.fetchHappy();
      setTimeout(() => onComplete(), 1800);
    }
  }

  const BG_MAP = {
    park_day:      ParkDayBg,
    garden:        GardenBg,
    meadow:        MeadowBg,
    sky:           SkyBg,
    fire_sky:      FireSkyBg,
    rainbow:       RainbowMeadowBg,
    dark_forest:   DarkForestBg,
    midnight_alley: MidnightAlleyBg,
    shadow_cave:   ShadowCaveBg,
    stormy_sky:    StormySkyBg,
    volcanic_sky:  VolcanicSkyBg,
    shadow_realm:  ShadowRealmBg,
  };
  const isDark = (user.petVariant || 'cute') === 'dark';
  const bgKey = isDark ? (act.bgDark || act.bg) : act.bg;
  const BgComponent = BG_MAP[bgKey] || OutdoorBg;
  const pct = (cheers / TARGET) * 100;

  return (
    <div ref={stageRef}
      onClick={handleTap}
      onTouchStart={(e) => { e.preventDefault(); handleTap(e); }}
      style={{ ...sceneStageStyle, cursor: done ? 'default' : 'pointer', userSelect: 'none', touchAction: 'none' }}>
      <BgComponent />

      {/* Glowing trail */}
      {trails.map(t => (
        <div key={t.id} style={{
          position: 'absolute', left: t.x, top: t.y,
          width: t.sz, height: t.sz, borderRadius: '50%',
          background: t.color,
          boxShadow: `0 0 ${t.sz + 4}px ${t.color}`,
          transform: 'translate(-50%, -50%)',
          opacity: t.fade ? 0 : 0.72,
          transition: t.fade ? 'opacity 0.18s ease-out' : 'none',
          pointerEvents: 'none', zIndex: 2,
        }} />
      ))}

      {/* Speed lines during boost */}
      {speedLines.map(l => (
        <div key={l.id} style={{
          position: 'absolute',
          left: l.x + (l.flip ? 30 : -90),
          top: l.y - 4,
          width: 60, height: 3, borderRadius: 2,
          background: `linear-gradient(${l.flip ? '90deg' : '270deg'}, ${act.trail}99, transparent)`,
          animation: 'speedLine 0.28s ease-out forwards',
          pointerEvents: 'none', zIndex: 2,
        }} />
      ))}

      {/* Cheer burst rings */}
      {cheerBursts.map(b => (
        <div key={b.id} style={{
          position: 'absolute', left: b.x, top: b.y,
          width: 80, height: 80, borderRadius: '50%',
          border: `3px solid ${b.color}`,
          boxShadow: `0 0 12px ${b.color}88`,
          animation: 'cheerBurst 0.7s ease-out forwards',
          pointerEvents: 'none', zIndex: 4,
        }} />
      ))}

      {/* Dynamic ground shadow — grows when pet is on ground, shrinks when airborne */}
      <div style={{
        position: 'absolute',
        left: petX, top: (stageRef.current?.getBoundingClientRect().height || 600) * BASE_Y_FRAC + 70,
        width: 60, height: 14, borderRadius: '50%',
        background: 'rgba(0,0,0,0.35)',
        transform: `translate(-50%, -50%) scale(${Math.max(0.3, 1 - Math.abs(petY - (stageRef.current?.getBoundingClientRect().height || 600) * BASE_Y_FRAC) / 120)})`,
        opacity: Math.max(0.1, 0.6 - Math.abs(petY - (stageRef.current?.getBoundingClientRect().height || 600) * BASE_Y_FRAC) / 100),
        filter: 'blur(4px)',
        pointerEvents: 'none', zIndex: 1,
        transition: 'none',
      }} />

      {/* The pet */}
      <div style={{
        position: 'absolute', left: petX, top: petY,
        transform: `translate(-50%, -50%) scaleX(${petFlip ? -1 : 1})`,
        pointerEvents: 'none', zIndex: 3, transition: 'none',
      }}>
        <AnimalPet type={user.petType} color={user.petColor}
                   mood={done ? 'happy' : 'awake'} size={170}
                   variant={user.petVariant || 'cute'}
                   wingFlap={isFlying && !done} />
      </div>

      {/* Tap effects — appear at tap position */}
      {tapEffects.map(t => (
        <div key={t.id} style={{
          position: 'absolute', left: t.x, top: t.y,
          fontSize: 32, transform: 'translate(-50%, -50%)',
          animation: 'msgFloat 0.95s ease-out forwards',
          pointerEvents: 'none', zIndex: 7,
          filter: 'drop-shadow(0 0 8px rgba(255,240,180,0.7))',
        }}>
          {t.sym}
        </div>
      ))}

      {/* Progress bar */}
      {!done && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: `1px solid ${cheers > 0 ? act.trail + '88' : T.border}`,
          borderRadius: 22, zIndex: 5, pointerEvents: 'none',
          boxShadow: cheers > 0 ? `0 0 14px ${act.trail}33` : 'none',
          transition: 'all 0.4s',
        }}>
          <span style={{ fontSize: 20 }}>{act.emoji}</span>
          <div style={{ width: 120, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: `linear-gradient(90deg, ${act.trail}, ${act.trail}cc)`,
              borderRadius: 4, transition: 'width 0.25s ease-out',
              boxShadow: `0 0 10px ${act.trail}99`,
            }} />
          </div>
          <span style={{ fontSize: 13, color: T.text, fontFamily: 'DM Sans', fontWeight: 700 }}>
            {cheers}/{TARGET}
          </span>
        </div>
      )}

      {/* First-time hint */}
      {!done && cheers === 0 && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 18px',
          color: T.text, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
          animation: 'gentleNudge 1.6s ease-in-out infinite',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          🎉 tap anywhere to cheer {user.petName} on!
        </div>
      )}

      {/* Halfway flash */}
      {halfwayFlash && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${act.trail}33, ${act.trail}11)`,
          border: `1.5px solid ${act.trail}99`,
          borderRadius: 14, padding: '10px 18px',
          color: act.trail, fontSize: 14, fontFamily: 'Syne', fontWeight: 800,
          animation: 'shakeIn 0.4s ease-out',
          pointerEvents: 'none', whiteSpace: 'nowrap',
          boxShadow: `0 6px 20px ${act.trail}33`,
        }}>
          Halfway! Keep cheering! 🔥
        </div>
      )}

      {done && <SparkleBurst color={act.trail} />}
    </div>
  );
}

// Activity button — wider, sits below the 2×2 care grid
function ActivityBtn({ petType, disabled, onClick }) {
  const act = ACTIVITY_BY_ANIMAL[petType] || ACTIVITY_BY_ANIMAL.dog;
  return (
    <button onClick={onClick} style={{
      width: '100%', marginBottom: 24,
      background: disabled ? 'rgba(255,255,255,0.03)' : T.card,
      border: `1px solid ${disabled ? T.border : T.borderStrong}`,
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1, fontFamily: 'DM Sans',
    }}>
      {disabled
        ? <Lock size={18} color={T.muted} />
        : <span style={{ fontSize: 22 }}>{act.emoji}</span>}
      <span style={{ fontSize: 14, fontWeight: 600, color: disabled ? T.muted : T.textDim }}>
        {act.label}
      </span>
      <span style={{ fontSize: 11, color: T.muted, marginLeft: 2 }}>· 1 ticket</span>
    </button>
  );
}

const sceneStageStyle = {
  flex: 1, position: 'relative', overflow: 'hidden',
};
const iconBtnLg = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 10,
};

// ────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function go() {
    setErr('');
    if (!username.trim()) return setErr('Enter your username');
    if (pin.length !== 4) return setErr('PIN must be 4 digits');
    setBusy(true);
    const key = 'user:' + username.toLowerCase().trim();
    const existing = await storageGet(key);
    if (!existing) { setErr("Username not found — ask your manager to set up your account"); setBusy(false); return; }
    if (!existing.pin) { setErr("No PIN set — ask your manager to set one for you"); setBusy(false); return; }
    if (existing.pin !== pin) { setErr("Incorrect PIN"); setBusy(false); return; }
    // make sure all teen fields exist (in case account was created by manager)
    const full = {
      petType: null, petName: null, petColor: existing.petColor || T.teal,
      hatched: false, tickets: 0, bondLevel: 0, totalInteractions: 0,
      xp: 0, goals: [], friendPets: [], sensoryProfile: null,
      soundOn: true, activePetGoal: null, petGoalHistory: [],
      ...existing,
    };
    if (JSON.stringify(full) !== JSON.stringify(existing)) {
      await storageSet(key, full);
    }
    onLogin(full);
    setBusy(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <Egg color={T.teal} size={120} />
      </div>
      <h1 style={{ fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: 36, color: T.text, letterSpacing: '-0.5px', marginBottom: 6 }}>Hatch</h1>
      <p style={{ color: T.muted, fontSize: 14, marginBottom: 32, fontFamily: 'DM Sans, sans-serif', textAlign: 'center', maxWidth: 320 }}>
        Work on your goals. Earn time with your pet.
      </p>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="Username" maxLength={20} style={inputStyle} />
        <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4-digit PIN" inputMode="numeric"
          onKeyPress={e => e.key === 'Enter' && go()}
          style={{ ...inputStyle, letterSpacing: pin ? 8 : 'normal', textAlign: pin ? 'center' : 'left' }} type="password" />
        {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 12, fontFamily: 'DM Sans' }}>{err}</div>}
        <button onClick={go} disabled={busy} style={primaryBtn}>
          {busy ? '...' : 'Log in'}
        </button>
      </div>
      <Style />
    </div>
  );
}

const tabBtn = (active) => ({
  flex: 1, padding: '10px 16px', borderRadius: 8,
  background: active ? T.card : 'transparent',
  color: active ? T.text : T.muted,
  fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans',
  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
});
const inputStyle = {
  width: '100%', padding: '14px 16px', marginBottom: 12,
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
  color: T.text, fontSize: 16, fontFamily: 'DM Sans',
  outline: 'none', boxSizing: 'border-box',
};
const primaryBtn = {
  width: '100%', padding: '14px 20px',
  background: T.teal, color: '#0d1825',
  border: 'none', borderRadius: 12,
  fontSize: 15, fontWeight: 700, fontFamily: 'DM Sans',
  cursor: 'pointer', boxShadow: `0 8px 24px ${T.teal}33`,
  transition: 'transform 0.1s',
};

// ────────────────────────────────────────────────────────────────────────────
// SENSORY PROFILE STEP
// ────────────────────────────────────────────────────────────────────────────
function SensoryStep({ initialRatings = {}, onDone, onSkip }) {
  const [idx, setIdx] = useState(-1);
  const [ratings, setRatings] = useState(initialRatings);

  if (idx === -1) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🧠</div>
        <h2 style={titleStyle}>One quick check-in</h2>
        <p style={{ ...subStyle, lineHeight: 1.5, marginBottom: 8 }}>
          A few things that affect a lot of brains. Marking how each one feels for you helps Hatch suggest what to plan around when you set goals.
        </p>
        <p style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans', marginBottom: 24, fontStyle: 'italic', maxWidth: 320 }}>
          You can change any of this later. No wrong answers.
        </p>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <button onClick={() => setIdx(0)} style={primaryBtn}>Start</button>
          <button onClick={onSkip} style={{
            width: '100%', padding: '12px 20px', marginTop: 10,
            background: 'transparent', color: T.muted,
            border: `1px solid ${T.border}`, borderRadius: 12,
            fontSize: 14, fontWeight: 500, fontFamily: 'DM Sans',
            cursor: 'pointer',
          }}>
            Skip for now
          </button>
        </div>
        <Style />
      </div>
    );
  }

  const dim = SENSORY_DIMENSIONS[idx];
  const isLast = idx === SENSORY_DIMENSIONS.length - 1;

  function rate(rating) {
    const updated = { ...ratings, [dim.id]: rating };
    setRatings(updated);
    if (isLast) onDone(updated);
    else setIdx(idx + 1);
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setIdx(idx === 0 ? -1 : idx - 1)} style={iconBtn}>
          <ChevronLeft size={22} color={T.text} />
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {SENSORY_DIMENSIONS.map((_, i) => (
            <div key={i} style={{
              width: 20, height: 4, borderRadius: 2,
              background: i <= idx ? T.teal : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>{dim.emoji}</div>
        <h2 style={{ ...titleStyle, marginTop: 0 }}>{dim.label}</h2>
        <p style={{ ...subStyle, marginBottom: 28 }}>How is this for you, usually?</p>

        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SENSORY_RATINGS.map(r => {
            const active = ratings[dim.id] === r.id;
            return (
              <button key={r.id} onClick={() => rate(r.id)} style={{
                padding: '16px 18px', borderRadius: 14,
                background: active ? `${r.color}22` : T.surface,
                border: active ? `1.5px solid ${r.color}` : `1px solid ${T.border}`,
                color: active ? r.color : T.textDim,
                fontSize: 15, fontWeight: 600, fontFamily: 'DM Sans',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 22 }}>{r.emoji}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        <button onClick={() => isLast ? onDone(ratings) : setIdx(idx + 1)} style={{
          marginTop: 16, padding: '10px 16px',
          background: 'transparent', color: T.muted,
          border: 'none', cursor: 'pointer',
          fontSize: 13, fontFamily: 'DM Sans',
        }}>
          Skip this one
        </button>
      </div>
      <Style />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ONBOARDING
// ────────────────────────────────────────────────────────────────────────────
function Onboarding({ user, onDone }) {
  const [step, setStep] = useState('animal');
  const [petType, setPetType] = useState(null);
  const [petColor, setPetColor] = useState(T.teal);
  const [petVariant, setPetVariant] = useState('cute');
  const [petName, setPetName] = useState('');
  const [sensoryRatings, setSensoryRatings] = useState(null);
  const [petMystery, setPetMystery] = useState(false);

  function selectAnimal(id) {
    if (id === 'mystery') {
      const { type, color } = resolveMystery();
      setPetType(type);
      setPetColor(color);
      setPetMystery(true);
    } else {
      setPetType(id);
      setPetMystery(false);
    }
  }

  async function finishOnboarding() {
    const sensoryProfile = sensoryRatings
      ? { ratings: sensoryRatings, notes: {}, updatedAt: Date.now() }
      : null;
    const updated = { ...user, petType, petColor, petVariant, petName, hatched: false, petMystery, sensoryProfile };
    await storageSet('user:' + user.username, updated);
    onDone(updated);
  }

  // Which option is "selected" in the picker (mystery shows as mystery, not the resolved type)
  const pickerSelected = petMystery ? 'mystery' : petType;

  if (step === 'animal') {
    return (
      <Wrap>
        <h2 style={titleStyle}>Choose your pet</h2>
        <p style={subStyle}>What's inside your egg?</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 20 }}>
          {ANIMALS.map(a => {
            const isMystery = a.id === 'mystery';
            const active = pickerSelected === a.id;
            return (
              <button key={a.id} onClick={() => selectAnimal(a.id)} style={{
                aspectRatio: '1', borderRadius: 16,
                background: active
                  ? isMystery ? `${T.purple}22` : `${T.teal}15`
                  : T.surface,
                border: active
                  ? `2px solid ${isMystery ? T.purple : T.teal}`
                  : `1px solid ${T.border}`,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: 8, fontFamily: 'DM Sans',
                ...(isMystery ? {
                  background: active ? `${T.purple}22` : `linear-gradient(135deg, ${T.purple}11, ${T.pink}08)`,
                  border: active ? `2px solid ${T.purple}` : `1px dashed ${T.purple}66`,
                } : {}),
              }}>
                <span style={{ fontSize: 32 }}>{a.emoji}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: active ? (isMystery ? T.purple : T.teal) : T.textDim,
                }}>{a.name}</span>
                <span style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {isMystery ? 'surprise!' : a.kind}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => petType && (petMystery ? setStep('variant') : setStep('color'))}
          style={{ ...primaryBtn, opacity: petType ? 1 : 0.4 }}
          disabled={!petType}
        >
          Next
        </button>
      </Wrap>
    );
  }

  if (step === 'color') {
    return (
      <Wrap>
        <div style={{ marginBottom: 12 }}>
          <svg viewBox="0 0 200 200" width="140" height="140">
            <ellipse cx="100" cy="180" rx="50" ry="6" fill="rgba(0,0,0,0.3)" />
            {(() => { const C = ANIMAL_COMPONENTS[petType]; return <C color={petColor} mood="happy" />; })()}
          </svg>
        </div>
        <h2 style={titleStyle}>Pick a colour</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, width: '100%', marginBottom: 20 }}>
          {COLORS.map(c => (
            <button key={c.hex} onClick={() => setPetColor(c.hex)} style={{
              aspectRatio: '1', borderRadius: 14,
              background: petColor === c.hex ? `${c.hex}22` : T.surface,
              border: petColor === c.hex ? `2px solid ${c.hex}` : `1px solid ${T.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 4, padding: 4,
              fontSize: 11, fontWeight: 600, color: T.textDim, fontFamily: 'DM Sans',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: c.hex, boxShadow: `0 0 12px ${c.hex}66` }} />
              {c.name}
            </button>
          ))}
        </div>
        <button onClick={() => setStep('variant')} style={primaryBtn}>Next</button>
      </Wrap>
    );
  }

  if (step === 'variant') {
    const C = ANIMAL_COMPONENTS[petType] || Dog;
    return (
      <Wrap>
        <h2 style={titleStyle}>Choose a style</h2>
        <p style={subStyle}>Cute and cuddly, or dark and fierce?</p>
        <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 24 }}>
          {[
            { id: 'cute', label: 'Cute', sub: 'soft & cuddly', emoji: '🌸' },
            { id: 'dark', label: 'Dark', sub: 'edgy & fierce', emoji: '🔥' },
          ].map(v => {
            const active = petVariant === v.id;
            return (
              <button key={v.id} onClick={() => setPetVariant(v.id)} style={{
                flex: 1, borderRadius: 18, padding: '16px 10px',
                background: active
                  ? v.id === 'dark' ? `${T.red}18` : `${T.teal}18`
                  : T.surface,
                border: active
                  ? `2px solid ${v.id === 'dark' ? T.red : T.teal}`
                  : `1px solid ${T.border}`,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8, fontFamily: 'DM Sans',
              }}>
                <svg viewBox="0 0 200 200" width="90" height="90">
                  <ellipse cx="100" cy="196" rx="52" ry="6" fill="rgba(0,0,0,0.3)" />
                  <C color={petColor} mood="happy" variant={v.id} />
                </svg>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: active ? (v.id === 'dark' ? T.red : T.teal) : T.text,
                  }}>{v.emoji} {v.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{v.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => setStep('name')} style={primaryBtn}>Next</button>
      </Wrap>
    );
  }

  if (step === 'name') {
    return (
      <Wrap>
        <Egg color={petColor} size={120} mystery={petMystery} />
        <h2 style={titleStyle}>Name them</h2>
        <p style={subStyle}>
          {petMystery
            ? "What will you call your mystery pet?"
            : `What will you call your ${ANIMALS.find(a => a.id === petType)?.name.toLowerCase()}?`
          }
        </p>
        <input value={petName} onChange={e => setPetName(e.target.value.slice(0, 16))} placeholder="Pet's name" style={inputStyle} />
        <button onClick={() => petName.trim() && setStep('sensory')} style={{ ...primaryBtn, opacity: petName.trim() ? 1 : 0.4 }} disabled={!petName.trim()}>
          Next
        </button>
      </Wrap>
    );
  }

  if (step === 'sensory') {
    return (
      <SensoryStep
        initialRatings={sensoryRatings || {}}
        onDone={(r) => { setSensoryRatings(r); setStep('ready'); }}
        onSkip={() => { setSensoryRatings(null); setStep('ready'); }}
      />
    );
  }

  return (
    <Wrap>
      <Egg color={petColor} size={160} />
      <h2 style={titleStyle}>{petName}'s egg is ready</h2>
      <p style={subStyle}>
        To hatch {petName}, you'll create your first goal. Finishing your first step is what brings them into the world.
      </p>
      <button onClick={finishOnboarding} style={primaryBtn}>
        Let's set a goal
      </button>
      <Style />
    </Wrap>
  );
}

const Wrap = ({ children }) => (
  <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
    {children}
    <Style />
  </div>
);
const titleStyle = { fontFamily: 'Syne, system-ui, sans-serif', fontWeight: 800, fontSize: 28, color: T.text, marginTop: 24, marginBottom: 8, letterSpacing: '-0.3px' };
const subStyle = { color: T.muted, fontSize: 15, marginBottom: 24, fontFamily: 'DM Sans', maxWidth: 320 };

// ────────────────────────────────────────────────────────────────────────────
// PET GOAL REWARD SCENE — teen chooses how to reward their pet
// ────────────────────────────────────────────────────────────────────────────
function PetGoalRewardScene({ user, setUser, petGoal, onComplete, onCancel }) {
  const [chosenReward, setChosenReward] = useState(null);

  async function handleRewardComplete() {
    const prev = user;
    const updated = {
      ...prev,
      activePetGoal: null,
      tickets: Math.round(((prev.tickets || 0) + 0.5) * 10) / 10,
      bondLevel: (prev.bondLevel || 0) + 1,
      totalInteractions: (prev.totalInteractions || 0) + 1,
      xp: (prev.xp || 0) + 15,
    };
    setUser(updated);
    await storageSet('user:' + prev.username, updated);
    onComplete();
  }

  // Once reward chosen → slide into the interaction scene
  if (chosenReward) {
    return (
      <InteractionScene
        user={user}
        setUser={setUser}
        type={chosenReward}
        onComplete={handleRewardComplete}
        onCancel={() => setChosenReward(null)}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg, zIndex: 60,
      display: 'flex', flexDirection: 'column',
      animation: 'sceneIn 0.3s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={onCancel} style={iconBtnLg}>
          <ChevronLeft size={24} color={T.text} />
        </button>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: T.text }}>
          Reward {user.petName}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        {/* Pet goal achievement card */}
        <div style={{
          background: `radial-gradient(circle at center, ${petGoal.color}1a 0%, transparent 70%), ${T.surface}`,
          border: `1px solid ${petGoal.color}55`,
          borderRadius: 24, padding: '24px 16px',
          textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>{petGoal.emoji}</div>
          <AnimalPet type={user.petType} color={user.petColor} mood="happy" size={130} variant={user.petVariant || 'cute'} />
          <div style={{ marginTop: 14 }}>
            <div style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 18,
              color: T.text, marginBottom: 8, lineHeight: 1.2,
            }}>
              {user.petName} {petGoal.title}!
            </div>
            <div style={{
              fontFamily: 'DM Sans', fontSize: 14, color: T.textDim,
              lineHeight: 1.6, maxWidth: 300, margin: '0 auto',
            }}>
              {petGoal.narrative(user.petName)}
            </div>
          </div>
        </div>

        {/* Reward prompt */}
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 17,
          color: T.text, textAlign: 'center', marginBottom: 6,
        }}>
          {petGoal.prompt(user.petName)}
        </div>
        <div style={{
          fontFamily: 'DM Sans', fontSize: 13, color: T.muted,
          textAlign: 'center', marginBottom: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Ticket size={13} color={T.teal} />
          Free reward — you'll earn ½ a ticket back for caring 🤍
        </div>

        {/* Reward choice grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {INTERACTIONS.map(i => {
            const Icon = i.icon;
            const isPreferred = i.id === petGoal.preferred;
            return (
              <button key={i.id} onClick={() => setChosenReward(i.id)} style={{
                background: isPreferred ? `${i.color}1f` : T.card,
                border: `${isPreferred ? 2 : 1}px solid ${isPreferred ? i.color : T.borderStrong}`,
                borderRadius: 18, padding: '20px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                cursor: 'pointer', position: 'relative',
                boxShadow: isPreferred ? `0 6px 24px ${i.color}2a` : 'none',
                transition: 'all 0.15s',
              }}>
                {isPreferred && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%',
                    transform: 'translateX(-50%)',
                    background: i.color, color: '#0d1825',
                    fontSize: 9, fontWeight: 700, fontFamily: 'DM Sans',
                    padding: '3px 9px', borderRadius: 8,
                    textTransform: 'uppercase', letterSpacing: 0.6,
                    whiteSpace: 'nowrap',
                  }}>
                    ✦ suggested
                  </div>
                )}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `${i.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={24} color={i.color} />
                </div>
                <span style={{
                  fontSize: 15, color: T.text, fontWeight: 700, fontFamily: 'DM Sans',
                }}>
                  {i.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ────────────────────────────────────────────────────────────────────────────
function HomeScreen({ user, setUser, openGoal, goToGoals, onLogout }) {
  const [showLockedMsg, setShowLockedMsg] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const [showPetGoalReward, setShowPetGoalReward] = useState(false);

  const tickets = user.tickets || 0;
  const hasTickets = tickets >= 1;   // need a full ticket to use interactions
  const isHatched = user.hatched;
  const mood = getPetMood(user);
  const [showGames, setShowGames] = useState(false);

  // Room background — based on time of day
  const currentHour = new Date().getHours();
  const roomName = isHatched
    ? (mood === 'sleep' ? 'bedroom' : getRoomBg(currentHour))
    : null;

  // Resolve active pet goal object (if any, unrewarded)
  const activePetGoalData = (user.activePetGoal && !user.activePetGoal.rewarded)
    ? PET_GOALS.find(g => g.id === user.activePetGoal.id)
    : null;

  function startInteraction(id) {
    if (!isHatched) return;
    if (!hasTickets) {
      setShowLockedMsg(true);
      setTimeout(() => setShowLockedMsg(false), 2500);
      return;
    }
    setActiveScene(id);
  }

  async function completeInteraction() {
    const interactionType = activeScene;
    const noPendingGoal = !(user.activePetGoal && !user.activePetGoal.rewarded);

    // Each interaction naturally leads to a matching pet goal notification
    const goalByInteraction = {
      treat:    () => Math.random() > 0.5 ? 'pg_crumbs' : 'pg_food',
      groom:    () => Math.random() > 0.5 ? 'pg_wash'   : 'pg_teeth',
      play:     () => 'pg_toys',
      cuddle:   () => Math.random() > 0.5 ? 'pg_cuddle_ask' : 'pg_bedtime',
      activity: () => (ACTIVITY_BY_ANIMAL[user.petType] || ACTIVITY_BY_ANIMAL.dog).petGoal,
    };
    const petGoalId = (noPendingGoal && goalByInteraction[interactionType])
      ? goalByInteraction[interactionType]()
      : null;

    const updated = {
      ...user,
      tickets: (user.tickets || 0) - 1,
      bondLevel: (user.bondLevel || 0) + 1,
      totalInteractions: (user.totalInteractions || 0) + 1,
      ...(petGoalId ? {
        activePetGoal: { id: petGoalId, firedAt: Date.now(), rewarded: false },
        petGoalHistory: [...(user.petGoalHistory || []), petGoalId].slice(-10),
      } : {}),
    };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    setActiveScene(null);
  }

  const activeGoals = (user.goals || []).filter(g => !g.completed);
  const level = Math.floor((user.xp || 0) / 250) + 1;
  const xpInLevel = (user.xp || 0) % 250;

  return (
    <div style={pageStyle}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ color: T.muted, fontSize: 12, fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Hi {user.username}</div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: T.text, marginTop: 2, letterSpacing: '-0.3px' }}>
              {getPetStatusText(user)}
            </h1>
          </div>
          {onLogout && (
            <button onClick={onLogout} title="Switch account" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: T.muted, fontSize: 11, fontFamily: 'DM Sans',
              padding: '4px 6px', borderRadius: 8,
              opacity: 0.6,
              marginTop: 2,
            }}>
              ↩ switch
            </button>
          )}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '8px 12px', textAlign: 'center', minWidth: 60 }}>
          <div style={{ color: T.amber, fontWeight: 700, fontSize: 16, fontFamily: 'Syne' }}>Lv {level}</div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden', width: 50 }}>
            <div style={{ width: `${(xpInLevel / 250) * 100}%`, height: '100%', background: T.amber }} />
          </div>
        </div>

      </div>

      {/* pet stage */}
      <div style={{
        position: 'relative',
        background: `radial-gradient(circle at center, ${user.petColor}11 0%, transparent 70%), ${T.surface}`,
        border: `1px solid ${(user.petVariant || 'cute') === 'dark' ? `${T.red}55` : T.border}`,
        borderRadius: 24, padding: '32px 16px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: 280, margin: '20px 0',
        overflow: 'hidden',
      }}>
        {/* Room background — changes by time of day */}
        {roomName === 'bedroom' && <BedroomBg />}
        {roomName === 'lounge'  && <LoungeRoomBg />}
        {roomName === 'kitchen' && <KitchenHangBg />}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimalPet type={user.petType} color={user.petColor} mood={mood} size={200}
                   variant={user.petVariant || 'cute'}
                   equipped={user.equipped || {}} />
        </div>

        {/* Pet name label */}
        {isHatched && (
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            textAlign: 'center', zIndex: 3,
            color: 'rgba(255,255,255,0.45)', fontSize: 11,
            fontFamily: 'DM Sans', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1.5,
          }}>
            {user.petName} — your main pet
          </div>
        )}

        {!isHatched && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,11,20,0.6)', backdropFilter: 'blur(2px)',
            zIndex: 2,
          }}>
            <Egg color={user.petColor} size={180} />
          </div>
        )}
        {showLockedMsg && (
          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16,
            background: 'rgba(255,84,112,0.15)',
            border: `1px solid ${T.red}`,
            borderRadius: 12, padding: '10px 14px',
            color: T.red, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
            textAlign: 'center', backdropFilter: 'blur(10px)',
            animation: 'shakeIn 0.4s ease-out',
            zIndex: 3,
          }}>
            Complete a goal step to earn a ticket!
          </div>
        )}
      </div>

      {/* Action row — variant toggle + games, below the card */}
      {isHatched && (
        <div style={{ display: 'flex', gap: 10, marginTop: -8, marginBottom: 16 }}>
          {/* Variant toggle */}
          <button onClick={async () => {
            const next = (user.petVariant || 'cute') === 'cute' ? 'dark' : 'cute';
            const updated = { ...user, petVariant: next };
            setUser(updated);
            await storageSet('user:' + user.username, updated);
          }} style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: (user.petVariant || 'cute') === 'dark' ? `${T.red}18` : `${T.teal}15`,
            border: `2px solid ${(user.petVariant || 'cute') === 'dark' ? T.red : T.teal}66`,
            borderRadius: 14, padding: '11px 0',
            cursor: 'pointer',
            fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13,
            color: (user.petVariant || 'cute') === 'dark' ? T.red : T.teal,
          }}>
            <span style={{ fontSize: 16 }}>{(user.petVariant || 'cute') === 'dark' ? '🔥' : '🌸'}</span>
            {(user.petVariant || 'cute') === 'dark' ? 'Switch to Cute' : 'Switch to Dark'}
          </button>
          {/* Games button */}
          <button onClick={() => setShowGames(true)} style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: `${T.purple}15`,
            border: `2px solid ${T.purple}66`,
            borderRadius: 14, padding: '11px 0',
            cursor: 'pointer',
            fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13,
            color: T.purple,
          }}>
            <span style={{ fontSize: 16 }}>🎮</span>
            Play games
          </button>
        </div>
      )}

      {/* Games screen overlay */}
      {showGames && (
        <PetGamesScreen
          user={user}
          onClose={() => setShowGames(false)}
          onEarnTickets={async (t) => {
            const updated = { ...user, tickets: (user.tickets || 0) + t };
            setUser(updated);
            await storageSet('user:' + user.username, updated);
          }}
        />
      )}

      {/* ── PET GOAL notification card ── */}
      {activePetGoalData && isHatched && !showPetGoalReward && (
        <div style={{
          background: `linear-gradient(135deg, ${activePetGoalData.color}18, ${activePetGoalData.color}08)`,
          border: `1px solid ${activePetGoalData.color}66`,
          borderRadius: 20, padding: '16px',
          marginBottom: 16,
          animation: 'shakeIn 0.4s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              fontSize: 26, width: 46, height: 46, borderRadius: '50%',
              background: `${activePetGoalData.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {activePetGoalData.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
                color: T.text, marginBottom: 4, lineHeight: 1.3,
              }}>
                {user.petName} {activePetGoalData.title}!
              </div>
              <div style={{
                fontFamily: 'DM Sans', fontSize: 12, color: T.textDim,
                lineHeight: 1.5, marginBottom: 12,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {activePetGoalData.narrative(user.petName)}
              </div>
              <button onClick={() => setShowPetGoalReward(true)} style={{
                background: activePetGoalData.color, color: '#0d1825',
                border: 'none', borderRadius: 10, padding: '9px 16px',
                fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                🎉 Reward {user.petName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* tickets bar */}
      <div style={{
        background: !isHatched ? T.surface : (hasTickets ? `linear-gradient(135deg, ${T.teal}22, ${T.blue}11)` : T.surface),
        border: !isHatched ? `1px dashed ${T.borderStrong}` : (hasTickets ? `1px solid ${T.teal}66` : `1px solid ${T.border}`),
        borderRadius: 14, padding: '12px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        opacity: !isHatched ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ticket size={20} color={!isHatched ? T.muted : (hasTickets ? T.teal : T.muted)} />
          <div>
            <div style={{ color: !isHatched ? T.muted : (hasTickets ? T.teal : T.text), fontSize: 16, fontWeight: 700, fontFamily: 'Syne' }}>
              {!isHatched ? 'Locked' : formatTickets(tickets)}
            </div>
            <div style={{ color: T.muted, fontSize: 11, fontFamily: 'DM Sans' }}>
              {!isHatched ? `Hatch ${user.petName} first` : (hasTickets ? 'Tap an action below to use one' : 'Earn one by doing a goal step')}
            </div>
          </div>
        </div>
        <div style={{ color: T.muted, fontSize: 11, textAlign: 'right', fontFamily: 'DM Sans' }}>
          <div>Bond</div>
          <div style={{ color: T.pink, fontWeight: 700, fontSize: 14 }}>♥ {user.bondLevel || 0}</div>
        </div>
      </div>

      {/* interactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        {INTERACTIONS.map(i => (
          <InteractionBtn key={i.id} interaction={i} disabled={!isHatched || !hasTickets} onClick={() => startInteraction(i.id)} />
        ))}
      </div>
      <ActivityBtn petType={user.petType} disabled={!isHatched || !hasTickets} onClick={() => startInteraction('activity')} />

      {/* goals teaser */}
      <div style={{ marginBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: T.text }}>Your goals</h3>
          <button onClick={goToGoals} style={{ background: 'none', border: 'none', color: T.teal, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' }}>
            See all →
          </button>
        </div>
        {activeGoals.length === 0 ? (
          <div style={{ background: T.surface, border: `1px dashed ${T.borderStrong}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <Target size={28} color={T.muted} style={{ marginBottom: 8 }} />
            <div style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', marginBottom: 12 }}>
              Each step earns one ticket to spend with {user.petName}.
            </div>
            <button onClick={goToGoals} style={{
              background: T.teal, color: '#0d1825', border: 'none', borderRadius: 10,
              padding: '10px 18px', fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans', cursor: 'pointer',
            }}>
              Start your first goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeGoals.slice(0, 2).map(g => <GoalCard key={g.id} goal={g} onClick={() => openGoal(g.id)} />)}
          </div>
        )}
      </div>

      {activeScene && (
        <InteractionScene
          user={user}
          setUser={setUser}
          type={activeScene}
          onComplete={completeInteraction}
          onCancel={() => setActiveScene(null)}
        />
      )}

      {showPetGoalReward && activePetGoalData && (
        <PetGoalRewardScene
          user={user}
          setUser={setUser}
          petGoal={activePetGoalData}
          onComplete={() => setShowPetGoalReward(false)}
          onCancel={() => setShowPetGoalReward(false)}
        />
      )}
    </div>
  );
}

function InteractionBtn({ interaction, disabled, onClick }) {
  const Icon = interaction.icon;
  return (
    <button onClick={onClick} style={{
      background: disabled ? 'rgba(255,255,255,0.03)' : T.card,
      border: `1px solid ${disabled ? T.border : T.borderStrong}`,
      borderRadius: 14, padding: '14px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      cursor: 'pointer', fontFamily: 'DM Sans',
      opacity: disabled ? 0.5 : 1,
      position: 'relative',
      transition: 'all 0.15s',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: disabled ? 'rgba(255,255,255,0.04)' : `${interaction.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {disabled ? <Lock size={16} color={T.muted} /> : <Icon size={20} color={interaction.color} />}
      </div>
      <span style={{ fontSize: 12, color: disabled ? T.muted : T.textDim, fontWeight: 600 }}>{interaction.label}</span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// GOAL CARD
// ────────────────────────────────────────────────────────────────────────────
function GoalCard({ goal, onClick }) {
  const totalSteps = goal.steps.length;
  const doneSteps = goal.steps.filter(s => s.done).length;
  const pct = totalSteps ? (doneSteps / totalSteps) * 100 : 0;
  const cat = goal.category ? GOAL_CATEGORIES.find(c => c.id === goal.category) : null;
  return (
    <button onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 14, textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: 'pointer', fontFamily: 'DM Sans', width: '100%',
    }}>
      <div style={{ flexShrink: 0, width: 48, height: 48 }}>
        <svg viewBox="0 0 200 200" width="48" height="48">
          {goal.friendHatched ? (
            (() => { const C = ANIMAL_COMPONENTS[goal.friendPetType]; return <C color={goal.friendPetColor} mood="awake" />; })()
          ) : (
            <g><ellipse cx="100" cy="180" rx="45" ry="5" fill="rgba(0,0,0,0.3)" />
              <path d="M 100 25 C 60 25, 40 90, 40 140 C 40 170, 65 185, 100 185 C 135 185, 160 170, 160 140 C 160 90, 140 25, 100 25 Z" fill="#e8dcc0" />
              <circle cx="80" cy="90" r="3" fill={goal.friendPetColor} opacity="0.5" />
              <circle cx="125" cy="120" r="2.5" fill={goal.friendPetColor} opacity="0.5" />
            </g>
          )}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {goal.title}
        </div>
        {cat && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: T.muted, fontFamily: 'DM Sans',
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 12 }}>{cat.emoji}</span>
            <span style={{ fontWeight: 500 }}>{cat.label}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: goal.friendPetColor || T.teal, transition: 'width 0.6s' }} />
          </div>
          <span style={{ color: T.muted, fontSize: 12 }}>{doneSteps}/{totalSteps}</span>
        </div>
      </div>
      <ChevronRight size={18} color={T.muted} />
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// GOALS LIST SCREEN
// ────────────────────────────────────────────────────────────────────────────
function GoalsScreen({ user, openGoal, openNewGoal }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const allGoals = user.goals || [];

  // Categories present in goals (with counts) + an "Uncategorised" bucket if any
  const categoryCounts = useMemo(() => {
    const counts = {};
    let uncat = 0;
    for (const g of allGoals) {
      if (g.category) counts[g.category] = (counts[g.category] || 0) + 1;
      else uncat += 1;
    }
    return { counts, uncat };
  }, [allGoals]);

  const usedCategories = GOAL_CATEGORIES.filter(c => categoryCounts.counts[c.id] > 0);
  const showFilterBar = allGoals.length > 0 && (usedCategories.length > 0 || categoryCounts.uncat > 0);

  const matches = (g) => {
    if (selectedCategory === null) return true;
    if (selectedCategory === '__uncat__') return !g.category;
    return g.category === selectedCategory;
  };

  const active = allGoals.filter(g => !g.completed && matches(g));
  const completed = allGoals.filter(g => g.completed && matches(g));
  const isFiltered = selectedCategory !== null;

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text, letterSpacing: '-0.3px' }}>Goals</h1>
        <button onClick={openNewGoal} style={{
          background: T.teal, color: '#0d1825', border: 'none', borderRadius: 12,
          padding: '10px 14px', fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans',
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          boxShadow: `0 6px 18px ${T.teal}33`,
        }}>
          <Plus size={16} strokeWidth={2.5} /> New goal
        </button>
      </div>

      {/* Category filter chips — horizontal scroll, only shown when there are goals */}
      {showFilterBar && (
        <div style={{
          display: 'flex', gap: 8,
          overflowX: 'auto', overflowY: 'hidden',
          marginBottom: 20, paddingBottom: 4,
          marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
          scrollbarWidth: 'none',
        }}>
          <CategoryChip
            label="All" emoji="✨" count={allGoals.length}
            active={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {usedCategories.map(c => (
            <CategoryChip
              key={c.id} label={c.label} emoji={c.emoji}
              count={categoryCounts.counts[c.id]}
              active={selectedCategory === c.id}
              onClick={() => setSelectedCategory(c.id)}
            />
          ))}
          {categoryCounts.uncat > 0 && (
            <CategoryChip
              label="No category" emoji="•" count={categoryCounts.uncat}
              active={selectedCategory === '__uncat__'}
              onClick={() => setSelectedCategory('__uncat__')}
            />
          )}
        </div>
      )}

      {allGoals.length === 0 && (
        <div style={{ background: T.surface, border: `1px dashed ${T.borderStrong}`, borderRadius: 20, padding: 40, textAlign: 'center', marginTop: 40 }}>
          <Target size={40} color={T.muted} style={{ marginBottom: 12 }} />
          <h3 style={{ fontFamily: 'Syne', color: T.text, fontSize: 18, marginBottom: 8 }}>No goals yet</h3>
          <p style={{ color: T.muted, fontSize: 14, fontFamily: 'DM Sans', marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
            Start your first goal — finishing each step earns a ticket to spend with {user.petName}.
          </p>
          <button onClick={openNewGoal} style={{
            background: T.teal, color: '#0d1825', border: 'none', borderRadius: 12,
            padding: '12px 20px', fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans', cursor: 'pointer',
          }}>
            Start a goal
          </button>
        </div>
      )}

      {/* Empty filter result — show only when filtering and nothing matches */}
      {allGoals.length > 0 && active.length === 0 && completed.length === 0 && isFiltered && (
        <div style={{
          background: T.surface, border: `1px dashed ${T.borderStrong}`,
          borderRadius: 16, padding: 28, textAlign: 'center',
          color: T.muted, fontSize: 14, fontFamily: 'DM Sans',
        }}>
          No goals in this category yet.
        </div>
      )}

      {active.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={sectionTitle}>In progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map(g => <GoalCard key={g.id} goal={g} onClick={() => openGoal(g.id)} />)}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div style={{ marginBottom: 100 }}>
          <h3 style={sectionTitle}>Completed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.map(g => <GoalCard key={g.id} goal={g} onClick={() => openGoal(g.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({ label, emoji, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 12px',
      background: active ? `${T.teal}1f` : T.surface,
      border: active ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
      borderRadius: 20,
      color: active ? T.teal : T.textDim,
      fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans',
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'all 0.15s',
    }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span>{label}</span>
      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: '2px 7px', borderRadius: 10,
        background: active ? `${T.teal}33` : 'rgba(255,255,255,0.06)',
        color: active ? T.teal : T.muted,
        minWidth: 18, textAlign: 'center',
      }}>{count}</span>
    </button>
  );
}

const sectionTitle = {
  fontFamily: 'DM Sans', fontWeight: 600, fontSize: 12,
  color: T.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
};

// ────────────────────────────────────────────────────────────────────────────
// HATCHING OVERLAY — watched by teen when goal is created
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// PET ROUTINES — what the pet does while in co-pilot mode
// ────────────────────────────────────────────────────────────────────────────
const PET_ROUTINES = [
  {
    id: 'sign',  duration: 6500, label: 'Holding a sign',
    petAnim: 'routineBob 2.6s ease-in-out infinite',
    render: ({ petColor, signText }) => (
      <>
        {/* Sign on a stick over the pet's head */}
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 60, background: '#8B5A2B', borderRadius: 2, zIndex: 4,
        }} />
        <div style={{
          position: 'absolute', top: -56, left: '50%',
          transform: 'translateX(-50%)', zIndex: 5,
          background: '#fff8d4', border: `3px solid ${petColor}`,
          borderRadius: 12, padding: '8px 14px',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#2a2010',
          letterSpacing: 0.5, whiteSpace: 'nowrap',
          boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
          animation: 'signWiggle 1.4s ease-in-out infinite',
        }}>
          {signText}
        </div>
      </>
    ),
  },
  {
    id: 'dance', duration: 5500, label: 'Dancing',
    petAnim: 'routineDance 1.2s ease-in-out infinite',
    render: ({ petColor }) => (
      <>
        {[
          { x: -90, y: -20, d: 0,    s: 18 }, { x: 95, y: -10, d: 0.3,  s: 14 },
          { x: -80, y: 60, d: 0.6,  s: 16 }, { x: 88,  y: 50,  d: 0.9,  s: 12 },
          { x: 0,   y: -100, d: 0.2,  s: 20 },
        ].map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: `translate(${p.x}px, ${p.y}px)`,
            fontSize: p.s, opacity: 0,
            animation: `routineSparkle 1.4s ease-in-out ${p.d}s infinite`,
            color: petColor, zIndex: 3,
          }}>✦</div>
        ))}
        <div style={{
          position: 'absolute', bottom: -12, left: '50%',
          transform: 'translateX(-50%)',
          width: 110, height: 8, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${petColor}55 0%, transparent 70%)`,
          animation: 'routineShadow 1.2s ease-in-out infinite',
          zIndex: 0,
        }} />
      </>
    ),
  },
  {
    id: 'pompom', duration: 5500, label: 'Cheering',
    petAnim: 'routineJump 0.9s ease-in-out infinite',
    render: ({ petColor }) => (
      <>
        {/* Left pom-pom */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-110px, -10px)',
          animation: 'pompomLeft 0.9s ease-in-out infinite',
          zIndex: 4,
        }}>
          <PomPom color={T.pink} size={36} />
        </div>
        {/* Right pom-pom */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(74px, -10px)',
          animation: 'pompomRight 0.9s ease-in-out infinite',
          zIndex: 4,
        }}>
          <PomPom color={T.amber} size={36} />
        </div>
      </>
    ),
  },
  {
    id: 'flag', duration: 5500, label: 'Waving a flag',
    petAnim: 'routineBob 2.4s ease-in-out infinite',
    render: ({ petColor, petName }) => (
      <>
        {/* Flag pole */}
        <div style={{
          position: 'absolute', top: -50, left: '50%', transform: 'translateX(28px)',
          width: 3, height: 120, background: '#7a5a3a', borderRadius: 1.5, zIndex: 4,
        }} />
        {/* Fluttering flag */}
        <svg style={{
          position: 'absolute', top: -52, left: '50%',
          marginLeft: 30, zIndex: 5,
          animation: 'flagFlutter 1.6s ease-in-out infinite',
          transformOrigin: 'left center',
        }} width="60" height="42" viewBox="0 0 60 42">
          <path d="M 0 0 Q 30 8 60 4 Q 50 22 60 38 Q 30 32 0 42 Z" fill={petColor} />
          <path d="M 0 0 Q 30 8 60 4 Q 50 22 60 38 Q 30 32 0 42 Z" fill="rgba(255,255,255,0.2)" />
          <text x="28" y="26" textAnchor="middle" fill="#fff"
            fontFamily="Syne" fontWeight="800" fontSize="11">GO!</text>
        </svg>
      </>
    ),
  },
  {
    id: 'star', duration: 5500, label: 'Holding a star',
    petAnim: 'routineBob 2.8s ease-in-out infinite',
    render: ({ petColor }) => (
      <>
        <div style={{
          position: 'absolute', top: -64, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 56, zIndex: 5,
          animation: 'starRise 2.2s ease-in-out infinite',
          filter: `drop-shadow(0 0 16px #FFD700aa)`,
        }}>⭐</div>
        {/* Sparkle ring */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div key={i} style={{
            position: 'absolute', top: -50, left: '50%',
            transform: `translate(-50%, 0) rotate(${deg}deg) translateY(-30px)`,
            fontSize: 10, color: '#FFD700', zIndex: 4,
            animation: `routineSparkle 1.8s ease-in-out ${i * 0.2}s infinite`,
          }}>✦</div>
        ))}
      </>
    ),
  },
  {
    id: 'hearts', duration: 5500, label: 'Sending love',
    petAnim: 'routineBob 2.2s ease-in-out infinite',
    render: ({ petColor }) => (
      <>
        {[0, 0.7, 1.4, 2.1].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(${(i % 2 === 0 ? -24 : 24)}px, -10px)`,
            fontSize: 22, opacity: 0, zIndex: 4,
            animation: `heartFloat 2.8s ease-out ${delay}s infinite`,
          }}>💗</div>
        ))}
      </>
    ),
  },
  {
    id: 'jacks', duration: 5500, label: 'Jumping for you',
    petAnim: 'routineJacks 0.7s ease-in-out infinite',
    render: ({ petColor }) => (
      <>
        <div style={{
          position: 'absolute', bottom: -8, left: '50%',
          transform: 'translateX(-50%)',
          width: 110, height: 6, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)`,
          animation: 'routineShadow 0.7s ease-in-out infinite',
        }} />
        {[-30, 0, 30].map((x, i) => (
          <div key={i} style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: `translateX(${x}px)`,
            fontSize: 14, opacity: 0,
            animation: `dustPoof 0.7s ease-out ${i * 0.1}s infinite`,
          }}>💨</div>
        ))}
      </>
    ),
  },
  {
    id: 'meditate', duration: 7000, label: 'Meditating with you',
    petAnim: 'routineBreath 4s ease-in-out infinite',
    render: ({ petColor }) => (
      <>
        {/* Zen ring */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 220, height: 220, marginLeft: -110, marginTop: -110,
          borderRadius: '50%',
          border: `2px solid ${petColor}33`,
          animation: 'zenPulse 4s ease-in-out infinite',
          zIndex: 0,
        }} />
        {/* Floating zen circles */}
        {[
          { x: -100, y: -30, d: 0    },
          { x: 100,  y: -50, d: 1.3  },
          { x: -90,  y: 70,  d: 2.6  },
          { x: 95,   y: 60,  d: 0.7  },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(${o.x}px, ${o.y}px)`,
            width: 10, height: 10, borderRadius: '50%',
            background: petColor, opacity: 0,
            animation: `zenDot 4s ease-in-out ${o.d}s infinite`,
            zIndex: 3,
          }} />
        ))}
        {/* Om symbol */}
        <div style={{
          position: 'absolute', top: -36, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 22, opacity: 0.4, color: petColor, zIndex: 4,
          animation: 'omFloat 4s ease-in-out infinite',
        }}>☯</div>
      </>
    ),
  },
];

function PomPom({ color, size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x = 18 + Math.cos(angle) * 11;
        const y = 18 + Math.sin(angle) * 11;
        return <circle key={i} cx={x} cy={y} r="6" fill={color} opacity={0.85} />;
      })}
      <circle cx="18" cy="18" r="9" fill={color} />
      <circle cx="15" cy="15" r="3" fill="#fff" opacity="0.5" />
      {/* Handle */}
      <rect x="16" y="26" width="4" height="10" fill="#5a4a3a" rx="1" />
    </svg>
  );
}

const SIGN_TEXTS = [
  'YOU GOT THIS!', "GO GO GO!", "BELIEVE!", "I'M PROUD!",
  "KEEP GOING", "ALMOST!", "YOU CAN!", "YES!",
  "POWER UP!", "BRAVE!",
];

function PetWithRoutine({ petType, petColor, petVariant, equipped, mood, petName, routine, signText }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Behind-pet effects (shadow ellipses, zen rings etc) */}
      {routine && routine.render && routine.render({ petColor, petName, signText })}
      {/* The pet itself, animated by the routine's petAnim */}
      <div style={{
        animation: routine?.petAnim || 'petBob 3s ease-in-out infinite',
        position: 'relative', zIndex: 2,
      }}>
        <AnimalPet type={petType} color={petColor} mood={mood} size={180}
          variant={petVariant} equipped={equipped} />
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// CO-PILOT MODE — pet sits with you while you do the hard task in real life
// ────────────────────────────────────────────────────────────────────────────
const PET_ENCOURAGEMENT = {
  // Base pool — used when no category-specific match
  default: [
    "I'm right here with you 💛",
    "Take your time. There's no rush.",
    "You don't have to do this perfectly.",
    "I believe in you.",
    "One small thing at a time.",
    "Whatever happens, I'm proud of you for trying.",
    "Just breathe. I'm not going anywhere.",
  ],
  emotional: [
    "Big feelings are okay. They pass.",
    "You can sit with it. I'll sit with you.",
    "Naming it can help. What does it feel like?",
    "Slow breath in… and out…",
    "It's not forever. Just right now.",
    "You're allowed to feel this.",
  ],
  home_care: [
    "Just one thing first. Then the next.",
    "Done is better than perfect.",
    "You don't have to enjoy it. Just do it.",
    "Set a tiny goal — like one shelf, one corner.",
    "I'll wait while you work.",
    "When it's done, you'll feel lighter.",
  ],
  cooking: [
    "Read the next step. Just that one.",
    "Hot things are sharp. Move slowly.",
    "If it goes wrong, that's fine — try again.",
    "It doesn't have to look like the picture.",
    "You're feeding yourself. That matters.",
  ],
  social: [
    "You don't have to say much.",
    "If your voice shakes, that's okay.",
    "Short answers are still answers.",
    "You can leave when you want to.",
    "Just one hello. That's enough.",
    "I'll be right here when you come back.",
  ],
  community: [
    "Bus, train, shop — one step at a time.",
    "You've got your stuff? Phone, keys, wallet?",
    "If something goes wrong, you can ask for help.",
    "Headphones in if you need them.",
    "Find a calm spot if it gets loud.",
    "You've done this kind of thing before.",
  ],
  school_work: [
    "Just open the doc. That's the first step.",
    "Five minutes of focus is still focus.",
    "Don't read everything — just the next bit.",
    "Crap drafts are still drafts.",
    "Done > perfect. Always.",
    "Timer's running. I'm here.",
  ],
  body: [
    "Even a little is more than nothing.",
    "Drink some water first.",
    "Slow is fine. You're moving.",
    "Listen to your body.",
    "Sleep counts. Rest counts.",
    "I'll be here when you finish.",
  ],
  other: [
    "You picked this. You can do this.",
    "Take your time.",
    "I'm here. No rush.",
    "One bit at a time.",
  ],
};

function getEncouragementPool(category) {
  return [
    ...(PET_ENCOURAGEMENT[category] || []),
    ...PET_ENCOURAGEMENT.default,
  ];
}

function CoPilotMode({ user, goal, step, onDone, onCancel, onComplete }) {
  const [bubble, setBubble]       = useState(null);
  const [bubbleKey, setBubbleKey] = useState(0);
  const [seconds, setSeconds]     = useState(0);
  const [paused, setPaused]       = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [routineIdx, setRoutineIdx] = useState(0);
  const [signText, setSignText]   = useState(SIGN_TEXTS[0]);

  const pool   = useMemo(() => getEncouragementPool(goal?.category), [goal?.category]);
  const poolRef = useRef(pool);
  poolRef.current = pool;

  const petType    = user.petType || 'dog';
  const petColor   = user.petColor || T.teal;
  const petVariant = user.petVariant || 'cute';
  const equipped   = user.equipped || {};

  // Cycle through routines — pet does a different action every few seconds
  useEffect(() => {
    if (paused) return;
    const current = PET_ROUTINES[routineIdx % PET_ROUTINES.length];
    const t = setTimeout(() => {
      // Pick next routine — never the same one twice in a row
      setRoutineIdx(prev => {
        let next;
        do { next = Math.floor(Math.random() * PET_ROUTINES.length); }
        while (next === prev % PET_ROUTINES.length && PET_ROUTINES.length > 1);
        return next;
      });
      // Refresh sign text each cycle so 'sign' routine has variety
      setSignText(SIGN_TEXTS[Math.floor(Math.random() * SIGN_TEXTS.length)]);
    }, current.duration);
    return () => clearTimeout(t);
  }, [routineIdx, paused]);

  // Rotating encouragement
  useEffect(() => {
    let lastIdx = -1;
    const showNew = () => {
      let idx;
      do { idx = Math.floor(Math.random() * poolRef.current.length); }
      while (idx === lastIdx && poolRef.current.length > 1);
      lastIdx = idx;
      setBubble(poolRef.current[idx]);
      setBubbleKey(k => k + 1);
    };
    showNew();                              // immediate first bubble
    const interval = setInterval(() => {
      if (!paused) showNew();
    }, 9000);                               // calm cadence — every 9s
    return () => clearInterval(interval);
  }, [paused]);

  // Timer (counts up — supportive, not pressuring)
  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, [paused]);

  // Pet mood evolves with elapsed time
  const petMood = seconds < 30 ? 'awake' : seconds < 180 ? 'happy' : 'happy';

  // Format time
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  function handleFinish() {
    sfx.cuddleDone?.();
    setShowFinish(true);
    setTimeout(() => onComplete(), 1800);
  }

  // Final celebration screen
  if (showFinish) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 95,
        background: `radial-gradient(circle at center, ${petColor}33 0%, #050b14 70%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'sceneIn 0.4s ease-out',
      }}>
        {/* Confetti */}
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '40%',
            left: `${10 + i * 6}%`,
            width: 8, height: 14,
            background: [T.teal, T.amber, T.pink, T.blue, T.purple][i % 5],
            borderRadius: 2,
            animation: `confetti ${1.4 + (i % 5) * 0.2}s ease-out forwards`,
            transform: `rotate(${i * 30}deg)`,
          }} />
        ))}
        <div style={{ animation: 'cheerBurst 0.8s ease-out' }}>
          <AnimalPet type={petType} color={petColor} mood="happy" size={220}
            variant={petVariant} equipped={equipped} />
        </div>
        <div style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 32, color: T.text,
          marginTop: 24, textAlign: 'center', padding: '0 30px',
        }}>
          You did it! 🌟
        </div>
        <div style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', marginTop: 8 }}>
          {user.petName} is so proud of you.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: `linear-gradient(180deg, #050b14 0%, ${petColor}0a 50%, #050b14 100%)`,
      display: 'flex', flexDirection: 'column',
      animation: 'sceneIn 0.4s ease-out',
    }}>
      {/* Top bar — minimal */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
          borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
          color: T.textDim, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
        }}>
          Pause
        </button>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 18,
          color: T.muted, letterSpacing: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {mm}:{ss}
        </div>
        <div style={{ width: 70 }} />
      </div>

      {/* Step text — what we're doing */}
      <div style={{
        padding: '8px 28px 0', textAlign: 'center',
      }}>
        <div style={{
          color: T.muted, fontSize: 11, fontFamily: 'DM Sans', fontWeight: 700,
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
        }}>
          You & {user.petName} — together
        </div>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 19,
          color: T.text, lineHeight: 1.3, marginBottom: 4,
        }}>
          {step?.text || 'Working on it'}
        </div>
      </div>

      {/* Pet — the anchor */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 24px', position: 'relative',
      }}>
        {/* Breathing glow */}
        <div style={{
          position: 'absolute',
          width: 280, height: 280, borderRadius: '50%',
          background: `radial-gradient(circle, ${petColor}22 0%, transparent 70%)`,
          filter: 'blur(20px)',
          animation: 'breathe 4s ease-in-out infinite',
        }} />

        {/* Bubble above pet */}
        {bubble && !paused && (
          <div key={bubbleKey} style={{
            position: 'relative',
            background: T.surface,
            border: `1.5px solid ${petColor}55`,
            borderRadius: 18,
            padding: '12px 18px',
            maxWidth: 280,
            marginBottom: 8,
            boxShadow: `0 8px 24px ${petColor}22`,
            animation: 'bubbleIn 0.5s ease-out',
            zIndex: 2,
          }}>
            <div style={{
              color: T.text, fontSize: 14, fontFamily: 'DM Sans',
              fontWeight: 500, lineHeight: 1.4, textAlign: 'center',
            }}>
              {bubble}
            </div>
            {/* Tail */}
            <div style={{
              position: 'absolute', bottom: -7, left: '50%', marginLeft: -7,
              width: 14, height: 14,
              background: T.surface,
              borderRight: `1.5px solid ${petColor}55`,
              borderBottom: `1.5px solid ${petColor}55`,
              transform: 'rotate(45deg)',
            }} />
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <PetWithRoutine
            petType={petType} petColor={petColor} petVariant={petVariant}
            equipped={equipped} mood={petMood} petName={user.petName}
            routine={paused ? null : PET_ROUTINES[routineIdx % PET_ROUTINES.length]}
            signText={signText}
          />
        </div>

        {/* Tiny label of what pet's doing */}
        {!paused && (
          <div style={{
            color: petColor, fontSize: 10, fontFamily: 'DM Sans',
            fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            marginTop: 28, opacity: 0.7,
          }}>
            {PET_ROUTINES[routineIdx % PET_ROUTINES.length].label}
          </div>
        )}

        {/* Hint about presence */}
        <div style={{
          color: T.muted, fontSize: 11, fontFamily: 'DM Sans',
          marginTop: 18, textAlign: 'center', lineHeight: 1.5, maxWidth: 240,
        }}>
          {paused ? 'Take all the time you need. Tap below when you\'re ready.' : 'Put your phone down if you need to. I\'ll be here.'}
        </div>
      </div>

      {/* Bottom action — done button */}
      <div style={{ padding: '0 20px 32px' }}>
        <button onClick={handleFinish} style={{
          width: '100%',
          background: T.teal, color: '#0d1825',
          border: 'none', borderRadius: 16,
          padding: '18px 0',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 17, cursor: 'pointer',
          boxShadow: `0 8px 24px ${T.teal}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          ✓ I did it!
        </button>
        <button onClick={() => setPaused(p => !p)} style={{
          width: '100%', marginTop: 10,
          background: 'transparent', color: T.muted,
          border: `1px solid ${T.border}`, borderRadius: 14,
          padding: '12px 0',
          fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>
          {paused ? '▶ Resume' : '⏸ Just pause for a sec'}
        </button>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// CO-PILOT WALKTHROUGH — pet walks teen through co-authored micro-steps
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// WALKTHROUGH SCENES — the pet's environment that responds to progress
// Each scene maps progress (0..1) → visual state. Pet sits inside the scene.
// ────────────────────────────────────────────────────────────────────────────

function KitchenScene({ progress, pet, isComplete }) {
  // progress: 0 = full mess, 1 = sparkling clean
  // Compute layered visibility from progress
  const messLevel = 1 - progress; // 1 = full mess, 0 = clean
  const dishCount = isComplete ? 0 : Math.max(0, Math.ceil(6 * messLevel));
  const bubbleOpacity = isComplete ? 0 : Math.max(0, messLevel - 0.2);
  const sparkleOpacity = isComplete ? 1 : Math.max(0, progress - 0.5) * 2;

  return (
    <div style={{
      position: 'relative',
      width: '100%', maxWidth: 360, aspectRatio: '4 / 3',
      margin: '0 auto',
    }}>
      <svg viewBox="0 0 400 300" width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD8B0" />
            <stop offset="100%" stopColor="#F5B888" />
          </linearGradient>
          <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8D8B8" />
            <stop offset="100%" stopColor="#A88860" />
          </linearGradient>
          <linearGradient id="cabinetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A5A3A" />
            <stop offset="100%" stopColor="#5A4028" />
          </linearGradient>
          <radialGradient id="bubbleGrad" cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#B0E0FF" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id="sinkWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8D8F0" />
            <stop offset="100%" stopColor="#6090C0" />
          </linearGradient>
        </defs>

        {/* Wall */}
        <rect x="0" y="0" width="400" height="200" fill="url(#wallGrad)" />
        {/* Floor */}
        <rect x="0" y="200" width="400" height="100" fill="#9A6840" />
        <line x1="0" y1="220" x2="400" y2="220" stroke="#7A4828" strokeWidth="1.5" />
        {/* Floor planks */}
        {[60, 130, 200, 270, 340].map(x => (
          <line key={x} x1={x} y1="220" x2={x - 8} y2="300" stroke="#7A4828" strokeWidth="1" opacity="0.6" />
        ))}

        {/* Window with curtains */}
        <rect x="40" y="30" width="80" height="70" fill="#A8D8FF" stroke="#5A3F28" strokeWidth="3" rx="4" />
        <line x1="80" y1="30" x2="80" y2="100" stroke="#5A3F28" strokeWidth="2" />
        <line x1="40" y1="65" x2="120" y2="65" stroke="#5A3F28" strokeWidth="2" />
        <path d="M 36 28 Q 32 60 36 102 L 50 102 Q 46 60 50 28 Z" fill="#FF8FB0" stroke="#5A3F28" strokeWidth="2" strokeLinejoin="round" />
        <path d="M 364 28 Q 368 60 364 102 L 350 102 Q 354 60 350 28 Z" fill="#FF8FB0" stroke="#5A3F28" strokeWidth="2" strokeLinejoin="round" transform="translate(-244, 0)" />
        {/* Sun outside */}
        {sparkleOpacity > 0.3 && (
          <>
            <circle cx="100" cy="55" r="8" fill="#FFD040" opacity={sparkleOpacity * 0.8} />
            <text x="92" y="82" fontSize="10" fill="#FFD040" opacity={sparkleOpacity}>✦</text>
          </>
        )}

        {/* Upper cabinets */}
        <rect x="220" y="20" width="160" height="60" fill="url(#cabinetGrad)" stroke="#3A2818" strokeWidth="2.5" rx="3" />
        <line x1="300" y1="20" x2="300" y2="80" stroke="#3A2818" strokeWidth="2" />
        <circle cx="294" cy="50" r="2" fill="#FFD040" />
        <circle cx="306" cy="50" r="2" fill="#FFD040" />

        {/* Bench / counter */}
        <rect x="0" y="160" width="400" height="22" fill="url(#benchGrad)" stroke="#5A3F28" strokeWidth="2.5" />
        <rect x="0" y="180" width="400" height="40" fill="url(#cabinetGrad)" stroke="#3A2818" strokeWidth="2.5" />
        <line x1="100" y1="182" x2="100" y2="220" stroke="#3A2818" strokeWidth="2" />
        <line x1="200" y1="182" x2="200" y2="220" stroke="#3A2818" strokeWidth="2" />
        <line x1="300" y1="182" x2="300" y2="220" stroke="#3A2818" strokeWidth="2" />
        <circle cx="65" cy="200" r="2" fill="#FFD040" />
        <circle cx="135" cy="200" r="2" fill="#FFD040" />
        <circle cx="235" cy="200" r="2" fill="#FFD040" />
        <circle cx="335" cy="200" r="2" fill="#FFD040" />

        {/* SINK — embedded in the bench */}
        <rect x="220" y="148" width="120" height="34" fill="#888" stroke="#3A2818" strokeWidth="2.5" rx="4" />
        <rect x="226" y="153" width="108" height="26" fill="#444" rx="2" />
        {/* Tap */}
        <rect x="270" y="118" width="6" height="32" fill="#aaa" stroke="#3A2818" strokeWidth="1.5" />
        <path d="M 268 116 L 290 116 L 290 128 L 286 128 L 286 122 L 272 122 L 272 128 L 268 128 Z" fill="#aaa" stroke="#3A2818" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Sink water (only when bubbles present) */}
        {bubbleOpacity > 0 && (
          <>
            <rect x="226" y="155" width="108" height="22" fill="url(#sinkWater)" opacity={Math.min(1, bubbleOpacity * 1.5)} />
            {/* Bubbles inside sink */}
            {bubbleOpacity > 0.1 && Array.from({ length: 14 }).map((_, i) => {
              const bx = 232 + (i * 7) % 100;
              const by = 158 + Math.floor(i / 5) * 6;
              const r = 3 + (i % 3);
              return (
                <circle key={`sb${i}`} cx={bx} cy={by} r={r}
                  fill="url(#bubbleGrad)" opacity={bubbleOpacity}
                  style={{ animation: `bubblePop 4s ease-in-out ${i * 0.2}s infinite` }}
                />
              );
            })}
            {/* Big bubble pile rising above sink */}
            {bubbleOpacity > 0.3 && Array.from({ length: 10 }).map((_, i) => {
              const bx = 230 + (i * 11) % 105;
              const by = 145 - (i % 3) * 6;
              const r = 5 + (i % 4) * 1.5;
              return (
                <circle key={`sbu${i}`} cx={bx} cy={by} r={r}
                  fill="url(#bubbleGrad)" opacity={bubbleOpacity * 0.85}
                  stroke="#fff" strokeWidth="0.5" strokeOpacity="0.6"
                  style={{ animation: `bubbleFloat 5s ease-in-out ${i * 0.3}s infinite` }}
                />
              );
            })}
          </>
        )}

        {/* DISHES on bench (left side) — shown based on dishCount */}
        {dishCount > 0 && (() => {
          const dishes = [
            // Stack of plates
            { type: 'plates', x: 30, y: 158 },
            // Single bowl
            { type: 'bowl', x: 80, y: 156 },
            // Cup
            { type: 'cup', x: 115, y: 154 },
            // Pan
            { type: 'pan', x: 150, y: 158 },
            // Mess of cutlery
            { type: 'cutlery', x: 185, y: 159 },
            // Big mixing bowl
            { type: 'bigbowl', x: 360, y: 156 },
          ];
          return dishes.slice(0, dishCount).map((d, i) => {
            if (d.type === 'plates') {
              return (
                <g key={`d${i}`} style={{ transition: 'opacity 0.4s ease', animation: 'dishFade 0.4s ease' }}>
                  <ellipse cx={d.x} cy={d.y - 4} rx="22" ry="3" fill="#fff" stroke="#3A2818" strokeWidth="1.5" />
                  <ellipse cx={d.x} cy={d.y - 1} rx="22" ry="3" fill="#FFE0E8" stroke="#3A2818" strokeWidth="1.5" />
                  <ellipse cx={d.x} cy={d.y + 2} rx="22" ry="3" fill="#fff" stroke="#3A2818" strokeWidth="1.5" />
                  <ellipse cx={d.x - 8} cy={d.y - 5} rx="3" ry="1" fill="#A88860" opacity="0.6" />
                </g>
              );
            }
            if (d.type === 'bowl') {
              return (
                <g key={`d${i}`} style={{ animation: 'dishFade 0.4s ease' }}>
                  <path d={`M ${d.x - 12} ${d.y - 3} L ${d.x - 14} ${d.y + 4} Q ${d.x} ${d.y + 9} ${d.x + 14} ${d.y + 4} L ${d.x + 12} ${d.y - 3} Z`}
                    fill="#FFD8E0" stroke="#3A2818" strokeWidth="1.8" strokeLinejoin="round" />
                  <ellipse cx={d.x} cy={d.y - 3} rx="12" ry="3" fill="#FFB0C0" stroke="#3A2818" strokeWidth="1.5" />
                  {/* Crusty bits */}
                  <circle cx={d.x - 4} cy={d.y - 2} r="1.5" fill="#A88860" />
                  <circle cx={d.x + 3} cy={d.y - 4} r="1" fill="#A88860" />
                </g>
              );
            }
            if (d.type === 'cup') {
              return (
                <g key={`d${i}`} style={{ animation: 'dishFade 0.4s ease' }}>
                  <rect x={d.x - 8} y={d.y - 8} width="16" height="14" fill="#A8D8F0" stroke="#3A2818" strokeWidth="1.5" rx="2" />
                  <path d={`M ${d.x + 8} ${d.y - 4} Q ${d.x + 14} ${d.y - 2} ${d.x + 12} ${d.y + 2}`} fill="none" stroke="#3A2818" strokeWidth="1.5" />
                  {/* Coffee dregs */}
                  <ellipse cx={d.x} cy={d.y - 7} rx="5" ry="1" fill="#5A3F28" />
                </g>
              );
            }
            if (d.type === 'pan') {
              return (
                <g key={`d${i}`} style={{ animation: 'dishFade 0.4s ease' }}>
                  <ellipse cx={d.x} cy={d.y + 2} rx="18" ry="5" fill="#444" stroke="#0d1825" strokeWidth="1.8" />
                  <rect x={d.x + 14} y={d.y} width="14" height="3" fill="#5A4028" stroke="#0d1825" strokeWidth="1.2" />
                  {/* Greasy mess */}
                  <ellipse cx={d.x - 4} cy={d.y + 1} rx="3" ry="1" fill="#A88860" opacity="0.7" />
                </g>
              );
            }
            if (d.type === 'cutlery') {
              return (
                <g key={`d${i}`} style={{ animation: 'dishFade 0.4s ease' }}>
                  <rect x={d.x - 8} y={d.y - 4} width="3" height="14" fill="#aaa" stroke="#3A2818" strokeWidth="1" transform={`rotate(-15 ${d.x - 6} ${d.y + 2})`} />
                  <rect x={d.x - 1} y={d.y - 4} width="3" height="14" fill="#aaa" stroke="#3A2818" strokeWidth="1" />
                  <rect x={d.x + 6} y={d.y - 4} width="3" height="14" fill="#aaa" stroke="#3A2818" strokeWidth="1" transform={`rotate(15 ${d.x + 8} ${d.y + 2})`} />
                  <ellipse cx={d.x - 6} cy={d.y - 4} rx="2" ry="3" fill="#aaa" stroke="#3A2818" strokeWidth="0.8" />
                </g>
              );
            }
            if (d.type === 'bigbowl') {
              return (
                <g key={`d${i}`} style={{ animation: 'dishFade 0.4s ease' }}>
                  <path d={`M ${d.x - 16} ${d.y - 4} L ${d.x - 18} ${d.y + 6} Q ${d.x} ${d.y + 12} ${d.x + 18} ${d.y + 6} L ${d.x + 16} ${d.y - 4} Z`}
                    fill="#FFE8D0" stroke="#3A2818" strokeWidth="2" strokeLinejoin="round" />
                  <ellipse cx={d.x} cy={d.y - 4} rx="16" ry="3.5" fill="#F0C8A0" stroke="#3A2818" strokeWidth="1.5" />
                </g>
              );
            }
            return null;
          });
        })()}

        {/* SPARKLES on clean surfaces (when progress > 0.5) */}
        {sparkleOpacity > 0 && (
          <>
            <text x="60" y="172" fontSize="12" fill="#FFD040" opacity={sparkleOpacity} style={{ animation: 'sparkleTwinkle 2s ease-in-out infinite' }}>✦</text>
            <text x="160" y="170" fontSize="10" fill="#FFD040" opacity={sparkleOpacity * 0.8} style={{ animation: 'sparkleTwinkle 2.5s ease-in-out 0.5s infinite' }}>✦</text>
            <text x="280" y="142" fontSize="11" fill="#FFD040" opacity={sparkleOpacity * 0.9} style={{ animation: 'sparkleTwinkle 2.2s ease-in-out 1s infinite' }}>✦</text>
            <text x="370" y="172" fontSize="9" fill="#FFD040" opacity={sparkleOpacity * 0.7} style={{ animation: 'sparkleTwinkle 1.8s ease-in-out 1.5s infinite' }}>✦</text>
          </>
        )}

        {/* Tea towel hanging on cabinet handle (always there) */}
        <rect x="100" y="184" width="14" height="30" fill="#FFB0C0" stroke="#5A3F28" strokeWidth="1.5" rx="1" />
        <line x1="100" y1="190" x2="114" y2="190" stroke="#FF6B9D" strokeWidth="1" />
        <line x1="100" y1="196" x2="114" y2="196" stroke="#FF6B9D" strokeWidth="1" />

        {/* Dish soap bottle on bench */}
        <rect x="210" y="138" width="10" height="22" fill="#7FE787" stroke="#3A2818" strokeWidth="1.5" rx="1" />
        <rect x="212" y="135" width="6" height="6" fill="#FFB020" stroke="#3A2818" strokeWidth="1.2" />

        {/* Pet — sits on the floor in front of the bench */}
        {pet && (
          <g transform={`translate(140, 105) ${isComplete ? '' : ''}`}>
            <foreignObject x="0" y="0" width="120" height="120" style={{ overflow: 'visible' }}>
              {pet}
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
}

// Registry — extensible for future scenes
const WALKTHROUGH_SCENES = {
  kitchen: { id: 'kitchen', label: 'Kitchen (washing dishes)', emoji: '🍽️', component: KitchenScene },
};


function CoPilotWalkthrough({ user, goal, step, onCancel, onComplete }) {
  const microSteps = (step?.walkthrough || []).filter(ms => ms && ms.text);
  const [idx, setIdx]               = useState(0);
  const [completed, setCompleted]   = useState([]);
  const [showFinish, setShowFinish] = useState(false);

  const petType    = user.petType || 'dog';
  const petColor   = user.petColor || T.teal;
  const petVariant = user.petVariant || 'cute';
  const equipped   = user.equipped || {};
  const totalSteps = microSteps.length;
  const current    = microSteps[idx];
  const isLast     = idx === totalSteps - 1;
  const isDaily    = !!step?.daily;

  const fallbackBubble = idx === 0
    ? isDaily
      ? `Let's do today's ${step?.text?.toLowerCase() || 'task'} together.`
      : `One bit at a time. I'm right here.`
    : isLast
    ? "Last one — you're nearly there."
    : "Take your time. I'm here.";
  const bubbleText = current?.encouragement?.trim() || fallbackBubble;

  function goNext() {
    if (current) setCompleted(prev => prev.includes(current.id) ? prev : [...prev, current.id]);
    if (isLast) {
      sfx.cuddleDone?.();
      setShowFinish(true);
      setTimeout(() => onComplete(), 1800);
    } else {
      setIdx(i => i + 1);
    }
  }
  function goBack() {
    if (idx > 0) setIdx(i => i - 1);
  }

  // No walkthrough — bail
  if (!totalSteps) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 90, background: '#050b14',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 12 }}>
          No walkthrough set up yet
        </div>
        <div style={{ color: T.textDim, fontSize: 13, fontFamily: 'DM Sans', maxWidth: 280 }}>
          Ask your support worker or someone you trust to help you build one.
        </div>
        <button onClick={onCancel} style={{
          marginTop: 24, background: T.teal, color: '#0d1825', border: 'none',
          borderRadius: 12, padding: '12px 24px', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer',
        }}>Back</button>
      </div>
    );
  }

  // Final celebration screen
  if (showFinish) {
    const sceneEntry = step?.scene ? WALKTHROUGH_SCENES[step.scene] : null;
    const SceneComp = sceneEntry?.component;
    const dancingPet = (
      <div style={{ animation: 'danceSway 0.6s ease-in-out infinite', transformOrigin: 'center bottom' }}>
        <AnimalPet type={petType} color={petColor} mood="happy" size={120}
          variant={petVariant} equipped={equipped} />
      </div>
    );
    const headline = SceneComp
      ? `Look at that clean kitchen! 🌟`
      : isDaily
        ? `Done for today! 🌟`
        : `You did the whole thing! 🌟`;
    const subline = isDaily
      ? `${user.petName} will be here again tomorrow. Same time, same team.`
      : `Step by step. ${user.petName} is so proud of you.`;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 95,
        background: `radial-gradient(circle at center, ${isDaily ? T.teal : petColor}33 0%, #050b14 55%), #050b14`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'sceneIn 0.4s ease-out',
      }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: '40%', left: `${10 + i * 6}%`,
            width: 8, height: 14,
            background: [T.teal, T.amber, T.pink, T.blue, T.purple][i % 5],
            borderRadius: 2, transform: `rotate(${i * 30}deg)`,
            animation: `confetti ${1.4 + (i % 5) * 0.2}s ease-out forwards`,
          }} />
        ))}
        {SceneComp ? (
          <div style={{ width: '100%', maxWidth: 360, animation: 'cheerBurst 0.8s ease-out' }}>
            <SceneComp progress={1} isComplete={true} pet={dancingPet} />
          </div>
        ) : (
          <div style={{ animation: 'cheerBurst 0.8s ease-out' }}>
            <AnimalPet type={petType} color={petColor} mood="happy" size={220}
              variant={petVariant} equipped={equipped} />
          </div>
        )}
        <div style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text,
          marginTop: 18, textAlign: 'center', padding: '0 30px',
        }}>
          {headline}
        </div>
        <div style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', marginTop: 8, textAlign: 'center', padding: '0 30px', lineHeight: 1.5 }}>
          {subline}
        </div>
        {/* Daily badge */}
        {isDaily && (
          <div style={{
            marginTop: 18,
            background: `${T.teal}22`, border: `1px solid ${T.teal}55`,
            borderRadius: 12, padding: '8px 18px',
            color: T.teal, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 700,
          }}>
            🔁 Daily habit — keep the streak going
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: '#050b14',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      animation: 'sceneIn 0.4s ease-out',
    }}>
      {/* Top bar — fixed */}
      <div style={{
        flexShrink: 0,
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
          borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
          color: T.textDim, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
        }}>
          Exit
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
            color: T.muted, letterSpacing: 1,
          }}>
            STEP {idx + 1} OF {totalSteps}
          </div>
          <div style={{
            fontSize: 10, fontFamily: 'DM Sans', fontWeight: 700,
            color: isDaily ? T.teal : T.purple,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            {isDaily ? '🔁 Daily' : '⭐ One-off'}
          </div>
        </div>
        <div style={{ width: 50 }} />
      </div>

      {/* Progress dots — fixed */}
      <div style={{
        flexShrink: 0,
        display: 'flex', justifyContent: 'center', gap: 6, padding: '2px 20px 8px',
      }}>
        {microSteps.map((m, i) => (
          <div key={m.id} style={{
            width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
            background: i < idx
              ? T.teal
              : i === idx
                ? petColor
                : 'rgba(255,255,255,0.15)',
            transition: 'all 0.2s ease',
          }} />
        ))}
      </div>

      {/* Current micro-step text — fixed */}
      <div style={{ flexShrink: 0, padding: '6px 20px 0', textAlign: 'center' }}>
        <div style={{
          color: T.muted, fontSize: 10, fontFamily: 'DM Sans', fontWeight: 700,
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
        }}>
          {step?.text || 'this step'}
        </div>
        <div style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 20,
          color: T.text, lineHeight: 1.3, marginBottom: 6,
        }}>
          {current.text}
        </div>
        {current.sensoryNote && (
          <div style={{
            color: T.amber, fontSize: 11, fontFamily: 'DM Sans', fontStyle: 'italic',
            background: `${T.amber}11`, border: `1px solid ${T.amber}33`,
            borderRadius: 10, padding: '6px 12px',
            marginInline: 'auto', maxWidth: 320,
          }}>
            💡 {current.sensoryNote}
          </div>
        )}
      </div>

      {/* Scene / pet — grows to fill remaining space, never overflows */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: '8px 12px',
      }}>
        {(() => {
          const sceneKey = step?.scene;
          const sceneEntry = sceneKey ? WALKTHROUGH_SCENES[sceneKey] : null;
          const SceneComp  = sceneEntry?.component;
          const sceneProgress = totalSteps > 0 ? Math.min(1, idx / totalSteps) : 0;
          const petEl = (
            <AnimalPet type={petType} color={petColor} mood="awake" size={100}
              variant={petVariant} equipped={equipped} />
          );

          if (SceneComp) {
            return (
              <>
                {/* Speech bubble */}
                <div key={idx} style={{
                  flexShrink: 0, position: 'relative',
                  background: T.surface, border: `1.5px solid ${petColor}55`,
                  borderRadius: 16, padding: '8px 14px',
                  maxWidth: 280, marginBottom: 8,
                  boxShadow: `0 6px 18px ${petColor}22`,
                  animation: 'bubbleIn 0.5s ease-out', zIndex: 2,
                }}>
                  <div style={{
                    color: T.text, fontSize: 12, fontFamily: 'DM Sans',
                    fontWeight: 500, lineHeight: 1.4, textAlign: 'center',
                  }}>
                    {bubbleText}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', marginLeft: -6,
                    width: 12, height: 12, background: T.surface,
                    borderRight: `1.5px solid ${petColor}55`,
                    borderBottom: `1.5px solid ${petColor}55`,
                    transform: 'rotate(45deg)',
                  }} />
                </div>
                {/* Scene — constrained height so it never pushes buttons off */}
                <div style={{ width: '100%', maxHeight: 220, overflow: 'hidden' }}>
                  <SceneComp progress={sceneProgress} isComplete={false} pet={petEl} />
                </div>
              </>
            );
          }

          // No scene — centered pet
          return (
            <>
              <div style={{
                position: 'absolute',
                width: 200, height: 200, borderRadius: '50%',
                background: `radial-gradient(circle, ${petColor}22 0%, transparent 70%)`,
                filter: 'blur(18px)',
                animation: 'breathe 4s ease-in-out infinite',
              }} />
              <div key={idx} style={{
                position: 'relative', zIndex: 2,
                background: T.surface, border: `1.5px solid ${petColor}55`,
                borderRadius: 16, padding: '10px 16px',
                maxWidth: 280, marginBottom: 12,
                boxShadow: `0 8px 24px ${petColor}22`,
                animation: 'bubbleIn 0.5s ease-out',
              }}>
                <div style={{
                  color: T.text, fontSize: 13, fontFamily: 'DM Sans',
                  fontWeight: 500, lineHeight: 1.4, textAlign: 'center',
                }}>
                  {bubbleText}
                </div>
                <div style={{
                  position: 'absolute', bottom: -7, left: '50%', marginLeft: -7,
                  width: 14, height: 14, background: T.surface,
                  borderRight: `1.5px solid ${petColor}55`,
                  borderBottom: `1.5px solid ${petColor}55`,
                  transform: 'rotate(45deg)',
                }} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <AnimalPet type={petType} color={petColor} mood="awake" size={140}
                  variant={petVariant} equipped={equipped} />
              </div>
            </>
          );
        })()}
      </div>

      {/* Bottom controls — always pinned, never hidden */}
      <div style={{ flexShrink: 0, padding: '10px 20px 28px' }}>
        <button onClick={goNext} style={{
          width: '100%',
          background: T.teal, color: '#0d1825',
          border: 'none', borderRadius: 16,
          padding: '18px 0',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 17, cursor: 'pointer',
          boxShadow: `0 8px 24px ${T.teal}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {isLast
            ? isDaily ? '🔁 Done for today!' : '🎉 All done!'
            : '✓ Done · Next →'}
        </button>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={goBack} disabled={idx === 0} style={{
            flex: 1,
            background: 'transparent', color: idx === 0 ? T.muted : T.textDim,
            border: `1px solid ${T.border}`, borderRadius: 14,
            padding: '12px 0',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
            cursor: idx === 0 ? 'not-allowed' : 'pointer',
            opacity: idx === 0 ? 0.4 : 1,
          }}>
            ← Back
          </button>
          <button onClick={onCancel} style={{
            flex: 1,
            background: 'transparent', color: T.muted,
            border: `1px solid ${T.border}`, borderRadius: 14,
            padding: '12px 0',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            Pause for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// WALKTHROUGH AUTHORING — sw/parent + teen build the micro-steps together
// ────────────────────────────────────────────────────────────────────────────

function WalkthroughEditor({ step, onChange, onClose }) {
  const [microSteps, setMicroSteps] = useState(step?.walkthrough || []);
  const [scene, setScene]           = useState(step?.scene || null);
  const [editingId, setEditingId]   = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [draftText, setDraftText]   = useState('');
  const [draftEnc,  setDraftEnc]    = useState('');
  const [draftSens, setDraftSens]   = useState('');

  function commitChanges(next) {
    setMicroSteps(next);
    onChange({ walkthrough: next, scene });
  }

  function commitScene(s) {
    setScene(s);
    onChange({ walkthrough: microSteps, scene: s });
  }

  function startAdd() {
    setEditingId(null);
    setDraftText(''); setDraftEnc(''); setDraftSens('');
    setShowAdd(true);
  }

  function startEdit(ms) {
    setEditingId(ms.id);
    setDraftText(ms.text || '');
    setDraftEnc(ms.encouragement || '');
    setDraftSens(ms.sensoryNote || '');
    setShowAdd(true);
  }

  function saveDraft() {
    if (!draftText.trim()) return;
    if (editingId) {
      const next = microSteps.map(m => m.id === editingId
        ? { ...m, text: draftText.trim(), encouragement: draftEnc.trim() || undefined, sensoryNote: draftSens.trim() || undefined }
        : m);
      commitChanges(next);
    } else {
      const newMs = {
        id: 'wt_' + Date.now() + '_' + Math.floor(Math.random() * 999),
        text: draftText.trim(),
        encouragement: draftEnc.trim() || undefined,
        sensoryNote: draftSens.trim() || undefined,
      };
      commitChanges([...microSteps, newMs]);
    }
    setShowAdd(false);
    setEditingId(null);
    setDraftText(''); setDraftEnc(''); setDraftSens('');
  }

  function deleteMs(id) {
    commitChanges(microSteps.filter(m => m.id !== id));
  }

  function moveMs(id, direction) {
    const idx = microSteps.findIndex(m => m.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= microSteps.length) return;
    const next = [...microSteps];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    commitChanges(next);
  }

  return (
    <div style={{
      background: T.card, border: `1.5px solid ${T.purple}66`,
      borderRadius: 14, padding: 14, marginTop: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: 'Syne', fontWeight: 800, color: T.text, marginBottom: 2 }}>
            📋 Walk-me-through
          </div>
          <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.textDim, marginBottom: 12, lineHeight: 1.4 }}>
            Build this together with someone you trust. Break the step into tiny bits the pet can guide you through.
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: T.muted,
          fontSize: 18, padding: '0 4px',
        }}>✕</button>
      </div>

      {/* Scene picker — gives the walkthrough a matching environment */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Pet's environment (optional)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button onClick={() => commitScene(null)} style={{
            background: !scene ? `${T.purple}33` : 'transparent',
            color: !scene ? T.purple : T.textDim,
            border: `1px solid ${!scene ? T.purple : T.border}`,
            borderRadius: 10, padding: '6px 11px',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>None</button>
          {Object.values(WALKTHROUGH_SCENES).map(s => (
            <button key={s.id} onClick={() => commitScene(s.id)} style={{
              background: scene === s.id ? `${T.purple}33` : 'transparent',
              color: scene === s.id ? T.purple : T.textDim,
              border: `1px solid ${scene === s.id ? T.purple : T.border}`,
              borderRadius: 10, padding: '6px 11px',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 12, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span>{s.emoji}</span>{s.label}
            </button>
          ))}
        </div>
        {scene && (
          <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', marginTop: 6 }}>
            The pet's {WALKTHROUGH_SCENES[scene].label.toLowerCase()} will get cleaner as you progress.
          </div>
        )}
      </div>

      {/* Existing micro-steps */}
      {microSteps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {microSteps.map((m, i) => (
            <div key={m.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: '10px 12px', marginBottom: 6,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <div style={{
                background: T.purple + '33', color: T.purple,
                borderRadius: 6, width: 22, height: 22, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontFamily: 'DM Sans', color: T.text, fontWeight: 500, lineHeight: 1.4 }}>
                  {m.text}
                </div>
                {m.encouragement && (
                  <div style={{ fontSize: 11, color: T.teal, fontFamily: 'DM Sans', fontStyle: 'italic', marginTop: 4 }}>
                    💬 "{m.encouragement}"
                  </div>
                )}
                {m.sensoryNote && (
                  <div style={{ fontSize: 11, color: T.amber, fontFamily: 'DM Sans', marginTop: 2 }}>
                    💡 {m.sensoryNote}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => moveMs(m.id, -1)} disabled={i === 0} style={{
                  background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer',
                  color: T.muted, fontSize: 12, padding: 2, opacity: i === 0 ? 0.3 : 1,
                }}>▲</button>
                <button onClick={() => moveMs(m.id, 1)} disabled={i === microSteps.length - 1} style={{
                  background: 'none', border: 'none', cursor: i === microSteps.length - 1 ? 'not-allowed' : 'pointer',
                  color: T.muted, fontSize: 12, padding: 2, opacity: i === microSteps.length - 1 ? 0.3 : 1,
                }}>▼</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => startEdit(m)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: T.textDim, fontSize: 11, padding: 2,
                }}>edit</button>
                <button onClick={() => deleteMs(m.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#FF6B6B', fontSize: 11, padding: 2,
                }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/edit form */}
      {showAdd ? (
        <div style={{
          background: T.surface, border: `1.5px solid ${T.purple}66`,
          borderRadius: 10, padding: 12,
        }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            What to do
          </div>
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="e.g. Put your headphones in"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.card, color: T.text, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '9px 11px', fontFamily: 'DM Sans', fontSize: 13,
              marginBottom: 10,
            }}
          />
          <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            What the pet should say (optional)
          </div>
          <input
            value={draftEnc}
            onChange={(e) => setDraftEnc(e.target.value)}
            placeholder="e.g. You've got this — easy first one"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.card, color: T.text, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '9px 11px', fontFamily: 'DM Sans', fontSize: 13,
              marginBottom: 10,
            }}
          />
          <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Reminder / sensory tip (optional)
          </div>
          <input
            value={draftSens}
            onChange={(e) => setDraftSens(e.target.value)}
            placeholder="e.g. If it's too loud, tap pause"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: T.card, color: T.text, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '9px 11px', fontFamily: 'DM Sans', fontSize: 13,
              marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveDraft} disabled={!draftText.trim()} style={{
              flex: 1,
              background: draftText.trim() ? T.teal : T.border,
              color: draftText.trim() ? '#0d1825' : T.muted,
              border: 'none', borderRadius: 10, padding: '10px 0',
              fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13,
              cursor: draftText.trim() ? 'pointer' : 'not-allowed',
            }}>
              {editingId ? 'Save changes' : '+ Add this bit'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingId(null); }} style={{
              background: 'transparent', color: T.textDim,
              border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={startAdd} style={{
          width: '100%',
          background: 'transparent', color: T.purple,
          border: `1.5px dashed ${T.purple}66`, borderRadius: 10,
          padding: '11px 0', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13,
          cursor: 'pointer',
        }}>
          + Add a {microSteps.length === 0 ? 'first' : 'next'} bit
        </button>
      )}

      {microSteps.length > 0 && (
        <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.textDim, marginTop: 10, textAlign: 'center' }}>
          {microSteps.length} bit{microSteps.length !== 1 ? 's' : ''} — your pet will guide you through them in order
        </div>
      )}
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// HATCH TRICKS — each species does something special right after hatching
// petAnim: CSS animation string for the pet div
// label: text shown below the pet during the trick
// overlay(color): JSX shown on top of the pet (fire, sparkles, etc.)
// ────────────────────────────────────────────────────────────────────────────
const HATCH_TRICKS = {
  dog: {
    label: '🐶 Roll over!',
    petAnim: 'trickRollOver 1.2s ease-in-out 2',
    overlay: (color) => (
      <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 8, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color}55 0%, transparent 70%)`,
        animation: 'trickShadow 0.6s ease-in-out infinite' }} />
    ),
  },
  cat: {
    label: '🐱 Look at that stretch!',
    petAnim: 'trickStretch 1.4s ease-in-out 2',
    overlay: (color) => (
      <>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: -20 - i * 12, right: 20 + i * 14,
            fontSize: 18, opacity: 0,
            animation: `trickSparkle 1.4s ease-out ${i * 0.25}s 2`,
          }}>✦</div>
        ))}
      </>
    ),
  },
  rabbit: {
    label: '🐰 Binky! Happy bunny!',
    petAnim: 'trickBinky 0.7s ease-in-out 3',
    overlay: (color) => (
      <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 6, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color}55 0%, transparent 70%)`,
        animation: 'trickShadow 0.7s ease-in-out infinite' }} />
    ),
  },
  dragon: {
    label: '🐉 FIRE BREATH!',
    petAnim: 'trickFireBreath 0.5s ease-in-out 4',
    overlay: (color) => (
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Fire burst from snout */}
        <g style={{ transformOrigin: '100px 100px', animation: 'trickFireBurst 0.5s ease-out 4' }}>
          <path d="M 115 105 Q 155 90 190 70 Q 170 100 190 120 Q 160 115 140 130 Z" fill="#FF6B20" opacity="0.9" />
          <path d="M 115 105 Q 158 92 195 75 Q 172 100 195 118 Q 162 112 142 128 Z" fill="#FFD040" opacity="0.7" />
          <path d="M 118 104 Q 150 95 178 80 Q 162 100 178 114 Q 155 110 138 122 Z" fill="#fff" opacity="0.5" />
        </g>
        {/* Smoke puffs */}
        <circle cx="170" cy="85" r="8" fill="#888" opacity="0" style={{ animation: 'trickSmoke 0.5s ease-out 0.3s 4' }} />
        <circle cx="185" cy="75" r="5" fill="#888" opacity="0" style={{ animation: 'trickSmoke 0.5s ease-out 0.4s 4' }} />
      </svg>
    ),
  },
  phoenix: {
    label: '🔥 FLAME ERUPTION!',
    petAnim: 'trickFlameErupt 0.8s ease-in-out 3',
    overlay: (color) => (
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Ring of flames */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          const x = 100 + Math.cos(rad) * 75;
          const y = 100 + Math.sin(rad) * 75;
          return (
            <g key={i} style={{ transformOrigin: `${x}px ${y}px`, animation: `trickSparkle 0.8s ease-out ${i * 0.05}s 3` }}>
              <ellipse cx={x} cy={y} rx="4" ry="12" fill="#FF6B20"
                transform={`rotate(${deg} ${x} ${y})`} />
              <ellipse cx={x} cy={y} rx="2" ry="7" fill="#FFD040"
                transform={`rotate(${deg} ${x} ${y})`} />
            </g>
          );
        })}
      </svg>
    ),
  },
  unicorn: {
    label: '🦄 Rainbow trail!',
    petAnim: 'trickPrance 0.8s ease-in-out 3',
    overlay: (color) => (
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Rainbow arc */}
        {['#FF6B9D','#FFB020','#7FE787','#00BFFF','#8B7CF8'].map((c, i) => (
          <path key={i}
            d={`M 10 ${140 - i * 8} Q 100 ${50 - i * 8} 190 ${140 - i * 8}`}
            fill="none" stroke={c} strokeWidth="5" opacity="0"
            style={{ animation: `trickRainbow 0.8s ease-out ${i * 0.1}s 3` }}
          />
        ))}
        {/* Sparkle burst */}
        {[...Array(6)].map((_, i) => (
          <text key={i} x={80 + (i%3)*20} y={60 + Math.floor(i/3)*30}
            fontSize="14" fill={['#FFD700','#FF6B9D','#8B7CF8'][i%3]}
            style={{ animation: `trickSparkle 0.8s ease-out ${i * 0.1}s 3` }}>✦</text>
        ))}
      </svg>
    ),
  },
};

function HatchingOverlay({ petType, petColor, petName, onDone, isFriend = false, isMystery = false, variant = 'cute' }) {
  const [phase, setPhase] = useState(0);
  // 0: fast wobble  1: crack1  2: crack2+glow  3: shatter  4: pet rises  5: meet screen
  // mystery extra: phase 3.5 → ??? suspense text before pet rises (handled as phase 3 delay)

  // Ensure audio unlocks on mount + play wobble sound for opening phase
  useEffect(() => {
    let cancelled = false;
    ensureAudio().then(() => {
      if (cancelled) return;
      sfx.hatchWobble();
    });
    return () => { cancelled = true; };
  }, []);

  // Sound for each phase transition
  useEffect(() => {
    if (phase === 1) sfx.hatchCrack();
    else if (phase === 2) { sfx.hatchCrack(); sfx.hatchGlow(); }
    else if (phase === 3) sfx.hatchShatter();
    else if (phase === 4) sfx.hatchReveal();
  }, [phase]);

  useEffect(() => {
    const delays = isMystery
      ? [1600, 1200, 1000, 1800, 900, 2400, 1400]
      : [1600, 1200, 1000, 900,  900, 2400, 1400];
    if (phase < 6) {
      const t = setTimeout(() => setPhase(p => p + 1), delays[phase]);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const pieces = [
    { d: 'M100,100 L56,54 L38,112Z',  px: '-90px', py: '-70px', pr: '-50deg' },
    { d: 'M100,100 L144,54 L162,112Z', px: '90px',  py: '-75px', pr: '55deg' },
    { d: 'M100,100 L38,112 L48,170Z',  px: '-95px', py: '55px',  pr: '-60deg' },
    { d: 'M100,100 L162,112 L152,170Z',px: '95px',  py: '60px',  pr: '65deg' },
    { d: 'M100,100 L48,170 L100,188Z', px: '-36px', py: '90px',  pr: '-28deg' },
    { d: 'M100,100 L152,170 L100,188Z',px: '36px',  py: '95px',  pr: '30deg' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: '#02040a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Spotlight glow */}
      <div style={{
        position: 'absolute',
        width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${variant === 'dark' ? '#FF1010' : petColor}20 0%, transparent 70%)`,
        filter: 'blur(40px)', pointerEvents: 'none',
        transition: 'opacity 0.5s',
        opacity: phase >= 2 ? 1 : 0.4,
      }} />

      {/* Egg phases */}
      {phase < 3 && (
        <div style={{
          '--glow': petColor,
          animation: phase === 0
            ? 'eggWobble 0.5s ease-in-out infinite'
            : phase === 1
            ? 'hatchWobble 0.32s ease-in-out infinite'
            : 'hatchWobble 0.2s ease-in-out infinite',
          filter: phase === 2 ? `drop-shadow(0 0 22px ${petColor})` : 'none',
        }}>
          <Egg color={petColor} cracks={phase === 0 ? 0 : phase === 1 ? 1 : 3} size={190} />
        </div>
      )}

      {/* Shatter */}
      {phase === 3 && (
        <div style={{ position: 'relative', width: 190, height: 190 }}>
          <svg viewBox="0 0 200 200" width="190" height="190">
            {pieces.map((p, i) => (
              <path key={i} d={p.d}
                fill={isMystery ? '#2a1a3e' : '#e8dcc0'}
                style={{
                  '--px': p.px, '--py': p.py, '--pr': p.pr,
                  animation: 'eggPieceFly 0.75s ease-out forwards',
                  transformOrigin: '100px 100px',
                }} />
            ))}
          </svg>
          {/* Inner glow burst */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `radial-gradient(circle, ${isMystery ? T.purple : petColor}88 0%, transparent 65%)`,
            animation: 'burstFade 0.8s ease-out forwards',
          }} />
          {/* Mystery: ??? suspense text appears after shatter */}
          {isMystery && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'textPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.6s both',
            }}>
              <span style={{
                fontFamily: 'Syne', fontWeight: 800, fontSize: 56,
                background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'petGlow 1.2s ease-in-out infinite',
              }}>???</span>
            </div>
          )}
        </div>
      )}

      {/* Pet emerges */}
      {phase >= 4 && (
        <div style={{
          position: 'relative',
          animation: phase === 4
            ? 'petRise 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards'
            : phase === 5
            ? HATCH_TRICKS[petType]?.petAnim || 'petBob 3s ease-in-out infinite'
            : 'petBob 3s ease-in-out infinite',
        }}>
          <AnimalPet type={petType} color={petColor} mood="happy" size={200} variant={variant} />
          {/* Trick overlay — species-specific effect */}
          {phase === 5 && HATCH_TRICKS[petType] && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {HATCH_TRICKS[petType].overlay(petColor)}
            </div>
          )}
        </div>
      )}

      {/* Trick label */}
      {phase === 5 && HATCH_TRICKS[petType] && (
        <div style={{
          marginTop: 16, color: petColor,
          fontFamily: 'Syne', fontWeight: 800, fontSize: 18,
          animation: 'textPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
          textAlign: 'center',
        }}>
          {HATCH_TRICKS[petType].label}
        </div>
      )}

      {/* Meet message */}
      {phase >= 6 && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 30,
            color: petColor, letterSpacing: '-0.3px', marginBottom: 8,
            animation: 'textPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            {isMystery ? `Your mystery hatched! 🎉` : `Meet ${petName}! 🎉`}
          </div>
          <div style={{
            color: T.textDim, fontSize: 15, fontFamily: 'DM Sans', lineHeight: 1.5,
            maxWidth: 280, marginBottom: 32, padding: '0 20px',
            animation: 'textPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
          }}>
            {isMystery
              ? `It's a ${petType}! Surprise! Take care of them and work on your goals together.`
              : isFriend
              ? `${petName} hatched because you took your first step. They'll grow with this goal.`
              : `Your pet hatched! Take care of them and work on your goals together.`
            }
          </div>
          <button onClick={onDone} style={{
            background: petColor, color: '#0d1825', border: 'none',
            borderRadius: 16, padding: '16px 36px',
            fontFamily: 'Syne', fontWeight: 800, fontSize: 17,
            cursor: 'pointer',
            boxShadow: `0 10px 36px ${petColor}55`,
            animation: 'textPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
          }}>
            Let's go! →
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// NEW GOAL FLOW
// ────────────────────────────────────────────────────────────────────────────
function NewGoalFlow({ user, setUser, onClose, isFirstGoal = false }) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  const [whyAnchor, setWhyAnchor] = useState(null);
  const [why, setWhy] = useState('');
  const [obstacles, setObstacles] = useState([]);
  const [customObstacle, setCustomObstacle] = useState('');
  const [firstStep, setFirstStep] = useState('');
  const [firstStepIsDaily, setFirstStepIsDaily] = useState(false);
  const [friendType, setFriendType] = useState(null);
  const [friendColor, setFriendColor] = useState(null);
  const [friendIsMystery, setFriendIsMystery] = useState(false);
  const [showHatching, setShowHatching] = useState(false);
  const [savedGoalId, setSavedGoalId] = useState(null);

  const obstacleOptions = getPersonalizedObstacles(user);

  function toggleObstacle(id) {
    setObstacles(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id]);
  }

  function selectFriendAnimal(id) {
    if (id === 'mystery') {
      const { type, color } = resolveMystery();
      setFriendType(type);
      setFriendColor(color);
      setFriendIsMystery(true);
    } else {
      setFriendType(id);
      setFriendIsMystery(false);
    }
  }

  async function finish() {
    let finalFriendColor, finalFriendType, finalFriendMystery;
    if (isFirstGoal) {
      finalFriendColor = user.petColor;
      finalFriendType = user.petType;
      finalFriendMystery = false;
    } else {
      const usedColors = (user.goals || []).map(g => g.friendPetColor);
      const availableColors = COLORS.filter(c => !usedColors.includes(c.hex) && c.hex !== user.petColor);
      finalFriendColor = friendColor || (availableColors[0]?.hex) || COLORS[(user.goals || []).length % COLORS.length].hex;
      finalFriendType = friendType || REAL_ANIMALS[Math.floor(Math.random() * REAL_ANIMALS.length)].id;
      finalFriendMystery = friendIsMystery;
    }
    const allObstacles = [
      ...obstacles.map(id => obstacleOptions.find(o => o.id === id)?.label).filter(Boolean),
      ...(customObstacle.trim() ? [customObstacle.trim()] : []),
    ];
    const newGoal = {
      id: 'g_' + Date.now(),
      title: title.trim(),
      category,
      whyAnchor,
      why: why.trim(),
      obstacles: allObstacles,
      steps: [{ id: 's_' + Date.now(), text: firstStep.trim(), done: false, daily: firstStepIsDaily || undefined }],
      completed: false,
      createdAt: Date.now(),
      friendPetType: finalFriendType,
      friendPetColor: finalFriendColor,
      friendHatched: false,
      friendPetMystery: finalFriendMystery,
      isFirstGoal,
    };
    const updated = { ...user, goals: [...(user.goals || []), newGoal] };
    setUser(updated);
    await storageSet('user:' + user.username, updated);

    if (isFirstGoal) {
      // Show hatching animation — teen watches their pet hatch
      setSavedGoalId(newGoal.id);
      setShowHatching(true);
    } else {
      onClose(newGoal.id);
    }
  }

  async function handleHatchingDone() {
    // Mark pet as hatched, award the hatch bonus tickets
    const hatchedUpdate = { ...user, hatched: true, tickets: (user.tickets || 0) + 2 };
    setUser(hatchedUpdate);
    await storageSet('user:' + user.username, hatchedUpdate);
    onClose(savedGoalId);
  }

  // Show hatching overlay for first goal
  if (showHatching) {
    return (
      <HatchingOverlay
        petType={user.petType}
        petColor={user.petColor}
        petName={user.petName}
        isMystery={user.petMystery}
        variant={user.petVariant || 'cute'}
        onDone={handleHatchingDone}
      />
    );
  }

  const steps = [
    {
      title: 'What do you want to do?',
      sub: 'Make it concrete — something someone could see you doing.',
      example: 'e.g. "Walk into the cafe and order a coffee"',
      content: <textarea value={title} onChange={e => setTitle(e.target.value)} placeholder="My goal is..." rows={3} style={{ ...inputStyle, resize: 'none' }} />,
      canNext: title.trim().length > 2,
    },
    {
      title: 'What kind of goal is this?',
      sub: 'Helps Hatch suggest the right scenarios and skills later. Optional — pick one or skip.',
      example: '',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {GOAL_CATEGORIES.map(c => {
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(active ? null : c.id)} style={{
                background: active ? `${T.teal}1f` : T.surface,
                border: active ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
                borderRadius: 12, padding: '12px 10px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'all 0.15s', minHeight: 78,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{c.emoji}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans',
                    color: active ? T.teal : T.text,
                  }}>
                    {c.label}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontFamily: 'DM Sans', color: T.muted,
                  lineHeight: 1.3,
                }}>
                  {c.sub}
                </span>
              </button>
            );
          })}
        </div>
      ),
      canNext: true,
    },
    {
      title: 'Why does it matter?',
      sub: 'Tap whatever fits. You can add more in your own words if you want — or just pick one and move on.',
      example: '',
      content: (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {WHY_ANCHORS.map(a => {
              const active = whyAnchor === a.id;
              return (
                <button key={a.id} onClick={() => setWhyAnchor(a.id)} style={{
                  background: active ? `${T.teal}1f` : T.surface,
                  border: active ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
                  borderRadius: 12, padding: '14px 14px',
                  color: active ? T.teal : T.textDim,
                  fontSize: 14, fontWeight: 500, fontFamily: 'DM Sans',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 20 }}>{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
          {whyAnchor && (
            <textarea
              value={why}
              onChange={e => setWhy(e.target.value)}
              placeholder={whyAnchor === 'free_text' ? 'Tell me more...' : 'Want to add more? (optional)'}
              rows={3}
              style={{ ...inputStyle, resize: 'none', marginBottom: 0 }}
            />
          )}
        </div>
      ),
      canNext: whyAnchor !== null && (whyAnchor !== 'free_text' || why.trim().length > 2),
    },
    {
      title: 'What might get in the way?',
      sub: user?.sensoryProfile
        ? "Based on what you told Hatch about yourself — tap any that apply for this goal."
        : 'Knowing this ahead of time means you can plan around it.',
      example: '',
      content: (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            {obstacleOptions.map(o => {
              const active = obstacles.includes(o.id);
              return (
                <button key={o.id} onClick={() => toggleObstacle(o.id)} style={{
                  background: active ? `${T.amber}22` : T.surface,
                  border: active ? `1.5px solid ${T.amber}` : `1px solid ${T.border}`,
                  borderRadius: 12, padding: '12px 10px',
                  color: active ? T.amber : T.textDim,
                  fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 16 }}>{o.emoji}</span>
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
          <input value={customObstacle} onChange={e => setCustomObstacle(e.target.value)} placeholder="Something else? Add it here..." style={inputStyle} />
        </div>
      ),
      canNext: obstacles.length > 0 || customObstacle.trim().length > 0,
    },
    {
      title: 'Your first tiny step',
      sub: 'Small enough you could do it today. Big steps come later.',
      example: 'e.g. "Walk past the cafe once" or "Look up the menu online"',
      content: (
        <div>
          <textarea value={firstStep} onChange={e => setFirstStep(e.target.value)} placeholder="My first tiny step is..." rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 14 }} />
          {/* Daily or once-off */}
          <div style={{ fontSize: 12, fontFamily: 'DM Sans', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Is this step something you'll do regularly?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setFirstStepIsDaily(false)} style={{
              background: !firstStepIsDaily ? `${T.purple}22` : T.surface,
              border: `2px solid ${!firstStepIsDaily ? T.purple : T.border}`,
              borderRadius: 14, padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: !firstStepIsDaily ? T.purple : T.textDim, marginBottom: 2 }}>
                ⭐ Just this once
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: T.textDim }}>
                A one-time thing — completing it permanently checks this step off.
              </div>
            </button>
            <button onClick={() => setFirstStepIsDaily(true)} style={{
              background: firstStepIsDaily ? `${T.teal}1a` : T.surface,
              border: `2px solid ${firstStepIsDaily ? T.teal : T.border}`,
              borderRadius: 14, padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: firstStepIsDaily ? T.teal : T.textDim, marginBottom: 2 }}>
                🔁 Every day
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: T.textDim }}>
                A daily habit — you'll check it off each day and build a streak.
              </div>
            </button>
          </div>
        </div>
      ),
      canNext: firstStep.trim().length > 2,
    },
    {
      title: 'Pick a friend pet',
      sub: 'A new egg appears with this goal — it hatches when you finish your first step.',
      example: '',
      isFriendPetStep: true,
      content: (
        <div>
          <div style={lblStyle}>Friend animal</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {ANIMALS.map(a => {
              const isMys = a.id === 'mystery';
              const pickerVal = friendIsMystery ? 'mystery' : friendType;
              const active = pickerVal === a.id;
              return (
                <button key={a.id} onClick={() => selectFriendAnimal(a.id)} style={{
                  aspectRatio: '1', borderRadius: 12,
                  background: active ? (isMys ? `${T.purple}22` : `${T.teal}15`) : T.surface,
                  border: active ? `2px solid ${isMys ? T.purple : T.teal}` : (isMys ? `1px dashed ${T.purple}55` : `1px solid ${T.border}`),
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600,
                  color: active ? (isMys ? T.purple : T.teal) : T.textDim,
                  fontFamily: 'DM Sans', padding: 4,
                }}>
                  <span style={{ fontSize: 24 }}>{a.emoji}</span>
                  {a.name}
                </button>
              );
            })}
          </div>
          {!friendIsMystery && (
            <>
              <div style={lblStyle}>Friend colour</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c.hex} onClick={() => setFriendColor(c.hex)} style={{
                    aspectRatio: '1', borderRadius: 12,
                    background: friendColor === c.hex ? `${c.hex}22` : T.surface,
                    border: friendColor === c.hex ? `2px solid ${c.hex}` : `1px solid ${T.border}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 2, padding: 4,
                    fontSize: 10, fontWeight: 600, color: T.textDim, fontFamily: 'DM Sans',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.hex, boxShadow: `0 0 10px ${c.hex}66` }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {friendIsMystery && (
            <div style={{
              background: `${T.purple}11`, border: `1px dashed ${T.purple}55`,
              borderRadius: 12, padding: '10px 14px', marginTop: 4,
              color: T.muted, fontSize: 13, fontFamily: 'DM Sans', textAlign: 'center',
            }}>
              ✨ Colour and animal will be revealed when they hatch!
            </div>
          )}
        </div>
      ),
      canNext: (friendIsMystery) || (friendType && friendColor),
    },
    {
      title: isFirstGoal ? `Almost there, ${user.petName}!` : 'All set',
      sub: isFirstGoal ? `Finish your first step and ${user.petName} will hatch.` : '',
      example: '',
      content: (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <Egg
              color={isFirstGoal ? user.petColor : (friendColor || T.teal)}
              size={100}
              mystery={!isFirstGoal && friendIsMystery}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={lblStyle}>Goal</div>
            <div style={valStyle}>{title}</div>
          </div>
          {category && (
            <div style={{ marginBottom: 14 }}>
              <div style={lblStyle}>Type</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 18 }}>{GOAL_CATEGORIES.find(c => c.id === category)?.emoji}</span>
                <span style={{ ...valStyle, color: T.teal }}>{GOAL_CATEGORIES.find(c => c.id === category)?.label}</span>
              </div>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={lblStyle}>Why</div>
            {whyAnchor && whyAnchor !== 'free_text' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: why.trim() ? 6 : 0 }}>
                <span style={{ fontSize: 18 }}>{WHY_ANCHORS.find(a => a.id === whyAnchor)?.emoji}</span>
                <span style={{ ...valStyle, color: T.teal }}>{WHY_ANCHORS.find(a => a.id === whyAnchor)?.label}</span>
              </div>
            )}
            {why.trim() && <div style={valStyle}>{why}</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={lblStyle}>Watch out for</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {[...obstacles.map(id => obstacleOptions.find(o => o.id === id)?.label).filter(Boolean), ...(customObstacle.trim() ? [customObstacle.trim()] : [])].map((o, i) => (
                <span key={i} style={{ background: `${T.amber}22`, color: T.amber, fontSize: 12, padding: '4px 10px', borderRadius: 12, fontFamily: 'DM Sans' }}>{o}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={lblStyle}>First tiny step</div>
            <div style={valStyle}>{firstStep}</div>
          </div>
        </div>
      ),
      canNext: true,
    },
  ].filter(s => !(isFirstGoal && s.isFriendPetStep));

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.bg, zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => step === 0 ? (isFirstGoal ? null : onClose()) : setStep(step - 1)} style={iconBtn} disabled={isFirstGoal && step === 0}>
          <ChevronLeft size={22} color={isFirstGoal && step === 0 ? T.subtle : T.text} />
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: 20, height: 4, borderRadius: 2,
              background: i <= step ? T.teal : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        {isFirstGoal ? (
          <div style={{ width: 34 }} />
        ) : (
          <button onClick={() => onClose()} style={iconBtn}>
            <X size={22} color={T.muted} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: '-0.3px', marginBottom: 8 }}>{cur.title}</h2>
        {cur.sub && <p style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', marginBottom: 6, lineHeight: 1.5 }}>{cur.sub}</p>}
        {cur.example && <p style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans', marginBottom: 20, fontStyle: 'italic' }}>{cur.example}</p>}
        {(!cur.example) && <div style={{ marginBottom: 20 }} />}
        {cur.content}
      </div>
      <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
        <button onClick={isLast ? finish : () => cur.canNext && setStep(step + 1)} disabled={!cur.canNext}
          style={{ ...primaryBtn, opacity: cur.canNext ? 1 : 0.4, cursor: cur.canNext ? 'pointer' : 'not-allowed' }}>
          {isLast ? 'Lock it in' : 'Next'}
        </button>
      </div>
    </div>
  );
}

const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
};
const lblStyle = {
  fontSize: 11, fontFamily: 'DM Sans', color: T.muted,
  textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4,
};
const valStyle = { fontSize: 15, fontFamily: 'DM Sans', color: T.text, lineHeight: 1.4 };

// ────────────────────────────────────────────────────────────────────────────
// GOAL DETAIL
// ────────────────────────────────────────────────────────────────────────────
function GoalDetailScreen({ user, setUser, goalId, onClose }) {
  const goal = (user.goals || []).find(g => g.id === goalId);
  const [newStep, setNewStep] = useState('');
  const [newStepIsDaily, setNewStepIsDaily] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [ticketAward, setTicketAward] = useState(null);
  const [editingStepId, setEditingStepId] = useState(null);
  const [editFields, setEditFields] = useState({ when: '', where: '', who: '', howLong: '' });
  const [hatchOverlay, setHatchOverlay] = useState(null); // { petType, petColor, petName, isFriend, pendingTickets }
  const [coPilotStep, setCoPilotStep] = useState(null); // step object when in co-pilot mode
  const [coPilotMode, setCoPilotMode] = useState('support'); // 'support' (just be with me) | 'walkthrough'
  const [editingWalkthroughId, setEditingWalkthroughId] = useState(null); // step id being authored

  async function saveStepWalkthrough(stepId, payload) {
    // payload is either an array (legacy) or { walkthrough, scene }
    const wt = Array.isArray(payload) ? payload : (payload.walkthrough || []);
    const sceneKey = Array.isArray(payload) ? undefined : payload.scene;
    const updatedSteps = goal.steps.map(s => s.id === stepId
      ? { ...s, walkthrough: wt.length ? wt : undefined, scene: sceneKey || undefined }
      : s
    );
    const updatedGoal = { ...goal, steps: updatedSteps };
    const updated = { ...user, goals: user.goals.map(g => g.id === goalId ? updatedGoal : g) };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
  }

  if (!goal) return null;

  // Co-pilot mode — fullscreen pet sits with you while you do the task
  if (coPilotStep) {
    const liveStep = goal.steps.find(s => s.id === coPilotStep.id) || coPilotStep;
    const handleComplete = () => {
      const stepId = coPilotStep.id;
      setCoPilotStep(null);
      // Auto-check the step after the celebration closes
      toggleStep(stepId);
    };
    if (coPilotMode === 'walkthrough') {
      return (
        <CoPilotWalkthrough
          user={user}
          goal={goal}
          step={liveStep}
          onCancel={() => setCoPilotStep(null)}
          onComplete={handleComplete}
        />
      );
    }
    return (
      <CoPilotMode
        user={user}
        goal={goal}
        step={liveStep}
        onCancel={() => setCoPilotStep(null)}
        onComplete={handleComplete}
      />
    );
  }

  // Show hatching animation when a pet (main or friend) hatches from a completed step
  if (hatchOverlay) {
    return (
      <HatchingOverlay
        petType={hatchOverlay.petType}
        petColor={hatchOverlay.petColor}
        petName={hatchOverlay.petName}
        isFriend={hatchOverlay.isFriend}
        isMystery={hatchOverlay.isMystery}
        variant={hatchOverlay.variant || 'cute'}
        onDone={() => {
          const pending = hatchOverlay.pendingTickets;
          setHatchOverlay(null);
          if (pending > 0) {
            setTicketAward(hatchOverlay.isFriend ? pending : 'hatch');
            setTimeout(() => setTicketAward(null), 3500);
          }
        }}
      />
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  function getStreak(dailyLog) {
    if (!dailyLog || dailyLog.length === 0) return 0;
    const sorted = [...dailyLog].sort().reverse();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (sorted.includes(ds)) streak++;
      else if (streak > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function startEditingStep(s) {
    setEditFields({
      when: s.when || '',
      where: s.where || '',
      who: s.who || '',
      howLong: s.howLong || '',
    });
    setEditingStepId(s.id);
  }

  async function saveStepDetails() {
    const updatedSteps = goal.steps.map(s => s.id === editingStepId
      ? { ...s, when: editFields.when.trim(), where: editFields.where.trim(), who: editFields.who.trim(), howLong: editFields.howLong.trim() }
      : s
    );
    const updatedGoal = { ...goal, steps: updatedSteps };
    const updated = { ...user, goals: user.goals.map(g => g.id === goalId ? updatedGoal : g) };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    setEditingStepId(null);
  }

  async function toggleStep(stepId) {
    const stepObj = goal.steps.find(s => s.id === stepId);
    if (!stepObj) return;

    // ── DAILY check-in ──
    if (stepObj.daily) {
      const log = stepObj.dailyLog || [];
      const alreadyToday = log.includes(todayStr);
      const newLog = alreadyToday ? log.filter(d => d !== todayStr) : [...log, todayStr];
      const updatedSteps = goal.steps.map(s => s.id === stepId ? { ...s, dailyLog: newLog } : s);
      const updatedGoal = { ...goal, steps: updatedSteps };
      const ticketsToAdd = alreadyToday ? 0 : STEP_TICKETS;

      // Surprise reward roll (only on check-in, not un-check)
      const surprise = (!alreadyToday && ticketsToAdd > 0) ? rollSurprise(user.petName) : null;
      const bonusTickets = surprise ? surprise.extra : 0;

      const updated = {
        ...user,
        goals: user.goals.map(g => g.id === goalId ? updatedGoal : g),
        tickets: (user.tickets || 0) + ticketsToAdd + bonusTickets,
        xp: (user.xp || 0) + (alreadyToday ? 0 : STEP_XP),
        ...(!alreadyToday ? { lastStepCompletedAt: Date.now() } : {}),
      };
      setUser(updated);
      await storageSet('user:' + user.username, updated);
      if (!alreadyToday && ticketsToAdd > 0) {
        setTicketAward(surprise ? { type: surprise.type, msg: surprise.msg, total: ticketsToAdd + bonusTickets } : ticketsToAdd);
        setTimeout(() => setTicketAward(null), 2800);
      }
      return;
    }

    // ── MILESTONE step ──
    const isCurrentlyDone = stepObj?.done;
    const updatedSteps = goal.steps.map(s => s.id === stepId ? { ...s, done: !s.done, completedAt: !s.done ? Date.now() : null } : s);
    const milestoneSteps = updatedSteps.filter(s => !s.daily);
    const allMilestonesDone = milestoneSteps.length > 0 && milestoneSteps.every(s => s.done);
    const wasNotComplete = !goal.completed;
    const willBeComplete = allMilestonesDone && wasNotComplete && !isCurrentlyDone;

    let ticketsToAdd = 0;
    if (!isCurrentlyDone) ticketsToAdd += STEP_TICKETS;
    if (willBeComplete) ticketsToAdd += GOAL_COMPLETE_BONUS_TICKETS;

    // Surprise reward roll (only on completing a step, not uncompleting)
    const surprise = !isCurrentlyDone ? rollSurprise(user.petName) : null;
    const bonusTickets = surprise ? surprise.extra : 0;

    const updatedGoal = {
      ...goal,
      steps: updatedSteps,
      friendHatched: goal.friendHatched || (!isCurrentlyDone),
      completed: willBeComplete ? true : goal.completed,
      completedAt: willBeComplete ? Date.now() : goal.completedAt,
    };

    let updated = {
      ...user,
      goals: user.goals.map(g => g.id === goalId ? updatedGoal : g),
      tickets: (user.tickets || 0) + ticketsToAdd + bonusTickets,
      xp: (user.xp || 0) + (isCurrentlyDone ? 0 : STEP_XP) + (willBeComplete ? GOAL_COMPLETE_XP : 0),
      ...(!isCurrentlyDone ? { lastStepCompletedAt: Date.now() } : {}),
    };

    const isFirstHatch = !user.hatched && !isCurrentlyDone;
    if (isFirstHatch) {
      updated.hatched = true;
      updated.tickets = (updated.tickets || 0) + 2;
    }

    if (!goal.friendHatched && !isCurrentlyDone && !goal.isFirstGoal) {
      updated.friendPets = [...(user.friendPets || []), {
        id: 'fp_' + Date.now(),
        type: goal.friendPetType,
        color: goal.friendPetColor,
        goalId: goal.id,
        goalTitle: goal.title,
        hatchedAt: Date.now(),
      }];
    }

    setUser(updated);
    await storageSet('user:' + user.username, updated);

    if (isFirstHatch) {
      // Show full hatching animation — ticket toast fires after overlay closes
      setHatchOverlay({
        petType: user.petType,
        petColor: user.petColor,
        petName: user.petName,
        isFriend: false,
        isMystery: !!user.petMystery,
        variant: user.petVariant || 'cute',
        pendingTickets: ticketsToAdd + bonusTickets + 2,
      });
    } else if (!goal.friendHatched && !isCurrentlyDone && !goal.isFirstGoal) {
      const animalName = goal.friendPetType
        ? goal.friendPetType.charAt(0).toUpperCase() + goal.friendPetType.slice(1)
        : 'Friend';
      setHatchOverlay({
        petType: goal.friendPetType,
        petColor: goal.friendPetColor,
        petName: `your new ${animalName}`,
        isFriend: true,
        isMystery: !!goal.friendPetMystery,
        variant: user.petVariant || 'cute',
        pendingTickets: ticketsToAdd + bonusTickets,
      });
    } else if (ticketsToAdd > 0 || bonusTickets > 0) {
      setTicketAward(surprise
        ? { type: surprise.type, msg: surprise.msg, total: ticketsToAdd + bonusTickets }
        : ticketsToAdd
      );
      setTimeout(() => setTicketAward(null), 2800);
    }
  }

  async function addStep() {
    if (!newStep.trim()) return;
    const newStepObj = newStepIsDaily
      ? { id: 's_' + Date.now(), text: newStep.trim(), daily: true, dailyLog: [] }
      : { id: 's_' + Date.now(), text: newStep.trim(), done: false };
    const updatedGoal = { ...goal, steps: [...goal.steps, newStepObj] };
    const updated = { ...user, goals: user.goals.map(g => g.id === goalId ? updatedGoal : g) };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    setNewStep('');
    setNewStepIsDaily(false);
    setShowAddStep(false);
  }

  async function deleteStep(stepId, e) {
    e.stopPropagation();
    const stepObj = goal.steps.find(s => s.id === stepId);
    if (!stepObj) return;
    if (goal.steps.length <= 1) {
      alert("A goal needs at least one step. Add another first, then you can remove this one.");
      return;
    }
    if (!confirm(`Remove "${stepObj.text}"?`)) return;
    const updatedGoal = { ...goal, steps: goal.steps.filter(s => s.id !== stepId) };
    const updated = { ...user, goals: user.goals.map(g => g.id === goalId ? updatedGoal : g) };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
  }

  async function deleteGoal() {
    if (!confirm(`Delete goal "${goal.title}"? The friend pet will stay in your gallery.`)) return;
    const updated = { ...user, goals: user.goals.filter(g => g.id !== goalId) };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    onClose();
  }

  const milestoneSteps = goal.steps.filter(s => !s.daily);
  const dailySteps = goal.steps.filter(s => s.daily);
  const doneCount = milestoneSteps.filter(s => s.done).length;
  const pct = milestoneSteps.length ? (doneCount / milestoneSteps.length) * 100 : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.bg, zIndex: 50, overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: T.bg, zIndex: 1 }}>
        <button onClick={onClose} style={iconBtn}>
          <ChevronLeft size={22} color={T.text} />
        </button>
        <button onClick={deleteGoal} style={iconBtn}>
          <Trash2 size={18} color={T.muted} />
        </button>
      </div>

      {ticketAward && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: ticketAward === 'hatch'
            ? `linear-gradient(135deg, ${user.petColor}, ${T.amber})`
            : ticketAward?.type === 'rare'
            ? `linear-gradient(135deg, ${T.purple}, ${T.pink})`
            : ticketAward?.type === 'bonus'
            ? `linear-gradient(135deg, ${T.amber}, ${T.teal})`
            : `linear-gradient(135deg, ${T.teal}, ${T.blue})`,
          color: '#0d1825', padding: '12px 20px', borderRadius: 14,
          fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: ticketAward === 'hatch'
            ? `0 12px 32px ${user.petColor}66`
            : ticketAward?.type === 'rare'
            ? `0 12px 32px ${T.purple}66`
            : `0 12px 32px ${T.teal}44`,
          animation: 'ticketPop 0.5s ease-out',
          zIndex: 100,
          maxWidth: '90vw', textAlign: 'center',
        }}>
          {ticketAward === 'hatch' ? (
            <>✨ {user.petName} hatched! +2 tickets ✨</>
          ) : ticketAward?.type === 'rare' ? (
            <>{ticketAward.msg} · +{ticketAward.total} tickets</>
          ) : ticketAward?.type === 'bonus' ? (
            <>{ticketAward.msg} · +{ticketAward.total} tickets</>
          ) : (
            <>
              <Ticket size={20} strokeWidth={2.5} />
              +{ticketAward} ticket{ticketAward > 1 ? 's' : ''} earned!
            </>
          )}
        </div>
      )}

      <div style={{ padding: 24 }}>
        <div style={{
          background: `radial-gradient(circle at center, ${goal.friendPetColor}15 0%, transparent 70%), ${T.surface}`,
          border: `1px solid ${T.border}`,
          borderRadius: 24, padding: '24px 16px',
          textAlign: 'center', marginBottom: 24,
        }}>
          {goal.friendHatched ? (
            <AnimalPet type={goal.friendPetType} color={goal.friendPetColor} mood={goal.completed ? 'happy' : 'awake'} size={120} />
          ) : (
            <Egg color={goal.friendPetColor} size={120} mystery={!!goal.friendPetMystery} />
          )}
          <div style={{ marginTop: 12 }}>
            <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'DM Sans', fontWeight: 600 }}>
              {goal.friendHatched
                ? (goal.isFirstGoal
                    ? `${user.petName} — your main pet`
                    : `Friend ${ANIMALS.find(a => a.id === goal.friendPetType)?.name.toLowerCase()}`)
                : (goal.isFirstGoal
                    ? `${user.petName}'s egg — hatches on step 1`
                    : 'Hatching when you do step 1')}
            </div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: T.text, lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.3px' }}>
          {goal.title}
        </h1>
        {goal.category && (() => {
          const cat = GOAL_CATEGORIES.find(c => c.id === goal.category);
          return cat ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${T.teal}1a`, border: `1px solid ${T.teal}55`,
              borderRadius: 20, padding: '4px 10px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 13 }}>{cat.emoji}</span>
              <span style={{ color: T.teal, fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans' }}>{cat.label}</span>
            </div>
          ) : null;
        })()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${goal.friendPetColor}, ${goal.friendPetColor}cc)`, transition: 'width 0.6s' }} />
          </div>
          <span style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans' }}>{doneCount}/{milestoneSteps.length}</span>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={lblStyle}>Why this matters</div>
          {goal.whyAnchor && goal.whyAnchor !== 'free_text' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: goal.why ? 6 : 0 }}>
              <span style={{ fontSize: 18 }}>{WHY_ANCHORS.find(a => a.id === goal.whyAnchor)?.emoji}</span>
              <span style={{ ...valStyle, color: T.teal }}>{WHY_ANCHORS.find(a => a.id === goal.whyAnchor)?.label}</span>
            </div>
          )}
          {goal.why && <div style={valStyle}>{goal.why}</div>}
        </div>

        {goal.obstacles?.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={lblStyle}>Watch out for</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {goal.obstacles.map((o, i) => (
                <span key={i} style={{ background: `${T.amber}22`, color: T.amber, fontSize: 12, padding: '5px 10px', borderRadius: 12, fontFamily: 'DM Sans' }}>{o}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={sectionTitle}>Milestones · 1 ticket each</h3>
            {!goal.completed && (
              <button onClick={() => setShowAddStep(true)} style={{ background: 'none', border: 'none', color: T.teal, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={14} /> Add
              </button>
            )}
          </div>

          {/* Milestone steps */}
          {(() => {
            const nextIdx = milestoneSteps.findIndex(s => !s.done);
            return milestoneSteps.map((s, i) => {
              const isNextUp = i === nextIdx;
              const isLater = !s.done && !isNextUp;
              const showHatchBadge = isNextUp && !goal.friendHatched;
              const showNextUpBadge = isNextUp && goal.friendHatched;
              const hasFields = PREDICTABILITY_FIELDS.some(f => s[f.key]);
              const isEditing = editingStepId === s.id;
              return (
                <div key={s.id} style={{ position: 'relative', marginBottom: 8 }}>
                  <button onClick={() => toggleStep(s.id)} style={{
                    width: '100%',
                    background: s.done ? `${T.teal}11` : isNextUp ? `${T.teal}1a` : T.surface,
                    border: s.done ? `1px solid ${T.teal}66` : isNextUp ? `1.5px solid ${T.teal}` : `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: isNextUp ? '16px 14px' : 14,
                    boxShadow: isNextUp ? `0 4px 18px ${T.teal}22` : 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans', transition: 'all 0.2s',
                    opacity: isLater ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: s.done ? T.teal : 'transparent',
                      border: s.done ? 'none' : `2px solid ${isNextUp ? T.teal : T.borderStrong}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {s.done && <Check size={14} color="#0d1825" strokeWidth={3} />}
                    </div>
                    <div style={{
                      flex: 1, minWidth: 0,
                      fontSize: isNextUp ? 15 : 14,
                      fontWeight: isNextUp ? 600 : 400,
                      color: s.done ? T.muted : isNextUp ? T.text : T.textDim,
                      textDecoration: s.done ? 'line-through' : 'none',
                      paddingRight: !s.done ? 28 : 0,
                    }}>
                      {s.text}
                    </div>
                    {showHatchBadge && (
                      <span style={{ fontSize: 9, color: T.amber, background: `${T.amber}22`, padding: '3px 8px', borderRadius: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                        Hatches pet
                      </span>
                    )}
                    {showNextUpBadge && (
                      <span style={{ fontSize: 9, color: T.teal, background: `${T.teal}22`, padding: '3px 8px', borderRadius: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                        Next up
                      </span>
                    )}
                  </button>
                  {!s.done && milestoneSteps.length > 1 && (
                    <button onClick={(e) => deleteStep(s.id, e)} style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.4, transition: 'opacity 0.15s',
                    }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
                      <X size={14} color={T.muted} />
                    </button>
                  )}
                  {hasFields && !isEditing && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 14px 0 50px' }}>
                      {PREDICTABILITY_FIELDS.map(f => s[f.key] ? (
                        <span key={f.key} style={{
                          background: `${T.blue}1a`, color: T.blue,
                          fontSize: 11, padding: '4px 9px', borderRadius: 10,
                          fontFamily: 'DM Sans', fontWeight: 500,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ fontSize: 12 }}>{f.emoji}</span>{s[f.key]}
                        </span>
                      ) : null)}
                    </div>
                  )}
                  {!s.done && !isEditing && (
                    <div style={{ paddingLeft: 50, paddingTop: 6, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <button onClick={() => startEditingStep(s)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: T.muted, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 500,
                        padding: '4px 0', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <Edit3 size={11} />
                        {hasFields ? 'Edit details' : 'Add details'}
                      </button>
                      {!(s.walkthrough && s.walkthrough.length) && (
                        <button onClick={() => { startEditingStep(s); setEditingWalkthroughId(s.id); }} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: T.purple, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600,
                          padding: '4px 0', display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          📋 Set up walk-me-through
                        </button>
                      )}
                      {isNextUp && user.hatched && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={(e) => { e.stopPropagation(); setCoPilotMode('support'); setCoPilotStep(s); }} style={{
                            background: `${T.teal}1a`, border: `1px solid ${T.teal}66`,
                            borderRadius: 10, cursor: 'pointer',
                            color: T.teal, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 700,
                            padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 5,
                          }}>
                            <Heart size={11} fill={T.teal} /> Just be with me
                          </button>
                          {s.walkthrough && s.walkthrough.length > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); setCoPilotMode('walkthrough'); setCoPilotStep(s); }} style={{
                              background: `${T.purple}1a`, border: `1px solid ${T.purple}66`,
                              borderRadius: 10, cursor: 'pointer',
                              color: T.purple, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 700,
                              padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}>
                              📋 Walk me through it
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <div style={{ background: T.card, border: `1px solid ${T.teal}66`, borderRadius: 14, padding: 14, marginTop: 8 }}>
                      {PREDICTABILITY_FIELDS.map(f => (
                        <div key={f.key} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontFamily: 'DM Sans', color: T.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13 }}>{f.emoji}</span>{f.label}
                          </div>
                          <input
                            value={editFields[f.key]}
                            onChange={e => setEditFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            style={{ width: '100%', padding: '10px 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={() => setEditingStepId(null)} style={{ flex: 1, padding: 10, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10, color: T.muted, fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={saveStepDetails} style={{ flex: 1, padding: 10, background: T.teal, border: 'none', borderRadius: 10, color: '#0d1825', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans', cursor: 'pointer' }}>Save</button>
                      </div>
                      {editingWalkthroughId === s.id ? (
                        <WalkthroughEditor
                          step={s}
                          onChange={(wt) => saveStepWalkthrough(s.id, wt)}
                          onClose={() => setEditingWalkthroughId(null)}
                        />
                      ) : (
                        <button onClick={() => setEditingWalkthroughId(s.id)} style={{
                          width: '100%', marginTop: 12,
                          background: (s.walkthrough && s.walkthrough.length) ? `${T.purple}1a` : 'transparent',
                          color: T.purple,
                          border: `1.5px ${(s.walkthrough && s.walkthrough.length) ? 'solid' : 'dashed'} ${T.purple}66`,
                          borderRadius: 10, padding: '10px 0',
                          fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          📋 {(s.walkthrough && s.walkthrough.length)
                            ? `Edit walk-me-through (${s.walkthrough.length} bit${s.walkthrough.length !== 1 ? 's' : ''})`
                            : 'Set up a walk-me-through'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Add step form */}
          {showAddStep && (
            <div style={{ background: T.card, border: `1px solid ${T.teal}66`, borderRadius: 14, padding: 12, marginTop: 8 }}>
              <input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="New step..." autoFocus style={{ ...inputStyle, marginBottom: 12 }} />
              {/* Daily or once-off */}
              <div style={{ fontSize: 11, fontFamily: 'DM Sans', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Is this something you'll do regularly?
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setNewStepIsDaily(false)} style={{
                  flex: 1, background: !newStepIsDaily ? `${T.purple}22` : T.surface,
                  border: `2px solid ${!newStepIsDaily ? T.purple : T.border}`,
                  borderRadius: 12, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: !newStepIsDaily ? T.purple : T.textDim }}>
                    ⭐ Once-off
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: T.textDim, marginTop: 2 }}>Checks off permanently</div>
                </button>
                <button onClick={() => setNewStepIsDaily(true)} style={{
                  flex: 1, background: newStepIsDaily ? `${T.teal}1a` : T.surface,
                  border: `2px solid ${newStepIsDaily ? T.teal : T.border}`,
                  borderRadius: 12, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: newStepIsDaily ? T.teal : T.textDim }}>
                    🔁 Daily habit
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: T.textDim, marginTop: 2 }}>Tick off each day</div>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowAddStep(false); setNewStep(''); setNewStepIsDaily(false); }} style={{ flex: 1, padding: 10, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10, color: T.muted, fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans', cursor: 'pointer' }}>Cancel</button>
                <button onClick={addStep} style={{ flex: 1, padding: 10, background: T.teal, border: 'none', borderRadius: 10, color: '#0d1825', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans', cursor: 'pointer' }}>Add</button>
              </div>
            </div>
          )}
        </div>

        {/* ── DAILY PRACTICE section ── */}
        {dailySteps.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={sectionTitle}>Daily Practice · 1 ticket/day</h3>
            </div>
            {dailySteps.map(s => {
              const log = s.dailyLog || [];
              const doneToday = log.includes(todayStr);
              const streak = getStreak(log);
              const totalDays = log.length;
              return (
                <div key={s.id} style={{ position: 'relative', marginBottom: 10 }}>
                  <div style={{
                    background: doneToday ? `${T.amber}15` : T.surface,
                    border: `1px solid ${doneToday ? T.amber + '66' : T.border}`,
                    borderRadius: 14, padding: '14px 14px 10px',
                  }}>
                    {/* Step text + delete */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text, fontFamily: 'DM Sans', lineHeight: 1.3, paddingRight: 8 }}>
                        🔁 {s.text}
                      </div>
                      <button onClick={(e) => deleteStep(s.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.35 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.35}>
                        <X size={14} color={T.muted} />
                      </button>
                    </div>
                    {/* Streak & total */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      {streak > 0 && (
                        <span style={{ background: `${T.amber}22`, color: T.amber, fontSize: 11, padding: '3px 9px', borderRadius: 10, fontFamily: 'DM Sans', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          🔥 {streak} day streak
                        </span>
                      )}
                      {totalDays > 0 && (
                        <span style={{ background: `${T.blue}1a`, color: T.blue, fontSize: 11, padding: '3px 9px', borderRadius: 10, fontFamily: 'DM Sans', fontWeight: 600 }}>
                          {totalDays} total
                        </span>
                      )}
                    </div>
                    {/* Last 7 days dots */}
                    <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const ds = d.toISOString().slice(0, 10);
                        const done = log.includes(ds);
                        const isToday = ds === todayStr;
                        return (
                          <div key={i} style={{
                            flex: 1, height: 20, borderRadius: 5,
                            background: done ? T.amber : (isToday ? `${T.amber}22` : 'rgba(255,255,255,0.06)'),
                            border: isToday ? `1px solid ${T.amber}55` : '1px solid transparent',
                            position: 'relative',
                          }}>
                            {isToday && !done && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: T.amber, fontWeight: 700 }}>·</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Check-in button */}
                    <button onClick={() => toggleStep(s.id)} style={{
                      width: '100%', padding: '11px 0',
                      background: doneToday ? `${T.amber}22` : T.amber,
                      border: doneToday ? `1px solid ${T.amber}66` : 'none',
                      borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans',
                      fontWeight: 700, fontSize: 14,
                      color: doneToday ? T.amber : '#0d1825',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      {doneToday ? <><Check size={16} strokeWidth={3} /> Done today ✓</> : '✓ Check in today'}
                    </button>
                    {!doneToday && user.hatched && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => { setCoPilotMode('support'); setCoPilotStep(s); }} style={{
                          width: '100%', padding: '9px 0',
                          background: `${T.teal}1a`, border: `1px solid ${T.teal}66`,
                          borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans',
                          fontWeight: 700, fontSize: 12, color: T.teal,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Heart size={11} fill={T.teal} /> Just be with me
                        </button>
                        {s.walkthrough && s.walkthrough.length > 0 && (
                          <button onClick={() => { setCoPilotMode('walkthrough'); setCoPilotStep(s); }} style={{
                            width: '100%', padding: '9px 0',
                            background: `${T.purple}1a`, border: `1px solid ${T.purple}66`,
                            borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans',
                            fontWeight: 700, fontSize: 12, color: T.purple,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            📋 Walk me through it
                          </button>
                        )}
                      </div>
                    )}
                    {/* Walkthrough authoring for daily steps */}
                    {editingWalkthroughId === s.id && (
                      <WalkthroughEditor
                        step={s}
                        onChange={(wt) => saveStepWalkthrough(s.id, wt)}
                        onClose={() => setEditingWalkthroughId(null)}
                      />
                    )}
                    {editingWalkthroughId !== s.id && (
                      <button onClick={() => setEditingWalkthroughId(s.id)} style={{
                        width: '100%', marginTop: 8,
                        background: (s.walkthrough && s.walkthrough.length) ? `${T.purple}11` : 'transparent',
                        color: T.purple,
                        border: `1.5px ${(s.walkthrough && s.walkthrough.length) ? 'solid' : 'dashed'} ${T.purple}55`,
                        borderRadius: 10, padding: '8px 0',
                        fontFamily: 'DM Sans', fontWeight: 600, fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        📋 {(s.walkthrough && s.walkthrough.length)
                          ? `Edit walk-me-through (${s.walkthrough.length})`
                          : 'Set up walk-me-through'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {goal.completed && (
          <div style={{
            background: `linear-gradient(135deg, ${T.teal}22, ${T.blue}11)`,
            border: `1px solid ${T.teal}66`,
            borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 80,
          }}>
            <Trophy size={32} color={T.teal} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 4 }}>Goal complete!</div>
            <div style={{ color: T.textDim, fontSize: 13, fontFamily: 'DM Sans' }}>
              +{GOAL_COMPLETE_XP} XP · +{GOAL_COMPLETE_BONUS_TICKETS} bonus tickets
            </div>
          </div>
        )}
        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// FRIENDS SCREEN
// ────────────────────────────────────────────────────────────────────────────
function FriendsScreen({ user }) {
  const friends = user.friendPets || [];
  return (
    <div style={pageStyle}>
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text, marginBottom: 8, letterSpacing: '-0.3px' }}>
        {user.petName}'s friends
      </h1>
      <p style={{ color: T.muted, fontSize: 14, fontFamily: 'DM Sans', marginBottom: 24 }}>
        Each friend pet hatched when you started a goal.
      </p>
      {friends.length === 0 ? (
        <div style={{ background: T.surface, border: `1px dashed ${T.borderStrong}`, borderRadius: 20, padding: 40, textAlign: 'center', marginTop: 40 }}>
          <Users size={36} color={T.muted} style={{ marginBottom: 12 }} />
          <h3 style={{ fontFamily: 'Syne', color: T.text, fontSize: 18, marginBottom: 8 }}>No friends yet</h3>
          <p style={{ color: T.muted, fontSize: 14, fontFamily: 'DM Sans', maxWidth: 280, margin: '0 auto' }}>
            Start a goal and complete its first step — a new friend pet will hatch.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 100 }}>
          {friends.map(f => (
            <div key={f.id} style={{
              background: `radial-gradient(circle at center, ${f.color}15 0%, transparent 70%), ${T.surface}`,
              border: `1px solid ${T.border}`,
              borderRadius: 18, padding: 16, textAlign: 'center',
            }}>
              <AnimalPet type={f.type} color={f.color} mood="awake" size={80} />
              <div style={{ marginTop: 8, fontFamily: 'DM Sans', fontSize: 14, fontWeight: 700, color: T.text, textTransform: 'capitalize' }}>
                {f.type}
              </div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 2, fontFamily: 'DM Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.goalTitle}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// SHOP SCREEN
// ────────────────────────────────────────────────────────────────────────────
function ShopScreen({ user, setUser }) {
  const [cat, setCat] = useState('all');
  const [colorModal, setColorModal] = useState(null);

  const tickets  = user.tickets || 0;
  const inventory = normalizeInventory(user.inventory);
  const equipped  = normalizeEquipped(user.equipped);
  const wishlist  = user.wishlist || [];

  const visible = (() => {
    if (cat === 'wishlist') return SHOP_ITEMS.filter(i => wishlist.includes(i.id));
    if (cat === 'all') return SHOP_ITEMS;
    return SHOP_ITEMS.filter(i => i.category === cat);
  })();

  function getInvEntry(itemId) { return inventory.find(e => e.id === itemId); }
  function isOwned(item) { return !!getInvEntry(item.id); }
  function isEquipped(item) { const s = equipped[item.category]; return s && s.id === item.id; }
  function getItemColor(item) { const e = getInvEntry(item.id); return e ? e.color : item.defaultColor; }
  function isWishlisted(item) { return wishlist.includes(item.id); }

  async function toggleWishlist(item) {
    const next = isWishlisted(item)
      ? wishlist.filter(id => id !== item.id)
      : [...wishlist, item.id];
    const updated = { ...user, wishlist: next };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
  }

  async function confirmBuy(item, color) {
    if (tickets < item.cost || isOwned(item)) return;
    const newInv = [...inventory, { id: item.id, color }];
    // Remove from wishlist when purchased
    const newWishlist = wishlist.filter(id => id !== item.id);
    const updated = {
      ...user,
      tickets: tickets - item.cost,
      inventory: newInv,
      wishlist: newWishlist,
    };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    setColorModal(null);
  }

  async function confirmRecolor(itemId, color) {
    const newInv = inventory.map(e => e.id === itemId ? { ...e, color } : e);
    const newEquipped = { ...equipped };
    for (const slot of Object.keys(newEquipped)) {
      if (newEquipped[slot] && newEquipped[slot].id === itemId) {
        newEquipped[slot] = { ...newEquipped[slot], color };
      }
    }
    const updated = { ...user, inventory: newInv, equipped: newEquipped };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    setColorModal(null);
  }

  async function toggleEquip(item) {
    if (!isOwned(item)) return;
    const slot = item.category;
    const current = equipped[slot];
    const newEquipped = current && current.id === item.id
      ? { ...equipped, [slot]: null }
      : { ...equipped, [slot]: { id: item.id, color: getItemColor(item) } };
    const updated = { ...user, equipped: newEquipped };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
  }

  // Wishlist summary stats
  const wishlistItems = SHOP_ITEMS.filter(i => wishlist.includes(i.id) && !isOwned(i));
  const wishlistTotal = wishlistItems.reduce((sum, i) => sum + i.cost, 0);
  const ticketsNeeded = Math.max(0, wishlistTotal - tickets);
  const nextAffordable = wishlistItems.filter(i => i.cost <= tickets)[0];

  return (
    <div style={{ ...pageStyle, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text, letterSpacing: '-0.3px' }}>Shop</h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: `${T.teal}18`, border: `1px solid ${T.teal}55`,
          borderRadius: 20, padding: '7px 14px',
        }}>
          <Ticket size={15} color={T.teal} />
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, color: T.teal }}>{tickets}</span>
        </div>
      </div>
      <p style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans', marginBottom: 18 }}>
        Complete goal steps to earn tickets. Spend them here to dress up {user.petName}!
      </p>

      {/* Pet preview */}
      <div style={{
        background: `radial-gradient(circle at center, ${user.petColor}14 0%, transparent 70%), ${T.surface}`,
        border: `1px solid ${T.border}`, borderRadius: 20,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '20px 16px', marginBottom: 20, position: 'relative', minHeight: 170,
      }}>
        <AnimalPet type={user.petType} color={user.petColor} mood="happy" size={150}
          variant={user.petVariant || 'cute'} equipped={equipped} />
        {Object.values(equipped).some(Boolean) && (
          <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 10, color: T.muted, fontFamily: 'DM Sans' }}>
            {Object.values(equipped).filter(Boolean).length} item{Object.values(equipped).filter(Boolean).length !== 1 ? 's' : ''} on
          </div>
        )}
      </div>

      {/* Wishlist budget summary — only shown when wishlist tab active and has items */}
      {cat === 'wishlist' && wishlistItems.length > 0 && (
        <div style={{
          background: ticketsNeeded === 0 ? `${T.teal}12` : `${T.amber}10`,
          border: `1px solid ${ticketsNeeded === 0 ? T.teal : T.amber}44`,
          borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          fontFamily: 'DM Sans',
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>
            💰 Wishlist budget
          </div>
          <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.6 }}>
            {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} · costs <strong style={{ color: T.teal }}>{wishlistTotal} tickets</strong> total
          </div>
          {ticketsNeeded > 0 ? (
            <div style={{ fontSize: 13, color: T.amber, marginTop: 4 }}>
              You need <strong>{ticketsNeeded} more tickets</strong> to buy everything on your list.
              {nextAffordable && (
                <> You can afford <strong>{nextAffordable.name}</strong> right now!</>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: T.teal, marginTop: 4, fontWeight: 600 }}>
              ✓ You can afford everything on your wishlist!
            </div>
          )}
        </div>
      )}

      {/* Wishlist empty state */}
      {cat === 'wishlist' && wishlist.length === 0 && (
        <div style={{
          background: T.surface, border: `1px dashed ${T.borderStrong}`,
          borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤍</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>
            Your wishlist is empty
          </div>
          <div style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans' }}>
            Tap the 🤍 on any item to save it for later.
          </div>
        </div>
      )}

      {/* Category chips */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18,
        marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20, scrollbarWidth: 'none',
      }}>
        {[...SHOP_CATEGORIES, { id: 'wishlist', label: 'Wishlist', emoji: '🤍' }].map(c => {
          const isWL = c.id === 'wishlist';
          const badge = isWL && wishlist.length > 0 ? wishlist.length : null;
          return (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: cat === c.id ? (isWL ? `${T.pink}1f` : `${T.teal}1f`) : T.surface,
              border: cat === c.id ? `1.5px solid ${isWL ? T.pink : T.teal}` : `1px solid ${T.border}`,
              borderRadius: 20, color: cat === c.id ? (isWL ? T.pink : T.teal) : T.textDim,
              fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans', cursor: 'pointer', whiteSpace: 'nowrap',
              position: 'relative',
            }}>
              <span>{c.emoji}</span> {c.label}
              {badge && (
                <span style={{
                  background: T.pink, color: '#0d1825', borderRadius: '50%',
                  width: 16, height: 16, fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -2,
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Item grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {visible.map(item => {
          const owned = isOwned(item);
          const eq = isEquipped(item);
          const wishlisted = isWishlisted(item);
          const icolor = getItemColor(item);
          const canAfford = tickets >= item.cost;
          const ticketsShort = item.cost - tickets;

          return (
            <div key={item.id} style={{
              background: eq ? `${T.teal}12` : T.surface,
              border: `1.5px solid ${eq ? T.teal : owned ? T.borderStrong : T.border}`,
              borderRadius: 18, overflow: 'hidden', position: 'relative',
            }}>
              {/* Wishlist heart button */}
              {!owned && (
                <button onClick={() => toggleWishlist(item)} style={{
                  position: 'absolute', top: 8, right: 8, zIndex: 2,
                  background: wishlisted ? `${T.pink}33` : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${wishlisted ? T.pink : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '50%', width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 14,
                }}>
                  {wishlisted ? '❤️' : '🤍'}
                </button>
              )}

              {/* Preview */}
              <div style={{
                background: `radial-gradient(circle, ${user.petColor}18 0%, transparent 70%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 110,
              }}>
                <svg viewBox="0 0 200 200" width="90" height="90">
                  <ellipse cx="100" cy="196" rx="52" ry="6" fill="rgba(0,0,0,0.2)" />
                  {(() => { const C = ANIMAL_COMPONENTS[user.petType] || Dog; return <C color={user.petColor} mood="awake" variant={user.petVariant || 'cute'} />; })()}
                  {item.render(icolor)}
                </svg>
                {eq && (
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: T.teal, color: '#0d1825',
                    fontSize: 9, fontWeight: 700, fontFamily: 'DM Sans',
                    padding: '3px 8px', borderRadius: 8, letterSpacing: 0.4,
                  }}>ON</div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 2 }}>
                  {item.emoji} {item.name}
                </div>
                <div style={{ color: T.muted, fontSize: 11, fontFamily: 'DM Sans', marginBottom: 10, lineHeight: 1.4 }}>
                  {item.desc}
                </div>

                {owned ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setColorModal({ item, color: icolor, mode: 'recolor' })} style={{
                      width: 36, height: 34, borderRadius: 10, flexShrink: 0,
                      background: icolor, border: `2px solid rgba(255,255,255,0.2)`,
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    }}>
                      <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 9 }}>✏️</span>
                    </button>
                    <button onClick={() => toggleEquip(item)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 10,
                      background: eq ? `${T.red}22` : `${T.teal}22`,
                      border: `1.5px solid ${eq ? T.red : T.teal}`,
                      color: eq ? T.red : T.teal,
                      fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}>
                      {eq ? 'Unequip' : 'Equip'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => canAfford && setColorModal({ item, color: item.defaultColor, mode: 'buy' })}
                      disabled={!canAfford} style={{
                        width: '100%', padding: '9px 0', borderRadius: 10,
                        background: canAfford ? T.teal : 'transparent',
                        border: `1.5px solid ${canAfford ? T.teal : T.border}`,
                        color: canAfford ? '#0d1825' : T.muted,
                        fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        marginBottom: !canAfford ? 6 : 0,
                      }}>
                      <Ticket size={12} /> {item.cost} tickets
                    </button>
                    {!canAfford && (
                      <div style={{
                        textAlign: 'center', fontSize: 11, color: T.amber,
                        fontFamily: 'DM Sans', fontWeight: 600,
                      }}>
                        {ticketsShort} more ticket{ticketsShort !== 1 ? 's' : ''} to go
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Colour picker modal */}
      {colorModal && (
        <ColorPickerModal
          item={colorModal.item}
          initialColor={colorModal.color}
          mode={colorModal.mode}
          petType={user.petType}
          petColor={user.petColor}
          petVariant={user.petVariant || 'cute'}
          tickets={tickets}
          onConfirm={(color) => {
            if (colorModal.mode === 'buy') confirmBuy(colorModal.item, color);
            else confirmRecolor(colorModal.item.id, color);
          }}
          onClose={() => setColorModal(null)}
        />
      )}
    </div>
  );
}

function ColorPickerModal({ item, initialColor, mode, petType, petColor, petVariant, tickets, onConfirm, onClose }) {
  const [selected, setSelected] = useState(initialColor);
  const C = ANIMAL_COMPONENTS[petType] || Dog;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(5,11,20,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      animation: 'sceneIn 0.25s ease-out',
    }} onClick={onClose}>
      <div style={{
        background: T.surface, borderRadius: '24px 24px 0 0',
        border: `1px solid ${T.borderStrong}`, width: '100%',
        padding: '24px 20px 36px', maxWidth: 480,
      }} onClick={e => e.stopPropagation()}>

        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.subtle, margin: '0 auto 20px' }} />

        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4, textAlign: 'center' }}>
          Pick a colour
        </div>
        <div style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans', textAlign: 'center', marginBottom: 20 }}>
          {mode === 'buy' ? `Choosing colour for ${item.name}` : `Recolour your ${item.name}`}
        </div>

        {/* Live preview */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 20,
          background: `radial-gradient(circle, ${petColor}18 0%, transparent 70%)`,
          borderRadius: 16, padding: '12px 0',
        }}>
          <svg viewBox="0 0 200 200" width="120" height="120">
            <ellipse cx="100" cy="196" rx="52" ry="6" fill="rgba(0,0,0,0.2)" />
            <C color={petColor} mood="happy" variant={petVariant} />
            {item.render(selected)}
          </svg>
        </div>

        {/* Colour grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {ITEM_COLORS.map(ic => (
            <button key={ic.hex} onClick={() => setSelected(ic.hex)} style={{
              aspectRatio: '1', borderRadius: 12, background: ic.hex,
              border: selected === ic.hex ? `3px solid #fff` : `2px solid rgba(255,255,255,0.12)`,
              cursor: 'pointer', boxShadow: selected === ic.hex ? `0 0 14px ${ic.hex}88` : 'none',
              transition: 'all 0.15s', position: 'relative',
            }}>
              {selected === ic.hex && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: ic.hex === '#FFFFFF' ? '#0d1825' : '#0d1825', fontSize: 14, fontWeight: 900,
                }}>✓</div>
              )}
            </button>
          ))}
        </div>

        <button onClick={() => onConfirm(selected)} style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          background: mode === 'buy' ? T.teal : selected,
          border: 'none',
          color: '#0d1825', fontFamily: 'Syne', fontWeight: 800, fontSize: 15,
          cursor: 'pointer',
          boxShadow: `0 6px 20px ${mode === 'buy' ? T.teal : selected}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {mode === 'buy' ? (
            <><Ticket size={16} /> Buy for {item.cost} tickets</>
          ) : (
            <>Save colour</>
          )}
        </button>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// LEARNING MODULE CATALOGUE
// ────────────────────────────────────────────────────────────────────────────
const LEARN_MODULES = [
  {
    id: 'shopping',
    title: 'Pet Goes Shopping',
    emoji: '🛒',
    tagline: 'Navigate the supermarket, manage overwhelm, stay calm',
    color: '#FF6B9D',
    relatedCategories: ['community', 'home_care'],
    relatedLabel: 'Helps with community outings & daily living',
    activities: [
      { id: 'shopping_run', title: 'Shopping Run', emoji: '🛒', color: '#FF6B9D', desc: 'Guide your pet through the supermarket without getting overwhelmed' },
    ],
  },
  {
    id: 'clock',
    title: 'Pet Learns Time',
    emoji: '🕐',
    tagline: 'Read clocks, plan days, beat the timer',
    color: '#00E5B4',
    relatedCategories: ['body', 'school_work', 'community', 'home_care'],
    relatedLabel: 'Helps with routines & being on time',
    activities: [
      { id: 'set',   title: 'Set the Clock',   emoji: '🕰️', color: '#00E5B4', desc: 'Drag the hand to show the right time' },
      { id: 'match', title: 'Memory Match',    emoji: '🃏', color: '#8B7CF8', desc: 'Flip cards — pair clocks with times'  },
      { id: 'race',  title: 'Race the Clock',  emoji: '⚡', color: '#FFB020', desc: 'Beat the timer. Pick the right clock'  },
      { id: 'build', title: "Build Pet's Day", emoji: '📅', color: '#00BFFF', desc: "Drop activities onto pet's schedule"  },
    ],
  },
];

function getLinkedModules(goals) {
  const active = (goals || []).filter(g => !g.completed);
  return LEARN_MODULES.map(mod => {
    const linked = active.filter(g => mod.relatedCategories.includes(g.category));
    return { ...mod, linkedGoals: linked };
  }).filter(mod => mod.linkedGoals.length > 0);
}

// ─── CLOCK FACE ─────────────────────────────────────────────────────────────
function ClockFace({ hour, minute = 0, size = 200, hourHandColor = T.red, minuteHandColor = T.blue, showNumbers = true }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  const minAngle  = (minute / 60) * 360 - 90;
  const hourAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30 - 90;
  const minRad    = (minAngle  * Math.PI) / 180;
  const hourRad   = (hourAngle * Math.PI) / 180;
  const minX  = cx + r * 0.78 * Math.cos(minRad);
  const minY  = cy + r * 0.78 * Math.sin(minRad);
  const hourX = cx + r * 0.55 * Math.cos(hourRad);
  const hourY = cy + r * 0.55 * Math.sin(hourRad);
  const nums = [];
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * 360 - 90;
    const rad = (a * Math.PI) / 180;
    nums.push({ n: i, x: cx + r * 0.82 * Math.cos(rad), y: cy + r * 0.82 * Math.sin(rad) });
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill={T.surface} stroke={T.borderStrong} strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * 360 - 90;
        const rad = (a * Math.PI) / 180;
        return <line key={i} x1={cx + r * 0.90 * Math.cos(rad)} y1={cy + r * 0.90 * Math.sin(rad)}
          x2={cx + r * 0.99 * Math.cos(rad)} y2={cy + r * 0.99 * Math.sin(rad)}
          stroke={T.textDim} strokeWidth="2" />;
      })}
      {showNumbers && nums.map(n => (
        <text key={n.n} x={n.x} y={n.y + 5} textAnchor="middle" fill={T.text}
          fontFamily="DM Sans" fontWeight="800" fontSize={size * 0.085}>{n.n}</text>
      ))}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke={hourHandColor}   strokeWidth="6" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minX}  y2={minY}  stroke={minuteHandColor} strokeWidth="4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={T.amber} />
    </svg>
  );
}

// ─── SESSION END ─────────────────────────────────────────────────────────────
function ClockGameEnd({ title, score, max, tickets, customMsg, onDone }) {
  return (
    <div style={{ padding: 28, textAlign: 'center', fontFamily: 'DM Sans' }}>
      <div style={{ fontSize: 58, marginBottom: 12 }}>
        {tickets > 0 ? '✨' : '👍'}
      </div>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: T.text, marginBottom: 6 }}>
        {customMsg || (max ? `${score} / ${max}` : `${score}`)}
      </div>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 24 }}>{title}</div>
      <div style={{
        background: `${T.amber}18`, border: `1px solid ${T.amber}44`,
        borderRadius: 16, padding: '18px 24px', marginBottom: 24, display: 'inline-block', minWidth: 160,
      }}>
        <div style={{ color: T.amber, fontSize: 34, fontWeight: 800, fontFamily: 'Syne', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ticket size={24} /> +{tickets}
        </div>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>tickets earned</div>
      </div>
      <button onClick={onDone} style={{
        display: 'block', width: '100%', background: T.teal, color: '#0d1825',
        border: 'none', borderRadius: 14, padding: '14px 0',
        fontFamily: 'Syne', fontWeight: 800, fontSize: 16, cursor: 'pointer',
      }}>Done →</button>
    </div>
  );
}

// ─── GAME 1 — SET THE CLOCK ──────────────────────────────────────────────────
// Faithful to original: only advances when answer is CORRECT. User keeps
// dragging until they get it right — wrong attempts just reset streak.
const G1_PROMPTS = [
  { hour: 6,  activity: '🍳', label: "Pet's hungry — breakfast at 6 o'clock" },
  { hour: 8,  activity: '🎒', label: "School starts at 8 o'clock" },
  { hour: 12, activity: '🥪', label: "Lunch at 12 o'clock" },
  { hour: 3,  activity: '🎮', label: "Play time at 3 o'clock" },
  { hour: 7,  activity: '🛏️', label: "Bedtime at 7 o'clock" },
];

function ClockGame_Set({ petEmoji, onFinish }) {
  const [round, setRound]       = useState(0);
  const [hour, setHour]         = useState(9);
  const [locked, setLocked]     = useState(false);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const svgRef = useRef(null);

  if (round >= G1_PROMPTS.length) {
    const tickets = score + (maxStreak >= 3 ? 2 : 0);
    return <ClockGameEnd title="Set the Clock" score={score} max={G1_PROMPTS.length}
      tickets={tickets} onDone={() => onFinish({ gameId: 'set', tickets })} />;
  }

  const target  = G1_PROMPTS[round];
  const correct = hour === target.hour;

  const handleDrag = (e) => {
    if (locked) return;
    const div = svgRef.current;
    if (!div) return;
    const rect = div.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left - rect.width / 2;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top - rect.height / 2;
    const angle      = Math.atan2(y, x) * 180 / Math.PI + 90;
    const normalised = (angle + 360) % 360;
    const snapped    = Math.round(normalised / 30) % 12;
    setHour(snapped === 0 ? 12 : snapped);
  };

  // Only advance on correct — wrong just resets streak (matches original)
  const check = () => {
    if (correct) {
      setLocked(true);
      setScore(s => s + 1);
      setStreak(s => { const ns = s + 1; setMaxStreak(m => Math.max(m, ns)); return ns; });
      setTimeout(() => { setRound(r => r + 1); setHour(9); setLocked(false); }, 1300);
    } else {
      setStreak(0);
    }
  };

  return (
    <div style={{ padding: 20, color: T.text, fontFamily: 'DM Sans' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: T.teal }}>🎯 {score} / {G1_PROMPTS.length}</span>
        <span style={{ color: T.amber }}>🔥 {streak}</span>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 14, padding: 16, marginBottom: 18, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 44, lineHeight: 1 }}>
          <span style={{ animation: 'petBob 2.4s ease-in-out infinite' }}>{petEmoji}</span>
          <span style={{ color: T.muted, fontSize: 22 }}>+</span>
          <span>{target.activity}</span>
        </div>
        <div style={{ color: T.text, fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{target.label}</div>
        <div style={{ color: T.muted, fontSize: 11, fontWeight: 600, marginTop: 8, letterSpacing: 0.5 }}>
          DRAG THE SHORT HAND TO THE {target.hour}
        </div>
      </div>
      <div ref={svgRef}
        onMouseMove={e => e.buttons === 1 && handleDrag(e)}
        onClick={handleDrag}
        onTouchMove={e => { e.preventDefault(); handleDrag(e); }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, touchAction: 'none', cursor: locked ? 'default' : 'grab' }}>
        <ClockFace hour={hour} minute={0} size={240}
          hourHandColor={locked ? T.green : (correct ? T.green : T.red)}
          minuteHandColor={T.blue} showNumbers />
      </div>
      {locked ? (
        <div style={{ background: `${T.green}22`, border: `2px solid ${T.green}`, borderRadius: 14, padding: 14, textAlign: 'center', color: T.green, fontWeight: 800, fontSize: 16 }}>
          ✓ {target.hour} o'clock! {target.activity}
        </div>
      ) : (
        <button onClick={check} style={{
          width: '100%', background: correct ? T.green : T.card,
          color: correct ? '#0d1825' : T.muted,
          border: `2px solid ${correct ? T.green : T.borderStrong}`,
          borderRadius: 14, padding: '14px 0', fontFamily: 'Syne', fontWeight: 800, fontSize: 15, cursor: 'pointer',
        }}>
          {correct ? `That's ${target.hour} o'clock! Confirm →` : 'Keep dragging…'}
        </button>
      )}
    </div>
  );
}

// ─── GAME 2 — MEMORY MATCH ───────────────────────────────────────────────────
// Hours match original: 2, 5, 8, 11
const G2_HOURS = [2, 5, 8, 11];

function ClockGame_Match({ onFinish }) {
  const [deck] = useState(() => {
    const cards = [];
    G2_HOURS.forEach(h => {
      cards.push({ id: `clock-${h}`, type: 'clock', hour: h });
      cards.push({ id: `text-${h}`,  type: 'text',  hour: h });
    });
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  });
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves,   setMoves]   = useState(0);

  const flip = (i) => {
    if (flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next;
      if (deck[a].hour === deck[b].hour) {
        setTimeout(() => { setMatched(m => [...m, a, b]); setFlipped([]); }, 600);
      } else {
        setTimeout(() => setFlipped([]), 1100);
      }
    }
  };

  if (matched.length === deck.length) {
    const tickets = 4 + (moves <= 12 ? 2 : 0);
    return <ClockGameEnd title="Memory Match" score={moves} max={null} tickets={tickets}
      customMsg={`Cleared in ${moves} moves`}
      onDone={() => onFinish({ gameId: 'match', tickets })} />;
  }

  return (
    <div style={{ padding: 20, color: T.text, fontFamily: 'DM Sans' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: T.teal }}>Pairs: {matched.length / 2} / {G2_HOURS.length}</span>
        <span style={{ color: T.muted }}>Moves: {moves}</span>
      </div>
      <div style={{ color: T.muted, fontSize: 12, fontWeight: 600, marginBottom: 14, letterSpacing: 0.5, textAlign: 'center' }}>
        MATCH EACH CLOCK TO ITS TIME
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {deck.map((card, i) => {
          const isUp      = flipped.includes(i) || matched.includes(i);
          const isMatched = matched.includes(i);
          return (
            <button key={card.id} onClick={() => flip(i)} style={{
              aspectRatio: '1 / 1.2', borderRadius: 10, padding: 4,
              cursor: isUp ? 'default' : 'pointer',
              background: isUp ? (isMatched ? `${T.green}22` : T.cardHover) : T.card,
              border: `2px solid ${isMatched ? T.green : isUp ? T.teal : T.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!isUp
                ? <span style={{ fontSize: 24, opacity: 0.4 }}>?</span>
                : card.type === 'clock'
                ? <ClockFace hour={card.hour} size={62} showNumbers />
                : <span style={{ color: T.text, fontSize: 13, fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>
                    {card.hour}<br />o'clock
                  </span>
              }
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── GAME 3 — RACE THE CLOCK ─────────────────────────────────────────────────
const G3_EVENTS = [
  { hour: 7,  activity: '🌅', label: 'WAKE UP'  },
  { hour: 9,  activity: '🚌', label: 'BUS COMES' },
  { hour: 1,  activity: '🍕', label: 'LUNCH'     },
  { hour: 4,  activity: '🎮', label: 'GAMING'    },
  { hour: 8,  activity: '🛏️', label: 'BEDTIME'   },
];
const G3_TIME = 8000;

function ClockGame_Race({ petEmoji, onFinish }) {
  const makeOptions = (round) => {
    const ev    = G3_EVENTS[round];
    const wrong = G3_EVENTS.filter(e => e.hour !== ev.hour).map(e => e.hour);
    return [ev.hour, ...wrong.sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5);
  };

  const [round,    setRound]    = useState(0);
  const [score,    setScore]    = useState(0);
  const [streak,   setStreak]   = useState(0);
  const [picked,   setPicked]   = useState(null);
  const [timeLeft, setTimeLeft] = useState(G3_TIME);
  const [phase,    setPhase]    = useState('playing');
  const [options,  setOptions]  = useState(() => makeOptions(0));
  const event = G3_EVENTS[round];

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const start = Date.now();
    const tick  = setInterval(() => {
      const rem = Math.max(0, G3_TIME - (Date.now() - start));
      setTimeLeft(rem);
      if (rem === 0) { clearInterval(tick); setPicked(-1); setStreak(0); setPhase('feedback'); }
    }, 50);
    return () => clearInterval(tick);
  }, [round, phase]);

  const handlePick = (h) => {
    if (phase !== 'playing') return;
    setPicked(h);
    if (h === event.hour) { setScore(s => s + 1); setStreak(s => s + 1); } else { setStreak(0); }
    setPhase('feedback');
    setTimeout(() => {
      const next = round + 1;
      if (next >= G3_EVENTS.length) { setPhase('done'); }
      else {
        setOptions(makeOptions(next));
        setRound(next); setPicked(null); setTimeLeft(G3_TIME); setPhase('playing');
      }
    }, 1100);
  };

  if (phase === 'done') {
    const tickets = score + (score === G3_EVENTS.length ? 3 : 0);
    return <ClockGameEnd title="Race the Clock" score={score} max={G3_EVENTS.length}
      tickets={tickets} onDone={() => onFinish({ gameId: 'race', tickets })} />;
  }

  const timePct = (timeLeft / G3_TIME) * 100;
  return (
    <div style={{ padding: 20, color: T.text, fontFamily: 'DM Sans' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: T.teal }}>🎯 {score} / {G3_EVENTS.length}</span>
        <span style={{ color: T.amber }}>🔥 {streak}</span>
      </div>
      <div style={{ height: 8, background: T.card, borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ width: `${timePct}%`, height: '100%', transition: 'width 0.05s linear',
          background: timePct > 50 ? T.green : timePct > 25 ? T.amber : T.red }} />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 14, padding: 14, marginBottom: 18, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 40, lineHeight: 1 }}>
          <span style={{ animation: 'petBob 2.4s ease-in-out infinite' }}>{petEmoji}</span>
          <span style={{ color: T.muted, fontSize: 20 }}>+</span>
          <span>{event.activity}</span>
        </div>
        <div style={{ color: T.text, fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>{event.label}</div>
        <div style={{ color: T.amber, fontSize: 20, fontWeight: 800, marginTop: 6, fontFamily: 'Syne' }}>{event.hour} o'clock</div>
      </div>
      <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 }}>
        TAP THE CLOCK THAT MATCHES
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {options.map((h, i) => {
          const isCorrect = h === event.hour;
          const isPicked  = picked === h;
          let border = T.borderStrong, bg = T.card;
          if (phase === 'feedback') {
            if (isPicked && isCorrect)        { border = T.green; bg = `${T.green}22`; }
            else if (isPicked && !isCorrect)  { border = T.red;   bg = `${T.red}22`;   }
            else if (isCorrect)               { border = T.green; bg = `${T.green}11`; }
          }
          return (
            <button key={`${round}-${i}`} onClick={() => handlePick(h)}
              disabled={phase !== 'playing'}
              style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: '10px 4px',
                cursor: phase === 'playing' ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ClockFace hour={h} size={72} showNumbers={false} />
              <span style={{ color: T.text, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{h} o'clock</span>
            </button>
          );
        })}
      </div>
      {picked === -1 && (
        <div style={{ marginTop: 14, padding: 10, background: `${T.red}15`, border: `1px solid ${T.red}55`, borderRadius: 10, textAlign: 'center', color: T.red, fontSize: 13, fontWeight: 700 }}>
          ⏱ Time's up! {event.label.toLowerCase()}.
        </div>
      )}
    </div>
  );
}

// ─── GAME 4 — BUILD PET'S DAY ────────────────────────────────────────────────
const G4_SLOTS = [
  { hour: 7,  expected: 'wake'   },
  { hour: 9,  expected: 'school' },
  { hour: 12, expected: 'lunch'  },
  { hour: 3,  expected: 'play'   },
];
const G4_ACTIVITIES = [
  { id: 'wake',   activity: '🌅', label: 'WAKE UP' },
  { id: 'school', activity: '🎒', label: 'SCHOOL'  },
  { id: 'lunch',  activity: '🥪', label: 'LUNCH'   },
  { id: 'play',   activity: '🎮', label: 'PLAY'    },
];

function ClockGame_Build({ petEmoji, onFinish }) {
  const [placements, setPlacements] = useState({});
  const [selected,   setSelected]   = useState(null);
  const [done,       setDone]       = useState(false);
  const [wrongs,     setWrongs]     = useState(0);

  const placeOn = (idx) => {
    if (!selected) return;
    const next = { ...placements };
    Object.keys(next).forEach(k => { if (next[k] === selected) delete next[k]; });
    next[idx] = selected;
    if (next[idx] !== G4_SLOTS[idx].expected) setWrongs(w => w + 1);
    setPlacements(next);
    setSelected(null);
    if (G4_SLOTS.every((_, i) => next[i]) && G4_SLOTS.every((s, i) => next[i] === s.expected)) {
      setTimeout(() => setDone(true), 600);
    }
  };

  if (done) {
    const tickets = 4 + (wrongs === 0 ? 2 : 0);
    return <ClockGameEnd title="Build Pet's Day"
      score={wrongs === 0 ? 100 : Math.max(50, 100 - wrongs * 10)} max={null} tickets={tickets}
      customMsg={wrongs === 0 ? 'Perfect — first try! 🌟' : `Done! ${wrongs} swap${wrongs > 1 ? 's' : ''}`}
      onDone={() => onFinish({ gameId: 'build', tickets })} />;
  }

  const placed    = new Set(Object.values(placements));
  const available = G4_ACTIVITIES.filter(a => !placed.has(a.id));

  return (
    <div style={{ padding: 20, color: T.text, fontFamily: 'DM Sans' }}>
      <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 14, letterSpacing: 0.5 }}>
        TAP AN ACTIVITY · THEN TAP A CLOCK SLOT
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {G4_SLOTS.map((slot, i) => {
          const pid = placements[i];
          const act = pid ? G4_ACTIVITIES.find(a => a.id === pid) : null;
          const ok  = pid === slot.expected;
          return (
            <button key={i} onClick={() => placeOn(i)} disabled={!selected && !act}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14,
                background: pid ? (ok ? `${T.green}22` : `${T.red}22`) : (selected ? `${T.amber}11` : T.card),
                border: `2px solid ${pid ? (ok ? T.green : T.red) : (selected ? T.amber : T.borderStrong)}`,
                cursor: (selected || act) ? 'pointer' : 'default', fontFamily: 'DM Sans' }}>
              <ClockFace hour={slot.hour} size={58} showNumbers={false} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ color: T.amber, fontSize: 14, fontWeight: 800, fontFamily: 'Syne' }}>{slot.hour} o'clock</div>
                {act && (
                  <div style={{ color: T.text, fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                    {petEmoji} {act.activity} {act.label}
                  </div>
                )}
              </div>
              {pid && <span style={{ fontSize: 18, color: ok ? T.green : T.red }}>{ok ? '✓' : '✗'}</span>}
            </button>
          );
        })}
      </div>
      {available.length > 0 && (
        <>
          <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>ACTIVITIES</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${available.length}, 1fr)`, gap: 8 }}>
            {available.map(a => (
              <button key={a.id} onClick={() => setSelected(selected === a.id ? null : a.id)} style={{
                background: selected === a.id ? `${T.amber}33` : T.card,
                border: `2px solid ${selected === a.id ? T.amber : T.borderStrong}`,
                borderRadius: 12, padding: '10px 4px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'DM Sans',
              }}>
                <span style={{ fontSize: 24 }}>{petEmoji} {a.activity}</span>
                <span style={{ color: T.text, fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHOPPING GAME COMPONENTS
// ════════════════════════════════════════════════════════════════════════════
const PETS = [
  { id: 'dragon', name: 'Dragon', emoji: '🐉' },
  { id: 'cat', name: 'Cat', emoji: '🐱' },
  { id: 'fox', name: 'Fox', emoji: '🦊' },
  { id: 'bunny', name: 'Bunny', emoji: '🐰' },
  { id: 'octopus', name: 'Octopus', emoji: '🐙' },
  { id: 'bird', name: 'Bird', emoji: '🦜' },
];

const ENCOUNTERS_DATA = [
  {
    id: 'lights', type: 'regulation',
    title: 'Buzzing fluorescent lights',
    desc: 'The fluorescent lights above this aisle are flickering and buzzing. Your eyes feel weird and your head is starting to pound.',
    choices: [
      { text: 'Look down at the floor for a bit', delta: -1, explanation: 'Reducing input helps reset.' },
      { text: 'Keep moving through quickly', delta: 0, explanation: 'You get through it.' },
      { text: 'Freeze and stare at them', delta: 1, explanation: 'Staring makes it worse.' },
    ],
  },
  {
    id: 'crowd', type: 'escalation',
    title: 'Aisle blocked by trolleys',
    desc: '"Excuse me... sorry... just getting past..." Two shoppers have stopped to chat, trolleys side by side, completely blocking the aisle.',
    choices: [
      { text: 'Politely say "excuse me"', delta: -1, explanation: 'Direct and calm works.' },
      { text: 'Wait patiently for a gap', delta: 0, explanation: 'A bit slow, but okay.' },
      { text: 'Huff and push through anyway', delta: 1, explanation: 'Creates more tension.' },
    ],
  },
  {
    id: 'announcement', type: 'regulation',
    title: 'Loud store announcement',
    desc: '"🔔 ATTENTION HATCH MART SHOPPERS — today only, buy two get one FREE on all—" The volume is full blast right above you.',
    choices: [
      { text: 'Cup your ears with your hands', delta: -1, explanation: 'Protecting your senses is smart.' },
      { text: 'Breathe slowly until it ends', delta: -1, explanation: 'Riding it out calmly.' },
      { text: 'Panic and look for the exit', delta: 1, explanation: 'Panic makes it harder.' },
    ],
  },
  {
    id: 'bump', type: 'social',
    title: 'Someone bumps into you',
    desc: 'A distracted shopper walks straight into you, nearly knocking your shopping. They look up, surprised.',
    choices: [
      { text: '"No worries, happens to everyone"', delta: -1, explanation: 'Accidents happen — kindness helps.' },
      { text: 'Nod and move on', delta: 0, explanation: 'Neutral and fine.' },
      { text: 'Get frustrated and snap at them', delta: 2, explanation: 'Your story about it = more stress.' },
    ],
  },
  {
    id: 'crying_baby', type: 'regulation',
    title: 'Screaming baby nearby',
    desc: '"WAAAAAH!" A baby in a shopping trolley two rows over is SCREAMING. The mum looks exhausted and stressed.',
    choices: [
      { text: 'Put distance between you and the sound', delta: -1, explanation: 'Moving away reduces the input.' },
      { text: 'Notice it and keep going', delta: 0, explanation: 'Acknowledging without reacting.' },
      { text: 'Let the noise take over your thoughts', delta: 1, explanation: 'Focusing on it amplifies it.' },
    ],
  },
  {
    id: 'strong_smell', type: 'regulation',
    title: 'Overwhelming smell',
    desc: 'A wave of strong cleaning product smell hits as a worker mops nearby. Your stomach turns and your eyes water a little.',
    choices: [
      { text: 'Breathe through your mouth briefly', delta: -1, explanation: 'Reduces smell input.' },
      { text: 'Keep walking past quickly', delta: 0, explanation: 'You get through it.' },
      { text: 'Stop and focus on how bad it is', delta: 1, explanation: 'Dwelling on it makes it stronger.' },
    ],
  },
  {
    id: 'close_person', type: 'social',
    title: 'Someone standing too close',
    desc: 'An elderly shopper is squinting at price tags RIGHT next to you — way inside your personal space. They haven\'t noticed.',
    choices: [
      { text: 'Take a small step sideways', delta: -1, explanation: 'Creating space calmly.' },
      { text: 'Stand your ground and wait', delta: 0, explanation: 'Manageable with awareness.' },
      { text: 'Feel trapped and start spiralling', delta: 1, explanation: 'Thoughts spiral = more stress.' },
    ],
  },
  {
    id: 'loud_phone', type: 'regulation',
    title: 'Speakerphone in the aisle',
    desc: '"YEAH MATE I\'M AT THE SHOPS, WHAT DO YOU WANT FOR DINNER??" A man is on full speakerphone in the cereal aisle. LOUD.',
    choices: [
      { text: 'Move to the next aisle over', delta: -1, explanation: 'Removing yourself from a stressor.' },
      { text: 'Focus on your own list and tune it out', delta: 0, explanation: 'Concentration helps.' },
      { text: 'Stare at him and get annoyed', delta: 1, explanation: 'Conflict focus = more stress.' },
    ],
  },
];

// Pool of stress NPC characters — randomised per playthrough so encounters vary
const STRESS_NPC_POOL = [
  { id: 'stocker',     encId: 'lights',       look: { hair: '#3a2611', shirt: '#0077b6', skin: '#e9c39d', accessory: 'ladder' } },
  { id: 'busy_mum',   encId: 'crowd',        look: { hair: '#7a4f1d', shirt: '#e76f51', skin: '#e9c39d', accessory: 'trolley' } },
  { id: 'manager',    encId: 'announcement', look: { hair: '#1d1d1d', shirt: '#1d3557', skin: '#c89b7b', accessory: 'mic' } },
  { id: 'phone_man',  encId: 'loud_phone',   look: { hair: '#3a2611', shirt: '#9d4edd', skin: '#a87850', accessory: 'phone' } },
  { id: 'baby_mum',   encId: 'crying_baby',  look: { hair: '#c97b3c', shirt: '#e9c46a', skin: '#e9c39d', accessory: 'trolley' } },
  { id: 'old_shopper',encId: 'close_person', look: { hair: '#d0d0d0', shirt: '#588157', skin: '#c89b7b', accessory: null } },
  { id: 'phone_teen', encId: 'bump',         look: { hair: '#5a3a2a', shirt: '#588157', skin: '#e9c39d', accessory: 'phone' } },
  { id: 'cleaner',    encId: 'strong_smell', look: { hair: '#1d1d1d', shirt: '#ade8f4', skin: '#c89b7b', accessory: 'mop' } },
];

// NPC positions for stress encounters — chokepoints on all three corridors
const STRESS_POSITIONS = [
  { x: 3, y: 2 },  // front aisle right of start
  { x: 1, y: 4 },  // left corridor chokepoint
  { x: 4, y: 4 },  // middle corridor chokepoint
  { x: 8, y: 5 },  // right corridor chokepoint
  { x: 4, y: 6 },  // back aisle middle
];

function buildNpcs(isHard) {
  // Shuffle the stress NPC pool and pick how many we need
  const stressCount = isHard ? 4 : 2;
  const shuffled = [...STRESS_NPC_POOL].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, stressCount);
  const stressNpcs = chosen.map((npc, i) => ({
    ...npc,
    kind: 'stress',
    x: STRESS_POSITIONS[i].x,
    y: STRESS_POSITIONS[i].y,
  }));

  // Helper workers — one near the front, one near the back (hard mode only)
  const helpers = [
    {
      id: 'helper_front', kind: 'helper', x: 1, y: 2,
      look: { hair: '#5a3a2a', shirt: '#06a77d', skin: '#e9c39d', accessory: 'apron' },
    },
  ];
  if (isHard) {
    helpers.push({
      id: 'helper_back', kind: 'helper', x: 7, y: 6,
      look: { hair: '#3a2611', shirt: '#06a77d', skin: '#c89b7b', accessory: 'apron' },
    });
  }

  return [...helpers, ...stressNpcs];
}



// ═══════════════════════════════════════════════════════════════════════════
// AUDIO PLAYER
// ═══════════════════════════════════════════════════════════════════════════

function useAmbientAudio() {
  // Persistent audio state stored in a ref so re-renders don't reset it
  const S = useRef({
    ctx: null, masterGain: null,
    ambientNodes: [], timers: [],
    ambientRunning: false, volume: 0.25,
  });

  const getCtx = () => {
    if (!S.current.ctx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.value = S.current.volume;
      master.connect(ctx.destination);
      S.current.ctx = ctx;
      S.current.masterGain = master;
    }
    if (S.current.ctx.state === 'suspended') S.current.ctx.resume();
    return S.current.ctx;
  };

  // Smooth volume change — called from outside when teen adjusts the slider
  const setVolume = (v) => {
    S.current.volume = v;
    if (S.current.masterGain) {
      S.current.masterGain.gain.setTargetAtTime(v, S.current.ctx.currentTime, 0.3);
    }
  };

  const startAmbient = () => {
    if (S.current.ambientRunning) return;
    S.current.ambientRunning = true;
    const ctx = getCtx();
    const master = S.current.masterGain;

    // ── CROWD MURMUR ──────────────────────────────────────────────────────────
    // White noise → bandpass filter at speech frequencies → gentle gain
    const bufLen = ctx.sampleRate * 4;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuf;
    noiseNode.loop = true;
    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 380;
    murmurFilter.Q.value = 0.6;
    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.14;
    noiseNode.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(master);
    noiseNode.start();
    S.current.ambientNodes.push(noiseNode);

    // ── VENTILATION / REFRIGERATION HUM ─────────────────────────────────────
    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.value = 53;
    humGain.gain.value = 0.05;
    humOsc.connect(humGain);
    humGain.connect(master);
    humOsc.start();
    S.current.ambientNodes.push(humOsc);

    // ── PERIODIC CHECKOUT BEEP ───────────────────────────────────────────────
    // Sounds like a barcode scanner — two short tones in quick succession
    const scheduleBeep = () => {
      const t = setTimeout(() => {
        if (!S.current.ambientRunning) return;
        const now = ctx.currentTime;
        [880, 1050].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          const start = now + i * 0.1;
          g.gain.setValueAtTime(0.05, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
          o.connect(g);
          g.connect(master);
          o.start(start);
          o.stop(start + 0.09);
        });
        scheduleBeep();
      }, 5000 + Math.random() * 10000);
      S.current.timers.push(t);
    };
    scheduleBeep();

    // ── PERIODIC TROLLEY RATTLE ──────────────────────────────────────────────
    // Short burst of high-frequency noise — wheels on lino
    const scheduleRattle = () => {
      const t = setTimeout(() => {
        if (!S.current.ambientRunning) return;
        const now = ctx.currentTime;
        const rBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
        const rd = rBuf.getChannelData(0);
        for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
        const rSrc = ctx.createBufferSource();
        rSrc.buffer = rBuf;
        const rFilter = ctx.createBiquadFilter();
        rFilter.type = 'highpass';
        rFilter.frequency.value = 1800;
        const rGain = ctx.createGain();
        rGain.gain.setValueAtTime(0.04, now);
        rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        rSrc.connect(rFilter);
        rFilter.connect(rGain);
        rGain.connect(master);
        rSrc.start(now);
        scheduleRattle();
      }, 9000 + Math.random() * 14000);
      S.current.timers.push(t);
    };
    scheduleRattle();
  };

  const stopAmbient = () => {
    S.current.ambientRunning = false;
    S.current.ambientNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    S.current.ambientNodes = [];
    S.current.timers.forEach(t => clearTimeout(t));
    S.current.timers = [];
    if (S.current.ctx) {
      S.current.ctx.close().catch(() => {});
      S.current.ctx = null;
      S.current.masterGain = null;
    }
  };

  const play = (type) => {
    const ctx = getCtx();
    const master = S.current.masterGain;

    if (type === 'ambient') {
      // no-op — use startAmbient() instead
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 800;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'footstep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 100;
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'chime') {
      const now = ctx.currentTime;
      [600, 900].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(master);
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
    } else if (type === 'thump') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  };

  return { play, startAmbient, stopAmbient, setVolume };
}

// ═══════════════════════════════════════════════════════════════════════════
// PET PICKER
// ═══════════════════════════════════════════════════════════════════════════

function PetPicker({ onStart }) {
  const [selected, setSelected] = useState('dragon');
  const [difficulty, setDifficulty] = useState('easy');

  return (
    <div style={{ padding: 24, textAlign: 'center', color: T.text, fontFamily: 'DM Sans' }}>
      <div style={{ fontSize: 80, marginBottom: 12 }}>🐉</div>
      <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, margin: '0 0 8px' }}>Pick your pet</h1>
      <p style={{ color: T.textDim, fontSize: 12, marginBottom: 20 }}>Who's going shopping?</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {PETS.map(pet => (
          <button key={pet.id} onClick={() => setSelected(pet.id)} style={{
            background: selected === pet.id ? T.cardHover : T.card,
            border: `2px solid ${selected === pet.id ? T.teal : T.borderStrong}`,
            borderRadius: 12, padding: 14, cursor: 'pointer', fontFamily: 'DM Sans',
          }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>{pet.emoji}</div>
            <div style={{ color: T.text, fontSize: 11, fontWeight: 700 }}>{pet.name}</div>
          </button>
        ))}
      </div>

      {/* Difficulty selector */}
      <div style={{ marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
          DIFFICULTY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => setDifficulty('easy')}
            style={{
              background: difficulty === 'easy' ? T.cardHover : T.card,
              border: `2px solid ${difficulty === 'easy' ? T.teal : T.borderStrong}`,
              borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'DM Sans',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🌱</span>
              <span style={{ color: T.text, fontSize: 13, fontWeight: 800 }}>Easy</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: T.amber }}>1–3 🎟️</span>
            </div>
            <div style={{ color: T.muted, fontSize: 10, lineHeight: 1.3 }}>
              Whole dollars, exact pay
            </div>
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            style={{
              background: difficulty === 'hard' ? T.cardHover : T.card,
              border: `2px solid ${difficulty === 'hard' ? T.amber : T.borderStrong}`,
              borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'DM Sans',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <span style={{ color: T.text, fontSize: 13, fontWeight: 800 }}>Hard</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: T.amber }}>2–5 🎟️</span>
            </div>
            <div style={{ color: T.muted, fontSize: 10, lineHeight: 1.3 }}>
              Cents, budget, work out change
            </div>
          </button>
        </div>
      </div>

      <button onClick={() => onStart(selected, difficulty)} style={{
        background: T.teal, color: T.bg, border: 'none', borderRadius: 14, padding: '14px 28px',
        fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans', width: '100%',
      }}>
        Start →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTURE SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════

function DepartureSequence({ petId, onArrived }) {
  const [step, setStep] = useState('home'); // home → walk_to_car → car_enter → driving → car_exit → shop_entrance
  const [petPos, setPetPos] = useState(0); // 0-100 for animations
  const { play } = useAmbientAudio();

  const steps_config = [
    { id: 'home', label: 'Walk to the car', desc: 'Pet leaves the house' },
    { id: 'walk_to_car', label: 'Get in the car', desc: 'Approaching the car' },
    { id: 'car_enter', label: 'Start driving', desc: 'Getting settled' },
    { id: 'driving', label: 'Arrive at shops', desc: 'Pulling up' },
    { id: 'car_exit', label: 'Get out', desc: 'Exit the car' },
    { id: 'shop_entrance', label: 'Enter the shop', desc: 'Go in' },
  ];

  const handleNext = async () => {
    play('beep');
    
    if (step === 'home') {
      setStep('walk_to_car');
      setPetPos(0);
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 20));
        setPetPos(i);
      }
    } else if (step === 'walk_to_car') {
      setStep('car_enter');
    } else if (step === 'car_enter') {
      setStep('driving');
      setPetPos(0);
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 30));
        setPetPos(i);
      }
    } else if (step === 'driving') {
      setStep('car_exit');
    } else if (step === 'car_exit') {
      setStep('shop_entrance');
      setPetPos(0);
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 20));
        setPetPos(i);
      }
    } else if (step === 'shop_entrance') {
      onArrived();
    }
  };

  const pet = PETS.find(p => p.id === petId);

  return (
    <div style={{ padding: 24, textAlign: 'center', color: T.text, fontFamily: 'DM Sans' }}>
      {/* Scene */}
      <div style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 12, padding: '24px', marginBottom: 20, minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {step === 'home' && (
          <>
            <div style={{ fontSize: 16, color: T.muted, marginBottom: 12 }}>🏠 Home</div>
            <div style={{ fontSize: 80, animation: 'bob 1.5s ease-in-out infinite' }}>{pet.emoji}</div>
          </>
        )}
        
        {step === 'walk_to_car' && (
          <>
            <div style={{ fontSize: 16, color: T.muted, marginBottom: 12 }}>Walking to the car...</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
              <div style={{ fontSize: 64, opacity: Math.min(1, petPos / 50) }}>{pet.emoji}</div>
              <div style={{ fontSize: 64, opacity: Math.max(0, 1 - petPos / 50) }}>🚗</div>
            </div>
          </>
        )}

        {step === 'car_enter' && (
          <>
            <div style={{ fontSize: 16, color: T.muted, marginBottom: 12 }}>Getting in the car</div>
            <div style={{ fontSize: 80, animation: 'bob 1.5s ease-in-out infinite' }}>🚗</div>
          </>
        )}

        {step === 'driving' && (
          <>
            <div style={{ fontSize: 16, color: T.muted, marginBottom: 12 }}>Driving to the shops...</div>
            <svg viewBox="0 0 200 120" style={{ width: 200, height: 120, marginBottom: 12 }}>
              {/* Road */}
              <rect y={60} width={200} height={30} fill="#444" />
              {/* Road lines */}
              <line x1={0} y1={75} x2={200} y2={75} stroke="#ffff00" strokeWidth={2} strokeDasharray="15,10" />
              {/* Car */}
              <rect x={30 + (petPos / 100) * 120} y={50} width={40} height={30} fill="#ff0000" rx={2} />
              <circle cx={40 + (petPos / 100) * 120} cy={80} r={3} fill="#333" />
              <circle cx={60 + (petPos / 100) * 120} cy={80} r={3} fill="#333" />
              {/* Scenery */}
              <rect x={10} y={30} width={20} height={30} fill="#228b22" />
              <rect x={150} y={35} width={25} height={25} fill="#228b22" />
            </svg>
            <div style={{ fontSize: 48 }}>🚗</div>
          </>
        )}

        {step === 'car_exit' && (
          <>
            <div style={{ fontSize: 16, color: T.muted, marginBottom: 12 }}>At the shops!</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
              <div style={{ fontSize: 64, animation: 'bob 1.5s ease-in-out infinite' }}>{pet.emoji}</div>
              <div style={{ fontSize: 64 }}>🛒</div>
            </div>
          </>
        )}

        {step === 'shop_entrance' && (
          <>
            <div style={{ fontSize: 16, color: T.muted, marginBottom: 12 }}>Entering the shop...</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 64, opacity: Math.max(0, 1 - petPos / 50) }}>{pet.emoji}</div>
              <div style={{ fontSize: 48, opacity: Math.min(1, petPos / 50) }}>🚪</div>
            </div>
          </>
        )}
      </div>

      {/* Info & button */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: T.teal, fontSize: 16, fontFamily: 'Syne', fontWeight: 800, margin: '0 0 4px' }}>
          {steps_config.find(s => s.id === step)?.label}
        </h2>
        <p style={{ color: T.textDim, fontSize: 12, margin: 0 }}>
          {steps_config.find(s => s.id === step)?.desc}
        </p>
      </div>

      <button onClick={handleNext} style={{
        background: T.teal, color: T.bg, border: 'none', borderRadius: 14, padding: '12px 24px',
        fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans', width: '100%',
      }}>
        {step === 'shop_entrance' ? 'Start shopping →' : 'Next →'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOP SECTIONS — each section has its own left and right shelf themes
// As pet walks through (petY changes), the aisle products change.
// ═══════════════════════════════════════════════════════════════════════════

const SHOP_SECTIONS = [
  {
    id: 'front',
    name: 'Entry & Checkout',
    yRange: [0, 1],
    signWorldY: 0,
    leftSign: 'EXIT',
    leftSignColor: '#1d3557',
    rightSign: 'CHECKOUT',
    rightSignColor: '#e63946',
  },
  {
    id: 'cereal',
    name: 'Cereal & Snacks',
    yRange: [2, 3],
    signWorldY: 2,
    leftSign: 'CEREAL',
    leftSignColor: '#2c5282',
    rightSign: 'SNACKS',
    rightSignColor: '#588157',
  },
  {
    id: 'dairy',
    name: 'Dairy & Bakery',
    yRange: [4, 5],
    signWorldY: 4,
    leftSign: 'DAIRY',
    leftSignColor: '#118ab2',
    rightSign: 'BAKERY',
    rightSignColor: '#e76f51',
  },
  {
    id: 'frozen',
    name: 'Frozen & Produce',
    yRange: [6, 7],
    signWorldY: 6,
    leftSign: 'FROZEN',
    leftSignColor: '#1d3557',
    rightSign: 'PRODUCE',
    rightSignColor: '#06a77d',
  },
];

function getCurrentSection(petY) {
  return SHOP_SECTIONS.find(s => petY >= s.yRange[0] && petY <= s.yRange[1]) || SHOP_SECTIONS[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOP MAP — top-down tile data
// Each tile char represents what's there. Pet can only walk on "." or "d".
// gridY=0 is the FRONT of the shop (entry/checkout); gridY=7 is the BACK.
// In screen rendering, gridY=0 is drawn at the BOTTOM so "forward" walks up.
// ═══════════════════════════════════════════════════════════════════════════

const GRID_W = 10;
const GRID_H = 8;

const SHOP_MAP = [
  // gridY=0 — front (walls + entry doors)
  ['#', '#', '#', '#', 'd', 'd', '#', '#', '#', '#'],
  // gridY=1 — checkout row
  ['c', 'c', 'c', 'c', '.', '.', 'c', 'c', 'c', 'c'],
  // gridY=2 — front aisle (pet starts here at col 2)
  ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
  // gridY=3 — shelf row (cereal & snacks)
  ['.', '.', 's', 's', '.', 's', 's', 's', '.', '.'],
  // gridY=4 — shelf row (cereal & snacks)
  ['.', '.', 's', 's', '.', 's', 's', 's', '.', '.'],
  // gridY=5 — shelf row + side dept walls
  ['m', '.', 's', 's', '.', 's', 's', 's', '.', 'b'],
  // gridY=6 — back aisle
  ['m', '.', '.', '.', '.', '.', '.', '.', '.', 'b'],
  // gridY=7 — back wall (produce | frozen)
  ['p', 'p', 'p', 'p', 'f', 'f', 'f', 'f', 'f', 'f'],
];

function tileAt(x, y) {
  if (y < 0 || y >= GRID_H || x < 0 || x >= GRID_W) return '#';
  return SHOP_MAP[y][x];
}

function isWalkable(x, y) {
  const t = tileAt(x, y);
  return t === '.' || t === 'd';
}

// Other shoppers placed on walkable tiles for ambient atmosphere
const SHOPPERS = [
  { x: 4, y: 2, hair: '#3a2611', shirt: '#f4a261' },
  { x: 6, y: 4, hair: '#1d1d1d', shirt: '#2a9d8f' },
  { x: 1, y: 6, hair: '#c97b3c', shirt: '#e76f51' },
  { x: 7, y: 6, hair: '#3a2611', shirt: '#118ab2' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHOPPING ITEMS — each lives in a specific department/shelf
// Pet collects by walking onto a tile adjacent to the item's location.
// ═══════════════════════════════════════════════════════════════════════════

const SG_GROCERY_ITEMS = [
  // === Cereal Aisle ===
  { id: 'cereal',    name: 'Cereal',    emoji: '🥣', dept: 'Cereal Aisle', x: 2, y: 4, price: 5, cents: 480 },
  { id: 'pasta',     name: 'Pasta',     emoji: '🍝', dept: 'Cereal Aisle', x: 3, y: 3, price: 2, cents: 220 },
  { id: 'oats',      name: 'Oats',      emoji: '🌾', dept: 'Cereal Aisle', x: 2, y: 3, price: 3, cents: 350 },
  { id: 'rice',      name: 'Rice',      emoji: '🍚', dept: 'Cereal Aisle', x: 3, y: 4, price: 4, cents: 425 },

  // === Snacks Aisle ===
  { id: 'crackers',  name: 'Crackers',  emoji: '🍘', dept: 'Snacks Aisle', x: 6, y: 3, price: 3, cents: 320 },
  { id: 'chips',     name: 'Chips',     emoji: '🥨', dept: 'Snacks Aisle', x: 5, y: 5, price: 4, cents: 380 },
  { id: 'cookies',   name: 'Cookies',   emoji: '🍪', dept: 'Snacks Aisle', x: 7, y: 4, price: 4, cents: 425 },
  { id: 'pretzels',  name: 'Pretzels',  emoji: '🥖', dept: 'Snacks Aisle', x: 7, y: 5, price: 3, cents: 295 },
  { id: 'chocolate', name: 'Chocolate', emoji: '🍫', dept: 'Snacks Aisle', x: 5, y: 3, price: 5, cents: 525 },

  // === Dairy ===
  { id: 'milk',      name: 'Milk',      emoji: '🥛', dept: 'Dairy',       x: 0, y: 5, price: 3, cents: 320 },
  { id: 'cheese',    name: 'Cheese',    emoji: '🧀', dept: 'Dairy',       x: 0, y: 6, price: 6, cents: 580 },
  { id: 'yoghurt',   name: 'Yoghurt',   emoji: '🍶', dept: 'Dairy',       x: 0, y: 5, price: 4, cents: 420 },
  { id: 'butter',    name: 'Butter',    emoji: '🧈', dept: 'Dairy',       x: 0, y: 6, price: 5, cents: 495 },

  // === Bakery ===
  { id: 'bread',     name: 'Bread',     emoji: '🍞', dept: 'Bakery',      x: 9, y: 5, price: 4, cents: 380 },
  { id: 'muffins',   name: 'Muffins',   emoji: '🧁', dept: 'Bakery',      x: 9, y: 6, price: 5, cents: 520 },
  { id: 'donuts',    name: 'Donuts',    emoji: '🍩', dept: 'Bakery',      x: 9, y: 5, price: 6, cents: 595 },
  { id: 'croissant', name: 'Croissant', emoji: '🥐', dept: 'Bakery',      x: 9, y: 6, price: 4, cents: 350 },

  // === Produce ===
  { id: 'apples',    name: 'Apples',    emoji: '🍎', dept: 'Produce',     x: 1, y: 7, price: 4, cents: 425 },
  { id: 'bananas',   name: 'Bananas',   emoji: '🍌', dept: 'Produce',     x: 3, y: 7, price: 2, cents: 220 },
  { id: 'carrots',   name: 'Carrots',   emoji: '🥕', dept: 'Produce',     x: 2, y: 7, price: 3, cents: 280 },
  { id: 'tomatoes',  name: 'Tomatoes',  emoji: '🍅', dept: 'Produce',     x: 3, y: 7, price: 4, cents: 395 },

  // === Frozen ===
  { id: 'icecream',  name: 'Ice cream',   emoji: '🍦', dept: 'Frozen',    x: 5, y: 7, price: 7, cents: 695 },
  { id: 'peas',      name: 'Frozen peas', emoji: '🫛', dept: 'Frozen',    x: 7, y: 7, price: 3, cents: 320 },
  { id: 'pizza',     name: 'Frozen pizza',emoji: '🍕', dept: 'Frozen',    x: 6, y: 7, price: 8, cents: 820 },
  { id: 'fries',     name: 'Frozen chips',emoji: '🍟', dept: 'Frozen',    x: 8, y: 7, price: 5, cents: 480 },
];

// Format cents as $X.XX
const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

// Hard mode: pick cash denominations to offer the teen at checkout.
// Returns the correct (smallest note covering total) + a too-small + a too-big distractor.
function getCashOptions(totalCents) {
  const notes = [200, 500, 1000, 2000, 5000, 10000]; // $2, $5, $10, $20, $50, $100
  const correct = notes.find(n => n >= totalCents) || notes[notes.length - 1];
  const correctIdx = notes.indexOf(correct);
  const tooSmall = notes[Math.max(0, correctIdx - 1)];
  const tooBig = notes[Math.min(notes.length - 1, correctIdx + 2)];
  // Make sure all 3 are unique
  const set = new Set([correct, tooSmall, tooBig]);
  // Pad with another denomination if needed
  if (set.size < 3) {
    for (const n of notes) {
      set.add(n);
      if (set.size === 3) break;
    }
  }
  return [...set].sort((a, b) => a - b);
}

// Hard mode: build change options. Correct + 2 plausible distractors.
function getChangeOptions(handedCents, totalCents) {
  const correct = handedCents - totalCents;
  const offsets = [-10, 10, -50, 50, 100, -100, 20, -20];
  const opts = new Set([correct]);
  let tries = 0;
  while (opts.size < 3 && tries < 30) {
    const off = offsets[Math.floor(Math.random() * offsets.length)];
    const cand = correct + off;
    if (cand >= 0 && cand !== correct) opts.add(cand);
    tries++;
  }
  return [...opts].sort((a, b) => a - b);
}

// Helper: pick distractor items from the same department (excluding the target)
function pickDistractors(target, count) {
  const sameDept = SG_GROCERY_ITEMS.filter(i => i.dept === target.dept && i.id !== target.id);
  const shuffled = [...sameDept].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Hard mode: build same-item variants at different price points (Save / Standard).
// All variants have the same baseId so picking ANY of them collects the list item,
// but the cheaper one is the budget-conscious choice.
function getVariants(target) {
  const cheapCents = Math.round(target.cents * 0.7 / 5) * 5; // round to 5c
  return [
    { ...target, variantId: target.id + '_save',     baseId: target.id, brand: 'Save',     cents: cheapCents },
    { ...target, variantId: target.id + '_standard', baseId: target.id, brand: 'Standard', cents: target.cents },
  ];
}

// Build shelf options. In easy mode: target + 2 same-dept distractors.
// In hard mode: 2 price variants of target + 1 same-dept distractor.
function buildShelfOptions(target, isHard) {
  if (isHard) {
    const variants = getVariants(target);
    const distractor = pickDistractors(target, 1)[0];
    if (!distractor) return variants.map(v => ({ ...v, variantId: v.variantId || v.id }));
    const distractorOpt = { ...distractor, variantId: distractor.id, baseId: distractor.id, brand: null };
    return [...variants, distractorOpt].sort(() => Math.random() - 0.5);
  } else {
    const distractors = pickDistractors(target, 2);
    return [target, ...distractors]
      .map(o => ({ ...o, variantId: o.id, baseId: o.id, brand: null }))
      .sort(() => Math.random() - 0.5);
  }
}

// Walking onto any of these tiles "reaches" the item
function adjacentTilesFor(item) {
  const offsets = [[-1,0],[1,0],[0,-1],[0,1]];
  return offsets.map(([dx, dy]) => ({ x: item.x + dx, y: item.y + dy }))
                .filter(t => isWalkable(t.x, t.y));
}

function pickShoppingList(n = 3) {
  // Pick n items from different departments where possible for route variety
  const byDept = {};
  for (const it of SG_GROCERY_ITEMS) {
    if (!byDept[it.dept]) byDept[it.dept] = [];
    byDept[it.dept].push(it);
  }
  const depts = Object.keys(byDept);
  const shuffled = [...depts].sort(() => Math.random() - 0.5);
  const list = [];
  for (let i = 0; i < n && i < shuffled.length; i++) {
    const pool = byDept[shuffled[i]];
    list.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return list;
}

// ═══════════════════════════════════════════════════════════════════════════
// TILE RENDERING — turns one map char into SVG at given screen position
// ═══════════════════════════════════════════════════════════════════════════

function Tile({ kind, x, y, size }) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  switch (kind) {
    case '.':
      return <rect x={x} y={y} width={size} height={size} fill="#f0ece6" stroke="#e0dccc" strokeWidth="0.4" />;
    case '#':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#5a4a3a" />
          <rect x={x} y={y} width={size} height={size} fill="none" stroke="#3a2e22" strokeWidth="0.5" />
        </g>
      );
    case 'd':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#a87850" />
          <rect x={x + 4} y={y + 4} width={size - 8} height={size - 8} fill="#dda15e" stroke="#8b6f47" strokeWidth="0.5" />
          <circle cx={x + size - 8} cy={cy} r="1.2" fill="#3a2611" />
        </g>
      );
    case 'c':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#e8e4dc" />
          <rect x={x + 2} y={y + 2} width={size - 4} height={size - 4} fill="#6b5541" />
          <rect x={x + 5} y={y + 5} width={size - 10} height={6} fill="#222" />
          <rect x={x + 8} y={y + 14} width={size - 16} height={size - 20} fill="#1d3557" />
          <rect x={x + 10} y={y + 16} width={size - 20} height={4} fill="#a8dadc" />
        </g>
      );
    case 's':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#a89070" />
          <rect x={x} y={y} width={size} height={size} fill="none" stroke="#6b5541" strokeWidth="0.6" />
          <rect x={x + 3} y={y + 3} width={size - 6} height={5} fill="#d62828" />
          <rect x={x + 3} y={y + 10} width={size - 6} height={5} fill="#003049" />
          <rect x={x + 3} y={y + 17} width={size - 6} height={5} fill="#ffba08" />
          <rect x={x + 3} y={y + 24} width={size - 6} height={5} fill="#06a77d" />
        </g>
      );
    case 'p':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#06a77d" />
          <rect x={x} y={y} width={size} height={size} fill="none" stroke="#386641" strokeWidth="0.5" />
          <circle cx={x + 8} cy={y + 9} r="3" fill="#e63946" />
          <circle cx={x + 22} cy={y + 11} r="3" fill="#fcbf49" />
          <circle cx={x + 14} cy={y + 22} r="3" fill="#9d0208" />
          <circle cx={x + 27} cy={y + 25} r="3" fill="#fcbf49" />
        </g>
      );
    case 'f':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#caf0f8" />
          <rect x={x + 2} y={y + 2} width={size - 4} height={size - 4} fill="#a8dadc" stroke="#5fa8d3" strokeWidth="0.5" />
          <rect x={x + 5} y={y + 5} width={5} height={5} fill="#fff" opacity="0.85" />
          <rect x={x + 14} y={y + 7} width={5} height={5} fill="#fff" opacity="0.85" />
          <rect x={x + 23} y={y + 5} width={5} height={5} fill="#fff" opacity="0.85" />
          <rect x={x + 8} y={y + 17} width={5} height={5} fill="#fff" opacity="0.85" />
          <rect x={x + 19} y={y + 19} width={5} height={5} fill="#fff" opacity="0.85" />
          <rect x={x + 25} y={y + 22} width={4} height={4} fill="#fff" opacity="0.85" />
        </g>
      );
    case 'm':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#bde0fe" />
          <rect x={x} y={y} width={size} height={size} fill="none" stroke="#118ab2" strokeWidth="0.5" />
          <rect x={x + 5} y={y + 4} width={6} height={10} fill="#fff" stroke="#118ab2" strokeWidth="0.4" />
          <rect x={x + 14} y={y + 4} width={6} height={10} fill="#fff" stroke="#118ab2" strokeWidth="0.4" />
          <rect x={x + 23} y={y + 4} width={6} height={10} fill="#fff" stroke="#118ab2" strokeWidth="0.4" />
          <rect x={x + 5} y={y + 18} width={9} height={9} fill="#fcbf49" rx="1" />
          <rect x={x + 17} y={y + 18} width={9} height={9} fill="#ffd166" rx="1" />
        </g>
      );
    case 'b':
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} fill="#fdf0d5" />
          <rect x={x} y={y} width={size} height={size} fill="none" stroke="#bc6c25" strokeWidth="0.5" />
          <rect x={x + 4} y={y + 5} width={11} height={8} fill="#bc6c25" rx="2" />
          <rect x={x + 18} y={y + 5} width={11} height={8} fill="#a87850" rx="2" />
          <ellipse cx={x + 10} cy={y + 22} rx="5" ry="4" fill="#dda15e" />
          <ellipse cx={x + 22} cy={y + 22} rx="5" ry="4" fill="#fcbf49" />
        </g>
      );
    default:
      return <rect x={x} y={y} width={size} height={size} fill="#eee" />;
  }
}

function FirstPersonShop({ petId, difficulty = 'easy', onBack }) {
  const isHard = difficulty === 'hard';
  // BUDGET in cents — pet has $25.00 to spend in hard mode
  // Hard mode budget: 85% of standard prices for the drawn items, rounded to nearest 50c.
  // Save brands (70% of standard) always fit comfortably.
  // One standard-instead-of-save is forgiven; two standard picks usually goes over.
  const BUDGET_CENTS = isHard
    ? Math.round(shoppingList.reduce((s, i) => s + i.cents, 0) * 0.85 / 50) * 50
    : 999999; // easy mode: effectively no budget limit
  const [petX, setPetX] = useState(2);
  const [petY, setPetY] = useState(2);
  const [feeling, setFeeling] = useState(2);
  const [activeEnc, setActiveEnc] = useState(null);
  const [encResult, setEncResult] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [stepCount, setStepCount] = useState(0);
  const [lastDir, setLastDir] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [shoppingList] = useState(() => pickShoppingList(3));
  const [collected, setCollected] = useState(new Set());
  const [paidPrices, setPaidPrices] = useState(new Map()); // itemId -> cents actually paid
  const [justCollected, setJustCollected] = useState(null); // for flash feedback
  const [paid, setPaid] = useState(false);
  const [checkoutAttempts, setCheckoutAttempts] = useState(0);
  const [handedCents, setHandedCents] = useState(null); // hard mode: how much cash teen handed cashier
  const [activeShelf, setActiveShelf] = useState(null); // { item, options } for shelf-pick modal
  const [shelfWrongPick, setShelfWrongPick] = useState(null); // id of wrong item to shake
  const [tooFarItem, setTooFarItem] = useState(null); // id of item teen tapped but pet is too far from
  const [ambientVolume, setAmbientVolumeState] = useState(0.25); // default: quiet
  const { play, startAmbient, stopAmbient, setVolume } = useAmbientAudio();

  // Start ambient on mount, stop on unmount
  useEffect(() => {
    return () => stopAmbient();
  }, []);

  // Propagate volume changes to the audio engine
  useEffect(() => {
    setVolume(ambientVolume);
  }, [ambientVolume]);

  const handleVolumeChange = (v) => {
    setAmbientVolumeState(v);
  };

  const [npcs, setNpcs] = useState(() => buildNpcs(isHard));
  const [activeNpcId, setActiveNpcId] = useState(null);
  const [activeHelper, setActiveHelper] = useState(null);
  const [restUsed, setRestUsed] = useState(false);
  const [hintItem, setHintItem] = useState(null);

  // Lookup helper: which NPC (if any) is standing on a tile, and which tiles are blocked
  const npcAt = (x, y) => npcs.find(n => !n.done && n.x === x && n.y === y);

  const handleMove = (dir) => {
    if (activeEnc || activeShelf || activeHelper || gameState !== 'playing') return;
    // Start ambient soundscape on first interaction (required by browser autoplay policy)
    startAmbient();

    let nx = petX, ny = petY;
    if (dir === 'forward') ny = petY + 1;     // deeper into shop
    if (dir === 'back') ny = petY - 1;        // back toward entry
    if (dir === 'left') nx = petX - 1;
    if (dir === 'right') nx = petX + 1;

    // Wall / shelf collision — block movement into non-walkable tiles
    if (!isWalkable(nx, ny)) {
      play('footstep');
      return;
    }

    // NPC collision — only STRESS NPCs block movement and trigger encounters.
    // Helper workers are non-blocking: pet walks past freely.
    // Helpers are interacted with by tapping their sprite on the map.
    const blockedBy = npcAt(nx, ny);
    if (blockedBy && blockedBy.kind === 'stress') {
      const enc = ENCOUNTERS_DATA.find(e => e.id === blockedBy.encId);
      setActiveNpcId(blockedBy.id);
      setActiveEnc(enc);
      setLastDir(dir);
      play('footstep');
      return;
    }

    const moved = nx !== petX || ny !== petY;

    setPetX(nx);
    setPetY(ny);
    if (moved) {
      setStepCount(s => s + 1);
      setLastDir(dir);
      setIsMoving(true);
      setTimeout(() => setIsMoving(false), 280);
    }
    play('footstep');

    // (Item collection no longer auto-triggers on adjacency — teen taps the
    // "look at shelf" button when they actually want to pick the item up.)

    // Win flow:
    // 1. Collect all items (via shelf modal)
    // 2. Walk into the checkout zone (row 1, between registers) → payment
    // 3. After payment, walk out through any door tile (row 0) → win
    const listDone = shoppingList.every(i => collected.has(i.id));

    // Trigger checkout when listDone and pet enters the checkout-passage tile
    if (listDone && !paid && gameState === 'playing' && ny === 1 && (nx === 4 || nx === 5)) {
      setGameState('checkout');
    }

    // Win when paid and pet steps onto any door tile
    if (paid && tileAt(nx, ny) === 'd') {
      setGameState('won');
    }
  };

  const handleChoice = (choice) => {
    const newFeeling = Math.max(1, Math.min(5, feeling + choice.delta));
    setFeeling(newFeeling);
    setEncResult({ choice, newFeeling });

    setTimeout(() => {
      // Mark the NPC as done so they step aside and the tile becomes walkable
      if (activeNpcId) {
        setNpcs(prev => prev.map(n => n.id === activeNpcId ? { ...n, done: true } : n));
      }
      setActiveEnc(null);
      setEncResult(null);
      setActiveNpcId(null);
      if (newFeeling >= 5) {
        setGameState('overflowed');
      }
    }, 2200);
  };

  // Shelf picker handlers
  const handleShelfPick = (picked) => {
    if (!activeShelf) return;
    // Picked baseId matches the target — any variant of the right item counts as correct
    if (picked.baseId === activeShelf.item.id) {
      setCollected(prev => {
        const next = new Set(prev);
        next.add(activeShelf.item.id);
        return next;
      });
      // Record actual price paid (variant cents in hard mode, catalog cents in easy)
      setPaidPrices(prev => {
        const next = new Map(prev);
        next.set(activeShelf.item.id, picked.cents);
        return next;
      });
      setJustCollected({ ...activeShelf.item, brand: picked.brand, paidCents: picked.cents });
      setTimeout(() => setJustCollected(null), 1400);
      play('chime');
      setActiveShelf(null);
      setShelfWrongPick(null);
    } else {
      // Wrong — shake the wrong item briefly
      setShelfWrongPick(picked.variantId);
      play('thump');
      setTimeout(() => setShelfWrongPick(null), 600);
    }
  };

  const handleShelfLeave = () => {
    setActiveShelf(null);
    setShelfWrongPick(null);
  };

  // Helper worker handlers (the friendly green-apron staff member)
  const handleHelperRest = () => {
    if (restUsed) return;
    const newFeeling = Math.max(1, feeling - 1);
    setFeeling(newFeeling);
    setRestUsed(true);
    play('chime');
    setActiveHelper(null);
  };

  const handleHelperHint = (item) => {
    // Teen chose a specific item to ask about — highlight it on the map for 5s
    setHintItem(item.id);
    setTimeout(() => setHintItem(null), 5000);
    setActiveHelper(null);
  };

  const handleHelperLeave = () => {
    setActiveHelper(null);
  };

  // ─── CHECKOUT SCENE ───────────────────────────────────────────────────────
  if (gameState === 'checkout') {
    const items = shoppingList;

    // Helper to always compute the live total from current paidPrices — avoids stale closures
    const computeTotal = () => isHard
      ? items.reduce((s, i) => s + (paidPrices.get(i.id) ?? i.cents), 0)
      : items.reduce((s, i) => s + i.price, 0) * 100;

    // Stable display value for the receipt
    const totalCents = computeTotal();

    // Easy mode: single-step exact pay
    // Hard mode: step 1 = give cash, step 2 = pick change
    const easyOptions = (() => {
      if (isHard) return [];
      const total = items.reduce((s, i) => s + i.price, 0);
      const opts = new Set([total]);
      while (opts.size < 3) {
        const offset = [1, 2, 3, -1, -2][Math.floor(Math.random() * 5)];
        const candidate = total + offset;
        if (candidate > 0) opts.add(candidate);
      }
      return [...opts].sort((a, b) => a - b);
    })();

    const cashOptions = isHard ? getCashOptions(totalCents) : [];
    const changeOptions = (isHard && handedCents !== null)
      ? getChangeOptions(handedCents, totalCents) : [];

    const handleEasyPayment = (amount) => {
      const totalDollars = items.reduce((s, i) => s + i.price, 0);
      if (amount === totalDollars) {
        play('chime');
        setPaid(true);
        setGameState('playing');
      } else {
        const newFeeling = Math.min(5, feeling + 1);
        setFeeling(newFeeling);
        setCheckoutAttempts(a => a + 1);
        play('thump');
        if (newFeeling >= 5) {
          setTimeout(() => setGameState('overflowed'), 600);
        }
      }
    };

    const handleCashPick = (cents) => {
      const liveTotalCents = computeTotal();
      if (cents >= liveTotalCents) {
        const correct = cashOptions.find(n => n >= liveTotalCents);
        if (cents === correct) {
          play('chime');
          setHandedCents(cents);
        } else {
          const newFeeling = Math.min(5, feeling + 1);
          setFeeling(newFeeling);
          setCheckoutAttempts(a => a + 1);
          play('thump');
          if (newFeeling >= 5) setTimeout(() => setGameState('overflowed'), 600);
        }
      } else {
        const newFeeling = Math.min(5, feeling + 1);
        setFeeling(newFeeling);
        setCheckoutAttempts(a => a + 1);
        play('thump');
        if (newFeeling >= 5) setTimeout(() => setGameState('overflowed'), 600);
      }
    };

    const handleChangePick = (cents) => {
      // Recompute total fresh here to avoid any stale closure issues
      const liveTotalCents = computeTotal();
      const correctChange = handedCents - liveTotalCents;
      if (cents === correctChange) {
        play('chime');
        setPaid(true);
        setHandedCents(null); // clean up after successful payment
        setGameState('playing');
      } else {
        const newFeeling = Math.min(5, feeling + 1);
        setFeeling(newFeeling);
        setCheckoutAttempts(a => a + 1);
        play('thump');
        if (newFeeling >= 5) setTimeout(() => setGameState('overflowed'), 600);
      }
    };

    return (
      <div style={{ padding: 20, color: T.text, fontFamily: 'DM Sans', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🛒</div>
          <h2 style={{ color: T.teal, fontSize: 22, fontFamily: 'Syne', fontWeight: 800, margin: '0 0 4px' }}>
            At the checkout
          </h2>
          <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>
            {!isHard
              ? 'The cashier scans your items. Time to pay.'
              : handedCents === null
                ? 'The cashier scans your items. What note should you give?'
                : 'The cashier rings up your total. Check your change.'}
          </p>
        </div>

        {/* Receipt */}
        <div style={{
          background: '#fff', color: '#222', padding: 16, borderRadius: 8,
          fontFamily: 'monospace', fontSize: 13, marginBottom: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #999', paddingBottom: 8, marginBottom: 8, fontWeight: 800 }}>
            ━━━ HATCH MART ━━━
          </div>
          {items.map(item => {
            const paidCents = paidPrices.get(item.id) ?? item.cents;
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{item.emoji} {item.name}</span>
                <span>{isHard ? formatPrice(paidCents) : `$${item.price}.00`}</span>
              </div>
            );
          })}
          <div style={{ borderTop: '1px dashed #999', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
            <span>TOTAL</span>
            <span>{isHard ? formatPrice(totalCents) : `$${items.reduce((s, i) => s + i.price, 0)}.00`}</span>
          </div>
          {isHard && handedCents !== null && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                <span>You gave</span>
                <span>{formatPrice(handedCents)}</span>
              </div>
              <div style={{ borderTop: '1px dashed #999', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: T.green }}>
                <span>CHANGE</span>
                <span>?</span>
              </div>
            </>
          )}
        </div>

        {checkoutAttempts > 0 && (
          <div style={{
            background: `${T.amber}22`, border: `1px solid ${T.amber}`,
            color: T.amber, padding: 10, borderRadius: 8, fontSize: 12,
            marginBottom: 12, textAlign: 'center', fontWeight: 700,
          }}>
            Not quite — pet's getting stressed. {isHard ? 'Use the calculator to check your math.' : 'Check the receipt and add carefully.'}
          </div>
        )}

        {/* Pet's patience at checkout — stakes are visible */}
        {(() => {
          const patience = Math.max(0, 6 - feeling);
          const colors = ['#FF4D4D', '#FF8C42', T.amber, T.teal, T.green];
          return (
            <div style={{ marginBottom: 12, padding: 8, background: T.surface, borderRadius: 8, border: `1px solid ${T.borderStrong}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>🧘 Pet's patience</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: patience <= 1 ? '#FF4D4D' : patience <= 2 ? T.amber : T.green }}>
                  {patience <= 1 ? 'Nearly overwhelmed!' : patience <= 2 ? 'Getting stressed' : 'Hanging in there'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[5, 4, 3, 2, 1].map(n => (
                  <div key={n} style={{
                    flex: 1, height: 8, borderRadius: 2,
                    background: n <= patience ? colors[n - 1] : T.bg,
                    border: `1px solid ${T.borderStrong}`,
                  }} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* === EASY MODE: single-step exact-amount pick === */}
        {!isHard && (
          <>
            <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13, textAlign: 'center', color: T.textDim }}>
              How much do you need to give the cashier?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {easyOptions.map(amt => (
                <button
                  key={amt}
                  onClick={() => handleEasyPayment(amt)}
                  style={{
                    background: T.card, color: T.text,
                    border: `2px solid ${T.borderStrong}`, borderRadius: 12,
                    padding: '14px 8px', fontSize: 18, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = T.teal}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = T.borderStrong}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, color: T.muted, fontSize: 11, textAlign: 'center', fontStyle: 'italic' }}>
              Tip: add up the prices on your receipt
            </div>
          </>
        )}

        {/* === HARD MODE STEP 1: pick cash to hand over === */}
        {isHard && handedCents === null && (
          <>
            <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13, textAlign: 'center', color: T.textDim }}>
              What's the smallest note that covers the total?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {cashOptions.map(amt => (
                <button
                  key={amt}
                  onClick={() => handleCashPick(amt)}
                  style={{
                    background: T.card, color: T.text,
                    border: `2px solid ${T.borderStrong}`, borderRadius: 12,
                    padding: '14px 8px', cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = T.teal}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = T.borderStrong}
                >
                  <div style={{ fontSize: 22, marginBottom: 2 }}>💵</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{formatPrice(amt)}</div>
                </button>
              ))}
            </div>
            <Calculator />
          </>
        )}

        {/* === HARD MODE STEP 2: pick correct change === */}
        {isHard && handedCents !== null && (
          <>
            <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13, textAlign: 'center', color: T.textDim }}>
              You gave <span style={{ color: T.teal, fontWeight: 800 }}>{formatPrice(handedCents)}</span>.
              How much change should you get back?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {changeOptions.map(amt => (
                <button
                  key={amt}
                  onClick={() => handleChangePick(amt)}
                  style={{
                    background: T.card, color: T.text,
                    border: `2px solid ${T.borderStrong}`, borderRadius: 12,
                    padding: '14px 8px', cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = T.teal}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = T.borderStrong}
                >
                  <div style={{ fontSize: 22, marginBottom: 2 }}>🪙</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{formatPrice(amt)}</div>
                </button>
              ))}
            </div>
            <Calculator />
            <div style={{ marginTop: 14, color: T.muted, fontSize: 11, textAlign: 'center', fontStyle: 'italic' }}>
              Tip: change = what you gave − the total
            </div>
          </>
        )}
      </div>
    );
  }

  // Reset all run state for a fresh attempt
  const resetGame = () => {
    setPetX(2);
    setPetY(2);
    setFeeling(2);
    setActiveEnc(null);
    setEncResult(null);
    setGameState('playing');
    setStepCount(0);
    setLastDir(null);
    setIsMoving(false);
    setCollected(new Set());
    setPaidPrices(new Map());
    setJustCollected(null);
    setPaid(false);
    setCheckoutAttempts(0);
    setHandedCents(null);
    setNpcs(buildNpcs(isHard));
    setActiveNpcId(null);
    setActiveHelper(null);
    setRestUsed(false);
    setHintItem(null);
    setActiveShelf(null);
    setShelfWrongPick(null);
    setTooFarItem(null);
  };

  if (gameState === 'won') {
    // Tickets: easy = 1-3, hard = 2-5
    const baseTickets = isHard ? 2 : 1;
    const perfectCheckoutBonus = checkoutAttempts === 0 ? 1 : 0;
    const stayedCalmBonus = feeling <= 3 ? 1 : 0;
    const onBudgetBonus = isHard && budgetLeftCents >= 0 ? 1 : 0;
    const ticketsEarned = baseTickets + perfectCheckoutBonus + stayedCalmBonus + onBudgetBonus;
    return (
      <div style={{ padding: 24, textAlign: 'center', color: T.text, fontFamily: 'DM Sans' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>✨</div>
        <h2 style={{ color: T.green, fontSize: 28, fontFamily: 'Syne', fontWeight: 800, margin: '0 0 8px' }}>Shopping done!</h2>
        <p style={{ color: T.textDim, fontSize: 13, marginBottom: 4 }}>Pet found everything, paid the cashier, and walked out.</p>
        <p style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>
          That was a lot to handle — well done.
          {isHard && ' Hard mode complete!'}
        </p>

        {/* Tickets earned */}
        <div style={{
          display: 'inline-block', background: `${T.amber}22`, border: `2px solid ${T.amber}`,
          padding: '12px 20px', borderRadius: 14, marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>
            TICKETS EARNED {isHard && '🔥'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>
            {'🎟️ '.repeat(ticketsEarned).trim()}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
            +{ticketsEarned} ticket{ticketsEarned === 1 ? '' : 's'}
            {isHard && <span style={{ color: T.amber }}> · hard mode</span>}
            {checkoutAttempts === 0 && <span style={{ color: T.green }}> · perfect checkout</span>}
            {feeling <= 3 && <span style={{ color: T.teal }}> · stayed calm</span>}
            {onBudgetBonus > 0 && <span style={{ color: T.green }}> · on budget</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => onBack({ tickets: ticketsEarned })} style={{
            background: T.teal, color: T.bg, border: 'none', borderRadius: 14, padding: '12px 24px',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans',
          }}>
            Back →
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'overflowed') {
    // Determine where the pet got overwhelmed for tailored messaging
    const overwhelmedAtCheckout = checkoutAttempts > 0 && !paid;
    return (
      <div style={{ padding: 24, textAlign: 'center', color: T.text, fontFamily: 'DM Sans' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>😩</div>
        <h2 style={{ color: T.amber, fontSize: 26, fontFamily: 'Syne', fontWeight: 800, margin: '0 0 8px' }}>
          Pet got overwhelmed
        </h2>
        <p style={{ color: T.textDim, fontSize: 13, marginBottom: 4, lineHeight: 1.5 }}>
          {overwhelmedAtCheckout
            ? 'The wrong amounts at checkout were too much for pet to handle.'
            : 'Too much in the shop today. Pet had to leave without finishing.'}
        </p>
        <p style={{ color: T.muted, fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
          That's okay — overwhelm happens. Try the run again when you're ready.
        </p>

        {/* No tickets banner */}
        <div style={{
          display: 'inline-block', background: `${T.red}15`, border: `2px solid ${T.red}55`,
          padding: '10px 18px', borderRadius: 14, marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>
            TICKETS EARNED
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.red, opacity: 0.7 }}>
            🎟️ × 0
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
            no tickets — finish the run to earn
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={resetGame} style={{
            background: T.teal, color: T.bg, border: 'none', borderRadius: 14, padding: '12px 24px',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans',
          }}>
            Try again ↻
          </button>
          <button onClick={() => onBack({ tickets: 0 })} style={{
            background: T.card, color: T.text, border: `1px solid ${T.borderStrong}`, borderRadius: 14,
            padding: '12px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans',
          }}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const pet = PETS.find(p => p.id === petId);
  const currentSection = getCurrentSection(petY);
  // Subtle scroll jiggle within an aisle — moves products slightly each step to suggest motion
  const scrollOffset = ((stepCount * 6) % 12) - 6;

  // Budget calculation (hard mode): sum the actual prices paid for collected items
  const basketTotalCents = shoppingList
    .filter(i => collected.has(i.id))
    .reduce((s, i) => s + (paidPrices.get(i.id) ?? i.cents), 0);
  const budgetLeftCents = BUDGET_CENTS - basketTotalCents;

  // Teen taps a HELPER worker on the map — opens helper modal if adjacent
  const handleHelperMapClick = (npc) => {
    const adj = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => petX === npc.x+dx && petY === npc.y+dy);
    if (adj || (petX === npc.x && petY === npc.y)) {
      setActiveHelper(npc);
    } else {
      setTooFarItem('helper_' + npc.id);
      setTimeout(() => setTooFarItem(null), 1200);
    }
  };
  // Only opens the shelf if the pet is adjacent (eye-spy: find it AND be next to it).
  // Otherwise flashes a "walk closer" signal on that item for 1.2s.
  const handleItemMapClick = (item) => {
    if (collected.has(item.id)) return;
    const adj = adjacentTilesFor(item);
    if (adj.some(t => t.x === petX && t.y === petY)) {
      const options = buildShelfOptions(item, isHard);
      setActiveShelf({ item, options });
    } else {
      setTooFarItem(item.id);
      setTimeout(() => setTooFarItem(null), 1200);
    }
  };

  return (
    <div style={{ padding: 20, color: T.text, fontFamily: 'DM Sans' }}>

      {/* Patience meter — at the very top so teen always knows pet's current state */}
      {(() => {
        // patience = inverse of feeling: feeling=1 → 5 bars, feeling=5 → 0 bars
        const patience = Math.max(0, 6 - feeling);
        const colors = ['#FF4D4D', '#FF8C42', T.amber, T.teal, T.green];
        const labels = ['😰 Overwhelmed', '😟 Struggling', '😐 Managing', '😊 Calm', '😄 Very calm'];
        const label = labels[Math.min(4, patience === 0 ? 0 : patience - 1)];
        return (
          <div style={{ marginBottom: 10, padding: '8px 12px', background: T.card, borderRadius: 10, border: `1px solid ${T.borderStrong}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 1 }}>🧘 PET'S PATIENCE</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: patience <= 1 ? '#FF4D4D' : patience <= 2 ? T.amber : T.green }}>
                {label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[5, 4, 3, 2, 1].map(n => (
                <div key={n} style={{
                  flex: 1, height: 8, borderRadius: 2,
                  background: n <= patience ? colors[n - 1] : T.surface,
                  border: `1px solid ${T.borderStrong}`,
                  transition: 'background 0.4s',
                }} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Shopping list — compact, at the top so map and arrows fit on one screen */}
      <div style={{ marginBottom: 12, padding: 10, background: T.card, borderRadius: 10, border: `1px solid ${T.borderStrong}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 12, fontFamily: 'Syne', letterSpacing: 1 }}>
              🛒 SHOPPING LIST
            </span>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: isHard ? `${T.amber}33` : `${T.green}33`,
              color: isHard ? T.amber : T.green,
              letterSpacing: 0.5,
            }}>
              {isHard ? '🔥 HARD' : '🌱 EASY'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>
            {[...collected].filter(id => shoppingList.find(i => i.id === id)).length} / {shoppingList.length}
            {paid && <span style={{ marginLeft: 8, color: T.green }}>• PAID ✓</span>}
          </div>
        </div>

        {/* Hard mode: budget bar */}
        {isHard && !paid && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10, fontWeight: 700 }}>
              <span style={{ color: T.muted }}>💰 BUDGET</span>
              <span style={{
                color: budgetLeftCents < 0 ? T.red : budgetLeftCents < 100 ? T.amber : T.green,
                fontFamily: 'monospace',
              }}>
                {budgetLeftCents < 0
                  ? `${formatPrice(Math.abs(budgetLeftCents))} OVER!`
                  : `${formatPrice(budgetLeftCents)} left`} / {formatPrice(BUDGET_CENTS)}
              </span>
            </div>
            <div style={{ height: 6, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, (budgetLeftCents / BUDGET_CENTS) * 100))}%`,
                background: budgetLeftCents < 0 ? T.red : budgetLeftCents < 100 ? T.amber : T.green,
                transition: 'width 0.3s, background 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>
              💚 Save Brand = safe &nbsp;·&nbsp; Standard = check the price first
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {shoppingList.map(item => {
            const done = collected.has(item.id);
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 8px', borderRadius: 14,
                background: done ? `${T.green}22` : T.surface,
                border: `1px solid ${done ? T.green : T.borderStrong}`,
                opacity: done ? 0.65 : 1,
                fontSize: 11, fontWeight: 700,
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: 13, filter: done ? 'grayscale(0.7)' : 'none' }}>{item.emoji}</span>
                <span style={{ textDecoration: done ? 'line-through' : 'none' }}>{item.name}</span>
                <span style={{ color: T.muted, fontSize: 9, fontWeight: 600 }}>· {done ? '✓' : item.dept}</span>
                {isHard && !done && (
                  <span style={{ color: T.amber, fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatPrice(item.cents)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {shoppingList.every(i => collected.has(i.id)) && !paid && (
          <div style={{ marginTop: 8, padding: 6, background: `${T.green}33`, borderRadius: 5, fontSize: 11, fontWeight: 700, textAlign: 'center', color: T.green }}>
            All items! Walk to the checkout passage between the registers 🛒
          </div>
        )}
        {paid && (
          <div style={{ marginTop: 8, padding: 8, background: `${T.teal}33`, borderRadius: 5, fontWeight: 700, textAlign: 'center', color: T.teal }}>
            <div style={{ fontSize: 13, marginBottom: 3 }}>Paid! 🎉 Walk out through the doors</div>
            <div style={{ fontSize: 11, color: T.muted }}>
              The doors are at the bottom of the map — press <strong style={{ color: T.teal }}>↓</strong> to walk out
            </div>
          </div>
        )}
      </div>

      {/* Top-down shop floor plan */}
      <div style={{ border: `2px solid ${T.borderStrong}`, borderRadius: 12, marginBottom: 16, aspectRatio: '4/3', overflow: 'hidden', background: '#0a0f1a', position: 'relative' }}>
        <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <radialGradient id="petGlow">
              <stop offset="0%" stopColor={T.teal} stopOpacity="0.55" />
              <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="encounterGlow">
              <stop offset="0%" stopColor={T.amber} stopOpacity="0.7" />
              <stop offset="100%" stopColor={T.amber} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="goalGlow">
              <stop offset="0%" stopColor={T.green} stopOpacity="0.6" />
              <stop offset="100%" stopColor={T.green} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background outside the shop (the world beyond the walls) */}
          <rect width="400" height="300" fill="#0a0f1a" />

          {/* === MAP TILES === */}
          {(() => {
            const ts = 36;
            const ox = 20;
            const oy = 6;
            // gridY=0 at BOTTOM of screen, gridY=7 at TOP (forward arrow walks pet upward)
            const tiles = [];
            for (let gy = 0; gy < GRID_H; gy++) {
              for (let gx = 0; gx < GRID_W; gx++) {
                tiles.push(
                  <Tile key={`${gx},${gy}`} kind={tileAt(gx, gy)}
                        x={ox + gx * ts} y={oy + (GRID_H - 1 - gy) * ts} size={ts} />
                );
              }
            }
            return tiles;
          })()}

          {/* === DEPARTMENT LABELS === */}
          {(() => {
            const ts = 36;
            const ox = 20;
            const oy = 6;
            const yScr = (gy) => oy + (GRID_H - 1 - gy) * ts;
            return (
              <>
                {/* PRODUCE — back-left wall */}
                <text x={ox + 2 * ts} y={yScr(7) + 22} fontSize="11" fontWeight="800"
                      textAnchor="middle" fill="#fff" fontFamily="Syne" letterSpacing="1.8">PRODUCE</text>
                {/* FROZEN — back-right wall */}
                <text x={ox + 7 * ts} y={yScr(7) + 22} fontSize="11" fontWeight="800"
                      textAnchor="middle" fill="#1d3557" fontFamily="Syne" letterSpacing="1.8">FROZEN</text>
                {/* DAIRY — left wall, vertical */}
                <g transform={`translate(${ox + 18}, ${yScr(5) + ts}) rotate(-90)`}>
                  <text x="0" y="0" fontSize="9" fontWeight="800" textAnchor="middle"
                        fill="#118ab2" fontFamily="Syne" letterSpacing="1.4">DAIRY</text>
                </g>
                {/* BAKERY — right wall, vertical */}
                <g transform={`translate(${ox + 9 * ts + 18}, ${yScr(5) + ts}) rotate(-90)`}>
                  <text x="0" y="0" fontSize="9" fontWeight="800" textAnchor="middle"
                        fill="#bc6c25" fontFamily="Syne" letterSpacing="1.4">BAKERY</text>
                </g>
                {/* CHECKOUT — across checkout row */}
                <text x={ox + 2 * ts} y={yScr(1) + 13} fontSize="7" fontWeight="800"
                      textAnchor="middle" fill="#fff" fontFamily="Syne" letterSpacing="1.4" opacity="0.9">CHECKOUT</text>
                <text x={ox + 8 * ts} y={yScr(1) + 13} fontSize="7" fontWeight="800"
                      textAnchor="middle" fill="#fff" fontFamily="Syne" letterSpacing="1.4" opacity="0.9">CHECKOUT</text>
                {/* ENTRY — door tiles */}
                <text x={ox + 4.5 * ts + 18} y={yScr(0) + 22} fontSize="6" fontWeight="800"
                      textAnchor="middle" fill="#3a2611" fontFamily="Syne" letterSpacing="1.2">ENTRY</text>
              </>
            );
          })()}

          {/* === OTHER SHOPPERS === */}
          {(() => {
            const ts = 36;
            const ox = 20;
            const oy = 6;
            return SHOPPERS.map((s, i) => {
              const sx = ox + s.x * ts + ts / 2;
              const sy = oy + (GRID_H - 1 - s.y) * ts + ts / 2;
              const wobble = Math.sin((stepCount + i * 0.7) * 0.8) * 1.2;
              return (
                <g key={i} transform={`translate(${sx}, ${sy + wobble})`}>
                  <ellipse cx="0" cy="9" rx="6" ry="2" fill="#000" opacity="0.3" />
                  <ellipse cx="0" cy="2" rx="6" ry="7" fill={s.shirt} />
                  <circle cx="0" cy="-5" r="4.5" fill="#e9c39d" />
                  <path d="M -4 -7 Q 0 -10 4 -7 L 4 -3 Q 0 -1 -4 -3 Z" fill={s.hair} />
                </g>
              );
            });
          })()}

          {/* === NPC CHARACTERS (Pokémon-style — encounter triggered when pet bumps into them) === */}
          {(() => {
            const ts = 36;
            const ox = 20;
            const oy = 6;
            return npcs.map((npc) => {
              const sx = ox + npc.x * ts + ts / 2;
              const sy = oy + (GRID_H - 1 - npc.y) * ts + ts / 2;
              const wobble = Math.sin((stepCount + npc.x * 0.5 + npc.y * 0.7) * 0.6) * 1.2;
              const isActive = activeNpcId === npc.id;
              const isHelper = npc.kind === 'helper';
              const isTooFarHelper = tooFarItem === 'helper_' + npc.id;
              const isHelperNearby = isHelper && [[-1,0],[1,0],[0,-1],[0,1]].some(
                ([dx,dy]) => petX === npc.x+dx && petY === npc.y+dy
              );
              if (npc.done) return null;
              return (
                <g
                  key={npc.id}
                  transform={`translate(${sx}, ${sy + wobble})`}
                  onClick={isHelper ? () => handleHelperMapClick(npc) : undefined}
                  style={isHelper ? { cursor: 'pointer' } : undefined}
                >
                  {/* Awareness halo — green glow for helper, amber for stress NPCs */}
                  <circle cx="0" cy="0" r="14" fill={isHelper ? 'url(#goalGlow)' : 'url(#encounterGlow)'}>
                    <animate attributeName="r" values="12;16;12" dur={isHelper ? "2.4s" : "2s"} repeatCount="indefinite" />
                  </circle>

                  {/* Helper: stronger ring when pet is adjacent (ready to tap) */}
                  {isHelperNearby && (
                    <circle cx="0" cy="0" r="17" fill="none" stroke={T.green} strokeWidth="2.5">
                      <animate attributeName="r" values="15;20;15" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Too-far flash for helper */}
                  {isTooFarHelper && (
                    <>
                      <circle cx="0" cy="0" r="18" fill={T.amber} opacity="0.4">
                        <animate attributeName="r" values="14;22;14" dur="0.4s" repeatCount="3" />
                      </circle>
                      <g>
                        <rect x="-28" y="-28" width="56" height="14" fill="rgba(5,11,20,0.9)" rx="4" />
                        <text x="0" y="-18" fontSize="8" textAnchor="middle" fill={T.amber} fontWeight="800">Walk closer!</text>
                      </g>
                    </>
                  )}

                  {/* Shadow */}
                  <ellipse cx="0" cy="11" rx="8" ry="2" fill="#000" opacity="0.35" />

                  {/* Accessories — drawn behind body where appropriate */}
                  {npc.look.accessory === 'ladder' && (
                    <g>
                      <line x1="-7" y1="-12" x2="-9" y2="10" stroke="#a87850" strokeWidth="1.5" />
                      <line x1="7" y1="-12" x2="9" y2="10" stroke="#a87850" strokeWidth="1.5" />
                      <line x1="-8" y1="-4" x2="8" y2="-4" stroke="#a87850" strokeWidth="1.2" />
                      <line x1="-8.5" y1="3" x2="8.5" y2="3" stroke="#a87850" strokeWidth="1.2" />
                    </g>
                  )}
                  {npc.look.accessory === 'trolley' && (
                    <g transform="translate(8, 4)">
                      <rect x="-2" y="-6" width="9" height="6" fill="none" stroke="#888" strokeWidth="1" />
                      <line x1="-2" y1="-6" x2="-4" y2="-9" stroke="#888" strokeWidth="1" />
                      <circle cx="-1" cy="2" r="1.2" fill="#222" />
                      <circle cx="5" cy="2" r="1.2" fill="#222" />
                      <rect x="-1" y="-5" width="3" height="3" fill="#fcbf49" />
                      <rect x="3" y="-5" width="3" height="3" fill="#e63946" />
                    </g>
                  )}

                  {/* Body */}
                  <ellipse cx="0" cy="3" rx="6.5" ry="7.5" fill={npc.look.shirt} />
                  {/* Apron over body for helper */}
                  {npc.look.accessory === 'apron' && (
                    <>
                      <rect x="-4.5" y="-1" width="9" height="9" fill="#fff" opacity="0.85" rx="0.5" />
                      <line x1="-4.5" y1="-1" x2="-7" y2="-3" stroke="#fff" strokeWidth="0.8" opacity="0.85" />
                      <line x1="4.5" y1="-1" x2="7" y2="-3" stroke="#fff" strokeWidth="0.8" opacity="0.85" />
                    </>
                  )}
                  {/* Arms */}
                  <ellipse cx="-7" cy="2" rx="2" ry="4" fill={npc.look.shirt} />
                  <ellipse cx="7" cy="2" rx="2" ry="4" fill={npc.look.shirt} />
                  {/* Head */}
                  <circle cx="0" cy="-5" r="5" fill={npc.look.skin} />
                  {/* Hair */}
                  <path d="M -5 -7 Q 0 -11 5 -7 L 5 -2 Q 0 -1 -5 -2 Z" fill={npc.look.hair} />

                  {/* Held accessories */}
                  {npc.look.accessory === 'mic' && (
                    <g>
                      <line x1="6" y1="-1" x2="9" y2="-7" stroke="#444" strokeWidth="1.4" />
                      <ellipse cx="9.5" cy="-8" rx="2.2" ry="2.8" fill="#222" />
                      <ellipse cx="9.5" cy="-9" rx="1.8" ry="1.4" fill="#666" />
                    </g>
                  )}
                  {npc.look.accessory === 'phone' && (
                    <g>
                      <rect x="-3" y="-1" width="6" height="9" fill="#1d1d1d" rx="1" />
                      <rect x="-2.2" y="-0.2" width="4.4" height="7.4" fill="#5fa8d3" rx="0.3" />
                    </g>
                  )}
                  {npc.look.accessory === 'mop' && (
                    <g>
                      {/* Mop handle */}
                      <line x1="7" y1="-8" x2="10" y2="12" stroke="#a87850" strokeWidth="1.8" />
                      {/* Mop head */}
                      <ellipse cx="10.5" cy="13" rx="4" ry="2" fill="#ade8f4" opacity="0.9" />
                      <line x1="7" y1="11" x2="14" y2="13" stroke="#ade8f4" strokeWidth="1.2" />
                      <line x1="8" y1="12" x2="14" y2="15" stroke="#ade8f4" strokeWidth="1.2" />
                    </g>
                  )}

                  {/* Helper bubble (heart icon) — always present, shows they're a friendly resource */}
                  {isHelper && (
                    <g transform="translate(0, -16)">
                      <circle cx="0" cy="0" r="6" fill="#fff" stroke="#06a77d" strokeWidth="1" />
                      <text x="0" y="3" fontSize="8" textAnchor="middle">💚</text>
                    </g>
                  )}

                  {/* Exclamation bubble for active stress NPC */}
                  {isActive && (
                    <g transform="translate(0, -16)">
                      <circle cx="0" cy="0" r="6" fill="#fff" stroke="#222" strokeWidth="1" />
                      <text x="0" y="3" fontSize="9" textAnchor="middle" fontWeight="800" fill="#e63946">!</text>
                    </g>
                  )}
                </g>
              );
            });
          })()}

          {/* === SHOPPING LIST ITEM MARKERS — tap one to pick it up when pet is adjacent === */}
          {(() => {
            const ts = 36;
            const ox = 20;
            const oy = 6;
            return shoppingList.map((item) => {
              const sx = ox + item.x * ts + ts / 2;
              const sy = oy + (GRID_H - 1 - item.y) * ts + ts / 2;
              const isCollected = collected.has(item.id);
              const isHinted = hintItem === item.id;
              const isTooFar = tooFarItem === item.id;
              const adj = adjacentTilesFor(item);
              const isNearby = adj.some(t => t.x === petX && t.y === petY);

              if (isCollected) {
                return (
                  <g key={item.id} opacity="0.55">
                    <circle cx={sx} cy={sy} r="11" fill={T.green} opacity="0.3" />
                    <text x={sx} y={sy + 4} fontSize="12" textAnchor="middle">✓</text>
                  </g>
                );
              }

              return (
                <g
                  key={item.id}
                  onClick={() => handleItemMapClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hint pulse (from helper worker) */}
                  {isHinted && (
                    <>
                      <circle cx={sx} cy={sy} r="26" fill={T.amber} opacity="0.4">
                        <animate attributeName="r" values="22;30;22" dur="0.9s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={sx} cy={sy} r="20" fill="none" stroke={T.amber} strokeWidth="2">
                        <animate attributeName="r" values="18;26;18" dur="0.9s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* Too-far flash — amber shake when tapped from across the shop */}
                  {isTooFar && (
                    <circle cx={sx} cy={sy} r="20" fill={T.amber} opacity="0.5">
                      <animate attributeName="r" values="14;22;14" dur="0.4s" repeatCount="3" />
                    </circle>
                  )}

                  {/* "Walk here" ring — gentle glow when pet is adjacent, ready to tap */}
                  {isNearby && !isTooFar && (
                    <circle cx={sx} cy={sy} r="16" fill="none" stroke={T.green} strokeWidth="2.5">
                      <animate attributeName="r" values="14;19;14" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Normal pulse (not nearby) */}
                  {!isNearby && (
                    <circle cx={sx} cy={sy} r="16" fill="url(#goalGlow)">
                      <animate attributeName="r" values="14;18;14" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* The marker itself */}
                  <circle cx={sx} cy={sy} r="12"
                    fill={isNearby ? T.green : `${T.green}cc`}
                    stroke={isNearby ? '#fff' : `${T.green}88`}
                    strokeWidth={isNearby ? 2 : 1} />
                  <text x={sx} y={sy + 5} fontSize="14" textAnchor="middle">{item.emoji}</text>

                  {/* "Walk closer" label when tapped too far */}
                  {isTooFar && (
                    <g>
                      <rect x={sx - 30} y={sy - 28} width={60} height={14} fill="rgba(5,11,20,0.9)" rx="4" />
                      <text x={sx} y={sy - 18} fontSize="8" textAnchor="middle" fill={T.amber} fontWeight="800">
                        Walk closer!
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })()}

          {/* === CHECKOUT GLOW (active when all items collected, before paying) === */}
          {(() => {
            const allDone = shoppingList.every(i => collected.has(i.id));
            if (!allDone || paid) return null;
            const ts = 36;
            const ox = 20;
            const oy = 6;
            // Pulse over the checkout passage (cols 4-5, row 1)
            const sx = ox + 4.5 * ts + ts / 2;
            const sy = oy + (GRID_H - 1 - 1) * ts + ts / 2;
            return (
              <g>
                <circle cx={sx} cy={sy} r="22" fill="url(#goalGlow)">
                  <animate attributeName="r" values="20;28;20" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <text x={sx} y={sy + 5} fontSize="16" textAnchor="middle">🛒</text>
              </g>
            );
          })()}

          {/* === EXIT GLOW (active after paying) === */}
          {(() => {
            if (!paid) return null;
            const ts = 36;
            const ox = 20;
            const oy = 6;
            // Pulse over the entry doors (cols 4-5, row 0)
            const sx = ox + 4.5 * ts + ts / 2;
            const sy = oy + (GRID_H - 1 - 0) * ts + ts / 2;
            return (
              <g>
                <circle cx={sx} cy={sy} r="22" fill="url(#goalGlow)">
                  <animate attributeName="r" values="20;28;20" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <text x={sx} y={sy + 5} fontSize="16" textAnchor="middle">🚪</text>
              </g>
            );
          })()}

          {/* === PET === */}
          {(() => {
            const ts = 36;
            const ox = 20;
            const oy = 6;
            const sx = ox + petX * ts + ts / 2;
            const sy = oy + (GRID_H - 1 - petY) * ts + ts / 2;
            const bobY = stepCount % 2 === 0 ? 0 : -2;
            return (
              <g style={{ transition: 'transform 0.18s ease-out' }}
                 transform={`translate(${sx}, ${sy + bobY})`}>
                <circle cx="0" cy="0" r="18" fill="url(#petGlow)" />
                <ellipse cx="0" cy="10" rx="9" ry="3" fill="#000" opacity="0.35" />
                <circle cx="0" cy="0" r="11" fill={T.teal} />
                <circle cx="0" cy="0" r="11" fill="none" stroke={T.bg} strokeWidth="1.5" />
                <text x="0" y="6" fontSize="18" textAnchor="middle">{pet.emoji}</text>
              </g>
            );
          })()}

          {/* === HUD overlay === */}
          <g>
            <rect x={5} y={5} width={148} height={18} fill="rgba(5,11,20,0.88)" rx="3" />
            <text x={79} y={17} fontSize="9" textAnchor="middle" fill={T.teal} fontWeight="800" fontFamily="DM Sans" letterSpacing="0.5">
              📍 {currentSection.name.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>

      {/* Just-collected toast */}
      {justCollected && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: T.green, color: '#fff', padding: '10px 16px', borderRadius: 10,
          fontWeight: 800, fontSize: 14, fontFamily: 'DM Sans',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 100,
          animation: 'fadeInOut 1.4s ease',
        }}>
          {justCollected.emoji} Got the {justCollected.name}!
        </div>
      )}

      {/* Sound volume control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5 }}>SHOP SOUNDS</span>
        {[
          { v: 0,    icon: '🔇', label: 'Off'    },
          { v: 0.25, icon: '🔉', label: 'Quiet'  },
          { v: 0.55, icon: '🔊', label: 'Normal' },
        ].map(({ v, icon, label }) => {
          const active = Math.abs(ambientVolume - v) < 0.05;
          return (
            <button
              key={v}
              onClick={() => handleVolumeChange(v)}
              title={label}
              style={{
                background: active ? T.card : 'transparent',
                border: `1px solid ${active ? T.teal : T.borderStrong}`,
                borderRadius: 8, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'DM Sans',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, color: active ? T.teal : T.muted,
                fontWeight: active ? 800 : 500,
                transition: 'all 0.15s',
              }}
            >
              <span>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Arrow pad — centred below the map */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: 6 }}>
          <div />
          <button onClick={() => handleMove('forward')} style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10, padding: 10, cursor: 'pointer', fontSize: 18, fontWeight: 700, color: T.text }}>↑</button>
          <div />
          <button onClick={() => handleMove('left')} style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10, padding: 10, cursor: 'pointer', fontSize: 18, fontWeight: 700, color: T.text }}>←</button>
          <button onClick={() => handleMove('back')} style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10, padding: 10, cursor: 'pointer', fontSize: 18, fontWeight: 700, color: T.text }}>↓</button>
          <button onClick={() => handleMove('right')} style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10, padding: 10, cursor: 'pointer', fontSize: 18, fontWeight: 700, color: T.text }}>→</button>
        </div>
      </div>

      {/* Encounter modal */}
      {activeEnc && (
        <EncounterModal
          encounter={activeEnc}
          result={encResult}
          onChoice={handleChoice}
          npc={npcs.find(n => n.id === activeNpcId)}
        />
      )}

      {/* Shelf-pick modal */}
      {activeShelf && (
        <ShelfModal
          shelf={activeShelf}
          wrongPickId={shelfWrongPick}
          onPick={handleShelfPick}
          onLeave={handleShelfLeave}
          isHard={isHard}
          budgetLeft={budgetLeftCents}
        />
      )}

      {/* Helper worker modal */}
      {activeHelper && (
        <HelperModal
          helper={activeHelper}
          restUsed={restUsed}
          uncollectedItems={shoppingList.filter(i => !collected.has(i.id))}
          onRest={handleHelperRest}
          onHint={handleHelperHint}
          onLeave={handleHelperLeave}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ENCOUNTER MODAL
// ═══════════════════════════════════════════════════════════════════════════

function Calculator() {
  const [open, setOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState(null);
  const [op, setOp] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const press = (key) => {
    if (key === 'C') {
      setDisplay('0'); setStored(null); setOp(null); setWaiting(false);
      return;
    }
    if (key === '⌫') {
      setDisplay(d => d.length <= 1 ? '0' : d.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (display.includes('.')) return;
      setDisplay(d => d + '.');
      return;
    }
    if ('0123456789'.includes(key)) {
      if (waiting) {
        setDisplay(key);
        setWaiting(false);
      } else {
        setDisplay(d => d === '0' ? key : d + key);
      }
      return;
    }
    if (['+', '−', '×', '÷'].includes(key)) {
      const cur = parseFloat(display);
      if (stored !== null && op && !waiting) {
        const result = compute(stored, cur, op);
        setDisplay(String(result));
        setStored(result);
      } else {
        setStored(cur);
      }
      setOp(key);
      setWaiting(true);
      return;
    }
    if (key === '=') {
      const cur = parseFloat(display);
      if (stored !== null && op) {
        const result = compute(stored, cur, op);
        setDisplay(String(Math.round(result * 100) / 100));
        setStored(null);
        setOp(null);
        setWaiting(true);
      }
      return;
    }
  };

  const compute = (a, b, oper) => {
    switch (oper) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: '100%', padding: '10px 12px',
        background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10,
        color: T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 16 }}>🧮</span>
        <span>Open calculator</span>
      </button>
    );
  }

  const keys = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '−'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.'],
  ];

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10,
      padding: 10, fontFamily: 'DM Sans',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: 1 }}>🧮 CALCULATOR</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowTips(t => !t)} style={{
            background: showTips ? T.amber : 'transparent',
            border: `1px solid ${showTips ? T.amber : T.borderStrong}`,
            borderRadius: 6, color: showTips ? T.bg : T.muted,
            fontSize: 10, fontWeight: 800, cursor: 'pointer', padding: '2px 7px',
          }}>
            💡 tips
          </button>
          <button onClick={() => setOpen(false)} style={{
            background: 'transparent', border: 'none', color: T.muted, fontSize: 11, cursor: 'pointer', fontWeight: 700,
          }}>close</button>
        </div>
      </div>

      {/* Tips panel */}
      {showTips && (
        <div style={{
          background: T.surface, border: `1px solid ${T.amber}`, borderRadius: 8,
          padding: 10, marginBottom: 10, fontSize: 11, lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 800, color: T.amber, marginBottom: 6, fontSize: 11, letterSpacing: 0.5 }}>
            HOW TO USE THIS CALCULATOR
          </div>
          <div style={{ color: T.textDim, marginBottom: 8 }}>
            <strong style={{ color: T.text }}>Step 1 — Add up your items:</strong><br />
            Type the first price → tap <span style={{ color: T.teal, fontWeight: 800 }}>+</span> → type next price → tap <span style={{ color: T.teal, fontWeight: 800 }}>+</span> → keep going → tap <span style={{ color: T.teal, fontWeight: 800 }}>=</span><br />
            <span style={{ color: T.muted, fontSize: 10 }}>e.g. 3.20 + 4.80 + 5.20 = 13.20</span>
          </div>
          <div style={{ color: T.textDim, marginBottom: 8 }}>
            <strong style={{ color: T.text }}>Step 2 — Pick the right note:</strong><br />
            Which note is big enough to cover the total?<br />
            <span style={{ color: T.muted, fontSize: 10 }}>If total is $8.80, you need a $10 note (not $5 — too small!)</span>
          </div>
          <div style={{ color: T.textDim }}>
            <strong style={{ color: T.text }}>Step 3 — Work out change:</strong><br />
            Type the note → tap <span style={{ color: T.teal, fontWeight: 800 }}>−</span> → type the total → tap <span style={{ color: T.teal, fontWeight: 800 }}>=</span><br />
            <span style={{ color: T.muted, fontSize: 10 }}>e.g. 10 − 8.80 = 1.20 ← that's your change</span>
          </div>
          <div style={{ marginTop: 8, padding: '6px 8px', background: `${T.amber}22`, borderRadius: 6, color: T.amber, fontSize: 10, fontWeight: 700 }}>
            💡 Tip: tap C to clear and start again if you make a mistake
          </div>
        </div>
      )}

      <div style={{
        background: '#0a0f1a', color: T.teal, padding: '10px 12px', borderRadius: 6,
        fontFamily: 'monospace', fontSize: 22, fontWeight: 800, textAlign: 'right',
        marginBottom: 8, minHeight: 36, overflow: 'hidden',
      }}>
        {op && <span style={{ color: T.muted, fontSize: 14, marginRight: 8 }}>{stored} {op}</span>}
        {display}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {keys.flat().map((k, i) => {
          const isOp = ['÷', '×', '−', '+', '='].includes(k);
          const isClear = k === 'C' || k === '⌫';
          const isWide = k === '0';
          return (
            <button
              key={i}
              onClick={() => press(k)}
              style={{
                gridColumn: isWide ? 'span 2' : 'auto',
                background: isOp ? T.teal : isClear ? T.amber : T.surface,
                color: isOp || isClear ? T.bg : T.text,
                border: 'none', borderRadius: 6, padding: '10px 0',
                fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Sans',
              }}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HelperModal({ helper, restUsed, uncollectedItems, onRest, onHint, onLeave }) {
  const [askingForItem, setAskingForItem] = React.useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.surface, border: `2px solid ${T.green}`, borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', fontFamily: 'DM Sans' }}>
        {/* NPC + speech bubble */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <NPCBig look={helper.look} />
          </div>
          <div style={{ flex: 1, position: 'relative', background: T.card, borderRadius: 12, padding: 12, border: `1px solid ${T.green}` }}>
            <div style={{ position: 'absolute', left: -8, bottom: 16, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${T.green}` }} />
            <div style={{ position: 'absolute', left: -6, bottom: 16, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${T.card}` }} />
            <div style={{ fontSize: 9, fontWeight: 800, color: T.green, letterSpacing: 1, marginBottom: 4 }}>STORE WORKER</div>
            <h3 style={{ color: T.text, fontSize: 14, fontFamily: 'Syne', fontWeight: 800, margin: '0 0 4px' }}>
              {askingForItem ? '"What item are you looking for?"' : '"Hey! Can I help you with anything?"'}
            </h3>
            <p style={{ color: T.textDim, fontSize: 11, margin: 0, lineHeight: 1.4 }}>
              {askingForItem ? "Tap the item and I'll point to it on the map." : "The worker smiles and waits patiently."}
            </p>
          </div>
        </div>

        {askingForItem ? (
          <>
            {uncollectedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 12, color: T.muted, fontSize: 12 }}>
                You've already found everything! 🎉
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                {uncollectedItems.map(item => (
                  <button key={item.id} onClick={() => onHint(item)} style={{
                    background: T.card, border: `1.5px solid ${T.green}`, borderRadius: 12,
                    padding: '12px 10px', cursor: 'pointer', fontFamily: 'DM Sans',
                    display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 24 }}>{item.emoji}</span>
                    <div>
                      <div style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                      <div style={{ color: T.muted, fontSize: 10 }}>{item.dept}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setAskingForItem(false)} style={{
              background: 'transparent', border: 'none', color: T.muted,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans',
              width: '100%', padding: 6, textAlign: 'center',
            }}>← Go back</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => setAskingForItem(true)} disabled={uncollectedItems.length === 0} style={{
              background: T.card, border: `1px solid ${uncollectedItems.length > 0 ? T.green : T.borderStrong}`,
              borderRadius: 10, padding: '10px 12px',
              cursor: uncollectedItems.length > 0 ? 'pointer' : 'not-allowed',
              textAlign: 'left', fontFamily: 'DM Sans', opacity: uncollectedItems.length === 0 ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🗺️</span>
                <div>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>"I'm looking for something on my list"</div>
                  <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>You choose the item — worker highlights it on the map.</div>
                </div>
              </div>
            </button>

            <button onClick={onRest} disabled={restUsed} style={{
              background: T.card, border: `1px solid ${restUsed ? T.borderStrong : T.teal}`,
              borderRadius: 10, padding: '10px 12px',
              cursor: restUsed ? 'not-allowed' : 'pointer',
              textAlign: 'left', fontFamily: 'DM Sans', opacity: restUsed ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🌿</span>
                <div>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>"I just need a moment" {restUsed && "(used)"}</div>
                  <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{restUsed ? "Already rested this trip." : "Worker gives you space. Patience +1."}</div>
                </div>
              </div>
            </button>

            <button onClick={onLeave} style={{
              background: 'transparent', border: `1px solid ${T.borderStrong}`,
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
              fontFamily: 'DM Sans', color: T.muted, fontSize: 11, fontWeight: 700,
            }}>
              "I'm okay, thanks"
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function ShelfModal({ shelf, wrongPickId, onPick, onLeave, isHard, budgetLeft }) {
  // shelf = { item, options }
  const dept = shelf.item.dept;
  const overBudget = isHard && shelf.item.cents > budgetLeft;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.surface, border: `2px solid ${T.teal}`, borderRadius: 16, padding: 20, maxWidth: 440, width: '100%', fontFamily: 'DM Sans' }}>
        {/* Header — what dept and what the pet needs */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 1.5, marginBottom: 4 }}>
            {dept.toUpperCase()}
          </div>
          <h3 style={{ color: T.text, fontSize: 16, fontFamily: 'Syne', fontWeight: 800, margin: 0 }}>
            Pet needs: <span style={{ color: T.teal }}>{shelf.item.emoji} {shelf.item.name}</span>
          </h3>
          <p style={{ color: T.muted, fontSize: 11, margin: '4px 0 0' }}>
            Pick the right one off the shelf
          </p>
        </div>

        {/* Hard mode: budget remaining bar */}
        {isHard && (
          <div style={{
            background: T.card, borderRadius: 8, padding: '8px 12px',
            border: `1px solid ${budgetLeft < 500 ? T.amber : T.borderStrong}`,
            marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 1 }}>BUDGET LEFT</div>
            <div style={{ fontSize: 16, fontFamily: 'Syne', fontWeight: 800, color: budgetLeft < 500 ? T.amber : T.green }}>
              {formatPrice(budgetLeft)}
            </div>
          </div>
        )}

        {/* Shelf graphic with items */}
        <div style={{
          background: 'linear-gradient(180deg, #c9a876 0%, #a87850 100%)',
          borderRadius: 10, padding: '20px 12px 14px',
          border: `2px solid #6b5541`,
          marginBottom: 14,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#6b5541', borderRadius: '8px 8px 0 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: 8 }}>
            {shelf.options.map((opt) => {
              const isWrong = wrongPickId === opt.variantId;
              const optOverBudget = isHard && opt.cents > budgetLeft;
              return (
                <button
                  key={opt.variantId}
                  onClick={() => onPick(opt)}
                  style={{
                    background: '#fff8ec',
                    border: `2px solid ${isWrong ? T.red : '#6b5541'}`,
                    borderRadius: 10,
                    padding: '10px 8px',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans',
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    animation: isWrong ? 'shake 0.5s ease' : 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => { if (!isWrong) e.currentTarget.style.borderColor = T.teal; }}
                  onMouseLeave={(e) => { if (!isWrong) e.currentTarget.style.borderColor = '#6b5541'; }}
                >
                  <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 4 }}>{opt.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#3a2611', lineHeight: 1.2 }}>{opt.name}</div>
                  {/* Brand label for variants in hard mode */}
                  {opt.brand && (
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: opt.brand === 'Save' ? '#06a77d' : '#888',
                      marginTop: 2, letterSpacing: 0.3,
                    }}>
                      {opt.brand === 'Save' ? '💚 Save Brand' : 'Standard'}
                    </div>
                  )}
                  {isHard && (
                    <div style={{
                      fontSize: 13, fontWeight: 800,
                      color: optOverBudget ? T.red : '#3a2611',
                      marginTop: 4, fontFamily: 'monospace',
                    }}>
                      {formatPrice(opt.cents)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ height: 4, background: '#6b5541', borderRadius: 2, marginTop: 8 }} />
        </div>

        {wrongPickId && (
          <div style={{
            background: `${T.amber}22`, border: `1px solid ${T.amber}`,
            color: T.amber, padding: 8, borderRadius: 8, fontSize: 11,
            textAlign: 'center', fontWeight: 700, marginBottom: 10,
          }}>
            Not that one — look for {shelf.item.emoji} {shelf.item.name}
            {isHard && shelf.item.cents > budgetLeft && ` (also: this is over budget!)`}
          </div>
        )}

        {isHard && overBudget && !wrongPickId && (
          <div style={{
            background: `${T.red}22`, border: `1px solid ${T.red}`,
            color: T.red, padding: 8, borderRadius: 8, fontSize: 11,
            textAlign: 'center', fontWeight: 700, marginBottom: 10,
          }}>
            ⚠️ {shelf.item.name} is over your budget — step back and skip it, or pick a cheaper item next time
          </div>
        )}

        <button onClick={onLeave} style={{
          background: 'transparent', border: 'none', color: T.muted,
          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans',
          width: '100%', padding: 6,
        }}>
          ← Step back, I'll come here later
        </button>
      </div>
    </div>
  );
}

function NPCBig({ look }) {
  // Larger version of the NPC sprite for the modal
  return (
    <svg viewBox="-30 -40 60 70" style={{ width: 110, height: 130 }}>
      {look.accessory === 'ladder' && (
        <g>
          <line x1="-14" y1="-30" x2="-18" y2="20" stroke="#a87850" strokeWidth="3" />
          <line x1="14" y1="-30" x2="18" y2="20" stroke="#a87850" strokeWidth="3" />
          <line x1="-16" y1="-10" x2="16" y2="-10" stroke="#a87850" strokeWidth="2.4" />
          <line x1="-17" y1="5" x2="17" y2="5" stroke="#a87850" strokeWidth="2.4" />
        </g>
      )}
      {look.accessory === 'trolley' && (
        <g transform="translate(16, 8)">
          <rect x="-4" y="-12" width="18" height="12" fill="none" stroke="#888" strokeWidth="2" />
          <line x1="-4" y1="-12" x2="-8" y2="-18" stroke="#888" strokeWidth="2" />
          <circle cx="-2" cy="4" r="2.4" fill="#222" />
          <circle cx="10" cy="4" r="2.4" fill="#222" />
          <rect x="-2" y="-10" width="6" height="6" fill="#fcbf49" />
          <rect x="6" y="-10" width="6" height="6" fill="#e63946" />
        </g>
      )}
      <ellipse cx="0" cy="22" rx="16" ry="3" fill="#000" opacity="0.3" />
      <ellipse cx="0" cy="6" rx="13" ry="15" fill={look.shirt} />
      <ellipse cx="-14" cy="4" rx="4" ry="8" fill={look.shirt} />
      <ellipse cx="14" cy="4" rx="4" ry="8" fill={look.shirt} />
      <circle cx="0" cy="-10" r="10" fill={look.skin} />
      <path d="M -10 -14 Q 0 -22 10 -14 L 10 -4 Q 0 -2 -10 -4 Z" fill={look.hair} />
      {/* Simple face */}
      <circle cx="-3.5" cy="-10" r="0.9" fill="#222" />
      <circle cx="3.5" cy="-10" r="0.9" fill="#222" />
      <path d="M -3 -6 Q 0 -4 3 -6" stroke="#222" strokeWidth="0.8" fill="none" />
      {look.accessory === 'mic' && (
        <g>
          <line x1="12" y1="-2" x2="18" y2="-14" stroke="#444" strokeWidth="2.8" />
          <ellipse cx="19" cy="-16" rx="4.4" ry="5.6" fill="#222" />
          <ellipse cx="19" cy="-18" rx="3.6" ry="2.8" fill="#666" />
        </g>
      )}
      {look.accessory === 'phone' && (
        <g>
          <rect x="-6" y="-2" width="12" height="18" fill="#1d1d1d" rx="2" />
          <rect x="-4.4" y="-0.4" width="8.8" height="14.8" fill="#5fa8d3" rx="0.6" />
        </g>
      )}
      {look.accessory === 'mop' && (
        <g>
          <line x1="14" y1="-16" x2="20" y2="24" stroke="#a87850" strokeWidth="3.6" />
          <ellipse cx="21" cy="26" rx="8" ry="4" fill="#ade8f4" opacity="0.9" />
          <line x1="14" y1="22" x2="28" y2="26" stroke="#ade8f4" strokeWidth="2.4" />
          <line x1="16" y1="24" x2="28" y2="30" stroke="#ade8f4" strokeWidth="2.4" />
        </g>
      )}
    </svg>
  );
}

function EncounterModal({ encounter, result, onChoice, npc }) {
  const typeColor = { regulation: T.teal, escalation: T.amber, social: T.purple, 'body-check': T.blue }[encounter.type];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.surface, border: `2px solid ${typeColor}`, borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', fontFamily: 'DM Sans' }}>
        {!result ? (
          <>
            {/* Pokémon-style intro: NPC sprite with speech bubble */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 }}>
              {npc && (
                <div style={{ flexShrink: 0 }}>
                  <NPCBig look={npc.look} />
                </div>
              )}
              <div style={{ flex: 1, position: 'relative', background: T.card, borderRadius: 12, padding: 12, border: `1px solid ${typeColor}` }}>
                {/* Speech bubble tail pointing left at NPC */}
                <div style={{ position: 'absolute', left: -8, bottom: 16, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${typeColor}` }} />
                <div style={{ position: 'absolute', left: -6, bottom: 16, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${T.card}` }} />
                <h3 style={{ color: T.text, fontSize: 15, fontFamily: 'Syne', fontWeight: 800, margin: 0 }}>{encounter.title}</h3>
                <p style={{ color: T.textDim, fontSize: 12, margin: '4px 0 0', lineHeight: 1.4 }}>{encounter.desc}</p>
              </div>
            </div>
            <div style={{ color: T.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>
              HOW DOES PET RESPOND?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {encounter.choices.map((choice, i) => (
                <button key={i} onClick={() => onChoice(choice)} style={{
                  background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 10,
                  padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = typeColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = T.borderStrong}
                >
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{choice.text}</div>
                  <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{choice.explanation}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{result.choice.delta < 0 ? '✓' : result.choice.delta === 0 ? '→' : '⚠️'}</div>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{result.choice.text}</div>
            <div style={{ color: T.textDim, fontSize: 11, marginBottom: 12 }}>{result.choice.explanation}</div>
            <div style={{ background: T.card, borderRadius: 10, padding: 10, display: 'inline-block' }}>
              <div style={{ color: T.muted, fontSize: 9, fontWeight: 700, marginBottom: 4 }}>FEELING NOW</div>
              <div style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 800, color: [T.green, T.teal, T.amber, '#FF8C42', T.red][result.newFeeling - 1] }}>
                {result.newFeeling}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════


// ─── SHOPPING GAME KEYFRAMES ────────────────────────────────────────────────
function ShoppingGameStyles() {
  return (
    <style>{`
      @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, -10px); } 15% { opacity: 1; transform: translate(-50%, 0); } 75% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -10px); } }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      @keyframes pulse { 0%, 100% { box-shadow: 0 0 12px rgba(0,167,125,0.4); } 50% { box-shadow: 0 0 24px rgba(0,167,125,0.7); } }
    `}</style>
  );
}

// ─── SHOPPING GAME EMBEDDED ACTIVITY ────────────────────────────────────────
function ShoppingGameActivity({ onFinish }) {
  const [screen, setScreen] = useState('picker');
  const [petId,  setPetId]  = useState('dragon');
  const [difficulty, setDifficulty] = useState('easy');

  const handleBack = (result) => {
    if (result && result.tickets > 0) {
      onFinish({ gameId: 'shopping_run', tickets: result.tickets });
    } else {
      onFinish({ gameId: 'shopping_run', tickets: 0 });
    }
  };

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      <ShoppingGameStyles />
      {screen === 'picker' && (
        <PetPicker onStart={(pet, diff) => { setPetId(pet); setDifficulty(diff); setScreen('departure'); }} />
      )}
      {screen === 'departure' && (
        <DepartureSequence petId={petId} onArrived={() => setScreen('shop')} />
      )}
      {screen === 'shop' && (
        <FirstPersonShop petId={petId} difficulty={difficulty} onBack={handleBack} />
      )}
    </div>
  );
}


// ─── LEARN SCREEN ────────────────────────────────────────────────────────────
function LearnScreen({ user, setUser }) {
  const [activeModule,   setActiveModule]   = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);

  const linked = getLinkedModules(user.goals);

  async function handleActivityFinish({ tickets }) {
    const updated = { ...user, tickets: (user.tickets || 0) + (tickets || 0) };
    setUser(updated);
    await storageSet('user:' + user.username, updated);
    setActiveActivity(null);
  }

  // ── Active game fullscreen ────────────────────────────────────────────────
  if (activeActivity && activeModule) {
    const mod        = LEARN_MODULES.find(m => m.id === activeModule);
    const act        = mod?.activities.find(a => a.id === activeActivity);
    const petEmoji   = ANIMALS.find(a => a.id === user.petType)?.emoji || '🐾';

    return (
      <div style={{ position: 'fixed', inset: 0, background: T.bg, zIndex: 60, display: 'flex', flexDirection: 'column', animation: 'sceneIn 0.3s ease-out' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
          <button onClick={() => setActiveActivity(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={24} color={T.text} />
          </button>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: act?.color || T.teal }}>
            {act?.emoji} {act?.title}
          </div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeActivity === 'set'   && <ClockGame_Set   petEmoji={petEmoji} onFinish={handleActivityFinish} />}
          {activeActivity === 'shopping_run' && <ShoppingGameActivity onFinish={handleActivityFinish} />}
          {activeActivity === 'match' && <ClockGame_Match                     onFinish={handleActivityFinish} />}
          {activeActivity === 'race'  && <ClockGame_Race  petEmoji={petEmoji} onFinish={handleActivityFinish} />}
          {activeActivity === 'build' && <ClockGame_Build petEmoji={petEmoji} onFinish={handleActivityFinish} />}
        </div>
      </div>
    );
  }

  // ── Module detail ─────────────────────────────────────────────────────────
  if (activeModule) {
    const mod = LEARN_MODULES.find(m => m.id === activeModule);
    if (!mod) { setActiveModule(null); return null; }
    return (
      <div style={{ position: 'fixed', inset: 0, background: T.bg, zIndex: 50, overflowY: 'auto', animation: 'sceneIn 0.3s ease-out' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.bg, zIndex: 1 }}>
          <button onClick={() => setActiveModule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={22} color={T.text} />
          </button>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: T.text }}>
            {mod.emoji} {mod.title}
          </div>
        </div>
        <div style={{ padding: '20px 20px 100px' }}>
          <p style={{ color: T.textDim, fontSize: 14, fontFamily: 'DM Sans', marginBottom: 24, lineHeight: 1.5 }}>{mod.tagline}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mod.activities.map(act => (
              <button key={act.id} onClick={() => setActiveActivity(act.id)} style={{
                background: T.card, border: `1.5px solid ${act.color}44`, borderLeft: `5px solid ${act.color}`,
                borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'DM Sans',
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{act.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 3 }}>{act.title}</div>
                  <div style={{ color: T.muted, fontSize: 12 }}>{act.desc}</div>
                </div>
                <ChevronRight size={18} color={act.color} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ ...pageStyle, paddingBottom: 100 }}>
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: T.text, letterSpacing: '-0.3px', marginBottom: 6 }}>Learn / Earn</h1>
      <p style={{ color: T.muted, fontSize: 13, fontFamily: 'DM Sans', marginBottom: 24 }}>
        Mini lessons that teach real-life skills — and earn tickets for {user.petName}.
      </p>

      {linked.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: T.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            🎯 For your goals
          </div>
          {linked.map(mod => (
            <div key={mod.id} style={{ marginBottom: 12 }}>
              <ModuleCard mod={mod} onOpen={() => setActiveModule(mod.id)} />
              <div style={{ padding: '8px 14px', background: `${T.teal}0a`, border: `1px solid ${T.teal}22`, borderTop: 'none', borderRadius: '0 0 14px 14px', marginTop: -4 }}>
                <div style={{ fontSize: 11, color: T.teal, fontFamily: 'DM Sans', fontWeight: 600 }}>
                  {mod.relatedLabel} · Linked to: {mod.linkedGoals.map(g => g.title).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          📚 More to explore
        </div>
        {LEARN_MODULES.map(mod => (
          <div key={mod.id} style={{ marginBottom: 12 }}>
            <ModuleCard mod={mod} onOpen={() => setActiveModule(mod.id)} />
          </div>
        ))}
        {[
          { emoji: '💰', title: 'Pet Learns Money',   tagline: 'Counting, budgeting, saving up',  color: T.amber },
          { emoji: '🍳', title: 'Pet Learns Cooking', tagline: 'Recipes, measurements, steps',    color: T.pink  },
          { emoji: '🚌', title: 'Pet Gets Around',    tagline: 'Maps, transport, finding your way', color: T.blue },
        ].map(t => (
          <div key={t.title} style={{
            background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 16,
            padding: '14px 16px', marginBottom: 10, opacity: 0.5,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>{t.emoji}</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: T.muted }}>{t.title}</div>
              <div style={{ color: T.subtle, fontSize: 11, marginTop: 2 }}>{t.tagline}</div>
            </div>
            <div style={{ marginLeft: 'auto', background: T.card, borderRadius: 8, padding: '4px 10px', fontSize: 10, color: T.subtle, fontWeight: 700, fontFamily: 'DM Sans' }}>
              COMING SOON
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ mod, onOpen }) {
  return (
    <button onClick={onOpen} style={{
      width: '100%', background: T.card,
      border: `1.5px solid ${mod.color}44`, borderRadius: 16,
      padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'DM Sans',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: `${mod.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
        {mod.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 3 }}>{mod.title}</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>{mod.tagline}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {mod.activities.map(a => (
            <span key={a.id} style={{ background: `${a.color}22`, color: a.color, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {a.emoji} {a.title.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>
      <ChevronRight size={18} color={mod.color} />
    </button>
  );
}



function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'home',    label: 'Home',    icon: HomeIcon },
    { id: 'goals',   label: 'Goals',   icon: Target },
    { id: 'learn',   label: 'Learn/Earn', icon: BookOpen },
    { id: 'shop',    label: 'Shop',    icon: ShoppingBag },
    { id: 'friends', label: 'Friends', icon: Users },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(13,24,37,0.92)', backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${T.border}`,
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 0 14px', zIndex: 10,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 8px', position: 'relative',
          }}>
            <Icon size={20} color={active ? T.teal : T.muted} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: 9, color: active ? T.teal : T.muted, fontWeight: 600, fontFamily: 'DM Sans', letterSpacing: 0.3 }}>{t.label}</span>
            {active && <div style={{ position: 'absolute', top: -10, height: 2, width: 16, background: T.teal, borderRadius: 2 }} />}
          </button>
        );
      })}
    </div>
  );
}

const pageStyle = { minHeight: '100vh', background: T.bg, padding: '24px 20px', fontFamily: 'DM Sans, sans-serif', color: T.text };

// ────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ────────────────────────────────────────────────────────────────────────────
function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
      body { margin: 0; background: ${T.bg}; }
      * { box-sizing: border-box; }
      input, textarea { -webkit-appearance: none; }
      input:focus, textarea:focus { border-color: ${T.teal}66 !important; }
      button:active { transform: scale(0.98); }
      @keyframes petBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes petSleep { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(2px) scale(1.01); } }
      @keyframes petGlow { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.08); } }
      @keyframes eggWobble { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
      @keyframes burstFade { 0% { opacity: 0; transform: scale(0.4); } 20% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0; transform: scale(1.6); } }
      @keyframes msgFloat { 0% { opacity: 0; transform: translateY(10px); } 30% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); } }
      @keyframes sleepZ { 0%,100% { opacity: 0.4; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-6px); } }
      @keyframes shakeIn { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes ticketPop { 0% { opacity: 0; transform: translateX(-50%) scale(0.6); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }
      @keyframes sceneIn { 0%{opacity:0;transform:scale(0.98);} 100%{opacity:1;transform:scale(1);} }
      @keyframes chewBob { 0%{transform:scaleY(1) scaleX(1);} 50%{transform:scaleY(0.9) scaleX(1.05);} 100%{transform:scaleY(1) scaleX(1);} }
      @keyframes sparkleFly { 0%{opacity:0;transform:translate(0,0) scale(0.3);} 20%{opacity:1;transform:translate(calc(var(--dx)*0.4),calc(var(--dy)*0.4)) scale(1);} 100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.5);} }
      @keyframes cuddleHeart { 0%{opacity:0;transform:translate(-50%,0) scale(0.4);} 15%{opacity:1;transform:translate(-50%,-10px) scale(1);} 100%{opacity:0;transform:translate(calc(-50% + var(--drift,0px)),-200px) scale(0.7);} }
      @keyframes bubbleRise { 0%{opacity:0;transform:translateY(0) scale(0.4);} 20%{opacity:1;transform:translateY(-4px) scale(1);} 100%{opacity:0;transform:translateY(-60px) scale(1.2);} }
      @keyframes gentleNudge { 0%,100%{opacity:0.6;transform:translate(-50%,0);} 50%{opacity:1;transform:translate(-50%,-6px);} }
      @keyframes pulseRing { 0%,100%{opacity:0.4;transform:scale(1);} 50%{opacity:0.9;transform:scale(1.1);} }
      @keyframes hatchWobble { 0%,100%{transform:rotate(-10deg);} 25%{transform:rotate(10deg);} 50%{transform:rotate(-13deg) scale(1.05);} 75%{transform:rotate(13deg);} }
      @keyframes hatchGlow { 0%,100%{filter:drop-shadow(0 0 0px transparent);} 50%{filter:drop-shadow(0 0 24px var(--glow));} }
      @keyframes eggPieceFly { 0%{opacity:1;transform:translate(0,0) rotate(0deg);} 100%{opacity:0;transform:translate(var(--px),var(--py)) rotate(var(--pr)) scale(0.3);} }
      @keyframes petRise { 0%{opacity:0;transform:translateY(70px) scale(0.5);} 65%{opacity:1;transform:translateY(-12px) scale(1.1);} 100%{opacity:1;transform:translateY(0) scale(1);} }
      @keyframes textPop { 0%{opacity:0;transform:scale(0.7) translateY(14px);} 100%{opacity:1;transform:scale(1) translateY(0);} }
      @keyframes chewJaw { 0%,100%{transform:scaleY(1);} 35%{transform:scaleY(0.88) translateY(3px);} 70%{transform:scaleY(1.04);} }
      @keyframes crumbFall { 0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1);} 60%{opacity:1;} 100%{opacity:0.85;transform:translate(var(--cx),var(--cy)) rotate(var(--cr)) scale(0.8);} }
      @keyframes crumbFade { 0%{opacity:0.85;} 100%{opacity:0;transform:translateY(-8px) scale(0.5);} }
      @keyframes vacuumSlide { 0%{transform:translateX(var(--vx-start));} 100%{transform:translateX(var(--vx-end));} }
      @keyframes waterRipple { 0%,100%{d:path("M 40 0 Q 130 -8 200 0 Q 270 8 360 0");opacity:0.6;} 50%{d:path("M 40 0 Q 130 8 200 0 Q 270 -8 360 0");opacity:0.9;} }
      @keyframes waterSplash { 0%{opacity:0;transform:translate(0,0) scale(0.4);} 25%{opacity:1;} 100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(1.1);} }
      @keyframes tubWater { 0%,100%{transform:scaleX(1) translateY(0);} 50%{transform:scaleX(1.01) translateY(-3px);} }
      @keyframes wingFlapLeft { 0%{transform:rotate(0deg) scaleY(1);} 100%{transform:rotate(18deg) scaleY(0.82);} }
      @keyframes wingFlapRight { 0%{transform:rotate(0deg) scaleY(1);} 100%{transform:rotate(-18deg) scaleY(0.82);} }
      @keyframes speedLine { 0%{opacity:0.7;transform:scaleX(1);} 100%{opacity:0;transform:scaleX(0.1) translateX(-60px);} }
      @keyframes cheerBurst { 0%{opacity:0.8;transform:translate(-50%,-50%) scale(0.2);} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.5);} }
      @keyframes dustPuff { 0%{opacity:0.6;transform:translate(-50%,-50%) scale(0.4);} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.8) translateY(-20px);} }
      @keyframes breathe { 0%,100%{transform:scale(1);opacity:0.7;} 50%{transform:scale(1.08);opacity:1;} }
      @keyframes bubbleIn { 0%{opacity:0;transform:translateY(8px) scale(0.94);} 100%{opacity:1;transform:translateY(0) scale(1);} }
      @keyframes confetti { 0%{opacity:1;transform:translate(0,0) rotate(0deg);} 100%{opacity:0;transform:translate(var(--cx,40px), 380px) rotate(720deg);} }
      @keyframes routineBob { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-10px) rotate(2deg);} }
      @keyframes routineDance { 0%{transform:translateX(-12px) rotate(-6deg);} 50%{transform:translateX(12px) rotate(6deg);} 100%{transform:translateX(-12px) rotate(-6deg);} }
      @keyframes routineJump { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-22px);} }
      @keyframes routineJacks { 0%,100%{transform:translateY(0) scale(1,1);} 50%{transform:translateY(-18px) scale(0.96,1.05);} }
      @keyframes tailSwishCat { 0%,100%{transform:rotate(-4deg);} 20%{transform:rotate(-6deg);} 50%{transform:rotate(8deg);} 80%{transform:rotate(2deg);} }
      @keyframes tailWagDog { 0%,100%{transform:rotate(-15deg);} 50%{transform:rotate(15deg);} }
      @keyframes tailLazyWag { 0%,100%{transform:rotate(-5deg);} 50%{transform:rotate(8deg);} }
      @keyframes noseTwitch { 0%,90%,100%{transform:translateY(0);} 95%{transform:translateY(-1px);} }
      @keyframes hornGlow { 0%,100%{filter:drop-shadow(0 0 4px #FFD700);} 50%{filter:drop-shadow(0 0 10px #FFD700);} }
      @keyframes hornGlowDark { 0%,100%{filter:drop-shadow(0 0 4px #FF1010);} 50%{filter:drop-shadow(0 0 12px #FF1010);} }
      @keyframes flameLick { 0%,100%{transform:translateY(0) scaleY(1);} 50%{transform:translateY(-2px) scaleY(1.1);} }
      @keyframes eyeFlicker { 0%,100%{opacity:1;} 92%{opacity:1;} 94%{opacity:0.4;} 96%{opacity:1;} 98%{opacity:0.6;} }
      @keyframes wingFlapV2 { 0%,100%{transform:scaleY(1);} 50%{transform:scaleY(0.85);} }
      @keyframes loafBreathe { 0%,100%{transform:scale(1,1);} 50%{transform:scale(1.012,0.99);} }
      @keyframes bubblePop { 0%,100%{transform:scale(1);opacity:var(--op,0.7);} 50%{transform:scale(1.15);opacity:0.95;} }
      @keyframes bubbleFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
      @keyframes sparkleTwinkle { 0%,100%{opacity:0.3;transform:scale(0.8);} 50%{opacity:1;transform:scale(1.2);} }
      @keyframes dishFade { 0%{opacity:0;transform:translateY(-6px);} 100%{opacity:1;transform:translateY(0);} }
      @keyframes danceSway { 0%,100%{transform:translateX(-8px) rotate(-5deg);} 50%{transform:translateX(8px) rotate(5deg);} }
      @keyframes trickRollOver { 0%{transform:rotate(0deg) translateY(0);} 25%{transform:rotate(90deg) translateY(-10px);} 50%{transform:rotate(180deg) translateY(0);} 75%{transform:rotate(270deg) translateY(-10px);} 100%{transform:rotate(360deg) translateY(0);} }
      @keyframes trickStretch { 0%,100%{transform:scaleX(1) scaleY(1);} 30%{transform:scaleX(1.3) scaleY(0.8);} 60%{transform:scaleX(0.8) scaleY(1.3);} }
      @keyframes trickBinky { 0%,100%{transform:translateY(0) rotate(0deg);} 30%{transform:translateY(-30px) rotate(-20deg);} 60%{transform:translateY(-20px) rotate(20deg);} }
      @keyframes trickFireBreath { 0%,100%{transform:translateX(0);} 50%{transform:translateX(-6px);} }
      @keyframes trickFireBurst { 0%{opacity:0;transform:scaleX(0);} 30%{opacity:1;transform:scaleX(1.2);} 70%{opacity:0.7;transform:scaleX(1);} 100%{opacity:0;transform:scaleX(1.3);} }
      @keyframes trickSmoke { 0%{opacity:0.6;transform:translate(0,0) scale(0.5);} 100%{opacity:0;transform:translate(10px,-20px) scale(1.4);} }
      @keyframes trickFlameErupt { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-12px) scale(1.1);} }
      @keyframes trickPrance { 0%,100%{transform:translateY(0) rotate(0deg);} 25%{transform:translateY(-18px) rotate(4deg);} 75%{transform:translateY(-12px) rotate(-4deg);} }
      @keyframes trickSparkle { 0%{opacity:0;transform:scale(0) translateY(0);} 40%{opacity:1;transform:scale(1.4) translateY(-8px);} 100%{opacity:0;transform:scale(0.5) translateY(-20px);} }
      @keyframes trickRainbow { 0%{opacity:0;stroke-dasharray:0 300;} 40%{opacity:0.9;stroke-dasharray:200 100;} 100%{opacity:0;stroke-dasharray:300 0;} }
      @keyframes trickShadow { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:0.5;} 50%{transform:translateX(-50%) scaleX(0.5);opacity:0.2;} }
      @keyframes routineBreath { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
      @keyframes routineSparkle { 0%,100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.5);} 50%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1.2);} }
      @keyframes routineShadow { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:0.6;} 50%{transform:translateX(-50%) scaleX(0.7);opacity:0.3;} }
      @keyframes signWiggle { 0%,100%{transform:translateX(-50%) rotate(-3deg);} 50%{transform:translateX(-50%) rotate(3deg);} }
      @keyframes pompomLeft { 0%,100%{transform:translate(-110px,-10px) rotate(-25deg);} 50%{transform:translate(-110px,-26px) rotate(15deg);} }
      @keyframes pompomRight { 0%,100%{transform:translate(74px,-10px) rotate(25deg);} 50%{transform:translate(74px,-26px) rotate(-15deg);} }
      @keyframes flagFlutter { 0%,100%{transform:scaleX(1) skewY(0deg);} 50%{transform:scaleX(0.9) skewY(-4deg);} }
      @keyframes starRise { 0%,100%{transform:translateX(-50%) translateY(0) scale(1);} 50%{transform:translateX(-50%) translateY(-10px) scale(1.1);} }
      @keyframes heartFloat { 0%{opacity:0;transform:translate(var(--hx,0px),0) scale(0.5);} 30%{opacity:1;} 100%{opacity:0;transform:translate(var(--hx,0px),-90px) scale(1.2);} }
      @keyframes dustPoof { 0%{opacity:0.6;transform:translateX(var(--dx,0)) translateY(0) scale(0.6);} 100%{opacity:0;transform:translateX(var(--dx,0)) translateY(-12px) scale(1.4);} }
      @keyframes zenPulse { 0%,100%{transform:scale(0.95);opacity:0.4;} 50%{transform:scale(1.05);opacity:0.8;} }
      @keyframes zenDot { 0%,100%{opacity:0;} 50%{opacity:1;} }
      @keyframes omFloat { 0%,100%{opacity:0.3;transform:translateX(-50%) translateY(0);} 50%{opacity:0.7;transform:translateX(-50%) translateY(-6px);} }
    `}</style>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('home');
  const [goalDetailId, setGoalDetailId] = useState(null);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [loading, setLoading] = useState(true); // true while we check storage

  // On mount — try to restore the last logged-in session automatically
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await storageGet('lastSession');
        if (session?.username) {
          const savedUser = await storageGet('user:' + session.username);
          if (savedUser) {
            setUser(savedUser);
          }
        }
      } catch (e) {
        // Storage not available or empty — just show login screen
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Save session whenever user changes (login, signup, updates)
  const loginAndSave = async (u) => {
    setUser(u);
    try {
      await storageSet('lastSession', { username: u.username, savedAt: Date.now() });
    } catch (e) {}
  };

  // Wrap setUser to also persist the user object every time it changes
  const setUserAndSave = async (u) => {
    setUser(u);
    try {
      await storageSet('user:' + u.username, u);
    } catch (e) {}
  };

  // Loading splash — shown for a brief moment while we check storage
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: T.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <Egg color={T.teal} size={80} />
        <div style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 28,
          color: T.text, letterSpacing: '-0.3px',
        }}>Hatch</div>
        <Style />
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={loginAndSave} />;
  if (!user.petType) return <Onboarding user={user} onDone={u => loginAndSave(u)} />;

  const needsFirstGoal = !user.hatched && (user.goals || []).length === 0;
  const isShowingNewGoal = showNewGoal || needsFirstGoal;

  return (
    <div>
      {tab === 'home' && (
        <HomeScreen user={user} setUser={setUserAndSave}
          openGoal={(id) => setGoalDetailId(id)}
          goToGoals={() => setTab('goals')}
          onLogout={async () => {
            try { await storageSet('lastSession', null); } catch (e) {}
            setUser(null);
          }} />
      )}
      {tab === 'goals' && (
        <GoalsScreen user={user}
          openGoal={(id) => setGoalDetailId(id)}
          openNewGoal={() => setShowNewGoal(true)} />
      )}
      {tab === 'learn' && <LearnScreen user={user} setUser={setUserAndSave} />}
      {tab === 'shop' && <ShopScreen user={user} setUser={setUserAndSave} />}
      {tab === 'friends' && <FriendsScreen user={user} />}
      <BottomNav tab={tab} setTab={setTab} />
      {isShowingNewGoal && (
        <NewGoalFlow user={user} setUser={setUserAndSave}
          isFirstGoal={needsFirstGoal}
          onClose={(newGoalId) => {
            setShowNewGoal(false);
            if (newGoalId) setGoalDetailId(newGoalId);
          }} />
      )}
      {goalDetailId && (
        <GoalDetailScreen user={user} setUser={setUserAndSave}
          goalId={goalDetailId}
          onClose={() => setGoalDetailId(null)} />
      )}
      <Style />
    </div>
  );
}
