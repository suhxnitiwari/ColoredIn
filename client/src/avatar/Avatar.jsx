// A build-your-own explorer, drawn from a handful of choices. Chibi proportions
// (big head, small body) keep it friendly and readable at small sizes.

export const SKINS = ['#fde2cf', '#f1c09b', '#d9955f', '#a8683f', '#6e3f24', '#4a2a18'];
export const HAIR_COLORS = ['#1f1a1c', '#3b2418', '#7a4a2a', '#b5542b', '#f3d27a', '#b867d3', '#ff8fb3'];
export const OUTFIT_COLORS = ['#b867d3', '#ff7aa2', '#58bfbf', '#5fa8f5', '#ffd84d', '#7bd88f', '#f25c5c', '#ff9f43'];
export const HAIR_STYLES = ['long', 'curly', 'puffs', 'braids', 'bun', 'ponytail', 'short', 'afro', 'buzz'];
export const OUTFITS = ['dress', 'overalls', 'tee', 'hoodie'];
export const EXTRAS = ['none', 'glasses', 'bow', 'cap', 'headband'];

export const DEFAULT_AVATAR = {
  kind: 'girl', skin: SKINS[2], hairColor: HAIR_COLORS[1], hair: 'puffs', outfit: 'dress', outfitColor: OUTFIT_COLORS[0], extra: 'bow', name: '',
};

export const presetFor = (kind) => (kind === 'boy'
  ? { hair: 'short', outfit: 'tee', extra: 'none' }
  : { hair: 'puffs', outfit: 'dress', extra: 'bow' });

const darken = (hex, amt = 0.2) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * (1 - amt)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

function HairBack({ style, c }) {
  switch (style) {
    case 'long': return <path d="M24 50 C20 20 100 20 96 50 L100 118 C86 126 74 118 72 104 L48 104 C46 118 34 126 20 118 Z" fill={c} />;
    case 'curly': return (
      <g fill={c}>
        {[[26, 40], [22, 62], [26, 84], [34, 100], [94, 40], [98, 62], [94, 84], [86, 100], [40, 22], [60, 16], [80, 22]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="15" />)}
      </g>
    );
    case 'puffs': return <g fill={c}><circle cx="24" cy="26" r="19" /><circle cx="96" cy="26" r="19" /></g>;
    case 'braids': return (
      <g fill={c}>
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={`l${i}`} cx={26 - i * 0.5} cy={70 + i * 11} rx="8" ry="7" />)}
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={`r${i}`} cx={94 + i * 0.5} cy={70 + i * 11} rx="8" ry="7" />)}
      </g>
    );
    case 'bun': return <circle cx="60" cy="10" r="15" fill={c} />;
    case 'ponytail': return <path d="M88 30 C112 30 112 70 104 96 C100 80 96 64 86 50 Z" fill={c} />;
    case 'afro': return <circle cx="60" cy="46" r="46" fill={c} />;
    default: return null;
  }
}

function HairFront({ style, c }) {
  switch (style) {
    case 'buzz': return <path d="M27 46 C27 16 93 16 93 46 C86 34 74 28 60 28 C46 28 34 34 27 46 Z" fill={c} opacity=".9" />;
    case 'short': return <path d="M25 50 C20 12 100 12 95 50 C92 40 86 34 80 32 C70 40 50 42 38 34 C32 38 28 42 25 50 Z" fill={c} />;
    case 'curly': return <g fill={c}>{[34, 46, 60, 74, 86].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 26 : 30} r="11" />)}</g>;
    case 'braids': return <path d="M26 50 C22 14 98 14 94 50 C90 36 76 26 62 26 L60 40 L58 26 C44 26 30 36 26 50 Z" fill={c} />;
    case 'afro': return <path d="M26 44 C30 22 90 22 94 44 C84 34 72 30 60 30 C48 30 36 34 26 44 Z" fill={c} />;
    default: return <path d="M25 52 C20 14 100 14 95 52 C88 38 80 32 70 30 C62 40 44 44 30 42 C28 45 26 48 25 52 Z" fill={c} />;
  }
}

function Outfit({ type, color, skin }) {
  const dark = darken(color, 0.22);
  const legs = (
    <g>
      <rect x="46" y="136" width="10" height="18" rx="5" fill={skin} />
      <rect x="64" y="136" width="10" height="18" rx="5" fill={skin} />
      <ellipse cx="50" cy="155" rx="9" ry="5" fill="#3a3a44" />
      <ellipse cx="70" cy="155" rx="9" ry="5" fill="#3a3a44" />
    </g>
  );
  if (type === 'dress') {
    return (
      <g>
        {legs}
        <path d="M44 96 L76 96 L92 142 C72 148 48 148 28 142 Z" fill={color} />
        <path d="M30 136 C50 142 70 142 90 136 L92 142 C72 148 48 148 28 142 Z" fill="#fff" opacity=".45" />
        <rect x="44" y="108" width="32" height="6" rx="3" fill={dark} />
      </g>
    );
  }
  if (type === 'overalls') {
    return (
      <g>
        {legs}
        <path d="M44 96 L76 96 L78 124 L42 124 Z" fill="#fff" />
        <path d="M42 110 L78 110 L82 140 L64 140 L60 128 L56 140 L38 140 Z" fill={color} />
        <rect x="50" y="102" width="20" height="14" rx="3" fill={color} />
        <path d="M46 96 L50 106 M74 96 L70 106" stroke={dark} strokeWidth="3" />
        <circle cx="52" cy="106" r="2" fill="#ffd84d" />
        <circle cx="68" cy="106" r="2" fill="#ffd84d" />
      </g>
    );
  }
  const hood = type === 'hoodie';
  return (
    <g>
      {legs}
      <path d="M44 124 L76 124 L78 140 L62 140 L60 132 L58 140 L42 140 Z" fill="#4a5ba8" />
      <path d="M42 96 L78 96 L80 128 L40 128 Z" fill={color} />
      {hood && <path d="M44 96 C46 104 74 104 76 96" stroke={dark} strokeWidth="5" fill="none" />}
      {hood ? <rect x="52" y="114" width="16" height="8" rx="3" fill={dark} /> : <path d="M52 110 l8 -6 l8 6" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />}
    </g>
  );
}

function Extra({ type, hairColor }) {
  switch (type) {
    case 'glasses': return (
      <g stroke="#3a2a44" strokeWidth="2.5" fill="#fff" fillOpacity=".25">
        <circle cx="47" cy="58" r="9" /><circle cx="73" cy="58" r="9" /><path d="M56 58 L64 58" />
      </g>
    );
    case 'bow': return (
      <g transform="translate(84 22) rotate(20)">
        <path d="M0 0 L-14 -9 L-14 9 Z M0 0 L14 -9 L14 9 Z" fill="#ff7aa2" stroke="#e85d75" strokeWidth="1.5" strokeLinejoin="round" />
        <circle r="4" fill="#e85d75" />
      </g>
    );
    case 'cap': return (
      <g>
        <path d="M24 42 C24 10 96 10 96 42 Z" fill="#f25c5c" />
        <path d="M60 40 C80 38 104 40 112 46 C96 48 76 46 60 44 Z" fill="#c94141" />
        <circle cx="60" cy="14" r="4" fill="#c94141" />
      </g>
    );
    case 'headband': return <path d="M26 42 C34 20 86 20 94 42" stroke={hairColor === '#ff8fb3' ? '#b867d3' : '#ff8fb3'} strokeWidth="6" fill="none" strokeLinecap="round" />;
    default: return null;
  }
}

/**
 * @param {object} props.a      avatar settings
 * @param {'full'|'head'|'bust'} props.crop
 * @param {boolean} props.wave  raise one arm
 */
export default function Avatar({ a = DEFAULT_AVATAR, crop = 'full', wave = false, className = '', title }) {
  const vb = crop === 'head' ? '8 0 104 96' : crop === 'bust' ? '4 0 112 132' : '0 0 120 160';
  const skinShade = darken(a.skin, 0.12);
  return (
    <svg viewBox={vb} className={`${crop === 'head' ? 'overflow-hidden' : 'overflow-visible'} ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {crop === 'full' && <ellipse cx="60" cy="157" rx="30" ry="5" fill="#1b3a2a" opacity=".15" />}
      <HairBack style={a.hair} c={a.hairColor} />
      {crop !== 'head' && (
        <>
          <Outfit type={a.outfit} color={a.outfitColor} skin={a.skin} />
          {/* arms */}
          <path d="M44 100 C34 108 32 118 34 126" stroke={a.skin} strokeWidth="9" strokeLinecap="round" fill="none" />
          <circle cx="34" cy="128" r="6" fill={a.skin} />
          {wave
            ? (
              <g className="avatar-wave" style={{ transformOrigin: '76px 100px' }}>
                <path d="M76 100 C92 98 102 90 108 78" stroke={a.skin} strokeWidth="9" strokeLinecap="round" fill="none" />
                <circle cx="109" cy="75" r="6.5" fill={a.skin} />
              </g>
            )
            : (
              <>
                <path d="M76 100 C86 108 88 118 86 126" stroke={a.skin} strokeWidth="9" strokeLinecap="round" fill="none" />
                <circle cx="86" cy="128" r="6" fill={a.skin} />
              </>
            )}
          <rect x="54" y="84" width="12" height="14" rx="5" fill={skinShade} />
        </>
      )}
      {/* head */}
      <ellipse cx="24" cy="60" rx="7" ry="9" fill={a.skin} />
      <ellipse cx="96" cy="60" rx="7" ry="9" fill={a.skin} />
      <ellipse cx="60" cy="54" rx="35" ry="34" fill={a.skin} />
      <ellipse cx="44" cy="66" rx="6" ry="4" fill="#ff8fb3" opacity=".45" />
      <ellipse cx="76" cy="66" rx="6" ry="4" fill="#ff8fb3" opacity=".45" />
      <ellipse cx="47" cy="57" rx="5.5" ry="7" fill="#2a1630" />
      <ellipse cx="73" cy="57" rx="5.5" ry="7" fill="#2a1630" />
      <circle cx="49" cy="54" r="2.2" fill="#fff" />
      <circle cx="75" cy="54" r="2.2" fill="#fff" />
      <path d="M40 46 Q47 42 53 45 M67 45 Q73 42 80 46" stroke={a.hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M51 70 Q60 78 69 70" stroke="#2a1630" strokeWidth="3" fill="#fff" strokeLinecap="round" strokeLinejoin="round" />
      <HairFront style={a.hair} c={a.hairColor} />
      <Extra type={a.extra} hairColor={a.hairColor} />
    </svg>
  );
}
