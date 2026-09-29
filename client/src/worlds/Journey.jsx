import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { careerEmoji } from '../lib/careerEmoji.js';
import { sfx } from '../lib/sound.js';
import { speak } from '../lib/speech.js';
import * as A from './art.jsx';
import { BIOMES, SKY, biomeFor } from './biomes.js';

// The STREAMS journey: one continuous stream running down the page through a
// different world for each career group. Careers are stops along the stream
// (like levels on a game map), and each world ends in a waterfall that drops
// into the next. Stream x is in % of the centre column; y is in px.

const HEADER = 230; // log bridge with the world's name
const ROW = 184; // vertical space per career stop
const TAIL = 70;
const stopX = (i) => (i % 2 === 0 ? 30 : 70);
const stopY = (i) => HEADER + i * ROW + 74;

const AUTUMN = [['#f28c38', '#ffb45c'], ['#e8594f', '#ff8a7a'], ['#f2b92c', '#ffe07a']];

function smoothPath(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const [p1, p2] = [points[i], points[i + 1]];
    const p3 = points[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Deterministic pseudo-random numbers so scenery stays put between renders. */
function rng(seed) {
  let a = seed * 9301 + 49297;
  return () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
}

function Art({ Comp, biome, i, ...style }) {
  const props = { snowy: biome.snowy };
  if (Comp === A.AutumnTree) [props.a, props.b] = AUTUMN[i % AUTUMN.length];
  return (
    <div className="pointer-events-none absolute" style={style}>
      <Comp {...props} />
    </div>
  );
}

// ---------- the stream itself ----------

function Stream({ d, height, biome }) {
  const common = { d, fill: 'none', vectorEffect: 'non-scaling-stroke', strokeLinecap: 'round' };
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path {...common} stroke={biome.bank} strokeWidth="78" strokeLinecap="butt" />
      <path {...common} stroke={biome.water} strokeWidth="58" strokeLinecap="butt" />
      <path {...common} stroke={biome.light} strokeWidth="26" strokeLinecap="butt" opacity=".75" />
      <path {...common} stroke="#fff" strokeWidth="3" strokeDasharray="14 36" opacity=".85" className="stream-flow" />
      <path {...common} stroke="#fff" strokeWidth="2" strokeDasharray="5 44" opacity=".6" className="stream-flow-slow" />
    </svg>
  );
}

// ---------- waterfall between worlds ----------

export function Waterfall({ upper, lower, first }) {
  const r = rng(upper.key.length * 7 + lower.key.length);
  const blocks = Array.from({ length: 34 }, (_, i) => ({
    x: (i % 17) * 72 - 20 + r() * 20, y: i < 17 ? 50 : 96, w: 60 + r() * 30, h: 38 + r() * 10, dark: r() > 0.5,
  }));
  return (
    <div className="relative h-[200px] w-full overflow-hidden" style={{ background: upper.bg }} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`fall-${upper.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={upper.water ?? '#58bfbf'} />
            <stop offset="1" stopColor={lower.light} />
          </linearGradient>
        </defs>
        {/* cliff face */}
        <path d="M0 40 L1200 40 L1200 150 L0 150 Z" fill={upper.cliff.rock} />
        {blocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="12" fill={b.dark ? upper.cliff.dark : '#fff'} opacity={b.dark ? 0.55 : 0.12} />
        ))}
        {/* grassy / snowy lip */}
        <path d="M0 30 Q60 50 120 36 T240 38 T360 34 T480 40 T600 34 T720 40 T840 36 T960 40 T1080 34 T1200 38 L1200 0 L0 0 Z" fill={upper.bg} />
        <path d="M0 30 Q60 50 120 36 T240 38 T360 34 T480 40 T600 34 T720 40 T840 36 T960 40 T1080 34 T1200 38 L1200 48 Q1140 58 1080 46 T960 50 T840 46 T720 52 T600 46 T480 50 T360 46 T240 50 T120 46 T0 48 Z" fill={upper.cliff.lip} />
        {/* lower world begins */}
        <path d="M0 150 Q100 136 200 146 T400 144 T600 140 T800 146 T1000 142 T1200 148 L1200 200 L0 200 Z" fill={lower.bg} />
        {/* the waterfall */}
        {first && <path d="M560 0 L640 0 L630 40 L570 40 Z" fill={lower.water} />}
        <path d="M571 30 L629 30 L634 168 L566 168 Z" fill={`url(#fall-${upper.key})`} />
        {[580, 592, 604, 616].map((x, i) => (
          <path key={x} d={`M${x} 34 L${x + (x - 600) * 0.05} 164`} stroke="#fff" strokeWidth={i % 2 ? 3 : 2} strokeDasharray="18 22" opacity=".75" className="waterfall-flow" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        <ellipse cx="600" cy="172" rx="90" ry="20" fill={lower.water} />
        <ellipse cx="600" cy="172" rx="56" ry="11" fill={lower.light} />
        {[[560, 162, 14], [584, 158, 16], [612, 158, 17], [640, 164, 13], [600, 166, 18]].map(([x, y, rr], i) => (
          <circle key={x} cx={x} cy={y} r={rr} fill="#fff" opacity=".9" className="waterfall-foam" style={{ animationDelay: `${i * 0.25}s` }} />
        ))}
        <ellipse cx="600" cy="150" rx="80" ry="16" fill="#fff" opacity=".35" className="waterfall-foam" />
        {/* rocks at the base */}
        <ellipse cx="488" cy="176" rx="34" ry="16" fill="#9aa3ad" />
        <ellipse cx="712" cy="178" rx="30" ry="14" fill="#8a939d" />
        <ellipse cx="480" cy="170" rx="14" ry="5" fill="#fff" opacity=".35" />
      </svg>
    </div>
  );
}

// ---------- one world ----------

function World({ category, index, pages, onPreview, drafts }) {
  const biome = biomeFor(index);
  const n = pages.length;
  const height = HEADER + n * ROW + TAIL;
  const points = [[50, 0], [50, 120], ...pages.map((_, i) => [stopX(i), stopY(i)]), [50, height]];
  const d = smoothPath(points);
  const r = rng(index + 3);
  const letter = category.name[0];

  const speakWorld = () => {
    sfx.pick();
    speak(`Welcome to the ${biome.name}! ${letter} is for ${category.name}. ${category.description ?? ''}`);
  };

  // Big scenery in the side margins (wide screens only).
  const edgeArt = [];
  for (let y = 40, k = 0; y < height - 120; y += 230, k++) {
    edgeArt.push({ Comp: biome.edges[k % biome.edges.length], side: k % 2 ? 'right' : 'left', y, k });
    edgeArt.push({ Comp: biome.edges[(k + 1) % biome.edges.length], side: k % 2 ? 'left' : 'right', y: y + 110, k: k + 1 });
  }

  return (
    <section id={`stream-${category.id}`} className="relative scroll-mt-32 overflow-hidden" style={{ background: biome.bg }} aria-labelledby={`world-${category.id}`}>
      {/* distant hills */}
      <svg className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
        {biome.key === 'mountains'
          ? <path d="M0 160 L0 90 L120 30 L220 100 L330 20 L450 110 L560 40 L680 120 L800 30 L920 100 L1040 40 L1200 110 L1200 160 Z" fill={biome.far} />
          : <path d="M0 160 L0 70 Q150 20 300 70 T600 60 T900 70 T1200 50 L1200 160 Z" fill={biome.far} opacity=".7" />}
      </svg>

      <div className="hidden lg:block">
        {edgeArt.map(({ Comp, side, y, k }) => (
          <Art key={`${side}${y}`} Comp={Comp} biome={biome} i={k} top={y} {...{ [side]: `${2 + r() * 8}%` }} width={`${150 + r() * 70}px`} />
        ))}
      </div>

      <Particles kind={biome.particles} seed={index} />

      <div className="relative mx-auto max-w-3xl" style={{ height }}>
        <Stream d={d} height={height} biome={biome} />

        {/* scenery beside each stop, rocks along the banks, critters */}
        {pages.map((p, i) => {
          const x = stopX(i);
          const y = stopY(i);
          const Near = biome.near[i % biome.near.length];
          const Critter = biome.critters[i % biome.critters.length];
          const midY = y + ROW / 2 + 6;
          return (
            <div key={`deco-${p.id}`}>
              <Art Comp={Near} biome={biome} i={i} left={`${x < 50 ? 84 : 16}%`} top={y - 70} width="clamp(78px, 17vw, 132px)" transform="translateX(-50%)" />
              {i < n - 1 && (
                <>
                  <Art Comp={A.Rock} biome={biome} i={i} left="calc(50% - 64px)" top={midY - 12} width="38px" />
                  <Art Comp={A.Rock} biome={biome} i={i} left="calc(50% + 34px)" top={midY + 2} width="30px" />
                  <Art Comp={Critter} biome={biome} i={i} left={`${x < 50 ? 12 : 88}%`} top={midY - 30} width="clamp(46px, 9vw, 70px)" transform="translateX(-50%)" />
                </>
              )}
              {i % 2 === 1 && !biome.snowy && (
                <Art Comp={A.Flowers} biome={biome} i={i} left={`${x < 50 ? 60 : 40}%`} top={y + 104} width="56px" transform="translateX(-50%)" />
              )}
            </div>
          );
        })}
        {biome.key !== 'tundra' && <Art Comp={A.LilyPad} biome={biome} i={0} left="calc(50% + 6px)" top={HEADER - 36} width="40px" />}

        {/* log bridge with the world title */}
        <div className="absolute left-1/2 top-[70px] w-[min(94%,500px)] -translate-x-1/2">
          <div className="relative flex items-center gap-3 rounded-full px-4 py-3 shadow-[0_10px_24px_-10px_rgba(60,30,10,.55)]"
            style={{ background: 'linear-gradient(180deg,#b47a4a 0%,#9a6238 55%,#84522d 100%)' }}>
            <span className="absolute -left-3 top-1/2 h-[calc(100%+8px)] w-8 -translate-y-1/2 rounded-full border-4 border-[#6f4428] bg-[#e7bf8e]" aria-hidden="true" />
            <span className="absolute -right-3 top-1/2 h-[calc(100%+8px)] w-8 -translate-y-1/2 rounded-full border-4 border-[#6f4428] bg-[#e7bf8e]" aria-hidden="true" />
            <span className="relative z-10 ml-3 grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-3xl font-bold text-white ring-4 ring-white/90" style={{ background: category.color }}>
              {letter}
            </span>
            <div className="relative z-10 min-w-0 flex-1 text-white">
              <p className="font-display text-xs uppercase tracking-widest text-[#ffe9c7]">World {index + 1} · {biome.name} {biome.emoji}</p>
              <h2 id={`world-${category.id}`} className="text-lg font-semibold leading-tight drop-shadow sm:text-2xl">{category.name}</h2>
            </div>
            <button type="button" onClick={speakWorld} className="relative z-10 mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/95 text-[#84522d] transition hover:bg-white active:scale-90" aria-label={`Hear about ${category.name}`}>
              <Icon name="speaker" size={22} />
            </button>
          </div>
        </div>

        {pages.map((p, i) => (
          <Stop key={p.id} page={p} category={category} x={stopX(i)} y={stopY(i)} hasDraft={drafts.has(p.image_url)} onPreview={onPreview} />
        ))}
      </div>
    </section>
  );
}

function Stop({ page, category, x, y, hasDraft, onPreview }) {
  const drawn = Boolean(page.image_url);
  const circle = (
    <span
      className={`relative grid h-[92px] w-[92px] place-items-center overflow-hidden rounded-full bg-white shadow-[0_8px_18px_-8px_rgba(20,40,60,.55)] transition duration-200 group-hover:scale-110 group-active:scale-95 sm:h-[108px] sm:w-[108px] ${drawn ? 'ring-[6px]' : 'ring-4'}`}
      style={{ '--tw-ring-color': category.color }}
    >
      {drawn
        ? <img src={page.image_url} alt="" className="h-full w-full scale-[1.35] object-cover object-top" loading="lazy" />
        : <span className="text-5xl" aria-hidden="true">{careerEmoji(page)}</span>}
    </span>
  );
  const badge = drawn
    ? <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full text-white shadow ring-2 ring-white" style={{ background: category.color }}><Icon name="brush" size={16} /></span>
    : <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-white text-base shadow ring-2 ring-lilac-200" title="Drawing coming soon">✏️</span>;
  const label = (
    <span className="mt-2 max-w-[150px] rounded-full bg-white/95 px-3 py-1 text-center font-display text-[15px] font-semibold leading-tight text-plum-900 shadow-sm ring-1 ring-black/5">
      {page.title}
    </span>
  );
  const inner = (
    <>
      <span className="relative">
        {circle}
        {badge}
        {hasDraft && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-mint-300 px-2 py-0.5 font-display text-[11px] text-plum-900">Keep coloring</span>}
      </span>
      {label}
    </>
  );
  const cls = 'group absolute z-10 flex -translate-x-1/2 -translate-y-[54px] flex-col items-center outline-none sm:-translate-y-[62px]';
  const style = { left: `${x}%`, top: y };
  return drawn ? (
    <Link to={`/color/${page.id}`} onClick={() => sfx.pick()} className={cls} style={style} aria-label={`Color the ${page.title}`}>{inner}</Link>
  ) : (
    <button type="button" onClick={() => onPreview(page)} className={cls} style={style} aria-label={`${page.title}, drawing coming soon`}>{inner}</button>
  );
}

// ---------- ambient particles ----------

const PARTICLE = { leaves: ['🍂', '🍁'], snow: ['❄️'], petals: ['🌸'], butterflies: ['🦋'], gulls: null };

function Particles({ kind, seed }) {
  if (!kind) return null;
  const r = rng(seed + 11);
  if (kind === 'gulls') {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="world-glide absolute w-10" style={{ top: 60 + i * 180, left: `${10 + r() * 70}%`, animationDelay: `${i * 3}s` }}><A.Seagull /></div>
        ))}
      </div>
    );
  }
  const glyphs = PARTICLE[kind];
  const fly = kind === 'butterflies';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: fly ? 5 : 14 }, (_, i) => (
        <span
          key={i}
          className={fly ? 'world-flit absolute' : 'world-fall absolute'}
          style={{
            left: `${r() * 96}%`,
            top: fly ? `${10 + r() * 80}%` : `-${r() * 40}%`,
            fontSize: `${fly ? 22 : 14 + r() * 12}px`,
            animationDuration: `${fly ? 6 + r() * 4 : 9 + r() * 8}s`,
            animationDelay: `-${r() * 12}s`,
            opacity: kind === 'snow' ? 0.8 : 0.9,
          }}
        >
          {glyphs[i % glyphs.length]}
        </span>
      ))}
    </div>
  );
}

// ---------- journey end: the stream meets the ocean ----------

function OceanEnd({ biome }) {
  return (
    <div className="relative h-[320px] w-full overflow-hidden" style={{ background: biome.bg }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M570 0 L630 0 C640 50 700 90 820 120 L380 120 C500 90 560 50 570 0 Z" fill={biome.water} />
        <path d="M0 110 Q150 90 300 112 T600 106 T900 112 T1200 104 L1200 320 L0 320 Z" fill="#4fc3d9" />
        <path d="M0 150 Q150 130 300 152 T600 146 T900 152 T1200 144 L1200 320 L0 320 Z" fill="#3aa9c9" />
        <path d="M0 200 Q150 180 300 202 T600 196 T900 202 T1200 194 L1200 320 L0 320 Z" fill="#2f93b8" />
        <g className="world-waves">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${i * 170 - 40} 128 q20 -12 40 0 q20 12 40 0`} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".8" />
          ))}
        </g>
        <path d="M0 110 Q150 90 300 112 T600 106 T900 112 T1200 104" stroke="#fff" strokeWidth="6" fill="none" opacity=".7" />
      </svg>
      <div className="world-bob absolute left-[54%] top-[132px] w-[150px]"><A.RowboatGirl /></div>
      <div className="pointer-events-none absolute right-[6%] top-[-10px] hidden w-[100px] sm:block lg:hidden"><A.Lighthouse /></div>
      <div className="absolute inset-x-0 bottom-6 px-4 text-center">
        <p className="font-display text-2xl font-semibold text-white drop-shadow sm:text-3xl">You made it to the ocean! 🎉</p>
        <p className="mt-1 font-display text-white/90 drop-shadow">You explored every STREAM. Which future will you color next?</p>
      </div>
    </div>
  );
}

// ---------- the whole journey ----------

export default function Journey({ categories, byCategory, onPreview }) {
  const drafts = new Set();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('coloredin:draft:')) drafts.add(k.slice('coloredin:draft:'.length));
    }
  } catch { /* storage unavailable */ }

  const worlds = categories.filter((c) => byCategory[c.id]?.length);
  if (!worlds.length) return null;
  const lastBiome = biomeFor(worlds.length - 1);

  return (
    <div className="relative">
      <div className="relative" style={{ background: SKY.bg }}>
        <p className="absolute inset-x-0 top-3 z-10 text-center font-display text-lg text-plum-800">Start your adventure here! 👇</p>
        <Waterfall upper={{ ...SKY, water: BIOMES[0].water }} lower={BIOMES[0]} first />
      </div>
      {worlds.map((c, i) => (
        <div key={c.id}>
          <World category={c} index={i} pages={byCategory[c.id]} onPreview={onPreview} drafts={drafts} />
          {i < worlds.length - 1 && <Waterfall upper={biomeFor(i)} lower={biomeFor(i + 1)} />}
        </div>
      ))}
      <OceanEnd biome={lastBiome} />
    </div>
  );
}
