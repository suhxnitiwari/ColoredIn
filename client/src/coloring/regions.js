// Splits a line-art image into fillable regions.
//
// 1. Pixels darker than LINE_THRESHOLD are "ink".
// 2. The ink mask is morphologically closed (dilate, then erode) so small gaps
//    in the drawing don't let paint leak into neighbouring areas.
// 3. Connected non-ink areas become regions; tiny specks are discarded.
// 4. Every leftover pixel (ink, anti-aliased edges, specks) is assigned to its
//    nearest region, so fills tuck neatly under the lines with no white halos.

const LINE_THRESHOLD = 165;
const MIN_REGION_AREA = 24;

function dilate(src, w, h, r) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = Math.max(0, x - r), end = Math.min(w - 1, x + r); k <= end && !v; k++) v = src[row + k];
      tmp[row + x] = v;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let v = 0;
      for (let k = Math.max(0, y - r), end = Math.min(h - 1, y + r); k <= end && !v; k++) v = tmp[k * w + x];
      out[y * w + x] = v;
    }
  }
  return out;
}

function erode(src, w, h, r) {
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < inv.length; i++) inv[i] = src[i] ? 0 : 1;
  const d = dilate(inv, w, h, r);
  for (let i = 0; i < d.length; i++) d[i] = d[i] ? 0 : 1;
  return d;
}

/**
 * @param {Uint8ClampedArray} rgba  line-art pixels
 * @returns {{ labels: Int32Array, boxes: Array<[number,number,number,number]>, ink: Uint8Array }}
 *   labels[i] is the region id (>= 1) of pixel i; boxes[id] = [minX, minY, maxX, maxY].
 */
export function computeRegions(rgba, w, h, gapRadius = 3) {
  const n = w * h;
  const ink = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const lum = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
    ink[i] = lum < LINE_THRESHOLD ? 1 : 0;
  }
  const closed = erode(dilate(ink, w, h, gapRadius), w, h, gapRadius);

  const labels = new Int32Array(n);
  const boxes = [null];
  const stack = new Int32Array(n);
  let next = 1;

  for (let start = 0; start < n; start++) {
    if (closed[start] || labels[start]) continue;
    const id = next;
    let sp = 0;
    let area = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    stack[sp++] = start;
    labels[start] = id;
    const members = [];
    while (sp) {
      const i = stack[--sp];
      members.push(i);
      area++;
      const x = i % w;
      const y = (i - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && !closed[i - 1] && !labels[i - 1]) { labels[i - 1] = id; stack[sp++] = i - 1; }
      if (x < w - 1 && !closed[i + 1] && !labels[i + 1]) { labels[i + 1] = id; stack[sp++] = i + 1; }
      if (y > 0 && !closed[i - w] && !labels[i - w]) { labels[i - w] = id; stack[sp++] = i - w; }
      if (y < h - 1 && !closed[i + w] && !labels[i + w]) { labels[i + w] = id; stack[sp++] = i + w; }
    }
    if (area < MIN_REGION_AREA) {
      for (const i of members) labels[i] = -1; // too small: absorbed by a neighbour below
      continue;
    }
    boxes[id] = [minX, minY, maxX, maxY];
    next++;
  }
  for (let i = 0; i < n; i++) if (labels[i] < 0) labels[i] = 0;

  // Multi-source BFS: grow every region outward into unassigned pixels.
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (let i = 0; i < n; i++) if (labels[i]) queue[tail++] = i;
  while (head < tail) {
    const i = queue[head++];
    const id = labels[i];
    const x = i % w;
    const neighbours = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
    for (const j of neighbours) {
      if (j < 0 || j >= n || labels[j]) continue;
      labels[j] = id;
      const jx = j % w, jy = (j - jx) / w;
      const b = boxes[id];
      if (jx < b[0]) b[0] = jx;
      if (jx > b[2]) b[2] = jx;
      if (jy < b[1]) b[1] = jy;
      if (jy > b[3]) b[3] = jy;
      queue[tail++] = j;
    }
  }

  return { labels, boxes, ink };
}
