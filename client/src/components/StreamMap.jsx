import { useEffect, useState } from 'react';

// An illustrated STREAMS river: seven stepping stones (one per career group)
// along a winding stream through a meadow, with swaying trees and a paper
// boat drifting downstream. Wide screens get a left-to-right river; phones get
// a top-to-bottom trail with labels beside each stone.

const LAYOUTS = {
  wide: {
    w: 1200,
    h: 480,
    enter: [-70, 215],
    exit: [1270, 200],
    stops: [[110, 300], [270, 172], [435, 305], [600, 172], [765, 305], [930, 172], [1090, 300]],
    label: (i, [x, y]) => ({ x, y: i % 2 ? y - 72 : y + 72, anchor: 'middle' }),
    trees: [
      [55, 150, 'round', 1], [168, 118, 'pine', 0.85], [362, 196, 'round', 1], [478, 178, 'blossom', 0.85],
      [692, 196, 'round', 0.9], [826, 176, 'pine', 0.8], [1040, 192, 'blossom', 0.85], [1150, 150, 'pine', 0.9],
      [262, 432, 'round', 1.1], [336, 468, 'pine', 0.85], [598, 430, 'blossom', 1], [664, 470, 'round', 0.8],
      [930, 432, 'pine', 1], [994, 470, 'round', 0.85], [20, 470, 'bush', 1], [1185, 470, 'bush', 1.1],
    ],
    flowers: [[200, 250], [520, 420], [700, 395], [860, 420], [1170, 380], [330, 110], [40, 380], [1010, 120]],
    clouds: [[180, 46, 1], [640, 34, 0.8], [980, 58, 0.9]],
    sun: [1135, 62],
    boatRotate: 'auto',
  },
  tall: {
    w: 400,
    h: 1210,
    enter: [150, -70],
    exit: [140, 1280],
    stops: [[110, 95], [168, 255], [110, 415], [168, 575], [110, 735], [168, 895], [110, 1055]],
    label: (_i, [x, y]) => ({ x: x + 64, y, anchor: 'start' }),
    trees: [
      [330, 185, 'round', 0.8], [370, 345, 'pine', 0.7], [320, 505, 'blossom', 0.8], [365, 665, 'round', 0.7],
      [330, 825, 'pine', 0.8], [368, 985, 'blossom', 0.7], [330, 1150, 'round', 0.85], [365, 40, 'pine', 0.6],
      [28, 250, 'bush', 0.7], [28, 580, 'bush', 0.6], [28, 900, 'bush', 0.7],
    ],
    flowers: [[245, 180], [270, 500], [240, 820], [262, 1140], [30, 420], [30, 760], [30, 1100]],
    clouds: [],
    sun: null,
    boatRotate: '0',
  },
};

/** Catmull-Rom spline through the points, as a smooth SVG path. */
function smoothPath(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const shortName = (name) => name.split(/[,&]/)[0].trim();

function Tree({ x, y, type, s, delay }) {
  const trunk = <rect x={-5} y={-28} width={10} height={30} rx={4} fill="#a86f4c" />;
  let crown;
  if (type === 'pine') {
    crown = (
      <>
        <path d="M0,-96 L30,-44 L-30,-44 Z" fill="#4fb477" />
        <path d="M0,-74 L36,-22 L-36,-22 Z" fill="#5cc27a" />
      </>
    );
  } else if (type === 'bush') {
    return (
      <g transform={`translate(${x},${y}) scale(${s})`}>
        <ellipse cx={0} cy={-14} rx={34} ry={18} fill="#6fcf8a" />
        <circle cx={-12} cy={-22} r={14} fill="#7bd88f" />
        <circle cx={12} cy={-20} r={12} fill="#7bd88f" />
      </g>
    );
  } else {
    const [a, b] = type === 'blossom' ? ['#ffbad1', '#ffd3e2'] : ['#5cc27a', '#7bd88f'];
    crown = (
      <>
        <circle cx={0} cy={-62} r={34} fill={a} />
        <circle cx={-18} cy={-48} r={22} fill={a} />
        <circle cx={18} cy={-50} r={22} fill={a} />
        <circle cx={-8} cy={-74} r={14} fill={b} />
        {type === 'blossom' && [[-16, -58], [12, -70], [18, -44], [-4, -44]].map(([cx, cy]) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={3.5} fill="#fff" opacity={0.9} />
        ))}
      </>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={26} ry={6} fill="#3d8c5c" opacity={0.18} />
      <g className="stream-sway" style={{ animationDelay: `${delay}s` }}>
        {trunk}
        {crown}
      </g>
    </g>
  );
}

function Flowers({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {[[0, 0, '#ffbad1'], [12, 6, '#ffd84d'], [-10, 8, '#b867d3']].map(([dx, dy, c]) => (
        <g key={c} transform={`translate(${dx},${dy})`}>
          <path d="M0,0 L0,10" stroke="#4fb477" strokeWidth={2} />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4} cy={Math.sin((a * Math.PI) / 180) * 4} r={3} fill={c} />
          ))}
          <circle r={2.2} fill="#fff7c2" />
        </g>
      ))}
    </g>
  );
}

function Cloud({ x, y, s }) {
  return (
    <g className="stream-cloud" style={{ '--x': `${x}px` }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={0.95}>
        <ellipse cx={0} cy={0} rx={46} ry={16} fill="#fff" />
        <circle cx={-16} cy={-8} r={18} fill="#fff" />
        <circle cx={12} cy={-12} r={22} fill="#fff" />
      </g>
    </g>
  );
}

function Stone({ category, index, pos, label, selected, onSelect, counts }) {
  const [x, y] = pos;
  const letter = category.name[0];
  const name = shortName(category.name);
  const pillW = name.length * 10 + 34;
  const pillX = label.anchor === 'middle' ? label.x - pillW / 2 : label.x - 8;
  const activate = () => onSelect(category);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${letter} is for ${category.name}. ${counts} careers.`}
      className="stream-stone cursor-pointer outline-none"
      onClick={activate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}
    >
      <g className="stream-bob" style={{ animationDelay: `${index * 0.35}s` }}>
        <g className="stream-stone-inner" style={{ transformOrigin: `${x}px ${y}px` }}>
          <ellipse cx={x} cy={y + 40} rx={46} ry={10} fill="#1f5f73" opacity={0.18} />
          {selected && <circle cx={x} cy={y} r={58} fill="none" stroke={category.color} strokeWidth={5} opacity={0.45} />}
          <circle cx={x} cy={y} r={44} fill={category.color} stroke="#fff" strokeWidth={6} />
          <circle cx={x - 14} cy={y - 16} r={10} fill="#fff" opacity={0.22} />
          <text x={x} y={y + 16} textAnchor="middle" className="font-display" fontSize={46} fontWeight={700} fill="#fff">{letter}</text>
          <circle cx={x + 34} cy={y - 32} r={17} fill="#fff" stroke={category.color} strokeWidth={3} />
          <text x={x + 34} y={y - 25} textAnchor="middle" fontSize={18}>{category.icon}</text>
        </g>
      </g>
      <g>
        <rect x={pillX} y={label.y - 17} width={pillW} height={34} rx={17} fill="#fff" stroke={category.color} strokeWidth={2.5} />
        <text
          x={label.anchor === 'middle' ? label.x : label.x + 9}
          y={label.y + 6}
          textAnchor={label.anchor}
          className="font-display"
          fontSize={17}
          fontWeight={600}
          fill="#370d3d"
        >
          {name}
        </text>
      </g>
    </g>
  );
}

function Scene({ layout, categories, selectedId, onSelect, counts, reducedMotion, id }) {
  const L = LAYOUTS[layout];
  const path = smoothPath([L.enter, ...L.stops, L.exit]);
  const pathId = `stream-path-${id}`;
  return (
    <svg viewBox={`0 0 ${L.w} ${L.h}`} className="block h-auto w-full" role="group" aria-label="The STREAMS river of careers">
      <defs>
        <linearGradient id={`meadow-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf7ff" />
          <stop offset={layout === 'wide' ? '0.28' : '0.05'} stopColor="#e6f7ec" />
          <stop offset="1" stopColor="#d3f0dc" />
        </linearGradient>
      </defs>
      <rect width={L.w} height={L.h} fill={`url(#meadow-${id})`} />
      {layout === 'wide' && (
        <>
          <path d={`M0,150 C160,110 300,160 460,128 S760,100 900,138 S1120,120 1200,110 L1200,${L.h} L0,${L.h} Z`} fill="#dcf3e3" />
          <path d={`M0,420 C200,400 380,440 600,418 S980,430 1200,410 L1200,${L.h} L0,${L.h} Z`} fill="#cdeed6" />
        </>
      )}
      {L.sun && (
        <g transform={`translate(${L.sun[0]},${L.sun[1]})`}>
          <g className="stream-spin">
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={-3} y={-50} width={6} height={14} rx={3} fill="#ffd84d" transform={`rotate(${i * 36})`} />
            ))}
          </g>
          <circle r={30} fill="#ffd84d" />
          <circle cx={-9} cy={-4} r={3} fill="#6b4a1b" />
          <circle cx={9} cy={-4} r={3} fill="#6b4a1b" />
          <path d="M-9,7 Q0,15 9,7" stroke="#6b4a1b" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      )}
      {L.clouds.map(([x, y, s]) => <Cloud key={x} x={x} y={y} s={s} />)}

      {/* The stream */}
      <path id={pathId} d={path} fill="none" stroke="#9ed9b8" strokeWidth={78} strokeLinecap="round" />
      <path d={path} fill="none" stroke="#7fcde6" strokeWidth={62} strokeLinecap="round" />
      <path d={path} fill="none" stroke="#a9e1f1" strokeWidth={36} strokeLinecap="round" />
      <path d={path} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeDasharray="14 34" opacity={0.8} className="stream-flow" />
      <path d={path} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 52" opacity={0.6} className="stream-flow-slow" transform="translate(0,12)" />
      <path d={path} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeDasharray="8 60" opacity={0.5} className="stream-flow" transform="translate(0,-12)" />

      {L.flowers.map(([x, y]) => <Flowers key={`${x}-${y}`} x={x} y={y} />)}
      {L.trees.map(([x, y, type, s], i) => <Tree key={`${x}-${y}`} x={x} y={y} type={type} s={s} delay={(i % 5) * 0.7} />)}

      {!reducedMotion && (
        <g>
          <g>
            <path d="M-20,-4 L20,-4 L12,8 L-12,8 Z" fill="#fff" stroke="#b867d3" strokeWidth={2} strokeLinejoin="round" />
            <path d="M-2,-4 L-2,-26 L14,-6 Z" fill="#ffbad1" stroke="#b867d3" strokeWidth={2} strokeLinejoin="round" />
          </g>
          <animateMotion dur={layout === 'wide' ? '38s' : '46s'} repeatCount="indefinite" rotate={L.boatRotate}>
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </g>
      )}

      {categories.map((c, i) => L.stops[i] && (
        <Stone
          key={c.id}
          category={c}
          index={i}
          pos={L.stops[i]}
          label={L.label(i, L.stops[i])}
          selected={selectedId === c.id}
          onSelect={onSelect}
          counts={counts[c.id] ?? 0}
        />
      ))}
    </svg>
  );
}

export default function StreamMap({ categories, selectedId, onSelect, counts }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const on = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const props = { categories, selectedId, onSelect, counts, reducedMotion };
  return (
    <div className="overflow-hidden rounded-[2rem] ring-1 ring-lilac-200/80 shadow-[0_18px_50px_-24px_rgba(47,120,90,0.45)]">
      <div className="hidden md:block"><Scene layout="wide" id="w" {...props} /></div>
      <div className="md:hidden"><Scene layout="tall" id="t" {...props} /></div>
    </div>
  );
}
