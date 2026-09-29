import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { sfx } from '../lib/sound.js';
import { speak, speakPage, stopSpeaking } from '../lib/speech.js';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import CareerCard from '../components/CareerCard.jsx';
import StreamMap from '../components/StreamMap.jsx';

const hasDraft = (id) => {
  try { return Boolean(localStorage.getItem(`coloredin:draft:${id}`)); } catch { return false; }
};

const sectionId = (c) => `stream-${c.id}`;

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(null);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
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
  const counts = Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length]));
  const drawn = (pages ?? []).filter((p) => p.image_url);

  const goTo = (category, { announce = true } = {}) => {
    sfx.pick();
    setSelectedId(category.id);
    if (announce) speak(`${category.name[0]} is for ${category.name}!`);
    document.getElementById(sectionId(category))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hear = async (page) => {
    setSpeaking(true);
    await speakPage(page);
    setSpeaking(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <section className="relative grid items-center gap-6 pb-6 pt-8 sm:pt-12 md:grid-cols-[1.2fr_1fr]">
        <div className="animate-rise">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-plum-900 sm:text-6xl">
            Color your <span className="relative whitespace-nowrap text-grape-600">future<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 9c40-6 120-8 196-3" stroke="#ffbad1" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-plum-700">
            Follow the stream to meet {pages?.length ?? 'lots of'} amazing careers. Color her in, tap her name to hear what she does, and imagine yourself there.
          </p>
          <button
            type="button"
            onClick={() => speak('Welcome to Colored In! Hop on a stepping stone in the stream to meet amazing careers. Pick a picture to color, and imagine the job you could do one day.')}
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

      <section aria-labelledby="streams-title" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="streams-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find your{' '}
            <span className="whitespace-nowrap">
              {categories.map((c) => <span key={c.id} style={{ color: c.color }}>{c.name[0]}</span>)}
            </span>
          </h2>
          <p className="font-display text-plum-700">Hop on a stone to explore!</p>
        </div>
        {categories.length > 0 && (
          <StreamMap categories={categories} counts={counts} selectedId={selectedId} onSelect={goTo} />
        )}
      </section>

      {/* Letter bar for jumping between groups */}
      {categories.length > 0 && (
        <nav className="sticky top-[66px] z-20 -mx-4 mb-8 overflow-x-auto bg-lilac-50/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6" aria-label="STREAMS groups">
          <div className="flex w-max gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => goTo(c, { announce: false })}
                className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 font-display text-[15px] transition ${
                  selectedId === c.id ? 'bg-white shadow-md ring-2' : 'bg-white/70 ring-1 ring-lilac-200 hover:bg-white'
                }`}
                style={selectedId === c.id ? { '--tw-ring-color': c.color } : undefined}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full font-semibold text-white" style={{ background: c.color }}>{c.name[0]}</span>
                <span className="text-plum-800">{c.name.split(/[,&]/)[0].trim()}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {error && <p className="card p-6 text-center">We couldn't load the careers. Is the server running?</p>}
      {pages === null && !error && (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="card aspect-[4/5] animate-pulse" />)}
        </div>
      )}

      <div className="space-y-14">
        {categories.map((c) => (byCategory[c.id]?.length ? (
          <section key={c.id} id={sectionId(c)} className="scroll-mt-36" aria-labelledby={`${sectionId(c)}-title`}>
            <div className="mb-5 flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full font-display text-4xl font-bold text-white shadow-md ring-4 ring-white" style={{ background: c.color }}>
                {c.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`${sectionId(c)}-title`} className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {c.name} <span aria-hidden="true">{c.icon}</span>
                </h2>
                <p className="text-plum-700">{c.description}</p>
              </div>
              <button
                type="button"
                onClick={() => speak(`${c.name[0]} is for ${c.name}. ${c.description}`)}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-grape-600 shadow-sm ring-1 ring-lilac-200 transition hover:bg-lilac-100 active:scale-90"
                aria-label={`Hear about ${c.name}`}
              >
                <Icon name="speaker" size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {byCategory[c.id].map((p, i) => (
                <PageCard key={p.id} page={p} category={c} index={i} onPreview={() => { sfx.pick(); setPreview(p); }} />
              ))}
            </div>
          </section>
        ) : null))}
      </div>

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

function PageCard({ page, category, index, onPreview }) {
  const style = { animationDelay: `${Math.min(index, 12) * 40}ms` };
  const footer = (
    <div className="flex items-start justify-between gap-2 px-1 pb-1 pt-3">
      <h3 className="text-lg font-semibold leading-tight text-plum-900">{page.title}</h3>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
        style={{ background: `${category.color}22`, color: category.color }}
      >
        <Icon name={page.image_url ? 'brush' : 'speaker'} size={20} />
      </span>
    </div>
  );

  if (!page.image_url) {
    return (
      <button type="button" onClick={onPreview} className="card group animate-rise flex flex-col p-3 text-left transition hover:-translate-y-1" style={style}>
        <div
          className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl border-2 border-dashed"
          style={{ background: `${category.color}14`, borderColor: `${category.color}55` }}
        >
          <span className="text-6xl transition duration-300 group-hover:scale-110" aria-hidden="true">{category.icon}</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 font-display text-xs text-plum-700">
            Drawing coming soon
          </span>
        </div>
        {footer}
      </button>
    );
  }

  return (
    <Link
      to={`/color/${page.id}`}
      onClick={() => sfx.pick()}
      className="card group animate-rise flex flex-col overflow-hidden p-3 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(88,26,102,0.4)]"
      style={style}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
        <img src={page.image_url} alt={`${page.title} coloring page`} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
        {hasDraft(page.id) && (
          <span className="absolute left-2 top-2 rounded-full bg-mint-300 px-2.5 py-1 font-display text-xs text-plum-900">Keep coloring</span>
        )}
      </div>
      {footer}
    </Link>
  );
}
