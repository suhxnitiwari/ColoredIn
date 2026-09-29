import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { sfx } from '../lib/sound.js';
import { speak } from '../lib/speech.js';
import Icon from '../components/Icon.jsx';

const hasDraft = (id) => {
  try { return Boolean(localStorage.getItem(`coloredin:draft:${id}`)); } catch { return false; }
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(null);
  const [active, setActive] = useState('all');
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/pages')])
      .then(([c, p]) => { setCategories(c.data); setPages(p.data); })
      .catch(() => setError(true));
  }, []);

  const visible = useMemo(
    () => (pages ?? []).filter((p) => active === 'all' || p.category_id === active),
    [pages, active],
  );
  // Only show categories that have at least one page.
  const usedCategories = categories.filter((c) => pages?.some((p) => p.category_id === c.id));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <section className="relative grid items-center gap-6 py-8 sm:py-12 md:grid-cols-[1.2fr_1fr]">
        <div className="animate-rise">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-plum-900 sm:text-6xl">
            Color your <span className="relative whitespace-nowrap text-grape-600">future<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 9c40-6 120-8 196-3" stroke="#ffbad1" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-plum-700">
            Pick an engineer, an astronaut, a pilot and more. Color her in, tap her name to hear what she does, and imagine yourself there.
          </p>
          <button
            type="button"
            onClick={() => speak('Welcome to Colored In! Pick a picture to color, and learn about a real job you could do one day.')}
            className="btn-soft mt-6"
          >
            <Icon name="speaker" size={20} /> Hear how it works
          </button>
        </div>
        <div className="relative hidden h-64 md:block" aria-hidden="true">
          {(pages ?? []).slice(0, 3).map((p, i) => (
            <img
              key={p.id}
              src={p.image_url}
              alt=""
              className="animate-float absolute w-44 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-lilac-200"
              style={{
                left: `${[8, 38, 64][i]}%`, top: `${[18, 0, 24][i]}%`,
                rotate: `${[-8, 3, 9][i]}deg`, animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>
      </section>

      <div className="sticky top-[66px] z-20 -mx-4 mb-6 overflow-x-auto bg-lilac-50/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex w-max gap-2" role="tablist" aria-label="Career categories">
          <Chip active={active === 'all'} onClick={() => setActive('all')} color="#8b2b9e">All careers</Chip>
          {usedCategories.map((c) => (
            <Chip key={c.id} active={active === c.id} onClick={() => setActive(c.id)} color={c.color}>{c.name}</Chip>
          ))}
        </div>
      </div>

      {error && <p className="card p-6 text-center">We couldn't load the pictures. Is the server running?</p>}

      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {pages === null
          ? Array.from({ length: 8 }, (_, i) => <div key={i} className="card aspect-[4/5] animate-pulse" />)
          : visible.map((p, i) => <PageCard key={p.id} page={p} index={i} />)}
      </div>
    </div>
  );
}

function Chip({ active, onClick, color, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => { sfx.tool(); onClick(); }}
      className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-[15px] transition ${
        active ? 'bg-plum-900 text-white shadow-md' : 'bg-white text-plum-800 ring-1 ring-lilac-200 hover:ring-lilac-400'
      }`}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {children}
    </button>
  );
}

function PageCard({ page, index }) {
  const draft = hasDraft(page.id);
  return (
    <Link
      to={`/color/${page.id}`}
      onClick={() => sfx.pick()}
      className="card group animate-rise flex flex-col overflow-hidden p-3 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(88,26,102,0.4)]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
        <img src={page.image_url} alt={`${page.title} coloring page`} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
        {draft && (
          <span className="absolute left-2 top-2 rounded-full bg-mint-300 px-2.5 py-1 font-display text-xs text-plum-900">Keep coloring</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 px-1 pb-1 pt-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight text-plum-900">{page.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-plum-700">
            <span className="h-2 w-2 rounded-full" style={{ background: page.category?.color }} />
            {page.category?.name}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lilac-100 text-grape-600 transition group-hover:bg-grape-600 group-hover:text-white">
          <Icon name="brush" size={20} />
        </span>
      </div>
    </Link>
  );
}
