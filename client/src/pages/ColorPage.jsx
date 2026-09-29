import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { isMuted, setMuted, sfx } from '../lib/sound.js';
import { speak, speakPage, stopSpeaking } from '../lib/speech.js';
import { useToast } from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';
import Confetti from '../components/Confetti.jsx';
import Modal from '../components/Modal.jsx';
import CareerCard from '../components/CareerCard.jsx';
import ColoringCanvas from '../coloring/ColoringCanvas.jsx';
import { BRUSH_SIZES, COLORS, HAIR_TONES, SKIN_TONES } from '../coloring/palette.js';

const TOOLS = [
  { id: 'fill', icon: 'bucket', label: 'Fill', key: 'f' },
  { id: 'brush', icon: 'brush', label: 'Crayon', key: 'b' },
  { id: 'eraser', icon: 'eraser', label: 'Eraser', key: 'e' },
  { id: 'pan', icon: 'hand', label: 'Move', key: 'm' },
];

export default function ColorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const canvasRef = useRef(null);

  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [tool, setTool] = useState('fill');
  const [color, setColor] = useState('#b867d3');
  const [size, setSize] = useState(BRUSH_SIZES[1]);
  const [insideLines, setInsideLines] = useState(true);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [zoom, setZoom] = useState(1);
  const [muted, setMutedState] = useState(isMuted());
  const [speaking, setSpeaking] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [dialog, setDialog] = useState(null); // 'clear' | 'login'
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(0);

  useEffect(() => {
    api.get(`/pages/${id}`).then(({ data }) => setPage(data)).catch(() => setNotFound(true));
    return () => stopSpeaking();
  }, [id]);

  const readAloud = useCallback(async () => {
    if (!page) return;
    setSpeaking(true);
    await speakPage(page);
    setSpeaking(false);
  }, [page]);

  const chooseTool = (t) => { sfx.tool(); setTool(t); };
  const chooseColor = (hex) => {
    sfx.pick();
    setColor(hex);
    if (tool === 'eraser' || tool === 'pan') setTool('fill');
  };

  const undo = () => { if (canvasRef.current?.undo()) sfx.undo(); };
  const redo = () => { if (canvasRef.current?.redo()) sfx.undo(); };

  const save = async () => {
    if (!user) { setDialog('login'); return; }
    setSaving(true);
    try {
      await api.post('/artworks', { page_id: page.id, colored_image_data: canvasRef.current.exportDataUrl() });
      sfx.save();
      setCelebrate((n) => n + 1);
      toast('Saved to your gallery!');
      if (!muted) speak(`Amazing work, future ${page.title}!`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current.exportDataUrl();
    a.download = `ColoredIn-${page.title.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  // Keyboard shortcuts for grown-ups and older kids.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (mod) return;
      const t = TOOLS.find((x) => x.key === e.key.toLowerCase());
      if (t) chooseTool(t.id);
      if (e.key === '=' || e.key === '+') canvasRef.current?.zoomIn();
      if (e.key === '-') canvasRef.current?.zoomOut();
      if (e.key === '0') canvasRef.current?.resetZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (notFound) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-display text-2xl">We couldn't find that page.</p>
          <Link to="/" className="btn-primary mt-4">Back to all careers</Link>
        </div>
      </div>
    );
  }

  if (page && !page.image_url) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-md text-center">
          <CareerCard page={page} speaking={speaking} onSpeak={readAloud} />
          <p className="mt-6 font-display text-lg text-plum-700">Her coloring page is still being drawn. Check back soon!</p>
          <Link to="/" className="btn-primary mt-4">Back to the stream</Link>
        </div>
      </div>
    );
  }

  const showSizes = tool === 'brush' || tool === 'eraser';

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Top bar */}
      <header className="z-20 flex items-center gap-2 border-b border-lilac-200/70 bg-white/80 px-3 py-2 backdrop-blur sm:px-4">
        <button type="button" onClick={() => navigate('/')} className="grid h-11 w-11 place-items-center rounded-full text-plum-800 hover:bg-lilac-100" aria-label="Back to all careers">
          <Icon name="back" size={26} />
        </button>
        <button
          type="button"
          onClick={() => { setShowInfo((s) => !s); readAloud(); }}
          className="flex min-w-0 shrink items-center gap-2 rounded-full bg-lilac-100 py-1.5 pl-2 pr-4 text-left transition hover:bg-lilac-200 lg:pointer-events-none lg:bg-transparent"
          aria-label={`${page?.title ?? ''}. Tap to hear about this job.`}
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-grape-600 lg:hidden ${speaking ? 'animate-pulse' : ''}`}>
            <Icon name="speaker" size={18} />
          </span>
          <span className="truncate font-display text-lg font-semibold text-plum-900 sm:text-xl">{page?.title ?? '…'}</span>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <IconButton label={muted ? 'Turn sounds on' : 'Turn sounds off'} icon={muted ? 'mute' : 'speaker'} onClick={() => { setMuted(!muted); setMutedState(!muted); }} className="hidden sm:grid" />
          <IconButton label="Undo" icon="undo" onClick={undo} disabled={!history.canUndo} />
          <IconButton label="Redo" icon="redo" onClick={redo} disabled={!history.canRedo} className="max-[420px]:hidden" />
          <IconButton label="Start over" icon="refresh" onClick={() => setDialog('clear')} disabled={!page} className="hidden sm:grid" />
          <button type="button" onClick={save} disabled={!page || saving} className="btn-primary ml-1 !px-4 sm:!px-5">
            <Icon name="heart" size={20} /> <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Canvas */}
        <div className="relative min-h-0 flex-1">
          {page && (
            <ColoringCanvas
              ref={canvasRef}
              imageUrl={page.image_url}
              draftKey={`coloredin:draft:${page.id}`}
              tool={tool}
              color={color}
              brushSize={size.size}
              insideLines={insideLines}
              onFill={sfx.fill}
              onHistoryChange={setHistory}
              onZoomChange={setZoom}
            />
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-lilac-200 backdrop-blur">
            <IconButton small label="Zoom out" icon="zoomOut" onClick={() => canvasRef.current?.zoomOut()} disabled={zoom <= 1} />
            <button type="button" onClick={() => canvasRef.current?.resetZoom()} className="w-12 text-center font-display text-sm text-plum-700" title="Fit to screen">
              {Math.round(zoom * 100)}%
            </button>
            <IconButton small label="Zoom in" icon="zoomIn" onClick={() => canvasRef.current?.zoomIn()} disabled={zoom >= 6} />
          </div>

          {/* Career card popover on small screens */}
          {showInfo && page && (
            <div className="absolute inset-x-3 top-3 z-10 lg:hidden">
              <CareerCard page={page} speaking={speaking} onSpeak={readAloud} onClose={() => { setShowInfo(false); stopSpeaking(); }} />
            </div>
          )}
        </div>

        {/* Dock: side panel on large screens, bottom tray on small */}
        <aside className="z-10 flex shrink-0 flex-col gap-3 border-t border-lilac-200/70 bg-white/85 p-3 backdrop-blur lg:w-[340px] lg:gap-4 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-5">
          {page && <div className="hidden lg:block"><CareerCard page={page} speaking={speaking} onSpeak={readAloud} /></div>}

          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-lilac-100 p-1.5" role="radiogroup" aria-label="Tools">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tool === t.id}
                  onClick={() => chooseTool(t.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 font-display text-xs transition ${
                    tool === t.id ? 'bg-white text-grape-600 shadow-sm' : 'text-plum-700 hover:bg-white/60'
                  }`}
                >
                  <Icon name={t.icon} size={24} />
                  {t.label}
                </button>
              ))}
            </div>

            <div className={`flex items-center gap-2 lg:justify-between ${showSizes ? '' : 'max-lg:hidden lg:opacity-40'}`}>
              <div className="flex items-center gap-1 rounded-2xl bg-lilac-100 p-1.5" role="radiogroup" aria-label="Crayon size">
                {BRUSH_SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={size.id === s.id}
                    aria-label={s.label}
                    disabled={!showSizes}
                    onClick={() => { sfx.tool(); setSize(s); }}
                    className={`grid h-11 w-11 place-items-center rounded-xl transition ${size.id === s.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                  >
                    <span className="rounded-full bg-plum-800" style={{ width: 6 + s.size / 3, height: 6 + s.size / 3 }} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={insideLines}
                disabled={!showSizes}
                onClick={() => { sfx.tool(); setInsideLines((v) => !v); }}
                className={`flex h-14 items-center gap-2 rounded-2xl px-3 font-display text-sm transition ${
                  insideLines ? 'bg-mint-300 text-plum-900' : 'bg-lilac-100 text-plum-700'
                }`}
                title="Magic crayon keeps your color inside the lines"
              >
                <Icon name="magic" size={20} />
                <span className="leading-tight">Stay in<br />the lines</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            <Swatches title="Colors" colors={COLORS} value={color} onPick={chooseColor} />
            <Swatches title="Skin" colors={SKIN_TONES} value={color} onPick={chooseColor} />
            <Swatches title="Hair" colors={HAIR_TONES} value={color} onPick={chooseColor} />
          </div>
        </aside>
      </div>

      <Confetti trigger={celebrate} />

      <Modal open={dialog === 'clear'} onClose={() => setDialog(null)} title="Start over?">
        <p className="text-plum-700">This wipes all the color off the page. You can still press Undo after.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-soft" onClick={() => setDialog(null)}>Keep coloring</button>
          <button type="button" className="btn-primary" onClick={() => { canvasRef.current?.clear(); setDialog(null); }}>Start over</button>
        </div>
      </Modal>

      <Modal open={dialog === 'login'} onClose={() => setDialog(null)} title="Save your masterpiece">
        <p className="text-plum-700">Ask a grown-up to log in so your picture can go in your gallery. Your coloring is kept on this device until then.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-soft" onClick={() => { download(); setDialog(null); }}>
            <Icon name="download" size={20} /> Download picture
          </button>
          <Link to="/login" className="btn-primary">Log in</Link>
        </div>
      </Modal>
    </div>
  );
}

function IconButton({ label, icon, onClick, disabled, small, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid place-items-center rounded-full text-plum-800 transition hover:bg-lilac-100 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent ${small ? 'h-9 w-9' : 'h-11 w-11'} ${className}`}
    >
      <Icon name={icon} size={small ? 20 : 24} />
    </button>
  );
}

function Swatches({ title, colors, value, onPick }) {
  return (
    <div className="shrink-0">
      <p className="mb-1.5 px-1 font-display text-xs uppercase tracking-wider text-plum-700/70">{title}</p>
      <div className="flex gap-2 lg:flex-wrap">
        {colors.map((c) => {
          const selected = value === c.hex;
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onPick(c.hex)}
              aria-label={c.name}
              aria-pressed={selected}
              title={c.name}
              className={`h-11 w-11 shrink-0 rounded-full transition hover:scale-110 ${
                selected ? 'animate-pop ring-4 ring-grape-500 ring-offset-2' : 'ring-1 ring-black/10'
              }`}
              style={{ background: c.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
