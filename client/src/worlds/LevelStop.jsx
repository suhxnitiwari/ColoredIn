import Avatar from '../avatar/Avatar.jsx';
import { careerEmoji } from '../lib/careerEmoji.js';
import { Star } from './art.jsx';

const edge = (color) => `color-mix(in srgb, ${color} 68%, #1a0620)`;

/**
 * A chunky, glossy level button for one career (Candy Crush style): number
 * badge, drawing peek (or emoji until the drawing exists), stars earned, name.
 * Positioned so (left, top) is the centre of the disc.
 */
export default function LevelStop({ page, category, left, top, number, stars = 0, scale = 1, onSelect }) {
  const drawn = Boolean(page.image_url);
  const color = category.color;
  return (
    <button
      type="button"
      onClick={() => onSelect(page)}
      className="group absolute z-20 flex flex-col items-center outline-none"
      style={{ left, top, transform: `translate(-50%, -50px) scale(${scale})`, transformOrigin: '50% 50px' }}
      aria-label={`Level ${number}: ${page.title}${drawn ? '' : ', drawing coming soon'}`}
    >
      <span className="relative block transition-transform duration-200 group-hover:-translate-y-1 group-active:translate-y-1">
        <span
          className="relative grid h-[100px] w-[100px] place-items-center overflow-hidden rounded-full bg-white"
          style={{ boxShadow: `0 0 0 6px ${color}, 0 8px 0 6px ${edge(color)}, 0 16px 22px 2px rgba(20,20,40,.3)` }}
        >
          {drawn
            ? <img src={page.image_url} alt="" className="h-full w-full scale-[1.4] object-cover object-top" loading="lazy" draggable="false" />
            : <span className="text-5xl" aria-hidden="true">{careerEmoji(page)}</span>}
          <span className="pointer-events-none absolute left-3 top-1.5 h-7 w-16 -rotate-12 rounded-full bg-white/55 blur-[1px]" />
        </span>
        <span
          className="absolute -left-3 -top-3 grid h-10 min-w-10 place-items-center rounded-full px-1.5 font-display text-lg font-bold text-white ring-[3px] ring-white"
          style={{ background: color, boxShadow: `0 3px 0 ${edge(color)}` }}
        >
          {number}
        </span>
        {!drawn && (
          <span className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg shadow ring-2 ring-lilac-200" title="Drawing coming soon">✏️</span>
        )}
      </span>
      <span className="relative mt-3.5 flex items-end gap-0.5" aria-label={`${stars} stars`}>
        <span className="block w-6"><Star on={stars >= 1} /></span>
        <span className="-mt-2 block w-8"><Star on={stars >= 2} /></span>
        <span className="block w-6"><Star on={stars >= 3} /></span>
      </span>
      <span className="mt-0.5 max-w-[150px] rounded-full bg-white/95 px-3 py-1 text-center font-display text-[15px] font-semibold leading-tight text-plum-900 shadow-md ring-1 ring-black/5">
        {page.title}
      </span>
    </button>
  );
}

/** The explorer on foot. Anchored at the feet (the parent places the point). */
export function WalkingExplorer({ avatar }) {
  return (
    <div className="explorer-walk relative h-[92px] w-[70px]">
      <span className="absolute bottom-0 left-1/2 h-2.5 w-12 -translate-x-1/2 rounded-full bg-black/20 blur-[1px]" />
      <Avatar a={avatar} className="relative h-full w-auto" />
    </div>
  );
}

/** The explorer in a swan paddle boat. Anchored near the waterline. */
export function ExplorerBoat({ avatar }) {
  return (
    <div className="pointer-events-none relative h-[118px] w-[150px]">
      {avatar && (
        <div className="absolute bottom-[34px] left-[34%] h-[80px] -translate-x-1/2">
          <Avatar a={avatar} crop="bust" wave className="h-full w-auto" />
        </div>
      )}
      <svg viewBox="0 0 150 80" className="absolute bottom-0 left-0 w-full overflow-visible" aria-hidden="true">
        <ellipse cx="70" cy="74" rx="66" ry="7" fill="#fff" opacity=".55" className="boat-wake" />
        {/* swan body */}
        <path d="M8 36 C8 64 40 72 76 72 C108 72 124 62 128 44 L118 40 C112 50 96 54 76 54 L24 54 C16 54 12 46 8 36 Z" fill="#fff" stroke="#d9d2e6" strokeWidth="2" />
        <path d="M8 36 C20 40 30 34 36 28 C44 38 60 40 70 36 C62 50 40 56 24 54 C16 54 12 46 8 36 Z" fill="#f4eefa" />
        <path d="M20 44 C34 40 44 44 52 50" stroke="#ffbad1" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* neck and head */}
        <path d="M112 46 C130 40 132 22 124 12 C118 4 106 8 108 18" stroke="#fff" strokeWidth="11" fill="none" strokeLinecap="round" />
        <circle cx="112" cy="14" r="9" fill="#fff" />
        <path d="M104 14 L94 18 L104 20 Z" fill="#ff9f43" />
        <circle cx="112" cy="12" r="2" fill="#2a1630" />
        {/* paddle wheel */}
        <g className="boat-paddle" style={{ transformOrigin: '80px 60px' }}>
          {[0, 60, 120].map((a) => <rect key={a} x="78" y="46" width="4" height="28" rx="2" fill="#b867d3" transform={`rotate(${a} 80 60)`} />)}
        </g>
        <circle cx="80" cy="60" r="6" fill="#8b2b9e" />
      </svg>
    </div>
  );
}
