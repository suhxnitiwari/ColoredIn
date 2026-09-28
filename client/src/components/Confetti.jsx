import { useEffect, useState } from 'react';

const COLORS = ['#b867d3', '#ffbad1', '#a6e3cc', '#58bfbf', '#ffd84d', '#8b2b9e'];

/** A short, gentle burst of confetti each time `trigger` changes. */
export default function Confetti({ trigger }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    setPieces(Array.from({ length: 70 }, (_, i) => ({
      id: `${trigger}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 160,
      spin: (Math.random() - 0.5) * 900,
      color: COLORS[i % COLORS.length],
      shape: i % 3,
    })));
    const t = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute -top-4 block"
          style={{
            left: `${p.left}%`,
            width: p.shape === 2 ? 8 : 10,
            height: p.shape === 0 ? 14 : 10,
            background: p.color,
            borderRadius: p.shape === 1 ? '50%' : 3,
            animation: `confetti ${p.duration}s cubic-bezier(.2,.6,.4,1) ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
      <style>{`@keyframes confetti { to { transform: translate(var(--drift), 105vh) rotate(var(--spin)); opacity: .9; } }`}</style>
    </div>
  );
}
