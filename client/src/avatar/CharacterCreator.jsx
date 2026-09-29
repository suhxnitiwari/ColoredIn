import { useEffect, useState } from 'react';
import Avatar, { DEFAULT_AVATAR, EXTRAS, HAIR_COLORS, HAIR_STYLES, OUTFITS, OUTFIT_COLORS, SKINS, presetFor } from './Avatar.jsx';
import { sfx } from '../lib/sound.js';
import { speak } from '../lib/speech.js';
import Icon from '../components/Icon.jsx';

const STEPS = [
  { id: 'kind', label: 'Me', emoji: '🙂', prompt: 'Are you a girl or a boy?' },
  { id: 'skin', label: 'Skin', emoji: '🎨', prompt: 'Pick your skin color!' },
  { id: 'hairColor', label: 'Hair color', emoji: '🌈', prompt: 'What color is your hair?' },
  { id: 'hair', label: 'Hairstyle', emoji: '💇', prompt: 'Pick your hairstyle!' },
  { id: 'outfit', label: 'Outfit', emoji: '👕', prompt: 'Choose your outfit and its color!' },
  { id: 'extra', label: 'Extras', emoji: '🎀', prompt: 'Add something special!' },
  { id: 'name', label: 'Name', emoji: '✏️', prompt: "What's your name, explorer?" },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Full-screen "create your explorer" flow shown before the first adventure. */
export default function CharacterCreator({ initial, onDone, onCancel }) {
  const [a, setA] = useState(() => ({ ...DEFAULT_AVATAR, ...initial }));
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  useEffect(() => { speak(current.prompt); }, [current.prompt]);

  const set = (patch) => { sfx.pick(); setA((prev) => ({ ...prev, ...patch })); };
  const surprise = () => {
    sfx.save();
    setA((prev) => ({
      ...prev, skin: pick(SKINS), hairColor: pick(HAIR_COLORS), hair: pick(HAIR_STYLES),
      outfit: pick(OUTFITS), outfitColor: pick(OUTFIT_COLORS), extra: pick(EXTRAS),
    }));
  };
  const finish = () => {
    sfx.save();
    speak(`Hi ${a.name || 'explorer'}! Let's go on an adventure!`);
    onDone(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[linear-gradient(180deg,#8fd0f0_0%,#e4f5ea_45%,#bfe6c6_46%,#9fdaa8_100%)] md:flex-row">
      {/* preview on a grassy hill */}
      <div className="relative flex min-h-[42%] flex-1 items-end justify-center md:min-h-0">
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 C100 0 300 0 400 40 L400 100 L0 100 Z" fill="#7cc88c" />
        </svg>
        <div className="absolute left-4 top-4 flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-plum-800 shadow" aria-label="Close">
              <Icon name="close" size={24} />
            </button>
          )}
        </div>
        <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-3xl bg-white px-5 py-3 text-center shadow-lg md:top-10">
          <p className="font-display text-2xl font-semibold text-plum-900">{a.name ? `Hi, I'm ${a.name}!` : 'Create your explorer!'}</p>
          <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
        </div>
        <div className="relative mb-[6%] h-[70%] max-h-[520px] animate-rise">
          <Avatar a={a} wave className="h-full w-auto drop-shadow-[0_12px_14px_rgba(20,60,30,.25)]" title="Your explorer" />
        </div>
        <button type="button" onClick={surprise} className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-4 py-3 font-display text-lg text-plum-800 shadow-lg active:scale-95">
          🎲 Surprise me
        </button>
      </div>

      {/* choices */}
      <div className="flex max-h-[58%] flex-col bg-white/95 shadow-2xl backdrop-blur md:max-h-none md:w-[46%] md:max-w-[560px]">
        <div className="flex gap-1.5 overflow-x-auto border-b border-lilac-100 p-3 no-scrollbar" role="tablist">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === step}
              onClick={() => { sfx.tool(); setStep(i); }}
              className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 font-display text-xs transition ${i === step ? 'bg-grape-600 text-white shadow-md' : 'bg-lilac-50 text-plum-800'}`}
            >
              <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{current.prompt}</h2>
            <button type="button" onClick={() => speak(current.prompt)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lilac-100 text-grape-600" aria-label="Hear it">
              <Icon name="speaker" size={20} />
            </button>
          </div>

          {current.id === 'kind' && (
            <div className="grid grid-cols-2 gap-4">
              {['girl', 'boy'].map((k) => {
                const preview = { ...a, kind: k, ...presetFor(k) };
                return (
                  <Choice key={k} selected={a.kind === k} onClick={() => set({ kind: k, ...presetFor(k) })} label={k === 'girl' ? 'Girl' : 'Boy'} big>
                    <Avatar a={preview} crop="bust" className="h-32 w-auto" />
                  </Choice>
                );
              })}
            </div>
          )}

          {current.id === 'skin' && <Swatches values={SKINS} value={a.skin} onPick={(skin) => set({ skin })} />}
          {current.id === 'hairColor' && <Swatches values={HAIR_COLORS} value={a.hairColor} onPick={(hairColor) => set({ hairColor })} />}

          {current.id === 'hair' && (
            <div className="grid grid-cols-3 gap-3">
              {HAIR_STYLES.map((h) => (
                <Choice key={h} selected={a.hair === h} onClick={() => set({ hair: h })} label={h}>
                  <Avatar a={{ ...a, hair: h, extra: 'none' }} crop="head" className="h-20 w-auto" />
                </Choice>
              ))}
            </div>
          )}

          {current.id === 'outfit' && (
            <>
              <div className="grid grid-cols-4 gap-3">
                {OUTFITS.map((o) => (
                  <Choice key={o} selected={a.outfit === o} onClick={() => set({ outfit: o })} label={o}>
                    <Avatar a={{ ...a, outfit: o }} className="h-24 w-auto" />
                  </Choice>
                ))}
              </div>
              <p className="mb-2 mt-5 font-display text-plum-700">Outfit color</p>
              <Swatches values={OUTFIT_COLORS} value={a.outfitColor} onPick={(outfitColor) => set({ outfitColor })} />
            </>
          )}

          {current.id === 'extra' && (
            <div className="grid grid-cols-3 gap-3">
              {EXTRAS.map((e) => (
                <Choice key={e} selected={a.extra === e} onClick={() => set({ extra: e })} label={e === 'none' ? 'Nothing' : e}>
                  <Avatar a={{ ...a, extra: e }} crop="head" className="h-20 w-auto" />
                </Choice>
              ))}
            </div>
          )}

          {current.id === 'name' && (
            <div>
              <input
                className="input !py-4 font-display !text-2xl"
                value={a.name}
                maxLength={16}
                placeholder="Type your name"
                onChange={(e) => setA((prev) => ({ ...prev, name: e.target.value.replace(/[^\p{L} '-]/gu, '') }))}
                aria-label="Your name"
              />
              <p className="mt-2 text-sm text-plum-700/80">Just your first name. It stays on this device.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-lilac-100 p-4">
          {step > 0 && (
            <button type="button" className="btn-soft !px-5 !py-3.5 text-lg" onClick={() => { sfx.tool(); setStep(step - 1); }}>
              <Icon name="back" size={22} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary ml-auto !px-7 !py-3.5 text-lg" onClick={() => { sfx.tool(); setStep(step + 1); }}>
              Next ➜
            </button>
          ) : (
            <button type="button" className="btn-primary ml-auto !px-7 !py-3.5 text-lg" onClick={finish}>
              Start my adventure! 🚣
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Choice({ selected, onClick, label, children, big }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-center justify-end gap-1 rounded-3xl p-3 font-display capitalize transition active:scale-95 ${big ? 'text-xl' : 'text-sm'} ${
        selected ? 'bg-lilac-100 ring-4 ring-grape-500' : 'bg-lilac-50 ring-1 ring-lilac-200'
      }`}
    >
      {children}
      <span className="text-plum-800">{label}</span>
    </button>
  );
}

function Swatches({ values, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-4">
      {values.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-pressed={value === c}
          aria-label={c}
          className={`h-16 w-16 rounded-full shadow-md transition active:scale-90 ${value === c ? 'ring-4 ring-grape-500 ring-offset-4' : 'ring-2 ring-white'}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
