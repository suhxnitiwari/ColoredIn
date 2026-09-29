import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_AVATAR } from './Avatar.jsx';

// The explorer lives only on this device (no child data leaves the iPad).
const KEY = 'coloredin:avatar';
const EVENT = 'coloredin:avatar-change';

export function readAvatar() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_AVATAR, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function useAvatar() {
  const [avatar, setAvatar] = useState(readAvatar);

  useEffect(() => {
    const sync = () => setAvatar(readAvatar());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const save = useCallback((next) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setAvatar(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [avatar, save];
}
