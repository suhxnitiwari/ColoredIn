import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ColoringEngine } from './ColoringEngine.js';

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const TAP_SLOP = 10; // px of movement still counted as a tap

/**
 * The drawing surface: two stacked canvases inside a zoomable stage.
 * One finger / mouse paints or fills, two fingers pinch-zoom and pan,
 * the wheel (or trackpad pinch) zooms around the cursor.
 */
const ColoringCanvas = forwardRef(function ColoringCanvas(
  { imageUrl, draftKey, tool, color, brushSize, insideLines, onFill, onHistoryChange, onZoomChange },
  ref,
) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const paintRef = useRef(null);
  const linesRef = useRef(null);
  const cursorRef = useRef(null);
  const engineRef = useRef(null);
  const view = useRef({ scale: 1, tx: 0, ty: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const saveTimer = useRef(null);
  const [status, setStatus] = useState('loading');
  const [base, setBase] = useState({ w: 0, h: 0 });

  // Latest props, readable from stable event handlers.
  const opts = useRef({});
  opts.current = { tool, color, brushSize, insideLines, onFill, onHistoryChange, onZoomChange, draftKey };

  const applyView = useCallback(() => {
    const { scale, tx, ty } = view.current;
    if (stageRef.current) stageRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    opts.current.onZoomChange?.(scale);
  }, []);

  const clampView = useCallback(() => {
    const v = view.current;
    const c = containerRef.current;
    if (!c) return;
    v.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.scale));
    // Keep at least a third of the picture on screen.
    const { width: cw, height: ch } = c.getBoundingClientRect();
    const sw = base.w * v.scale, sh = base.h * v.scale;
    const ox = (cw - base.w) / 2, oy = (ch - base.h) / 2;
    const minTx = -ox - sw + cw / 3, maxTx = cw - ox - cw / 3;
    const minTy = -oy - sh + ch / 3, maxTy = ch - oy - ch / 3;
    if (v.scale === 1) { v.tx = 0; v.ty = 0; } else {
      v.tx = Math.min(maxTx, Math.max(minTx, v.tx));
      v.ty = Math.min(maxTy, Math.max(minTy, v.ty));
    }
  }, [base]);

  /** Zoom by `factor` keeping the point (cx, cy) in container coords fixed. */
  const zoomAt = useCallback((factor, cx, cy) => {
    const v = view.current;
    const c = containerRef.current.getBoundingClientRect();
    const ox = (c.width - base.w) / 2, oy = (c.height - base.h) / 2;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.scale * factor));
    const k = next / v.scale;
    const px = cx - ox, py = cy - oy;
    v.tx = px - (px - v.tx) * k;
    v.ty = py - (py - v.ty) * k;
    v.scale = next;
    clampView();
    applyView();
  }, [base, clampView, applyView]);

  const emitHistory = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    opts.current.onHistoryChange?.({ canUndo: e.canUndo, canRedo: e.canRedo });
  }, []);

  const scheduleDraftSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const e = engineRef.current;
      if (!e?.ready || !opts.current.draftKey) return;
      try { localStorage.setItem(opts.current.draftKey, e.paintDataUrl()); } catch { /* storage full */ }
    }, 700);
  }, []);

  // Create the engine and load the picture.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const engine = new ColoringEngine(paintRef.current, linesRef.current, {
      onChange: () => { emitHistory(); if (engine.ready && !cancelled) scheduleDraftSave(); },
    });
    engineRef.current = engine;
    let draft = null;
    try { draft = draftKey && localStorage.getItem(draftKey); } catch { /* ignore */ }
    engine.load(imageUrl, draft)
      .then(() => { if (!cancelled) { setStatus('ready'); fit(); } })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, draftKey]);

  // Fit the stage to the container, preserving the picture's aspect ratio.
  const fit = useCallback(() => {
    const c = containerRef.current;
    const e = engineRef.current;
    if (!c || !e?.w) return;
    const { width, height } = c.getBoundingClientRect();
    const pad = 16;
    const s = Math.min((width - pad * 2) / e.w, (height - pad * 2) / e.h);
    setBase({ w: Math.max(1, Math.floor(e.w * s)), h: Math.max(1, Math.floor(e.h * s)) });
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(() => fit());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(() => { clampView(); applyView(); }, [base, clampView, applyView]);

  useImperativeHandle(ref, () => ({
    undo: () => engineRef.current?.undo(),
    redo: () => engineRef.current?.redo(),
    clear: () => {
      engineRef.current?.clear();
      try { localStorage.removeItem(opts.current.draftKey); } catch { /* ignore */ }
    },
    exportDataUrl: () => engineRef.current?.exportDataUrl(),
    zoomIn: () => { const r = containerRef.current.getBoundingClientRect(); zoomAt(1.4, r.width / 2, r.height / 2); },
    zoomOut: () => { const r = containerRef.current.getBoundingClientRect(); zoomAt(1 / 1.4, r.width / 2, r.height / 2); },
    resetZoom: () => { view.current = { scale: 1, tx: 0, ty: 0 }; applyView(); },
  }), [zoomAt, applyView]);

  // ---------- pointer handling ----------

  const toCanvas = (clientX, clientY) => {
    const e = engineRef.current;
    const r = paintRef.current.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * e.w, y: ((clientY - r.top) / r.height) * e.h };
  };

  const containerPoint = (ev) => {
    const r = containerRef.current.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  const brushInCanvasPx = () => {
    const e = engineRef.current;
    // Brush size is relative to what the child sees, so zooming in paints finer detail.
    return (opts.current.brushSize * (e.w / base.w)) / view.current.scale * 0.5;
  };

  const updateCursor = (ev) => {
    const el = cursorRef.current;
    if (!el) return;
    const { tool: t } = opts.current;
    if (ev.pointerType !== 'mouse' || (t !== 'brush' && t !== 'eraser')) { el.style.opacity = '0'; return; }
    const p = containerPoint(ev);
    const d = opts.current.brushSize;
    el.style.width = el.style.height = `${d}px`;
    el.style.transform = `translate(${p.x - d / 2}px, ${p.y - d / 2}px)`;
    el.style.opacity = '1';
  };

  const onPointerDown = (ev) => {
    const engine = engineRef.current;
    if (!engine?.ready) return;
    try { containerRef.current.setPointerCapture(ev.pointerId); } catch { /* synthetic pointer */ }
    pointers.current.set(ev.pointerId, containerPoint(ev));

    if (pointers.current.size === 2) {
      // Second finger: abandon any stroke in progress and start pinching.
      if (gesture.current?.type === 'stroke') {
        engine.endStroke();
        if (performance.now() - gesture.current.startedAt < 250) engine.undo();
      }
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        type: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
      return;
    }
    if (pointers.current.size > 2) return;

    const { tool: t, color: c, insideLines: inside } = opts.current;
    const p = containerPoint(ev);
    if (t === 'pan' || ev.button === 1) {
      gesture.current = { type: 'pan', last: p };
    } else if (t === 'fill') {
      gesture.current = { type: 'tap', start: p, client: { x: ev.clientX, y: ev.clientY }, moved: false };
    } else {
      const { x, y } = toCanvas(ev.clientX, ev.clientY);
      engine.beginStroke(x, y, { color: c, size: brushInCanvasPx(), insideLines: inside, erase: t === 'eraser' });
      gesture.current = { type: 'stroke', startedAt: performance.now() };
    }
  };

  const onPointerMove = (ev) => {
    updateCursor(ev);
    if (!pointers.current.has(ev.pointerId)) return;
    const p = containerPoint(ev);
    pointers.current.set(ev.pointerId, p);
    const g = gesture.current;
    if (!g) return;

    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      view.current.tx += mid.x - g.mid.x;
      view.current.ty += mid.y - g.mid.y;
      zoomAt(dist / g.dist, mid.x, mid.y);
      g.dist = dist;
      g.mid = mid;
    } else if (g.type === 'pan') {
      view.current.tx += p.x - g.last.x;
      view.current.ty += p.y - g.last.y;
      g.last = p;
      clampView();
      applyView();
    } else if (g.type === 'tap') {
      if (Math.hypot(p.x - g.start.x, p.y - g.start.y) > TAP_SLOP) g.moved = true;
    } else if (g.type === 'stroke') {
      const events = ev.getCoalescedEvents?.() ?? [ev];
      for (const e of events.length ? events : [ev]) {
        const { x, y } = toCanvas(e.clientX, e.clientY);
        engineRef.current.moveStroke(x, y);
      }
    }
  };

  const onPointerUp = (ev) => {
    if (!pointers.current.has(ev.pointerId)) return;
    pointers.current.delete(ev.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch') {
      if (pointers.current.size === 0) gesture.current = null;
      return;
    }
    if (g.type === 'tap' && !g.moved && ev.type === 'pointerup') {
      const { x, y } = toCanvas(g.client.x, g.client.y);
      if (engineRef.current.fill(x, y, opts.current.color)) opts.current.onFill?.();
    } else if (g.type === 'stroke') {
      engineRef.current.endStroke();
    }
    gesture.current = null;
  };

  const onWheel = (ev) => {
    if (!engineRef.current?.ready) return;
    ev.preventDefault();
    const p = containerPoint(ev);
    if (ev.ctrlKey || Math.abs(ev.deltaY) > Math.abs(ev.deltaX) * 2 && !ev.shiftKey) {
      zoomAt(Math.exp(-ev.deltaY * (ev.ctrlKey ? 0.01 : 0.0018)), p.x, p.y);
    } else {
      view.current.tx -= ev.deltaX;
      view.current.ty -= ev.deltaY;
      clampView();
      applyView();
    }
  };

  // React attaches wheel listeners as passive; we need preventDefault.
  const wheelRef = useRef(onWheel);
  wheelRef.current = onWheel;
  useEffect(() => {
    const el = containerRef.current;
    const handler = (e) => wheelRef.current(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const cursor = tool === 'pan' ? 'grab' : tool === 'fill' ? 'url(/cursors/bucket.svg) 6 26, pointer' : 'none';

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => { if (cursorRef.current) cursorRef.current.style.opacity = '0'; }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: base.w, height: base.h, marginLeft: -base.w / 2, marginTop: -base.h / 2 }}
      >
        <div ref={stageRef} className="relative h-full w-full origin-top-left will-change-transform">
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-12px_rgba(88,26,102,0.35)] ring-1 ring-plum-900/5">
            <canvas ref={paintRef} className="absolute inset-0 h-full w-full" />
            <canvas ref={linesRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
        </div>
      </div>
      <div
        ref={cursorRef}
        className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-plum-800/70 opacity-0 shadow-[0_0_0_1px_white]"
        style={{ background: tool === 'eraser' ? 'rgba(255,255,255,.6)' : `${color}99` }}
      />
      {status !== 'ready' && (
        <div className="absolute inset-0 grid place-items-center">
          {status === 'loading' ? (
            <div className="flex flex-col items-center gap-3 text-plum-700">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-lilac-200 border-t-grape-500" />
              <span className="font-display text-lg">Getting your page ready…</span>
            </div>
          ) : (
            <p className="font-display text-lg text-plum-700">We couldn't load this picture. Try again?</p>
          )}
        </div>
      )}
    </div>
  );
});

export default ColoringCanvas;
