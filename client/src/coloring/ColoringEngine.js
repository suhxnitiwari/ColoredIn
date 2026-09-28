// Imperative coloring engine. Owns two stacked canvases:
//   paint  – the child's colors (opaque, starts white)
//   lines  – the line art as transparent ink, drawn on top
// React only talks to it through the public methods below.

const TARGET_SIZE = 1300; // longest side of the working canvas, in pixels
const HISTORY_LIMIT = 40;
const INK = [42, 22, 48]; // deep plum instead of pure black; softer on the eyes

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function runRegionWorker(rgba, w, h, gapRadius) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./regions.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { worker.terminate(); resolve(data); };
    worker.onerror = (e) => { worker.terminate(); reject(e); };
    worker.postMessage({ rgba, w, h, gapRadius }, [rgba.buffer]);
  });
}

export class ColoringEngine {
  constructor(paintCanvas, lineCanvas, { onChange } = {}) {
    this.paint = paintCanvas;
    this.lines = lineCanvas;
    this.pctx = paintCanvas.getContext('2d', { willReadFrequently: true });
    this.lctx = lineCanvas.getContext('2d');
    this.onChange = onChange || (() => {});
    this.undoStack = [];
    this.redoStack = [];
    this.stroke = null;
    this.anim = null;
    this.ready = false;
  }

  async load(imageUrl, draftUrl) {
    const img = await loadImage(imageUrl);
    const scale = Math.min(3, TARGET_SIZE / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    this.w = w;
    this.h = h;
    for (const c of [this.paint, this.lines]) { c.width = w; c.height = h; }

    // Rasterise the source at working size.
    const src = document.createElement('canvas');
    src.width = w;
    src.height = h;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    sctx.fillStyle = '#fff';
    sctx.fillRect(0, 0, w, h);
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(img, 0, 0, w, h);
    const rgba = sctx.getImageData(0, 0, w, h).data;

    // Line layer: darkness becomes alpha, so it sits cleanly over any color.
    const lineData = this.lctx.createImageData(w, h);
    for (let p = 0; p < rgba.length; p += 4) {
      const lum = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
      const a = Math.max(0, Math.min(255, (255 - lum) * 1.3 - 26));
      lineData.data[p] = INK[0];
      lineData.data[p + 1] = INK[1];
      lineData.data[p + 2] = INK[2];
      lineData.data[p + 3] = a;
    }
    this.lctx.putImageData(lineData, 0, 0);

    const gapRadius = Math.max(2, Math.round(1.4 * scale));
    const { labels, boxes } = await runRegionWorker(new Uint8ClampedArray(rgba), w, h, gapRadius);
    this.labels = labels;
    this.boxes = boxes;

    this.pctx.fillStyle = '#fff';
    this.pctx.fillRect(0, 0, w, h);
    if (draftUrl) {
      try {
        this.pctx.drawImage(await loadImage(draftUrl), 0, 0, w, h);
      } catch { /* ignore a corrupt draft */ }
    }
    this.undoStack = [];
    this.redoStack = [];
    this.ready = true;
    this.onChange();
  }

  regionAt(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return 0;
    return this.labels[yi * this.w + xi];
  }

  // ---------- fill ----------

  fill(x, y, hex, { animate = true } = {}) {
    if (!this.ready) return false;
    this.finishAnimation();
    const id = this.regionAt(x, y);
    if (!id) return false;
    const [bx0, by0, bx1, by1] = this.boxes[id];
    const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
    const before = this.pctx.getImageData(bx0, by0, bw, bh);
    const [r, g, b] = hexToRgb(hex);

    // Collect region pixels (in box-local coords) bucketed by distance from the tap.
    const cx = x - bx0, cy = y - by0;
    const buckets = [];
    let changed = false;
    const d = before.data;
    for (let yy = 0; yy < bh; yy++) {
      const rowLabel = (by0 + yy) * this.w + bx0;
      for (let xx = 0; xx < bw; xx++) {
        if (this.labels[rowLabel + xx] !== id) continue;
        const p = (yy * bw + xx) * 4;
        if (!changed && (d[p] !== r || d[p + 1] !== g || d[p + 2] !== b)) changed = true;
        const dist = Math.hypot(xx - cx, yy - cy) | 0;
        (buckets[dist] ||= []).push(p);
      }
    }
    if (!changed) return false;

    const after = new ImageData(new Uint8ClampedArray(before.data), bw, bh);
    const target = new ImageData(new Uint8ClampedArray(before.data), bw, bh);
    for (const bucket of buckets) if (bucket) for (const p of bucket) {
      after.data[p] = r; after.data[p + 1] = g; after.data[p + 2] = b; after.data[p + 3] = 255;
    }
    this.pushHistory({ x: bx0, y: by0, before, after });

    const maxDist = buckets.length;
    if (!animate || maxDist < 8) {
      this.pctx.putImageData(after, bx0, by0);
      this.onChange();
      return true;
    }

    // Ripple the color outward from where the child tapped.
    const duration = Math.min(420, 160 + maxDist * 0.6);
    const start = performance.now();
    let reached = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const radius = Math.ceil(eased * maxDist);
      for (; reached < radius && reached < maxDist; reached++) {
        const bucket = buckets[reached];
        if (bucket) for (const p of bucket) {
          target.data[p] = r; target.data[p + 1] = g; target.data[p + 2] = b; target.data[p + 3] = 255;
        }
      }
      this.pctx.putImageData(target, bx0, by0);
      if (t < 1) this.anim.raf = requestAnimationFrame(step);
      else { this.anim = null; this.onChange(); }
    };
    this.anim = { raf: requestAnimationFrame(step), finish: () => this.pctx.putImageData(after, bx0, by0) };
    return true;
  }

  finishAnimation() {
    if (!this.anim) return;
    cancelAnimationFrame(this.anim.raf);
    this.anim.finish();
    this.anim = null;
    this.onChange();
  }

  // ---------- brush ----------

  beginStroke(x, y, { color, size, insideLines, erase }) {
    if (!this.ready) return;
    this.finishAnimation();
    const hex = erase ? '#ffffff' : color;
    let mask = null;
    if (insideLines) {
      const id = this.regionAt(x, y);
      if (!id) return;
      mask = this.regionMask(id);
    }
    this.stroke = {
      hex, size, mask,
      snapshot: this.pctx.getImageData(0, 0, this.w, this.h),
      last: { x, y },
      box: [x - size, y - size, x + size, y + size],
    };
    this.drawSegment({ x, y }, { x, y });
  }

  moveStroke(x, y) {
    const s = this.stroke;
    if (!s) return;
    const from = s.last;
    if (Math.hypot(x - from.x, y - from.y) < 0.8) return;
    this.drawSegment(from, { x, y });
    s.last = { x, y };
  }

  endStroke() {
    const s = this.stroke;
    if (!s) return;
    this.stroke = null;
    const x0 = Math.max(0, Math.floor(s.box[0])), y0 = Math.max(0, Math.floor(s.box[1]));
    const x1 = Math.min(this.w, Math.ceil(s.box[2])), y1 = Math.min(this.h, Math.ceil(s.box[3]));
    if (x1 <= x0 || y1 <= y0) return;
    const bw = x1 - x0, bh = y1 - y0;
    const before = new ImageData(bw, bh);
    for (let yy = 0; yy < bh; yy++) {
      const srcStart = ((y0 + yy) * this.w + x0) * 4;
      before.data.set(s.snapshot.data.subarray(srcStart, srcStart + bw * 4), yy * bw * 4);
    }
    this.pushHistory({ x: x0, y: y0, before, after: this.pctx.getImageData(x0, y0, bw, bh) });
    this.onChange();
  }

  drawSegment(a, b) {
    const s = this.stroke;
    const pad = s.size + 2;
    const sx = Math.floor(Math.min(a.x, b.x) - pad), sy = Math.floor(Math.min(a.y, b.y) - pad);
    const ex = Math.ceil(Math.max(a.x, b.x) + pad), ey = Math.ceil(Math.max(a.y, b.y) + pad);
    s.box = [Math.min(s.box[0], sx), Math.min(s.box[1], sy), Math.max(s.box[2], ex), Math.max(s.box[3], ey)];

    const paintLine = (ctx, ox, oy) => {
      ctx.strokeStyle = s.hex;
      ctx.fillStyle = s.hex;
      ctx.lineWidth = s.size * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (a.x === b.x && a.y === b.y) {
        ctx.arc(a.x - ox, a.y - oy, s.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(a.x - ox, a.y - oy);
        ctx.lineTo(b.x - ox, b.y - oy);
        ctx.stroke();
      }
    };

    if (!s.mask) {
      paintLine(this.pctx, 0, 0);
      return;
    }
    // Draw into a scratch canvas, clip to the region, then stamp onto the paint layer.
    const tw = ex - sx, th = ey - sy;
    const tmp = (this.scratch ||= document.createElement('canvas'));
    if (tmp.width < tw) tmp.width = tw;
    if (tmp.height < th) tmp.height = th;
    const tctx = tmp.getContext('2d');
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, tw, th);
    paintLine(tctx, sx, sy);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(s.mask.canvas, s.mask.x - sx, s.mask.y - sy);
    tctx.globalCompositeOperation = 'source-over';
    this.pctx.drawImage(tmp, 0, 0, tw, th, sx, sy, tw, th);
  }

  regionMask(id) {
    const [x0, y0, x1, y1] = this.boxes[id];
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const canvas = document.createElement('canvas');
    canvas.width = bw;
    canvas.height = bh;
    const ctx = canvas.getContext('2d');
    const data = ctx.createImageData(bw, bh);
    for (let yy = 0; yy < bh; yy++) {
      const row = (y0 + yy) * this.w + x0;
      for (let xx = 0; xx < bw; xx++) {
        if (this.labels[row + xx] === id) data.data[(yy * bw + xx) * 4 + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    return { canvas, x: x0, y: y0 };
  }

  // ---------- history ----------

  pushHistory(entry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    this.finishAnimation();
    const e = this.undoStack.pop();
    if (!e) return false;
    this.pctx.putImageData(e.before, e.x, e.y);
    this.redoStack.push(e);
    this.onChange();
    return true;
  }

  redo() {
    this.finishAnimation();
    const e = this.redoStack.pop();
    if (!e) return false;
    this.pctx.putImageData(e.after, e.x, e.y);
    this.undoStack.push(e);
    this.onChange();
    return true;
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  clear() {
    this.finishAnimation();
    const before = this.pctx.getImageData(0, 0, this.w, this.h);
    this.pctx.fillStyle = '#fff';
    this.pctx.fillRect(0, 0, this.w, this.h);
    this.pushHistory({ x: 0, y: 0, before, after: this.pctx.getImageData(0, 0, this.w, this.h) });
    this.onChange();
  }

  // ---------- export ----------

  /** The paint layer alone, used for autosaved drafts. */
  paintDataUrl() {
    return this.paint.toDataURL('image/png');
  }

  /** The finished picture: colors with line art on top. */
  exportDataUrl(maxSide = 1100) {
    const scale = Math.min(1, maxSide / Math.max(this.w, this.h));
    const out = document.createElement('canvas');
    out.width = Math.round(this.w * scale);
    out.height = Math.round(this.h * scale);
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.paint, 0, 0, out.width, out.height);
    ctx.drawImage(this.lines, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }
}
