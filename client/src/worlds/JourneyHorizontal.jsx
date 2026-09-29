import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Avatar from '../avatar/Avatar.jsx';
import { sfx } from '../lib/sound.js';
import { speak } from '../lib/speech.js';
import { setAmbience, startAmbience, stopAmbience } from '../lib/ambience.js';
import * as A from './art.jsx';
import { BIOMES, SKY, biomeFor } from './biomes.js';
import { Art, Particles, rng, smoothPath } from './Journey.jsx';
import LevelStop, { ExplorerBoat } from './LevelStop.jsx';

// The iPad-first adventure map: a side-scrolling world the child swipes
// through. Every world is built in layers for depth: sky and sun, hazy far
// hills, nearer hills, the ground with the stream and levels, and a blurred
// foreground, each sliding at its own speed (parallax). The stream pours over
// a waterfall between worlds, and the explorer rows their boat to each level.

const SIGN = 300; // space at the start of a world (title ribbon + bridge)
const COL = 214; // horizontal space per level
const TAIL = 320; // space at the end of a world (landmark)
const FALL_W = 250;
const END_W = 780;
const HORIZON = 0.27;
const ENTRY = 0.8; // stream height where it enters a world (after the fall)
const EXIT = 0.47; // stream height where it leaves a world (top of the cliff)
const stopY = (i) => (i % 2 === 0 ? 0.7 : 0.43);
const worldWidth = (n) => SIGN + n * COL + TAIL;

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
    <Layer k={-0.3} panelLeft={panelLeft} panelW={panelW} vw={vw} z={40}>
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
              <g key={i} transform={`translate(${x} ${H}) scale(${s})`} fill={biome.fg} opacity=".9">
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

// ---------- stream helpers ----------

function StreamSvg({ d, w, H, biome, pathRef }) {
  const common = { d, fill: 'none', strokeLinecap: 'round' };
  return (
    <svg className="pointer-events-none absolute left-0 top-0" width={w} height={H} aria-hidden="true">
      <path {...common} stroke="#1b3a2a" strokeOpacity=".1" strokeWidth="96" transform="translate(0 6)" />
      <path {...common} stroke={biome.bank} strokeWidth="88" />
      <path ref={pathRef} {...common} stroke={biome.water} strokeWidth="66" />
      <path {...common} stroke={biome.light} strokeWidth="30" opacity=".75" />
      <path {...common} stroke="#fff" strokeWidth="3" strokeDasharray="16 38" opacity=".85" className="stream-flow" />
      <path {...common} stroke="#fff" strokeWidth="2" strokeDasharray="6 46" opacity=".6" className="stream-flow-slow" transform="translate(0 14)" />
      <path {...common} stroke="#fff" strokeWidth="2" strokeDasharray="6 52" opacity=".5" className="stream-flow" transform="translate(0 -14)" />
    </svg>
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

function LogBridge({ x, y }) {
  return (
    <div className="pointer-events-none absolute z-[26]" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }} aria-hidden="true">
      <svg width="58" height="150" viewBox="0 0 58 150">
        <rect x="6" y="10" width="46" height="130" rx="20" fill="#9a6238" />
        <rect x="12" y="10" width="14" height="130" rx="7" fill="#b47a4a" />
        <path d="M18 30 L18 60 M40 70 L40 110 M30 118 L30 132" stroke="#7a4a2e" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="29" cy="12" rx="23" ry="10" fill="#e7bf8e" stroke="#7a4a2e" strokeWidth="3" />
        <ellipse cx="29" cy="12" rx="11" ry="4.5" fill="none" stroke="#b47a4a" strokeWidth="2" />
        <ellipse cx="29" cy="138" rx="23" ry="10" fill="#9a6238" />
        <path d="M14 50 C8 54 8 62 16 62 M44 90 C52 92 52 100 44 102" stroke="#5cc27a" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ---------- one world ----------

function WorldH({ category, index, pages, left, vw, H, starsFor, numberFor, onSelect, registerPath, boat }) {
  const biome = biomeFor(index);
  const n = pages.length;
  const W = worldWidth(n);
  const stops = pages.map((_, i) => [SIGN + i * COL + COL / 2, H * stopY(i)]);
  const d = smoothPath([[0, H * ENTRY], [SIGN * 0.75, H * ENTRY], ...stops, [W - TAIL * 0.35, H * EXIT], [W, H * EXIT]]);
  const pathRef = useRef(null);
  const r = rng(index + 3);

  useLayoutEffect(() => {
    registerPath(index, pathRef.current, stops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, H, n]);

  const art = [];
  pages.forEach((p, i) => {
    const [x, y] = stops[i];
    const topStop = y < H * 0.5;
    const Near = biome.near[i % biome.near.length];
    const Critter = biome.critters[i % biome.critters.length];
    // Opposite band from the level: near band is bigger (closer), far band smaller.
    if (topStop) art.push({ Comp: Near, x: x + 10, bottom: H * 0.995, w: Math.min(190, H * 0.28), key: `n${i}` });
    else if (i > 0) art.push({ Comp: Near, x: x - 6, bottom: H * 0.36, w: Math.min(120, H * 0.17), key: `n${i}`, far: true });
    if (i < n - 1) {
      const mx = x + COL / 2;
      const critterTop = i % 2 === 0;
      art.push({ Comp: Critter, x: mx, bottom: critterTop ? H * 0.34 : H * 0.97, w: critterTop ? 56 : 80, key: `c${i}`, critter: true, far: critterTop });
      art.push({ Comp: A.Rock, x: mx - 40, bottom: H * 0.585 + 26, w: 34, key: `r${i}` });
      art.push({ Comp: A.Rock, x: mx + 42, bottom: H * 0.585 - 22, w: 26, key: `q${i}` });
    }
    if (i % 2 === 1 && !biome.snowy) art.push({ Comp: A.Flowers, x: x - 70, bottom: H * 0.99, w: 64, key: `f${i}` });
  });
  // grass tufts: bigger near the viewer, smaller toward the horizon
  if (!biome.snowy) {
    for (let k = 0; k < Math.floor(W / 90); k++) {
      const depth = r(); // 0 = far (near horizon), 1 = near (bottom)
      const y = H * (HORIZON + 0.08 + depth * 0.64);
      const x = r() * W;
      const onStream = Math.abs(y - H * 0.585) < H * 0.2 && x > SIGN * 0.5 && x < W - TAIL * 0.3;
      if (!onStream) art.push({ Comp: A.Grass, x, bottom: y, w: 18 + depth * 34, key: `g${k}`, far: depth < 0.4, tint: GRASS[biome.key] ?? '#5cc27a' });
    }
  }
  // big trees framing the far band
  for (let x = SIGN + 40; x < W - 200; x += 330 + r() * 120) {
    art.push({ Comp: biome.edges[Math.floor(r() * biome.edges.length)], x, bottom: H * 0.31, w: Math.min(110, H * 0.16), key: `e${x}`, far: true, dim: true });
  }

  const speakWorld = () => {
    sfx.pick();
    speak(`Welcome to the ${biome.name}! ${category.name[0]} is for ${category.name}. ${category.description ?? ''}`);
  };

  return (
    <section id={`stream-${category.id}`} data-world={index} className="relative h-full shrink-0 overflow-hidden" style={{ width: W }} aria-labelledby={`world-${category.id}`}>
      <Backdrop biome={biome} panelLeft={left} panelW={W} vw={vw} H={H} seed={index + 1} village={biome.key === 'garden' || biome.key === 'autumn'} />
      <Particles kind={biome.particles} seed={index} />

      <StreamSvg d={d} w={W} H={H} biome={biome} pathRef={pathRef} />
      {art.map(({ Comp, x, bottom, w, key, critter, far, dim, tint }, i) => {
        const props = {
          Comp, biome, i, tint, left: x, top: bottom, width: w,
          transform: 'translate(-50%, -100%)',
          filter: dim ? 'saturate(.8) brightness(1.04)' : undefined,
          opacity: far ? 0.95 : 1,
          zIndex: far ? 5 : 30,
        };
        return critter ? <CritterArt key={key} {...props} /> : <Art key={key} {...props} />;
      })}
      <Art Comp={biome.landmark} biome={biome} i={0} left={W - 170} top={H * 0.985} width={Math.min(260, H * 0.42)} transform="translate(-50%, -100%)" zIndex={15} />
      <Foreground biome={biome} panelLeft={left} panelW={W} vw={vw} H={H} seed={index + 30} />
      <LogBridge x={SIGN * 0.62} y={H * ENTRY} />
      <Ribbon category={category} biome={biome} index={index} onSpeak={speakWorld} />

      <h2 id={`world-${category.id}`} className="sr-only">{category.name}</h2>
      {pages.map((p, i) => (
        <LevelStop
          key={p.id}
          page={p}
          category={category}
          left={stops[i][0]}
          top={stops[i][1]}
          number={numberFor(p)}
          stars={starsFor(p)}
          scale={stops[i][1] < H * 0.5 ? 0.9 : 1}
          onSelect={onSelect}
        />
      ))}
      {boat}
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

function FallH({ upper, lower, left, vw, H, seed }) {
  const y1 = H * EXIT;
  const y2 = H * ENTRY;
  const r = rng(seed * 13);
  const cliffTop = H * HORIZON + 10;
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
        {/* rock wall with the upper world on its plateau */}
        <path d={`M0 ${cliffTop} L150 ${cliffTop} C168 ${cliffTop + 30} 158 ${H * 0.6} 172 ${H} L0 ${H} Z`} fill={upper.cliff.rock} />
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={10 + (i % 3) * 48 + r() * 10} y={cliffTop + 20 + Math.floor(i / 3) * ((H - cliffTop) / 5)} width={40 + r() * 16} height={(H - cliffTop) / 6} rx="12" fill={i % 2 ? upper.cliff.dark : '#fff'} opacity={i % 2 ? 0.5 : 0.12} />
        ))}
        <path d={`M0 ${cliffTop - 6} Q40 ${cliffTop + 14} 80 ${cliffTop} T160 ${cliffTop + 4} L160 ${cliffTop + 16} Q120 ${cliffTop + 28} 80 ${cliffTop + 16} T0 ${cliffTop + 18} Z`} fill={upper.cliff.lip} />
        {/* stream arriving on top, then the fall */}
        <path d={`M0 ${y1} L118 ${y1}`} stroke={upper.bank} strokeWidth="88" strokeLinecap="butt" />
        <path d={`M0 ${y1} L126 ${y1}`} stroke={upper.water} strokeWidth="66" />
        <path d={`M118 ${y1 - 33} C150 ${y1 - 33} 156 ${y1} 158 ${y1 + 30} L160 ${y2} L108 ${y2} L110 ${y1 + 33} Z`} fill={`url(#hfall-${seed})`} />
        {[116, 128, 140, 150].map((x, i) => (
          <path key={x} d={`M${x} ${y1 - 10} L${x + 4} ${y2 - 10}`} stroke="#fff" strokeWidth={i % 2 ? 3 : 2} strokeDasharray="18 22" opacity=".8" className="waterfall-flow" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        {/* pool, foam and mist at the bottom */}
        <path d={`M100 ${y2} L${FALL_W} ${y2}`} stroke={lower.bank} strokeWidth="88" />
        <path d={`M96 ${y2} L${FALL_W} ${y2}`} stroke={lower.water} strokeWidth="66" />
        <ellipse cx="134" cy={y2} rx="62" ry="34" fill={lower.water} />
        <ellipse cx="134" cy={y2} rx="40" ry="18" fill={lower.light} />
        {[[108, -8, 14], [124, -14, 17], [146, -10, 16], [164, -4, 13], [134, 2, 18]].map(([x, dy, rr], i) => (
          <circle key={x} cx={x} cy={y2 + dy} r={rr} fill="#fff" opacity=".92" className="waterfall-foam" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        <ellipse cx="134" cy={y2 - 30} rx="70" ry="26" fill="#fff" opacity=".28" className="waterfall-mist" />
        <ellipse cx="86" cy={y2 + 30} rx="26" ry="14" fill="#8a939d" />
        <ellipse cx="190" cy={y2 + 36} rx="30" ry="15" fill="#9aa3ad" />
      </svg>
    </div>
  );
}

// ---------- start and end ----------

function StartH({ W, H, vw, avatar, onGo, onEdit, worlds }) {
  const spring = [W * 0.64, H * 0.36];
  const d = smoothPath([spring, [W * 0.8, H * 0.42], [W, H * EXIT]]);
  const name = avatar?.name?.trim();
  return (
    <section className="relative h-full shrink-0 overflow-hidden" style={{ width: W }} aria-label="Start">
      <Backdrop biome={SKY} panelLeft={0} panelW={W} vw={vw} H={H} seed={99} village />
      <StreamSvg d={d} w={W} H={H} biome={{ ...BIOMES[0], bank: SKY.cliff.lip }} />
      <div className="absolute z-20" style={{ left: spring[0], top: spring[1], transform: 'translate(-50%, -70%)' }} aria-hidden="true">
        <div className="w-[90px]"><A.Rock tint="#9aa3ad" /></div>
      </div>
      <div className="absolute left-[4%] top-[6%] z-30 max-w-[min(60%,460px)]">
        <h1 className="font-display text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[1.02] tracking-tight text-plum-900 drop-shadow-[0_2px_0_rgba(255,255,255,.6)]">
          Color your <span className="text-grape-600">future</span>.
        </h1>
        <p className="mt-2 font-display text-lg text-plum-800">
          Sail the{' '}
          {worlds.map((c) => <span key={c.id} className="font-semibold" style={{ color: c.color }}>{c.name[0]}</span>)}
          {' '}river through 7 worlds!
        </p>
      </div>
      {avatar && (
        <div className="absolute bottom-[3%] left-[6%] z-30 h-[58%]">
          <Avatar a={avatar} wave className="h-full w-auto drop-shadow-[0_14px_14px_rgba(20,60,30,.3)]" />
          <div className="absolute -top-2 left-[78%] w-max max-w-[280px] rounded-3xl bg-white px-4 py-3 shadow-xl">
            <p className="font-display text-lg leading-snug text-plum-900">
              {name ? `Hi, I'm ${name}! ` : 'Hi there! '}Let's explore the STREAMS!
            </p>
            <span className="absolute -left-2 bottom-4 h-4 w-4 rotate-45 bg-white" />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onGo} className="btn-primary !px-5 !py-2.5 text-lg">Let's go! ➜</button>
              <button type="button" onClick={onEdit} className="btn-soft !px-3 !py-2.5 text-sm" aria-label="Change my explorer">✏️ Me</button>
            </div>
          </div>
        </div>
      )}
      <Foreground biome={SKY} panelLeft={0} panelW={W} vw={vw} H={H} seed={7} />
    </section>
  );
}

function EndH({ left, H, vw, avatar, stars }) {
  const W = END_W;
  const lastBiome = BIOMES[BIOMES.length - 1];
  const shore = W * 0.46;
  return (
    <section className="relative h-full shrink-0 overflow-hidden" style={{ width: W }} aria-label="The ocean">
      <Backdrop biome={lastBiome} panelLeft={left} panelW={W} vw={vw} H={H} seed={77} />
      <svg className="absolute inset-0" width={W} height={H} aria-hidden="true">
        <path d={`M0 ${H * EXIT - 33} C${shore * 0.6} ${H * EXIT - 33} ${shore * 0.8} ${H * 0.3} ${shore} ${H * 0.28} L${shore} ${H} C${shore * 0.8} ${H * 0.7} ${shore * 0.6} ${H * EXIT + 33} 0 ${H * EXIT + 33} Z`} fill={lastBiome.water} />
        <path d={`M${shore - 30} ${H * 0.27} C${shore + 20} ${H * 0.5} ${shore - 40} ${H * 0.75} ${shore + 10} ${H} L${W} ${H} L${W} ${H * 0.27} Z`} fill="#4fc3d9" />
        <path d={`M${shore + 60} ${H * 0.27} C${shore + 110} ${H * 0.5} ${shore + 50} ${H * 0.75} ${shore + 100} ${H} L${W} ${H} L${W} ${H * 0.27} Z`} fill="#3aa9c9" />
        <path d={`M${shore + 180} ${H * 0.27} C${shore + 230} ${H * 0.5} ${shore + 170} ${H * 0.75} ${shore + 220} ${H} L${W} ${H} L${W} ${H * 0.27} Z`} fill="#2f93b8" />
        <g className="world-waves">
          {[0.35, 0.5, 0.65, 0.8].map((f) => (
            <path key={f} d={`M${shore - 10 + f * 30} ${H * f} q12 -10 24 0 q12 10 24 0`} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".85" />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute z-20" style={{ left: W * 0.22, top: H * 0.98, transform: 'translate(-50%, -100%)', width: Math.min(150, H * 0.24) }}><A.Lighthouse /></div>
      <div className="pointer-events-none absolute z-20 w-[70px]" style={{ left: W * 0.36, top: H * 0.95, transform: 'translate(-50%, -100%)' }}><A.Crab /></div>
      {avatar && (
        <div className="absolute z-30 h-[46%]" style={{ left: W * 0.08, bottom: '3%' }}>
          <Avatar a={avatar} wave className="h-full w-auto drop-shadow-[0_12px_12px_rgba(0,0,0,.25)]" />
        </div>
      )}
      <div className="absolute right-[5%] top-[8%] z-30 max-w-[360px] rounded-3xl bg-white/95 p-5 text-center shadow-xl">
        <p className="font-display text-3xl font-semibold text-plum-900">You made it to the ocean! 🎉</p>
        <p className="mt-2 font-display text-lg text-plum-700">You've earned <strong className="text-grape-600">⭐ {stars}</strong> stars. Which future will you color next?</p>
      </div>
      <div className="world-glide absolute right-[18%] top-[30%] w-12" aria-hidden="true"><A.Seagull /></div>
    </section>
  );
}

// ---------- the whole map ----------

const JourneyHorizontal = forwardRef(function JourneyHorizontal(
  { worlds, byCategory, starsFor, numberFor, onOpen, avatar, onEditAvatar, onActiveChange, totalStars },
  ref,
) {
  const scrollerRef = useRef(null);
  const boatRef = useRef(null);
  const paths = useRef({});
  const anim = useRef(null);
  const audioStarted = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(-1);
  const [boat, setBoat] = useState(null); // { world, len, flip }

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

  // ----- the boat -----
  const registerPath = useCallback((world, el, stops) => {
    if (!el) return;
    const total = el.getTotalLength();
    const samples = [];
    for (let s = 0; s <= total; s += 6) samples.push([s, el.getPointAtLength(s)]);
    const stopLens = stops.map(([x, y]) => {
      let best = 0, bestD = Infinity;
      for (const [s, p] of samples) {
        const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (dd < bestD) { bestD = dd; best = s; }
      }
      return best;
    });
    paths.current[world] = { el, total, stopLens };
  }, []);

  // Initial boat spot: the last level played, else the first world's entrance.
  useEffect(() => {
    if (!H || boat || !worlds.length) return;
    let lastId = null;
    try { lastId = Number(localStorage.getItem('coloredin:last')); } catch { /* ignore */ }
    const t = setTimeout(() => {
      let spot = { world: 0, len: SIGN * 0.62 + 110, flip: false };
      worlds.forEach((c, wi) => {
        const idx = byCategory[c.id].findIndex((p) => p.id === lastId);
        if (idx >= 0 && paths.current[wi]) spot = { world: wi, len: Math.max(0, paths.current[wi].stopLens[idx] - 118), flip: false };
      });
      setBoat(spot);
    }, 0);
    return () => clearTimeout(t);
  }, [H, boat, worlds, byCategory]);

  const placeBoat = useCallback((world, len, flip) => {
    const p = paths.current[world];
    const node = boatRef.current;
    if (!p || !node) return;
    const pt = p.el.getPointAtLength(Math.max(0, Math.min(p.total, len)));
    const ahead = p.el.getPointAtLength(Math.max(0, Math.min(p.total, len + (flip ? -6 : 6))));
    const tilt = Math.max(-14, Math.min(14, (Math.atan2(ahead.y - pt.y, Math.abs(ahead.x - pt.x) || 1) * 180) / Math.PI * 0.45));
    node.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -78%)`;
    node.firstChild.style.transform = `scaleX(${flip ? -1 : 1}) rotate(${flip ? -tilt : tilt}deg)`;
  }, []);

  useLayoutEffect(() => { if (boat) placeBoat(boat.world, boat.len, boat.flip); }, [boat, placeBoat, H]);

  const sailTo = useCallback((page) => {
    const wi = worlds.findIndex((c) => c.id === page.category_id);
    const si = byCategory[page.category_id].findIndex((p) => p.id === page.id);
    const p = paths.current[wi];
    try { localStorage.setItem('coloredin:last', String(page.id)); } catch { /* ignore */ }
    if (!p || !boat) { onOpen(page); return; }
    const target = Math.max(0, p.stopLens[si] - 118);
    let from = boat.world === wi ? boat.len : Math.max(0, target - 260);
    const scroller = scrollerRef.current;
    const boatX = layout[boat.world]?.left + (paths.current[boat.world]?.el.getPointAtLength(boat.len).x ?? 0);
    const onScreen = boatX > scroller.scrollLeft - 100 && boatX < scroller.scrollLeft + scroller.clientWidth + 100;
    if (boat.world !== wi || !onScreen) from = Math.max(0, target - 260);
    const flip = target < from;
    const dur = Math.min(1600, Math.max(450, Math.abs(target - from) * 1.6));
    cancelAnimationFrame(anim.current);
    setBoat({ world: wi, len: from, flip });
    sfx.fill();
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      placeBoat(wi, from + (target - from) * e, flip);
      if (t < 1) anim.current = requestAnimationFrame(step);
      else {
        setBoat({ world: wi, len: target, flip });
        setTimeout(() => onOpen(page), 220);
      }
    };
    anim.current = requestAnimationFrame(step);
  }, [worlds, byCategory, boat, layout, onOpen, placeBoat]);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  useImperativeHandle(ref, () => ({
    jumpTo: (i) => scrollerRef.current?.scrollTo({ left: Math.max(0, layout[i].left - 40), behavior: 'smooth' }),
    nudge: (dir) => scrollerRef.current?.scrollBy({ left: dir * scrollerRef.current.clientWidth * 0.7, behavior: 'smooth' }),
    kickAudio,
  }), [layout, kickAudio]);

  const boatEl = avatar && (
    <div ref={boatRef} className="pointer-events-none absolute left-0 top-0 z-[25] will-change-transform">
      <div><div className="world-bob"><ExplorerBoat avatar={avatar} /></div></div>
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
          <FallH upper={{ ...SKY, water: BIOMES[0].water, bank: SKY.cliff.lip }} lower={BIOMES[0]} left={startW} vw={vw} H={H} seed={0} />
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
                onSelect={sailTo}
                registerPath={registerPath}
                boat={boat?.world === i ? boatEl : null}
              />
              {i < worlds.length - 1 && <FallH upper={biomeFor(i)} lower={biomeFor(i + 1)} left={layout[i].left + layout[i].width} vw={vw} H={H} seed={i + 1} />}
            </div>
          ))}
          <EndH left={layout[worlds.length].left} H={H} vw={vw} avatar={avatar} stars={totalStars} />
        </div>
      )}
    </div>
  );
});

export default JourneyHorizontal;
