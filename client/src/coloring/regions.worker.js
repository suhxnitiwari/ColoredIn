import { computeRegions } from './regions.js';

self.onmessage = ({ data: { rgba, w, h, gapRadius } }) => {
  const result = computeRegions(rgba, w, h, gapRadius);
  self.postMessage(result, [result.labels.buffer, result.ink.buffer]);
};
