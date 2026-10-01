import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Avatar from '../avatar/Avatar.jsx';
import { sfx } from '../lib/sound.js';
import { speak } from '../lib/speech.js';
import { setAmbience, startAmbience, stopAmbience } from '../lib/ambience.js';
import * as A from './art.jsx';
import { BIOMES, SKY, biomeFor } from './biomes.js';
import { Art, Particles, rng, smoothPath } from './Journey.jsx';
import LevelStop, { ExplorerBoat, WalkingExplorer } from './LevelStop.jsx';

// The iPad-first adventure map: a side-scrolling world the child swipes
// through. Every world is built in layers for depth: sky and sun, hazy far
// hills, nearer hills, the ground with the stream and levels, and a blurred
// foreground, each sliding at its own speed (parallax). The stream pours over
// a waterfall between worlds. The explorer paddles in on a swan boat, then
// walks a trail on land, crossing the stream on bridges, to each level.

const SIGN = 300; // space at the start of a world (title ribbon + dock)
const COL = 214; // horizontal space per level
const TAIL = 300; // space at the end of a world
const FALL_W = 280;
const END_W = 780;
// Ground-level side view, like a storybook: sky on top, the river in the
// middle distance, and the walking path along the front where the explorer
// stands. Nothing is ever below ground.
const HORIZON = 0.44; // where the sky meets the land
const RIVER = 0.61; // river runs across the middle distance
const PATH = 0.855; // the walking path: the explorer's feet stand here
const SIGN_Y = 0.47; // centre of each level sign (on a post beside the path)
const worldWidth = (n) => SIGN + n * COL + TAIL;
const riverY = (x) => RIVER + 0.012 * Math.sin(x / 190);

// Path colours per world: [edge, surface]
const TRAIL = {
  rainforest: ['#b08a58', '#e2bf8a'], desert: ['#d2a865', '#f6e2b4'], autumn: ['#a8764a', '#e0b27c'],
  mountains: ['#a0907a', '#d6c7ad'], garden: ['#c9a36f', '#f0dab0'], tundra: ['#b9cbe0', '#ffffff'], beach: ['#e0c188', '#fbeccb'], sky: ['#b08a58', '#e2bf8a'],
};

const GRASS = { desert: '#d1a95e', autumn: '#d08a45', beach: '#8fbf6a', garden: '#6fcf8a', mountains: '#6fbf84' };
const AUTUMN = [['#f28c38', '#ffb45c'], ['#e8594f', '#ff8a7a'], ['#f2b92c', '#ffe07a']];

// ---------- parallax layer ----------

function Layer({ k, panelLeft, panelW, vw, children, className = '', z = 0 }) {
  const pad = Math.abs(k) * vw + 240;
  const width = panelW + Math.abs(k) * (panelW + vw) + pad * 2;
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 will-change-transform ${className}`}
      style={{ left: -pad, width, zIndex: z, transform: `translate3d(calc((var(--sx, 0) * 1px - ${panelLeft}px) * ${k}), 0, 0)` }}
    >
      {children(width, pad)}
    </div>
  );
}

function hillPath(width, H, top, amp, step, seed) {
  const r = rng(seed);
  let d = `M0 ${H} L0 ${top}`;
  for (let x = 0; x <= width + step; x += step) {
    d += ` Q${x + step / 2} ${top - amp * (0.4 + r())} ${x + step} ${top + amp * (r() - 0.5) * 0.4}`;
  }
  return `${d} L${width + step} ${H} Z`;
}

function ridgePath(width, H, top, amp, step, seed) {
  const r = rng(seed);
  let d = `M0 ${H} L0 ${top}`;
  for (let x = 0; x <= width + step; x += step) d += ` L${x + step / 2} ${top - amp * (0.5 + r() * 0.8)} L${x + step} ${top + r() * 10}`;
  return `${d} L${width + step} ${H} Z`;
}

/** Sky, sun rays, distant scenery and nearer hills for one panel. */
function Backdrop({ biome, panelLeft, panelW, vw, H, seed, village, plain }) {
  const horizon = H * HORIZON;
  const sky = <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${biome.sky[0]} 0%, ${biome.sky[1]} ${HORIZON * 100}%, ${biome.ground[0]} ${HORIZON * 100 + 0.5}%, ${biome.ground[1]} 100%)` }} />;
  if (plain) return sky;
  const fade = { maskImage: 'linear-gradient(90deg, transparent 0, #000 140px, #000 calc(100% - 140px), transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 140px, #000 calc(100% - 140px), transparent 100%)' };
  return (
    <>
      {sky}
      {/* sun and light rays: almost fixed to the camera */}
      <Layer k={0.85} panelLeft={panelLeft} panelW={panelW} vw={vw}>
        {(w, pad) => (
          <svg className="absolute inset-0 h-full" width={w} height={H} aria-hidden="true">
            <defs>
              <radialGradient id={`sun-${seed}`}>
                <stop offset="0" stopColor="#fffbe0" stopOpacity=".95" />
                <stop offset=".35" stopColor={biome.rays} stopOpacity=".45" />
                <stop offset="1" stopColor={biome.rays} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={pad + panelW * 0.72} cy={H * 0.08} r={H * 0.32} fill={`url(#sun-${seed})`} />
            <circle cx={pad + panelW * 0.72} cy={H * 0.08} r={H * 0.05} fill="#fffbe0" />
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${pad + panelW * 0.72} ${H * 0.08} L${pad + panelW * (0.3 + i * 0.12)} ${H} L${pad + panelW * (0.36 + i * 0.12)} ${H} Z`}
                fill={biome.rays}
                opacity=".12"
                className="world-rays"
                style={{ animationDelay: `${i * 1.3}s` }}
              />
            ))}
            {[0.15, 0.45, 0.8].map((f, i) => (
              <g key={f} className="world-cloud" style={{ animationDelay: `${-i * 9}s` }} opacity=".9">
                <ellipse cx={pad + panelW * f} cy={H * (0.07 + i * 0.03)} rx={60} ry={16} fill="#fff" />
                <circle cx={pad + panelW * f - 20} cy={H * (0.07 + i * 0.03) - 10} r={20} fill="#fff" />
                <circle cx={pad + panelW * f + 14} cy={H * (0.07 + i * 0.03) - 14} r={24} fill="#fff" />
              </g>
            ))}
          </svg>
        )}
      </Layer>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={fade}>
      {/* far scenery: hazy, pale, small */}
      <Layer k={0.55} panelLeft={panelLeft} panelW={panelW} vw={vw}>
        {(w) => (
          <svg className="absolute inset-0 h-full" width={w} height={H} aria-hidden="true">
            {biome.key === 'mountains' || biome.key === 'tundra'
              ? <>
                  <path d={ridgePath(w, H, horizon - 8, H * 0.2, 210, seed)} fill={biome.farA} />
                  <path d={ridgePath(w, H, horizon - 8, H * 0.2, 210, seed)} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeDasharray="30 400" />
                </>
              : biome.key === 'desert'
                ? <path d={`M0 ${H} L0 ${horizon}` + Array.from({ length: Math.ceil(w / 260) + 1 }, (_, i) => ` L${i * 260 + 30} ${horizon} L${i * 260 + 60} ${horizon - H * 0.09} L${i * 260 + 160} ${horizon - H * 0.09} L${i * 260 + 190} ${horizon}`).join('') + ` L${w} ${horizon} L${w} ${H} Z`} fill={biome.farA} />
                : biome.key === 'beach'
                  ? <>
                      <rect x="0" y={horizon - H * 0.07} width={w} height={H} fill={biome.farA} />
                      <path d={`M0 ${horizon - H * 0.07} L${w} ${horizon - H * 0.07}`} stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
                    </>
                  : <path d={hillPath(w, H, horizon - 6, H * 0.08, 180, seed)} fill={biome.farA} />}
            {/* distant tree blobs for forests */}
            {['rainforest', 'autumn', 'garden'].includes(biome.key) && Array.from({ length: Math.ceil(w / 70) }, (_, i) => (
              <circle key={i} cx={i * 70 + (i % 3) * 12} cy={horizon - 4 - (i % 4) * 5} r={18 + (i % 3) * 6} fill={biome.key === 'garden' && i % 3 === 0 ? '#f7c1d6' : biome.key === 'autumn' ? AUTUMN[i % 3][1] : biome.farB} opacity=".55" />
            ))}
            {village && Array.from({ length: Math.ceil(w / 900) }, (_, i) => (
              <g key={`v${i}`} transform={`translate(${i * 900 + 400} ${horizon - 22}) scale(.9)`} opacity=".8">
                <rect x="0" y="0" width="22" height="18" fill="#f25c5c" /><path d="M-3 0 L11 -12 L25 0 Z" fill="#b33f3f" />
                <rect x="30" y="4" width="18" height="14" fill="#ffd84d" /><path d="M27 4 L39 -6 L51 4 Z" fill="#c9951c" />
                <rect x="56" y="2" width="20" height="16" fill="#fff" /><path d="M53 2 L66 -9 L79 2 Z" fill="#8a5a3c" />
              </g>
            ))}
          </svg>
        )}
      </Layer>
      {/* nearer rolling hills */}
      <Layer k={0.28} panelLeft={panelLeft} panelW={panelW} vw={vw}>
        {(w) => (
          <svg className="absolute inset-0 h-full" width={w} height={H} aria-hidden="true">
            <path d={hillPath(w, H, horizon + H * 0.03, H * 0.06, 340, seed + 5)} fill={biome.farB} opacity=".85" />
            <path d={hillPath(w, H, horizon + H * 0.07, H * 0.03, 420, seed + 9)} fill={biome.ground[0]} />
          </svg>
        )}
      </Layer>
      </div>
    </>
  );
}

/** Dark, blurred silhouettes in front of everything: sells the depth. */
function Foreground({ biome, panelLeft, panelW, vw, H, seed }) {
  const leafy = ['rainforest', 'autumn', 'garden', 'sky'].includes(biome.key);
  return (
    <Layer k={-0.3} panelLeft={panelLeft} panelW={panelW} vw={vw} z={28}>
      {(w) => {
        const r = rng(seed + 21);
        const items = [];
        for (let x = 60; x < w; x += 380 + r() * 220) items.push({ x, s: 0.8 + r() * 0.6, top: r() > 0.55 && leafy });
        return (
          <svg className="absolute inset-0 h-full blur-[1.5px]" width={w} height={H} aria-hidden="true">
            {items.map(({ x, s, top }, i) => (top ? (
              <g key={i} transform={`translate(${x} 0) scale(${s})`} fill={biome.fg} opacity=".9">
                <path d="M-90 -10 C-40 30 20 50 90 60" stroke={biome.fg} strokeWidth="7" fill="none" strokeLinecap="round" />
                {[[-60, 12, 30], [-30, 28, 50], [0, 40, 20], [30, 50, 60], [60, 56, 30], [-44, 20, -20], [14, 44, -30], [76, 60, -10]].map(([lx, ly, rot], j) => (
                  <ellipse key={j} cx={lx} cy={ly + (j % 2 ? 22 : 18)} rx="13" ry="30" transform={`rotate(${rot} ${lx} ${ly})`} />
                ))}
              </g>
            ) : (
              <g key={i} transform={`translate(${x} ${H + 36}) scale(${s * 0.62})`} fill={biome.fg} opacity=".85">
                {biome.key === 'tundra'
                  ? <path d="M-120 10 C-80 -50 40 -60 120 10 Z" fill="#fff" opacity=".95" />
                  : biome.key === 'desert' || biome.key === 'mountains'
                    ? <><ellipse cx="-20" cy="0" rx="70" ry="44" /><ellipse cx="50" cy="6" rx="50" ry="30" opacity=".9" /></>
                    : <>
                        <path d="M-80 10 C-70 -60 -40 -90 -30 -110 C-30 -70 -20 -40 -10 10 Z" />
                        <path d="M-20 10 C-10 -80 20 -120 40 -140 C34 -90 30 -40 30 10 Z" />
                        <path d="M20 10 C40 -50 80 -80 110 -90 C90 -50 70 -20 70 10 Z" />
                        <path d="M-120 10 C-110 -30 -90 -50 -70 -60 C-80 -30 -84 -10 -80 10 Z" />
                      </>}
              </g>
            )))}
          </svg>
        );
      }}
    </Layer>
  );
}

function Ribbon({ category, biome, index, onSpeak }) {
  return (
    <div className="absolute left-6 top-[7%] z-30 flex items-center">
      <span className="relative z-10 grid h-[78px] w-[78px] shrink-0 place-items-center rounded-full font-display text-4xl font-bold text-white ring-[5px] ring-white" style={{ background: category.color, boxShadow: `0 6px 0 color-mix(in srgb, ${category.color} 68%, #1a0620), 0 12px 20px rgba(0,0,0,.25)` }}>
        {category.name[0]}
      </span>
      <div className="relative -ml-5 flex items-center gap-3 rounded-r-2xl py-2.5 pl-8 pr-3 text-white shadow-lg" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${category.color} 85%, white), ${category.color})` }}>
        <svg className="absolute -right-5 top-0 h-full w-6" viewBox="0 0 24 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 L24 0 L12 30 L24 60 L0 60 Z" fill={category.color} />
        </svg>
        <div className="min-w-0">
          <p className="font-display text-[11px] uppercase tracking-[.2em] text-white/85">World {index + 1} · {biome.name} {biome.emoji}</p>
          <h2 className="max-w-[260px] font-display text-xl font-semibold leading-tight drop-shadow">{category.name}</h2>
        </div>
        <button type="button" onClick={onSpeak} className="relative z-10 ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/95 transition active:scale-90" style={{ color: category.color }} aria-label={`Hear about ${category.name}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
        </button>
      </div>
    </div>
  );
}

/** The walking path along the front of the scene, with arched bridges over creeks. */
function pathD(W, H, creeks) {
  const y = H * PATH;
  let d = `M-40 ${y}`;
  for (const cx of creeks) {
    d += ` L${cx - 70} ${y} Q${cx - 40} ${y} ${cx - 26} ${y - 22} Q${cx} ${y - 40} ${cx + 26} ${y - 22} Q${cx + 40} ${y} ${cx + 70} ${y}`;
  }
  return `${d} L${W + 40} ${y}`;
}

function riverD(W, H, from = 0, to = W) {
  const pts = [];
  for (let x = from - 40; x <= to + 40; x += 40) pts.push([x, H * riverY(x)]);
  return smoothPath(pts);
}

function Ground({ W, H, biome, creeks, trail, pathRef, riverRef, riverDOverride }) {
  const y = H * PATH;
  const rd = riverDOverride ?? riverD(W, H);
  return (
    <svg className="pointer-events-none absolute left-0 top-0" width={W} height={H} aria-hidden="true">
      {/* river across the middle distance */}
      <path d={rd} fill="none" stroke={biome.bank} strokeWidth="46" strokeLinecap="round" />
      <path ref={riverRef} d={rd} fill="none" stroke={biome.water} strokeWidth="34" strokeLinecap="round" />
      <path d={rd} fill="none" stroke={biome.light} strokeWidth="12" opacity=".7" strokeLinecap="round" />
      <path d={rd} fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="12 34" opacity=".85" className="stream-flow" />
      {/* creeks running from the river toward us, under the bridges */}
      {creeks.map((cx) => {
        const top = H * riverY(cx);
        return (
          <g key={cx}>
            <path d={`M${cx - 16} ${top} C${cx - 20} ${(top + y) / 2} ${cx - 34} ${y - 10} ${cx - 44} ${H + 10} L${cx + 44} ${H + 10} C${cx + 34} ${y - 10} ${cx + 20} ${(top + y) / 2} ${cx + 16} ${top} Z`} fill={biome.bank} />
            <path d={`M${cx - 11} ${top} C${cx - 14} ${(top + y) / 2} ${cx - 26} ${y - 10} ${cx - 34} ${H + 10} L${cx + 34} ${H + 10} C${cx + 26} ${y - 10} ${cx + 14} ${(top + y) / 2} ${cx + 11} ${top} Z`} fill={biome.water} />
            <path d={`M${cx} ${top + 6} L${cx} ${H}`} stroke="#fff" strokeWidth="2.5" strokeDasharray="10 22" opacity=".8" className="waterfall-flow" />
          </g>
        );
      })}
      {/* the path: a flat dirt / sand / snow walkway on the ground */}
      <rect x="-40" y={y - 4} width={W + 80} height="30" rx="14" fill="#1b3a2a" opacity=".08" />
      <path d={`M-40 ${y - 12} L${W + 40} ${y - 12} L${W + 40} ${y + 18} L-40 ${y + 18} Z`} fill={trail[0]} />
      <path d={`M-40 ${y - 12} L${W + 40} ${y - 12} L${W + 40} ${y + 12} L-40 ${y + 12} Z`} fill={trail[1]} />
      <path d={`M-40 ${y + 2} L${W + 40} ${y + 2}`} stroke={trail[0]} strokeWidth="3" strokeDasharray="3 30" opacity=".6" />
      {/* the walking line the explorer follows (invisible) */}
      <path ref={pathRef} d={pathD(W, H, creeks)} fill="none" stroke="none" />
    </svg>
  );
}

/** Arched wooden footbridge over a creek, seen from the side. */
function ArchBridge({ x, y }) {
  return (
    <div className="pointer-events-none absolute z-[26]" style={{ left: x, top: y, transform: 'translate(-50%, -78%)' }} aria-hidden="true">
      <svg width="170" height="92" viewBox="0 0 170 92">
        <path d="M6 70 Q85 18 164 70 L164 80 Q85 30 6 80 Z" fill="#b47a4a" stroke="#7a4a2e" strokeWidth="3" strokeLinejoin="round" />
        {Array.from({ length: 11 }, (_, i) => {
          const t = (i + 0.5) / 11;
          const px = 6 + t * 158;
          const py = 70 - Math.sin(t * Math.PI) * 26;
          return <path key={i} d={`M${px} ${py} L${px} ${py + 10}`} stroke="#8a5a3c" strokeWidth="2" />;
        })}
        <path d="M10 44 Q85 -6 160 44" stroke="#8a5a3c" strokeWidth="5" fill="none" strokeLinecap="round" />
        {[0.08, 0.3, 0.5, 0.7, 0.92].map((t) => {
          const px = 6 + t * 158;
          const top = 44 - Math.sin(t * Math.PI) * 25;
          const deck = 70 - Math.sin(t * Math.PI) * 26;
          return <path key={t} d={`M${px} ${top} L${px} ${deck}`} stroke="#7a4a2e" strokeWidth="5" strokeLinecap="round" />;
        })}
        <path d="M6 80 L6 92 M164 80 L164 92" stroke="#7a4a2e" strokeWidth="7" />
      </svg>
    </div>
  );
}

/** Wooden signpost that holds a level button above the path. */
function Signpost({ x, top, bottom }) {
  return (
    <div className="pointer-events-none absolute z-[18]" style={{ left: x - 7, top, height: bottom - top, width: 14 }} aria-hidden="true">
      <div className="h-full w-full rounded-t-md bg-gradient-to-r from-[#8a5a3c] via-[#b47a4a] to-[#8a5a3c] shadow-[2px_0_0_rgba(0,0,0,.08)]" />
      <div className="absolute -bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full bg-black/15 blur-[1px]" />
    </div>
  );
}

/** Little wooden jetty from the path out to the river, where the swan boat ties up. */
function Jetty({ x, H }) {
  const top = H * riverY(x) + 10;
  const bottom = H * PATH - 10;
  return (
    <svg className="pointer-events-none absolute z-[15]" style={{ left: x - 50, top }} width="100" height={bottom - top} viewBox={`0 0 100 ${bottom - top}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`M36 0 L64 0 L84 ${bottom - top} L16 ${bottom - top} Z`} fill="#b47a4a" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${34 - i * 3.5} ${(i + 0.5) * ((bottom - top) / 6)} L${66 + i * 3.5} ${(i + 0.5) * ((bottom - top) / 6)}`} stroke="#8a5a3c" strokeWidth="2" />)}
    </svg>
  );
}

// ---------- one world ----------

function WorldH({ category, index, pages, left, vw, H, starsFor, numberFor, onSelect, registerRoute, explorer, boatInUse }) {
  const biome = biomeFor(index);
  const n = pages.length;
  const W = worldWidth(n);
  const r = rng(index + 3);
  const trail = TRAIL[biome.key] ?? TRAIL.sky;
  const signs = pages.map((_, i) => [SIGN + i * COL + COL / 2, H * (SIGN_Y + (i % 2 ? -0.02 : 0.02))]);
  // A creek (with a footbridge) between every other pair of levels.
  const creeks = pages.slice(0, -1).map((_, i) => SIGN + (i + 1) * COL).filter((_, i) => i % 2 === 1);
  const jettyX = SIGN * 0.5;

  const pathRef = useRef(null);
  const riverRef = useRef(null);
  useLayoutEffect(() => {
    registerRoute(index, { trail: pathRef.current, stream: riverRef.current, stops: signs.map(([x]) => [x, H * PATH]), dockWalk: [jettyX, H * PATH], dockBoat: [jettyX, H * riverY(jettyX)] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, H, n]);

  const art = [];
  // Background: trees and landmark behind the river (far away, so smaller).
  for (let x = 40; x < W; x += 150 + r() * 110) {
    const Comp = biome.edges[Math.floor(r() * biome.edges.length)];
    art.push({ Comp, x, bottom: H * (RIVER - 0.035), w: Math.min(100, H * 0.13) * (0.8 + r() * 0.4), key: `b${x}`, z: 3, dim: true });
  }
  // Middle ground between river and path: bushes, plants and critters.
  pages.forEach((_, i) => {
    const mx = SIGN + (i + 1) * COL;
    if (i < n - 1 && !creeks.includes(mx)) {
      art.push({ Comp: biome.near[i % biome.near.length], x: mx, bottom: H * (PATH - 0.045), w: Math.min(150, H * 0.22), key: `m${i}`, z: 8 });
    }
    const Critter = biome.critters[i % biome.critters.length];
    art.push({ Comp: Critter, x: signs[i][0] + 70, bottom: H * (PATH - 0.035), w: 52, key: `c${i}`, critter: true, z: 16 });
  });
  // Foreground, in front of the path (closest to us, so biggest).
  for (let x = 60; x < W; x += 120 + r() * 90) {
    if (creeks.some((c) => Math.abs(c - x) < 70)) continue;
    const pick = r();
    const Comp = pick < 0.45 ? A.Grass : pick < 0.75 ? A.Flowers : A.Rock;
    art.push({ Comp, x, bottom: H * 0.995, w: Comp === A.Rock ? 44 : 60 + r() * 30, key: `f${x}`, z: 30, tint: Comp === A.Grass ? (GRASS[biome.key] ?? '#5cc27a') : undefined });
  }

  const speakWorld = () => {
    sfx.pick();
    speak(`Welcome to the ${biome.name}! ${category.name[0]} is for ${category.name}. ${category.description ?? ''}`);
  };

  return (
    <section id={`stream-${category.id}`} data-world={index} className="relative h-full shrink-0 overflow-hidden" style={{ width: W }} aria-labelledby={`world-${category.id}`}>
      <Backdrop biome={biome} panelLeft={left} panelW={W} vw={vw} H={H} seed={index + 1} village={biome.key === 'garden' || biome.key === 'autumn'} />
      <Particles kind={biome.particles} seed={index} />
      <Art Comp={biome.landmark} biome={biome} i={0} left={W - 170} top={H * (RIVER - 0.03)} width={Math.min(190, H * 0.28)} transform="translate(-50%, -100%)" zIndex={4} />

      <Ground W={W} H={H} biome={biome} creeks={creeks} trail={trail} pathRef={pathRef} riverRef={riverRef} />
      {art.map(({ Comp, x, bottom, w, key, critter, z, dim, tint }, i) => {
        const props = {
          Comp, biome, i, tint, left: x, top: bottom, width: w,
          transform: 'translate(-50%, -100%)',
          filter: dim ? 'saturate(.85) brightness(1.05)' : undefined,
          zIndex: z,
        };
        return critter ? <CritterArt key={key} {...props} /> : <Art key={key} {...props} />;
      })}
      <Jetty x={jettyX} H={H} />
      {!boatInUse && (
        <div className="pointer-events-none absolute z-[14] world-bob" style={{ left: jettyX - 64, top: H * riverY(jettyX) + 6, transform: 'translate(-50%, -72%) scale(.62)' }} aria-hidden="true">
          <ExplorerBoat avatar={null} />
        </div>
      )}
      {creeks.map((cx) => <ArchBridge key={cx} x={cx} y={H * PATH} />)}
      {signs.map(([x, y], i) => <Signpost key={pages[i].id} x={x} top={y + 40} bottom={H * PATH} />)}
      <Foreground biome={biome} panelLeft={left} panelW={W} vw={vw} H={H} seed={index + 30} />
      <Ribbon category={category} biome={biome} index={index} onSpeak={speakWorld} />

      <h2 id={`world-${category.id}`} className="sr-only">{category.name}</h2>
      {pages.map((p, i) => (
        <LevelStop
          key={p.id}
          page={p}
          category={category}
          left={signs[i][0]}
          top={signs[i][1]}
          number={numberFor(p)}
          stars={starsFor(p)}
          scale={0.9}
          onSelect={onSelect}
        />
      ))}
      {explorer}
    </section>
  );
}

/** Critters hop (and squeak) when tapped. */
function CritterArt(props) {
  const [hop, setHop] = useState(0);
  return (
    <Art
      {...props}
      key={hop}
      className={hop ? 'critter-hop' : ''}
      onClick={(e) => { e.stopPropagation(); sfx.pick(); setHop((h) => h + 1); }}
    />
  );
}

// ---------- waterfall between worlds ----------

function FallH({ upper, lower, H, seed }) {
  const r = rng(seed * 13);
  const top = H * 0.18;
  const pool = H * RIVER;
  const y = H * PATH;
  const lowerTrail = TRAIL[lower.key] ?? TRAIL.sky;
  return (
    <div className="relative h-full shrink-0 overflow-hidden" style={{ width: FALL_W }} aria-hidden="true">
      <Backdrop biome={upper} plain H={H} />
      <div className="absolute inset-0" style={{ maskImage: 'linear-gradient(90deg, transparent 25%, #000 75%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 25%, #000 75%)' }}>
        <Backdrop biome={lower} plain H={H} />
      </div>
      <svg className="absolute inset-0" width={FALL_W} height={H}>
        <defs>
          <linearGradient id={`hfall-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={upper.water} />
            <stop offset="1" stopColor={lower.light} />
          </linearGradient>
        </defs>
        {/* a rocky cliff in the background, with the river pouring down it */}
        <path d={`M0 ${pool + 20} L0 ${top + 30} Q20 ${top} 60 ${top + 6} L${FALL_W - 60} ${top + 6} Q${FALL_W - 20} ${top} ${FALL_W} ${top + 30} L${FALL_W} ${pool + 20} Z`} fill={upper.cliff.rock} />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={8 + (i % 4) * 68 + r() * 12} y={top + 24 + Math.floor(i / 4) * ((pool - top) / 4.3)} width={48 + r() * 18} height={(pool - top) / 5.5} rx="12" fill={i % 2 ? upper.cliff.dark : '#fff'} opacity={i % 2 ? 0.45 : 0.12} />
        ))}
        <path d={`M0 ${top + 30} Q20 ${top} 60 ${top + 6} L${FALL_W - 60} ${top + 6} Q${FALL_W - 20} ${top} ${FALL_W} ${top + 30} L${FALL_W} ${top + 44} Q${FALL_W / 2} ${top + 22} 0 ${top + 44} Z`} fill={upper.cliff.lip} />
        <path d={`M${FALL_W / 2 - 30} ${top + 10} L${FALL_W / 2 + 30} ${top + 10} L${FALL_W / 2 + 36} ${pool} L${FALL_W / 2 - 36} ${pool} Z`} fill={`url(#hfall-${seed})`} />
        {[-20, -8, 4, 16, 26].map((dx, i) => (
          <path key={dx} d={`M${FALL_W / 2 + dx} ${top + 14} L${FALL_W / 2 + dx * 1.15} ${pool - 8}`} stroke="#fff" strokeWidth={i % 2 ? 3 : 2} strokeDasharray="18 22" opacity=".8" className="waterfall-flow" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        {/* the river joins at the bottom of the fall */}
        <path d={`M-10 ${pool} L${FALL_W + 10} ${pool}`} stroke={lower.bank} strokeWidth="46" />
        <path d={`M-10 ${pool} L${FALL_W + 10} ${pool}`} stroke={lower.water} strokeWidth="34" />
        {[[-40, -6, 16], [-16, -12, 19], [12, -10, 18], [36, -4, 15], [0, 2, 20]].map(([dx, dy, rr], i) => (
          <circle key={dx} cx={FALL_W / 2 + dx} cy={pool + dy} r={rr} fill="#fff" opacity=".92" className="waterfall-foam" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        <ellipse cx={FALL_W / 2} cy={pool - 30} rx="80" ry="26" fill="#fff" opacity=".28" className="waterfall-mist" />
        {/* grassy ground in front, then the path continues across a rope bridge */}
        <path d={`M0 ${pool + 22} L${FALL_W} ${pool + 22} L${FALL_W} ${H} L0 ${H} Z`} fill={lower.ground[1]} opacity=".35" />
        <path d={`M-10 ${y - 12} L${FALL_W + 10} ${y - 12} L${FALL_W + 10} ${y + 18} L-10 ${y + 18} Z`} fill={lowerTrail[0]} />
        <path d={`M-10 ${y - 12} L${FALL_W + 10} ${y - 12} L${FALL_W + 10} ${y + 12} L-10 ${y + 12} Z`} fill={lowerTrail[1]} />
        {Array.from({ length: 14 }, (_, i) => <rect key={i} x={12 + i * 18.5} y={y - 12} width="14" height="24" rx="2" fill={i % 2 ? '#c98f5a' : '#b47a4a'} />)}
        <path d={`M8 ${y - 44} Q${FALL_W / 2} ${y - 20} ${FALL_W - 8} ${y - 44}`} stroke="#8a5a3c" strokeWidth="4" fill="none" />
        {[8, FALL_W / 4, FALL_W / 2, (3 * FALL_W) / 4, FALL_W - 8].map((px, i) => (
          <path key={px} d={`M${px} ${y - 12} L${px} ${y - 44 + Math.sin((i / 4) * Math.PI) * 18}`} stroke="#7a4a2e" strokeWidth={i === 0 || i === 4 ? 6 : 3} strokeLinecap="round" />
        ))}
      </svg>
    </div>
  );
}

// ---------- start and end ----------

function StartH({ W, H, vw, avatar, onGo, onEdit, worlds }) {
  const springX = W * 0.5;
  const riverStart = smoothPath(Array.from({ length: Math.ceil((W - springX) / 40) + 2 }, (_, i) => [springX + i * 40, H * riverY(springX + i * 40)]));
  const name = avatar?.name?.trim();
  return (
    <section className="relative h-full shrink-0 overflow-hidden" style={{ width: W }} aria-label="Start">
      <Backdrop biome={SKY} panelLeft={0} panelW={W} vw={vw} H={H} seed={99} village />
      <Ground W={W} H={H} biome={{ ...BIOMES[0], bank: SKY.cliff.lip }} creeks={[]} trail={TRAIL.sky} riverDOverride={riverStart} />
      <div className="absolute z-20" style={{ left: springX, top: H * riverY(springX), transform: 'translate(-60%, -62%)' }} aria-hidden="true">
        <div className="w-[84px]"><A.Rock tint="#9aa3ad" /></div>
      </div>
      <div className="absolute left-[4%] top-[6%] z-30 max-w-[min(62%,480px)]">
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[1.02] tracking-tight text-plum-900 drop-shadow-[0_2px_0_rgba(255,255,255,.6)]">
          Color your <span className="text-grape-600">future</span>.
        </h1>
        <p className="mt-2 font-display text-lg text-plum-800">
          Explore the{' '}
          {worlds.map((c) => <span key={c.id} className="font-semibold" style={{ color: c.color }}>{c.name[0]}</span>)}
          {' '}trail through 7 worlds!
        </p>
      </div>
      {avatar && (
        <>
          <div className="absolute z-30" style={{ left: '14%', top: H * PATH, height: H * 0.46, transform: 'translate(-50%, -97%)' }}>
            <span className="absolute bottom-[2%] left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-full bg-black/20 blur-[2px]" />
            <Avatar a={avatar} wave className="relative h-full w-auto" />
          </div>
          <div className="absolute z-30 w-max max-w-[300px] rounded-3xl bg-white px-4 py-3 shadow-xl" style={{ left: '24%', top: H * PATH - H * 0.46 }}>
            <p className="font-display text-lg leading-snug text-plum-900">
              {name ? `Hi, I'm ${name}! ` : 'Hi there! '}Let's explore the STREAMS!
            </p>
            <span className="absolute -left-2 bottom-5 h-4 w-4 rotate-45 bg-white" />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onGo} className="btn-primary !px-5 !py-2.5 text-lg">Let's go! ➜</button>
              <button type="button" onClick={onEdit} className="btn-soft !px-3 !py-2.5 text-sm" aria-label="Change my explorer">✏️ Me</button>
            </div>
          </div>
        </>
      )}
      <Foreground biome={SKY} panelLeft={0} panelW={W} vw={vw} H={H} seed={7} />
    </section>
  );
}

function EndH({ left, H, vw, avatar, stars }) {
  const W = END_W;
  const beach = BIOMES[BIOMES.length - 1];
  const shore = W * 0.5;
  const y = H * PATH;
  const riverEnd = smoothPath(Array.from({ length: Math.ceil(shore / 40) + 1 }, (_, i) => [i * 40 - 40, H * riverY(i * 40 - 40)]));
  return (
    <section className="relative h-full shrink-0 overflow-hidden" style={{ width: W }} aria-label="The ocean">
      <Backdrop biome={beach} panelLeft={left} panelW={W} vw={vw} H={H} seed={77} />
      <svg className="absolute inset-0" width={W} height={H} aria-hidden="true">
        {/* the sea fills the right side, from the horizon down to the sand */}
        <path d={`M${shore - 60} ${H * HORIZON} L${W} ${H * HORIZON} L${W} ${H} L${shore + 60} ${H} C${shore + 10} ${H * 0.8} ${shore + 30} ${H * 0.6} ${shore - 60} ${H * HORIZON} Z`} fill="#4fc3d9" />
        <path d={`M${shore + 40} ${H * HORIZON} L${W} ${H * HORIZON} L${W} ${H} L${shore + 160} ${H} C${shore + 110} ${H * 0.8} ${shore + 130} ${H * 0.6} ${shore + 40} ${H * HORIZON} Z`} fill="#3aa9c9" />
        <g className="world-waves">
          {[0.52, 0.64, 0.76, 0.88].map((f, i) => (
            <path key={f} d={`M${shore + 20 + i * 18} ${H * f} q12 -10 24 0 q12 10 24 0`} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".85" />
          ))}
        </g>
      </svg>
      <Ground W={shore + 10} H={H} biome={beach} creeks={[]} trail={TRAIL.beach} riverDOverride={riverEnd} />
      <div className="pointer-events-none absolute z-20" style={{ left: shore * 0.62, top: H * (RIVER - 0.02), transform: 'translate(-50%, -100%)', width: Math.min(110, H * 0.17) }}><A.Lighthouse /></div>
      <div className="pointer-events-none absolute z-20 w-[64px]" style={{ left: shore * 0.8, top: H * 0.99, transform: 'translate(-50%, -100%)' }}><A.Crab /></div>
      <div className="world-bob absolute z-20 w-[150px]" style={{ left: W * 0.74, top: H * 0.64, transform: 'translate(-50%, -80%)' }}><ExplorerBoat avatar={null} /></div>
      {avatar && (
        <div className="absolute z-30" style={{ left: shore * 0.34, top: y, height: H * 0.4, transform: 'translate(-50%, -97%)' }}>
          <span className="absolute bottom-[2%] left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-full bg-black/20 blur-[2px]" />
          <Avatar a={avatar} wave className="relative h-full w-auto" />
        </div>
      )}
      <div className="absolute right-[5%] top-[7%] z-30 max-w-[340px] rounded-3xl bg-white/95 p-5 text-center shadow-xl">
        <p className="font-display text-3xl font-semibold text-plum-900">You made it to the ocean! 🎉</p>
        <p className="mt-2 font-display text-lg text-plum-700">You've earned <strong className="text-grape-600">⭐ {stars}</strong> stars. Which future will you color next?</p>
      </div>
      <div className="world-glide absolute right-[22%] top-[30%] w-12" aria-hidden="true"><A.Seagull /></div>
    </section>
  );
}

// ---------- the whole map ----------

const JourneyHorizontal = forwardRef(function JourneyHorizontal(
  { worlds, byCategory, starsFor, numberFor, onOpen, avatar, onEditAvatar, onActiveChange, totalStars },
  ref,
) {
  const scrollerRef = useRef(null);
  const explorerRef = useRef(null);
  const paths = useRef({});
  const anim = useRef(null);
  const audioStarted = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(-1);
  const [explorer, setExplorer] = useState(null); // { world, mode: 'boat' | 'walk', len, flip, moving }

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = size.h;
  const vw = size.w;
  const startW = Math.round(Math.min(Math.max(vw * 0.92, 640), 980));

  // Absolute left edge of each world (for parallax and jumping).
  const layout = useMemo(() => {
    let x = startW + FALL_W;
    return worlds.map((c, i) => {
      const w = worldWidth(byCategory[c.id].length);
      const entry = { left: x, width: w };
      x += w + (i < worlds.length - 1 ? FALL_W : 0);
      return entry;
    }).concat([{ left: x, width: END_W }]);
  }, [worlds, byCategory, startW]);

  // ----- scrolling: parallax variable, active world, remember position -----
  useEffect(() => {
    const el = scrollerRef.current;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--sx', String(el.scrollLeft));
        const probe = el.scrollLeft + el.clientWidth * 0.45;
        let idx = -1;
        layout.slice(0, worlds.length).forEach((l, i) => { if (probe >= l.left - FALL_W / 2) idx = i; });
        setActive(idx);
        if (!restored.current) return; // don't overwrite the saved spot before it's restored
        try { sessionStorage.setItem('coloredin:scrollX', String(Math.round(el.scrollLeft))); } catch { /* ignore */ }
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [layout, worlds.length]);

  // Restore where the child was (e.g. coming back from coloring).
  const savedX = useRef(null);
  if (savedX.current === null) {
    try { savedX.current = Number(sessionStorage.getItem('coloredin:scrollX')) || 0; } catch { savedX.current = 0; }
  }
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (restored.current || !H) return;
    restored.current = true;
    if (savedX.current) scrollerRef.current.scrollLeft = savedX.current;
    scrollerRef.current.style.setProperty('--sx', String(scrollerRef.current.scrollLeft));
  }, [H]);

  useEffect(() => { onActiveChange?.(active); }, [active, onActiveChange]);

  // Mouse wheel scrolls sideways; arrow keys too.
  useEffect(() => {
    const el = scrollerRef.current;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); }
    };
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowRight') el.scrollBy({ left: 320, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') el.scrollBy({ left: -320, behavior: 'smooth' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => { el.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); };
  }, []);

  // ----- ambience follows the world you're in -----
  const kickAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;
    startAmbience(active >= 0 ? biomeFor(active).ambience : SKY.ambience);
  }, [active]);
  useEffect(() => { if (audioStarted.current) setAmbience(active >= 0 ? biomeFor(active).ambience : SKY.ambience); }, [active]);
  useEffect(() => () => stopAmbience(), []);

  // ----- the explorer: paddles in by swan boat, then walks the trail -----
  const nearestLen = (samples, [x, y]) => {
    let best = 0, bestD = Infinity;
    for (const [len, p] of samples) {
      const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (dd < bestD) { bestD = dd; best = len; }
    }
    return best;
  };
  const sample = (el) => {
    const total = el.getTotalLength();
    const out = [];
    for (let len = 0; len <= total; len += 5) out.push([len, el.getPointAtLength(len)]);
    return { el, total, samples: out };
  };
  const registerRoute = useCallback((world, { trail, stream, stops, dockWalk, dockBoat }) => {
    if (!trail || !stream) return;
    const t = sample(trail);
    const st = sample(stream);
    paths.current[world] = {
      trail: t,
      stream: st,
      stopLens: stops.map((pt) => nearestLen(t.samples, pt)),
      dockBoatLen: nearestLen(st.samples, dockBoat),
      dockWalkLen: nearestLen(t.samples, dockWalk),
    };
  }, []);

  // Where the explorer starts: beside the last level played, else in the boat at the first dock.
  useEffect(() => {
    if (!H || explorer || !worlds.length) return;
    let lastId = null;
    try { lastId = Number(localStorage.getItem('coloredin:last')); } catch { /* ignore */ }
    const t = setTimeout(() => {
      let spot = paths.current[0] ? { world: 0, mode: 'boat', len: paths.current[0].dockBoatLen, flip: false } : null;
      worlds.forEach((c, wi) => {
        const idx = byCategory[c.id].findIndex((p) => p.id === lastId);
        const route = paths.current[wi];
        if (idx >= 0 && route) spot = { world: wi, mode: 'walk', len: Math.max(0, route.stopLens[idx] - 62), flip: false };
      });
      if (spot) setExplorer(spot);
    }, 0);
    return () => clearTimeout(t);
  }, [H, explorer, worlds, byCategory]);

  const placeExplorer = useCallback((world, mode, len, flip) => {
    const route = paths.current[world];
    const node = explorerRef.current;
    if (!route || !node) return null;
    const path = mode === 'boat' ? route.stream : route.trail;
    const L = Math.max(0, Math.min(path.total, len));
    const pt = path.el.getPointAtLength(L);
    node.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
    const inner = node.firstChild;
    if (mode === 'boat') {
      const ahead = path.el.getPointAtLength(Math.min(path.total, L + 6));
      const tilt = Math.max(-12, Math.min(12, (Math.atan2(ahead.y - pt.y, Math.abs(ahead.x - pt.x) || 1) * 180) / Math.PI * 0.4));
      inner.style.transform = `translate(-50%, -72%) scaleX(${flip ? -1 : 1}) rotate(${flip ? -tilt : tilt}deg)`;
    } else {
      inner.style.transform = `translate(-50%, -94%) scaleX(${flip ? -1 : 1})`;
    }
    return pt;
  }, []);

  useLayoutEffect(() => { if (explorer) placeExplorer(explorer.world, explorer.mode, explorer.len, explorer.flip); }, [explorer, placeExplorer, H]);

  const animate = (world, mode, from, to, dur) => new Promise((resolve) => {
    const flip = to < from;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      placeExplorer(world, mode, from + (to - from) * e, flip);
      if (t < 1) anim.current = requestAnimationFrame(step);
      else resolve();
    };
    anim.current = requestAnimationFrame(step);
  });

  const busy = useRef(false);
  const travelTo = useCallback(async (page) => {
    if (busy.current) return;
    const wi = worlds.findIndex((c) => c.id === page.category_id);
    const si = byCategory[page.category_id].findIndex((p) => p.id === page.id);
    const route = paths.current[wi];
    try { localStorage.setItem('coloredin:last', String(page.id)); } catch { /* ignore */ }
    if (!route || !explorer) { onOpen(page); return; }
    busy.current = true;
    cancelAnimationFrame(anim.current);

    const scroller = scrollerRef.current;
    const cur = paths.current[explorer.world];
    const curPath = explorer.mode === 'boat' ? cur?.stream : cur?.trail;
    const curX = (layout[explorer.world]?.left ?? 0) + (curPath ? curPath.el.getPointAtLength(explorer.len).x : 0);
    const onScreen = curX > scroller.scrollLeft - 80 && curX < scroller.scrollLeft + scroller.clientWidth + 80;
    const sameWorld = explorer.world === wi && onScreen;

    let walkFrom;
    if (!sameWorld || explorer.mode === 'boat') {
      // Paddle in on the swan boat, hop onto the dock.
      const boatFrom = sameWorld ? explorer.len : Math.max(0, route.dockBoatLen - 240);
      setExplorer({ world: wi, mode: 'boat', len: boatFrom, flip: false, moving: true });
      sfx.fill();
      await new Promise((r) => requestAnimationFrame(r));
      await animate(wi, 'boat', boatFrom, route.dockBoatLen, 700);
      walkFrom = route.dockWalkLen;
    } else {
      walkFrom = explorer.len;
    }
    const goingForward = route.stopLens[si] >= walkFrom;
    const target = Math.max(0, route.stopLens[si] + (goingForward ? -62 : 62));
    setExplorer({ world: wi, mode: 'walk', len: walkFrom, flip: !goingForward, moving: true });
    await new Promise((r) => requestAnimationFrame(r));
    sfx.tool();
    await animate(wi, 'walk', walkFrom, target, Math.min(1900, Math.max(500, Math.abs(target - walkFrom) * 1.5)));
    setExplorer({ world: wi, mode: 'walk', len: target, flip: !goingForward, moving: false });
    busy.current = false;
    setTimeout(() => onOpen(page), 200);
  }, [worlds, byCategory, explorer, layout, onOpen, placeExplorer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  useImperativeHandle(ref, () => ({
    jumpTo: (i) => scrollerRef.current?.scrollTo({ left: Math.max(0, layout[i].left - 40), behavior: 'smooth' }),
    nudge: (dir) => scrollerRef.current?.scrollBy({ left: dir * scrollerRef.current.clientWidth * 0.7, behavior: 'smooth' }),
    kickAudio,
  }), [layout, kickAudio]);

  const explorerEl = avatar && explorer && (
    <div ref={explorerRef} className="pointer-events-none absolute left-0 top-0 z-[35] will-change-transform">
      <div data-moving={explorer.moving ? 'true' : 'false'}>
        {explorer.mode === 'boat'
          ? <div className="world-bob"><ExplorerBoat avatar={avatar} /></div>
          : <WalkingExplorer avatar={avatar} />}
      </div>
    </div>
  );

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar relative h-full w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
      onPointerDown={kickAudio}
      style={{ touchAction: 'pan-x' }}
    >
      {H > 0 && (
        <div className="flex h-full w-max">
          <StartH W={startW} H={H} vw={vw} avatar={avatar} worlds={worlds} onEdit={onEditAvatar} onGo={() => { kickAudio(); sfx.pick(); scrollerRef.current.scrollTo({ left: layout[0].left - 40, behavior: 'smooth' }); }} />
          <FallH upper={{ ...SKY, water: BIOMES[0].water, bank: SKY.cliff.lip }} lower={BIOMES[0]} H={H} seed={0} />
          {worlds.map((c, i) => (
            <div key={c.id} className="contents">
              <WorldH
                category={c}
                index={i}
                pages={byCategory[c.id]}
                left={layout[i].left}
                vw={vw}
                H={H}
                starsFor={starsFor}
                numberFor={numberFor}
                onSelect={travelTo}
                registerRoute={registerRoute}
                explorer={explorer?.world === i ? explorerEl : null}
                boatInUse={explorer?.world === i && explorer.mode === 'boat'}
              />
              {i < worlds.length - 1 && <FallH upper={biomeFor(i)} lower={biomeFor(i + 1)} H={H} seed={i + 1} />}
            </div>
          ))}
          <EndH left={layout[worlds.length].left} H={H} vw={vw} avatar={avatar} stars={totalStars} />
        </div>
      )}
    </div>
  );
});

export default JourneyHorizontal;
