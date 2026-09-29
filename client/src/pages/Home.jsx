import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { sfx } from '../lib/sound.js';
import { speak, speakPage, stopSpeaking } from '../lib/speech.js';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import CareerCard from '../components/CareerCard.jsx';
import Journey from '../worlds/Journey.jsx';
import { biomeFor } from '../worlds/biomes.js';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(null);
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState(null); // career without a drawing yet
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/pages')])
      .then(([c, p]) => { setCategories(c.data); setPages(p.data); })
      .catch(() => setError(true));
    return () => stopSpeaking();
  }, []);

  const byCategory = useMemo(() => {
    const map = {};
    for (const p of pages ?? []) (map[p.category_id] ||= []).push(p);
    return map;
  }, [pages]);
  const worlds = categories.filter((c) => byCategory[c.id]?.length);
  const drawn = (pages ?? []).filter((p) => p.image_url);

  const jump = (c) => {
    sfx.pick();
    document.getElementById(`stream-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hear = async (page) => {
    setSpeaking(true);
    await speakPage(page);
    setSpeaking(false);
  };

  return (
    <div className="pb-0">
      <section className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-8 pt-8 sm:px-6 sm:pt-12 md:grid-cols-[1.2fr_1fr]">
        <div className="animate-rise">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-plum-900 sm:text-6xl">
            Color your <span className="relative whitespace-nowrap text-grape-600">future<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 9c40-6 120-8 196-3" stroke="#ffbad1" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-plum-700">
            Follow the{' '}
            <span className="font-display font-semibold whitespace-nowrap">
              {worlds.map((c) => <span key={c.id} style={{ color: c.color }}>{c.name[0]}</span>)}
            </span>{' '}
            river through {worlds.length || 'seven'} worlds and meet {pages?.length ?? 'lots of'} amazing careers along the way.
          </p>
          <button
            type="button"
            onClick={() => speak('Welcome to Colored In! Follow the stream down through the rainforest, the desert, and more. Tap a career to color her in, and imagine the job you could do one day.')}
            className="btn-soft mt-6"
          >
            <Icon name="speaker" size={20} /> Hear how it works
          </button>
        </div>
        <div className="relative hidden h-60 md:block" aria-hidden="true">
          {drawn.slice(0, 3).map((p, i) => (
            <img
              key={p.id}
              src={p.image_url}
              alt=""
              className="animate-float absolute w-40 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-lilac-200"
              style={{ left: `${[8, 38, 64][i]}%`, top: `${[18, 0, 24][i]}%`, rotate: `${[-8, 3, 9][i]}deg`, animationDelay: `${i * 0.8}s` }}
            />
          ))}
        </div>
      </section>

      {/* World select: jump to any world */}
      {worlds.length > 0 && (
        <nav className="sticky top-[66px] z-30 overflow-x-auto border-y border-lilac-200/60 bg-lilac-50/90 px-4 py-2.5 backdrop-blur sm:px-6" aria-label="Worlds">
          <div className="mx-auto flex w-max gap-2 lg:w-auto lg:max-w-7xl lg:justify-center">
            {worlds.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => jump(c)}
                className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 font-display text-[15px] ring-1 ring-lilac-200 transition hover:shadow-md active:scale-95"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full font-semibold text-white" style={{ background: c.color }}>{c.name[0]}</span>
                <span aria-hidden="true">{biomeFor(i).emoji}</span>
                <span className="text-plum-800">{c.name.split(/[,&]/)[0].trim()}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {error && <p className="card mx-4 mt-6 p-6 text-center">We couldn't load the careers. Is the server running?</p>}
      {pages === null && !error && <div className="mx-4 mt-6 h-96 animate-pulse rounded-3xl bg-white/60" />}

      <Journey categories={categories} byCategory={byCategory} onPreview={(p) => { sfx.pick(); setPreview(p); }} />

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
    </div>
  );
}
