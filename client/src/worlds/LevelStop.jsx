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

/** The explorer rowing their boat. Anchored at the waterline centre. */
export function ExplorerBoat({ avatar, flip = false, tilt = 0 }) {
  return (
    <div className="pointer-events-none relative h-[112px] w-[136px]" style={{ transform: `scaleX(${flip ? -1 : 1}) rotate(${tilt}deg)` }}>
      <div className="absolute bottom-[34px] left-1/2 h-[92px] -translate-x-1/2">
        <Avatar a={avatar} crop="bust" wave className="h-full w-auto" />
      </div>
      <svg viewBox="0 0 136 60" className="absolute bottom-0 left-0 w-full overflow-visible" aria-hidden="true">
        <ellipse cx="68" cy="54" rx="64" ry="7" fill="#fff" opacity=".55" className="boat-wake" />
        <path d="M100 18 L128 46" stroke="#c98a4a" strokeWidth="5" strokeLinecap="round" className="boat-oar" style={{ transformOrigin: '100px 18px' }} />
        <ellipse cx="130" cy="48" rx="8" ry="4" fill="#c98a4a" className="boat-oar" style={{ transformOrigin: '100px 18px' }} />
        <path d="M4 18 L132 18 C126 40 110 50 94 50 L42 50 C26 50 10 40 4 18 Z" fill="#b5703a" />
        <path d="M4 18 L132 18 L130 25 L6 25 Z" fill="#8a5a3c" />
        <path d="M20 36 L116 36" stroke="#8a5a3c" strokeWidth="2" opacity=".5" />
        <circle cx="30" cy="30" r="3" fill="#ffd84d" />
      </svg>
    </div>
  );
}
