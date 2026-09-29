// Hand-built storybook scenery for the STREAMS journey. Every piece is a small
// bottom-anchored SVG (viewBox 0 0 100 100 unless noted) so it can be placed
// and sized freely by the world layouts.

const Svg = ({ children, vb = '0 0 100 100', className = '', style }) => (
  <svg viewBox={vb} className={`overflow-visible ${className}`} style={style} aria-hidden="true">{children}</svg>
);

const shade = (x, y, rx, ry) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1b3a2a" opacity=".14" />;

// ---------- shared ----------

export const Rock = ({ tint = '#9aa3ad' }) => (
  <Svg vb="0 0 100 60">
    {shade(50, 56, 44, 5)}
    <path d="M8 54 C4 34 22 16 46 14 C72 12 94 28 92 54 Z" fill={tint} />
    <path d="M20 30 C28 22 40 19 50 20" stroke="#fff" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M60 54 C70 44 84 42 92 50 L92 54 Z" fill="#000" opacity=".08" />
  </Svg>
);

export const Flowers = ({ colors = ['#ff7aa2', '#ffd84d', '#b867d3'] }) => (
  <Svg vb="0 0 100 60">
    <path d="M10 58 Q30 40 50 58 Q70 40 90 58" fill="#5cc27a" />
    {[[22, 34, 0], [50, 26, 1], [76, 34, 2], [36, 42, 1], [64, 42, 0]].map(([x, y, c]) => (
      <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
        <path d={`M0 0 L0 ${58 - y}`} stroke="#3f9d5f" strokeWidth="2.5" />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6} cy={Math.sin((a * Math.PI) / 180) * 6} r="5" fill={colors[c % colors.length]} />
        ))}
        <circle r="3.5" fill="#fff5c0" />
      </g>
    ))}
  </Svg>
);

export const Grass = ({ color = '#5cc27a' }) => (
  <Svg vb="0 0 100 50">
    <path d="M10 50 Q14 20 22 8 Q20 30 30 50 Q34 16 46 2 Q40 30 52 50 Q58 22 70 10 Q62 34 72 50 Q78 28 90 20 Q80 38 88 50 Z" fill={color} />
  </Svg>
);

export const LilyPad = () => (
  <Svg vb="0 0 100 60">
    <path d="M50 30 L92 22 A44 26 0 1 1 84 14 Z" fill="#5cc27a" />
    <path d="M50 30 L92 22" stroke="#3f9d5f" strokeWidth="2" />
    <circle cx="30" cy="22" r="9" fill="#ffbad1" />
    <circle cx="30" cy="22" r="4" fill="#ffe27a" />
  </Svg>
);

export const Fish = ({ color = '#ff9f43' }) => (
  <Svg vb="0 0 100 60">
    <path d="M20 30 C34 8 70 8 80 30 C70 52 34 52 20 30 Z" fill={color} />
    <path d="M20 30 L4 16 L6 44 Z" fill={color} />
    <circle cx="66" cy="26" r="4" fill="#2a1630" />
    <path d="M44 18 Q50 30 44 42" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" />
  </Svg>
);

export const Bunny = ({ fur = '#fff', inner = '#ffbad1' }) => (
  <Svg>
    {shade(50, 97, 30, 4)}
    <ellipse cx="50" cy="74" rx="26" ry="22" fill={fur} stroke="#d9cfe0" strokeWidth="2" />
    <circle cx="50" cy="46" r="18" fill={fur} stroke="#d9cfe0" strokeWidth="2" />
    <ellipse cx="40" cy="18" rx="6" ry="18" fill={fur} stroke="#d9cfe0" strokeWidth="2" />
    <ellipse cx="60" cy="18" rx="6" ry="18" fill={fur} stroke="#d9cfe0" strokeWidth="2" />
    <ellipse cx="40" cy="18" rx="2.5" ry="12" fill={inner} />
    <ellipse cx="60" cy="18" rx="2.5" ry="12" fill={inner} />
    <circle cx="43" cy="44" r="2.8" fill="#2a1630" />
    <circle cx="57" cy="44" r="2.8" fill="#2a1630" />
    <ellipse cx="50" cy="51" rx="3" ry="2" fill="#ff8fb3" />
    <circle cx="38" cy="52" r="3.5" fill="#ffbad1" opacity=".6" />
    <circle cx="62" cy="52" r="3.5" fill="#ffbad1" opacity=".6" />
  </Svg>
);

export const Butterfly = ({ a = '#b867d3', b = '#ffbad1' }) => (
  <Svg vb="0 0 60 50">
    <g className="world-flutter" style={{ transformOrigin: '30px 25px' }}>
      <path d="M30 25 C18 2 2 8 8 22 C2 34 20 40 30 25 Z" fill={a} />
      <path d="M30 25 C42 2 58 8 52 22 C58 34 40 40 30 25 Z" fill={b} />
    </g>
    <rect x="28.5" y="14" width="3" height="22" rx="1.5" fill="#370d3d" />
  </Svg>
);

// ---------- rainforest ----------

export const JungleTree = () => (
  <Svg vb="0 0 140 180">
    {shade(70, 176, 40, 5)}
    <path d="M62 176 C64 130 58 100 66 70 L78 70 C82 100 78 140 82 176 Z" fill="#8a5a3c" />
    <path d="M66 110 C50 100 40 104 30 96" stroke="#8a5a3c" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M70 176 L70 120" stroke="#6f4630" strokeWidth="3" opacity=".6" />
    <circle cx="70" cy="56" r="44" fill="#2f8f55" />
    <circle cx="34" cy="72" r="28" fill="#2f8f55" />
    <circle cx="108" cy="70" r="30" fill="#2f8f55" />
    <circle cx="56" cy="40" r="26" fill="#3fae68" />
    <circle cx="94" cy="46" r="22" fill="#3fae68" />
    <circle cx="28" cy="60" r="16" fill="#3fae68" />
    <circle cx="50" cy="30" r="12" fill="#6fd08a" />
    <path className="world-sway" d="M40 88 C42 110 36 126 40 146" stroke="#3f9d5f" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path className="world-sway" d="M104 92 C100 112 106 124 102 138" stroke="#3f9d5f" strokeWidth="3" fill="none" strokeLinecap="round" />
    {[[40, 110], [40, 128], [104, 108], [102, 124]].map(([x, y]) => <ellipse key={`${x}${y}`} cx={x + 4} cy={y} rx="5" ry="3" fill="#5cc27a" />)}
  </Svg>
);

export const Palm = () => (
  <Svg vb="0 0 120 170">
    {shade(66, 166, 26, 4)}
    <path d="M58 166 C60 120 62 90 70 58 L78 60 C72 94 70 126 72 166 Z" fill="#a8743f" />
    {[70, 84, 98, 112, 126, 140].map((y) => <path key={y} d={`M${60 + (166 - y) * 0.08} ${y} l12 -2`} stroke="#8a5a3c" strokeWidth="2" />)}
    <g className="world-sway" style={{ transformOrigin: '74px 58px' }}>
      <path d="M74 58 C50 40 24 44 8 62 C30 52 50 54 74 58 Z" fill="#3fae68" />
      <path d="M74 58 C98 40 122 44 118 66 C104 52 90 52 74 58 Z" fill="#3fae68" />
      <path d="M74 58 C62 30 70 12 88 6 C80 24 80 40 74 58 Z" fill="#5cc27a" />
      <path d="M74 58 C58 36 36 26 20 30 C40 36 56 44 74 58 Z" fill="#5cc27a" />
      <path d="M74 58 C92 34 112 28 120 36 C104 38 88 46 74 58 Z" fill="#2f8f55" />
      <circle cx="70" cy="64" r="6" fill="#8a5a3c" />
      <circle cx="80" cy="64" r="6" fill="#8a5a3c" />
    </g>
  </Svg>
);

export const Monstera = () => (
  <Svg vb="0 0 120 110">
    <g className="world-sway" style={{ transformOrigin: '60px 108px' }}>
      <path d="M60 108 C40 80 10 70 6 40 C4 16 30 8 44 26 C50 6 76 4 84 24 C98 12 118 28 110 50 C104 76 80 84 60 108 Z" fill="#2f8f55" />
      <path d="M60 108 L56 30" stroke="#1f6e40" strokeWidth="3" fill="none" />
      {[[30, 44, 18, 56], [36, 70, 22, 80], [82, 44, 100, 52], [78, 70, 96, 74]].map(([x1, y1, x2, y2]) => (
        <path key={`${x1}${y1}`} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#bfe6c6" strokeWidth="6" strokeLinecap="round" />
      ))}
      <path d="M8 104 C20 80 30 74 40 72 C30 84 24 94 20 108 Z" fill="#3fae68" />
      <path d="M112 104 C100 80 90 74 80 72 C90 84 96 94 100 108 Z" fill="#3fae68" />
    </g>
  </Svg>
);

export const Toucan = () => (
  <Svg vb="0 0 100 100">
    <path d="M10 92 L90 92" stroke="#8a5a3c" strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="46" cy="62" rx="20" ry="26" fill="#2a2230" />
    <ellipse cx="50" cy="56" rx="10" ry="12" fill="#fff5d6" />
    <circle cx="50" cy="42" r="13" fill="#2a2230" />
    <circle cx="48" cy="40" r="4.5" fill="#fff" />
    <circle cx="49" cy="40" r="2.2" fill="#2a2230" />
    <path d="M58 36 C80 30 96 40 94 50 C82 48 70 50 58 48 Z" fill="#ff9f43" />
    <path d="M86 42 C92 44 94 48 94 50 C90 48 88 46 86 42 Z" fill="#2a2230" />
    <path d="M34 84 L30 96 M44 86 L44 96" stroke="#ff9f43" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export const Monkey = () => (
  <Svg vb="0 0 100 120">
    <path d="M50 0 L50 26" stroke="#3f9d5f" strokeWidth="4" />
    <g className="world-swing" style={{ transformOrigin: '50px 0px' }}>
      <path d="M50 26 L50 34" stroke="#8a5a3c" strokeWidth="6" strokeLinecap="round" />
      <path d="M62 86 C84 90 86 110 72 112" stroke="#8a5a3c" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="78" rx="16" ry="20" fill="#8a5a3c" />
      <ellipse cx="50" cy="82" rx="9" ry="12" fill="#e9c29a" />
      <circle cx="50" cy="48" r="17" fill="#8a5a3c" />
      <circle cx="33" cy="48" r="7" fill="#e9c29a" />
      <circle cx="67" cy="48" r="7" fill="#e9c29a" />
      <ellipse cx="50" cy="52" rx="12" ry="10" fill="#e9c29a" />
      <circle cx="45" cy="46" r="2.8" fill="#2a1630" />
      <circle cx="55" cy="46" r="2.8" fill="#2a1630" />
      <path d="M45 55 Q50 59 55 55" stroke="#2a1630" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  </Svg>
);

export const Parrot = () => (
  <Svg>
    <path d="M10 92 L90 92" stroke="#8a5a3c" strokeWidth="6" strokeLinecap="round" />
    <path d="M44 70 L36 98 L50 80 Z" fill="#4a90e2" />
    <ellipse cx="50" cy="60" rx="16" ry="24" fill="#f25c5c" />
    <path d="M38 58 C30 70 34 82 44 84 C44 72 44 64 38 58 Z" fill="#ffd84d" />
    <circle cx="52" cy="38" r="13" fill="#f25c5c" />
    <circle cx="55" cy="35" r="5" fill="#fff" />
    <circle cx="56" cy="35" r="2.4" fill="#2a1630" />
    <path d="M62 38 C72 38 72 50 64 50 C66 46 64 42 62 38 Z" fill="#3a3a44" />
    <path d="M44 88 L44 94 M54 88 L54 94" stroke="#6b5b4a" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export const Hibiscus = () => (
  <Svg vb="0 0 100 80">
    <path d="M50 80 L50 50" stroke="#3f9d5f" strokeWidth="4" />
    <path d="M50 70 C36 62 26 66 22 74 C34 76 42 74 50 70 Z" fill="#3fae68" />
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={50 + Math.cos(((a - 90) * Math.PI) / 180) * 15} cy={38 + Math.sin(((a - 90) * Math.PI) / 180) * 15} rx="13" ry="11" transform={`rotate(${a} ${50 + Math.cos(((a - 90) * Math.PI) / 180) * 15} ${38 + Math.sin(((a - 90) * Math.PI) / 180) * 15})`} fill="#f25c5c" />
    ))}
    <circle cx="50" cy="38" r="6" fill="#ffd84d" />
    <path d="M50 38 L60 22" stroke="#ffd84d" strokeWidth="2.5" />
  </Svg>
);

// ---------- desert ----------

export const Saguaro = () => (
  <Svg vb="0 0 100 150">
    {shade(50, 146, 28, 4)}
    <rect x="40" y="16" width="20" height="130" rx="10" fill="#5fae6a" />
    <path d="M40 90 L26 90 C18 90 16 84 16 76 L16 50 C16 42 28 42 28 50 L28 78 L40 78 Z" fill="#5fae6a" />
    <path d="M60 70 L74 70 C82 70 84 64 84 56 L84 36 C84 28 72 28 72 36 L72 58 L60 58 Z" fill="#5fae6a" />
    {[26, 46, 66, 86, 106, 126].map((y) => <path key={y} d={`M46 ${y} l0 10 M54 ${y + 6} l0 10`} stroke="#3f8f52" strokeWidth="2" strokeLinecap="round" />)}
    <circle cx="50" cy="14" r="6" fill="#ff7aa2" />
    <circle cx="50" cy="14" r="2.5" fill="#ffd84d" />
  </Svg>
);

export const BarrelCactus = () => (
  <Svg vb="0 0 100 80">
    {shade(50, 78, 30, 4)}
    <path d="M40 78 L60 78 L62 70 L38 70 Z" fill="#d9825b" />
    <ellipse cx="50" cy="48" rx="30" ry="26" fill="#6fbf7a" />
    {[-18, -6, 6, 18].map((dx) => <path key={dx} d={`M${50 + dx} 26 Q${50 + dx * 1.3} 48 ${50 + dx} 72`} stroke="#4f9f5c" strokeWidth="2.5" fill="none" />)}
    <circle cx="44" cy="22" r="6" fill="#ff7aa2" />
    <circle cx="56" cy="22" r="6" fill="#ffbad1" />
    <circle cx="50" cy="18" r="6" fill="#ff7aa2" />
  </Svg>
);

export const Mesa = () => (
  <Svg vb="0 0 200 120">
    <path d="M10 120 L30 44 C32 36 40 32 48 32 L150 32 C160 32 166 38 168 46 L190 120 Z" fill="#e39a5f" />
    <path d="M30 44 C32 36 40 32 48 32 L150 32 C160 32 166 38 168 46 L162 52 L36 52 Z" fill="#f2b47a" />
    <path d="M24 70 L176 70 M18 94 L182 94" stroke="#c97c47" strokeWidth="4" opacity=".6" />
  </Svg>
);

export const Tumbleweed = () => (
  <Svg vb="0 0 60 60">
    <g className="world-roll" style={{ transformOrigin: '30px 30px' }}>
      <circle cx="30" cy="30" r="24" fill="none" stroke="#c49a6c" strokeWidth="3" />
      <path d="M10 22 Q30 40 50 20 M12 40 Q30 18 48 42 M30 6 Q20 30 30 54 M26 8 Q44 30 22 52" stroke="#b08453" strokeWidth="2.5" fill="none" />
    </g>
  </Svg>
);

export const Dune = () => (
  <Svg vb="0 0 200 70">
    <path d="M0 70 C40 30 80 18 120 30 C150 40 176 50 200 70 Z" fill="#f2cf8e" />
    <path d="M60 30 C90 20 110 24 130 34" stroke="#fff" strokeOpacity=".5" strokeWidth="4" fill="none" strokeLinecap="round" />
  </Svg>
);

export const Lizard = () => (
  <Svg vb="0 0 100 60">
    <path d="M10 40 C30 50 50 30 70 36 C84 40 92 34 94 30" stroke="#3fae8f" strokeWidth="8" fill="none" strokeLinecap="round" />
    <ellipse cx="80" cy="30" rx="12" ry="8" fill="#3fae8f" />
    <circle cx="84" cy="27" r="2.5" fill="#2a1630" />
    <path d="M50 36 L44 50 M62 36 L68 50 M34 42 L30 54" stroke="#3fae8f" strokeWidth="4" strokeLinecap="round" />
    <circle cx="58" cy="32" r="3" fill="#ffd84d" />
  </Svg>
);

// ---------- autumn ----------

export const AutumnTree = ({ a = '#f28c38', b = '#ffb45c' }) => (
  <Svg vb="0 0 120 160">
    {shade(60, 156, 34, 5)}
    <path d="M54 156 L56 90 L64 90 L68 156 Z" fill="#7a4a2e" />
    <path d="M58 110 L40 92 M62 104 L80 86" stroke="#7a4a2e" strokeWidth="5" strokeLinecap="round" />
    <g className="world-sway" style={{ transformOrigin: '60px 150px' }}>
      <circle cx="60" cy="58" r="40" fill={a} />
      <circle cx="30" cy="74" r="24" fill={a} />
      <circle cx="92" cy="72" r="24" fill={a} />
      <circle cx="46" cy="44" r="20" fill={b} />
      <circle cx="80" cy="50" r="16" fill={b} />
    </g>
  </Svg>
);

export const Mushroom = () => (
  <Svg vb="0 0 100 80">
    {shade(50, 78, 30, 4)}
    <path d="M40 78 L42 44 L58 44 L60 78 Z" fill="#fff5e6" />
    <path d="M10 48 C10 20 90 20 90 48 Z" fill="#f25c5c" />
    {[[30, 34, 6], [52, 28, 7], [72, 38, 5], [44, 42, 4]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="#fff" />)}
    <path d="M70 78 L71 62 L79 62 L80 78 Z" fill="#fff5e6" />
    <path d="M62 64 C62 50 88 50 88 64 Z" fill="#ff9f43" />
  </Svg>
);

export const Fox = () => (
  <Svg>
    {shade(50, 97, 34, 4)}
    <path d="M70 80 C96 76 98 50 86 44 C88 60 80 70 66 72 Z" fill="#f28c38" />
    <path d="M86 44 C90 50 92 54 90 60 C86 56 86 50 86 44 Z" fill="#fff" />
    <ellipse cx="50" cy="78" rx="24" ry="18" fill="#f28c38" />
    <ellipse cx="50" cy="84" rx="12" ry="10" fill="#fff" />
    <path d="M28 46 L32 22 L44 38 Z M72 46 L68 22 L56 38 Z" fill="#f28c38" />
    <circle cx="50" cy="50" r="20" fill="#f28c38" />
    <path d="M32 54 C40 70 60 70 68 54 C62 60 38 60 32 54 Z" fill="#fff" />
    <circle cx="42" cy="48" r="3" fill="#2a1630" />
    <circle cx="58" cy="48" r="3" fill="#2a1630" />
    <circle cx="50" cy="60" r="3.5" fill="#2a1630" />
  </Svg>
);

export const Owl = () => (
  <Svg vb="0 0 100 110">
    <path d="M6 100 L94 100" stroke="#7a4a2e" strokeWidth="7" strokeLinecap="round" />
    <ellipse cx="50" cy="64" rx="28" ry="34" fill="#9a6b4a" />
    <ellipse cx="50" cy="74" rx="16" ry="20" fill="#e9c29a" />
    <path d="M26 36 L30 20 L40 32 Z M74 36 L70 20 L60 32 Z" fill="#9a6b4a" />
    <circle cx="39" cy="46" r="10" fill="#fff" />
    <circle cx="61" cy="46" r="10" fill="#fff" />
    <circle cx="40" cy="47" r="5" fill="#2a1630" />
    <circle cx="60" cy="47" r="5" fill="#2a1630" />
    <path d="M46 56 L50 62 L54 56 Z" fill="#ff9f43" />
    <path d="M42 98 L42 104 M58 98 L58 104" stroke="#ff9f43" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export const Pumpkin = () => (
  <Svg vb="0 0 100 80">
    {shade(50, 78, 34, 4)}
    <ellipse cx="34" cy="52" rx="20" ry="24" fill="#f28c38" />
    <ellipse cx="66" cy="52" rx="20" ry="24" fill="#f28c38" />
    <ellipse cx="50" cy="52" rx="20" ry="26" fill="#ff9f43" />
    <path d="M50 28 C50 18 56 14 60 12" stroke="#5c7a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M56 22 C66 16 74 22 70 28 C64 26 60 26 56 22 Z" fill="#5cc27a" />
  </Svg>
);

// ---------- mountains ----------

export const Mountain = ({ snow = true }) => (
  <Svg vb="0 0 200 140">
    <path d="M0 140 L70 20 L108 70 L130 44 L200 140 Z" fill="#8a97a8" />
    <path d="M70 20 L108 70 L100 140 L0 140 Z" fill="#9fb0c2" />
    {snow && <path d="M70 20 L90 54 L80 50 L72 60 L62 48 L54 50 Z M130 44 L146 68 L136 64 L128 72 L118 60 Z" fill="#fff" />}
  </Svg>
);

export const Pine = ({ snowy = false }) => (
  <Svg vb="0 0 80 140">
    {shade(40, 136, 22, 4)}
    <rect x="35" y="110" width="10" height="28" rx="3" fill="#7a4a2e" />
    <g className="world-sway" style={{ transformOrigin: '40px 136px' }}>
      <path d="M40 8 L66 58 L14 58 Z" fill="#2f8f55" />
      <path d="M40 34 L74 88 L6 88 Z" fill="#3a9a5f" />
      <path d="M40 62 L78 116 L2 116 Z" fill="#2f8f55" />
      {snowy && <path d="M40 8 L50 28 L44 26 L40 32 L34 26 L30 28 Z M40 36 L54 58 L46 56 L40 62 L32 56 L26 58 Z M40 64 L58 88 L48 86 L40 92 L30 86 L22 88 Z" fill="#fff" />}
    </g>
  </Svg>
);

export const Goat = () => (
  <Svg>
    {shade(50, 97, 32, 4)}
    <ellipse cx="54" cy="66" rx="28" ry="18" fill="#fff" stroke="#d9dfe8" strokeWidth="2" />
    <path d="M36 80 L36 96 M46 82 L46 96 M64 82 L64 96 M74 80 L74 96" stroke="#8a97a8" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="28" cy="50" rx="12" ry="14" fill="#fff" stroke="#d9dfe8" strokeWidth="2" />
    <path d="M24 38 C18 26 26 20 30 28 M32 38 C34 26 42 26 38 36" stroke="#8a97a8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="25" cy="50" r="2.5" fill="#2a1630" />
    <path d="M26 62 L28 70 L30 62" fill="#e8e8e8" />
  </Svg>
);

// ---------- blossom garden ----------

export const BlossomTree = () => (
  <Svg vb="0 0 130 160">
    {shade(65, 156, 36, 5)}
    <path d="M60 156 C60 120 54 104 62 86 L70 86 C74 104 70 124 72 156 Z" fill="#8a5a3c" />
    <path d="M64 108 L42 90 M68 100 L92 84" stroke="#8a5a3c" strokeWidth="5" strokeLinecap="round" />
    <g className="world-sway" style={{ transformOrigin: '65px 150px' }}>
      <circle cx="65" cy="58" r="40" fill="#ffbad1" />
      <circle cx="30" cy="72" r="26" fill="#ffbad1" />
      <circle cx="100" cy="70" r="26" fill="#ffbad1" />
      <circle cx="50" cy="42" r="20" fill="#ffd3e2" />
      <circle cx="86" cy="46" r="18" fill="#ffd3e2" />
      {[[40, 60], [70, 40], [96, 62], [58, 76], [26, 80], [84, 84]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#fff" />)}
    </g>
  </Svg>
);

export const Tulips = () => (
  <Svg vb="0 0 100 80">
    {[[20, '#f25c5c'], [40, '#ffd84d'], [60, '#b867d3'], [80, '#ff7aa2']].map(([x, c]) => (
      <g key={x}>
        <path d={`M${x} 80 L${x} 40`} stroke="#3f9d5f" strokeWidth="3" />
        <path d={`M${x} 64 C${x - 12} 58 ${x - 14} 48 ${x - 12} 44 C${x - 6} 52 ${x - 2} 58 ${x} 64 Z`} fill="#5cc27a" />
        <path d={`M${x - 9} 42 C${x - 10} 28 ${x - 4} 24 ${x} 30 C${x + 4} 24 ${x + 10} 28 ${x + 9} 42 C${x + 4} 48 ${x - 4} 48 ${x - 9} 42 Z`} fill={c} />
      </g>
    ))}
  </Svg>
);

export const Rainbow = () => (
  <Svg vb="0 0 200 110">
    {['#f25c5c', '#ff9f43', '#ffd84d', '#7bd88f', '#5fa8f5', '#b867d3'].map((c, i) => (
      <path key={c} d={`M${10 + i * 10} 104 A${90 - i * 10} ${90 - i * 10} 0 0 1 ${190 - i * 10} 104`} stroke={c} strokeWidth="10" fill="none" />
    ))}
    <ellipse cx="22" cy="100" rx="22" ry="12" fill="#fff" />
    <ellipse cx="178" cy="100" rx="22" ry="12" fill="#fff" />
  </Svg>
);

export const Sunflower = () => (
  <Svg vb="0 0 80 140">
    <path d="M40 140 L40 50" stroke="#3f9d5f" strokeWidth="5" />
    <path d="M40 100 C24 90 14 96 12 104 C24 106 32 104 40 100 Z M40 84 C56 74 66 80 68 88 C56 90 48 88 40 84 Z" fill="#5cc27a" />
    <g className="world-sway" style={{ transformOrigin: '40px 140px' }}>
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <ellipse key={a} cx="40" cy="22" rx="6" ry="14" fill="#ffd84d" transform={`rotate(${a} 40 40)`} />
      ))}
      <circle cx="40" cy="40" r="13" fill="#8a5a3c" />
    </g>
  </Svg>
);

// ---------- snowy tundra ----------

export const Snowman = () => (
  <Svg vb="0 0 100 140">
    {shade(50, 136, 32, 5)}
    <circle cx="50" cy="104" r="30" fill="#fff" stroke="#d5e4f0" strokeWidth="2" />
    <circle cx="50" cy="62" r="22" fill="#fff" stroke="#d5e4f0" strokeWidth="2" />
    <circle cx="50" cy="30" r="17" fill="#fff" stroke="#d5e4f0" strokeWidth="2" />
    <rect x="36" y="4" width="28" height="12" rx="2" fill="#3a3a44" />
    <rect x="30" y="14" width="40" height="5" rx="2" fill="#3a3a44" />
    <circle cx="44" cy="28" r="2.5" fill="#2a1630" />
    <circle cx="56" cy="28" r="2.5" fill="#2a1630" />
    <path d="M50 33 L64 36 L50 37 Z" fill="#ff9f43" />
    <path d="M34 46 C44 52 56 52 66 46 L66 52 C56 58 44 58 34 52 Z" fill="#f25c5c" />
    <path d="M60 50 L64 66 L56 64 Z" fill="#f25c5c" />
    {[58, 68, 96].map((y) => <circle key={y} cx="50" cy={y} r="2.5" fill="#3a3a44" />)}
    <path d="M28 60 L10 48 M72 60 L90 46" stroke="#8a5a3c" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export const Igloo = () => (
  <Svg vb="0 0 140 90">
    {shade(70, 88, 64, 5)}
    <path d="M8 86 C8 30 132 30 132 86 Z" fill="#fff" stroke="#cfe0ee" strokeWidth="2" />
    <path d="M16 70 L124 70 M26 52 L114 52 M44 38 L96 38 M40 86 L40 70 M70 70 L70 52 M94 86 L94 70 M56 52 L56 38 M86 52 L86 38" stroke="#cfe0ee" strokeWidth="2" />
    <path d="M52 86 C52 62 88 62 88 86 Z" fill="#9fc3e0" />
  </Svg>
);

export const Penguin = () => (
  <Svg vb="0 0 80 110">
    {shade(40, 106, 24, 4)}
    <ellipse cx="40" cy="66" rx="26" ry="36" fill="#2a2a38" />
    <ellipse cx="40" cy="72" rx="17" ry="28" fill="#fff" />
    <circle cx="33" cy="42" r="3.5" fill="#fff" />
    <circle cx="47" cy="42" r="3.5" fill="#fff" />
    <circle cx="33" cy="42" r="1.8" fill="#2a1630" />
    <circle cx="47" cy="42" r="1.8" fill="#2a1630" />
    <path d="M34 50 L40 58 L46 50 Z" fill="#ff9f43" />
    <path d="M28 104 L36 100 M52 104 L44 100" stroke="#ff9f43" strokeWidth="5" strokeLinecap="round" />
    <path d="M14 60 C4 72 8 86 16 88 M66 60 C76 72 72 86 64 88" stroke="#2a2a38" strokeWidth="6" fill="none" strokeLinecap="round" />
  </Svg>
);

export const IceHill = () => (
  <Svg vb="0 0 200 80">
    <path d="M0 80 C40 20 110 10 200 80 Z" fill="#fff" />
    <path d="M40 46 C70 26 110 22 140 40" stroke="#cfe0ee" strokeWidth="4" fill="none" strokeLinecap="round" />
  </Svg>
);

// ---------- beach ----------

export const Lighthouse = () => (
  <Svg vb="0 0 100 190">
    {shade(50, 186, 36, 5)}
    <path d="M30 186 L38 60 L62 60 L70 186 Z" fill="#fff" stroke="#e3d6e8" strokeWidth="2" />
    <path d="M33 150 L67 150 L68 168 L32 168 Z M35 110 L65 110 L66 128 L34 128 Z M37 72 L63 72 L64 88 L36 88 Z" fill="#f25c5c" />
    <rect x="34" y="48" width="32" height="14" rx="2" fill="#3a3a44" />
    <rect x="38" y="30" width="24" height="20" rx="3" fill="#ffe27a" className="world-beacon" />
    <path d="M32 32 L50 12 L68 32 Z" fill="#f25c5c" />
    <path d="M62 36 L100 22 L100 50 Z" fill="#ffe27a" opacity=".45" className="world-beacon" />
    <rect x="44" y="160" width="12" height="26" rx="6" fill="#8a5a3c" />
  </Svg>
);

export const Umbrella = () => (
  <Svg vb="0 0 120 130">
    {shade(60, 126, 40, 5)}
    <path d="M60 30 L60 126" stroke="#8a5a3c" strokeWidth="4" />
    <path d="M6 44 C12 10 108 10 114 44 Z" fill="#ff7aa2" />
    <path d="M42 44 C44 14 76 14 78 44 Z" fill="#fff" />
    <path d="M6 44 Q24 36 42 44 Q60 36 78 44 Q96 36 114 44" fill="none" stroke="#e85d75" strokeWidth="3" />
    <rect x="70" y="110" width="44" height="12" rx="4" fill="#58bfbf" />
  </Svg>
);

export const Shell = () => (
  <Svg vb="0 0 60 50">
    <path d="M30 46 C10 46 4 26 12 14 C18 4 42 4 48 14 C56 26 50 46 30 46 Z" fill="#ffbad1" />
    {[-12, -6, 0, 6, 12].map((dx) => <path key={dx} d={`M30 46 L${30 + dx * 1.6} 8`} stroke="#ff8fb3" strokeWidth="2" />)}
  </Svg>
);

export const Starfish = () => (
  <Svg vb="0 0 60 60">
    <path d="M30 4 L37 22 L56 22 L41 34 L47 54 L30 42 L13 54 L19 34 L4 22 L23 22 Z" fill="#ff9f43" strokeLinejoin="round" stroke="#ff9f43" strokeWidth="4" />
    {[[30, 16], [42, 28], [24, 30], [36, 38]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill="#fff" />)}
  </Svg>
);

export const Crab = () => (
  <Svg vb="0 0 100 70">
    {shade(50, 66, 30, 4)}
    <ellipse cx="50" cy="46" rx="26" ry="16" fill="#f25c5c" />
    <path d="M26 46 L10 58 M28 52 L16 64 M74 46 L90 58 M72 52 L84 64" stroke="#f25c5c" strokeWidth="4" strokeLinecap="round" />
    <circle cx="16" cy="28" r="10" fill="#f25c5c" />
    <circle cx="84" cy="28" r="10" fill="#f25c5c" />
    <path d="M12 22 L18 28 M88 22 L82 28" stroke="#fff5d6" strokeWidth="3" />
    <path d="M42 32 L40 22 M58 32 L60 22" stroke="#f25c5c" strokeWidth="3" />
    <circle cx="40" cy="20" r="4" fill="#fff" />
    <circle cx="60" cy="20" r="4" fill="#fff" />
    <circle cx="40" cy="20" r="2" fill="#2a1630" />
    <circle cx="60" cy="20" r="2" fill="#2a1630" />
    <path d="M44 50 Q50 55 56 50" stroke="#2a1630" strokeWidth="2" fill="none" strokeLinecap="round" />
  </Svg>
);

export const Sandcastle = () => (
  <Svg vb="0 0 120 100">
    {shade(60, 97, 50, 4)}
    <path d="M14 96 L14 56 L24 56 L24 50 L34 50 L34 56 L44 56 L44 40 L54 40 L54 34 L66 34 L66 40 L76 40 L76 56 L86 56 L86 50 L96 50 L96 56 L106 56 L106 96 Z" fill="#f2cf8e" />
    <path d="M52 96 C52 80 68 80 68 96 Z" fill="#d9a766" />
    <path d="M60 34 L60 16" stroke="#8a5a3c" strokeWidth="2" />
    <path d="M60 16 L74 21 L60 26 Z" fill="#ff7aa2" />
  </Svg>
);

export const Seagull = () => (
  <Svg vb="0 0 60 30">
    <path d="M4 18 Q16 4 30 18 Q44 4 56 18" stroke="#6b7280" strokeWidth="3.5" fill="none" strokeLinecap="round" className="world-flap" style={{ transformOrigin: '30px 18px' }} />
  </Svg>
);

export const RowboatGirl = () => (
  <Svg vb="0 0 160 110">
    <ellipse cx="80" cy="100" rx="70" ry="7" fill="#fff" opacity=".6" />
    <path d="M30 60 L20 30" stroke="#8a5a3c" strokeWidth="4" strokeLinecap="round" />
    <circle cx="80" cy="26" r="15" fill="#a8683f" />
    <path d="M64 24 C62 4 98 2 96 24 C100 30 96 38 92 34 C92 22 68 22 68 34 C62 36 60 30 64 24 Z" fill="#2a1a14" />
    <circle cx="74" cy="26" r="2.2" fill="#2a1630" />
    <circle cx="86" cy="26" r="2.2" fill="#2a1630" />
    <path d="M75 33 Q80 37 85 33" stroke="#2a1630" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M66 70 C66 48 94 48 94 70 Z" fill="#b867d3" />
    <path d="M70 56 L40 62" stroke="#a8683f" strokeWidth="6" strokeLinecap="round" />
    <path d="M38 62 L14 90" stroke="#c98a4a" strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="12" cy="92" rx="6" ry="3" fill="#c98a4a" />
    <path d="M10 66 L150 66 C144 88 128 98 112 98 L44 98 C28 98 16 88 10 66 Z" fill="#b5703a" />
    <path d="M10 66 L150 66 L148 72 L12 72 Z" fill="#8a5a3c" />
    <path d="M30 84 L130 84" stroke="#8a5a3c" strokeWidth="2" opacity=".5" />
  </Svg>
);
