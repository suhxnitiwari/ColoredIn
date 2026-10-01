import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { isMuted, setMuted, sfx } from '../lib/sound.js';
import { refreshAmbienceVolume } from '../lib/ambience.js';
import { speakPage, stopSpeaking } from '../lib/speech.js';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import CareerCard from '../components/CareerCard.jsx';
import Avatar from '../avatar/Avatar.jsx';
import CharacterCreator from '../avatar/CharacterCreator.jsx';
import { useAvatar } from '../avatar/useAvatar.js';
import Journey, { readDrafts } from '../worlds/Journey.jsx';
import JourneyHorizontal from '../worlds/JourneyHorizontal.jsx';
import { biomeFor } from '../worlds/biomes.js';

const WIDE = '(min-width: 640px)';

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setMatch(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wide = useMedia(WIDE);
  const mapRef = useRef(null);
  const [avatar, saveAvatar] = useAvatar();
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [active, setActive] = useState(-1);
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/pages')])
      .then(([c, p]) => { setCategories(c.data); setPages(p.data); })
      .catch(() => setError(true));
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/artworks').then(({ data }) => setCompleted(new Set(data.map((a) => a.page_id)))).catch(() => {});
  }, [user]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const p of pages ?? []) (map[p.category_id] ||= []).push(p);
    return map;
  }, [pages]);
  const worlds = useMemo(() => categories.filter((c) => byCategory[c.id]?.length), [categories, byCategory]);

  // Level numbers run 1..N along the whole stream.
  const numbers = useMemo(() => {
    const m = new Map();
    let n = 1;
    for (const c of worlds) for (const p of byCategory[c.id]) m.set(p.id, n++);
    return m;
  }, [worlds, byCategory]);
  const numberFor = useCallback((p) => numbers.get(p.id), [numbers]);

  // Stars: 3 for a saved picture, 1 for one in progress.
  const drafts = useMemo(() => readDrafts(), []);
  const starsFor = useCallback((p) => (completed.has(p.id) ? 3 : drafts.has(p.image_url) ? 1 : 0), [completed, drafts]);
  const totalStars = (pages ?? []).reduce((sum, p) => sum + starsFor(p), 0);

  const open = useCallback((page) => {
    try { localStorage.setItem('coloredin:last', String(page.id)); } catch { /* ignore */ }
    if (page.image_url) navigate(`/color/${page.id}`);
    else { sfx.star(); setPreview(page); }
  }, [navigate]);

  const hear = async (page) => {
    setSpeaking(true);
    await speakPage(page);
    setSpeaking(false);
  };

  const toggleSound = () => {
    setMuted(!muted);
    setMutedState(!muted);
    refreshAmbienceVolume();
  };

  if (!avatar || editing) {
    return (
      <CharacterCreator
        initial={avatar ?? undefined}
        onCancel={avatar ? () => setEditing(false) : undefined}
        onDone={(a) => { saveAvatar(a); setEditing(false); }}
      />
    );
  }

  const previewModal = (
    <Modal open={Boolean(preview)} onClose={() => { setPreview(null); stopSpeaking(); }} title="">
      {preview && (
        <>
          <CareerCard page={preview} bare speaking={speaking} onSpeak={() => hear(preview)} />
          <p className="mt-5 rounded-2xl bg-lilac-50 p-3 text-center font-display text-plum-700">✏️ Her coloring page is still being drawn. Check back soon!</p>
          <div className="mt-5 flex justify-end">
            <button type="button" className="btn-primary" onClick={() => { setPreview(null); stopSpeaking(); }}>Okay!</button>
          </div>
        </>
      )}
    </Modal>
  );

  if (error) return <p className="card m-6 p-6 text-center">We couldn't load the careers. Is the server running?</p>;

  // ---------- phones held upright: top-to-bottom journey ----------
  if (!wide) {
    return (
      <div>
        <div className="flex items-center gap-3 px-4 py-4">
          <button type="button" onClick={() => setEditing(true)} className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-lilac-100 ring-4 ring-white shadow" aria-label="Change my explorer">
            <Avatar a={avatar} crop="head" className="h-full w-full" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">{avatar.name ? `Let's go, ${avatar.name}!` : "Let's explore!"}</h1>
            <p className="font-display text-plum-700">⭐ {totalStars} stars</p>
          </div>
        </div>
        {pages && <Journey categories={categories} byCategory={byCategory} onSelect={open} starsFor={starsFor} numberFor={numberFor} />}
        {previewModal}
      </div>
    );
  }

  // ---------- iPad / desktop: side-scrolling adventure ----------
  return (
    <div className="flex h-[calc(100dvh-65px)] flex-col overflow-hidden">
      <div className="z-40 flex items-center gap-2 border-b border-lilac-200/60 bg-white/85 px-3 py-2 backdrop-blur">
        <button type="button" onClick={() => setEditing(true)} className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-lilac-100 ring-2 ring-grape-500" aria-label="Change my explorer">
          <Avatar a={avatar} crop="head" className="h-full w-full" />
        </button>
        <nav className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto no-scrollbar" aria-label="Worlds">
          {worlds.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { sfx.pick(); mapRef.current?.jumpTo(i); }}
              aria-current={active === i ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 font-display text-sm transition active:scale-95 ${
                active === i ? 'bg-plum-900 text-white shadow-md' : 'bg-white text-plum-800 ring-1 ring-lilac-200'
              }`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full font-semibold text-white" style={{ background: c.color }}>{c.name[0]}</span>
              <span aria-hidden="true">{biomeFor(i).emoji}</span>
              <span className="hidden lg:inline">{c.name.split(/[,&]/)[0].trim()}</span>
            </button>
          ))}
        </nav>
        <span className="shrink-0 rounded-full bg-[#fff6cc] px-3 py-1.5 font-display text-base font-semibold text-[#9a6b00] ring-1 ring-[#f3dc85]">⭐ {totalStars}</span>
        <button type="button" onClick={toggleSound} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-plum-800 ring-1 ring-lilac-200" aria-label={muted ? 'Turn sounds on' : 'Turn sounds off'}>
          <Icon name={muted ? 'mute' : 'speaker'} size={20} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {pages && (
          <JourneyHorizontal
            ref={mapRef}
            worlds={worlds}
            byCategory={byCategory}
            starsFor={starsFor}
            numberFor={numberFor}
            onOpen={open}
            avatar={avatar}
            onEditAvatar={() => setEditing(true)}
            onActiveChange={setActive}
            totalStars={totalStars}
          />
        )}
        <div className="pointer-events-none absolute inset-0 z-40 shadow-[inset_0_0_80px_rgba(30,10,40,.18)]" />
        <button type="button" onClick={() => mapRef.current?.nudge(-1)} className="absolute left-3 top-1/2 z-50 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum-800 shadow-lg ring-1 ring-black/5 active:scale-90" aria-label="Go back">
          <Icon name="back" size={30} />
        </button>
        <button type="button" onClick={() => mapRef.current?.nudge(1)} className="absolute right-3 top-1/2 z-50 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum-800 shadow-lg ring-1 ring-black/5 active:scale-90" aria-label="Go forward">
          <Icon name="back" size={30} className="rotate-180" />
        </button>
      </div>
      {previewModal}
    </div>
  );
}
